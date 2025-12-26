import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ClipboardList, Play, Code, Trash2, Zap, Loader2, X } from 'lucide-react';
import { generateTestCasesForRequirement } from '../services/aiService';

// Interface matching actual Supabase schema
interface DBTestCase {
    id: string;
    requirement_id: string;
    description: string;
    steps: string[];
    expected_result: string;
    compliance_tag: string;
    created_at: string;
}

const TestCasesPage = () => {
    const [testCases, setTestCases] = useState<DBTestCase[]>([]);
    const [requirements, setRequirements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [codeModalOpen, setCodeModalOpen] = useState(false);
    const [selectedCode, setSelectedCode] = useState<string>('');

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
        setGenerating(true);
        try {
            const req = requirements[0];
            const newTcs = await generateTestCasesForRequirement(req, `Source: ${req.source || 'unknown'}`);

            if (newTcs.length > 0) {
                // Insert matching actual Supabase schema
                const { error } = await supabase.from('test_cases').insert(
                    newTcs.map(tc => ({
                        description: tc.title || 'Generated Test Case',
                        steps: tc.steps || [],
                        expected_result: tc.expected_result || '',
                        compliance_tag: (tc as any).compliance_tag || req.compliance_tags?.[0] || 'General',
                        requirement_id: req.id
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
        const code = `# Test Case: ${tc.description}\n# Compliance: ${tc.compliance_tag}\n# Created: ${new Date(tc.created_at).toLocaleDateString()}\n\ndef test_${tc.description.toLowerCase().replace(/\s+/g, '_').substring(0, 30)}():\n    \"\"\"\n    Steps:\n${tc.steps?.map((s, i) => `    ${i + 1}. ${s}`).join('\n') || '    No steps defined'}\n    \n    Expected: ${tc.expected_result}\n    \"\"\"\n    # TODO: Implement test logic\n    pass`;
        setSelectedCode(code);
        setCodeModalOpen(true);
    };

    const handleDelete = async (tcId: string) => {
        if (!confirm('Delete this test case?')) return;
        const { error } = await supabase.from('test_cases').delete().eq('id', tcId);
        if (!error) fetchData();
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading test suite...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Code Modal */}
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
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all">
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
                            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-primary-500 hover:text-primary-600 transition-all shadow-sm">
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

export default TestCasesPage;
