import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import BottomNav from '../components/BottomNav';
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag, Truck } from 'lucide-react';

export default function CartPage() {
  const { cart, updateQty, removeItem, totalPrice, totalItems } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-lg">Your Cart</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
            <ShoppingBag size={36} className="text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">Your cart is empty</p>
            <p className="text-gray-500 text-sm mt-1">Add items from the store to get started</p>
          </div>
          <button onClick={() => navigate('/')} className="btn-primary mt-2">
            Browse Products
          </button>
        </div>
        <BottomNav active="cart" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg">Your Cart</h1>
        <span className="text-sm text-gray-500">({totalItems} items)</span>
      </div>

      <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 space-y-3 pb-36">
        {/* Free delivery progress bar */}
        {(() => {
          const threshold = 999;
          const pct = Math.min(100, (totalPrice / threshold) * 100);
          const remaining = Math.max(0, threshold - totalPrice);
          return (
            <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <Truck size={16} className={pct >= 100 ? 'text-green-700' : 'text-gray-400'} />
                {pct >= 100 ? (
                  <span className="text-sm font-semibold text-green-700">🎉 You&apos;ve got FREE delivery!</span>
                ) : (
                  <span className="text-sm text-gray-600">
                    Add <span className="font-bold text-green-700">NT${remaining}</span> more for free delivery
                  </span>
                )}
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })()}

        {/* Cart items */}
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {cart.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-4">
              {/* Image */}
              <div className="w-14 h-14 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                {item.image_url
                  ? <img src={item.image_url} alt={item.name_en} className="w-full h-full object-contain p-1.5" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">🛒</div>
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-800 leading-snug">{item.name_en}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.name_zh}</p>
                <p className="font-bold text-green-700 text-sm mt-1">NT${(item.price * item.quantity).toLocaleString()}</p>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-2 py-1.5">
                <button onClick={() => updateQty(item.id, item.quantity - 1)} className="text-gray-600">
                  <Minus size={14} />
                </button>
                <span className="font-bold text-sm w-5 text-center">{item.quantity}</span>
                <button onClick={() => updateQty(item.id, item.quantity + 1)} className="text-gray-600">
                  <Plus size={14} />
                </button>
              </div>

              <button
                onClick={() => removeItem(item.id)}
                className="p-1.5 text-gray-400 hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h2 className="font-semibold text-gray-800">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({totalItems} items)</span>
              <span>NT${totalPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery</span>
              <span className="text-green-700 font-medium">FREE</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-gray-900 text-base">
              <span>Total</span>
              <span>NT${totalPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky checkout button */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-green-700 text-white font-bold py-4 rounded-2xl text-base shadow-sm active:scale-[0.98] transition-transform"
          >
            Proceed to Checkout · NT${totalPrice.toLocaleString()}
          </button>
        </div>
      </div>
      <BottomNav active="cart" />
    </div>
  );
}
