import { FileCheck, Cpu, Lock, Award } from 'lucide-react';

const ComplianceBadges = () => {
  const badges = [
    {
      icon: FileCheck,
      title: 'FDA 21 CFR Part 11',
      description: 'Electronic records and signatures compliance for medical device software.',
    },
    {
      icon: Cpu,
      title: 'IEC 62304',
      description: 'Medical device software lifecycle processes and documentation standards.',
    },
    {
      icon: Lock,
      title: 'HIPAA',
      description: 'Healthcare data privacy and security requirements for protected health information.',
    },
    {
      icon: Award,
      title: 'ISO 13485',
      description: 'Quality management systems for medical devices manufacturing and design.',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Built for Healthcare Compliance
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            TraceLab understands the regulatory landscape and generates documentation that meets the strictest standards.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {badges.map((badge, index) => (
            <div
              key={index}
              className="bg-[#f8fafc] rounded-xl p-6 border border-gray-200 hover:border-[#2563eb] hover:shadow-lg transition-all group"
            >
              <div className="w-14 h-14 bg-[#2563eb]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#2563eb] transition-colors">
                <badge.icon className="h-7 w-7 text-[#2563eb] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{badge.title}</h3>
              <p className="text-gray-600 text-sm">{badge.description}</p>
            </div>
          ))}
        </div>

        {/* <div className="mt-12 bg-gradient-to-r from-[#2563eb]/5 via-[#2563eb]/10 to-[#2563eb]/5 rounded-2xl p-8 text-center">
          <p className="text-gray-700 font-medium">
            <span className="text-[#2563eb] font-semibold">Trusted by 50+ healthcare software teams</span>{' '}
            building FDA-regulated medical devices, diagnostic software, and health IT systems.
          </p>
        </div> */}
      </div>
    </section>
  );
};

export default ComplianceBadges;
