#!/usr/bin/env node

const API_BASE = (process.env.MIK_API_BASE_URL || 'http://127.0.0.1:4173/api').replace(/\/$/, '');

if (process.env.MIK_RUN_WIX_CHECKOUT_TEST !== '1') {
  throw new Error('Set MIK_RUN_WIX_CHECKOUT_TEST=1 to create and clean up a real Wix checkout draft.');
}

let cookie = '';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...options.headers,
    },
  });
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';', 1)[0];
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload;
}

const products = await request('/products');
const product = products.find(item => Number(item.price) > 0 && Number(item.stock) > 0 && !item.manage_variants);
if (!product) throw new Error('No simple in-stock Wix product with a non-zero price is available for testing.');

try {
  await request('/customer/cart', { method: 'DELETE', body: '{}' });
  const cart = await request('/commerce/cart/items', {
    method: 'POST',
    body: JSON.stringify({ product_id: product.wix_product_id || product.id, quantity: 1 }),
  });
  if (cart.items?.length !== 1 || Number(cart.total) <= 0) throw new Error('Wix cart did not return the expected priced item.');

  const checkout = await request('/commerce/checkout', { method: 'POST', body: '{}' });
  const checkoutUrl = new URL(checkout.checkout_url);
  if (!checkout.checkout_id || checkoutUrl.protocol !== 'https:' || !/wix|mikstoretaiwan/i.test(checkoutUrl.hostname)) {
    throw new Error('Wix did not return a valid hosted checkout URL.');
  }

  console.log(JSON.stringify({
    ok: true,
    product: product.name_en,
    cart_total: cart.total,
    checkout_id: checkout.checkout_id,
    checkout_host: checkoutUrl.hostname,
  }, null, 2));
} finally {
  await request('/customer/cart', { method: 'DELETE', body: '{}' }).catch(() => {});
}
