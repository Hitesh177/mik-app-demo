import { ShoppingCart, Search, X, Moon, Sun, UserCircle2, BadgePercent } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useDarkMode } from '../context/DarkModeContext';
import { useCustomer } from '../context/CustomerContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
import { CATEGORIES } from '../data/mockData';

export default function Header({ onSearchChange, searchValue, searchIndex = [] }) {
  const { totalItems } = useCart();
  const { dark, toggle: toggleDark } = useDarkMode();
  const customerCtx = useCustomer();
  const customer = customerCtx?.customer;
  const isLoggedIn = customerCtx?.isLoggedIn;
  const navigate = useNavigate();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [desktopSearchFocused, setDesktopSearchFocused] = useState(false);
  const [mobileSearchFocused, setMobileSearchFocused] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);
  const prevTotal = useRef(totalItems);
  const categoryLabels = useMemo(
    () => new Map(CATEGORIES.map(category => [category.id, category.name])),
    [],
  );

  const searchQuery = (searchValue || '').trim().toLowerCase();

  const searchSuggestions = useMemo(() => {
    if (!searchQuery || !Array.isArray(searchIndex) || searchIndex.length === 0) return [];

    return searchIndex
      .map(product => {
        const categoryLabel = categoryLabels.get(product.category) || '';
        const searchPool = [
          product.name_en,
          product.name_zh,
          categoryLabel,
          product.seo_title,
          product.seo_keywords,
          product.seo_h1,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchPool.includes(searchQuery)) return null;

        const exactName = product.name_en?.toLowerCase() === searchQuery;
        const startsName = product.name_en?.toLowerCase().startsWith(searchQuery);
        const startsCategory = categoryLabel.toLowerCase().startsWith(searchQuery);
        const categoryMatch = searchPool.indexOf(searchQuery);
        const hotBoost = product.badge === 'Hot' ? 1 : 0;

        return {
          product,
          categoryLabel,
          score: (exactName ? 120 : 0) + (startsName ? 70 : 0) + (startsCategory ? 35 : 0) + (categoryMatch === 0 ? 40 : 0) + hotBoost,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [searchQuery, searchIndex, categoryLabels]);

  const selectSuggestion = (product) => {
    onSearchChange?.(product.name_en);
    setDesktopSearchFocused(false);
    setMobileSearchFocused(false);
    setShowMobileSearch(false);
    navigate(`/product/${product.seo_slug || product.id}`);
  };

  const showDesktopSuggestions = desktopSearchFocused && searchQuery.length >= 2 && searchSuggestions.length > 0;
  const showMobileSuggestions = mobileSearchFocused && searchQuery.length >= 2 && searchSuggestions.length > 0;

  useEffect(() => {
    if (totalItems > prevTotal.current) {
      setCartBounce(true);
      setTimeout(() => setCartBounce(false), 500);
    }
    prevTotal.current = totalItems;
  }, [totalItems]);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <div className="bg-green-700 text-white text-center text-xs py-1.5 font-medium tracking-wide">
        🚚 Free delivery island-wide in Taiwan
      </div>

      <div className="flex items-center gap-3 px-4 py-3 max-w-6xl mx-auto">
        {/* Logo */}
        <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2 flex-shrink-0" aria-label="Go to home page">
          <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <div className="hidden sm:block">
            <div className="font-bold text-gray-900 text-sm leading-tight">MIK Store</div>
            <div className="text-[10px] text-gray-400 leading-tight">Mayur Indian Kitchen</div>
          </div>
        </button>

        {onSearchChange ? (
          <>
            {/* Search bar (desktop) */}
            <div className="hidden sm:block flex-1 max-w-lg relative">
              <div className="flex items-center bg-gray-100 rounded-xl px-4 py-2.5 gap-2">
                <Search size={15} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search spices, rice, lentils..."
                  className="bg-transparent text-sm w-full outline-none text-gray-700 placeholder-gray-400"
                  value={searchValue || ''}
                  onChange={e => onSearchChange?.(e.target.value)}
                  onFocus={() => setDesktopSearchFocused(true)}
                  onBlur={() => setDesktopSearchFocused(false)}
                  aria-label="Search products"
                  aria-autocomplete="list"
                  aria-expanded={showDesktopSuggestions}
                  role="searchbox"
                />
                {searchValue && (
                  <button
                    type="button"
                    onClick={() => onSearchChange?.('')}
                    aria-label="Clear search"
                    className="shrink-0"
                  >
                    <X size={14} className="text-gray-400" />
                  </button>
                )}
              </div>

              {showDesktopSuggestions && (
                <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-gray-100 bg-white shadow-2xl overflow-hidden">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Product suggestions</p>
                  </div>
                  <div className="max-h-80 overflow-auto">
                    {searchSuggestions.map(({ product, categoryLabel }) => (
                      <button
                        key={product.id}
                        type="button"
                        onMouseDown={e => {
                          e.preventDefault();
                          selectSuggestion(product);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name_en} className="w-full h-full object-contain p-1.5" />
                          ) : (
                            <span className="text-lg">🛒</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">{product.name_en}</p>
                          <p className="text-xs text-gray-500 truncate">{categoryLabel} • NT${product.price}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 sm:hidden" />
          </>
        ) : (
          <div className="flex-1" />
        )}

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          {/* Dark mode toggle */}
          <button
            type="button"
            onClick={toggleDark}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            title={dark ? 'Light mode' : 'Dark mode'}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            type="button"
            onClick={() => navigate('/account')}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 sm:px-3 py-2 rounded-xl text-sm font-medium transition-colors"
            aria-label={isLoggedIn ? 'Open customer account' : 'Sign in'}
          >
            <UserCircle2 size={16} />
            {isLoggedIn ? (
              <span className="hidden sm:flex items-center gap-1.5">
                <span className="max-w-[120px] truncate">{customer?.name || customer?.email || 'Account'}</span>
                <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  <BadgePercent size={10} />
                  {customer?.rewards?.points || 0}
                </span>
              </span>
            ) : (
              <span className="hidden sm:inline">Sign in</span>
            )}
          </button>

          {onSearchChange && (
            <button
              type="button"
              className="sm:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              onClick={() => setShowMobileSearch(s => !s)}
              aria-label={showMobileSearch ? 'Close search' : 'Open search'}
              aria-expanded={showMobileSearch}
            >
              {showMobileSearch ? <X size={20} /> : <Search size={20} />}
            </button>
          )}

          {/* Cart */}
          <button
            type="button"
            onClick={() => navigate('/cart')}
            className="relative flex items-center gap-1.5 bg-green-700 text-white px-3 py-2 rounded-xl text-sm font-medium"
            aria-label={`Open cart with ${totalItems} item${totalItems === 1 ? '' : 's'}`}
          >
            <ShoppingCart size={16} className={cartBounce ? 'animate-cart-bounce' : ''} />
            <span className="hidden sm:inline">Cart</span>
            {totalItems > 0 && (
              <span className="bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile search bar */}
      {onSearchChange && showMobileSearch && (
        <div className="sm:hidden px-4 pb-3 relative">
          <div className="flex items-center bg-gray-100 rounded-xl px-4 py-2.5 gap-2">
            <Search size={15} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search spices, rice, lentils..."
              className="bg-transparent text-sm w-full outline-none text-gray-700 placeholder-gray-400"
              value={searchValue || ''}
              onChange={e => onSearchChange?.(e.target.value)}
              onFocus={() => setMobileSearchFocused(true)}
              onBlur={() => setMobileSearchFocused(false)}
              autoFocus
              aria-label="Search products"
              aria-autocomplete="list"
              aria-expanded={showMobileSuggestions}
              role="searchbox"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => onSearchChange?.('')}
                aria-label="Clear search"
              >
                <X size={14} className="text-gray-400" />
              </button>
            )}
          </div>

          {showMobileSuggestions && (
            <div className="absolute left-4 right-4 top-[calc(100%-0.25rem)] z-50 mt-2 rounded-2xl border border-gray-100 bg-white shadow-2xl overflow-hidden">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Product suggestions</p>
              </div>
              <div className="max-h-72 overflow-auto">
                {searchSuggestions.map(({ product, categoryLabel }) => (
                  <button
                    key={product.id}
                    type="button"
                    onMouseDown={e => {
                      e.preventDefault();
                      selectSuggestion(product);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name_en} className="w-full h-full object-contain p-1.5" />
                      ) : (
                        <span className="text-lg">🛒</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{product.name_en}</p>
                      <p className="text-xs text-gray-500 truncate">{categoryLabel} • NT${product.price}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
