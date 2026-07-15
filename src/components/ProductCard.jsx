import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, Heart, Star, Bell, BellOff } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import QuickViewModal from './QuickViewModal';

const CATEGORY_COLORS = {
  'fresh-frozen':    'from-sky-50 to-blue-50',
  'atta-flour':      'from-yellow-50 to-orange-50',
  'dal-pulses':      'from-amber-50 to-orange-50',
  'spices':          'from-orange-50 to-amber-50',
  'masala':          'from-red-50 to-orange-50',
  'rice-oils':       'from-yellow-50 to-lime-50',
  'pickles':         'from-green-50 to-emerald-50',
  'tea-coffee':      'from-amber-50 to-yellow-50',
  'instant-food':    'from-violet-50 to-purple-50',
  'papad-biscuits':  'from-yellow-50 to-amber-50',
  'noodles-sauces':  'from-red-50 to-pink-50',
  'snacks':          'from-orange-50 to-red-50',
  'sweets':          'from-pink-50 to-rose-50',
  'ready-to-eat':    'from-emerald-50 to-teal-50',
  'toiletry':        'from-purple-50 to-violet-50',
  'puja':            'from-yellow-50 to-orange-50',
  'household':       'from-slate-50 to-gray-50',
  'mouth-freshener': 'from-green-50 to-teal-50',
};

const CATEGORY_EMOJIS = {
  'fresh-frozen':    '🧊',
  'atta-flour':      '🌾',
  'dal-pulses':      '🫘',
  'spices':          '🌶️',
  'masala':          '✨',
  'rice-oils':       '🍚',
  'pickles':         '🥒',
  'tea-coffee':      '☕',
  'instant-food':    '🍲',
  'papad-biscuits':  '🍪',
  'noodles-sauces':  '🍜',
  'snacks':          '🍿',
  'sweets':          '🍬',
  'ready-to-eat':    '🥘',
  'toiletry':        '💄',
  'puja':            '🪔',
  'household':       '🏠',
  'mouth-freshener': '🌿',
};

const BADGE_STYLES = {
  Hot: 'bg-orange-500 text-white',
  New: 'bg-purple-600 text-white',
  Sale: 'bg-red-500 text-white',
  'Out of stock': 'bg-gray-400 text-white',
};

// Deterministic rating from product id
const RATINGS = [4.2, 4.5, 4.8, 3.9, 4.6, 4.1, 4.7, 4.3, 4.4, 3.8];
const getRating = (id) => RATINGS[parseInt(id, 10) % RATINGS.length];

// Deterministic "sold today" count for hot products
const SOLD_COUNTS = [12, 27, 8, 34, 19, 41, 15, 23, 7, 31];
const getSoldCount = (id) => SOLD_COUNTS[parseInt(id, 10) % SOLD_COUNTS.length];

// Products to mark as New (by ID)
const NEW_IDS = new Set(['4', '12', '22', '38', '54', '67']);

// Track recently viewed in localStorage
function trackViewed(product) {
  try {
    const raw = localStorage.getItem('mik_viewed') || '[]';
    const viewed = JSON.parse(raw).filter(p => p.id !== product.id);
    viewed.unshift({ id: product.id, name_en: product.name_en, name_zh: product.name_zh, price: product.price, image_url: product.image_url, category: product.category, badge: product.badge, stock: product.stock });
    localStorage.setItem('mik_viewed', JSON.stringify(viewed.slice(0, 10)));
  } catch {
    // Ignore storage errors in private browsing mode.
  }
}

