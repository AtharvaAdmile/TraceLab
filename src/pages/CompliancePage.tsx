import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, CheckCircle2, Info, Download, FileJson, ArrowRight, TrendingUp, AlertTriangle, FileCheck, Zap, Filter, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const CompliancePage = () => {
      const { user } = useAuth();
      const [issues, setIssues] = useState<any[]>([]);
      const [loading, setLoading] = useState(true);
      const [selectedStandard, setSelectedStandard] = useState<string>('all');

     useEffect(() => {
         fetchCompliance();
     }, []);

     const fetchCompliance = async () => {
         setLoading(true);
         const { data, error } = await supabase
             .from('compliance_issues')
             .select('*')
             .eq('user_id', user?.uid);

         if (!error && data) {
             setIssues(data);
         }
         setLoading(false);
     };

     const standards = ['FDA 21 CFR Part 11', 'IEC 62304', 'ISO 13485', 'ISO 27001', 'HIPAA'];

     const stats = [
         { name: 'Critical', value: issues.filter(i => i.severity === 'Critical').length, color: '#ef4444' },
         { name: 'High', value: issues.filter(i => i.severity === 'High').length, color: '#f59e0b' },
         { name: 'Medium', value: issues.filter(i => i.severity === 'Medium').length, color: '#3b82f6' },
         { name: 'Low', value: issues.filter(i => i.severity === 'Low').length, color: '#10b981' },
     ].filter(s => s.value > 0);

     const score = issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 8));

     const filteredIssues = selectedStandard === 'all'
         ? issues
         : issues.filter(issue => issue.standard === selectedStandard);

     const complianceData = standards.map(standard => ({
         name: standard.split(' ')[0],
         issues: issues.filter(i => i.standard === standard).length,
         compliant: issues.filter(i => i.standard === standard).length === 0
     }));

     if (loading) {
         return (
             <div className="min-h-screen flex items-center justify-center">
                 <div className="text-center">
                     <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                     <p className="text-slate-500 font-medium">Loading compliance report...</p>
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
                         <div className="p-2 bg-emerald-50 rounded-xl">
                             <ShieldAlert className="w-6 h-6 text-emerald-600" />
                         </div>
                         <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Compliance & Regulations</h1>
                     </div>
                     <p className="text-slate-500 text-lg">FDA 21 CFR Part 11, IEC 62304, ISO 13485, ISO 27001 Validation</p>
                 </div>

                 <div className="flex flex-col sm:flex-row gap-3">
                     <select
                         value={selectedStandard}
                         onChange={(e) => setSelectedStandard(e.target.value)}
                         className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                     >
                         <option value="all">All Standards</option>
                         {standards.map(standard => (
                             <option key={standard} value={standard}>{standard}</option>
                         ))}
                     </select>
                     <button className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                         <FileJson className="w-4 h-4" /> Export JSON
                     </button>
                     <button className="flex items-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors">
                         <Download className="w-4 h-4" /> Generate Audit Report
                     </button>
                 </div>
             </div>

             {/* Compliance Score & Charts */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* Compliance Score Card */}
                 <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                     <div className="text-center">
                         <div className="relative w-32 h-32 mx-auto mb-6">
                             <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                 <path
                                     d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                     fill="none"
                                     stroke="#e5e7eb"
                                     strokeWidth="2"
                                 />
                                 <path
                                     d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                     fill="none"
                                     stroke={score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444"}
                                     strokeWidth="2"
                                     strokeDasharray={`${score}, 100`}
                                 />
                             </svg>
                             <div className="absolute inset-0 flex flex-col items-center justify-center">
                                 <span className="text-3xl font-black text-slate-900">{score}</span>
                                 <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Score</span>
                             </div>
                         </div>

                         <h3 className="font-bold text-slate-900 mb-2">Compliance Score</h3>
                         <p className="text-sm text-slate-600 mb-6">
                             {score >= 80 ? 'Excellent compliance' : score >= 60 ? 'Good progress needed' : 'Critical issues require attention'}
                         </p>

                         <div className="space-y-3">
                             <div className="flex justify-between items-center text-sm">
                                 <span className="text-slate-600">Issues Found</span>
                                 <span className="font-bold text-slate-900">{issues.length}</span>
                             </div>
                             <div className="flex justify-between items-center text-sm">
                                 <span className="text-slate-600">Standards Checked</span>
                                 <span className="font-bold text-slate-900">{standards.length}</span>
                             </div>
                             <div className="flex justify-between items-center text-sm">
                                 <span className="text-slate-600">Last Scan</span>
                                 <span className="font-bold text-slate-900">2 hours ago</span>
                             </div>
                         </div>
                     </div>
                 </div>

                 {/* Charts Section */}
                 <div className="lg:col-span-2 space-y-6">
                     {/* Severity Breakdown */}
                     <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                         <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                             <AlertTriangle className="w-5 h-5 text-amber-500" />
                             Issues by Severity
                         </h3>
                         <div className="h-48">
                             <ResponsiveContainer width="100%" height="100%">
                                 <BarChart data={stats}>
                                     <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                     <Tooltip
                                         contentStyle={{
                                             backgroundColor: 'white',
                                             border: '1px solid #e2e8f0',
                                             borderRadius: '8px',
                                             boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                         }}
                                     />
                                     <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                         {stats.map((entry, index) => (
                                             <Cell key={`cell-${index}`} fill={entry.color} />
                                         ))}
                                     </Bar>
                                 </BarChart>
                             </ResponsiveContainer>
                         </div>
                     </div>

                     {/* Standards Compliance */}
                     <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                         <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                             <FileCheck className="w-5 h-5 text-blue-500" />
                             Standards Overview
                         </h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                             {standards.map((standard, idx) => {
                                 const issueCount = issues.filter(i => i.standard === standard).length;
                                 const isCompliant = issueCount === 0;
                                 return (
                                     <div key={idx} className={`p-4 rounded-xl border-2 transition-all ${
                                         isCompliant ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
                                     }`}>
                                         <div className="flex items-center justify-between mb-2">
                                             <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                                 {standard.split(' ')[0]}
                                             </span>
                                             {isCompliant ? (
                                                 <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                             ) : (
                                                 <AlertTriangle className="w-4 h-4 text-amber-600" />
                                             )}
                                         </div>
                                         <p className="text-sm font-medium text-slate-900 mb-1 truncate" title={standard}>
                                             {standard}
                                         </p>
                                         <p className={`text-xs ${isCompliant ? 'text-emerald-700' : 'text-amber-700'}`}>
                                             {isCompliant ? 'Compliant' : `${issueCount} issues`}
                                         </p>
                                     </div>
                                 );
                             })}
                         </div>
                     </div>
                 </div>
             </div>

             {/* Issues Section */}
             <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                 <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                     <div className="flex items-center justify-between">
                         <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                             <ShieldAlert className="w-5 h-5 text-rose-500" />
                             Identified Issues ({filteredIssues.length})
                         </h2>
                         <button
                             onClick={fetchCompliance}
                             className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm"
                         >
                             <RefreshCw className="w-4 h-4" />
                             Refresh
                         </button>
                     </div>
                 </div>

                 <div className="divide-y divide-slate-100">
                     {filteredIssues.map((issue, idx) => (
                         <div key={idx} className="p-6 hover:bg-slate-50/50 transition-colors group">
                             <div className="flex justify-between items-start gap-4">
                                 <div className="flex-1">
                                     <div className="flex items-center gap-3 mb-3">
                                         <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getSeverityColor(issue.severity)}`}>
                                             {issue.severity}
                                         </span>
                                         <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                                             {issue.standard}
                                         </span>
                                         {issue.file_path && (
                                             <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-mono">
                                                 {issue.file_path.split('/').pop()}
                                             </span>
                                         )}
                                     </div>

                                     <h3 className="font-semibold text-slate-900 mb-2 leading-tight">{issue.message}</h3>

                                     {issue.description && (
                                         <p className="text-slate-600 text-sm mb-3">{issue.description}</p>
                                     )}

                                     <div className="flex items-center gap-4 text-xs text-slate-500">
                                         {issue.file_path && (
                                             <div className="flex items-center gap-1">
                                                 <Info className="w-3.5 h-3.5" />
                                                 <span className="font-mono">{issue.file_path}</span>
                                             </div>
                                         )}
                                         {issue.line_number && (
                                             <span>Line {issue.line_number}</span>
                                         )}
                                         {issue.category && (
                                             <span className="px-2 py-0.5 bg-slate-100 rounded">{issue.category}</span>
                                         )}
                                     </div>
                                 </div>

                                 <div className="flex items-center gap-2">
                                     <button className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:bg-primary-50 hover:text-primary-600 transition-all opacity-0 group-hover:opacity-100">
                                         <ArrowRight className="w-4 h-4" />
                                     </button>
                                 </div>
                             </div>
                         </div>
                     ))}

                     {filteredIssues.length === 0 && (
                         <div className="p-16 text-center">
                             <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                 <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                             </div>
                             <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                 {selectedStandard === 'all' ? '100% Compliant' : `Compliant with ${selectedStandard}`}
                             </h3>
                             <p className="text-slate-500">
                                 {selectedStandard === 'all'
                                     ? 'No compliance issues found across all standards.'
                                     : `No issues found for the selected standard.`
                                 }
                             </p>
                         </div>
                     )}
                 </div>
             </div>
         </div>
     );
 };

const getSeverityColor = (s: string) => {
    switch (s) {
        case 'Critical': return 'bg-rose-100 text-rose-700';
        case 'High': return 'bg-orange-100 text-orange-700';
        case 'Medium': return 'bg-blue-100 text-blue-700';
        default: return 'bg-slate-100 text-slate-700';
    }
};

export default CompliancePage;
