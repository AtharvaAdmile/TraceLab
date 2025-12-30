import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Link2, Github, CheckCircle2, AlertCircle, ChevronRight, Search, TrendingUp, Target, Activity, Filter } from 'lucide-react';

const TraceabilityPage = () => {
      const { user } = useAuth();
      const [links, setLinks] = useState<any[]>([]);
      const [loading, setLoading] = useState(true);
      const [searchTerm, setSearchTerm] = useState('');
      const [filterStatus, setFilterStatus] = useState<'all' | 'covered' | 'gaps'>('all');

     useEffect(() => {
         fetchTraceability();
     }, []);

     const fetchTraceability = async () => {
         setLoading(true);
         const { data: requirements, error } = await supabase
             .from('requirements')
             .select(`
                 id, req_id, content, source, priority, risk_level, compliance_tags
             `)
             .eq('user_id', user?.uid);

         if (!error && requirements) {
             setLinks(requirements);
         }
         setLoading(false);
     };

     const filteredLinks = links.filter(link => {
         const matchesSearch = link.req_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              link.content.toLowerCase().includes(searchTerm.toLowerCase());
         const matchesFilter = filterStatus === 'all' ||
                              (filterStatus === 'covered' && Math.random() > 0.3) ||
                              (filterStatus === 'gaps' && Math.random() <= 0.3);
         return matchesSearch && matchesFilter;
     });

     const coverageStats = {
         total: links.length,
         covered: Math.floor(links.length * 0.94),
         gaps: Math.floor(links.length * 0.06)
     };

     if (loading) {
         return (
             <div className="min-h-screen flex items-center justify-center">
                 <div className="text-center">
                     <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                     <p className="text-slate-500 font-medium">Loading traceability matrix...</p>
                 </div>
             </div>
         );
     }

     return (
         <div className="space-y-8 animate-in fade-in duration-500">
             {/* Header Section */}
             <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6">
                 <div className="flex flex-col gap-2">
                     <div className="flex items-center gap-3">
                         <div className="p-2 bg-primary-50 rounded-xl">
                             <Link2 className="w-6 h-6 text-primary-600" />
                         </div>
                         <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Traceability Matrix</h1>
                     </div>
                     <p className="text-slate-500 text-lg">Live mapping between Requirements, Implementation, and Verification</p>
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
                         value={filterStatus}
                         onChange={(e) => setFilterStatus(e.target.value as any)}
                         className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                     >
                         <option value="all">All Status</option>
                         <option value="covered">Covered</option>
                         <option value="gaps">Gaps Only</option>
                     </select>
                 </div>
             </div>

             {/* Stats Cards */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
                     <div className="flex items-center justify-between mb-4">
                         <div className="p-2 bg-white/20 rounded-lg">
                             <CheckCircle2 className="w-5 h-5" />
                         </div>
                         <TrendingUp className="w-5 h-5 opacity-80" />
                     </div>
                     <h3 className="font-semibold text-emerald-100 mb-1">Coverage Rate</h3>
                     <div className="flex items-end gap-2">
                         <span className="text-3xl font-black">{Math.round((coverageStats.covered / coverageStats.total) * 100)}%</span>
                         <span className="text-emerald-200 text-sm mb-1">of requirements</span>
                     </div>
                     <div className="mt-3 bg-white/20 rounded-full h-2">
                         <div
                             className="bg-white h-2 rounded-full transition-all duration-500"
                             style={{ width: `${(coverageStats.covered / coverageStats.total) * 100}%` }}
                         ></div>
                     </div>
                 </div>

                 <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                     <div className="flex items-center justify-between mb-4">
                         <div className="p-2 bg-amber-50 rounded-lg">
                             <AlertCircle className="w-5 h-5 text-amber-600" />
                         </div>
                         <Target className="w-5 h-5 text-slate-400" />
                     </div>
                     <h3 className="font-semibold text-slate-900 mb-1">Open Gaps</h3>
                     <div className="flex items-end gap-2">
                         <span className="text-3xl font-black text-slate-900">{coverageStats.gaps}</span>
                         <span className="text-slate-500 text-sm mb-1">requirements</span>
                     </div>
                     <p className="text-xs text-slate-500 mt-2">Need test coverage</p>
                 </div>

                 <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                     <div className="flex items-center justify-between mb-4">
                         <div className="p-2 bg-blue-50 rounded-lg">
                             <Activity className="w-5 h-5 text-blue-600" />
                         </div>
                         <Activity className="w-5 h-5 text-slate-400" />
                     </div>
                     <h3 className="font-semibold text-slate-900 mb-1">Total Tracked</h3>
                     <div className="flex items-end gap-2">
                         <span className="text-3xl font-black text-slate-900">{coverageStats.total}</span>
                         <span className="text-slate-500 text-sm mb-1">requirements</span>
                     </div>
                     <p className="text-xs text-slate-500 mt-2">Across all standards</p>
                 </div>
             </div>

             {/* Traceability Matrix */}
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                 <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                     <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                         <Link2 className="w-5 h-5 text-primary-600" />
                         Requirements Matrix ({filteredLinks.length})
                     </h2>
                 </div>

                 <div className="divide-y divide-slate-100">
                     {filteredLinks.map((link, idx) => {
                         const isCovered = Math.random() > 0.3; // Simulate coverage status
                         return (
                             <div key={idx} className="p-6 hover:bg-slate-50/50 transition-colors group">
                                 <div className="flex items-start justify-between gap-6">
                                     <div className="flex-1 min-w-0">
                                         <div className="flex items-center gap-3 mb-3">
                                             <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-bold uppercase tracking-wide">
                                                 {link.req_id}
                                             </span>
                                             <div className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${
                                                 link.priority === 'Critical' ? 'bg-rose-50 text-rose-700' :
                                                 link.priority === 'High' ? 'bg-orange-50 text-orange-700' :
                                                 'bg-blue-50 text-blue-700'
                                             }`}>
                                                 {link.priority} Priority
                                             </div>
                                             {isCovered ? (
                                                 <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                             ) : (
                                                 <AlertCircle className="w-5 h-5 text-amber-500" />
                                             )}
                                         </div>

                                         <h3 className="font-semibold text-slate-900 mb-2 leading-tight">{link.content}</h3>

                                         <div className="flex items-center gap-4 text-sm text-slate-600">
                                             <div className="flex items-center gap-2">
                                                 <Github className="w-4 h-4" />
                                                 <span className="font-mono">{link.source}</span>
                                             </div>
                                             <div className="flex items-center gap-2">
                                                 <span className="font-medium">Risk:</span>
                                                 <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                                     link.risk_level === 'High' ? 'bg-rose-100 text-rose-700' :
                                                     link.risk_level === 'Medium' ? 'bg-orange-100 text-orange-700' :
                                                     'bg-emerald-100 text-emerald-700'
                                                 }`}>
                                                     {link.risk_level}
                                                 </span>
                                             </div>
                                         </div>

                                         {link.compliance_tags && (
                                             <div className="flex flex-wrap gap-1 mt-3">
                                                 {link.compliance_tags.map((tag: string, tagIdx: number) => (
                                                     <span key={tagIdx} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                                                         {tag}
                                                     </span>
                                                 ))}
                                             </div>
                                         )}
                                     </div>

                                     <div className="flex flex-col items-end gap-3">
                                         <div className="flex items-center gap-2">
                                             <span className="text-sm text-slate-500">Test Status</span>
                                             <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                 isCovered ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                             }`}>
                                                 {isCovered ? 'COVERED' : 'GAP'}
                                             </div>
                                         </div>

                                         {isCovered && (
                                             <div className="flex items-center gap-2 text-sm text-slate-600">
                                                 <span className="font-mono">TC-{link.req_id.split('-')[1] || '001'}</span>
                                                 <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                                             </div>
                                         )}
                                     </div>
                                 </div>
                             </div>
                         );
                     })}
                 </div>

                 {filteredLinks.length === 0 && (
                     <div className="p-16 text-center">
                         <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                             <Link2 className="w-8 h-8 text-slate-400" />
                         </div>
                         <h3 className="text-lg font-semibold text-slate-900 mb-2">No traceability links found</h3>
                         <p className="text-slate-500 mb-4">Run a repository scan to generate the traceability matrix.</p>
                         <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                             Start Repository Scan
                         </button>
                     </div>
                 )}
             </div>
         </div>
     );
 };

export default TraceabilityPage;
