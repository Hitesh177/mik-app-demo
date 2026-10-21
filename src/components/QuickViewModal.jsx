import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Star, Plus, Minus, Heart, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import SmartImage from './SmartImage';

const RATINGS = [4.2, 4.5, 4.8, 3.9, 4.6, 4.1, 4.7, 4.3, 4.4, 3.8];
const CATEGORY_DESCS = {
  'fresh-frozen': 'Freshly sourced and kept at optimal temperature. Authentic taste from India.',
  'atta-flour': 'Stone-ground from premium wheat. Perfect for soft rotis and parathas.',
  'dal-pulses': 'Premium quality lentils and pulses. High in protein and fibre.',
  'spices': 'Hand-picked whole spices for maximum aroma and flavour.',
  'masala': 'Authentic spice blends crafted from traditional recipes.',
  'rice-oils': 'Premium long-grain basmati and cold-pressed oils.',
  'pickles': 'Traditional recipes with the perfect balance of spice and tang.',
  'tea-coffee': 'Rich, aromatic blends from India\'s finest tea gardens.',
  'instant-food': 'Ready in minutes. Authentic homemade taste, zero effort.',
  'papad-biscuits': 'Crispy, light, and perfect with every meal.',
  'noodles-sauces': 'Bold Indian-inspired flavours for quick meals.',
  'snacks': 'Crunchy, spiced snacks for every craving.',
  'sweets': 'Traditional Indian mithai made with pure ingredients.',
  'ready-to-eat': 'Restaurant-quality meals, ready in minutes.',
  'toiletry': 'Trusted Indian brands for daily personal care.',
  'puja': 'Essential items for daily prayers and rituals.',
  'household': 'Quality kitchen and household essentials.',
  'mouth-freshener': 'Natural mouth fresheners after every meal.',
};

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={13}
          className={i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
      <span className="text-xs text-gray-500 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function QuickViewModal({ product, onClose }) {
  const navigate = useNavigate();
  const { cart, addItem, updateQty } = useCart();
  const { toggle, isWished } = useWishlist();
  const cartItem = cart.find(i => i.id === product.id);
  const wished = isWished(product.id);
  const ratingIndex = Array.from(String(product.id || '0'))
    .reduce((total, character) => total + character.charCodeAt(0), 0) % RATINGS.length;
  const rating = RATINGS[ratingIndex];
  const desc = CATEGORY_DESCS[product.category] || 'Premium quality imported directly from India.';
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock === 0;

  // Close on Escape
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-up-modal">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close quick view"
          className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md text-gray-500 hover:text-gray-800"
        >
          <X size={18} />
        </button>

        {/* Wishlist */}
        <button
          type="button"
          onClick={() => toggle(product.id)}
          aria-label={wished ? `Remove ${product.name_en} from wishlist` : `Save ${product.name_en} to wishlist`}
          className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md"
        >
          <Heart size={18} className={wished ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
        </button>

        {/* Image */}
        <div className="h-56 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          {product.image_url ? (
            <SmartImage src={product.image_url} alt={product.name_en} className="w-full h-full object-contain p-4" sizes="448px" eager />
          ) : (
            <ShoppingBag size={64} className="text-gray-300" />
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {product.badge && (
            <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-2 ${
              product.badge === 'Hot' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-700'
            }`}>
              {product.badge}
            </span>
          )}
          <h2 className="font-bold text-gray-900 text-lg leading-snug">{product.name_en}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{product.name_zh}</p>

          <div className="flex items-center justify-between mt-2">
            <StarRating rating={rating} />
            {isLowStock && (
              <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                Only {product.stock} left!
              </span>
            )}
          </div>

          <p className="text-sm text-gray-500 mt-3 leading-relaxed">{desc}</p>

          <div className="flex items-center justify-between mt-4">
            <span className="text-2xl font-bold text-gray-900">NT${product.price}</span>

            {isOutOfStock ? (
              <span className="text-sm text-gray-400 font-medium bg-gray-100 px-4 py-2 rounded-xl">Out of Stock</span>
            ) : cartItem ? (
              <div className="flex items-center gap-3 bg-green-700 rounded-xl px-3 py-2">
                <button
                  type="button"
                  onClick={() => updateQty(product.id, cartItem.quantity - 1)}
                  aria-label={`Decrease quantity of ${product.name_en}`}
                  className="text-white"
                >
                  <Minus size={16} />
                </button>
                <span className="text-white font-bold text-base min-w-[24px] text-center">{cartItem.quantity}</span>
                <button
                  type="button"
                  onClick={() => addItem(product)}
                  aria-label={`Increase quantity of ${product.name_en}`}
                  className="text-white"
                >
                  <Plus size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => addItem(product)}
                  aria-label={`Add ${product.name_en} to cart`}
                  className="flex items-center gap-2 bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-green-800 active:scale-95 transition-all"
                >
                  <Plus size={16} />
                  Add to Cart
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/product/${product.seo_slug || product.id}`)}
                  aria-label={`Open full page for ${product.name_en}`}
                  className="text-sm font-semibold text-green-700 bg-green-50 px-4 py-2.5 rounded-xl hover:bg-green-100 transition-colors"
                >
                  Full page
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
