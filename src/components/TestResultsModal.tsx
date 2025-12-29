import { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Terminal,
  FileCode,
  GitBranch,
  Package
} from 'lucide-react';

export interface TestResult {
  status: 'passed' | 'failed' | 'error' | 'running';
  message: string;
  results?: {
    passed: number;
    failed: number;
    errors: number;
    skipped?: number;
    total?: number;
  };
  testName?: string;
  repoUrl?: string;
  dependencies?: string[];
  duration?: string;
}

interface TestResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TestResult | null;
  logs: string[];
  isRunning: boolean;
}

const TestResultsModal = ({ isOpen, onClose, result, logs, isRunning }: TestResultsModalProps) => {
  const [showLogs, setShowLogs] = useState(false);

  if (!isOpen) return null;

  const getStatusIcon = () => {
    if (isRunning) {
      return <Clock className="w-8 h-8 text-blue-500 animate-pulse" />;
    }
    switch (result?.status) {
      case 'passed':
        return <CheckCircle2 className="w-8 h-8 text-green-500" />;
      case 'failed':
        return <XCircle className="w-8 h-8 text-red-500" />;
      case 'error':
        return <AlertTriangle className="w-8 h-8 text-amber-500" />;
      default:
        return <Clock className="w-8 h-8 text-slate-400" />;
    }
  };

  const getStatusColor = () => {
    if (isRunning) return 'bg-blue-50 border-blue-200';
    switch (result?.status) {
      case 'passed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'error':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const getStatusText = () => {
    if (isRunning) return 'Running Tests...';
    switch (result?.status) {
      case 'passed':
        return 'All Tests Passed';
      case 'failed':
        return 'Some Tests Failed';
      case 'error':
        return 'Execution Error';
      default:
        return 'Unknown Status';
    }
  };

  const getStatusTextColor = () => {
    if (isRunning) return 'text-blue-700';
    switch (result?.status) {
      case 'passed':
        return 'text-green-700';
      case 'failed':
        return 'text-red-700';
      case 'error':
        return 'text-amber-700';
      default:
        return 'text-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-xl">
              <FileCode className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Test Execution Results</h2>
              {result?.testName && (
                <p className="text-sm text-slate-500">{result.testName}</p>
              )}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Status Banner */}
        <div className={`mx-5 mt-5 p-6 rounded-2xl border-2 ${getStatusColor()} flex items-center gap-4`}>
          {getStatusIcon()}
          <div className="flex-1">
            <h3 className={`text-xl font-bold ${getStatusTextColor()}`}>
              {getStatusText()}
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              {result?.message || (isRunning ? 'Please wait while tests are executing...' : 'No results available')}
            </p>
          </div>
          {isRunning && (
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* Results Grid */}
        {result?.results && !isRunning && (
          <div className="grid grid-cols-4 gap-3 p-5">
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{result.results.passed}</div>
              <div className="text-xs font-semibold text-green-700 uppercase tracking-wider mt-1">Passed</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-red-600">{result.results.failed}</div>
              <div className="text-xs font-semibold text-red-700 uppercase tracking-wider mt-1">Failed</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-amber-600">{result.results.errors}</div>
              <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mt-1">Errors</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-slate-600">{result.results.skipped || 0}</div>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mt-1">Skipped</div>
            </div>
          </div>
        )}

        {/* Meta Info */}
        {(result?.repoUrl || result?.dependencies) && (
          <div className="px-5 pb-3">
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              {result.repoUrl && (
                <div className="flex items-center gap-2 text-sm">
                  <GitBranch className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Repository:</span>
                  <a 
                    href={result.repoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline truncate"
                  >
                    {result.repoUrl}
                  </a>
                </div>
              )}
              {result.dependencies && result.dependencies.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <Package className="w-4 h-4 text-slate-400 mt-0.5" />
                  <span className="text-slate-600">Dependencies:</span>
                  <div className="flex flex-wrap gap-1">
                    {result.dependencies.map((dep, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white rounded text-xs text-slate-700 border border-slate-200">
                        {dep}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Logs Section */}
        <div className="px-5 pb-5 flex-1 overflow-hidden flex flex-col min-h-0">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center justify-between w-full py-3 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Execution Logs ({logs.length} lines)
            </div>
            {showLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showLogs && (
            <div className="flex-1 bg-slate-900 rounded-xl p-4 overflow-auto font-mono text-xs min-h-[200px] max-h-[300px]">
              {logs.length === 0 ? (
                <div className="text-slate-500 text-center py-8">No logs yet...</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="py-0.5">
                    <span className="text-slate-600 select-none mr-2">{String(i + 1).padStart(3, '0')}</span>
                    <span className={
                      log.startsWith('> ') ? 'text-yellow-400' :
                      log.startsWith('[ERROR]') ? 'text-red-400' :
                      log.startsWith('[STATUS]') ? 'text-blue-400' :
                      log.includes('PASSED') ? 'text-green-400' :
                      log.includes('FAILED') ? 'text-red-400' :
                      log.startsWith('✅') || log.startsWith('🔗') || log.startsWith('📦') || log.startsWith('📁') || log.startsWith('🧪') ? 'text-emerald-400' :
                      'text-slate-300'
                    }>
                      {log}
                    </span>
                  </div>
                ))
              )}
              <div id="terminal-end" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          {!isRunning && (
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
            >
              Close
            </button>
          )}
          {isRunning && (
            <div className="text-sm text-slate-500 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              Tests are running...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestResultsModal;
