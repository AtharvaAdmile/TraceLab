const MarqueeStrip = () => {
  const text = 'Our Technology +';
  const items = Array(12).fill(text);

  return (
    <div className="bg-[#2563eb] py-4 overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap">
        {items.map((item, index) => (
          <span
            key={index}
            className="text-white font-semibold text-lg mx-8 flex items-center gap-2"
          >
            {item}
          </span>
        ))}
        {items.map((item, index) => (
          <span
            key={`duplicate-${index}`}
            className="text-white font-semibold text-lg mx-8 flex items-center gap-2"
          >
            {item}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default MarqueeStrip;
