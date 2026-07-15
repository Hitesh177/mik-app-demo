import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, SlidersHorizontal } from 'lucide-react';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import SeoHead from '../components/SeoHead';
import { PRODUCTS, CATEGORIES } from '../data/mockData';

const SORT_OPTIONS = [
  { value: 'default',    label: 'Default' },
  { value: 'price-asc',  label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'hot',        label: '🔥 Best Sellers' },
];

export default function CategoryPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('default');
  const [inStockOnly, setInStockOnly] = useState(false);
  const category = CATEGORIES.find(c => c.id === categoryId);
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const categoryName = category ? category.name : categoryId;

  const products = useMemo(() => {
    let list = PRODUCTS.filter(p => p.category === categoryId);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name_en.toLowerCase().includes(q) ||
        p.name_zh.includes(q)
      );
    }
    if (inStockOnly) list = list.filter(p => p.stock > 0);
    if (sort === 'price-asc')  list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    if (sort === 'hot') list = [...list].sort((a, b) => (b.badge === 'Hot' ? 1 : 0) - (a.badge === 'Hot' ? 1 : 0));
    return list;
  }, [categoryId, search, sort, inStockOnly]);

  const handleSearchChange = (val) => setSearch(val);
  const seoDescription = `Browse ${categoryName} in Taiwan with live product photos, fast delivery, and Indian grocery essentials for modern shoppers in Taipei and beyond.`;
  const itemList = products.slice(0, 12).map((product, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: product.name_en,
    url: siteUrl ? `${siteUrl}/product/${product.seo_slug || product.id}` : undefined,
  }));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SeoHead
        title={`${categoryName} Indian Groceries in Taiwan | MIK Store`}
        description={seoDescription}
        canonical={siteUrl ? `${siteUrl}/category/${categoryId}` : undefined}
        keywords={`${categoryName}, Indian grocery Taiwan, Taiwan delivery, ${categoryName} products`}
        ogType="website"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `${categoryName} products`,
          url: siteUrl ? `${siteUrl}/category/${categoryId}` : undefined,
          numberOfItems: products.length,
          itemListElement: itemList,
        }}
      />

      <Header onSearchChange={handleSearchChange} searchValue={search} searchIndex={PRODUCTS} />

      {/* Category header */}
      <div className="max-w-6xl w-full mx-auto px-4 pt-4 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-3 transition-colors"
        >
          <ChevronLeft size={16} />
          Back
        </button>
        <h1 className="text-xl font-bold text-gray-900">
          {categoryName}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{products.length} products available for fast delivery in Taiwan</p>
        <p className="text-xs text-gray-400 mt-1 max-w-2xl">
          Search this aisle, sort by price or best sellers, and open the live product pages for more photos, details, and quick add-to-cart actions.
        </p>
      </div>

      {/* Sticky filter/sort bar */}
      <div className="sticky top-[57px] z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <SlidersHorizontal size={14} className="text-gray-400 flex-shrink-0" />
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                sort === opt.value
                  ? 'bg-green-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => setInStockOnly(v => !v)}
            className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
              inStockOnly
                ? 'bg-green-700 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            In Stock Only
          </button>
        </div>
      </div>

      {/* Product grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-5 pb-28">
        {search && (
          <p className="text-sm text-gray-500 mb-3" aria-live="polite">
            {products.length} result{products.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
          </p>
        )}

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center" aria-live="polite">
            <span className="text-5xl mb-4">🔍</span>
            <p className="text-gray-600 font-medium">No products found</p>
            <p className="text-gray-400 text-sm mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
      <BottomNav active="categories" />
    </div>
  );
}
