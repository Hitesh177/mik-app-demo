import { useRef } from 'react';
import { CATEGORIES } from '../data/mockData';

export default function CategoryTabs({ activeCategory, onChange }) {
  const scrollRef = useRef(null);

  return (
    <div className="bg-white border-b border-gray-100 sticky top-[88px] z-30">
      <div
        ref={scrollRef}
        className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide max-w-6xl mx-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors
              ${activeCategory === cat.id
                ? 'bg-green-700 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
