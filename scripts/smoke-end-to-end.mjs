import { execFileSync } from 'node:child_process';
import { createHmac, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const STORE_SCRIPT = path.join(ROOT, 'server', 'sqlite_store.py');
const DB_PATH = path.join(ROOT, 'server', 'data', 'mik.sqlite');
const FRONTEND_BASE = 'http://127.0.0.1:5173';
const BACKEND_BASE = 'http://127.0.0.1:4173';
const AUTH_SECRET = process.env.MIK_AUTH_SECRET || 'mik-store-auth-secret';
const ADMIN_EMAIL = 'admin@mik.store';
const ADMIN_PASSWORD = 'mik2024';

const testId = `smoke-${Date.now()}`;
const entities = {
  productIds: [],
  couponIds: [],
  offerIds: [],
  orderIds: [],
  customerIds: [],
  customerSessionIds: [],
};
const cookieJar = new Map();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function cookieHeader() {
  return Array.from(cookieJar.entries()).map(([name, value]) => `${name}=${value}`).join('; ');
}

function ingestSetCookie(setCookie) {
  if (!setCookie) return;
  const cookies = Array.isArray(setCookie)
    ? setCookie
    : String(setCookie).split(/,(?=[^;]+=[^;]+)/g);
  for (const raw of cookies) {
    const [pair] = String(raw).split(';');
    const index = pair.indexOf('=');
    if (index < 0) continue;
    const name = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (!name) continue;
    if (value === '') cookieJar.delete(name);
    else cookieJar.set(name, value);
  }
}

function callStore(action, payload = {}) {
  const result = execFileSync('python3', [STORE_SCRIPT], {
    input: JSON.stringify({ action, payload }),
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  }).trim();

  if (!result) {
    throw new Error(`Store helper returned no output for action ${action}`);
  }

  const parsed = JSON.parse(result);
  if (!parsed.ok) {
    throw new Error(parsed.error || `Store action ${action} failed`);
  }

  return parsed.result;
}

function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', AUTH_SECRET).update(body).digest('base64url');
  return `${body}.${signature}`;
}

