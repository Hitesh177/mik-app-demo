import { useState, useEffect } from 'react';
import { X, Tag, Gift } from 'lucide-react';

export default function PromoPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('mik_promo_dismissed');
    if (!dismissed) {
      const t = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem('mik_promo_dismissed', '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-slide-up-modal">
        {/* Close */}
        <button onClick={dismiss} className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 z-10">
          <X size={16} />
        </button>

        {/* Top gradient banner */}
        <div className="bg-gradient-to-br from-green-600 to-green-800 px-6 pt-8 pb-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Gift size={32} className="text-white" />
          </div>
          <h2 className="text-white font-bold text-2xl">Welcome to MIK Store!</h2>
          <p className="text-green-200 text-sm mt-1">Taiwan&apos;s #1 Indian Grocery Store</p>
        </div>

        {/* Offer */}
        <div className="px-6 py-5 text-center">
          <div className="bg-orange-50 border-2 border-dashed border-orange-300 rounded-2xl px-4 py-4 mb-4">
            <p className="text-gray-600 text-sm mb-1">Use code on your first order</p>
            <div className="flex items-center justify-center gap-2">
              <Tag size={18} className="text-orange-500" />
              <span className="text-2xl font-black text-orange-500 tracking-widest">MIK10</span>
            </div>
            <p className="text-gray-500 text-xs mt-1">10% off your first order</p>
          </div>

          <p className="text-xs text-gray-400 mb-4">Authentic Indian groceries delivered to your door anywhere in Taiwan. Minimum order NT$500.</p>

          <button
            onClick={dismiss}
            className="w-full bg-green-700 text-white font-bold py-3.5 rounded-2xl text-sm active:scale-95 transition-transform"
          >
            Shop Now & Save 10%
          </button>
          <button onClick={dismiss} className="text-xs text-gray-400 mt-3 block w-full hover:text-gray-600">
            No thanks, I&apos;ll pay full price
          </button>
        </div>
      </div>
    </div>
  );
}
