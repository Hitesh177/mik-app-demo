import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import SeoHead from '../components/SeoHead';
import { useState } from 'react';
import { useAdmin } from '../context/AdminContext';

const CATEGORIES = [
  { id: 'fresh-frozen',     label: 'Fresh & Frozen',        emoji: '🧊', bg: 'bg-blue-50',    border: 'border-blue-100' },
  { id: 'atta-flour',       label: 'Atta, Flour & Vermicelli', emoji: '🌾', bg: 'bg-yellow-50', border: 'border-yellow-100' },
  { id: 'dal-pulses',       label: 'Dal & Pulses',          emoji: '🫘', bg: 'bg-orange-50',  border: 'border-orange-100' },
  { id: 'spices',           label: 'Spices',                emoji: '🌶️', bg: 'bg-red-50',     border: 'border-red-100' },
  { id: 'masala',           label: 'Masala & Curry',        emoji: '✨', bg: 'bg-amber-50',   border: 'border-amber-100' },
  { id: 'rice-oils',        label: 'Rice, Oils & Ghee',     emoji: '🍚', bg: 'bg-lime-50',    border: 'border-lime-100' },
  { id: 'pickles',          label: 'Pickles & Chutney',     emoji: '🥒', bg: 'bg-green-50',   border: 'border-green-100' },
  { id: 'tea-coffee',       label: 'Tea & Coffee',          emoji: '☕', bg: 'bg-stone-50',   border: 'border-stone-100' },
  { id: 'instant-food',     label: 'Instant Food Mix',      emoji: '🍲', bg: 'bg-sky-50',     border: 'border-sky-100' },
  { id: 'papad-biscuits',   label: 'Papad & Biscuits',      emoji: '🍪', bg: 'bg-yellow-50',  border: 'border-yellow-100' },
  { id: 'noodles-sauces',   label: 'Noodles & Sauces',      emoji: '🍜', bg: 'bg-rose-50',    border: 'border-rose-100' },
  { id: 'snacks',           label: 'Indian Snacks',         emoji: '🍿', bg: 'bg-orange-50',  border: 'border-orange-100' },
  { id: 'sweets',           label: 'Indian Sweets',         emoji: '🍬', bg: 'bg-pink-50',    border: 'border-pink-100' },
  { id: 'ready-to-eat',     label: 'Ready To Eat',          emoji: '🥘', bg: 'bg-red-50',     border: 'border-red-100' },
  { id: 'toiletry',         label: 'Toiletry & Cosmetics',  emoji: '💄', bg: 'bg-purple-50',  border: 'border-purple-100' },
  { id: 'puja',             label: 'Puja Items',            emoji: '🪔', bg: 'bg-amber-50',   border: 'border-amber-100' },
  { id: 'household',        label: 'Household & Kitchen',   emoji: '🏠', bg: 'bg-teal-50',    border: 'border-teal-100' },
  { id: 'mouth-freshener',  label: 'Mouth Freshener',       emoji: '🌿', bg: 'bg-emerald-50', border: 'border-emerald-100' },
];

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { products } = useAdmin();
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const seoDescription = 'Browse all Indian grocery categories in Taiwan, from spices and dal to ready-to-eat meals, rice, oils, snacks, sweets, and household staples.';

  const filtered = search.trim()
    ? CATEGORIES.filter(c => c.label.toLowerCase().includes(search.toLowerCase()))
    : CATEGORIES;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SeoHead
        title="All Indian Grocery Categories in Taiwan | MIK Store"
        description={seoDescription}
        canonical={siteUrl ? `${siteUrl}/categories` : undefined}
        keywords="Indian grocery categories, Taiwan grocery shop, spices, dal, ready to eat, rice oils, Indian snacks"
        ogType="website"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'All Indian Grocery Categories',
          url: siteUrl ? `${siteUrl}/categories` : undefined,
          description: seoDescription,
        }}
      />

      <Header onSearchChange={setSearch} searchValue={search} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 pt-6 pb-28">
        <h1 className="text-xl font-bold text-gray-900 mb-1">All Categories</h1>
        <p className="text-sm text-gray-500 mb-2">{CATEGORIES.length} categories available</p>
        <p className="text-xs text-gray-400 mb-6 max-w-3xl">
          Use this page to jump into the aisle you need. Each category opens a focused product page instead of repeating the full catalog.
        </p>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">🔍</span>
            <p className="text-gray-600 font-medium">No categories found</p>
            <p className="text-gray-400 text-sm mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filtered.map(cat => {
              const count = products.filter(p => p.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/category/${cat.id}`)}
                  className={`flex flex-col items-center gap-3 p-4 rounded-2xl border ${cat.bg} ${cat.border} hover:shadow-md active:scale-95 transition-all duration-150 text-left group`}
                >
                  <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                    <span className="text-3xl select-none">{cat.emoji}</span>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-800 leading-tight">{cat.label}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{count} items</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
      <BottomNav active="categories" />
    </div>
  );
}
