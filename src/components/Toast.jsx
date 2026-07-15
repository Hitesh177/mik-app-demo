import { useCart } from '../context/CartContext';
import { ShoppingCart, Check } from 'lucide-react';

export default function Toast() {
  const { toast } = useCart();

  if (!toast) return null;

  const { product } = toast;

  return (
    <div
      key={toast.id}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-slide-up"
    >
      <div className="flex items-center gap-3 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-xl min-w-[260px] max-w-[90vw]">
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Check size={16} strokeWidth={3} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">{product.name_en}</p>
          <p className="text-[11px] text-gray-400">Added to cart · NT${product.price}</p>
        </div>
        <ShoppingCart size={16} className="text-gray-400 flex-shrink-0" />
      </div>
    </div>
  );
}
