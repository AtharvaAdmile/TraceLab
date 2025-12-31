import { Github, Brain, FileOutput, ArrowRight } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      icon: Github,
      title: 'Connect',
      subtitle: 'Paste Your GitHub URL',
      description: 'Simply paste your repository URL. TraceLab securely connects to analyze your codebase structure and extract relevant information.',
      details: ['Public or private repos', 'OAuth authentication', 'No code storage'],
    },
    {
      number: 2,
      icon: Brain,
      title: 'AI Analyzes',
      subtitle: 'Extract Requirements & Test Cases',
      description: 'Our AI engine parses your code, identifies functional requirements, and generates comprehensive test cases with full traceability.',
      details: ['Code-to-requirement mapping', 'Test case generation', 'Gap detection'],
    },
    {
      number: 3,
      icon: FileOutput,
      title: 'Get Results',
      subtitle: 'Export Compliance Reports',
      description: 'Download audit-ready documentation including test cases, traceability matrices, and compliance reports in your preferred format.',
      details: ['PDF & Excel exports', 'Traceability matrices', 'Audit-ready format'],
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            From GitHub to FDA-compliant documentation in three simple steps.
          </p>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-[#2563eb]/20 via-[#2563eb] to-[#2563eb]/20" />
          
          <div className="grid lg:grid-cols-3 gap-8 relative">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 h-full hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-16 h-16 bg-[#2563eb] rounded-xl flex items-center justify-center">
                      <step.icon className="h-8 w-8 text-white" />
                    </div>
                    <span className="text-5xl font-bold text-[#2563eb]/10">
                      {step.number.toString().padStart(2, '0')}
                    </span>
                  </div>

                  <div className="mb-4">
                    <span className="text-[#2563eb] font-semibold text-sm uppercase tracking-wide">
                      Step {step.number}
                    </span>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{step.title}</h3>
                    <p className="text-gray-600 font-medium">{step.subtitle}</p>
                  </div>

                  <p className="text-gray-600 mb-6">{step.description}</p>

                  <ul className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-[#2563eb] rounded-full" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>

                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-24 -right-4 z-10 w-8 h-8 bg-white rounded-full shadow-md items-center justify-center border border-gray-100">
                    <ArrowRight className="h-4 w-4 text-[#2563eb]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* <div className="mt-12 text-center">
          <button className="px-8 py-4 bg-[#2563eb] text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
            Try It Now — It's Free
            <ArrowRight className="h-5 w-5" />
          </button>
        </div> */}
      </div>
    </section>
  );
};

export default HowItWorks;
