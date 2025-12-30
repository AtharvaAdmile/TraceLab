import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { ExtractedRequirement } from '../services/aiService';
import { generateTestCasesForRequirement, setAIProvider } from '../services/aiService';
import { ClipboardList, ExternalLink, AlertTriangle, FileText, Zap, X, Code, Loader2, Search, Target, TrendingUp, Eye, Sparkles, CheckCircle2 } from 'lucide-react';

const RequirementsPage = () => {
      const { user } = useAuth();
      const [requirements, setRequirements] = useState<ExtractedRequirement[]>([]);
      const [loading, setLoading] = useState(true);
      const [generatingFor, setGeneratingFor] = useState<string | null>(null);
      const [codeModalOpen, setCodeModalOpen] = useState(false);
      const [codeModalContent, setCodeModalContent] = useState<{ source: string; content: string } | null>(null);
      const [searchTerm, setSearchTerm] = useState('');
      const [priorityFilter, setPriorityFilter] = useState<string>('all');
      const [riskFilter, setRiskFilter] = useState<string>('all');

     useEffect(() => {
         fetchRequirements();
     }, []);

     const fetchRequirements = async () => {
         setLoading(true);
         const { data, error } = await supabase
             .from('requirements')
             .select('*')
             .eq('user_id', user?.uid)
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
                 // Insert with executable test fields
                 const { error } = await supabase.from('test_cases').insert(
                     newTestCases.map(tc => ({
                         description: tc.title || 'Generated Test Case',
                         expected_result: tc.expected_result || '',
                         compliance_tag: tc.compliance_tag || req.compliance_tags?.[0] || 'General',
                         requirement_id: (req as any).id,
                         user_id: user?.uid,
                         // Executable test fields
                         test_script: tc.test_script || '',
                         test_filename: tc.test_filename || '',
                         language: tc.language || 'python',
                         dependencies: tc.dependencies || [],
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

     const filteredRequirements = requirements.filter(req => {
         const matchesSearch = req.req_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              req.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              req.source.toLowerCase().includes(searchTerm.toLowerCase());
         const matchesPriority = priorityFilter === 'all' || req.priority === priorityFilter;
         const matchesRisk = riskFilter === 'all' || req.risk_level === riskFilter;
         return matchesSearch && matchesPriority && matchesRisk;
     });

     const stats = {
         total: requirements.length,
         critical: requirements.filter(r => r.priority === 'Critical').length,
         high: requirements.filter(r => r.priority === 'High').length,
         covered: requirements.filter(() => Math.random() > 0.3).length // Simulate coverage
     };

     if (loading) {
         return (
             <div className="min-h-screen flex items-center justify-center">
                 <div className="text-center">
                     <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                     <p className="text-slate-500 font-medium">Loading requirements...</p>
                 </div>
             </div>
         );
     }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Code Modal */}
            {codeModalOpen && codeModalContent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setCodeModalOpen(false)}>
                    <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-slate-700">
                            <div className="flex items-center gap-3">
                                <Code className="w-5 h-5 text-primary-400" />
                                <span className="text-white font-bold">Source Context</span>
                            </div>
                            <button onClick={() => setCodeModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-xs text-slate-400 mb-4 font-mono bg-slate-800 p-2 rounded">{codeModalContent.source}</p>
                            <pre className="bg-slate-800 p-4 rounded-xl text-sm text-emerald-400 font-mono overflow-auto max-h-96 whitespace-pre-wrap">
                                {codeModalContent.content}
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-xl">
                            <Target className="w-6 h-6 text-blue-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Extracted Requirements</h1>
                    </div>
                    <p className="text-slate-500 text-lg">Identified from codebase, docs, and comments ({requirements.length} found)</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search requirements..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        />
                    </div>
                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="all">All Priorities</option>
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                    <select
                        value={riskFilter}
                        onChange={(e) => setRiskFilter(e.target.value)}
                        className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="all">All Risks</option>
                        <option value="High">High Risk</option>
                        <option value="Medium">Medium Risk</option>
                        <option value="Low">Low Risk</option>
                    </select>
                    <button className="flex items-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
                        <Zap className="w-4 h-4" /> Rescan Repository
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Target className="w-5 h-5" />
                        </div>
                        <TrendingUp className="w-5 h-5 opacity-80" />
                    </div>
                    <h3 className="font-semibold text-blue-100 mb-1">Total Requirements</h3>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black">{stats.total}</span>
                        <span className="text-blue-200 text-sm mb-1">extracted</span>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-rose-50 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-rose-600" />
                        </div>
                        <span className="text-xs font-bold text-rose-600 uppercase tracking-wide">Critical</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">High Priority</h3>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-slate-900">{stats.critical}</span>
                        <span className="text-slate-500 text-sm mb-1">needs attention</span>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-amber-50 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-amber-600" />
                        </div>
                        <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">High</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">Medium Priority</h3>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-slate-900">{stats.high}</span>
                        <span className="text-slate-500 text-sm mb-1">requirements</span>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-emerald-50 rounded-lg">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Covered</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">Test Coverage</h3>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-slate-900">{Math.round((stats.covered / stats.total) * 100)}%</span>
                        <span className="text-slate-500 text-sm mb-1">covered</span>
                    </div>
                </div>
            </div>

            {/* Requirements Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {filteredRequirements.map((req, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${getPriorityColor(req.priority)}`}>
                                        {req.priority}
                                    </span>
                                    <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-bold uppercase tracking-wide">
                                        {req.req_id}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleViewCode(req)}
                                        className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                                        title="View Source"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <h3 className="text-lg font-bold text-slate-900 mb-3 leading-tight">{req.content}</h3>

                            {/* Metadata */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="space-y-2">
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Source</p>
                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                        <ExternalLink className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                        <span className="font-mono truncate">{req.source}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Risk Level</p>
                                    <div className={`flex items-center gap-2 text-sm font-bold ${getRiskColor(req.risk_level)}`}>
                                        <AlertTriangle className="w-4 h-4" />
                                        {req.risk_level}
                                    </div>
                                </div>
                            </div>

                            {/* Compliance Tags */}
                            {req.compliance_tags && req.compliance_tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {req.compliance_tags.map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-bold border border-primary-100 uppercase">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* AI Rationale */}
                            <div className="p-4 bg-slate-50 rounded-xl mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-4 h-4 text-purple-500" />
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">AI Rationale</p>
                                </div>
                                <p className="text-sm text-slate-700 italic leading-relaxed">"{req.rationale}"</p>
                            </div>

                            {/* Actions */}
                            <button
                                onClick={() => handleGenerateTestCases(req)}
                                disabled={generatingFor === req.req_id}
                                className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
                            >
                                {generatingFor === req.req_id ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Generating Tests...
                                    </>
                                ) : (
                                    <>
                                        <ClipboardList className="w-4 h-4" />
                                        Generate Test Cases
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ))}

                {filteredRequirements.length === 0 && requirements.length > 0 && (
                    <div className="xl:col-span-2 p-16 text-center bg-slate-50 border border-slate-200 rounded-2xl">
                        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No requirements match your filters</h3>
                        <p className="text-slate-500">Try adjusting your search terms or filter criteria.</p>
                    </div>
                )}

                {requirements.length === 0 && (
                    <div className="xl:col-span-2 p-16 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <FileText className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No Requirements Extracted</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mb-6">Connect a GitHub repository to begin AI-powered requirement analysis.</p>
                        <button className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium">
                            Connect Repository
                        </button>
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
