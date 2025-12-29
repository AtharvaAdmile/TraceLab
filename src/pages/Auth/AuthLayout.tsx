import type { ReactNode } from 'react';
import { Activity } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#2563eb] via-[#1d4ed8] to-[#1e40af] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        {/* Decorative Circles */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-start p-12 lg:p-16">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">TraceLab</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            Healthcare Compliance,
            <br />
            <span className="text-blue-200">Simplified.</span>
          </h1>

          <p className="text-lg text-blue-100 max-w-md leading-relaxed mb-10">
            AI-powered traceability and compliance analysis for medical device software. 
            Meet FDA, IEC 62304, and ISO standards with confidence.
          </p>

          {/* Feature List */}
          <ul className="space-y-4">
            {[
              'Automated requirement extraction',
              'Real-time compliance monitoring',
              'Complete audit trail',
            ].map((feature, idx) => (
              <li key={idx} className="flex items-center gap-3 text-blue-100">
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 bg-slate-50">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center gap-3 p-6 bg-[#2563eb]">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">TraceLab</span>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