async function request(baseUrl, pathName, { method = 'GET', headers = {}, body, scope = (pathName.startsWith('/api/customer') || pathName === '/api/orders' ? 'customer' : 'admin') } = {}) {
  const unsafeMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const payload = body ?? (unsafeMethod ? {} : undefined);
  const csrfToken = unsafeMethod ? (scope === 'customer' ? cookieJar.get('mik_customer_csrf_token') : cookieJar.get('mik_admin_csrf_token')) || '' : '';
  const response = await fetch(`${baseUrl}${pathName}`, {
    method,
    headers: {
      ...(unsafeMethod ? { 'Content-Type': 'application/json' } : {}),
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      ...(cookieJar.size ? { Cookie: cookieHeader() } : {}),
      ...headers,
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }
  ingestSetCookie(response.headers.get('set-cookie'));

  return { response, data };
}

function cleanup() {
  if (!fs.existsSync(DB_PATH)) return;
  const payload = JSON.stringify({
    order_ids: entities.orderIds,
    coupon_ids: entities.couponIds,
    offer_ids: entities.offerIds,
    product_ids: entities.productIds,
    customer_ids: entities.customerIds,
    test_id: testId,
  });

  const cleanupScript = `
import json
import sqlite3
import sys

db_path = sys.argv[1]
payload = json.loads(sys.argv[2])
conn = sqlite3.connect(db_path)
conn.execute('PRAGMA foreign_keys = ON')

for order_id in payload.get('order_ids', []):
    conn.execute('DELETE FROM orders WHERE id = ?', (order_id,))
for coupon_id in payload.get('coupon_ids', []):
    conn.execute('DELETE FROM coupons WHERE id = ?', (coupon_id,))
for offer_id in payload.get('offer_ids', []):
    conn.execute('DELETE FROM hero_offers WHERE id = ?', (offer_id,))
for product_id in payload.get('product_ids', []):
    conn.execute('DELETE FROM products WHERE id = ?', (product_id,))
for customer_id in payload.get('customer_ids', []):
    conn.execute('DELETE FROM customers WHERE id = ?', (customer_id,))
    try:
        conn.execute('DELETE FROM customer_cart_items WHERE customer_id = ?', (customer_id,))
    except sqlite3.OperationalError:
        pass

try:
    conn.execute('DELETE FROM admin_audit_logs WHERE summary LIKE ?', ('%' + payload.get('test_id', '') + '%',))
except sqlite3.OperationalError:
    pass
conn.commit()
`;

  try {
    execFileSync('python3', ['-c', cleanupScript, DB_PATH, payload], { encoding: 'utf8' });
  } catch (error) {
    console.error('Cleanup warning:', error.message);
  }
}

async function main() {
  const logs = [];
  const start = Date.now();
  let createdCustomer;
  let customerId;
  let customerSessionId;
  let testProduct;
  let testCoupon;
  let stackableCoupon;
  let testOffer;
  let firstOrder;
  let secondOrder;

  try {
    logs.push('1. Frontend shell and proxy');
    let res = await request(FRONTEND_BASE, '/');
    assert(res.response.ok, 'Frontend shell should load at /');

    const backendHealth = await request(BACKEND_BASE, '/api/health');
    assert(backendHealth.response.ok, 'Backend health should load directly');
    assert(
      backendHealth.response.headers.get('x-content-type-options') === 'nosniff',
      'Backend should send X-Content-Type-Options'
    );
    assert(
      backendHealth.response.headers.get('x-frame-options') === 'DENY',
      'Backend should send X-Frame-Options'
    );
    assert(
      backendHealth.response.headers.get('referrer-policy') === 'no-referrer',
      'Backend should send Referrer-Policy'
    );

    res = await request(FRONTEND_BASE, '/api/health');
    assert(res.response.ok, 'Frontend proxy should expose /api/health');

    const blockedOrigin = await request(BACKEND_BASE, '/api/orders', {
      method: 'POST',
      headers: { Origin: 'https://evil.example' },
      body: {},
    });
    assert(blockedOrigin.response.status === 403, 'Unsafe requests from disallowed origins should be blocked');

    const frontendBootstrap = await request(FRONTEND_BASE, '/api/bootstrap');
    assert(frontendBootstrap.response.ok, 'Frontend proxy should expose /api/bootstrap');
    assert(Array.isArray(frontendBootstrap.data.products), 'Bootstrap should include products');
    assert(Array.isArray(frontendBootstrap.data.offers), 'Bootstrap should include offers');

    logs.push('2. Admin auth and backend reflection');
    const login = await request(FRONTEND_BASE, '/api/admin/login', {
      method: 'POST',
      body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    assert(login.response.ok, `Admin login failed: ${login.data.error || login.response.status}`);
    const loginCookies = login.response.headers.get('set-cookie') || '';
    assert(loginCookies.includes('HttpOnly'), 'Admin login should set HttpOnly cookies');
    assert(loginCookies.includes('mik_admin_csrf_token'), 'Admin login should set a CSRF cookie');
    const adminHeaders = {};

    const forgedAdminWrite = await fetch(`${FRONTEND_BASE}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader(),
      },
      body: JSON.stringify({
        id: `forged-${testId}`,
        name_en: `Forged ${testId}`,
        name_zh: '偽造',
        price: 1,
        category: 'spices',
        stock: 1,
      }),
    });
    assert(forgedAdminWrite.status === 403, 'Admin writes without CSRF must be rejected');

    const adminMe = await request(FRONTEND_BASE, '/api/admin/me', { headers: adminHeaders });
    assert(adminMe.response.ok, 'Admin /me should succeed after login');
    assert(adminMe.data.admin?.email === ADMIN_EMAIL, 'Admin /me should return the logged-in admin');

    logs.push('3. Product CRUD reflected to frontend data');
    testProduct = {
      id: `prod-${testId}`,
      name_en: `Smoke Test Product ${testId}`,
      name_zh: '測試商品',
      price: 1000,
      category: 'spices',
      stock: 20,
      image_url: null,
      badge: 'New',
    };
    entities.productIds.push(testProduct.id);
    const createdProduct = await request(FRONTEND_BASE, '/api/products', {
      method: 'POST',
      headers: adminHeaders,
      body: testProduct,
    });
    assert(createdProduct.response.ok, `Product create failed: ${createdProduct.data.error || createdProduct.response.status}`);
    assert(createdProduct.data.id === testProduct.id, 'Created product id should round-trip');

    const productsAfterCreate = await request(FRONTEND_BASE, '/api/products');
    assert(productsAfterCreate.data.some?.(p => p.id === testProduct.id) || productsAfterCreate.data.find?.(p => p.id === testProduct.id), 'Frontend products endpoint should include created product');

    const bootstrapAfterProductCreate = await request(FRONTEND_BASE, '/api/bootstrap');
    assert(
      Array.isArray(bootstrapAfterProductCreate.data.products) &&
      bootstrapAfterProductCreate.data.products.some(p => p.id === testProduct.id),
      'Frontend bootstrap should include created product'
    );

    const updatedProduct = await request(FRONTEND_BASE, `/api/products/${testProduct.id}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: { price: 1200, stock: 25 },
    });
    assert(updatedProduct.response.ok, `Product update failed: ${updatedProduct.data.error || updatedProduct.response.status}`);
    assert(updatedProduct.data.price === 1200, 'Updated product price should persist');
    assert(updatedProduct.data.stock === 25, 'Updated product stock should persist');

    logs.push('4. Offer CRUD reflected to homepage data');
    testOffer = {
      id: `offer-${testId}`,
      title: `Weekend Savings ${testId}`,
      subtitle: 'Backend offer should surface in the hero carousel',
      tag: 'Smoke Test',
      cta_label: 'Shop Now',
      href: '/',
      emoji: '✨',
      bg_from: 'from-purple-700',
      bg_to: 'to-indigo-900',
      accent: 'bg-white/20',
      sort_order: 99,
      active: true,
    };
    entities.offerIds.push(testOffer.id);
    const createdOffer = await request(FRONTEND_BASE, '/api/offers', {
      method: 'POST',
      headers: adminHeaders,
      body: testOffer,
    });
    assert(createdOffer.response.ok, `Offer create failed: ${createdOffer.data.error || createdOffer.response.status}`);
    assert(createdOffer.data.offer?.id === testOffer.id, 'Created offer should round-trip');

    const offersAfterCreate = await request(FRONTEND_BASE, '/api/offers');
    assert(
      Array.isArray(offersAfterCreate.data) && offersAfterCreate.data.some(offer => offer.id === testOffer.id),
      'Frontend offers endpoint should include created offer'
    );

    const bootstrapAfterOfferCreate = await request(FRONTEND_BASE, '/api/bootstrap');
    assert(
      Array.isArray(bootstrapAfterOfferCreate.data.offers) &&
      bootstrapAfterOfferCreate.data.offers.some(offer => offer.id === testOffer.id),
      'Frontend bootstrap should include created offer'
    );

    logs.push('5. Coupon rules and validation');
    const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    testCoupon = {
      id: `coupon-${testId}`,
      code: `SMOKE20-${Date.now()}`,
      title: 'Smoke 20 Off',
      description: '20% off with min order amount and single-use limit',
      discount_type: 'percent',
      discount_value: 20,
      min_order_amount: 500,
      max_discount_amount: 250,
      usage_limit_total: 2,
      usage_limit_per_customer: 1,
      start_at: null,
      end_at: null,
      active: true,
      first_order_only: false,
      apply_scope: 'order',
      target_value: '',
      stackable: false,
    };
    entities.couponIds.push(testCoupon.id);
    const createdCoupon = await request(FRONTEND_BASE, '/api/coupons', {
      method: 'POST',
      headers: adminHeaders,
      body: testCoupon,
    });
    assert(createdCoupon.response.ok, `Coupon create failed: ${createdCoupon.data.error || createdCoupon.response.status}`);
    assert(createdCoupon.data.coupon?.code === testCoupon.code, 'Created coupon should round-trip');

    stackableCoupon = {
      id: `coupon-${testId}-stack`,
      code: `SMOKE20S-${Date.now()}`,
      title: 'Smoke 20 Stackable',
      description: '20% off stackable with loyalty',
      discount_type: 'percent',
      discount_value: 20,
      min_order_amount: 500,
      max_discount_amount: 250,
      usage_limit_total: 2,
      usage_limit_per_customer: 1,
      start_at: null,
      end_at: null,
      active: true,
      first_order_only: false,
      apply_scope: 'order',
      target_value: '',
      stackable: true,
    };
    entities.couponIds.push(stackableCoupon.id);
    const createdStackableCoupon = await request(FRONTEND_BASE, '/api/coupons', {
      method: 'POST',
      headers: adminHeaders,
      body: stackableCoupon,
    });
    assert(createdStackableCoupon.response.ok, `Stackable coupon create failed: ${createdStackableCoupon.data.error || createdStackableCoupon.response.status}`);

    const futureCoupon = {
      id: `coupon-${testId}-future`,
      code: `SMOKEFUT-${Date.now()}`,
      title: 'Smoke Future Coupon',
      description: 'Should not be valid yet',
      discount_type: 'fixed',
      discount_value: 100,
      min_order_amount: 0,
      max_discount_amount: 0,
      usage_limit_total: 1,
      usage_limit_per_customer: 1,
      start_at: futureStart,
      end_at: null,
      active: true,
      first_order_only: false,
      apply_scope: 'order',
      target_value: '',
      stackable: true,
    };
    entities.couponIds.push(futureCoupon.id);
    const createdFutureCoupon = await request(FRONTEND_BASE, '/api/coupons', {
      method: 'POST',
      headers: adminHeaders,
      body: futureCoupon,
    });
    assert(createdFutureCoupon.response.ok, `Future coupon create failed: ${createdFutureCoupon.data.error || createdFutureCoupon.response.status}`);

    const couponsAfterCreate = await request(FRONTEND_BASE, '/api/coupons', { headers: adminHeaders });
    assert(
      Array.isArray(couponsAfterCreate.data.coupons) &&
      couponsAfterCreate.data.coupons.some(coupon => coupon.code === testCoupon.code),
      'Frontend admin coupons endpoint should include created coupon'
    );

    logs.push('6. Customer auth, profile sync, and order history');
    createdCustomer = callStore('upsert_customer_from_google', {
      google_profile: {
        sub: `google-sub-${testId}`,
        email: `smoke-${testId}@example.com`,
        name: `Smoke Customer ${testId}`,
        picture: 'https://example.com/avatar.png',
      },
    });
    customerId = createdCustomer.id;
    entities.customerIds.push(customerId);

    customerSessionId = `csess-${randomUUID()}`;
    entities.customerSessionIds.push(customerSessionId);
    const customerRefreshExp = Date.now() + 30 * 24 * 60 * 60 * 1000;
    const customerRefreshToken = signToken({
      sid: customerSessionId,
      customer_id: customerId,
      email: createdCustomer.email,
      type: 'customer_refresh',
      exp: customerRefreshExp,
    });
    const customerAccessToken = signToken({
      sid: customerSessionId,
      customer_id: customerId,
      email: createdCustomer.email,
      type: 'customer_access',
      exp: Date.now() + 15 * 60 * 1000,
    });

    callStore('create_customer_session', {
      sid: customerSessionId,
      customer_id: customerId,
      refresh_token: customerRefreshToken,
      refresh_expires_at: new Date(customerRefreshExp).toISOString(),
    });
    cookieJar.set('mik_customer_access_token', customerAccessToken);
    cookieJar.set('mik_customer_refresh_token', customerRefreshToken);
    cookieJar.set('mik_customer_csrf_token', signToken({
      sid: customerSessionId,
      scope: 'customer',
      type: 'csrf',
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
    }));

    const forgedCustomerWrite = await fetch(`${FRONTEND_BASE}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader(),
      },
      body: JSON.stringify({
        customer_id: customerId,
        customer_name: `Smoke Customer ${testId}`,
        customer_phone: '+886 900 000 000',
        customer_address: 'No. 1, Smoke Street, Taipei City',
        payment_method: 'paytm',
        coupon_code: '',
        redeem_points: 0,
        items: [{ product_id: testProduct.id, quantity: 1 }],
      }),
    });
    assert(forgedCustomerWrite.status === 403, 'Customer writes without CSRF must be rejected');

    const customerMeBefore = await request(FRONTEND_BASE, '/api/customer/me', {
      headers: {},
    });
    assert(customerMeBefore.response.ok, 'Customer /me should succeed with signed token');
    assert(customerMeBefore.data.customer?.email === createdCustomer.email, 'Customer /me should return the created customer');
    assert(customerMeBefore.data.customer?.rewards?.points === 0, 'Fresh customer should start with 0 points');

    const cartBefore = await request(FRONTEND_BASE, '/api/customer/cart', { headers: {} });
    assert(cartBefore.response.ok, 'Customer cart should be readable');
    assert(Array.isArray(cartBefore.data.items), 'Customer cart should return an items array');

    const savedCart = await request(FRONTEND_BASE, '/api/customer/cart', {
      method: 'PUT',
      headers: {},
      body: {
        items: [
          { product_id: testProduct.id, quantity: 2 },
        ],
      },
    });
    assert(savedCart.response.ok, 'Customer cart save should succeed');
    assert(savedCart.data.items.some(item => item.id === testProduct.id && item.quantity === 2), 'Customer cart save should persist quantity');

    const cartAfterSave = await request(FRONTEND_BASE, '/api/customer/cart', { headers: {} });
    assert(cartAfterSave.data.items.some(item => item.id === testProduct.id && item.quantity === 2), 'Customer cart should reflect saved quantity');

    const profileUpdate = await request(FRONTEND_BASE, '/api/customer/profile', {
      method: 'PATCH',
      headers: {},
      body: {
        name: `Smoke Customer ${testId}`,
        phone: '+886 900 000 000',
        address: 'No. 1, Smoke Street, Taipei City',
      },
    });
    assert(profileUpdate.response.ok, `Customer profile update failed: ${profileUpdate.data.error || profileUpdate.response.status}`);
    assert(profileUpdate.data.customer?.phone === '+886 900 000 000', 'Profile phone should update');

    logs.push('7. Customer order creation reflected everywhere');
    const orderBodyOne = {
      customer_id: customerId,
      customer_name: `Smoke Customer ${testId}`,
      customer_phone: '+886 900 000 000',
      customer_address: 'No. 1, Smoke Street, Taipei City',
      payment_method: 'paytm',
      coupon_code: '',
      redeem_points: 0,
      items: [{ product_id: testProduct.id, quantity: 1 }],
    };
    const firstOrderResponse = await request(FRONTEND_BASE, '/api/orders', {
      method: 'POST',
      headers: {},
      body: orderBodyOne,
    });
    assert(firstOrderResponse.response.ok, `First order should succeed: ${firstOrderResponse.data.error || firstOrderResponse.response.status}`);
    firstOrder = firstOrderResponse.data;
    entities.orderIds.push(firstOrder.id);
    assert(firstOrder.total === 1200, 'First order total should reflect updated product price');
    assert(firstOrder.points_earned === 120, 'First order should earn points based on total');
    assert(Array.isArray(firstOrder.events) && firstOrder.events.some(event => event.status === 'pending'), 'First order should include order events');

    const customerAfterFirstOrder = await request(FRONTEND_BASE, '/api/customer/me', {
      headers: {},
    });
    assert(customerAfterFirstOrder.data.customer?.rewards?.points === 120, 'Customer should earn points after first order');
    assert(customerAfterFirstOrder.data.customer?.rewards?.can_redeem_100 === true, 'Customer should be able to redeem 100 points');
    assert(Array.isArray(customerAfterFirstOrder.data.cart) && customerAfterFirstOrder.data.cart.length === 0, 'Checkout should clear the synced customer cart');

    const firstOrderProgress = await request(FRONTEND_BASE, `/api/orders/${firstOrder.id}`, {
      method: 'PATCH',
      headers: {},
      body: { status: 'confirmed' },
    });
    assert(firstOrderProgress.response.ok, 'Order should transition to confirmed');
    assert(firstOrderProgress.data.events.some(event => event.status === 'confirmed'), 'Confirmed status should be recorded as an event');

    const firstOrderPacked = await request(FRONTEND_BASE, `/api/orders/${firstOrder.id}`, {
      method: 'PATCH',
      headers: {},
      body: { status: 'packed' },
    });
    assert(firstOrderPacked.response.ok, 'Order should transition to packed');
    assert(firstOrderPacked.data.events.some(event => event.status === 'packed'), 'Packed status should be recorded as an event');

    const firstOrderShipped = await request(FRONTEND_BASE, `/api/orders/${firstOrder.id}`, {
      method: 'PATCH',
      headers: {},
      body: { status: 'shipped' },
    });
    assert(firstOrderShipped.response.ok, 'Order should transition to shipped');
    assert(firstOrderShipped.data.events.some(event => event.status === 'shipped'), 'Shipped status should be recorded as an event');

    const failingOrder = await request(FRONTEND_BASE, '/api/orders', {
      method: 'POST',
      headers: {},
      body: {
        customer_id: customerId,
        customer_name: `Smoke Customer ${testId}`,
        customer_phone: '+886 900 000 000',
        customer_address: 'No. 1, Smoke Street, Taipei City',
        payment_method: 'paytm',
        coupon_code: testCoupon.code,
        redeem_points: 100,
        items: [{ product_id: testProduct.id, quantity: 1 }],
      },
    });
    assert(!failingOrder.response.ok, 'Non-stackable coupon should not combine with loyalty redemption');
    assert(
      String(failingOrder.data.error || '').toLowerCase().includes('cannot be combined'),
      `Expected non-stackable coupon validation error, got: ${failingOrder.data.error}`
    );

    const secondOrderResponse = await request(FRONTEND_BASE, '/api/orders', {
      method: 'POST',
      headers: {},
      body: {
        customer_id: customerId,
        customer_name: `Smoke Customer ${testId}`,
        customer_phone: '+886 900 000 000',
        customer_address: 'No. 1, Smoke Street, Taipei City',
        payment_method: 'paytm',
        coupon_code: stackableCoupon.code,
        redeem_points: 100,
        items: [{ product_id: testProduct.id, quantity: 1 }],
      },
    });
    assert(secondOrderResponse.response.ok, `Stackable coupon order should succeed: ${secondOrderResponse.data.error || secondOrderResponse.response.status}`);
    secondOrder = secondOrderResponse.data;
    entities.orderIds.push(secondOrder.id);
    assert(secondOrder.coupon_code === stackableCoupon.code, 'Second order should carry the coupon code');
    assert(secondOrder.coupon_discount_amount === 240, 'Second order should apply coupon discount');
    assert(secondOrder.discount_amount === 96, 'Second order should apply loyalty discount after coupon');
    assert(secondOrder.total === 864, 'Second order total should reflect coupon + loyalty discount');
    assert(secondOrder.points_earned === 86, 'Second order should earn points from the discounted total');
    assert(Array.isArray(secondOrder.events) && secondOrder.events.some(event => event.status === 'pending'), 'Second order should include tracking events');

    const secondCustomerState = await request(FRONTEND_BASE, '/api/customer/me', {
      headers: {},
    });
    assert(secondCustomerState.data.customer?.rewards?.points === 106, 'Customer points should update after redemption and earnings');

    const customerOrders = await request(FRONTEND_BASE, '/api/customer/orders', {
      headers: {},
    });
    assert(
      Array.isArray(customerOrders.data.orders) &&
      customerOrders.data.orders.some(order => order.id === secondOrder.id),
      'Customer order history should include the latest order'
    );

    const adminOrders = await request(FRONTEND_BASE, '/api/orders', { headers: adminHeaders });
    assert(
      Array.isArray(adminOrders.data) &&
      adminOrders.data.some(order => order.id === secondOrder.id),
      'Admin orders endpoint should include the customer order'
    );

    const bootstrapAfterOrders = await request(FRONTEND_BASE, '/api/bootstrap');
    assert(
      Array.isArray(bootstrapAfterOrders.data.orders) &&
      bootstrapAfterOrders.data.orders.some(order => order.id === secondOrder.id),
      'Frontend bootstrap should include newly placed orders'
    );

    const analytics = await request(FRONTEND_BASE, '/api/admin/analytics', { headers: adminHeaders });
    assert(analytics.response.ok, 'Admin analytics endpoint should succeed');
    assert(analytics.data.kpis?.total_orders >= 2, 'Admin analytics should report total orders');
    assert(analytics.data.kpis?.coupon_redemptions >= 1, 'Admin analytics should report coupon redemptions');
    assert(Array.isArray(analytics.data.recent_audit_logs) && analytics.data.recent_audit_logs.length > 0, 'Admin analytics should include recent audit logs');

    const auditLogs = await request(FRONTEND_BASE, '/api/admin/audit-logs?limit=20', { headers: adminHeaders });
    assert(auditLogs.response.ok, 'Audit logs endpoint should succeed');
    assert(Array.isArray(auditLogs.data.logs) && auditLogs.data.logs.some(log => log.action === 'create_order'), 'Audit logs should include order creation');
    assert(auditLogs.data.logs.some(log => log.action === 'update_order_status'), 'Audit logs should include status changes');

    logs.push('8. Coupon and offer update/delete reflection');
    const couponUpdate = await request(FRONTEND_BASE, `/api/coupons/${testCoupon.id}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: { description: 'Updated smoke description' },
    });
    assert(couponUpdate.response.ok, 'Coupon update should succeed');
    assert(couponUpdate.data.coupon.description === 'Updated smoke description', 'Coupon update should persist');

    const offerUpdate = await request(FRONTEND_BASE, `/api/offers/${testOffer.id}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: { subtitle: 'Updated hero subtitle' },
    });
    assert(offerUpdate.response.ok, 'Offer update should succeed');
    assert(offerUpdate.data.offer.subtitle === 'Updated hero subtitle', 'Offer update should persist');

    const deleteCouponRes = await request(FRONTEND_BASE, `/api/coupons/${futureCoupon.id}`, {
      method: 'DELETE',
      headers: adminHeaders,
    });
    assert(deleteCouponRes.response.ok, 'Coupon delete should succeed');

    const deleteOfferRes = await request(FRONTEND_BASE, `/api/offers/${testOffer.id}`, {
      method: 'DELETE',
      headers: adminHeaders,
    });
    assert(deleteOfferRes.response.ok, 'Offer delete should succeed');

    const deleteProductRes = await request(FRONTEND_BASE, `/api/products/${testProduct.id}`, {
      method: 'DELETE',
      headers: adminHeaders,
    });
    assert(deleteProductRes.response.ok, 'Product delete should succeed');

    const finalBootstrap = await request(FRONTEND_BASE, '/api/bootstrap');
    assert(
      !finalBootstrap.data.products.some(p => p.id === testProduct.id),
      'Deleted product should disappear from frontend bootstrap'
    );
    assert(
      !finalBootstrap.data.offers.some(o => o.id === testOffer.id),
      'Deleted offer should disappear from frontend bootstrap'
    );

    const finalCoupons = await request(FRONTEND_BASE, '/api/coupons', { headers: adminHeaders });
    assert(
      Array.isArray(finalCoupons.data.coupons) &&
      !finalCoupons.data.coupons.some(coupon => coupon.id === futureCoupon.id),
      'Deleted coupon should disappear from admin coupon list'
    );

    const loginThrottleStatuses = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const badLogin = await request(FRONTEND_BASE, '/api/admin/login', {
        method: 'POST',
        body: { email: ADMIN_EMAIL, password: `wrong-${attempt}` },
      });
      loginThrottleStatuses.push(badLogin.response.status);
    }
    assert(
      loginThrottleStatuses.slice(0, 4).every(status => status === 401),
      `Expected the first failed admin logins to be unauthorized, got ${loginThrottleStatuses.join(',')}`
    );
    assert(
      loginThrottleStatuses.some(status => status === 429),
      `Repeated failed admin logins should trigger throttling, got ${loginThrottleStatuses.join(',')}`
    );

    console.log([
      'Smoke suite passed.',
      `Backend: ${BACKEND_BASE}`,
      `Frontend proxy: ${FRONTEND_BASE}`,
      `Orders created: ${entities.orderIds.length}`,
      `Customer points after second order: ${secondCustomerState.data.customer?.rewards?.points ?? 'unknown'}`,
      `Elapsed: ${Date.now() - start}ms`,
    ].join('\n'));
  } finally {
    cleanup();
  }
}

main().catch(error => {
  console.error(`Smoke suite failed: ${error.message}`);
  cleanup();
  process.exitCode = 1;
});
