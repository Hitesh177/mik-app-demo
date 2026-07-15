import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import CategoryGrid from '../components/CategoryGrid';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import BannerCarousel from '../components/BannerCarousel';
import MarqueeStrip from '../components/MarqueeStrip';
import Testimonials from '../components/Testimonials';
import SeoHead from '../components/SeoHead';
import { CATEGORIES } from '../data/mockData';
import { BLOG_POSTS } from '../data/blogPosts';
import { useAdmin } from '../context/AdminContext';
import { ChevronRight, Flame, Tag, TrendingUp, Search, Sparkles, MapPin, BookOpen } from 'lucide-react';

const SECTION_CATEGORIES = CATEGORIES.filter(c => c.id !== 'all');

function RecentlyViewed() {
  const [viewed, setViewed] = useState([]);
  useEffect(() => {
    const load = () => {
      try {
        setViewed(JSON.parse(localStorage.getItem('mik_viewed') || '[]'));
      } catch {
        // Ignore malformed storage data and fall back to an empty recent list.
      }
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  if (viewed.length < 2) return null;
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between px-4 max-w-6xl mx-auto mb-3">
        <h2 className="text-base font-bold text-gray-900">Recently Viewed</h2>
      </div>
      <div className="overflow-x-auto no-scrollbar px-4">
        <div className="flex gap-3 w-max">
          {viewed.map(product => (
            <div key={product.id} className="w-36 sm:w-40 flex-none">
              <ProductCard product={product} compact />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function useCountdown() {
  const getMidnight = () => {
    const d = new Date();
    d.setHours(23, 59, 59, 0);
    return d;
  };
  const [timeLeft, setTimeLeft] = useState(() => {
    const diff = getMidnight() - Date.now();
    return { h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) };
  });
  useEffect(() => {
    const t = setInterval(() => {
      const diff = getMidnight() - Date.now();
      setTimeLeft({ h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    }, 1000);
    return () => clearInterval(t);
  }, []);
  return timeLeft;
}

function DealsOfDay({ products }) {
  const { h, m, s } = useCountdown();
  const pad = n => String(n).padStart(2, '0');
  const hotProducts = products.filter(p => p.badge === 'Hot').slice(0, 12);
  if (hotProducts.length === 0) return null;
  return (
    <section className="mt-6">
      {/* Header */}
      <div className="mx-4 max-w-6xl xl:mx-auto bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl px-4 py-3 flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame size={20} className="text-white" />
          <span className="text-white font-bold text-base">Deals of the Day</span>
          <span className="bg-white/20 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">Best Sellers</span>
        </div>
        <div className="flex items-center gap-1.5 text-white">
          <Tag size={13} />
          <span className="text-xs font-medium">Ends in</span>
          <div className="flex items-center gap-1">
            {[pad(h), pad(m), pad(s)].map((v, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="bg-white/20 text-white text-xs font-bold px-1.5 py-0.5 rounded-md min-w-[26px] text-center">{v}</span>
                {i < 2 && <span className="text-white/70 font-bold text-xs">:</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
      {/* Horizontal scroll */}
      <div className="overflow-x-auto no-scrollbar px-4">
        <div className="flex gap-3 w-max">
          {hotProducts.map(product => (
            <div key={product.id} className="w-36 sm:w-40 flex-none">
              <ProductCard product={product} compact />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PopularSearches({ products }) {
  const categoryLinks = [
    { label: 'Chana Dal', href: '/category/dal-pulses' },
    { label: 'Spices', href: '/category/spices' },
    { label: 'Ready to Eat', href: '/category/ready-to-eat' },
    { label: 'Rice & Oils', href: '/category/rice-oils' },
  ];

  const spotlightProducts = products
    .filter(product => product.badge === 'Hot' || product.badge === 'Sale' || product.badge === 'New')
    .slice(0, 6);

  if (spotlightProducts.length === 0) return null;

  return (
    <section className="mt-8 px-4 max-w-6xl mx-auto">
      <div className="rounded-3xl border border-gray-100 bg-white shadow-sm p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0">
            <Search size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Popular searches in Taiwan</p>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-1">Find Indian groceries faster</h2>
            <p className="text-sm text-gray-600 mt-2 max-w-3xl">
              Search for common grocery needs like chana dal, masala blends, ready-to-eat meals, and pantry staples.
              These links go straight to live product and category pages, which is better for shoppers and search engines.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {categoryLinks.map(link => (
            <Link
              key={link.href}
              to={link.href}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:border-green-300 hover:bg-green-50 hover:text-green-700 transition-colors"
            >
              <Sparkles size={14} />
              {link.label}
            </Link>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {spotlightProducts.map(product => (
            <Link
              key={product.id}
              to={`/product/${product.seo_slug || product.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 hover:border-amber-300 hover:bg-amber-100 transition-colors"
            >
              <MapPin size={14} />
              {product.name_en}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function BlogHighlights() {
  const posts = BLOG_POSTS.slice(0, 3);
  return (
    <section className="mt-8 px-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Shopping guides</p>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-1">Read the pages that bring shoppers from search to cart</h2>
        </div>
        <Link to="/blog" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-green-700 hover:text-green-800 transition-colors">
          Visit blog <ChevronRight size={14} />
        </Link>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {posts.map(post => (
          <Link
            key={post.slug}
            to={`/blog/${post.slug}`}
            className="group rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden"
          >
            <div className={`bg-gradient-to-br ${post.accentFrom} ${post.accentTo} text-white p-5`}>
              <div className="flex items-center justify-between gap-3">
                <span className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-2xl">{post.emoji}</span>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/15">{post.readTime}</span>
              </div>
              <h3 className="mt-4 text-xl font-black leading-tight whitespace-pre-line">{post.title}</h3>
              <p className="mt-2 text-sm text-white/80 line-clamp-3">{post.description}</p>
            </div>
            <div className="p-5 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">{post.tag}</span>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 group-hover:gap-1.5 transition-all">
                Read guide <BookOpen size={14} />
              </span>
            </div>
          </Link>
        ))}
      </div>
      <div className="sm:hidden mt-3">
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 hover:text-green-800 transition-colors">
          Visit blog <ChevronRight size={14} />
        </Link>
      </div>
    </section>
  );
}

function CategorySection({ category, products, onViewAll }) {
  // First 15 products — Hot-badged first, then rest
  const categoryProducts = products
    .filter(p => p.category === category.id)
    .sort((a, b) => (b.badge === 'Hot' ? 1 : 0) - (a.badge === 'Hot' ? 1 : 0))
    .slice(0, 15);

  if (categoryProducts.length === 0) return null;

  return (
    <section className="mt-8">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 max-w-6xl mx-auto mb-3">
        <h2 className="text-base font-bold text-gray-900">{category.name}</h2>
        <button
          onClick={() => onViewAll(category.id)}
          className="flex items-center gap-0.5 text-xs font-semibold text-green-700 hover:text-green-800 transition-colors"
        >
          see all <ChevronRight size={14} />
        </button>
      </div>

      {/* Horizontal scroll strip */}
      <div className="overflow-x-auto no-scrollbar px-4">
        <div className="flex gap-3 w-max">
          {categoryProducts.map(product => (
            <div key={product.id} className="w-36 sm:w-40 flex-none">
              <ProductCard product={product} compact />
            </div>
          ))}
          {/* "View all" card at the end */}
          <div className="w-36 sm:w-40 flex-none">
            <button
              onClick={() => onViewAll(category.id)}
              className="w-full h-full min-h-[180px] rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-green-400 hover:text-green-700 transition-colors bg-white"
            >
              <ChevronRight size={24} />
              <span className="text-xs font-semibold text-center leading-tight">View all</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { products, offers } = useAdmin();
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const seoDescription = 'Shop authentic Indian groceries in Taiwan with fast delivery, live product pages, and easy browsing for spices, dal, ready-to-eat meals, rice, oils, and more.';

  const handleSearchChange = (val) => setSearch(val);

  // When searching, show a flat filtered list instead of sections
  const searchResults = search.trim()
    ? products.filter(p =>
        p.name_en.toLowerCase().includes(search.toLowerCase()) ||
        p.name_zh.includes(search)
      )
    : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SeoHead
        title="MIK Store | Indian Grocery Delivery in Taiwan"
        description={seoDescription}
        canonical={siteUrl ? `${siteUrl}/` : undefined}
        keywords="Indian grocery Taiwan, Indian supermarket Taiwan, chana dal Taiwan, spices Taiwan, ready to eat Indian food, Indian delivery Taipei"
        ogType="website"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'MIK Store',
          url: siteUrl || undefined,
          description: seoDescription,
        }}
      />

      <Header onSearchChange={handleSearchChange} searchValue={search} searchIndex={products} />

      {/* Marquee strip */}
      {!search.trim() && <MarqueeStrip />}

      {/* Banner Carousel */}
      {!search.trim() && <BannerCarousel offers={offers} />}

      {/* Deals of the Day */}
      {!search.trim() && <DealsOfDay products={products} />}

      {/* Search results OR browse experience */}
      {searchResults ? (
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-5 pb-28">
          <p className="text-sm text-gray-500 mb-3" aria-live="polite">
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
          </p>
          {searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center" aria-live="polite">
              <span className="text-5xl mb-4">🔍</span>
              <p className="text-gray-600 font-medium">No products found</p>
              <p className="text-gray-400 text-sm mt-1">Try a different search or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {searchResults.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      ) : (
        <>
          {/* Category Grid */}
          <CategoryGrid
            onCategorySelect={(catId) => navigate(`/category/${catId}`)}
          />

          <div className="pb-28">
            {SECTION_CATEGORIES.map(category => (
              <CategorySection
                key={category.id}
                category={category}
                products={products}
                onViewAll={(catId) => navigate(`/category/${catId}`)}
              />
            ))}
          </div>
        </>
      )}

      {!search.trim() && <RecentlyViewed />}

      {/* Trending Now */}
      {!search.trim() && (
        <section className="mt-8">
          <div className="flex items-center justify-between px-4 max-w-6xl mx-auto mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" />
              <h2 className="text-base font-bold text-gray-900">Trending Now</h2>
            </div>
          </div>
          <div className="overflow-x-auto no-scrollbar px-4">
            <div className="flex gap-3 w-max">
              {[...products].sort((a, b) => b.price - a.price).slice(0, 10).map(product => (
                <div key={product.id} className="w-36 sm:w-40 flex-none">
                  <ProductCard product={product} compact />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {!search.trim() && <Testimonials />}

      {!search.trim() && <PopularSearches products={products} />}

      {!search.trim() && <BlogHighlights />}

      <Footer />
      <BottomNav active="home" />
    </div>
  );
}
