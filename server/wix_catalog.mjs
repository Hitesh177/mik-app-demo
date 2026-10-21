/* global process */

const WIX_API_BASE = 'https://www.wixapis.com';
const DEFAULT_SITE_ID = '889ce193-8563-4c1e-9692-ff4495fe8db7';
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

let catalogCache = null;
let catalogRefresh = null;

function cacheTtlMs() {
  const configuredTtl = Number(process.env.WIX_CATALOG_CACHE_TTL_MS);
  return Number.isFinite(configuredTtl) && configuredTtl >= 0
    ? configuredTtl
    : DEFAULT_CACHE_TTL_MS;
}

// Wix omits slugs for older collections. Keep their established public paths
// keyed by immutable Wix IDs so managers can freely rename collections.
const LEGACY_COLLECTION_PATHS = {
  '00000000-0000-0000-0000-000000000001': 'all-products',
  'f85e84ac-06e7-4bdc-b841-e6253130c804': 'everyday',
  'c9d56815-a7ba-4773-a92b-45673afc9f28': 'flour-rice-pulses',
  '3dd1cf5f-9ba5-43fe-9342-e792e6ee871e': 'fresh-finds',
  'e2e4fbe0-5ff7-4bbe-861e-8574dc69c77d': 'frozen-food-curries',
  'd422aa9c-2185-4789-a5f6-233e4cb6d7b9': 'ghee-oil-butter',
  '7cb03622-72d4-40ad-aac7-4689ff87d4cb': 'ground-spices',
  'f14f98d8-6bbc-4429-a1a9-ce8d30d67ed1': 'equipment',
  '9d9706b8-7067-42ac-8e28-ccf5e727554e': 'daily-groceries',
  '770cf704-bae1-448c-a275-90af05e4236b': 'indian-handicrafts',
  'a3a137a3-73be-444c-b836-ab77b7a23028': 'sweets',
  '1f1d6380-69df-4c9c-b419-737f9b3884ab': 'ready-to-eat',
  '70d7c9a7-d957-f0c9-20f0-640fad85b0d9': 'mdh-haldirams',
  '9157ff66-5254-4e0e-946d-c2d30782a4e5': 'deals-discounts-mikstore-taiwan',
  'd7b1eaa3-cf46-4980-aa29-702be58eb7d2': 'others',
  '69acfd8a-56d5-8da3-e6dd-88066171b6d2': 'personal-hygiene',
  'edc60d7c-1b61-b9c4-b790-d994a5699f81': 'popular-items',
  '5a31369c-f21a-4de7-813f-f73f7df07671': 'snacks-sauce-pickle',
  'df6be721-815d-447c-8e31-ed7ceda7c940': 'whole-spices',
};

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[^\p{ASCII}]/gu, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'collection';
}

function collectionPath(collection) {
  return LEGACY_COLLECTION_PATHS[collection.id] || collection.slug || slugify(collection.name);
}

