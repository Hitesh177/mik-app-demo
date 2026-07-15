import { Home, Grid2x2, ShoppingCart, ClipboardList, UserCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const NAV_ITEMS = [
  { id: 'home',       label: 'Home',       icon: Home,          path: '/' },
  { id: 'categories', label: 'Categories', icon: Grid2x2,       path: '/categories' },
  { id: 'orders',     label: 'Orders',     icon: ClipboardList, path: '/my-orders' },
  { id: 'account',    label: 'Account',    icon: UserCircle2,   path: '/account' },
  { id: 'cart',       label: 'Cart',       icon: ShoppingCart,  path: '/cart' },
];

export default function BottomNav({ active }) {
  const navigate = useNavigate();
  const { totalItems } = useCart();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-pb">
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 py-2">
        {NAV_ITEMS.map(({ id, label, icon: Icon, path }) => {
          const isActive = active === id;
          const showBadge = id === 'cart' && totalItems > 0;
          return (
            <button
              key={id}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors relative ${
                isActive
                  ? 'text-green-700'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'text-green-700' : 'text-gray-500'}`}>
                {label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-700 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
