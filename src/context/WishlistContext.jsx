import { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mik_wishlist') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('mik_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const toggle = (id) => setWishlist(w => w.includes(id) ? w.filter(i => i !== id) : [...w, id]);
  const isWished = (id) => wishlist.includes(id);

  return (
    <WishlistContext.Provider value={{ wishlist, toggle, isWished }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
