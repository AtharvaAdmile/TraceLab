import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ClipboardList, Play, Code, Trash2, Zap, Loader2, X, TerminalSquare } from 'lucide-react';
import { generateTestCasesForRequirement, setAIProvider } from '../services/aiService';

// Get backend URL from environment (must be prefixed with VITE_ for Vite)
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// Convert HTTP URL to WebSocket URL (http -> ws, https -> wss)
const getWebSocketUrl = (httpUrl: string): string => {
    return httpUrl.replace(/^http/, 'ws');
};

// Interface matching actual Supabase schema with executable test fields
interface DBTestCase {
    id: string;
    requirement_id: string;
    description: string;
    steps: string[];
    expected_result: string;
    compliance_tag: string;
    created_at: string;
    // New executable test fields
    test_script: string;        // Python pytest code
    dependencies: string[];      // pip packages needed
    target_files: string[];      // Repo files this test applies to
    repo_url: string;           // GitHub repository URL
}

const TestCasesPage = () => {
    const [testCases, setTestCases] = useState<DBTestCase[]>([]);
    const [requirements, setRequirements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    // Code View Modal State
    const [codeModalOpen, setCodeModalOpen] = useState(false);
    const [selectedCode, setSelectedCode] = useState<string>('');

    // Remote Runner Terminal State
    const [terminalOpen, setTerminalOpen] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const { data: tcs } = await supabase.from('test_cases').select('*');
        const { data: reqs } = await supabase.from('requirements').select('*');
        if (tcs) setTestCases(tcs);
        if (reqs) setRequirements(reqs);
        setLoading(false);
    };

    const handleGenerate = async () => {
        if (requirements.length === 0) {
            alert('No requirements found. Please analyze a repository first.');
            return;
        }

        // Get repo URL once for all test cases
        const repoUrl = prompt("Enter GitHub Repo URL for test generation:", "https://github.com/athrvadmile/medtest-demo");
        if (!repoUrl) return;

        setGenerating(true);
        // Use Gemini for test case generation
        setAIProvider('Gemini');
        try {
            const req = requirements[0];
            // Pass repoUrl to AI for context-aware test generation
            const newTcs = await generateTestCasesForRequirement(req, `Source: ${req.source || 'unknown'}`, repoUrl);

            if (newTcs.length > 0) {
                // Insert with new executable test fields
                const { error } = await supabase.from('test_cases').insert(
                    newTcs.map(tc => ({
                        description: tc.title || 'Generated Test Case',
                        steps: tc.steps || [],
                        expected_result: tc.expected_result || '',
                        compliance_tag: (tc as any).compliance_tag || req.compliance_tags?.[0] || 'General',
                        requirement_id: req.id,
                        // New executable fields
                        test_script: tc.test_script || '',
                        dependencies: tc.dependencies || ['pytest'],
                        target_files: tc.target_files || [],
                        repo_url: repoUrl
                    }))
                );
                if (error) {
                    console.error('Supabase insert error:', error);
                    alert(`Error: ${error.message}`);
                } else {
                    fetchData();
                }
            } else {
                alert('AI returned no test cases. Check console for details.');
            }
        } catch (error: any) {
            console.error('Generation error:', error);
            alert(`Error: ${error.message}`);
        }
        setGenerating(false);
    };

    const handleViewCode = (tc: DBTestCase) => {
        // Use stored test_script if available, otherwise generate placeholder
        const code = tc.test_script || `# Test Case: ${tc.description}\n# Compliance: ${tc.compliance_tag}\n# Created: ${new Date(tc.created_at).toLocaleDateString()}\n# Dependencies: ${tc.dependencies?.join(', ') || 'pytest'}\n# Target Files: ${tc.target_files?.join(', ') || 'None'}\n\nimport pytest\n\ndef test_${tc.description.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30)}():\n    \"\"\"\n    Steps:\n${tc.steps?.map((s, i) => `    ${i + 1}. ${s}`).join('\n') || '    No steps defined'}\n    \n    Expected: ${tc.expected_result}\n    \"\"\"\n    # TODO: Implement test logic\n    assert True`;
        setSelectedCode(code);
        setCodeModalOpen(true);
    };

    const handleDelete = async (tcId: string) => {
        if (!confirm('Delete this test case?')) return;
        const { error } = await supabase.from('test_cases').delete().eq('id', tcId);
        if (!error) fetchData();
    };

    // --- Remote Test Execution Logic ---
    const handleRunAllTests = async () => {
        if (testCases.length === 0) {
            alert('No test cases to run. Please generate test cases first.');
            return;
        }

        // 1. Collect all unique dependencies and target files from test cases
        const allDependencies = new Set<string>(['pytest']); // Always include pytest
        const allTargetFiles = new Set<string>();
        let repoUrl = '';

        testCases.forEach(tc => {
            // Collect dependencies
            if (tc.dependencies && Array.isArray(tc.dependencies)) {
                tc.dependencies.forEach(dep => allDependencies.add(dep));
            }
            // Collect target files
            if (tc.target_files && Array.isArray(tc.target_files)) {
                tc.target_files.forEach(file => allTargetFiles.add(file));
            }
            // Use first non-empty repo_url found
            if (!repoUrl && tc.repo_url) {
                repoUrl = tc.repo_url;
            }
        });

        // Fallback: prompt for repo URL only if none stored
        if (!repoUrl) {
            repoUrl = prompt("No repo URL found in test cases. Enter GitHub Repo URL:", "https://github.com/athrvadmile/medtest-demo") || '';
            if (!repoUrl) return;
        }

        // 2. Combine all test scripts into one file (or use individual stored scripts)
        const combinedTestScript = testCases.map(tc => {
            // Use stored test_script if available, otherwise generate from steps
            if (tc.test_script) {
                return tc.test_script;
            }
            return `
def test_${tc.description.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30)}():
    """
    Title: ${tc.description}
    Compliance: ${tc.compliance_tag}
    Expected: ${tc.expected_result}
    """
    # Auto-generated steps:
    # ${tc.steps?.join('\n    # ') || 'No steps'}
    assert True  # Placeholder
`;
        }).join('\n\n');

        const testFileContent = `import pytest\n\n${combinedTestScript}`;

        // 3. Build payload with auto-detected values
        const payload = {
            repo_url: repoUrl,
            branch: "main",
            test_script: {
                filename: "tests/test_generated_ai.py",
                content: testFileContent
            },
            dependencies: Array.from(allDependencies),
            repo_files: Array.from(allTargetFiles).map(path => ({ path }))
        };

        // 4. Connect to WebSocket
        setLogs([]);
        setTerminalOpen(true);

        const wsUrl = getWebSocketUrl(backendUrl);
        ws.current = new WebSocket(`${wsUrl}/ws/run-tests`);

        ws.current.onopen = () => {
            setLogs(prev => [...prev, "🔗 Connected to Test Runner Service..."]);
            setLogs(prev => [...prev, `🔗 Repository: ${repoUrl}`]);
            setLogs(prev => [...prev, `📦 Dependencies (auto-detected): ${Array.from(allDependencies).join(', ')}`]);
            setLogs(prev => [...prev, `📁 Target files (auto-detected): ${allTargetFiles.size > 0 ? Array.from(allTargetFiles).join(', ') : 'None (isolated test)'}`]);
            setLogs(prev => [...prev, `🧪 Running ${testCases.length} test case(s)...`]);
            ws.current?.send(JSON.stringify(payload));
        };

        ws.current.onmessage = (event) => {
            const msg = JSON.parse(event.data);

            if (msg.type === 'log' || msg.type === 'output') {
                setLogs(prev => [...prev, msg.data]);
                const terminalEnd = document.getElementById('terminal-end');
                if (terminalEnd) terminalEnd.scrollIntoView({ behavior: 'smooth' });
            } else if (msg.type === 'status') {
                setLogs(prev => [...prev, `[STATUS] ${msg.message}`]);
            } else if (msg.type === 'warning') {
                setLogs(prev => [...prev, `[WARN] ${msg.data}`]);
            } else if (msg.type === 'error') {
                setLogs(prev => [...prev, `[ERROR] ${msg.data}`]);
            } else if (msg.type === 'complete') {
                // Display structured results
                setLogs(prev => [...prev, `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`]);
                setLogs(prev => [...prev, `📊 TEST RESULTS`]);
                setLogs(prev => [...prev, `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`]);
                setLogs(prev => [...prev, `Status: ${msg.status.toUpperCase()}`]);
                setLogs(prev => [...prev, `Message: ${msg.message}`]);

                if (msg.results) {
                    setLogs(prev => [...prev, `✅ Passed: ${msg.results.passed}`]);
                    setLogs(prev => [...prev, `❌ Failed: ${msg.results.failed}`]);
                    setLogs(prev => [...prev, `⚠️  Errors: ${msg.results.errors}`]);
                    setLogs(prev => [...prev, `⏭️  Skipped: ${msg.results.skipped}`]);
                    setLogs(prev => [...prev, `📈 Total: ${msg.results.total}`]);
                }

                setLogs(prev => [...prev, `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`]);
                ws.current?.close();
            }
        };

        ws.current.onclose = () => {
            setLogs(prev => [...prev, "🔌 Connection closed."]);
        };

        ws.current.onerror = (err) => {
            console.error('WebSocket error:', err);
            setLogs(prev => [...prev, "[ERROR] WebSocket connection failed. Is the backend running?"]);
        };
    };

    // --- Execute Single Test Case ---
    const handleExecuteSingleTest = async (tc: DBTestCase) => {
        // 1. Use stored repo URL or fallback to prompt
        let repoUrl = tc.repo_url;
        if (!repoUrl) {
            repoUrl = prompt("No repo URL stored. Enter GitHub Repo URL:", "https://github.com/athrvadmile/medtest-demo") || '';
            if (!repoUrl) return;
        }

        // 2. Use stored dependencies or default to pytest
        const dependencies = tc.dependencies && tc.dependencies.length > 0
            ? tc.dependencies
            : ['pytest'];

        // 3. Use stored target files
        const repoFiles = tc.target_files && tc.target_files.length > 0
            ? tc.target_files.map(path => ({ path }))
            : [];

        // 4. Use stored test script or generate placeholder
        const testFileContent = tc.test_script || `
import pytest

def test_${tc.description.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30)}():
    """
    Title: ${tc.description}
    Compliance: ${tc.compliance_tag}
    Expected: ${tc.expected_result}
    """
    # Auto-generated steps:
    # ${tc.steps?.join('\n    # ') || 'No steps'}
    assert True  # Placeholder for actual assertion logic
`;

        // 5. Build payload with stored/auto-detected values
        const payload = {
            repo_url: repoUrl,
            branch: "main",
            test_script: {
                filename: `tests/test_single_${tc.id.substring(0, 8)}.py`,
                content: testFileContent
            },
            dependencies: dependencies,
            repo_files: repoFiles
        };

        // 6. Connect to WebSocket
        setLogs([]);
        setTerminalOpen(true);

        const wsUrl = getWebSocketUrl(backendUrl);
        ws.current = new WebSocket(`${wsUrl}/ws/run-tests`);

        ws.current.onopen = () => {
            setLogs(prev => [...prev, `🔗 Connected to Test Runner Service...`]);
            setLogs(prev => [...prev, `🧪 Executing: ${tc.description}`]);
            setLogs(prev => [...prev, `🔗 Repository: ${repoUrl}`]);
            setLogs(prev => [...prev, `📦 Dependencies (stored): ${dependencies.join(', ')}`]);
            setLogs(prev => [...prev, `📁 Target files (stored): ${repoFiles.length > 0 ? repoFiles.map(f => f.path).join(', ') : 'None (isolated test)'}`]);
            ws.current?.send(JSON.stringify(payload));
        };

        ws.current.onmessage = (event) => {
            const msg = JSON.parse(event.data);

            if (msg.type === 'log' || msg.type === 'output') {
                setLogs(prev => [...prev, msg.data]);
                const terminalEnd = document.getElementById('terminal-end');
                if (terminalEnd) terminalEnd.scrollIntoView({ behavior: 'smooth' });
            } else if (msg.type === 'status') {
                setLogs(prev => [...prev, `[STATUS] ${msg.message}`]);
            } else if (msg.type === 'warning') {
                setLogs(prev => [...prev, `[WARN] ${msg.data}`]);
            } else if (msg.type === 'error') {
                setLogs(prev => [...prev, `[ERROR] ${msg.data}`]);
            } else if (msg.type === 'complete') {
                // Display structured results
                setLogs(prev => [...prev, `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`]);
                setLogs(prev => [...prev, `📊 TEST RESULT: ${tc.description}`]);
                setLogs(prev => [...prev, `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`]);
                setLogs(prev => [...prev, `Status: ${msg.status.toUpperCase()}`]);
                setLogs(prev => [...prev, `Message: ${msg.message}`]);

                if (msg.results) {
                    setLogs(prev => [...prev, `✅ Passed: ${msg.results.passed}`]);
                    setLogs(prev => [...prev, `❌ Failed: ${msg.results.failed}`]);
                    setLogs(prev => [...prev, `⚠️  Errors: ${msg.results.errors}`]);
                }

                setLogs(prev => [...prev, `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`]);
                ws.current?.close();
            }
        };

        ws.current.onclose = () => {
            setLogs(prev => [...prev, "🔌 Connection closed."]);
        };

        ws.current.onerror = (err) => {
            console.error('WebSocket error:', err);
            setLogs(prev => [...prev, "[ERROR] WebSocket connection failed. Is the backend running?"]);
        };
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading test suite...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Code View Modal */}
            {codeModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setCodeModalOpen(false)}>
                    <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <div className="flex items-center gap-3">
                                <Code className="w-5 h-5 text-primary-400" />
                                <span className="text-white font-bold">Test Code (Python)</span>
                            </div>
                            <button onClick={() => setCodeModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4">
                            <pre className="bg-slate-800 p-4 rounded-xl text-sm text-emerald-400 font-mono overflow-auto max-h-96 whitespace-pre-wrap">
                                {selectedCode}
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            {/* Remote Execution Terminal Modal */}
            <TestRunnerTerminal logs={logs} isOpen={terminalOpen} onClose={() => setTerminalOpen(false)} />

            <div className="flex justify-between items-end">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AI Test Suite</h1>
                    <p className="text-slate-500">Executable test cases generated for your healthcare project ({testCases.length} tests).</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleGenerate}
                        disabled={generating || requirements.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-all disabled:bg-primary-300"
                    >
                        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        Generate More Tests
                    </button>
                    <button
                        onClick={handleRunAllTests}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
                    >
                        <Play className="w-4 h-4" /> Run All Tests
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {testCases.map((tc) => (
                    <div key={tc.id} className="glass-card p-0 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-xl transition-all overflow-hidden group">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-50 text-primary-600 rounded-xl">
                                        <ClipboardList className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 leading-tight">{tc.description}</h3>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 block">{tc.compliance_tag}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-tighter mb-2">Test Steps</p>
                                    <div className="space-y-1.5">
                                        {tc.steps?.map((step: string, sIdx: number) => (
                                            <div key={sIdx} className="flex gap-2 text-sm text-slate-600">
                                                <span className="text-primary-500 font-bold">{sIdx + 1}.</span>
                                                {step}
                                            </div>
                                        ))}
                                        {(!tc.steps || tc.steps.length === 0) && (
                                            <p className="text-sm text-slate-400 italic">No steps defined</p>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Expected Result</p>
                                    <p className="text-sm text-emerald-900 font-medium">{tc.expected_result || 'Not specified'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleViewCode(tc)}
                                    className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-primary-600 transition-all shadow-sm"
                                    title="View Code"
                                >
                                    <Code className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(tc.id)}
                                    className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-rose-600 transition-all shadow-sm"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <button
                                onClick={() => handleExecuteSingleTest(tc)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-primary-500 hover:text-primary-600 transition-all shadow-sm"
                            >
                                <Play className="w-3.5 h-3.5" /> Execute Test
                            </button>
                        </div>
                    </div>
                ))}

                {testCases.length === 0 && (
                    <div className="xl:col-span-2 p-20 text-center glass-card rounded-3xl border-2 border-dashed border-slate-200">
                        <Zap className="w-12 h-12 text-primary-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-900">No AI Test Cases Generated</h3>
                        <p className="text-slate-500 mt-2">Generate requirements first to create prioritized, risk-based test cases.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Sub-component for terminal output
const TestRunnerTerminal = ({ logs, isOpen, onClose }: { logs: string[], isOpen: boolean, onClose: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-950 w-full max-w-4xl h-[80vh] rounded-2xl border border-slate-800 flex flex-col shadow-2xl overflow-hidden">
                <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                    <span className="font-mono text-emerald-400 font-bold flex items-center gap-2">
                        <TerminalSquare className="w-4 h-4" />
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Remote Test Execution
                    </span>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 p-6 overflow-auto font-mono text-xs space-y-1.5">
                    {logs.map((log, i) => (
                        <div key={i} className="break-words">
                            <span className="text-slate-600 select-none mr-2">[{new Date().toLocaleTimeString()}]</span>
                            <span className={
                                log.startsWith('> ') ? 'text-yellow-400 font-bold' :
                                    log.startsWith('[ERROR]') ? 'text-rose-500 font-bold' :
                                        log.startsWith('[STATUS]') ? 'text-blue-400 font-bold' :
                                            log.startsWith('[DONE]') ? 'text-emerald-400 font-bold' :
                                                'text-slate-300'
                            }>
                                {log}
                            </span>
                        </div>
                    ))}
                    <div id="terminal-end" />
                </div>
            </div>
        </div>
    );
};

export default TestCasesPage;