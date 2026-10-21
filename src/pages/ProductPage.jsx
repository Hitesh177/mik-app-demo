import { useMemo } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BadgePercent, Heart, ShieldCheck, ShoppingBag, Star, Truck } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import ProductCard from '../components/ProductCard';
import SeoHead from '../components/SeoHead';
import { useAdmin } from '../context/AdminContext';
import { categoryPath } from '../lib/storeRoutes';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import SmartImage from '../components/SmartImage';

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function getRating(id) {
  const ratings = [4.2, 4.5, 4.8, 3.9, 4.6, 4.1, 4.7, 4.3, 4.4, 3.8];
  const index = Array.from(String(id || '0'))
    .reduce((total, character) => total + character.charCodeAt(0), 0) % ratings.length;
  return ratings[index];
}

function money(value) {
  return `NT$${Number(value || 0).toLocaleString()}`;
}

function buildFallbackContent(product, categoryName) {
  const isDal = product.category === 'dal-pulses' || /chana|dal|lentil|rajma|moong/i.test(product.name_en || '');
  const searchPhrase = isDal
    ? 'If you are searching for chana dal near me in Taiwan, this product page is designed to help customers find the right dal quickly.'
    : `If you are searching for ${product.name_en.toLowerCase()} in Taiwan, this page gives you the details shoppers need before they buy.`;
  return {
    h1: product.seo_h1 || product.name_en,
    title: product.seo_title || `${product.name_en} in Taiwan | MIK Store`,
    description: product.seo_description || `Buy ${product.name_en} online in Taiwan from MIK Store.`,
    keywords: product.seo_keywords || `${product.name_en}, ${categoryName}, Taiwan Indian grocery`,
    content: product.seo_content || `${product.name_en} is a trusted choice for Taiwanese shoppers who want authentic Indian grocery items, convenient delivery, and repeat ordering support. ${searchPhrase}`,
  };
}

export default function ProductPage() {
  const { productSlug } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { categories, products } = useAdmin();
  const { addItem, cart } = useCart();
  const { toggle, isWished } = useWishlist();

  const product = useMemo(() => {
    const target = String(productSlug || '').toLowerCase();
    return products.find(p => String(p.id) === String(productSlug) || String(p.seo_slug || '').toLowerCase() === target || slugify(p.name_en) === target) || null;
  }, [productSlug, products]);

  const related = useMemo(() => {
    if (!product) return [];
    return products
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 8);
  }, [product, products]);

  const category = product
    ? categories.find(item => item.id === product.primary_collection_id || item.slug === product.category)
    : null;
  const categoryName = category?.name || product?.collection_names?.[0] || product?.category || '';
  const seo = product ? buildFallbackContent(product, categoryName) : null;
  const canonical = typeof window !== 'undefined' && product
    ? `${window.location.origin}${window.location.pathname}`
    : '';
  const rating = product ? getRating(product.id) : 0;
  const wished = product ? isWished(product.id) : false;
  const cartItem = product ? cart.find(i => i.id === product.id) : null;
  const productCategoryPath = product
    ? `${pathname.startsWith('/zh/') ? '/zh' : ''}${category?.path || categoryPath(product.category)}`
    : '/';

  const jsonLd = product ? [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name_en,
      description: seo.description,
      image: product.image_url || undefined,
      sku: product.id,
      brand: { '@type': 'Brand', name: 'MIK Store' },
      category: product.category,
      offers: {
        '@type': 'Offer',
        url: canonical,
        priceCurrency: 'TWD',
        price: Number(product.price || 0),
        availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating.toFixed(1),
        reviewCount: 18,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${typeof window !== 'undefined' ? window.location.origin : ''}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: categoryName,
          item: `${typeof window !== 'undefined' ? window.location.origin : ''}${productCategoryPath}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: product.name_en,
          item: canonical,
        },
      ],
    },
  ] : null;

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 max-w-5xl mx-auto px-4 py-10">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center">
            <p className="text-gray-400 text-sm">Product not found</p>
            <button onClick={() => navigate('/')} className="mt-4 bg-green-700 text-white font-semibold px-5 py-3 rounded-xl">
              Back to home
            </button>
          </div>
        </main>
        <Footer />
        <BottomNav active="categories" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SeoHead
        title={seo.title}
        description={seo.description}
        canonical={canonical}
        keywords={seo.keywords}
        image={product.image_url || undefined}
        jsonLd={jsonLd}
        ogType="product"
      />
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-4 pb-28 space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
            <ArrowLeft size={16} />
            Back
          </button>
          <Link to={productCategoryPath} className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
            {categoryName}
          </Link>
        </div>

        <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
            <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
              {product.image_url ? (
                <SmartImage src={product.image_url} alt={product.name_en} className="w-full h-full object-contain p-4" sizes="(max-width: 1024px) 100vw, 55vw" eager />
              ) : (
                <ShoppingBag size={72} className="text-gray-300" />
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4">
            {product.badge && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">
                <BadgePercent size={12} />
                {product.badge}
              </span>
            )}
            <h1 className="text-2xl font-black text-gray-900 leading-tight">{seo.h1}</h1>
            <p className="text-sm text-gray-500">{product.name_zh}</p>

            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={14} className={i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
              ))}
              <span className="text-sm text-gray-500">{rating.toFixed(1)} rating</span>
            </div>

            <div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Price</p>
                <p className="text-3xl font-black text-gray-900">{money(product.price)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => addItem(product)}
                disabled={product.stock === 0}
                className="w-full inline-flex items-center justify-center gap-2 bg-green-700 text-white font-semibold px-4 py-3 rounded-2xl disabled:opacity-50"
              >
                <ShoppingBag size={16} />
                {cartItem ? `In cart • ${cartItem.quantity}` : 'Add to cart'}
              </button>
              <button
                onClick={() => toggle(product.id)}
                className="w-full inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-semibold px-4 py-3 rounded-2xl"
              >
                <Heart size={16} className={wished ? 'fill-red-500 text-red-500' : ''} />
                {wished ? 'Saved to wishlist' : 'Save to wishlist'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-2xl bg-gray-50 p-3">
                <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
                  <Truck size={15} className="text-green-700" />
                  Taiwan delivery
                </div>
                <p className="text-xs text-gray-500 mt-1">Fast delivery across Taiwan with service tailored to Indian grocery shoppers.</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-3">
                <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
                  <ShieldCheck size={15} className="text-green-700" />
                  Authentic stock
                </div>
                <p className="text-xs text-gray-500 mt-1">Popular pantry items, pulses, spices, and fresh Indian staples.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Product Details</h2>
          <p className="text-sm text-gray-600 leading-7 whitespace-pre-line">{seo.content}</p>
        </section>

        {related.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Related products</h2>
              <Link to={productCategoryPath} className="text-sm text-green-700 font-semibold">See all</Link>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <div className="flex gap-3 w-max">
                {related.map(item => (
                  <div key={item.id} className="w-40 flex-none">
                    <ProductCard product={item} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
      <BottomNav active="categories" />
    </div>
  );
}
