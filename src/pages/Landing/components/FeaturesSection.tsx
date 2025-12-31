import { TestTube2, Shield, GitBranch, CheckCircle2 } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: TestTube2,
      role: 'QA Engineers',
      title: 'Stop Writing Test Cases Manually',
      description: 'Let AI analyze your codebase and generate comprehensive test cases that actually reflect your implementation.',
      bullets: [
        'Auto-generate test cases from code analysis',
        'Map tests to requirements automatically',
        'Export to your existing test frameworks',
        'Keep documentation in sync with code changes',
      ],
      color: 'blue',
    },
    {
      icon: Shield,
      role: 'Regulatory Affairs',
      title: 'Walk Into Audits Confident',
      description: 'Always-current documentation that proves your software validation is complete and traceable.',
      bullets: [
        'FDA 21 CFR Part 11 compliant exports',
        'Complete traceability matrices',
        'Audit trail for all changes',
        'One-click compliance reports',
      ],
      color: 'green',
    },
    {
      icon: GitBranch,
      role: 'Development Teams',
      title: 'Catch Compliance Issues Before Merge',
      description: 'Integrate compliance checks into your CI/CD pipeline to prevent documentation debt from accumulating.',
      bullets: [
        'GitHub integration for PR checks',
        'Real-time coverage analysis',
        'Automated gap detection',
        'Developer-friendly workflow',
      ],
      color: 'purple',
    },
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      iconBg: 'bg-[#2563eb]',
      bullet: 'text-[#2563eb]',
    },
    green: {
      bg: 'bg-green-50',
      iconBg: 'bg-green-600',
      bullet: 'text-green-600',
    },
    purple: {
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-600',
      bullet: 'text-purple-600',
    },
  };

  return (
    <section id="features" className="py-20 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Built for Every Role in Healthcare Software
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            From engineers to regulatory teams, TraceLab streamlines compliance for everyone.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const colors = colorClasses[feature.color as keyof typeof colorClasses];
            return (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className={`${colors.bg} p-6`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`${colors.iconBg} w-10 h-10 rounded-lg flex items-center justify-center`}>
                      <feature.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      For {feature.role}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
                <div className="p-6">
                  <ul className="space-y-3">
                    {feature.bullets.map((bullet, bulletIndex) => (
                      <li key={bulletIndex} className="flex items-start gap-3">
                        <CheckCircle2 className={`h-5 w-5 ${colors.bullet} flex-shrink-0 mt-0.5`} />
                        <span className="text-gray-700">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`${colors.bg} h-32 mx-6 mb-6 rounded-lg flex items-center justify-center overflow-hidden relative`}>
                  <img
                    src={index === 0 ? '/src/assets/qa-illustration.svg' : index === 1 ? '/src/assets/regulatory-illustration.svg' : '/src/assets/dev-illustration.svg'}
                    alt={`${feature.role} illustration`}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
