const ITEMS = [
  '🚚 Free delivery on orders NT$999+',
  '🌶️ 200+ authentic Indian products',
  '🇮🇳 Direct import from India',
  '⭐ Trusted by 1000+ customers in Taiwan',
  '📦 Fast island-wide delivery',
  '🎉 Use code MIK10 for 10% off first order',
  '☕ Taj Mahal, Wagh Bakri, MTR & more',
  '🥘 Ready-to-eat meals in minutes',
];

export default function MarqueeStrip() {
  const text = [...ITEMS, ...ITEMS]; // duplicate for seamless loop
  return (
    <div className="bg-green-700 overflow-hidden py-2">
      <div className="flex animate-marquee whitespace-nowrap">
        {text.map((item, i) => (
          <span key={i} className="inline-flex items-center text-white text-xs font-medium px-6 gap-2 flex-shrink-0">
            {item}
            <span className="text-green-400 mx-2">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
