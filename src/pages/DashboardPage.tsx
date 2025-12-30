import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  TestTube2,
  GitBranch,
  ShieldCheck,
  User,
  Settings,
  LogOut,
  Plus,
  FolderOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Activity,
  ChevronRight,
  ExternalLink,
  Github,
  Zap,
  Search,
  Trash2,
  AlertCircle,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { parseGithubUrl, fetchRepoContents, generateDigest, fetchCommitHistory, fetchPullRequests } from '../services/githubService';
import { analyzeCodebase, setAIProvider, getAIProvider } from '../services/aiService';
import type { AIProvider } from '../services/aiService';
import { parseCodeStructure, detectSecurityAntiPatterns } from '../services/astService';
import { validateCompliance } from '../services/complianceRules';
import { logService } from '../services/logService';

interface Project {
  id: string;
  name: string;
  github_url: string;
  owner: string;
  repo_name: string;
  created_at: string;
  updated_at: string;
  requirements_count?: number;
  test_cases_count?: number;
  compliance_status?: 'compliant' | 'issues' | 'pending';
}

interface Stats {
  projects: number;
  testCases: number;
  complianceScore: number;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/requirements', label: 'Requirements', icon: FileText },
  { path: '/test-cases', label: 'Test Cases', icon: TestTube2 },
  { path: '/traceability', label: 'Traceability', icon: GitBranch },
  { path: '/compliance', label: 'Compliance', icon: ShieldCheck },
];

