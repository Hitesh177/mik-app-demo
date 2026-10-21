import { useState, useMemo } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, SlidersHorizontal } from 'lucide-react';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import SeoHead from '../components/SeoHead';
import { useAdmin } from '../context/AdminContext';
import { isChinesePath, localizedPath } from '../lib/storeRoutes';
import { searchProducts } from '../lib/search';

const SORT_OPTIONS = [
  { value: 'default',    label: 'Default' },
  { value: 'price-asc',  label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'hot',        label: '🔥 Best Sellers' },
];

const SORT_OPTIONS_ZH = [
  { value: 'default', label: '預設排序' },
  { value: 'price-asc', label: '價格：低至高' },
  { value: 'price-desc', label: '價格：高至低' },
  { value: 'hot', label: '熱銷商品' },
];

const CATEGORY_NAMES_ZH = {
  'fresh-frozen': '新鮮與冷凍食品',
  'atta-flour': '印度麵粉、麵粉與粉絲',
  'dal-pulses': '印度豆類與扁豆',
  spices: '香料',
  masala: '綜合香料與咖哩',
  'rice-oils': '米、食用油與酥油',
  pickles: '醃菜與酸辣醬',
  'tea-coffee': '茶與咖啡',
  'instant-food': '即食調理包',
  'papad-biscuits': '印度脆餅與餅乾',
  'noodles-sauces': '麵食與醬料',
  snacks: '印度零食',
  sweets: '印度甜點',
  'ready-to-eat': '即食食品',
  toiletry: '盥洗與美容用品',
  puja: '印度祭祀用品',
  household: '居家與廚房用品',
  'mouth-freshener': '口氣清新用品',
};

export default function CategoryPage({ categoryIdOverride }) {
  const { categoryId: routeCategoryId, collectionSlug } = useParams();
  const categoryId = categoryIdOverride || routeCategoryId || collectionSlug;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isZh = isChinesePath(pathname);
  const { categories, products: catalogProducts } = useAdmin();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('default');
  const [inStockOnly, setInStockOnly] = useState(false);
  const category = categories.find(item => item.slug === categoryId || item.id === categoryId);
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const canonicalPath = typeof window !== 'undefined' ? window.location.pathname : `/category/${categoryId}`;
  const categoryName = isZh
    ? category?.name || CATEGORY_NAMES_ZH[categoryId] || categoryId
    : category?.name || categoryId;

  const products = useMemo(() => {
    let list = catalogProducts.filter(product => category
      ? product.collection_ids?.includes(category.id)
      : product.category === categoryId);
    if (search.trim()) {
      list = searchProducts(list, search, () => categoryName);
    }
    if (inStockOnly) list = list.filter(p => p.stock > 0);
    if (sort === 'price-asc')  list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    if (sort === 'hot') list = [...list].sort((a, b) => (b.badge === 'Hot' ? 1 : 0) - (a.badge === 'Hot' ? 1 : 0));
    return list;
  }, [catalogProducts, category, categoryId, categoryName, search, sort, inStockOnly]);

  const handleSearchChange = (val) => setSearch(val);
  const seoDescription = isZh
    ? `在台灣選購${categoryName}，查看 Wix 商店同步的商品照片、名稱、介紹、庫存與價格。提供台北及全台配送。`
    : `Browse ${categoryName} in Taiwan with live product photos, fast delivery, and Indian grocery essentials for modern shoppers in Taipei and beyond.`;
  const itemList = products.slice(0, 12).map((product, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: product.name_en,
    url: siteUrl ? `${siteUrl}${localizedPath(product.legacy_path || `/product-page/${product.seo_slug || product.id}`, isZh)}` : undefined,
  }));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SeoHead
        title={isZh ? `${categoryName}｜台灣印度食品雜貨 MIK Store` : `${categoryName} Indian Groceries in Taiwan | MIK Store`}
        description={seoDescription}
        canonical={siteUrl ? `${siteUrl}${canonicalPath}` : undefined}
        keywords={`${categoryName}, Indian grocery Taiwan, Taiwan delivery, ${categoryName} products`}
        ogType="website"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `${categoryName} products`,
          url: siteUrl ? `${siteUrl}${canonicalPath}` : undefined,
          numberOfItems: products.length,
          itemListElement: itemList,
        }}
      />

      <Header onSearchChange={handleSearchChange} searchValue={search} searchIndex={catalogProducts} />

      {/* Category header */}
      <div className="max-w-6xl w-full mx-auto px-4 pt-4 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-3 transition-colors"
        >
          <ChevronLeft size={16} />
          {isZh ? '返回' : 'Back'}
        </button>
        <h1 className="text-xl font-bold text-gray-900">
          {categoryName}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {isZh ? `共 ${products.length} 項商品，可配送至全台` : `${products.length} products available for fast delivery in Taiwan`}
        </p>
        <p className="text-xs text-gray-400 mt-1 max-w-2xl">
          {isZh
            ? '搜尋此分類、依價格或熱銷程度排序，並開啟商品頁查看照片、詳細資訊與購買選項。'
            : 'Search this aisle, sort by price or best sellers, and open the live product pages for more photos, details, and quick add-to-cart actions.'}
        </p>
      </div>

      {/* Sticky filter/sort bar */}
      <div className="sticky top-[57px] z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <SlidersHorizontal size={14} className="text-gray-400 flex-shrink-0" />
          {(isZh ? SORT_OPTIONS_ZH : SORT_OPTIONS).map(opt => (
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
            {isZh ? '僅顯示有庫存' : 'In Stock Only'}
          </button>
        </div>
      </div>

      {/* Product grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-5 pb-28">
        {search && (
          <p className="text-sm text-gray-500 mb-3" aria-live="polite">
            {isZh ? `「${search}」共有 ${products.length} 項結果` : <>{products.length} result{products.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;</>}
          </p>
        )}

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center" aria-live="polite">
            <span className="text-5xl mb-4">🔍</span>
            <p className="text-gray-600 font-medium">{isZh ? '找不到商品' : 'No products found'}</p>
            <p className="text-gray-400 text-sm mt-1">{isZh ? '請嘗試其他關鍵字或分類' : 'Try a different search or category'}</p>
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
