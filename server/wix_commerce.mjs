import { createClient, ApiKeyStrategy, OAuthStrategy } from '@wix/sdk';
import { checkout, currentCart, orders } from '@wix/ecom';
import { accounts } from '@wix/loyalty';
import { getWixCatalog } from './wix_catalog.mjs';

const WIX_STORES_APP_ID = '1380b703-ce81-ff05-f115-39571d94dfcd';
const DEFAULT_SITE_ID = '889ce193-8563-4c1e-9692-ff4495fe8db7';

function sdkTokens(raw) {
  if (!raw?.access_token || !raw?.refresh_token) return null;
  return {
    accessToken: {
      value: raw.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + Math.max(30, Number(raw.expires_in || 3600)),
    },
    refreshToken: {
      value: raw.refresh_token,
      role: raw.role || 'member',
    },
  };
}

function rawTokens(tokens) {
  return {
    access_token: tokens.accessToken.value,
    refresh_token: tokens.refreshToken.value,
    expires_in: Math.max(30, Math.floor(tokens.accessToken.expiresAt - Date.now() / 1000)),
    role: tokens.refreshToken.role,
  };
}

export async function createVisitorCommerceSession(clientId) {
  const auth = OAuthStrategy({ clientId });
  return auth.generateVisitorTokens();
}

export function createCommerceClient({ clientId, tokens, onTokens }) {
  const initialTokens = tokens?.accessToken?.value ? tokens : sdkTokens(tokens);
  if (!clientId || !initialTokens) throw new Error('Wix commerce session is not configured');
  const tokenStorage = {
    getTokens: () => initialTokens,
    setTokens: nextTokens => {
      initialTokens.accessToken = nextTokens.accessToken;
      initialTokens.refreshToken = nextTokens.refreshToken;
      onTokens?.(nextTokens);
    },
  };
  return createClient({
    modules: { currentCart, checkout, loyaltyAccounts: accounts },
    auth: OAuthStrategy({ clientId, tokenStorage }),
  });
}

export function createAdminCommerceClient() {
  const apiKey = String(process.env.WIX_API_KEY || '').trim();
  const siteId = String(process.env.WIX_SITE_ID || DEFAULT_SITE_ID).trim();
  if (!apiKey) throw new Error('Wix API key is not configured');
  return createClient({
    modules: { orders },
    auth: ApiKeyStrategy({ apiKey, siteId }),
  });
}

