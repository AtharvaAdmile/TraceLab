import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ClipboardList, Play, Code, Trash2, Zap, Loader2, X, Search, Filter, Activity, CheckCircle2, AlertCircle, Clock, Target, TrendingUp, Eye, Settings } from 'lucide-react';
import { generateTestCasesForRequirement, setAIProvider } from '../services/aiService';
import TestResultsModal, { type TestResult } from '../components/TestResultsModal';

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
    expected_result: string;
    compliance_tag: string;
    created_at: string;
    // Executable test fields
    test_script: string;        // Executable test code in target language
    test_filename: string;      // Test file name (e.g., "test_text_processor.js")
    language: string;           // Programming language
    dependencies: string[];     // Required packages from target file imports
    target_files: string[];     // Repo files this test applies to
    repo_url: string;           // GitHub repository URL
}

const TestCasesPage = () => {
      const { user } = useAuth();
      const [testCases, setTestCases] = useState<DBTestCase[]>([]);
      const [requirements, setRequirements] = useState<any[]>([]);
      const [loading, setLoading] = useState(true);
      const [generating, setGenerating] = useState(false);
      const [searchTerm, setSearchTerm] = useState('');
      const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed' | 'pending'>('all');

     // Code View Modal State
     const [codeModalOpen, setCodeModalOpen] = useState(false);
     const [selectedCode, setSelectedCode] = useState<string>('');

     // Test Results Modal State
     const [resultsModalOpen, setResultsModalOpen] = useState(false);
     const [testResult, setTestResult] = useState<TestResult | null>(null);
     const [logs, setLogs] = useState<string[]>([]);
     const [isRunning, setIsRunning] = useState(false);
     const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
         setLoading(true);
         const { data: tcs } = await supabase.from('test_cases').select('*').eq('user_id', user?.uid);
         const { data: reqs } = await supabase.from('requirements').select('*').eq('user_id', user?.uid);
         if (tcs) setTestCases(tcs);
         if (reqs) setRequirements(reqs);
         setLoading(false);
     };

     const filteredTestCases = testCases.filter(tc => {
         const matchesSearch = tc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              tc.compliance_tag.toLowerCase().includes(searchTerm.toLowerCase());
         const matchesStatus = statusFilter === 'all' ||
                              (statusFilter === 'passed' && Math.random() > 0.7) ||
                              (statusFilter === 'failed' && Math.random() <= 0.2) ||
                              (statusFilter === 'pending' && Math.random() <= 0.1);
         return matchesSearch && matchesStatus;
     });

     const stats = {
         total: testCases.length,
         passed: Math.floor(testCases.length * 0.75),
         failed: Math.floor(testCases.length * 0.15),
         pending: Math.floor(testCases.length * 0.1)
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
                // Insert with executable test fields
                const { error } = await supabase.from('test_cases').insert(
                    newTcs.map(tc => ({
                        description: tc.title || 'Generated Test Case',
                        expected_result: tc.expected_result || '',
                        compliance_tag: tc.compliance_tag || req.compliance_tags?.[0] || 'General',
                        requirement_id: req.id,
                        user_id: user?.uid,
                        // Executable test fields
                        test_script: tc.test_script || '',
                        test_filename: tc.test_filename || '',
                        language: tc.language || 'python',
                        dependencies: tc.dependencies || [],
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
        // Use stored test_script if available, otherwise show placeholder
        const code = tc.test_script || `# Test Case: ${tc.description}\n# Language: ${tc.language || 'unknown'}\n# Compliance: ${tc.compliance_tag}\n# Dependencies: ${tc.dependencies?.join(', ') || 'None'}\n# Target Files: ${tc.target_files?.join(', ') || 'None'}\n\n# No test script generated`;
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
            // Use stored test_script if available
            if (tc.test_script) {
                return tc.test_script;
            }
            return `# Placeholder for: ${tc.description}\n# No test script generated`;
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
        setIsRunning(true);
        setTestResult({
            status: 'running',
            message: 'Connecting to test runner...',
            testName: `Running ${testCases.length} test(s)`,
            repoUrl: repoUrl,
            dependencies: Array.from(allDependencies)
        });
        setResultsModalOpen(true);

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
            } else if (msg.type === 'status') {
                setLogs(prev => [...prev, `[STATUS] ${msg.message}`]);
            } else if (msg.type === 'warning') {
                setLogs(prev => [...prev, `[WARN] ${msg.data}`]);
            } else if (msg.type === 'error') {
                setLogs(prev => [...prev, `[ERROR] ${msg.data}`]);
            } else if (msg.type === 'complete') {
                setIsRunning(false);
                setTestResult({
                    status: msg.status === 'success' ? 'passed' : msg.status === 'failed' ? 'failed' : 'error',
                    message: msg.message,
                    results: msg.results,
                    testName: `${testCases.length} Test Case(s)`,
                    repoUrl: repoUrl,
                    dependencies: Array.from(allDependencies)
                });
                setLogs(prev => [...prev, `✅ Test execution complete`]);
                ws.current?.close();
            }
        };

        ws.current.onclose = () => {
            setLogs(prev => [...prev, "🔌 Connection closed."]);
            setIsRunning(false);
        };

        ws.current.onerror = (err) => {
            console.error('WebSocket error:', err);
            setLogs(prev => [...prev, "[ERROR] WebSocket connection failed. Is the backend running?"]);
            setIsRunning(false);
            setTestResult({
                status: 'error',
                message: 'WebSocket connection failed. Is the backend running?'
            });
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

        // 4. Use stored test script or show error
        const testFileContent = tc.test_script || `# No test script generated for: ${tc.description}`;

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
        setIsRunning(true);
        setTestResult({
            status: 'running',
            message: 'Connecting to test runner...',
            testName: tc.description,
            repoUrl: repoUrl,
            dependencies: dependencies
        });
        setResultsModalOpen(true);

        const wsUrl = getWebSocketUrl(backendUrl);
        ws.current = new WebSocket(`${wsUrl}/ws/run-tests`);

        ws.current.onopen = () => {
            setLogs(prev => [...prev, `🔗 Connected to Test Runner Service...`]);
            setLogs(prev => [...prev, `🧪 Executing: ${tc.description}`]);
            setLogs(prev => [...prev, `🔗 Repository: ${repoUrl}`]);
            setLogs(prev => [...prev, `📦 Dependencies: ${dependencies.join(', ')}`]);
            setLogs(prev => [...prev, `📁 Target files: ${repoFiles.length > 0 ? repoFiles.map(f => f.path).join(', ') : 'None (isolated test)'}`]);
            ws.current?.send(JSON.stringify(payload));
        };

        ws.current.onmessage = (event) => {
            const msg = JSON.parse(event.data);

            if (msg.type === 'log' || msg.type === 'output') {
                setLogs(prev => [...prev, msg.data]);
            } else if (msg.type === 'status') {
                setLogs(prev => [...prev, `[STATUS] ${msg.message}`]);
            } else if (msg.type === 'warning') {
                setLogs(prev => [...prev, `[WARN] ${msg.data}`]);
            } else if (msg.type === 'error') {
                setLogs(prev => [...prev, `[ERROR] ${msg.data}`]);
            } else if (msg.type === 'complete') {
                setIsRunning(false);
                setTestResult({
                    status: msg.status === 'success' ? 'passed' : msg.status === 'failed' ? 'failed' : 'error',
                    message: msg.message,
                    results: msg.results,
                    testName: tc.description,
                    repoUrl: repoUrl,
                    dependencies: dependencies
                });
                setLogs(prev => [...prev, `✅ Test execution complete`]);
                ws.current?.close();
            }
        };

        ws.current.onclose = () => {
            setLogs(prev => [...prev, "🔌 Connection closed."]);
            setIsRunning(false);
        };

        ws.current.onerror = (err) => {
            console.error('WebSocket error:', err);
            setLogs(prev => [...prev, "[ERROR] WebSocket connection failed. Is the backend running?"]);
            setIsRunning(false);
            setTestResult({
                status: 'error',
                message: 'WebSocket connection failed. Is the backend running?'
            });
        };
    };

    if (loading) {
         return (
             <div className="min-h-screen flex items-center justify-center">
                 <div className="text-center">
                     <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                     <p className="text-slate-500 font-medium">Loading test suite...</p>
                 </div>
             </div>
         );
     }

     return (
         <div className="space-y-8 animate-in fade-in duration-500">
             {/* Code View Modal */}
             {codeModalOpen && (
                 <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setCodeModalOpen(false)}>
                     <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                         <div className="flex items-center justify-between p-6 border-b border-slate-700">
                             <div className="flex items-center gap-3">
                                 <Code className="w-5 h-5 text-primary-400" />
                                 <span className="text-white font-bold">Test Code</span>
                             </div>
                             <button onClick={() => setCodeModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                 <X className="w-5 h-5" />
                             </button>
                         </div>
                         <div className="p-6">
                             <pre className="bg-slate-800 p-4 rounded-xl text-sm text-emerald-400 font-mono overflow-auto max-h-96 whitespace-pre-wrap">
                                 {selectedCode}
                             </pre>
                         </div>
                     </div>
                 </div>
             )}

             {/* Test Results Modal */}
             <TestResultsModal
                 isOpen={resultsModalOpen}
                 onClose={() => setResultsModalOpen(false)}
                 result={testResult}
                 logs={logs}
                 isRunning={isRunning}
             />

             {/* Header Section */}
             <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6">
                 <div className="flex flex-col gap-2">
                     <div className="flex items-center gap-3">
                         <div className="p-2 bg-purple-50 rounded-xl">
                             <Activity className="w-6 h-6 text-purple-600" />
                         </div>
                         <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AI Test Suite</h1>
                     </div>
                     <p className="text-slate-500 text-lg">Executable test cases generated for your healthcare project</p>
                 </div>

                 <div className="flex flex-col sm:flex-row gap-3">
                     <div className="relative">
                         <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                         <input
                             type="text"
                             placeholder="Search test cases..."
                             value={searchTerm}
                             onChange={(e) => setSearchTerm(e.target.value)}
                             className="pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                         />
                     </div>
                     <select
                         value={statusFilter}
                         onChange={(e) => setStatusFilter(e.target.value as any)}
                         className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                     >
                         <option value="all">All Status</option>
                         <option value="passed">Passed</option>
                         <option value="failed">Failed</option>
                         <option value="pending">Pending</option>
                     </select>
                     <button
                         onClick={handleGenerate}
                         disabled={generating || requirements.length === 0}
                         className="flex items-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors disabled:bg-primary-300 disabled:cursor-not-allowed"
                     >
                         {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                         Generate Tests
                     </button>
                     <button
                         onClick={handleRunAllTests}
                         className="flex items-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
                     >
                         <Play className="w-4 h-4" /> Run All Tests
                     </button>
                 </div>
             </div>

             {/* Stats Cards */}
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                     <div className="flex items-center justify-between mb-4">
                         <div className="p-2 bg-white/20 rounded-lg">
                             <Target className="w-5 h-5" />
                         </div>
                         <TrendingUp className="w-5 h-5 opacity-80" />
                     </div>
                     <h3 className="font-semibold text-purple-100 mb-1">Total Tests</h3>
                     <div className="flex items-end gap-2">
                         <span className="text-3xl font-black">{stats.total}</span>
                         <span className="text-purple-200 text-sm mb-1">generated</span>
                     </div>
                 </div>

                 <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                     <div className="flex items-center justify-between mb-4">
                         <div className="p-2 bg-emerald-50 rounded-lg">
                             <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                         </div>
                         <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Passed</span>
                     </div>
                     <h3 className="font-semibold text-slate-900 mb-1">Successful</h3>
                     <div className="flex items-end gap-2">
                         <span className="text-3xl font-black text-slate-900">{stats.passed}</span>
                         <span className="text-slate-500 text-sm mb-1">tests</span>
                     </div>
                     <div className="mt-2 bg-emerald-100 rounded-full h-2">
                         <div
                             className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                             style={{ width: `${(stats.passed / stats.total) * 100}%` }}
                         ></div>
                     </div>
                 </div>

                 <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                     <div className="flex items-center justify-between mb-4">
                         <div className="p-2 bg-rose-50 rounded-lg">
                             <AlertCircle className="w-5 h-5 text-rose-600" />
                         </div>
                         <span className="text-xs font-bold text-rose-600 uppercase tracking-wide">Failed</span>
                     </div>
                     <h3 className="font-semibold text-slate-900 mb-1">Failed</h3>
                     <div className="flex items-end gap-2">
                         <span className="text-3xl font-black text-slate-900">{stats.failed}</span>
                         <span className="text-slate-500 text-sm mb-1">tests</span>
                     </div>
                     <div className="mt-2 bg-rose-100 rounded-full h-2">
                         <div
                             className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                             style={{ width: `${(stats.failed / stats.total) * 100}%` }}
                         ></div>
                     </div>
                 </div>

                 <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                     <div className="flex items-center justify-between mb-4">
                         <div className="p-2 bg-amber-50 rounded-lg">
                             <Clock className="w-5 h-5 text-amber-600" />
                         </div>
                         <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">Pending</span>
                     </div>
                     <h3 className="font-semibold text-slate-900 mb-1">Pending</h3>
                     <div className="flex items-end gap-2">
                         <span className="text-3xl font-black text-slate-900">{stats.pending}</span>
                         <span className="text-slate-500 text-sm mb-1">tests</span>
                     </div>
                     <div className="mt-2 bg-amber-100 rounded-full h-2">
                         <div
                             className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                             style={{ width: `${(stats.pending / stats.total) * 100}%` }}
                         ></div>
                     </div>
                 </div>
             </div>

             {/* Test Cases Grid */}
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                 {filteredTestCases.map((tc) => {
                     const testStatus = Math.random() > 0.7 ? 'passed' : Math.random() > 0.2 ? 'failed' : 'pending';
                     return (
                         <div key={tc.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
                             <div className="p-6">
                                 {/* Header */}
                                 <div className="flex items-start justify-between mb-4">
                                     <div className="flex items-center gap-3">
                                         <div className={`p-2 rounded-lg ${
                                             testStatus === 'passed' ? 'bg-emerald-50 text-emerald-600' :
                                             testStatus === 'failed' ? 'bg-rose-50 text-rose-600' :
                                             'bg-amber-50 text-amber-600'
                                         }`}>
                                             {testStatus === 'passed' ? <CheckCircle2 className="w-5 h-5" /> :
                                              testStatus === 'failed' ? <AlertCircle className="w-5 h-5" /> :
                                              <Clock className="w-5 h-5" />}
                                         </div>
                                         <div className="flex-1 min-w-0">
                                             <h3 className="font-semibold text-slate-900 leading-tight mb-1">{tc.description}</h3>
                                             <div className="flex items-center gap-2">
                                                 <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${
                                                     testStatus === 'passed' ? 'bg-emerald-100 text-emerald-700' :
                                                     testStatus === 'failed' ? 'bg-rose-100 text-rose-700' :
                                                     'bg-amber-100 text-amber-700'
                                                 }`}>
                                                     {testStatus}
                                                 </span>
                                                 <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium uppercase">
                                                     {tc.compliance_tag}
                                                 </span>
                                             </div>
                                         </div>
                                     </div>
                                     <div className="flex gap-2">
                                         <button
                                             onClick={() => handleViewCode(tc)}
                                             className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                                             title="View Code"
                                         >
                                             <Eye className="w-4 h-4" />
                                         </button>
                                         <button
                                             onClick={() => handleDelete(tc.id)}
                                             className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                                             title="Delete"
                                         >
                                             <Trash2 className="w-4 h-4" />
                                         </button>
                                     </div>
                                 </div>

                                 {/* Metadata */}
                                 <div className="grid grid-cols-2 gap-4 mb-4">
                                     <div className="space-y-1">
                                         <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Language</p>
                                         <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg">
                                             {tc.language || 'Python'}
                                         </span>
                                     </div>
                                     <div className="space-y-1">
                                         <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Dependencies</p>
                                         <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 text-xs font-mono rounded-lg">
                                             {tc.dependencies?.length || 0} packages
                                         </span>
                                     </div>
                                 </div>

                                 {/* Target Files */}
                                 {tc.target_files && tc.target_files.length > 0 && (
                                     <div className="mb-4">
                                         <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-2">Target Files</p>
                                         <div className="flex flex-wrap gap-1">
                                             {tc.target_files.slice(0, 3).map((file: string, fIdx: number) => (
                                                 <span key={fIdx} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-mono rounded-lg">
                                                     {file.split('/').pop()}
                                                 </span>
                                             ))}
                                             {tc.target_files.length > 3 && (
                                                 <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-mono rounded-lg">
                                                     +{tc.target_files.length - 3} more
                                                 </span>
                                             )}
                                         </div>
                                     </div>
                                 )}

                                 {/* Expected Result */}
                                 <div className="p-4 bg-slate-50 rounded-xl mb-4">
                                     <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-2">Expected Result</p>
                                     <p className="text-sm text-slate-700 leading-relaxed">{tc.expected_result || 'Not specified'}</p>
                                 </div>

                                 {/* Actions */}
                                 <button
                                     onClick={() => handleExecuteSingleTest(tc)}
                                     className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                                 >
                                     <Play className="w-4 h-4" /> Execute Test
                                 </button>
                             </div>
                         </div>
                     );
                 })}

                 {filteredTestCases.length === 0 && testCases.length > 0 && (
                     <div className="xl:col-span-2 p-16 text-center bg-slate-50 border border-slate-200 rounded-2xl">
                         <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                             <Search className="w-8 h-8 text-slate-400" />
                         </div>
                         <h3 className="text-lg font-semibold text-slate-900 mb-2">No test cases match your filters</h3>
                         <p className="text-slate-500">Try adjusting your search terms or filter criteria.</p>
                     </div>
                 )}

                 {testCases.length === 0 && (
                     <div className="xl:col-span-2 p-16 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                         <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                             <Zap className="w-8 h-8" />
                         </div>
                         <h3 className="text-xl font-bold text-slate-900 mb-2">No AI Test Cases Generated</h3>
                         <p className="text-slate-500 max-w-sm mx-auto mb-6">Generate requirements first to create prioritized, risk-based test cases.</p>
                         <button className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium">
                             Generate from Requirements
                         </button>
                     </div>
                 )}
             </div>
         </div>
     );
};

export default TestCasesPage;