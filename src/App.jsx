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
import { Analytics } from '@vercel/analytics/react';

import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import MyOrdersPage from './pages/MyOrdersPage';
import CustomerAccountPage from './pages/CustomerAccountPage';
import WixAuthCallbackPage from './pages/WixAuthCallbackPage';
import CategoryPage from './pages/CategoryPage';
import CategoriesPage from './pages/CategoriesPage';
import ProductPage from './pages/ProductPage';
import InfoPage from './pages/InfoPage';
import AboutPage from './pages/AboutPage';
import CustomerSupportPage from './pages/CustomerSupportPage';
import ShippingReturnsPage from './pages/ShippingReturnsPage';
import TermsConditionsPage from './pages/TermsConditionsPage';
import BlogPage from './pages/BlogPage';
import ServicesPage from './pages/ServicesPage';
import LegacyStorePage from './pages/LegacyStorePage';
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
        <Route path="/account/my-orders" element={<MyOrdersPage />} />
        <Route path="/account/callback" element={<WixAuthCallbackPage />} />
        <Route path="/login" element={<CustomerAccountPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPage />} />
        <Route path="/post/:legacyPostSlug" element={<BlogPage legacyIndex />} />
        <Route path="/category/:categoryId" element={<CategoryPage />} />
        <Route path="/product/:productSlug" element={<ProductPage />} />
        <Route path="/product-page/:productSlug" element={<ProductPage />} />
        <Route path="/zh/product-page/:productSlug" element={<ProductPage />} />

        {/* Chinese Wix URLs are separate ranking URLs and must remain reachable. */}
        <Route path="/zh" element={<HomePage />} />
        <Route path="/zh/cart" element={<CartPage />} />
        <Route path="/zh/checkout" element={<CheckoutPage />} />
        <Route path="/zh/order-confirmation" element={<OrderConfirmationPage />} />
        <Route path="/zh/my-orders" element={<MyOrdersPage />} />
        <Route path="/zh/account" element={<CustomerAccountPage />} />
        <Route path="/zh/account/my-orders" element={<MyOrdersPage />} />
        <Route path="/zh/login" element={<CustomerAccountPage />} />
        <Route path="/zh/categories" element={<CategoriesPage />} />
        <Route path="/zh/category/:categoryId" element={<CategoryPage />} />
        <Route path="/zh/blog" element={<BlogPage />} />
        <Route path="/zh/blog/:slug" element={<BlogPage />} />
        <Route path="/zh/post/:legacyPostSlug" element={<BlogPage legacyIndex />} />
        <Route path="/zh/daily-groceries" element={<CategoryPage categoryIdOverride="daily-groceries" />} />
        <Route path="/zh/everyday" element={<CategoryPage categoryIdOverride="everyday" />} />
        <Route path="/zh/flour-rice-pulses" element={<CategoryPage categoryIdOverride="flour-rice-pulses" />} />
        <Route path="/zh/fresh-finds" element={<CategoryPage categoryIdOverride="fresh-finds" />} />
        <Route path="/zh/ghee-oil-butter" element={<CategoryPage categoryIdOverride="ghee-oil-butter" />} />
        <Route path="/zh/ground-spices" element={<CategoryPage categoryIdOverride="ground-spices" />} />
        <Route path="/zh/whole-spices" element={<CategoryPage categoryIdOverride="whole-spices" />} />
        <Route path="/zh/equipment" element={<CategoryPage categoryIdOverride="equipment" />} />
        <Route path="/zh/personal-hygiene" element={<CategoryPage categoryIdOverride="personal-hygiene" />} />
        <Route path="/zh/ready-to-eat" element={<CategoryPage categoryIdOverride="ready-to-eat" />} />
        <Route path="/zh/sweets" element={<CategoryPage categoryIdOverride="sweets" />} />
        <Route path="/zh/tea-coffee-beverages" element={<CategoryPage categoryIdOverride="daily-groceries" />} />

        {/* Existing Wix collection paths stay indexable on the new storefront. */}
        <Route path="/daily-groceries" element={<CategoryPage categoryIdOverride="daily-groceries" />} />
        <Route path="/everyday" element={<CategoryPage categoryIdOverride="everyday" />} />
        <Route path="/flour-rice-pulses" element={<CategoryPage categoryIdOverride="flour-rice-pulses" />} />
        <Route path="/fresh-finds" element={<CategoryPage categoryIdOverride="fresh-finds" />} />
        <Route path="/ghee-oil-butter" element={<CategoryPage categoryIdOverride="ghee-oil-butter" />} />
        <Route path="/ground-spices" element={<CategoryPage categoryIdOverride="ground-spices" />} />
        <Route path="/whole-spices" element={<CategoryPage categoryIdOverride="whole-spices" />} />
        <Route path="/equipment" element={<CategoryPage categoryIdOverride="equipment" />} />
        <Route path="/personal-hygiene" element={<CategoryPage categoryIdOverride="personal-hygiene" />} />
        <Route path="/ready-to-eat" element={<CategoryPage categoryIdOverride="ready-to-eat" />} />
        <Route path="/sweets" element={<CategoryPage categoryIdOverride="sweets" />} />
        <Route path="/tea-coffee-beverages" element={<CategoryPage categoryIdOverride="daily-groceries" />} />
        <Route path="/mdh-haldirams" element={<CategoryPage categoryIdOverride="mdh-haldirams" />} />
        <Route path="/most-popular" element={<HomePage />} />
        <Route path="/deals-discounts-mikstore-taiwan" element={<LegacyStorePage type="deals" />} />
        <Route path="/mik-brand-taiwan" element={<LegacyStorePage type="brand" />} />
        <Route path="/mik-indian-stores-taiwan-shopnow" element={<HomePage />} />
        <Route path="/order-online" element={<LegacyStorePage type="order" />} />
        <Route path="/start-your-cart" element={<CartPage />} />

        {/* Existing Wix information paths render in place instead of changing URL. */}
        <Route path="/customer-support" element={<CustomerSupportPage />} />
        <Route path="/shipping-returns" element={<ShippingReturnsPage />} />
        <Route path="/terms-conditions" element={<TermsConditionsPage />} />
        <Route path="/zh/terms-conditions" element={<TermsConditionsPage />} />
        <Route path="/about-us" element={<AboutPage />} />
        <Route path="/ecpay-creditcard-mikstore-taiwan" element={<InfoPage slug="terms" />} />
        <Route path="/gift-card" element={<LegacyStorePage type="gift" />} />
        <Route path="/groups" element={<LegacyStorePage type="groups" />} />
        <Route path="/loyalty" element={<LegacyStorePage type="loyalty" />} />
        <Route path="/members" element={<CustomerAccountPage />} />
        <Route path="/refer-friends" element={<LegacyStorePage type="referral" />} />
        <Route path="/referral" element={<LegacyStorePage type="referral" />} />
        <Route path="/book-online" element={<ServicesPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/:legacyServiceSlug" element={<ServicesPage />} />
        <Route path="/privacy" element={<InfoPage slug="privacy" />} />
        <Route path="/terms" element={<Navigate to="/terms-conditions" replace />} />
        <Route path="/shipping" element={<Navigate to="/shipping-returns" replace />} />
        <Route path="/returns" element={<Navigate to="/shipping-returns" replace />} />
        <Route path="/faq" element={<CustomerSupportPage />} />
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

        {/* Newly created Wix collections work without adding another route. */}
        <Route path="/zh/:collectionSlug" element={<CategoryPage />} />
        <Route path="/:collectionSlug" element={<CategoryPage />} />

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
                <Analytics />
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