const bottomNavItems = [
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const DashboardPage = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Stats>({ projects: 0, testCases: 0, complianceScore: 0 });
  const [loading, setLoading] = useState(true);
  const [showNewAnalysis, setShowNewAnalysis] = useState(false);
  
  // Analysis state
  const [url, setUrl] = useState('');
  const [requirementsPdf, setRequirementsPdf] = useState<File | null>(null);
  const [requirementsPdfBase64, setRequirementsPdfBase64] = useState<string>('');
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [analysisMessage, setAnalysisMessage] = useState('');
  const [provider, setProvider] = useState<AIProvider>(getAIProvider());

  useEffect(() => {
    fetchProjects();
    fetchStats();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user?.uid)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      const projectsWithCounts = await Promise.all(
        (projectsData || []).map(async (project) => {
          // Get requirements for this project
          const { data: reqs } = await supabase
            .from('requirements')
            .select('id')
            .eq('project_id', project.id);

          const reqIds = reqs?.map(r => r.id) || [];

          // Count test cases linked to these requirements
          const { count: testCount } = reqIds.length > 0
            ? await supabase
                .from('test_cases')
                .select('id', { count: 'exact' })
                .in('requirement_id', reqIds)
            : { count: 0 };

          // Count compliance issues for this project
          const { count: issuesCount } = await supabase
            .from('compliance_issues')
            .select('id', { count: 'exact' })
            .eq('project_id', project.id);

          let complianceStatus: 'compliant' | 'issues' | 'pending' = 'pending';
          if (reqIds.length > 0) {
            complianceStatus = (issuesCount || 0) === 0 ? 'compliant' : 'issues';
          }

          return {
            ...project,
            requirements_count: reqIds.length,
            test_cases_count: testCount || 0,
            compliance_status: complianceStatus,
          };
        })
      );

      setProjects(projectsWithCounts);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [projectsResult, testCasesResult, issuesResult, reqResult] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact' }).eq('user_id', user?.uid),
        supabase.from('test_cases').select('id', { count: 'exact' }).eq('user_id', user?.uid),
        supabase.from('compliance_issues').select('id', { count: 'exact' }).eq('user_id', user?.uid),
        supabase.from('requirements').select('id', { count: 'exact' }).eq('user_id', user?.uid),
      ]);

      const totalReqs = reqResult.count || 0;
      const totalIssues = issuesResult.count || 0;
      const complianceScore = totalReqs > 0 
        ? Math.round(((totalReqs - totalIssues) / totalReqs) * 100)
        : 100;

      setStats({
        projects: projectsResult.count || 0,
        testCases: testCasesResult.count || 0,
        complianceScore: Math.max(0, complianceScore),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    setAIProvider(newProvider);
  };

  const handlePdfFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setAnalysisStatus('error');
        setAnalysisMessage('Please select a PDF file.');
        return;
      }
      
      setRequirementsPdf(file);
      
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64Content = base64.split(',')[1];
        setRequirementsPdfBase64(base64Content);
      };
      reader.onerror = () => {
        setAnalysisStatus('error');
        setAnalysisMessage('Error reading PDF file.');
      };
      reader.readAsDataURL(file);
    }
  };

  const removePdfFile = () => {
    setRequirementsPdf(null);
    setRequirementsPdfBase64('');
  };

  const handleAnalyze = async () => {
    logService.clearLogs();
    logService.log('INFO', 'SYSTEM', `Starting new analysis session for URL: ${url}`);
    const repoInfo = parseGithubUrl(url);
    if (!repoInfo) {
      setAnalysisStatus('error');
      setAnalysisMessage('Invalid GitHub URL. Please use format: https://github.com/user/repo');
      return;
    }

    setAnalysisStatus('loading');
    setAnalysisMessage('Fetching repository contents...');

    try {
      setAnalysisMessage('Retrieving file structure and contents...');
      const files = await fetchRepoContents(repoInfo.owner, repoInfo.repo);

      setAnalysisMessage('Fetching commit history and pull requests...');
      const commits = await fetchCommitHistory(repoInfo.owner, repoInfo.repo, 30);
      const pullRequests = await fetchPullRequests(repoInfo.owner, repoInfo.repo, 15);

      setAnalysisMessage(`Processing ${files.length} files, ${commits.length} commits, ${pullRequests.length} PRs...`);
      const digest = generateDigest(files, commits, pullRequests);

      setAnalysisMessage('Saving project metadata...');
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .upsert({
          name: repoInfo.repo,
          github_url: url,
          repo_name: repoInfo.repo,
          owner: repoInfo.owner,
          digest_text: digest,
          user_id: user?.uid,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      setAnalysisMessage(`Analyzing requirements with ${provider === 'Ollama' ? 'MedGemma' : 'Gemini'}...`);
      const requirements = await analyzeCodebase(digest, requirementsPdfBase64);

      if (requirements.length > 0) {
        const { error: reqError } = await supabase.from('requirements').insert(
          requirements.map(r => ({ ...r, project_id: project.id, user_id: user?.uid }))
        );
        if (reqError) console.error('Error storing requirements:', reqError);
      }

      setAnalysisMessage('Performing AST Deep Dive...');
      let allFunctions: any[] = [];
      let allSecurityIssues: string[] = [];
      files.forEach(file => {
        const functions = parseCodeStructure(file.path, file.content);
        const security = detectSecurityAntiPatterns(file.content);
        allFunctions = [...allFunctions, ...functions];
        allSecurityIssues = [...allSecurityIssues, ...security];
      });

      const complianceIssues = validateCompliance(requirements, allFunctions, allSecurityIssues);

      if (complianceIssues.length > 0) {
        const { error: compError } = await supabase.from('compliance_issues').insert(
          complianceIssues.map(pi => ({ ...pi, project_id: project.id, user_id: user?.uid }))
        );
        if (compError) console.error('Error storing compliance issues:', compError);
      }

      setAnalysisStatus('success');
      setAnalysisMessage('Repository analyzed successfully!');
      setShowNewAnalysis(false);
      setUrl('');
      fetchProjects();
      fetchStats();
    } catch (error: any) {
      console.error(error);
      setAnalysisStatus('error');
      setAnalysisMessage(`Analysis failed: ${error.message || 'Unknown error'}`);
    }
  };

  const handleClearAllData = async () => {
    if (!window.confirm('Are you absolutely sure? This will delete all repositories, requirements, test cases, and compliance issues. This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      // Delete in order to handle foreign key constraints
      // compliance_issues -> test_cases -> requirements -> projects
      const { error: compError } = await supabase.from('compliance_issues').delete().eq('user_id', user?.uid);
      if (compError) throw compError;

      const { error: testError } = await supabase.from('test_cases').delete().eq('user_id', user?.uid);
      if (testError) throw testError;

      const { error: reqError } = await supabase.from('requirements').delete().eq('user_id', user?.uid);
      if (reqError) throw reqError;

      const { error: projError } = await supabase.from('projects').delete().eq('user_id', user?.uid);
      if (projError) throw projError;

      fetchProjects();
      fetchStats();
    } catch (error: any) {
      console.error('Cleanup failed:', error.message);
      alert(`Failed to clear data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const truncateUrl = (url: string | null, maxLength = 40) => {
    if (!url) return 'No URL';
    if (url.length <= maxLength) return url;
    return url.slice(0, maxLength) + '...';
  };

  const getStatusBadge = (status: 'compliant' | 'issues' | 'pending') => {
    const styles = {
      compliant: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      issues: 'bg-amber-100 text-amber-700 border-amber-200',
      pending: 'bg-slate-100 text-slate-600 border-slate-200',
    };
    const labels = {
      compliant: 'Compliant',
      issues: 'Issues Found',
      pending: 'Pending',
    };
    const icons = {
      compliant: CheckCircle2,
      issues: AlertTriangle,
      pending: Clock,
    };
    const Icon = icons[status];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${styles[status]}`}>
        <Icon className="w-3 h-3" />
        {labels[status]}
      </span>
    );
  };

  const userName = user?.displayName || user?.email?.split('@')[0] || 'User';

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-100">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#2563eb] rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">TraceLab</span>
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#2563eb] text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-4 border-t border-slate-200" />

        {/* Bottom Navigation */}
        <div className="p-4 space-y-1">
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#2563eb] text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>

        {/* User info */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#2563eb] rounded-full flex items-center justify-center text-white font-medium text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{userName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Welcome back, {userName}
              </h1>
              <p className="text-slate-500 mt-1">
                Here's what's happening with your projects today.
              </p>
            </div>
            <button
              onClick={() => setShowNewAnalysis(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              New Analysis
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-[#f8fafc] rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2563eb]/10 rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-[#2563eb]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.projects}</p>
                  <p className="text-sm text-slate-500">Projects</p>
                </div>
              </div>
            </div>
            <div className="bg-[#f8fafc] rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TestTube2 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.testCases}</p>
                  <p className="text-sm text-slate-500">Test Cases</p>
                </div>
              </div>
            </div>
            <div className="bg-[#f8fafc] rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.complianceScore}%</p>
                  <p className="text-sm text-slate-500">Compliance Score</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8">
          {/* New Analysis Modal */}
          {showNewAnalysis && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900">New Analysis</h2>
                  <button
                    onClick={() => {
                      setShowNewAnalysis(false);
                      setAnalysisStatus('idle');
                      setUrl('');
                      setRequirementsPdf(null);
                      setRequirementsPdfBase64('');
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* AI Provider Selection */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                    AI Engine
                  </label>
                  <div className="flex p-1 bg-slate-100 rounded-lg">
                    <button
                      onClick={() => handleProviderChange('Ollama')}
                      className={`flex-1 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        provider === 'Ollama' ? 'bg-white text-[#2563eb] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      MedGemma (Ollama)
                    </button>
                    <button
                      onClick={() => handleProviderChange('Gemini')}
                      className={`flex-1 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        provider === 'Gemini' ? 'bg-white text-[#2563eb] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Zap className="w-4 h-4 text-amber-500" />
                      Gemini 2.0 Flash
                    </button>
                  </div>
                </div>

                {/* URL Input */}
                <div className="relative mb-4">
                  <Github className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://github.com/user/repo"
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all"
                  />
                </div>

                {/* Optional Requirements PDF Upload */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                    Requirements Document (Optional)
                  </label>
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 transition-all hover:border-[#2563eb]/30">
                    {!requirementsPdf ? (
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <label className="cursor-pointer">
                          <span className="text-sm text-slate-600 hover:text-[#2563eb] transition-colors">
                            Click to upload PDF
                          </span>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={handlePdfFileChange}
                            className="hidden"
                          />
                        </label>
                        <p className="text-xs text-slate-400 mt-1">PDF files only, max size 10MB</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{requirementsPdf.name}</p>
                            <p className="text-xs text-slate-500">
                              {(requirementsPdf.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={removePdfFile}
                          className="text-slate-400 hover:text-red-600 transition-colors p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Messages */}
                {analysisStatus === 'error' && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-700 text-sm mb-4">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {analysisMessage}
                  </div>
                )}

                <button
                  onClick={handleAnalyze}
                  disabled={analysisStatus === 'loading' || !url}
                  className="w-full py-3 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {analysisStatus === 'loading' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {analysisMessage}
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Start Analysis
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Recent Projects */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Recent Projects</h2>
              {projects.length > 0 && (
                <button
                  onClick={handleClearAllData}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
              </div>
            ) : projects.length === 0 ? (
              /* Empty State */
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FolderOpen className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No projects yet</h3>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                  Get started by analyzing your first GitHub repository for compliance and traceability.
                </p>
                <button
                  onClick={() => setShowNewAnalysis(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create your first project
                </button>
              </div>
            ) : (
              /* Project Cards Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => navigate('/requirements')}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-[#2563eb]/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#2563eb]/10 rounded-lg flex items-center justify-center">
                          <Github className="w-5 h-5 text-[#2563eb]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 group-hover:text-[#2563eb] transition-colors">
                            {project.name}
                          </h3>
                          <p className="text-xs text-slate-500">{project.owner}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#2563eb] transition-colors" />
                    </div>

                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-slate-400 hover:text-[#2563eb] flex items-center gap-1 mb-3 truncate"
                    >
                      {truncateUrl(project.github_url)}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          {project.requirements_count} reqs
                        </span>
                        <span className="flex items-center gap-1">
                          <TestTube2 className="w-3.5 h-3.5" />
                          {project.test_cases_count} tests
                        </span>
                      </div>
                      {getStatusBadge(project.compliance_status || 'pending')}
                    </div>

                    <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Updated {formatDate(project.updated_at || project.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions & Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  to="/requirements"
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-[#2563eb]/30 hover:bg-[#2563eb]/5 transition-all group"
                >
                  <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#2563eb]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 group-hover:text-[#2563eb]">View Requirements</p>
                    <p className="text-xs text-slate-500">Browse all extracted requirements</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#2563eb]" />
                </Link>
                <Link
                  to="/traceability"
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-[#2563eb]/30 hover:bg-[#2563eb]/5 transition-all group"
                >
                  <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                    <GitBranch className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 group-hover:text-[#2563eb]">Traceability Matrix</p>
                    <p className="text-xs text-slate-500">View requirement-to-code mappings</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#2563eb]" />
                </Link>
                <Link
                  to="/compliance"
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-[#2563eb]/30 hover:bg-[#2563eb]/5 transition-all group"
                >
                  <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 group-hover:text-[#2563eb]">Compliance Report</p>
                    <p className="text-xs text-slate-500">Check FDA/IEC compliance status</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#2563eb]" />
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
              {projects.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No recent activity</p>
              ) : (
                <div className="space-y-4">
                  {projects.slice(0, 4).map((project) => (
                    <div key={project.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-[#2563eb]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Activity className="w-4 h-4 text-[#2563eb]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900">
                          Analyzed <span className="font-medium">{project.name}</span>
                        </p>
                        <p className="text-xs text-slate-500">
                          {project.requirements_count} requirements · {project.test_cases_count} tests
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDate(project.updated_at || project.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
