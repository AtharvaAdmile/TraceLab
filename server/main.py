import os
import shutil
import asyncio
import tempfile
import json
import sys
import re
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Add CORS middleware to allow cross-origin requests (including WebSocket)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Models ---
class TestFile(BaseModel):
    """Test script file with filename and content"""
    filename: str
    content: str

class RepoFile(BaseModel):
    """A file to fetch from the repository"""
    path: str  # Path in the repo (e.g., "src/utils/helper.py")

class TestRunRequest(BaseModel):
    """
    New streamlined test execution request.
    Only fetches specific files and installs specified dependencies.
    """
    repo_url: str  # GitHub repository URL
    branch: str = "main"
    test_script: TestFile  # The test case script to run
    dependencies: List[str] = []  # List of pip packages to install (e.g., ["pytest", "requests"])
    repo_files: List[RepoFile] = []  # Specific files to fetch from the repo

# --- Helper: Parse GitHub URL ---
def parse_github_url(repo_url: str) -> tuple[str, str]:
    """
    Parses a GitHub URL and returns (owner, repo).
    Supports formats:
    - https://github.com/owner/repo
    - https://github.com/owner/repo.git
    - git@github.com:owner/repo.git
    """
    # HTTPS format
    https_match = re.match(r'https://github\.com/([^/]+)/([^/\.]+)', repo_url)
    if https_match:
        return https_match.group(1), https_match.group(2)
    
    # SSH format
    ssh_match = re.match(r'git@github\.com:([^/]+)/([^\.]+)', repo_url)
    if ssh_match:
        return ssh_match.group(1), ssh_match.group(2)
    
    raise ValueError(f"Invalid GitHub URL format: {repo_url}")

