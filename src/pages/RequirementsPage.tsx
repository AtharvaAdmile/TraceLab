import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ExtractedRequirement } from '../services/aiService';
import { generateTestCasesForRequirement, setAIProvider } from '../services/aiService';
import { ClipboardList, ExternalLink, Filter, AlertTriangle, FileText, Zap, X, Code, Loader2 } from 'lucide-react';

const RequirementsPage = () => {
    const [requirements, setRequirements] = useState<ExtractedRequirement[]>([]);
    const [loading, setLoading] = useState(true);
    const [generatingFor, setGeneratingFor] = useState<string | null>(null);
    const [codeModalOpen, setCodeModalOpen] = useState(false);
    const [codeModalContent, setCodeModalContent] = useState<{ source: string; content: string } | null>(null);

    useEffect(() => {
        fetchRequirements();
    }, []);

    const fetchRequirements = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('requirements')
            .select('*')
            .order('priority', { ascending: false });

        if (!error && data) {
            setRequirements(data);
        }
        setLoading(false);
    };

    const handleGenerateTestCases = async (req: ExtractedRequirement) => {
        setGeneratingFor(req.req_id);
        // Use Gemini for test case generation
        setAIProvider('Gemini');
        try {
            const newTestCases = await generateTestCasesForRequirement(req, `Source: ${req.source}`);

            if (newTestCases.length > 0) {
                // Insert matching actual Supabase schema: description, steps, expected_result, compliance_tag
                const { error } = await supabase.from('test_cases').insert(
                    newTestCases.map(tc => ({
                        description: tc.title || 'Generated Test Case',
                        steps: tc.steps || [],
                        expected_result: tc.expected_result || '',
                        compliance_tag: (tc as any).compliance_tag || req.compliance_tags?.[0] || 'General',
                        requirement_id: (req as any).id,
                        // Save executable fields
                        test_script: tc.test_script || '',
                        dependencies: tc.dependencies || ['pytest'],
                        target_files: tc.target_files || []
                    }))
                );
                if (error) {
                    console.error('Error inserting test cases:', error);
                    alert(`Error: ${error.message}`);
                } else {
                    alert(`Generated ${newTestCases.length} test cases for ${req.req_id}!`);
                }
            } else {
                alert('AI returned no test cases. Check console for details.');
            }
        } catch (error: any) {
            console.error('Error generating test cases:', error);
            alert(`Error: ${error.message}`);
        }
        setGeneratingFor(null);
    };

    const handleViewCode = (req: ExtractedRequirement) => {
        setCodeModalContent({
            source: req.source,
            content: `// Source: ${req.source}\n// Requirement: ${req.content}\n// Risk Level: ${req.risk_level}\n// Compliance: ${req.compliance_tags?.join(', ') || 'None'}\n// Rationale: ${req.rationale}`
        });
        setCodeModalOpen(true);
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading requirements...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Code Modal */}
            {codeModalOpen && codeModalContent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setCodeModalOpen(false)}>
                    <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <div className="flex items-center gap-3">
                                <Code className="w-5 h-5 text-primary-400" />
                                <span className="text-white font-bold">Source Context</span>
                            </div>
                            <button onClick={() => setCodeModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4">
                            <p className="text-xs text-slate-400 mb-2 font-mono">{codeModalContent.source}</p>
                            <pre className="bg-slate-800 p-4 rounded-xl text-sm text-emerald-400 font-mono overflow-auto max-h-96 whitespace-pre-wrap">
                                {codeModalContent.content}
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-end">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Extracted Requirements</h1>
                    <p className="text-slate-500">Identified from codebase, docs, and comments ({requirements.length} found).</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                        <Filter className="w-4 h-4" /> Filter
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
                        <Zap className="w-4 h-4" /> Rescan Repository
                    </button>
                </div>
            </div>

            <div className="grid gap-4">
                {requirements.map((req, idx) => (
                    <div key={idx} className="glass-card p-6 rounded-2xl border border-slate-100 bg-white hover:border-primary-200 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getPriorityColor(req.priority)}`}>
                                    {req.priority}
                                </span>
                                <span className="text-sm font-bold text-slate-400">{req.req_id}</span>
                            </div>
                            <div className="flex gap-2 flex-wrap justify-end">
                                {req.compliance_tags?.map(tag => (
                                    <span key={tag} className="px-2 py-1 bg-primary-50 text-primary-700 rounded-lg text-[10px] font-bold border border-primary-100 uppercase">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 mb-2">{req.content}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100">
                            <div className="space-y-2">
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Source Context</p>
                                <div className="flex items-center gap-2 text-sm text-slate-600 font-mono">
                                    <ExternalLink className="w-4 h-4 text-primary-500" />
                                    {req.source}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Risk Level</p>
                                <div className={`flex items-center gap-2 text-sm font-bold ${getRiskColor(req.risk_level)}`}>
                                    <AlertTriangle className="w-4 h-4" />
                                    {req.risk_level} Risk
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                            <p className="text-xs text-slate-400 uppercase font-bold mb-2">AI Rationale</p>
                            <p className="text-sm text-slate-600 italic">"{req.rationale}"</p>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => handleGenerateTestCases(req)}
                                disabled={generatingFor === req.req_id}
                                className="flex-1 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:bg-slate-400"
                            >
                                {generatingFor === req.req_id ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <ClipboardList className="w-4 h-4" />
                                        Generate Test Cases
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => handleViewCode(req)}
                                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors flex items-center gap-2"
                            >
                                <Code className="w-4 h-4" />
                                View Code
                            </button>
                        </div>
                    </div>
                ))}

                {requirements.length === 0 && (
                    <div className="p-20 text-center glass-card rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <FileText className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">No Requirements Extracted</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mt-2">Connect a GitHub repository to begin AI analysis.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const getPriorityColor = (p: string) => {
    switch (p) {
        case 'Critical': return 'bg-rose-100 text-rose-700';
        case 'High': return 'bg-orange-100 text-orange-700';
        case 'Medium': return 'bg-amber-100 text-amber-700';
        default: return 'bg-slate-100 text-slate-700';
    }
};

const getRiskColor = (r: string) => {
    switch (r) {
        case 'High': return 'text-rose-600';
        case 'Medium': return 'text-orange-600';
        default: return 'text-emerald-600';
    }
}

export default RequirementsPage;
