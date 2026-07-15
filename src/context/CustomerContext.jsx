import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const CustomerContext = createContext(null);

export function CustomerProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const refreshCustomer = async () => {
    try {
      const me = await api.getCustomerMe();
      setCustomer(me.customer || null);
      setOrders(Array.isArray(me.orders) ? me.orders : []);
      return me;
    } catch (error) {
      setCustomer(null);
      setOrders([]);
      throw error;
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await api.getCustomerMe();
        if (!mounted) return;
        setCustomer(me.customer || null);
        setOrders(Array.isArray(me.orders) ? me.orders : []);
      } catch {
        if (mounted) {
          setCustomer(null);
          setOrders([]);
        }
      } finally {
        if (mounted) setIsReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const signInWithGoogle = async (credential) => {
    setLoading(true);
    try {
      const result = await api.googleLoginCustomer(credential);
      setCustomer(result.customer || null);
      setOrders(Array.isArray(result.orders) ? result.orders : []);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await api.logoutCustomer();
    setCustomer(null);
    setOrders([]);
  };

  const updateProfile = async (updates) => {
    const result = await api.updateCustomerProfile(updates);
    setCustomer(result.customer || null);
    setOrders(Array.isArray(result.orders) ? result.orders : orders);
    return result;
  };

  const reloadOrders = async () => {
    const result = await api.getCustomerOrders();
    setOrders(Array.isArray(result.orders) ? result.orders : result);
    return result;
  };

  return (
    <CustomerContext.Provider value={{
      customer,
      orders,
      isReady,
      loading,
      isLoggedIn: Boolean(customer),
      signInWithGoogle,
      logout,
      updateProfile,
      refreshCustomer,
      reloadOrders,
      setCustomer,
      setOrders,
    }}>
      {children}
    </CustomerContext.Provider>
  );
}

export const useCustomer = () => useContext(CustomerContext);
