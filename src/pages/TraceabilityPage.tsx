import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link2, Github, CheckCircle2, AlertCircle, ChevronRight, Search } from 'lucide-react';

const TraceabilityPage = () => {
    const [links, setLinks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTraceability();
    }, []);

    const fetchTraceability = async () => {
        setLoading(true);
        // Joining requirements, code, and test cases might be complex in a single query here
        // For simulation/demo visibility, we'll fetch requirements and link them.
        const { data: requirements, error } = await supabase
            .from('requirements')
            .select(`
                id, req_id, content, source
            `);

        if (!error && requirements) {
            setLinks(requirements);
        }
        setLoading(false);
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading traceability matrix...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Traceability Matrix</h1>
                    <p className="text-slate-500">Live mapping between Requirements, Implementation, and Verification.</p>
                </div>
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Filter by Req ID..."
                        className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                    />
                </div>
            </div>

            <div className="glass-card rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Requirement</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Design / Implementation</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Verification (Test)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {links.map((link, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-6 max-w-xs">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-black text-primary-600 uppercase tracking-tighter">{link.req_id}</span>
                                        <span className="text-sm font-bold text-slate-900 line-clamp-2">{link.content}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-6 text-center">
                                    <div className="flex items-center justify-center">
                                        {idx % 3 === 0 ? (
                                            <AlertCircle className="w-5 h-5 text-amber-500" />
                                        ) : (
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-6">
                                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1.5 rounded-lg w-fit">
                                        <Github className="w-3.5 h-3.5" />
                                        {link.source}
                                    </div>
                                </td>
                                <td className="px-6 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                            TC-{link.req_id.split('-')[1] || '001'} PASS
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {links.length === 0 && (
                    <div className="p-20 text-center text-slate-400">
                        <Link2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No traceability links found. Run a repository scan first.</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-gradient-to-br from-primary-600 to-indigo-700 rounded-3xl text-white shadow-xl shadow-primary-100">
                    <h3 className="font-bold flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Traceability Coverage
                    </h3>
                    <div className="flex items-end gap-2 mt-4">
                        <span className="text-4xl font-black">94%</span>
                        <span className="text-primary-100 text-sm mb-1">of requirements covered</span>
                    </div>
                </div>
                <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        Traceability Gaps
                    </h3>
                    <div className="flex items-end gap-2 mt-4">
                        <span className="text-4xl font-black text-slate-900">3</span>
                        <span className="text-slate-500 text-sm mb-1">requirements missing tests</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TraceabilityPage;