# --- Helper: Fetch Single File from GitHub ---
async def fetch_file_from_github(owner: str, repo: str, branch: str, file_path: str, dest_dir: str, websocket: WebSocket) -> bool:
    """
    Fetches a single file from GitHub using the raw content URL.
    Returns True if successful, False otherwise.
    """
    raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{file_path}"
    dest_file = Path(dest_dir) / file_path
    
    # Create parent directories
    dest_file.parent.mkdir(parents=True, exist_ok=True)
    
    # Use curl to fetch the file (available on most systems)
    process = await asyncio.create_subprocess_shell(
        f'curl -sS -o "{dest_file}" "{raw_url}"',
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    
    _, stderr = await process.communicate()
    
    if process.returncode == 0 and dest_file.exists() and dest_file.stat().st_size > 0:
        await websocket.send_json({
            "type": "log", 
            "data": f"✓ Fetched: {file_path}"
        })
        return True
    else:
        error_msg = stderr.decode('utf-8', errors='replace').strip() if stderr else "File not found or empty"
        await websocket.send_json({
            "type": "warning", 
            "data": f"⚠ Failed to fetch {file_path}: {error_msg}"
        })
        return False

# --- Helper: Async Subprocess Runner ---
async def run_command(cmd: str, cwd: str, websocket: WebSocket, capture_output: bool = False) -> tuple[int, str, str]:
    """
    Runs a shell command and streams output to the websocket.
    Returns (return_code, stdout, stderr)
    """
    await websocket.send_json({"type": "log", "data": f"> {cmd}"})
    
    process = await asyncio.create_subprocess_shell(
        cmd,
        cwd=cwd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )

    stdout_lines = []
    stderr_lines = []

    async def stream_output(stream, stream_type, output_list):
        while True:
            line = await stream.readline()
            if not line:
                break
            decoded = line.decode('utf-8', errors='replace').strip()
            if decoded:
                output_list.append(decoded)
                # Send log to frontend
                await websocket.send_json({
                    "type": "output", 
                    "stream": stream_type, 
                    "data": decoded
                })

    # Read stdout and stderr concurrently
    await asyncio.gather(
        stream_output(process.stdout, "stdout", stdout_lines),
        stream_output(process.stderr, "stderr", stderr_lines)
    )

    return_code = await process.wait()
    return return_code, "\n".join(stdout_lines), "\n".join(stderr_lines)

# --- Helper: Parse pytest output to JSON ---
def parse_pytest_output(stdout: str, stderr: str) -> dict:
    """
    Parses pytest output and returns structured test results.
    """
    results = {
        "passed": 0,
        "failed": 0,
        "errors": 0,
        "skipped": 0,
        "total": 0,
        "test_details": [],
        "raw_output": stdout
    }
    
    combined = stdout + "\n" + stderr
    
    # Parse individual test results
    test_pattern = re.compile(r'(PASSED|FAILED|ERROR|SKIPPED)\s+(\S+)')
    for match in test_pattern.finditer(combined):
        status, test_name = match.groups()
        results["test_details"].append({
            "name": test_name,
            "status": status.lower()
        })
        results[status.lower()] = results.get(status.lower(), 0) + 1
    
    # Parse summary line (e.g., "1 passed, 2 failed in 0.5s")
    summary_pattern = re.compile(r'(\d+)\s+passed|(\d+)\s+failed|(\d+)\s+error|(\d+)\s+skipped')
    for match in summary_pattern.finditer(combined):
        if match.group(1):
            results["passed"] = int(match.group(1))
        if match.group(2):
            results["failed"] = int(match.group(2))
        if match.group(3):
            results["errors"] = int(match.group(3))
        if match.group(4):
            results["skipped"] = int(match.group(4))
    
    results["total"] = results["passed"] + results["failed"] + results["errors"] + results["skipped"]
    
    return results
    
# --- WebSocket Endpoint ---
@app.websocket("/ws/run-tests")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    temp_dir = None

    try:
        # 1. Wait for configuration payload
        data = await websocket.receive_text()
        payload = json.loads(data)
        request = TestRunRequest(**payload)

        # 2. Create Temporary Directory
        temp_dir = tempfile.mkdtemp(prefix="medtest_runner_")
        await websocket.send_json({
            "type": "status", 
            "step": "setup", 
            "message": f"Created isolated test environment"
        })

        # 3. Parse GitHub URL
        try:
            owner, repo = parse_github_url(request.repo_url)
            await websocket.send_json({
                "type": "log", 
                "data": f"Repository: {owner}/{repo} (branch: {request.branch})"
            })
        except ValueError as e:
            await websocket.send_json({"type": "error", "data": str(e)})
            raise

        # 4. Fetch only the required files from the repository
        if request.repo_files:
            await websocket.send_json({
                "type": "status", 
                "step": "fetching", 
                "message": f"Fetching {len(request.repo_files)} dependent file(s) from repository..."
            })
            
            fetched_count = 0
            for repo_file in request.repo_files:
                success = await fetch_file_from_github(
                    owner, repo, request.branch, 
                    repo_file.path, temp_dir, websocket
                )
                if success:
                    fetched_count += 1
            
            await websocket.send_json({
                "type": "log", 
                "data": f"Successfully fetched {fetched_count}/{len(request.repo_files)} files"
            })
        else:
            await websocket.send_json({
                "type": "log", 
                "data": "No repository files requested - running test in isolation"
            })

        # 5. Write the test script
        await websocket.send_json({
            "type": "status", 
            "step": "setup", 
            "message": "Writing test script..."
        })
        
        test_file_path = Path(temp_dir) / request.test_script.filename
        test_file_path.parent.mkdir(parents=True, exist_ok=True)
        with open(test_file_path, "w", encoding="utf-8") as f:
            f.write(request.test_script.content)
        
        await websocket.send_json({
            "type": "log", 
            "data": f"✓ Created test file: {request.test_script.filename}"
        })

        # 6. Create virtual environment and install ONLY specified dependencies
        venv_path = os.path.join(temp_dir, "venv")
        
        # Platform-specific paths
        if sys.platform == "win32":
            venv_python = os.path.join(venv_path, "Scripts", "python.exe")
            venv_pip = os.path.join(venv_path, "Scripts", "pip.exe")
        else:
            venv_python = os.path.join(venv_path, "bin", "python")
            venv_pip = os.path.join(venv_path, "bin", "pip")

        await websocket.send_json({
            "type": "status", 
            "step": "installing", 
            "message": "Creating isolated virtual environment..."
        })
        
        ret_code, _, _ = await run_command(f"{sys.executable} -m venv {venv_path}", temp_dir, websocket)
        if ret_code != 0:
            raise Exception("Failed to create virtual environment")

        # Install ONLY the specified dependencies
        if request.dependencies:
            deps_str = " ".join(request.dependencies)
            await websocket.send_json({
                "type": "status", 
                "step": "installing", 
                "message": f"Installing specified dependencies: {', '.join(request.dependencies)}"
            })
            
            ret_code, _, stderr = await run_command(f"{venv_pip} install {deps_str}", temp_dir, websocket)
            if ret_code != 0:
                await websocket.send_json({
                    "type": "warning", 
                    "data": f"Some dependencies may have failed to install"
                })
        else:
            # At minimum, install pytest to run tests
            await websocket.send_json({
                "type": "status", 
                "step": "installing", 
                "message": "Installing pytest (default test runner)..."
            })
            await run_command(f"{venv_pip} install pytest", temp_dir, websocket)

        # 7. Run the test script
        await websocket.send_json({
            "type": "status", 
            "step": "running", 
            "message": "Executing test script..."
        })
        
        # Run pytest with verbose output and capture results
        test_cmd = f"{venv_python} -m pytest {request.test_script.filename} -v --tb=short"
        ret_code, stdout, stderr = await run_command(test_cmd, temp_dir, websocket, capture_output=True)

        # 8. Parse results and send JSON response
        test_results = parse_pytest_output(stdout, stderr)
        test_results["exit_code"] = ret_code
        test_results["success"] = ret_code == 0
        
        # Determine overall status
        if ret_code == 0:
            status = "passed"
            message = f"All tests passed! ({test_results['passed']} passed)"
        elif test_results["failed"] > 0:
            status = "failed"
            message = f"Tests completed with failures ({test_results['passed']} passed, {test_results['failed']} failed)"
        else:
            status = "error"
            message = f"Test execution encountered errors"

        # 9. Send final JSON response with all results
        await websocket.send_json({
            "type": "complete",
            "status": status,
            "message": message,
            "results": test_results
        })

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        await websocket.send_json({
            "type": "complete", 
            "status": "error", 
            "message": str(e),
            "results": {
                "passed": 0,
                "failed": 0,
                "errors": 1,
                "total": 0,
                "error_message": str(e)
            }
        })
    finally:
        # 10. Cleanup
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir)
                print(f"Cleaned up {temp_dir}")
            except Exception as e:
                print(f"Failed to cleanup {temp_dir}: {e}")
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)