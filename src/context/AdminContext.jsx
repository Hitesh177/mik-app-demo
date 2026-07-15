import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [offers, setOffers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  const refreshInsightsSilent = async () => {
    try {
      await reloadInsights();
    } catch {
      // Ignore analytics refresh issues.
    }
  };

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const [bootstrapData] = await Promise.all([
          api.getBootstrap(),
        ]);

        if (!mounted) return;
        setProducts(Array.isArray(bootstrapData.products) ? bootstrapData.products : []);
        setOrders(Array.isArray(bootstrapData.orders) ? bootstrapData.orders : []);
        setOffers(Array.isArray(bootstrapData.offers) ? bootstrapData.offers : []);
        try {
          const [analyticsData, auditData] = await Promise.all([
            api.getAdminAnalytics(),
            api.getAdminAuditLogs(10),
          ]);
          setAnalytics(analyticsData || null);
          setAuditLogs(Array.isArray(auditData?.logs) ? auditData.logs : []);
        } catch {
          setAnalytics(null);
          setAuditLogs([]);
        }

        try {
          await api.getAdminMe();
          if (mounted) setIsLoggedIn(true);
        } catch {
          if (mounted) setIsLoggedIn(false);
        }
      } catch {
        // Keep the app usable even if the backend is temporarily unavailable.
      } finally {
        if (mounted) setIsReady(true);
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email, password) => {
    await api.loginAdmin(email, password);
    setIsLoggedIn(true);
    reloadInsights().catch(() => {
      setAnalytics(null);
      setAuditLogs([]);
    });
    return true;
  };

  const logout = async () => {
    await api.logoutAdmin();
    setIsLoggedIn(false);
  };

  const addProduct = async (product) => {
    const created = await api.createProduct(product);
    setProducts(prev => [created, ...prev.filter(p => String(p.id) !== String(created.id))]);
    refreshInsightsSilent();
    return created;
  };

  const updateProduct = async (id, updates) => {
    const updated = await api.updateProduct(id, updates);
    setProducts(prev => prev.map(p => String(p.id) === String(id) ? updated : p));
    refreshInsightsSilent();
    return updated;
  };

  const deleteProduct = async (id) => {
    await api.deleteProduct(id);
    setProducts(prev => prev.filter(p => String(p.id) !== String(id)));
    refreshInsightsSilent();
  };

  const importProducts = async (newProducts) => {
    const { imported } = await api.importProducts(newProducts);
    const importedIds = new Set(imported.map(p => String(p.id)));
    setProducts(prev => [...imported, ...prev.filter(p => !importedIds.has(String(p.id)))]);
    refreshInsightsSilent();
    return imported;
  };

  const reloadOffers = async () => {
    const offersData = await api.getOffers();
    setOffers(Array.isArray(offersData) ? offersData : []);
    return offersData;
  };

  const reloadInsights = async () => {
    const [analyticsData, auditData] = await Promise.all([
      api.getAdminAnalytics(),
      api.getAdminAuditLogs(10),
    ]);
    setAnalytics(analyticsData || null);
    setAuditLogs(Array.isArray(auditData?.logs) ? auditData.logs : []);
    return { analyticsData, auditData };
  };

  const addOffer = async (offer) => {
    const { offer: created } = await api.createOffer(offer);
    setOffers(prev => [created, ...prev.filter(o => String(o.id) !== String(created.id))]);
    refreshInsightsSilent();
    return created;
  };

  const updateOffer = async (id, updates) => {
    const { offer: updated } = await api.updateOffer(id, updates);
    setOffers(prev => prev.map(o => String(o.id) === String(id) ? updated : o));
    refreshInsightsSilent();
    return updated;
  };

  const deleteOffer = async (id) => {
    await api.deleteOffer(id);
    setOffers(prev => prev.filter(o => String(o.id) !== String(id)));
    refreshInsightsSilent();
  };

  const updateOrderStatus = async (id, status) => {
    const updated = await api.updateOrderStatus(id, status);
    setOrders(prev => prev.map(o => String(o.id) === String(id) ? updated : o));
    refreshInsightsSilent();
    return updated;
  };

  const addOrder = async (order) => {
    const created = await api.createOrder(order);
    setOrders(prev => [created, ...prev.filter(o => String(o.id) !== String(created.id))]);
    refreshInsightsSilent();
    return created;
  };

  return (
    <AdminContext.Provider value={{
      isLoggedIn,
      isReady,
      login,
      logout,
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      importProducts,
      offers,
      reloadOffers,
      addOffer,
      updateOffer,
      deleteOffer,
      orders,
      updateOrderStatus,
      addOrder,
      analytics,
      auditLogs,
      reloadInsights,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
