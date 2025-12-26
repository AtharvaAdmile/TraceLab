import React, { useState } from 'react';
import { Github, Search, CheckCircle2, AlertCircle, Loader2, FileText, ShieldCheck, Zap } from 'lucide-react';
import { parseGithubUrl, fetchRepoContents, generateDigest, fetchCommitHistory, fetchPullRequests } from '../services/githubService';
import { analyzeCodebase, setAIProvider, getAIProvider } from '../services/aiService';
import type { AIProvider } from '../services/aiService';
import { parseCodeStructure, detectSecurityAntiPatterns } from '../services/astService';
import { validateCompliance } from '../services/complianceRules';
import { supabase } from '../lib/supabase';
import { logService } from '../services/logService';

const DashboardPage = () => {
    const [url, setUrl] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [repoMetadata, setRepoMetadata] = useState<any>(null);
    const [provider, setProvider] = useState<AIProvider>(getAIProvider());

    const handleProviderChange = (newProvider: AIProvider) => {
        setProvider(newProvider);
        setAIProvider(newProvider);
    };

    const handleConnect = async () => {
        logService.clearLogs();
        logService.log('INFO', 'SYSTEM', `Starting new analysis session for URL: ${url}`);
        const repoInfo = parseGithubUrl(url);
        if (!repoInfo) {
            setStatus('error');
            setMessage('Invalid GitHub URL. Please use format: https://github.com/user/repo');
            return;
        }

        setStatus('loading');
        setMessage('Fetching repository contents...');

        try {
            // 1. Fetch contents
            setMessage('Retrieving file structure and contents...');
            const files = await fetchRepoContents(repoInfo.owner, repoInfo.repo);

            // 2. Fetch commit history and PRs for traceability
            setMessage('Fetching commit history and pull requests...');
            const commits = await fetchCommitHistory(repoInfo.owner, repoInfo.repo, 30);
            const pullRequests = await fetchPullRequests(repoInfo.owner, repoInfo.repo, 15);

            setMessage(`Processing ${files.length} files, ${commits.length} commits, ${pullRequests.length} PRs...`);

            // 3. Generate digest with all metadata
            const digest = generateDigest(files, commits, pullRequests);


            // 3. Store project in Supabase
            setMessage('Saving project metadata...');
            const { data: project, error: projectError } = await supabase
                .from('projects')
                .upsert({
                    name: repoInfo.repo,
                    github_url: url,
                    repo_name: repoInfo.repo,
                    owner: repoInfo.owner,
                    digest_text: digest
                })
                .select()
                .single();

            if (projectError) throw projectError;

            setMessage(`Analyzing requirements with ${provider === 'Ollama' ? 'MedGemma' : 'Gemini'}...`);

            // 4. Analyze Codebase (Requirements)
            const requirements = await analyzeCodebase(digest);

            // Store requirements
            if (requirements.length > 0) {
                const { error: reqError } = await supabase.from('requirements').insert(
                    requirements.map(r => ({ ...r, project_id: project.id }))
                );
                if (reqError) console.error('Error storing requirements:', reqError);
            }

            setMessage('Performing AST Deep Dive...');
            // 5. AST & Compliance
            let allFunctions: any[] = [];
            let allSecurityIssues: string[] = [];
            files.forEach(file => {
                const functions = parseCodeStructure(file.path, file.content);
                const security = detectSecurityAntiPatterns(file.content);
                allFunctions = [...allFunctions, ...functions];
                allSecurityIssues = [...allSecurityIssues, ...security];
            });

            const complianceIssues = validateCompliance(requirements, allFunctions, allSecurityIssues);

            // Store compliance issues
            if (complianceIssues.length > 0) {
                const { error: compError } = await supabase.from('compliance_issues').insert(
                    complianceIssues.map(pi => ({ ...pi, project_id: project.id }))
                );
                if (compError) console.error('Error storing compliance issues:', compError);
            }

            setRepoMetadata({
                name: repoInfo.repo,
                owner: repoInfo.owner,
                filesCount: files.length,
                reqCount: requirements.length,
                compCount: complianceIssues.length
            });

            setStatus('success');
            setMessage('Repository analyzed successfully!');
        } catch (error: any) {
            console.error(error);
            setStatus('error');
            setMessage(`Analysis failed: ${error.message || 'Unknown error'}`);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">GitHub Connector</h1>
                <p className="text-slate-500">Connect your healthcare repository for AI-powered compliance analysis.</p>
            </div>

            <div className="glass-card p-10 rounded-3xl border border-slate-200 bg-white/50 backdrop-blur-xl shadow-2xl">
                <div className="max-w-3xl mx-auto space-y-6">
                    <div className="flex flex-col items-center text-center space-y-2 mb-8">
                        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-600 mb-4">
                            <Github className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Import Repository</h2>
                        <p className="text-slate-500 text-sm">Analyze code, requirements, and compliance in one click.</p>
                    </div>

                    <div className="flex flex-col items-center gap-4 mb-4">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Select AI Engine</span>
                        <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 w-full max-w-md">
                            <button
                                onClick={() => handleProviderChange('Ollama')}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${provider === 'Ollama' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Zap className="w-4 h-4" />
                                MedGemma (Ollama)
                            </button>
                            <button
                                onClick={() => handleProviderChange('Gemini')}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${provider === 'Gemini' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Zap className="w-4 h-4 text-amber-500" />
                                Gemini 2.0 Flash
                            </button>
                        </div>
                    </div>

                    <div className="relative group">
                        <Github className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://github.com/user/repo"
                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none text-lg"
                        />
                    </div>

                    <button
                        onClick={handleConnect}
                        disabled={status === 'loading'}
                        className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white rounded-2xl font-bold text-lg shadow-lg shadow-primary-200 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                    >
                        {status === 'loading' ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                {message}
                            </>
                        ) : (
                            <>
                                <Zap className="w-6 h-6" />
                                Start AI Analysis
                            </>
                        )}
                    </button>

                    {status === 'success' && repoMetadata && (
                        <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2x border-slate-200 space-y-4 animate-in slide-in-from-top-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-emerald-700">
                                    <CheckCircle2 className="w-6 h-6" />
                                    <span className="font-bold">Analysis Complete</span>
                                </div>
                                <button
                                    onClick={() => logService.downloadLogs()}
                                    className="px-4 py-2 bg-white border border-emerald-200 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors flex items-center gap-2"
                                >
                                    <FileText className="w-4 h-4" />
                                    Download Full Logs
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
                                    <p className="text-xs text-slate-500 uppercase font-bold">Files</p>
                                    <p className="text-xl font-bold text-slate-900">{repoMetadata.filesCount}</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
                                    <p className="text-xs text-slate-500 uppercase font-bold">Requirements</p>
                                    <p className="text-xl font-bold text-slate-900">{repoMetadata.reqCount}</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
                                    <p className="text-xs text-slate-500 uppercase font-bold">Issues</p>
                                    <p className="text-xl font-bold text-rose-600">{repoMetadata.compCount}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 animate-in slide-in-from-top-4">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm font-medium">{message}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FeatureCard
                    icon={<FileText className="text-blue-500" />}
                    title="Intelligent Extraction"
                    desc="Automatically identifies REQ-* tags and implicit safety requirements."
                />
                <FeatureCard
                    icon={<ShieldCheck className="text-emerald-500" />}
                    title="Compliance Scanner"
                    desc="Checks against FDA 21 CFR Part 11, IEC 62304, and ISO standards."
                />
                <FeatureCard
                    icon={<Search className="text-purple-500" />}
                    title="Traceability Gap Analysis"
                    desc="Visually maps requirements to code and identifies untested logic."
                />
            </div>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div className="glass-card p-6 rounded-2xl border border-slate-100 bg-white hover:shadow-xl transition-all group">
        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-50 transition-colors">
            {icon}
        </div>
        <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </div>
);

export default DashboardPage;
