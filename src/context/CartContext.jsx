import { createContext, useContext, useEffect, useReducer, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { useCustomer } from './CustomerContext';

const CartContext = createContext(null);

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const key = action.product.cart_key || `${action.product.id}:${action.product.variant_id || ''}`;
      const existing = state.find(i => (i.cart_key || `${i.id}:${i.variant_id || ''}`) === key);
      if (existing) {
        return state.map(i => ((i.cart_key || `${i.id}:${i.variant_id || ''}`) === key ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...state, { ...action.product, cart_key: key, quantity: 1 }];
    }
    case 'REMOVE_ITEM':
      return state.filter(i => (i.cart_key || i.id) !== action.id);
    case 'UPDATE_QTY':
      if (action.qty <= 0) return state.filter(i => (i.cart_key || i.id) !== action.id);
      return state.map(i => ((i.cart_key || i.id) === action.id ? { ...i, quantity: action.qty } : i));
    case 'CLEAR':
      return [];
    case 'INIT':
      return Array.isArray(action.cart) ? action.cart : [];
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const { customer, isReady: customerReady } = useCustomer();
  const [cart, dispatch] = useReducer(cartReducer, []);
  const [toast, setToast] = useState(null);
  const [syncError, setSyncError] = useState('');
  const [cartSummary, setCartSummary] = useState({ subtotal: 0, total: 0, discount: 0, coupon: null });

  const syncCanonicalCart = useCallback((response) => {
    dispatch({ type: 'INIT', cart: response.items || [] });
    setCartSummary({
      subtotal: Number(response.subtotal || 0),
      total: Number(response.total || 0),
      discount: Number(response.discount || 0),
      coupon: response.coupon || null,
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      if (!customerReady) return;
      try {
        const response = await api.getCustomerCart();
        if (mounted) syncCanonicalCart(response);
      } catch (error) {
        if (mounted) setSyncError(error.message || 'Could not load the Wix cart');
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, [customer?.id, customerReady, syncCanonicalCart]);

  const showToast = useCallback((product) => {
    setToast({ product, id: Date.now() });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const addItem = (product, variantId = product.variant_id || '') => {
    setSyncError('');
    return api.addCartItem(product.wix_product_id || product.id, 1, variantId)
      .then(response => {
        syncCanonicalCart(response);
        showToast(product);
      })
      .catch(error => {
        setSyncError(error.message || 'Could not update the Wix cart');
        api.getCustomerCart().then(syncCanonicalCart).catch(() => {});
      });
  };
  const removeItem = (id) => {
    const item = cart.find(entry => (entry.cart_key || entry.id) === id);
    dispatch({ type: 'REMOVE_ITEM', id });
    if (!item?.wix_line_item_id) return;
    api.removeCartItem(item.wix_line_item_id)
      .then(syncCanonicalCart)
      .catch(error => setSyncError(error.message || 'Could not update the Wix cart'));
  };
  const updateQty = (id, qty) => {
    const item = cart.find(entry => (entry.cart_key || entry.id) === id);
    if (qty <= 0) {
      removeItem(id);
      return;
    }
    dispatch({ type: 'UPDATE_QTY', id, qty });
    if (!item?.wix_line_item_id) return;
    api.updateCartItem(item.wix_line_item_id, qty)
      .then(syncCanonicalCart)
      .catch(error => setSyncError(error.message || 'Could not update the Wix cart'));
  };
  const clearCart = () => {
    dispatch({ type: 'CLEAR' });
    return api.clearCustomerCart().then(syncCanonicalCart).catch(error => setSyncError(error.message || 'Could not clear the Wix cart'));
  };

  const applyCoupon = (code) => api.applyCartCoupon(code).then(response => {
    syncCanonicalCart(response);
    setSyncError('');
    return response;
  });
  const removeCoupon = () => api.removeCartCoupon().then(response => {
    syncCanonicalCart(response);
    setSyncError('');
    return response;
  });

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const itemSubtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalPrice = cartSummary.total || itemSubtotal;

  return (
    <CartContext.Provider value={{ cart, addItem, removeItem, updateQty, clearCart, applyCoupon, removeCoupon, cartSummary, totalItems, totalPrice, toast, syncError }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