export default function ProductCard({ product, compact = false }) {
  const { cart, addItem, updateQty } = useCart();
  const { toggle, isWished } = useWishlist();
  const [showModal, setShowModal] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [notified, setNotified] = useState(false);

  const cartItem = cart.find(i => i.id === product.id);
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const wished = isWished(product.id);
  const rating = getRating(product.id);
  const soldCount = getSoldCount(product.id);

  const effectiveBadge = product.badge || (NEW_IDS.has(product.id) ? 'New' : null);
  const gradient = CATEGORY_COLORS[product.category] || 'from-gray-50 to-gray-100';
  const emoji = CATEGORY_EMOJIS[product.category] || '🛒';
  const detailPath = `/product/${product.seo_slug || product.id}`;

  const openModal = () => {
    trackViewed(product);
    setShowModal(true);
  };

  return (
    <>
      <div className={`group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-green-200 ${isOutOfStock ? 'opacity-60' : ''} ${compact ? 'min-w-0 h-full min-h-[260px]' : 'h-full min-h-[320px]'}`}>
        {/* Image area */}
        <div
          className={`relative bg-gradient-to-br ${gradient} ${compact ? 'h-24 sm:h-28' : 'h-28 sm:h-32'} flex items-center justify-center cursor-pointer transition-transform duration-200 group-hover:scale-[1.01]`}
          onClick={openModal}
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openModal();
            }
          }}
          aria-label={`Quick view ${product.name_en}`}
        >
          {product.image_url ? (
            <>
              {!imgLoaded && <div className="absolute inset-0 skeleton" />}
              <img
                src={product.image_url}
                alt={product.name_en}
                loading="lazy"
                decoding="async"
                className={`w-full h-full object-contain p-2 transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImgLoaded(true)}
              />
            </>
          ) : (
            <span className="text-4xl">{emoji}</span>
          )}

          {/* Badge */}
          {effectiveBadge && (
            <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${BADGE_STYLES[effectiveBadge] || 'bg-gray-200 text-gray-700'}`}>
              {effectiveBadge}
            </span>
          )}

          {/* Wishlist heart */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggle(product.id); }}
            aria-label={wished ? `Remove ${product.name_en} from wishlist` : `Save ${product.name_en} to wishlist`}
            className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm p-1 rounded-full shadow-sm"
          >
            <Heart size={12} className={wished ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
          </button>
        </div>

        {/* Info */}
        <div className={`${compact ? 'p-2' : 'p-2.5'} flex flex-col flex-1`}>
          <Link
            to={detailPath}
            className={`${compact ? 'text-[11px]' : 'text-xs'} font-semibold text-gray-800 leading-snug line-clamp-2 hover:text-green-700 transition-colors`}
            onClick={() => trackViewed(product)}
          >
            {product.name_en}
          </Link>
          <p className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-gray-400 mt-0.5`}>{product.name_zh}</p>

          {/* Star rating */}
          <div className={`flex items-center gap-0.5 ${compact ? 'mt-0.5' : 'mt-1'}`}>
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={compact ? 8 : 9} className={i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
            ))}
            <span className={`${compact ? 'text-[8px]' : 'text-[9px]'} text-gray-400 ml-0.5`}>{rating.toFixed(1)}</span>
          </div>

          {/* Social proof */}
          {product.badge === 'Hot' && (
            <p className={`${compact ? 'text-[8px]' : 'text-[9px]'} font-semibold text-orange-500 mt-0.5`}>🔥 {soldCount} sold today</p>
          )}

          {/* Stock warning */}
          {isLowStock && (
            <p className={`${compact ? 'text-[8px]' : 'text-[9px]'} font-semibold text-red-500 mt-0.5`}>Only {product.stock} left!</p>
          )}

          {compact ? (
            <div className="mt-auto pt-2 space-y-2">
              <div className="flex items-end justify-between gap-2">
                <span className="text-sm font-bold text-gray-900 leading-none">NT${product.price}</span>
                {!isOutOfStock && cartItem && (
                  <span className="text-[9px] font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full">
                    In cart {cartItem.quantity}
                  </span>
                )}
              </div>

              {isOutOfStock ? (
                <button
                  type="button"
                  onClick={() => setNotified(n => !n)}
                  aria-label={notified ? `Turn off stock alert for ${product.name_en}` : `Notify me when ${product.name_en} is back in stock`}
                  className={`w-full flex items-center justify-center gap-1 text-[10px] font-semibold px-2 py-2 rounded-lg transition-all ${notified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-600'}`}
                >
                  {notified ? <><BellOff size={10} /> Notified</> : <><Bell size={10} /> Notify me</>}
                </button>
              ) : cartItem ? (
                <div className="flex items-center justify-between gap-2 bg-green-700 rounded-lg px-2 py-2">
                  <button
                    type="button"
                    onClick={() => updateQty(product.id, cartItem.quantity - 1)}
                    aria-label={`Decrease quantity of ${product.name_en}`}
                    className="text-white p-0.5"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-white text-xs font-bold min-w-[18px] text-center">{cartItem.quantity}</span>
                  <button
                    type="button"
                    onClick={() => addItem(product)}
                    aria-label={`Increase quantity of ${product.name_en}`}
                    className="text-white p-0.5"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => addItem(product)}
                  aria-label={`Add ${product.name_en} to cart`}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-green-700 text-white font-semibold rounded-lg py-2 text-xs hover:bg-green-800 transition-colors active:scale-95"
                >
                  <Plus size={13} />
                  Add
                </button>
              )}
            </div>
          ) : (
            <div className="mt-auto pt-2 flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-gray-900">NT${product.price}</span>

              <Link
                to={detailPath}
                onClick={() => trackViewed(product)}
                className="text-[10px] font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-lg hover:bg-green-100 transition-colors"
                aria-label={`Open details for ${product.name_en}`}
              >
                Details
              </Link>

              {isOutOfStock ? (
                <button
                  type="button"
                  onClick={() => setNotified(n => !n)}
                  aria-label={notified ? `Turn off stock alert for ${product.name_en}` : `Notify me when ${product.name_en} is back in stock`}
                  className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-all ${notified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-600'}`}
                >
                  {notified ? <><BellOff size={10} /> Notified</> : <><Bell size={10} /> Notify me</>}
                </button>
              ) : cartItem ? (
                <div className="flex items-center gap-1.5 bg-green-700 rounded-lg px-1.5 py-1">
                  <button
                    type="button"
                    onClick={() => updateQty(product.id, cartItem.quantity - 1)}
                    aria-label={`Decrease quantity of ${product.name_en}`}
                    className="text-white"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-white text-xs font-bold min-w-[16px] text-center">{cartItem.quantity}</span>
                  <button
                    type="button"
                    onClick={() => addItem(product)}
                    aria-label={`Increase quantity of ${product.name_en}`}
                    className="text-white"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => addItem(product)}
                  aria-label={`Add ${product.name_en} to cart`}
                  className="bg-green-700 text-white rounded-lg p-1.5 hover:bg-green-800 transition-colors active:scale-90"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && <QuickViewModal product={product} onClose={() => setShowModal(false)} />}
    </>
  );
}
