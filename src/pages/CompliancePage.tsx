import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldAlert, CheckCircle2, Info, Download, FileJson, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const CompliancePage = () => {
    const [issues, setIssues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCompliance();
    }, []);

    const fetchCompliance = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('compliance_issues')
            .select('*');

        if (!error && data) {
            setIssues(data);
        }
        setLoading(false);
    };

    const stats = [
        { name: 'Critical', value: issues.filter(i => i.severity === 'Critical').length, color: '#f43f5e' },
        { name: 'High', value: issues.filter(i => i.severity === 'High').length, color: '#f59e0b' },
        { name: 'Medium', value: issues.filter(i => i.severity === 'Medium').length, color: '#6366f1' },
    ].filter(s => s.value > 0);

    const score = issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 10));

    if (loading) return <div className="p-8 text-center text-slate-500">Loading compliance report...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Compliance & Regulations</h1>
                    <p className="text-slate-500">FDA 21 CFR Part 11, IEC 62304, ISO 13485, ISO 27001 Validation.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                        <FileJson className="w-4 h-4" /> Export JSON
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors">
                        <Download className="w-4 h-4" /> Generate Audit Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 glass-card p-8 rounded-3xl bg-white border border-slate-100 flex flex-col items-center justify-center text-center">
                    <div className="relative w-48 h-48 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.length > 0 ? stats : [{ name: 'Compliant', value: 1, color: '#10b981' }]}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {(stats.length > 0 ? stats : [{ color: '#10b981' }]).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-5xl font-black text-slate-900">{score}</span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Score</span>
                        </div>
                    </div>
                    <div className="mt-6 space-y-4 w-full">
                        <h3 className="font-bold text-slate-900">Compliance Summary</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {stats.map(s => (
                                <div key={s.name} className="p-3 rounded-2xl border border-slate-50 bg-slate-50/50">
                                    <p className="text-[10px] uppercase font-bold text-slate-400">{s.name}</p>
                                    <p className="text-xl font-black text-slate-900">{s.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-rose-500" />
                        Identified Issues ({issues.length})
                    </h2>

                    <div className="grid gap-4">
                        {issues.map((issue, idx) => (
                            <div key={idx} className="glass-card p-6 rounded-2xl border border-slate-100 bg-white hover:border-rose-200 transition-all group">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${getSeverityColor(issue.severity)}`}>
                                                {issue.severity}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400">{issue.standard}</span>
                                        </div>
                                        <p className="text-slate-900 font-bold leading-snug">{issue.message}</p>
                                        {issue.file_path && (
                                            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 font-mono bg-slate-50 p-2 rounded-lg w-fit">
                                                <Info className="w-3.5 h-3.5 text-blue-500" />
                                                {issue.file_path}
                                            </div>
                                        )}
                                    </div>
                                    <button className="p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-all">
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {issues.length === 0 && (
                            <div className="p-10 text-center bg-emerald-50 border border-emerald-100 rounded-3xl">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-emerald-900">100% Compliant</h3>
                                <p className="text-emerald-700 text-sm mt-1">No major issues found against the selected standards.</p>
                            </div>
                        )}
                    </div>
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
