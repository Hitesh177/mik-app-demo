import { useLocation, useNavigate } from 'react-router-dom';
import { categoryPath, isChinesePath, localizedPath } from '../lib/storeRoutes';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import SeoHead from '../components/SeoHead';
import CategoryArtwork from '../components/CategoryArtwork';
import { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { sortCategoriesWithOthersLast } from '../lib/categoryOrdering';

export default function CategoriesPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isZh = isChinesePath(pathname);
  const [search, setSearch] = useState('');
  const { categories } = useAdmin();
  const visibleCategories = sortCategoriesWithOthersLast(
    categories.filter(category => category.visible !== false && category.slug !== 'all-products'),
  );
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const seoDescription = isZh
    ? '瀏覽台灣 MIK Store 的所有印度食品雜貨分類，包括香料、豆類、即食食品、米、食用油、零食、甜點與居家用品。'
    : 'Browse all Indian grocery categories in Taiwan, from spices and dal to ready-to-eat meals, rice, oils, snacks, sweets, and household staples.';

  const filtered = search.trim()
    ? visibleCategories.filter(category => category.name.toLowerCase().includes(search.toLowerCase()))
    : visibleCategories;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SeoHead
        title={isZh ? '印度食品雜貨分類｜台灣 MIK Store' : 'All Indian Grocery Categories in Taiwan | MIK Store'}
        description={seoDescription}
        canonical={siteUrl ? `${siteUrl}${pathname}` : undefined}
        keywords="Indian grocery categories, Taiwan grocery shop, spices, dal, ready to eat, rice oils, Indian snacks"
        ogType="website"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: isZh ? '所有印度食品雜貨分類' : 'All Indian Grocery Categories',
          url: siteUrl ? `${siteUrl}${pathname}` : undefined,
          description: seoDescription,
        }}
      />

      <Header onSearchChange={setSearch} searchValue={search} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 pt-6 pb-28">
        <h1 className="text-xl font-bold text-gray-900 mb-1">{isZh ? '所有分類' : 'All Categories'}</h1>
        <p className="text-sm text-gray-500 mb-2">{isZh ? `共 ${visibleCategories.length} 個分類` : `${visibleCategories.length} categories available`}</p>
        <p className="text-xs text-gray-400 mb-6 max-w-3xl">
          {isZh ? '選擇需要的商品分類。每個分類頁只顯示相關商品，不會重複整個目錄。' : 'Use this page to jump into the aisle you need. Each category opens a focused product page instead of repeating the full catalog.'}
        </p>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">🔍</span>
            <p className="text-gray-600 font-medium">{isZh ? '找不到分類' : 'No categories found'}</p>
            <p className="text-gray-400 text-sm mt-1">{isZh ? '請嘗試其他關鍵字' : 'Try a different search term'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filtered.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => navigate(localizedPath(cat.path || categoryPath(cat.slug), isZh))}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-gray-100 bg-white hover:shadow-md active:scale-95 transition-all duration-150 text-left group"
                >
                  <div className="w-20 h-20 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow overflow-hidden">
                    <CategoryArtwork categoryId={cat.slug} label={cat.name} imageUrl={cat.image_url} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-800 leading-tight">{cat.name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{isZh ? `${cat.product_count} 項商品` : `${cat.product_count} items`}</p>
                  </div>
                </button>
              ))}
          </div>
        )}
      </main>

      <Footer />
      <BottomNav active="categories" />
    </div>
  );
}