function moneyAmount(value) {
  const amount = Number(value?.amount ?? value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function cartFromResult(result) {
  return result?.cart || result || null;
}

function wixCommerceError(error, fallbackMessage) {
  let details = error?.details || {};
  try {
    const parsed = JSON.parse(String(error?.message || ''));
    details = parsed.details || details;
  } catch {
    // Some Wix SDK errors are plain text rather than serialized API errors.
  }
  const code = String(details?.applicationError?.code || error?.code || '').toUpperCase();
  const mappedMessages = {
    ERROR_COUPON_DOES_NOT_EXIST: 'That coupon code does not exist',
    ERROR_COUPON_NOT_ACTIVE_YET: 'That coupon is not active yet',
    ERROR_COUPON_EXPIRED: 'That coupon has expired',
    ERROR_COUPON_USAGE_EXCEEDED: 'That coupon has reached its usage limit',
    ERROR_COUPON_MINIMUM_SUBTOTAL_NOT_MET: 'Your cart does not meet this coupon\'s minimum spend',
    ERROR_COUPON_ALREADY_APPLIED: 'That coupon is already applied',
  };
  const combined = `${code} ${error?.message || ''}`;
  const friendly = mappedMessages[code]
    || (/inventory|out.of.stock|insufficient/i.test(combined) ? 'This quantity is not available in Wix inventory' : '')
    || (/coupon/i.test(combined) ? 'This coupon is not valid for your cart' : '')
    || fallbackMessage;
  const normalized = new Error(friendly);
  normalized.statusCode = /inventory|stock/i.test(combined) ? 409 : 400;
  return normalized;
}

function selectedOptions(lineItem) {
  return (lineItem?.descriptionLines || [])
    .map(line => ({
      name: line.name?.translated || line.name?.original || '',
      value: line.plainText?.translated || line.plainText?.original || '',
    }))
    .filter(option => option.name || option.value);
}

export async function normalizeCart(cart) {
  const catalog = await getWixCatalog();
  const products = new Map(catalog.products.map(product => [String(product.wix_product_id || product.id), product]));
  const items = (cart?.lineItems || []).map(lineItem => {
    const productId = String(lineItem.catalogReference?.catalogItemId || '');
    const variantId = String(lineItem.catalogReference?.options?.variantId || '');
    const product = products.get(productId) || {};
    return {
      ...product,
      id: product.id || productId,
      product_id: productId,
      variant_id: variantId,
      cart_key: String(lineItem._id || `${productId}:${variantId}`),
      wix_line_item_id: lineItem._id,
      name_en: product.name_en || lineItem.productName?.translated || lineItem.productName?.original || 'Product',
      image_url: product.image_url || lineItem.image?.url || '',
      price: moneyAmount(lineItem.price),
      quantity: Number(lineItem.quantity || 1),
      selected_options: selectedOptions(lineItem),
      availability: lineItem.availability?.status || '',
    };
  });
  const appliedCoupon = (cart?.appliedDiscounts || []).find(discount => discount.coupon?.code)?.coupon || null;
  return {
    id: cart?._id || '',
    items,
    currency: cart?.currency || 'TWD',
    subtotal: moneyAmount(cart?.subtotal),
    total: moneyAmount(cart?.priceSummary?.total || cart?.subtotal),
    discount: moneyAmount(cart?.priceSummary?.discount),
    coupon: appliedCoupon ? { id: appliedCoupon._id || '', code: appliedCoupon.code || '' } : null,
    applied_discounts: cart?.appliedDiscounts || [],
  };
}

export async function getCurrentWixCart(client) {
  try {
    return await normalizeCart(await client.currentCart.getCurrentCart());
  } catch (error) {
    if (/not found|does not exist|404/i.test(String(error?.message || error))) {
      return normalizeCart(null);
    }
    throw error;
  }
}

export async function addWixCartItem(client, productId, quantity = 1, variantId = '') {
  const catalogReference = { appId: WIX_STORES_APP_ID, catalogItemId: String(productId) };
  if (variantId) catalogReference.options = { variantId: String(variantId) };
  try {
    const result = await client.currentCart.addToCurrentCart({
      lineItems: [{
        catalogReference,
        quantity: Math.max(1, Number(quantity || 1)),
      }],
    });
    return normalizeCart(cartFromResult(result));
  } catch (error) {
    throw wixCommerceError(error, 'Wix could not add this item to the cart');
  }
}

export async function updateWixCartItem(client, lineItemId, quantity) {
  try {
    const result = await client.currentCart.updateCurrentCartLineItemQuantity([
      { _id: String(lineItemId), quantity: Math.max(1, Number(quantity || 1)) },
    ]);
    return normalizeCart(result.cart);
  } catch (error) {
    throw wixCommerceError(error, 'Wix could not update this quantity');
  }
}

export async function removeWixCartItem(client, lineItemId) {
  const result = await client.currentCart.removeLineItemsFromCurrentCart([String(lineItemId)]);
  return normalizeCart(cartFromResult(result));
}

export async function clearWixCart(client) {
  const cart = await getCurrentWixCart(client);
  const ids = cart.items.map(item => item.wix_line_item_id).filter(Boolean);
  if (ids.length === 0) return cart;
  const result = await client.currentCart.removeLineItemsFromCurrentCart(ids);
  return normalizeCart(cartFromResult(result));
}

export async function applyWixCartCoupon(client, couponCode) {
  const code = String(couponCode || '').trim();
  if (!code) {
    const error = new Error('Enter a coupon code');
    error.statusCode = 400;
    throw error;
  }
  try {
    const result = await client.currentCart.updateCurrentCart({ couponCode: code });
    return normalizeCart(cartFromResult(result));
  } catch (error) {
    throw wixCommerceError(error, 'This coupon is not valid for your cart');
  }
}

export async function removeWixCartCoupon(client) {
  const result = await client.currentCart.removeCouponFromCurrentCart();
  return normalizeCart(cartFromResult(result));
}

export async function createWixCheckout(client) {
  const cart = await getCurrentWixCart(client);
  if (cart.items.length === 0) {
    const error = new Error('Your Wix cart is empty');
    error.statusCode = 400;
    throw error;
  }
  try {
    const created = await client.currentCart.createCheckoutFromCurrentCart({ channelType: 'WEB' });
    if (!created.checkoutId) throw new Error('Wix did not create a checkout');
    const result = await client.checkout.getWixCheckoutUrl(created.checkoutId);
    if (!result.checkoutUrl) throw new Error('Wix did not return a checkout URL');
    return { checkout_id: created.checkoutId, checkout_url: result.checkoutUrl };
  } catch (error) {
    throw wixCommerceError(error, 'Wix checkout is temporarily unavailable');
  }
}

export async function getMemberLoyalty(client) {
  try {
    const result = await client.loyaltyAccounts.getCurrentMemberAccount();
    const account = result.account || {};
    const points = Number(account.points?.balance || 0);
    return { points, account_id: account._id || '', reward_available: Boolean(account.rewardAvailable) };
  } catch {
    return { points: 0, account_id: '', reward_available: false };
  }
}

function normalizeOrder(order) {
  const rawFulfillmentStatus = String(order.fulfillmentStatus || '').toUpperCase();
  const rawOrderStatus = String(order.status || '').toUpperCase();
  const status = rawOrderStatus === 'CANCELED' || rawOrderStatus === 'CANCELLED'
    ? 'cancelled'
    : rawFulfillmentStatus === 'FULFILLED'
      ? 'fulfilled'
      : rawFulfillmentStatus === 'PARTIALLY_FULFILLED'
        ? 'shipped'
        : rawOrderStatus === 'APPROVED'
          ? 'confirmed'
          : 'placed';

  return {
    id: order._id,
    order_number: order.number ? `#${order.number}` : order._id,
    created_at: order._createdDate,
    status,
    wix_order_status: order.status || '',
    fulfillment_status: order.fulfillmentStatus || '',
    payment_status: order.paymentStatus || '',
    subtotal: moneyAmount(order.priceSummary?.subtotal),
    shipping: moneyAmount(order.priceSummary?.shipping),
    tax: moneyAmount(order.priceSummary?.tax),
    discount_amount: moneyAmount(order.priceSummary?.discount),
    total: moneyAmount(order.priceSummary?.total),
    currency: order.currency || 'TWD',
    items: (order.lineItems || []).map(item => ({
      id: item._id,
      product_id: item.catalogReference?.catalogItemId || '',
      name: item.productName?.translated || item.productName?.original || 'Product',
      quantity: Number(item.quantity || 1),
      price: moneyAmount(item.price?.amount ? item.price : item.price?.totalPriceAfterTax),
    })),
  };
}

export async function getWixMemberOrders(memberId) {
  if (!memberId) return [];
  const client = createAdminCommerceClient();
  const result = await client.orders.searchOrders({
    filter: { 'buyerInfo.memberId': memberId },
    sort: [{ fieldName: '_createdDate', order: 'DESC' }],
    cursorPaging: { limit: 100 },
  });
  return (result.orders || []).map(normalizeOrder);
}

export async function getAllWixOrders() {
  const client = createAdminCommerceClient();
  const result = await client.orders.searchOrders({
    sort: [{ fieldName: '_createdDate', order: 'DESC' }],
    cursorPaging: { limit: 100 },
  });
  return (result.orders || []).map(normalizeOrder);
}

export async function getWixCommerceAnalytics() {
  const wixOrders = await getAllWixOrders();
  const completedOrders = wixOrders.filter(order => !['CANCELED', 'CANCELLED'].includes(String(order.status).toUpperCase()));
  const revenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
  const productTotals = new Map();
  for (const order of completedOrders) {
    for (const item of order.items) {
      const key = item.product_id || item.name;
      const current = productTotals.get(key) || { product_id: item.product_id, name_en: item.name, quantity: 0, revenue: 0 };
      current.quantity += item.quantity;
      current.revenue += item.price * item.quantity;
      productTotals.set(key, current);
    }
  }
  return {
    source: 'wix',
    kpis: {
      total_orders: completedOrders.length,
      total_revenue: revenue,
      average_order_value: completedOrders.length ? revenue / completedOrders.length : 0,
      repeat_customers: 0,
      returning_rate: 0,
      coupon_redemptions: 0,
    },
    top_products: [...productTotals.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 10),
    top_coupon: null,
  };
}