function textFromHtml(value) {
  return String(value || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function imageUrl(media) {
  return media?.mainMedia?.image?.url || media?.items?.find(item => item?.image?.url)?.image?.url || '';
}

function inferCategory(product, collectionNames) {
  const name = `${product.name || ''} ${collectionNames.join(' ')}`.toLowerCase();
  const has = (...terms) => terms.some(term => name.includes(term));

  if (has('frozen', 'fresh food', 'coconut', 'paratha', 'samosa')) return 'fresh-frozen';
  if (has('ready to eat', 'ready-to-eat')) return 'ready-to-eat';
  if (has('tea', 'coffee', 'chai', 'curry leaf', 'curry leaves', 'mint leaf', 'mint leaves')) return 'tea-coffee';
  if (has('toothpaste', 'shampoo', 'soap', 'personal hygiene', 'hair oil', 'face wash')) return 'toiletry';
  if (has('household', 'kitchen equipment', 'pressure cooker', 'tawa', 'pan ', 'utensil')) return 'household';
  if (has('rakhi', 'diya', 'incense', 'agarbatti', 'puja', 'pooja', 'handicraft')) return 'puja';
  if (has('sweet', 'mithai', 'gulab jamun', 'rasgulla', 'jalebi')) return 'sweets';
  if (has('pickle', 'achar', 'achaar')) return 'pickles';
  if (has('noodle', 'sauce', 'chutney', 'ketchup')) return 'noodles-sauces';
  if (has('papad', 'pappad', 'biscuit', 'cookie')) return 'papad-biscuits';
  if (has('snack', 'namkeen', 'bhujia', 'chips', 'mixture')) return 'snacks';
  if (has('instant', 'noodles', 'soup mix')) return 'instant-food';
  if (has('ghee', 'oil', 'rice', 'basmati')) return 'rice-oils';
  if (has('ground spices', 'masala', 'spice powder')) return 'masala';
  if (has('whole spices', 'spice', 'jeera', 'cumin', 'cardamom', 'clove', 'turmeric')) return 'spices';
  if (has('dal', 'daal', 'dhal', 'pulse', 'lentil', 'chana', 'moong', 'urad', 'rajma')) return 'dal-pulses';
  if (has('flour', 'atta', 'maida', 'besan', 'sooji', 'rava')) return 'atta-flour';
  if (has('mouth freshener', 'mukhwas', 'paan')) return 'mouth-freshener';
  return 'instant-food';
}

async function wixRequest(path, body) {
  const apiKey = String(process.env.WIX_API_KEY || '').trim();
  const siteId = String(process.env.WIX_SITE_ID || DEFAULT_SITE_ID).trim();
  if (!apiKey) throw new Error('Wix catalog is not configured');

  const response = await fetch(`${WIX_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
      'wix-site-id': siteId,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Wix catalog request failed (${response.status})`);
  return response.json();
}

async function fetchAll(path, key) {
  const items = [];
  const limit = 100;
  for (let offset = 0; ; offset += limit) {
    const data = await wixRequest(path, { query: { paging: { limit, offset } } });
    const page = Array.isArray(data[key]) ? data[key] : [];
    items.push(...page);
    if (page.length < limit || items.length >= Number(data.totalResults || 0)) break;
  }
  return items;
}

async function fetchProductVariants(productId) {
  return fetchAll(`/stores-reader/v1/products/${encodeURIComponent(productId)}/variants/query`, 'variants');
}

async function hydrateVariantPrices(products) {
  const productsNeedingVariants = products.filter(product => (
    product.manageVariants
    && Number(product.priceData?.discountedPrice ?? product.priceData?.price ?? 0) <= 0
  ));

  // Keep Wix requests bounded while still avoiding a slow serial catalog refresh.
  const batchSize = 8;
  for (let index = 0; index < productsNeedingVariants.length; index += batchSize) {
    const batch = productsNeedingVariants.slice(index, index + batchSize);
    const variantsByProduct = await Promise.all(batch.map(product => fetchProductVariants(product.id)));
    batch.forEach((product, batchIndex) => {
      product.variants = variantsByProduct[batchIndex];
    });
  }
}

function variantPricing(product) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const visibleVariants = variants.filter(item => item?.variant?.visible !== false);
  const purchasableVariants = visibleVariants.length ? visibleVariants : variants;
  const prices = purchasableVariants
    .map(item => Number(item?.variant?.priceData?.discountedPrice ?? item?.variant?.priceData?.price))
    .filter(price => Number.isFinite(price) && price > 0);
  const originalPrices = purchasableVariants
    .map(item => Number(item?.variant?.priceData?.price))
    .filter(price => Number.isFinite(price) && price > 0);

  return {
    price: prices.length ? Math.min(...prices) : 0,
    originalPrice: originalPrices.length ? Math.min(...originalPrices) : 0,
    currency: purchasableVariants.find(item => item?.variant?.priceData?.currency)?.variant?.priceData?.currency,
  };
}

function adaptProduct(product, collectionById) {
  const collectionNames = (product.collectionIds || [])
    .map(id => collectionById.get(id)?.name)
    .filter(Boolean);
  const description = textFromHtml(product.description);
  const mediaItems = (product.media?.items || [])
    .filter(item => item?.mediaType === 'image' && item?.image?.url)
    .map(item => ({ url: item.image.url, alt: item.title || product.name }));
  const trackedQuantity = Number(product.stock?.quantity);
  const inStock = product.stock?.inStock !== false && product.stock?.inventoryStatus !== 'OUT_OF_STOCK';
  const stock = inStock ? (Number.isFinite(trackedQuantity) ? trackedQuantity : 9999) : 0;
  const variantPrice = variantPricing(product);
  const parentPrice = Number(product.priceData?.discountedPrice ?? product.price?.discountedPrice ?? product.priceData?.price ?? 0);
  const price = parentPrice > 0 ? parentPrice : variantPrice.price;
  const parentOriginalPrice = Number(product.priceData?.price ?? product.price?.price ?? 0);
  const originalPrice = parentOriginalPrice > 0 ? parentOriginalPrice : (variantPrice.originalPrice || price);

  const primaryCollection = (product.collectionIds || [])
    .map(id => collectionById.get(id))
    .find(collection => collection && collection.id !== '00000000-0000-0000-0000-000000000001');

  return {
    id: product.id,
    wix_product_id: product.id,
    name_en: product.name || 'Product',
    name_zh: '',
    price,
    original_price: originalPrice > price ? originalPrice : null,
    currency: product.priceData?.currency || product.price?.currency || variantPrice.currency || 'TWD',
    stock,
    inventory_status: product.stock?.inventoryStatus || (inStock ? 'IN_STOCK' : 'OUT_OF_STOCK'),
    category: primaryCollection ? collectionPath(primaryCollection) : inferCategory(product, collectionNames),
    primary_collection_id: primaryCollection?.id || '',
    collection_ids: product.collectionIds || [],
    collection_names: collectionNames,
    image_url: imageUrl(product.media),
    images: mediaItems,
    image_alt: `${product.name || 'Indian grocery product'} available from MIK Store Taiwan`,
    description,
    seo_slug: product.slug || product.id,
    seo_title: `${product.name || 'Indian grocery'} in Taiwan | MIK Store`,
    seo_description: description || `Buy ${product.name || 'this Indian grocery product'} online in Taiwan from MIK Store.`,
    seo_content: description,
    sku: product.sku || '',
    badge: product.ribbon || product.ribbons?.[0]?.text || null,
    visible: product.visible !== false,
    product_type: product.productType || 'physical',
    product_options: product.productOptions || [],
    variants: product.variants || [],
    manage_variants: Boolean(product.manageVariants),
    legacy_path: product.productPageUrl?.path || `/product-page/${product.slug || product.id}`,
    wix_product_url: product.productPageUrl
      ? `${String(product.productPageUrl.base || '').replace(/\/$/, '')}${product.productPageUrl.path || ''}`
      : '',
  };
}

export async function getWixCatalog({ force = false } = {}) {
  if (!force && catalogCache && Date.now() - catalogCache.cachedAt < cacheTtlMs()) {
    return catalogCache.value;
  }

  if (catalogRefresh) return catalogRefresh;

  catalogRefresh = (async () => {
    const [products, collections] = await Promise.all([
      fetchAll('/stores/v1/products/query', 'products'),
      fetchAll('/stores/v1/collections/query', 'collections'),
    ]);
    await hydrateVariantPrices(products);
    const collectionById = new Map(collections.map(collection => [collection.id, collection]));
    const adaptedProducts = products
      .filter(product => product.visible !== false)
      .map(product => adaptProduct(product, collectionById));
    const value = {
      source: 'wix',
      fetched_at: new Date().toISOString(),
      product_count: products.length,
      collection_count: collections.length,
      products: adaptedProducts,
      collections: collections.map(collection => ({
        id: collection.id,
        name: collection.name,
        slug: collectionPath(collection),
        path: `/${collectionPath(collection)}`,
        image_url: imageUrl(collection.media),
        visible: collection.visible !== false,
        product_count: adaptedProducts.filter(product => product.collection_ids.includes(collection.id)).length,
      })),
    };
    catalogCache = { cachedAt: Date.now(), value };
    return value;
  })();

  try {
    return await catalogRefresh;
  } finally {
    catalogRefresh = null;
  }
}
