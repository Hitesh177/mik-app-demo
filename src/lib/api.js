const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function parseDocumentCookies() {
  if (typeof document === 'undefined') return {};
  return document.cookie.split(';').reduce((acc, pair) => {
    const index = pair.indexOf('=');
    if (index < 0) return acc;
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (key) acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

function getCsrfToken(scope) {
  const cookies = parseDocumentCookies();
  return scope === 'customer'
    ? cookies.mik_customer_csrf_token
    : cookies.mik_admin_csrf_token;
}

async function request(path, {
  method = 'GET',
  body,
  retryOnAuth = true,
  scope = 'admin',
} = {}) {
  const unsafeMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const payload = body ?? (unsafeMethod ? {} : undefined);
  const headers = {};
  if (unsafeMethod) headers['Content-Type'] = 'application/json';
  const csrfToken = unsafeMethod ? getCsrfToken(scope) : '';
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!res.ok) {
    if (
      res.status === 401 &&
      retryOnAuth &&
      !['/admin/login', '/admin/refresh', '/admin/logout', '/customer/refresh', '/customer/logout'].includes(path)
    ) {
      const refreshed = await refreshSession(scope);
      if (refreshed?.ok !== false) {
        return request(path, {
          method,
          body,
          retryOnAuth: false,
          scope,
        });
      }
    }

    const error = new Error(data.error || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.payload = data;
    throw error;
  }

  return data;
}

async function refreshSession(scope) {
  const path = scope === 'customer' ? '/customer/refresh' : '/admin/refresh';
  return request(path, {
    method: 'POST',
    retryOnAuth: false,
    scope,
  });
}

export const api = {
  getBootstrap: () => request('/bootstrap'),
  getProducts: () => request('/products'),
  getOrders: () => request('/orders'),
  getOffers: () => request('/offers'),

  loginAdmin: async (email, password) => {
    const data = await request('/admin/login', {
      method: 'POST',
      body: { email, password },
      retryOnAuth: false,
      scope: 'admin',
    });
    return data;
  },
  refreshAdminSession: () => refreshSession('admin'),
  logoutAdmin: async () => {
    await request('/admin/logout', {
      method: 'POST',
      retryOnAuth: false,
      scope: 'admin',
    });
  },
  getAdminMe: () => request('/admin/me', { scope: 'admin' }),
  createOrder: (order) => request('/orders', { method: 'POST', body: order, scope: 'customer' }),
  updateOrderStatus: (id, status) => request(`/orders/${id}`, { method: 'PATCH', body: { status }, scope: 'admin' }),
  createProduct: (product) => request('/products', { method: 'POST', body: product, scope: 'admin' }),
  updateProduct: (id, updates) => request(`/products/${id}`, { method: 'PUT', body: updates, scope: 'admin' }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE', scope: 'admin' }),
  importProducts: (products) => request('/products/import', { method: 'POST', body: { products }, scope: 'admin' }),
  getCoupons: () => request('/coupons', { scope: 'admin' }),
  createCoupon: (coupon) => request('/coupons', { method: 'POST', body: coupon, scope: 'admin' }),
  updateCoupon: (id, updates) => request(`/coupons/${id}`, { method: 'PUT', body: updates, scope: 'admin' }),
  deleteCoupon: (id) => request(`/coupons/${id}`, { method: 'DELETE', scope: 'admin' }),
  createOffer: (offer) => request('/offers', { method: 'POST', body: offer, scope: 'admin' }),
  updateOffer: (id, updates) => request(`/offers/${id}`, { method: 'PUT', body: updates, scope: 'admin' }),
  deleteOffer: (id) => request(`/offers/${id}`, { method: 'DELETE', scope: 'admin' }),

  startWixLogin: () => request('/customer/wix/start', { method: 'POST', retryOnAuth: false, scope: 'customer' }),
  finishWixLogin: (code, state) => request('/customer/wix/callback', { method: 'POST', body: { code, state }, retryOnAuth: false, scope: 'customer' }),
  refreshCustomerSession: () => refreshSession('customer'),
  logoutCustomer: async () => {
    await request('/customer/logout', {
      method: 'POST',
      retryOnAuth: false,
      scope: 'customer',
    });
  },
  getCustomerMe: () => request('/customer/me', { scope: 'customer' }),
  getCustomerOrders: () => request('/customer/orders', { scope: 'customer' }),
  getCustomerCart: () => request('/customer/cart', { scope: 'customer' }),
  clearCustomerCart: () => request('/customer/cart', { method: 'DELETE', scope: 'customer' }),
  addCartItem: (productId, quantity = 1, variantId = '') => request('/commerce/cart/items', { method: 'POST', body: { product_id: productId, quantity, variant_id: variantId }, scope: 'customer' }),
  updateCartItem: (lineItemId, quantity) => request(`/commerce/cart/items/${encodeURIComponent(lineItemId)}`, { method: 'PATCH', body: { quantity }, scope: 'customer' }),
  removeCartItem: (lineItemId) => request(`/commerce/cart/items/${encodeURIComponent(lineItemId)}`, { method: 'DELETE', scope: 'customer' }),
  applyCartCoupon: (code) => request('/commerce/cart/coupon', { method: 'POST', body: { code }, scope: 'customer' }),
  removeCartCoupon: () => request('/commerce/cart/coupon', { method: 'DELETE', scope: 'customer' }),
  createWixCheckout: () => request('/commerce/checkout', { method: 'POST', scope: 'customer' }),
  updateCustomerProfile: (updates) => request('/customer/profile', { method: 'PATCH', body: updates, scope: 'customer' }),
  getAdminAnalytics: () => request('/admin/analytics', { scope: 'admin' }),
  getAdminAuditLogs: (limit = 25) => request(`/admin/audit-logs?limit=${encodeURIComponent(limit)}`, { scope: 'admin' }),
};
