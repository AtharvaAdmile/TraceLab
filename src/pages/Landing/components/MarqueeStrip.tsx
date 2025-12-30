const MarqueeStrip = () => {
  const techStack = [
    'React 19',
    'TypeScript',
    'Vite',
    'Tailwind CSS',
    'Google Gemini AI',
    'Supabase',
    'MedGemma (Ollama)',
    'Document & PDF AI',
    'Recharts',
    'Lucide Icons',
    'Firebase'
  ];

  return (
    <div className="bg-[#2563eb] py-4 overflow-hidden border-y border-white/10">
      <div className="flex animate-marquee whitespace-nowrap">
        {/* First set of items */}
        {techStack.map((tech, index) => (
          <span
            key={index}
            className="text-white font-semibold text-lg mx-8 flex items-center gap-2 font-heading tracking-tight"
          >
            {tech} <span className="text-white/40">•</span>
          </span>
        ))}
        {/* Duplicate set for seamless looping */}
        {techStack.map((tech, index) => (
          <span
            key={`duplicate-${index}`}
            className="text-white font-semibold text-lg mx-8 flex items-center gap-2 font-heading tracking-tight"
          >
            {tech} <span className="text-white/40">•</span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          display: flex;
          width: fit-content;
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default MarqueeStrip;

