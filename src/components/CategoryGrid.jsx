const CATEGORY_ITEMS = [
  {
    id: 'fresh-frozen',
    label: 'Fresh &\nFrozen',
    emoji: '🧊',
    bg: 'bg-blue-50',
  },
  {
    id: 'atta-flour',
    label: 'Atta, Flour\n& Vermicelli',
    emoji: '🌾',
    bg: 'bg-yellow-50',
  },
  {
    id: 'dal-pulses',
    label: 'Dal &\nPulses',
    emoji: '🫘',
    bg: 'bg-orange-50',
  },
  {
    id: 'spices',
    label: 'Spices',
    emoji: '🌶️',
    bg: 'bg-red-50',
  },
  {
    id: 'masala',
    label: 'Masala &\nCurry',
    emoji: '✨',
    bg: 'bg-amber-50',
  },
  {
    id: 'rice-oils',
    label: 'Rice, Oils\n& Ghee',
    emoji: '🍚',
    bg: 'bg-lime-50',
  },
  {
    id: 'pickles',
    label: 'Pickles &\nChutney',
    emoji: '🥒',
    bg: 'bg-green-50',
  },
  {
    id: 'tea-coffee',
    label: 'Tea &\nCoffee',
    emoji: '☕',
    bg: 'bg-stone-50',
  },
  {
    id: 'instant-food',
    label: 'Instant\nFood Mix',
    emoji: '🍲',
    bg: 'bg-sky-50',
  },
  {
    id: 'papad-biscuits',
    label: 'Papad &\nBiscuits',
    emoji: '🍪',
    bg: 'bg-yellow-50',
  },
  {
    id: 'noodles-sauces',
    label: 'Noodles &\nSauces',
    emoji: '🍜',
    bg: 'bg-rose-50',
  },
  {
    id: 'snacks',
    label: 'Indian\nSnacks',
    emoji: '🍿',
    bg: 'bg-orange-50',
  },
  {
    id: 'sweets',
    label: 'Indian\nSweets',
    emoji: '🍬',
    bg: 'bg-pink-50',
  },
  {
    id: 'ready-to-eat',
    label: 'Ready\nTo Eat',
    emoji: '🥘',
    bg: 'bg-red-50',
  },
  {
    id: 'toiletry',
    label: 'Toiletry &\nCosmetics',
    emoji: '💄',
    bg: 'bg-purple-50',
  },
  {
    id: 'puja',
    label: 'Puja\nItems',
    emoji: '🪔',
    bg: 'bg-amber-50',
  },
  {
    id: 'household',
    label: 'Household\n& Kitchen',
    emoji: '🏠',
    bg: 'bg-teal-50',
  },
  {
    id: 'mouth-freshener',
    label: 'Mouth\nFreshener',
    emoji: '🌿',
    bg: 'bg-emerald-50',
  },
];

export default function CategoryGrid({ onCategorySelect, activeCategoryId }) {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 mt-8">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Shop by Category</h2>
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-9 lg:grid-cols-9 gap-2 sm:gap-3">
        {CATEGORY_ITEMS.map((cat) => {
          const isActive = activeCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategorySelect(cat.id)}
              type="button"
              aria-label={`Browse ${cat.label.replace(/\n/g, ' ')}`}
              className="group flex flex-col items-center gap-1.5 focus:outline-none transition-transform duration-200 hover:-translate-y-1 active:scale-95"
            >
              {/* Image placeholder card */}
              <div
                className={`w-full aspect-square rounded-xl ${cat.bg} flex items-center justify-center shadow-sm group-hover:shadow-lg group-hover:border-green-200 transition-all duration-200 ${isActive ? 'ring-2 ring-green-600 ring-offset-1' : 'border border-white'} min-h-[56px] sm:min-h-[68px]`}
              >
                {/* Placeholder: replace src with actual image when available */}
                <span className="text-3xl sm:text-4xl select-none transition-transform duration-200 group-hover:scale-110">{cat.emoji}</span>
              </div>
              {/* Label */}
              <span className={`text-center text-[10px] sm:text-xs font-medium leading-tight whitespace-pre-line min-h-[28px] sm:min-h-[32px] ${isActive ? 'text-green-700 font-semibold' : 'text-gray-700'}`}>
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
