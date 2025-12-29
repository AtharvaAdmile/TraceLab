import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Calendar,
  FileText,
  TestTube,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  ExternalLink,
  Inbox,
  Loader2,
  ChevronDown,
} from 'lucide-react';

interface AnalysisRecord {
  id: string;
  name: string;
  github_url: string;
  created_at: string;
  requirementsCount: number;
  testCasesCount: number;
  complianceCount: number;
  status: 'complete' | 'pending' | 'failed';
}

const HistoryPage = () => {
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days' | '90days'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [dateFilter]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (dateFilter !== 'all') {
        const days = dateFilter === '7days' ? 7 : dateFilter === '30days' ? 30 : 90;
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);
        query = query.gte('created_at', fromDate.toISOString());
      }

      const { data: projects, error } = await query;

      if (error) throw error;

      if (projects) {
        const enrichedRecords = await Promise.all(
          projects.map(async (project) => {
            const [reqRes, testRes, compRes] = await Promise.all([
              supabase
                .from('requirements')
                .select('id', { count: 'exact' })
                .eq('project_id', project.id),
              supabase
                .from('test_cases')
                .select('id', { count: 'exact' })
                .eq('project_id', project.id),
              supabase
                .from('compliance_issues')
                .select('id', { count: 'exact' })
                .eq('project_id', project.id),
            ]);

            return {
              id: project.id,
              name: project.name,
              github_url: project.github_url,
              created_at: project.created_at,
              requirementsCount: reqRes.count || 0,
              testCasesCount: testRes.count || 0,
              complianceCount: compRes.count || 0,
              status: 'complete' as const,
            };
          })
        );

        setRecords(enrichedRecords);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: AnalysisRecord['status']) => {
    switch (status) {
      case 'complete':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium">
            <CheckCircle2 className="w-3 h-3" />
            Complete
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-rose-50 text-rose-700 rounded-lg text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        );
    }
  };

  const filterOptions = [
    { value: 'all', label: 'All Time' },
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '90days', label: 'Last 90 Days' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">History</h1>
          <p className="text-slate-500 mt-1">View your past analysis records</p>
        </div>

        {/* Date Filter */}
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors"
          >
            <Filter className="w-4 h-4" />
            {filterOptions.find((o) => o.value === dateFilter)?.label}
            <ChevronDown className="w-4 h-4" />
          </button>

          {showFilterMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowFilterMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg z-20 overflow-hidden">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setDateFilter(option.value as typeof dateFilter);
                      setShowFilterMenu(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors ${
                      dateFilter === option.value
                        ? 'bg-[#2563eb] text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* History List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
          </div>
        ) : records.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <div className="col-span-4">Project</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-1 text-center">Reqs</div>
              <div className="col-span-1 text-center">Tests</div>
              <div className="col-span-2 text-center">Issues</div>
              <div className="col-span-2 text-center">Status</div>
            </div>

            {/* Table Rows */}
            {records.map((record) => (
              <div
                key={record.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors group cursor-pointer"
                onClick={() => window.open(record.github_url, '_blank')}
              >
                <div className="col-span-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-[#2563eb]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate group-hover:text-[#2563eb] transition-colors flex items-center gap-1">
                        {record.name}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {record.github_url}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {formatDate(record.created_at)}
                  </div>
                </div>

                <div className="col-span-1 text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-50 text-[#2563eb] rounded-lg text-sm font-semibold">
                    {record.requirementsCount}
                  </span>
                </div>

                <div className="col-span-1 text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-semibold">
                    {record.testCasesCount}
                  </span>
                </div>

                <div className="col-span-2 text-center">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-semibold ${
                      record.complianceCount > 0
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-slate-50 text-slate-400'
                    }`}
                  >
                    {record.complianceCount}
                  </span>
                </div>

                <div className="col-span-2 flex justify-center">
                  {getStatusBadge(record.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {!loading && records.length > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <p>
            Showing {records.length} {records.length === 1 ? 'record' : 'records'}
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              {records.reduce((sum, r) => sum + r.requirementsCount, 0)} total requirements
            </span>
            <span className="flex items-center gap-1">
              <TestTube className="w-4 h-4" />
              {records.reduce((sum, r) => sum + r.testCasesCount, 0)} total tests
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
      <Inbox className="w-8 h-8 text-slate-400" />
    </div>
    <h3 className="text-lg font-semibold text-slate-900 mb-2">No analysis history</h3>
    <p className="text-slate-500 text-center max-w-sm">
      You haven't analyzed any repositories yet. Connect a GitHub repository from the dashboard to get started.
    </p>
    <a
      href="/dashboard"
      className="mt-6 flex items-center gap-2 px-6 py-3 bg-[#2563eb] text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
    >
      Go to Dashboard
      <ExternalLink className="w-4 h-4" />
    </a>
  </div>
);

export default HistoryPage;
