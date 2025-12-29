import { Clock, FileX, AlertOctagon, DollarSign, ArrowRight, Check, X } from 'lucide-react';

const ProblemSection = () => {
  const painPoints = [
    {
      icon: Clock,
      title: 'Hours Wasted Weekly',
      description: 'Engineers spend 10+ hours per week manually writing and updating test documentation.',
    },
    {
      icon: FileX,
      title: 'Documentation Drift',
      description: 'Test cases fall out of sync with code changes, creating compliance gaps.',
    },
    {
      icon: AlertOctagon,
      title: 'Audit Failures',
      description: '68% of FDA warning letters cite inadequate software validation documentation.',
    },
    {
      icon: DollarSign,
      title: 'Delayed Releases',
      description: 'Compliance bottlenecks add weeks to every product release cycle.',
    },
  ];

  const comparisonData = [
    { aspect: 'Test Case Creation', manual: '4-8 hours per feature', traceLab: '60 seconds' },
    { aspect: 'Traceability Matrix', manual: 'Manual Excel updates', traceLab: 'Auto-generated' },
    { aspect: 'Documentation Sync', manual: 'Always outdated', traceLab: 'Real-time sync' },
    { aspect: 'Audit Preparation', manual: '2-4 weeks', traceLab: 'Always ready' },
    { aspect: 'Coverage Gaps', manual: 'Discovered in audits', traceLab: 'Caught immediately' },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Manual Compliance Testing is{' '}
            <span className="text-red-600">Killing Your Velocity</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Healthcare software teams are drowning in documentation debt while trying to move fast.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {painPoints.map((point, index) => (
            <div
              key={index}
              className="bg-[#f8fafc] rounded-xl p-6 border border-gray-100 hover:border-red-200 hover:bg-red-50/30 transition-colors"
            >
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <point.icon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{point.title}</h3>
              <p className="text-gray-600 text-sm">{point.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#f8fafc] rounded-2xl p-8 border border-gray-200">
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className="text-lg font-semibold text-gray-500">Manual Way</span>
            <ArrowRight className="h-5 w-5 text-[#2563eb]" />
            <span className="text-lg font-semibold text-[#2563eb]">TraceLab</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-900">Aspect</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-500">Manual Way</th>
                  <th className="text-left py-4 px-4 font-semibold text-[#2563eb]">TraceLab</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr key={index} className="border-b border-gray-100 last:border-0">
                    <td className="py-4 px-4 font-medium text-gray-900">{row.aspect}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                        <span className="text-gray-600">{row.manual}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-900 font-medium">{row.traceLab}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
