import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { useCustomer } from './CustomerContext';

const CartContext = createContext(null);

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.find(i => i.id === action.product.id);
      if (existing) {
        return state.map(i => (i.id === action.product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...state, { ...action.product, quantity: 1 }];
    }
    case 'REMOVE_ITEM':
      return state.filter(i => i.id !== action.id);
    case 'UPDATE_QTY':
      if (action.qty <= 0) return state.filter(i => i.id !== action.id);
      return state.map(i => (i.id === action.id ? { ...i, quantity: action.qty } : i));
    case 'CLEAR':
      return [];
    case 'INIT':
      return Array.isArray(action.cart) ? action.cart : [];
    default:
      return state;
  }
}

function guestStorageKey() {
  return 'mik_cart_guest';
}

function customerStorageKey(customerId) {
  return `mik_cart_customer_${customerId}`;
}

function safeReadStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWriteStorage(key, cart) {
  try {
    localStorage.setItem(key, JSON.stringify(cart));
  } catch {
    // Ignore storage failures and keep the in-memory cart usable.
  }
}

function mergeCarts(primary, secondary) {
  const map = new Map();
  for (const item of [...(Array.isArray(primary) ? primary : []), ...(Array.isArray(secondary) ? secondary : [])]) {
    if (!item?.id) continue;
    const existing = map.get(item.id);
    const quantity = Number(item.quantity || 1);
    if (existing) {
      existing.quantity += quantity;
    } else {
      map.set(item.id, { ...item, quantity });
    }
  }
  return [...map.values()];
}

function normalizeServerCart(items) {
  return (Array.isArray(items) ? items : []).map(item => ({
    ...item,
    id: item.id || item.product_id,
    quantity: Number(item.quantity || 1),
  }));
}

export function CartProvider({ children }) {
  const { customer, isLoggedIn, isReady: customerReady } = useCustomer();
  const [cart, dispatch] = useReducer(cartReducer, []);
  const [toast, setToast] = useState(null);
  const hydratedRef = useRef(false);
  const activeCustomerKey = useMemo(
    () => (isLoggedIn && customer?.id ? customerStorageKey(customer.id) : guestStorageKey()),
    [isLoggedIn, customer?.id],
  );

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      hydratedRef.current = false;
      if (!customerReady) return;

      if (isLoggedIn && customer?.id) {
        const guestCart = safeReadStorage(guestStorageKey());
        const customerCartKey = customerStorageKey(customer.id);
        let serverCart = [];
        try {
          const response = await api.getCustomerCart();
          serverCart = normalizeServerCart(response.items || []);
        } catch {
          serverCart = safeReadStorage(customerCartKey);
        }
        const merged = mergeCarts(serverCart, guestCart);
        if (!mounted) return;
        dispatch({ type: 'INIT', cart: merged });
        safeWriteStorage(customerCartKey, merged);
        if (guestCart.length > 0) {
          try {
            localStorage.removeItem(guestStorageKey());
          } catch {
            // Ignore storage cleanup issues.
          }
        }
        try {
          await api.saveCustomerCart(merged);
        } catch {
          // If sync is unavailable, keep the local cart so the app still works.
        }
      } else {
        dispatch({ type: 'INIT', cart: safeReadStorage(guestStorageKey()) });
      }

      if (mounted) {
        hydratedRef.current = true;
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, [isLoggedIn, customer?.id, customerReady]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    safeWriteStorage(activeCustomerKey, cart);
    if (!isLoggedIn || !customer?.id) return;
    api.saveCustomerCart(cart).catch(() => {
      // Best-effort sync; the UI should remain responsive even if the network blips.
    });
  }, [cart, activeCustomerKey, isLoggedIn, customer?.id]);

  const showToast = useCallback((product) => {
    setToast({ product, id: Date.now() });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const addItem = (product) => {
    dispatch({ type: 'ADD_ITEM', product });
    showToast(product);
  };
  const removeItem = (id) => dispatch({ type: 'REMOVE_ITEM', id });
  const updateQty = (id, qty) => dispatch({ type: 'UPDATE_QTY', id, qty });
  const clearCart = () => dispatch({ type: 'CLEAR' });

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addItem, removeItem, updateQty, clearCart, totalItems, totalPrice, toast }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
