import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { CustomerProvider } from './context/CustomerContext';
import { WishlistProvider } from './context/WishlistContext';
import { DarkModeProvider } from './context/DarkModeContext';
import Toast from './components/Toast';
import WhatsAppButton from './components/WhatsAppButton';
import PromoPopup from './components/PromoPopup';
import ScrollToTopButton from './components/ScrollToTopButton';

import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import MyOrdersPage from './pages/MyOrdersPage';
import CustomerAccountPage from './pages/CustomerAccountPage';
import CategoryPage from './pages/CategoryPage';
import CategoriesPage from './pages/CategoriesPage';
import ProductPage from './pages/ProductPage';
import InfoPage from './pages/InfoPage';
import BlogPage from './pages/BlogPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminProductFormPage from './pages/admin/AdminProductFormPage';
import AdminBulkUploadPage from './pages/admin/AdminBulkUploadPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminOrderDetailPage from './pages/admin/AdminOrderDetailPage';
import AdminCouponsPage from './pages/admin/AdminCouponsPage';
import AdminOffersPage from './pages/admin/AdminOffersPage';

function AdminGuard({ children }) {
  const { isLoggedIn, isReady } = useAdmin();
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500">
        Loading admin data...
      </div>
    );
  }
  if (!isLoggedIn) return <Navigate to="/admin" replace />;
  return children;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-page-fade">
      <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
        <Route path="/my-orders" element={<MyOrdersPage />} />
        <Route path="/account" element={<CustomerAccountPage />} />
        <Route path="/login" element={<CustomerAccountPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPage />} />
        <Route path="/category/:categoryId" element={<CategoryPage />} />
        <Route path="/product/:productSlug" element={<ProductPage />} />
        <Route path="/privacy" element={<InfoPage slug="privacy" />} />
        <Route path="/terms" element={<InfoPage slug="terms" />} />
        <Route path="/shipping" element={<InfoPage slug="shipping" />} />
        <Route path="/returns" element={<InfoPage slug="returns" />} />
        <Route path="/faq" element={<InfoPage slug="faq" />} />
        <Route path="/contact" element={<InfoPage slug="contact" />} />

        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
        <Route path="/admin/products" element={<AdminGuard><AdminProductsPage /></AdminGuard>} />
        <Route path="/admin/products/new" element={<AdminGuard><AdminProductFormPage /></AdminGuard>} />
        <Route path="/admin/products/bulk-upload" element={<AdminGuard><AdminBulkUploadPage /></AdminGuard>} />
        <Route path="/admin/products/:id" element={<AdminGuard><AdminProductFormPage /></AdminGuard>} />
        <Route path="/admin/orders" element={<AdminGuard><AdminOrdersPage /></AdminGuard>} />
        <Route path="/admin/orders/:id" element={<AdminGuard><AdminOrderDetailPage /></AdminGuard>} />
        <Route path="/admin/coupons" element={<AdminGuard><AdminCouponsPage /></AdminGuard>} />
        <Route path="/admin/offers" element={<AdminGuard><AdminOffersPage /></AdminGuard>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <DarkModeProvider>
      <AdminProvider>
        <CustomerProvider>
          <WishlistProvider>
            <CartProvider>
              <Toast />
              <PromoPopup />
              <BrowserRouter>
                <AnimatedRoutes />
                <WhatsAppButton />
                <ScrollToTopButton />
              </BrowserRouter>
            </CartProvider>
          </WishlistProvider>
        </CustomerProvider>
      </AdminProvider>
    </DarkModeProvider>
  );
}
