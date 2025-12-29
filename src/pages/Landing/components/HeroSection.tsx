import { Link } from 'react-router-dom';
import { Play, ArrowRight, FileSpreadsheet, LayoutDashboard, AlertTriangle, CheckCircle } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="pt-24 pb-16 bg-gradient-to-b from-[#f8fafc] to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Turn GitHub Repos into{' '}
            <span className="text-[#2563eb]">FDA-Compliant Test Suites</span>{' '}
            in 60 Seconds
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Automate your healthcare QA compliance. Generate test cases, traceability matrices, 
            and audit-ready documentation from your codebase—powered by AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/auth/signup" 
              className="px-8 py-4 bg-[#2563eb] text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5" />
            </Link>
            <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold text-lg hover:border-[#2563eb] hover:text-[#2563eb] transition-colors flex items-center justify-center gap-2">
              <Play className="h-5 w-5" />
              Watch Demo
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 relative">
            <div className="absolute -top-3 left-4 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              Before
            </div>
            <div className="pt-4">
              <div className="flex items-center gap-3 mb-4">
                <FileSpreadsheet className="h-10 w-10 text-gray-400" />
                <div>
                  <p className="font-semibold text-gray-900">Manual Excel Chaos</p>
                  <p className="text-sm text-gray-500">Last updated: 3 months ago</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full" />
                  <span className="text-sm text-gray-600">Missing traceability links</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-400 rounded-full" />
                  <span className="text-sm text-gray-600">Outdated test cases</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                  <span className="text-sm text-gray-600">Version control nightmare</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full" />
                  <span className="text-sm text-gray-600">Audit anxiety</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-[#2563eb]/20 p-6 relative ring-2 ring-[#2563eb]/10">
            <div className="absolute -top-3 left-4 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              After
            </div>
            <div className="pt-4">
              <div className="flex items-center gap-3 mb-4">
                <LayoutDashboard className="h-10 w-10 text-[#2563eb]" />
                <div>
                  <p className="font-semibold text-gray-900">TraceLab Dashboard</p>
                  <p className="text-sm text-green-600">Always in sync</p>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm text-gray-700">Full traceability matrix</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm text-gray-700">AI-generated test cases</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm text-gray-700">Real-time compliance reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm text-gray-700">Audit-ready exports</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
