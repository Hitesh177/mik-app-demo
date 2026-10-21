#!/usr/bin/env node
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { CATEGORIES, PRODUCTS as SEED_PRODUCTS } from '../src/data/mockData.js';
import { BLOG_POSTS } from '../src/data/blogPosts.js';
import { WIX_BLOG_POSTS } from '../src/data/wixBlogPosts.js';
import { SERVICES } from '../src/data/services.js';
import { withLegacyProducts } from '../src/data/legacyProducts.js';
import { LEGACY_COLLECTION_ROUTES, PUBLIC_STANDARD_ROUTES } from '../src/data/publicRoutes.js';
import { getWixCatalog } from '../server/wix_catalog.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC_DIR = join(ROOT, 'public');
const STORE_SCRIPT = join(ROOT, 'server', 'sqlite_store.py');
const SITE_URL = (process.env.MIK_PUBLIC_SITE_URL || 'https://www.indianstoretaiwan.com').replace(/\/$/, '');
const LOCAL_ENV_PATH = join(ROOT, '.env.local');

if (existsSync(LOCAL_ENV_PATH)) {
  for (const line of readFileSync(LOCAL_ENV_PATH, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || match[1] in process.env) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function productPath(product) {
  const slug = product.seo_slug || slugify(product.name_en) || product.id;
  const legacyPath = String(product.legacy_path || '').trim();
  return legacyPath.startsWith('/product-page/')
    ? legacyPath
    : `/product-page/${encodeURIComponent(slug)}`;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function wixMediaSource(source) {
  const value = source?.url || source?.id || '';
  if (!value || value.startsWith('/') || /^https?:\/\//.test(value)) return value;
  return `https://static.wixstatic.com/media/${value.replace(/^media\//, '')}`;
}

function legacyHref(value) {
  if (!value) return '#';
  try {
    const url = new URL(value, SITE_URL);
    if (/^(www\.)?(indianstoretaiwan|mikstoretaiwan)\.com$/i.test(url.hostname)) return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return value;
  }
  return value;
}

function wixRichHtml(node) {
  if (!node) return '';
  const childHtml = () => (node.nodes || []).map(wixRichHtml).join('');
  if (node.type === 'TEXT') {
    let value = escapeHtml(node.textData?.text || '');
    for (const decoration of node.textData?.decorations || []) {
      if (decoration.type === 'BOLD') value = `<strong>${value}</strong>`;
      if (decoration.type === 'ITALIC') value = `<em>${value}</em>`;
      if (decoration.type === 'UNDERLINE') value = `<u>${value}</u>`;
      if (decoration.type === 'LINK') value = `<a href="${escapeAttr(legacyHref(decoration.linkData?.link?.url))}">${value}</a>`;
    }
    return value;
  }
  if (node.type === 'PARAGRAPH') return `<p>${childHtml()}</p>`;
  if (node.type === 'HEADING') return `<h${Math.min(4, Math.max(2, Number(node.headingData?.level || 2)))}>${childHtml()}</h${Math.min(4, Math.max(2, Number(node.headingData?.level || 2))) }>`;
  if (node.type === 'BULLETED_LIST') return `<ul>${childHtml()}</ul>`;
  if (node.type === 'ORDERED_LIST') return `<ol>${childHtml()}</ol>`;
  if (node.type === 'LIST_ITEM') return `<li>${childHtml()}</li>`;
  if (node.type === 'IMAGE') {
    const data = node.imageData || {};
    const src = wixMediaSource(data.image?.src);
    return src ? `<figure><img src="${escapeAttr(src)}" alt="${escapeAttr(data.altText || data.caption || '')}" loading="lazy" />${data.caption ? `<figcaption>${escapeHtml(data.caption)}</figcaption>` : ''}</figure>` : '';
  }
  if (node.type === 'GALLERY') return `<div class="gallery">${(node.galleryData?.items || []).map(item => {
    const image = item.image || {};
    const src = wixMediaSource(image.media?.src);
    return src ? `<img src="${escapeAttr(src)}" alt="${escapeAttr(image.altText || item.title || '')}" loading="lazy" />` : '';
  }).join('')}</div>`;
  if (node.type === 'TABLE') return `<div class="table-wrap"><table>${childHtml()}</table></div>`;
  if (node.type === 'TABLE_ROW') return `<tr>${childHtml()}</tr>`;
  if (node.type === 'TABLE_CELL') return `<td>${childHtml()}</td>`;
  if (node.type === 'BLOCKQUOTE') return `<blockquote>${childHtml()}</blockquote>`;
  if (node.type === 'DIVIDER') return '<hr />';
  return childHtml();
}

function readProductsFromStore() {
  const result = spawnSync('python3', [STORE_SCRIPT], {
    input: JSON.stringify({ action: 'list_products', payload: {} }),
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.status !== 0) return null;
  try {
    const parsed = JSON.parse((result.stdout || '').trim() || '{}');
    if (!parsed?.ok) return null;
    return Array.isArray(parsed.result) ? parsed.result : null;
  } catch {
    return null;
  }
}

const wixProducts = process.env.WIX_API_KEY
  ? await getWixCatalog().then(catalog => catalog.products).catch(() => null)
  : null;
const rawProducts = withLegacyProducts(wixProducts || readProductsFromStore() || SEED_PRODUCTS);
// Wix can return duplicate records that resolve to the same legacy URL. Keep the
// most recent record so each product page and sitemap URL is generated once.
const products = [...new Map(rawProducts.map(product => [productPath(product), product])).values()];
const productMap = new Map(products.map(product => [String(product.id), product]));
const blogMap = new Map(BLOG_POSTS.map(post => [post.slug, post]));

function blogGradient(post) {
  const key = `${post.accentFrom}|${post.accentTo}`;
  const map = {
    'from-emerald-600|to-teal-700': 'linear-gradient(135deg, #059669, #0f766e)',
    'from-green-700|to-lime-600': 'linear-gradient(135deg, #15803d, #65a30d)',
    'from-indigo-600|to-sky-700': 'linear-gradient(135deg, #4f46e5, #0369a1)',
    'from-rose-600|to-orange-600': 'linear-gradient(135deg, #e11d48, #ea580c)',
    'from-sky-600|to-cyan-700': 'linear-gradient(135deg, #0284c7, #0e7490)',
    'from-amber-600|to-orange-600': 'linear-gradient(135deg, #d97706, #ea580c)',
    'from-lime-600|to-green-700': 'linear-gradient(135deg, #65a30d, #15803d)',
    'from-violet-600|to-fuchsia-600': 'linear-gradient(135deg, #7c3aed, #c026d3)',
  };
  return map[key] || 'linear-gradient(135deg, #166534, #0f766e)';
}

function buildProductHtml(product) {
  const name = product.name_en || 'Product';
  const slug = product.seo_slug || slugify(name) || product.id;
  const title = product.seo_title || `${name} in Taiwan | MIK Store`;
  const description = product.seo_description || `Buy ${name} online in Taiwan from MIK Store.`;
  const keywords = product.seo_keywords || `${name}, Taiwan Indian grocery`;
  const h1 = product.seo_h1 || name;
  const content = product.seo_content || `${name} is available with Taiwan delivery and Indian grocery support.`;
  const category = CATEGORIES.find(item => item.id === product.category)?.name || product.category;
  const related = products
    .filter(item => item.category === product.category && item.id !== product.id)
    .slice(0, 8);
  const canonicalPath = productPath(product);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeAttr(description)}" />
  <meta name="keywords" content="${escapeAttr(keywords)}" />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="${SITE_URL}${canonicalPath}" />
  <meta property="og:type" content="product" />
  <meta property="og:title" content="${escapeAttr(title)}" />
  <meta property="og:description" content="${escapeAttr(description)}" />
  <meta property="og:url" content="${SITE_URL}${canonicalPath}" />
  ${product.image_url ? `<meta property="og:image" content="${escapeAttr(product.image_url)}" />` : ''}
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: product.image_url || undefined,
    sku: product.id,
    brand: { '@type': 'Brand', name: 'MIK Store' },
    category: product.category,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}${canonicalPath}`,
      priceCurrency: 'TWD',
      price: Number(product.price || 0),
      availability: Number(product.stock || 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  })}</script>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; background: #f9fafb; color: #111827; }
    .shell { max-width: 980px; margin: 0 auto; padding: 32px 20px 72px; }
    .hero { background: linear-gradient(135deg, #166534, #14532d); color: white; border-radius: 28px; padding: 32px; }
    .meta { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; font-size: 14px; }
    .pill { background: rgba(255,255,255,.15); border-radius: 999px; padding: 8px 12px; }
    .card { background: white; border-radius: 24px; padding: 24px; margin-top: 20px; box-shadow: 0 10px 30px rgba(17,24,39,.06); }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 12px; }
    a { color: #166534; text-decoration: none; }
    .related a { display: block; padding: 12px 14px; border: 1px solid #e5e7eb; border-radius: 16px; background: #fff; }
    .content { line-height: 1.7; color: #4b5563; }
  </style>
</head>
<body>
  <main class="shell">
    <section class="hero">
      <p style="opacity:.9;margin:0 0 8px">${escapeHtml(category)}</p>
      <h1 style="margin:0;font-size:clamp(2rem,3vw,3.25rem);line-height:1.05">${escapeHtml(h1)}</h1>
      <p style="max-width:760px;font-size:1.05rem;line-height:1.7;margin:16px 0 0">${escapeHtml(description)}</p>
      <div class="meta">
        <div class="pill">Price: NT$${Number(product.price || 0).toLocaleString()}</div>
        <div class="pill">Stock: ${Number(product.stock || 0) > 0 ? `${Number(product.stock)} available` : 'Out of stock'}</div>
        <div class="pill">Taiwan delivery</div>
      </div>
    </section>
    <section class="card">
      <h2 style="margin-top:0">Product Details</h2>
      <p class="content">${escapeHtml(content)}</p>
      <p class="content">This product page is prerendered so search engines can read the main copy before JavaScript runs. That gives this item a stronger chance to rank for local searches in Taiwan.</p>
    </section>
    <section class="card">
      <h2 style="margin-top:0">Related Products</h2>
      <div class="grid related">
        ${related.map(item => {
          const relSlug = item.seo_slug || slugify(item.name_en) || item.id;
          return `<a href="${escapeAttr(productPath(item))}"><strong>${escapeHtml(item.name_en)}</strong><br /><span style="color:#6b7280">NT$${Number(item.price || 0).toLocaleString()}</span></a>`;
        }).join('')}
      </div>
    </section>
  </main>
</body>
</html>`;
}

function buildCategoryHtml(categoryId) {
  const category = CATEGORIES.find(item => item.id === categoryId);
  const label = category?.name || categoryId;
  const items = products.filter(product => product.category === categoryId).slice(0, 30);
  const title = `${label} in Taiwan | MIK Store`;
  const description = `Browse ${label.toLowerCase()} products available for Taiwan delivery from MIK Store.`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeAttr(description)}" />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="${SITE_URL}/category/${encodeURIComponent(categoryId)}" />
</head>
<body style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;background:#f9fafb;color:#111827">
  <main style="max-width:980px;margin:0 auto;padding:32px 20px 72px">
    <h1>${escapeHtml(title)}</h1>
    <p style="color:#4b5563;max-width:720px;line-height:1.7">${escapeHtml(description)}</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
      ${items.map(item => {
        const slug = item.seo_slug || slugify(item.name_en) || item.id;
        return `<a href="${escapeAttr(productPath(item))}" style="display:block;background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:14px;text-decoration:none;color:#111827"><strong>${escapeHtml(item.name_en)}</strong><br /><span style="color:#6b7280">NT$${Number(item.price || 0).toLocaleString()}</span></a>`;
      }).join('')}
    </div>
  </main>
</body>
</html>`;
}

function buildBlogIndexHtml() {
  const title = 'MIK Store Blog | Indian Grocery Guides for Taiwan';
  const description = 'SEO-rich Indian grocery guides for Taiwan shoppers, including herbs, students, families, nomads, and tourism-friendly shopping.';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeAttr(description)}" />
  <meta name="keywords" content="Indian grocery blog Taiwan, herb shopping Taiwan, student pantry Taiwan, family grocery Taiwan, nomad Taiwan groceries, Taiwan tourism Indian snacks" />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="${SITE_URL}/blog" />
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; background: #f9fafb; color: #111827; }
    .shell { max-width: 1120px; margin: 0 auto; padding: 32px 20px 72px; }
    .hero { border-radius: 28px; padding: 32px; color: white; background: linear-gradient(135deg, #0f172a, #166534, #0f766e); }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
    .card { background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(17,24,39,.06); border: 1px solid #e5e7eb; text-decoration: none; color: inherit; }
    .card .body { padding: 20px; }
    .badge { display: inline-flex; gap: 6px; align-items: center; font-size: 12px; font-weight: 700; padding: 7px 12px; border-radius: 999px; background: rgba(255,255,255,.14); }
    .cta { display: inline-flex; align-items: center; gap: 8px; padding: 12px 16px; border-radius: 999px; text-decoration: none; font-weight: 700; }
    .green { background: #dcfce7; color: #14532d; }
    .blue { background: #dbeafe; color: #1e3a8a; }
    .amber { background: #fef3c7; color: #78350f; }
    .chips { display: flex; flex-wrap: wrap; gap: 10px; }
    .chip { display: inline-flex; padding: 10px 14px; border-radius: 999px; background: white; border: 1px solid #e5e7eb; color: #374151; text-decoration: none; }
    a { color: #166534; }
  </style>
</head>
<body>
  <main class="shell">
    <section class="hero">
      <span class="badge">SEO guides + shopping help</span>
      <h1 style="margin:18px 0 0;font-size:clamp(2.2rem,4vw,4rem);line-height:1.02">Indian grocery guides built for Taiwan shoppers</h1>
      <p style="max-width:820px;margin:16px 0 0;font-size:1.05rem;line-height:1.75;color:rgba(255,255,255,.86)">Read guides for fresh herbs, student baskets, family meal planning, nomad pantries, and tourism-friendly snacks. Every page links straight to the live shopping experience.</p>
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:20px">
        <a class="cta green" href="/categories">Browse categories</a>
        <a class="cta blue" href="/">Shop home</a>
        <a class="cta amber" href="/blog/mint-leaves-near-me-taiwan">Start with herb guides</a>
      </div>
    </section>

    <section style="margin-top:24px">
      <h2 style="margin:0 0 14px;font-size:1.5rem">Featured guides</h2>
      <div class="grid">
        ${BLOG_POSTS.slice(0, 3).map(post => `
          <a class="card" href="/blog/${escapeAttr(post.slug)}">
            <div style="padding:22px;background:${blogGradient(post)};color:white;">
              <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
                <div style="width:44px;height:44px;border-radius:16px;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;font-size:22px">${escapeHtml(post.emoji)}</div>
                <span class="badge">${escapeHtml(post.readTime)}</span>
              </div>
              <h3 style="margin:16px 0 0;font-size:1.45rem;line-height:1.15;white-space:pre-line">${escapeHtml(post.title)}</h3>
              <p style="margin:10px 0 0;line-height:1.7;color:rgba(255,255,255,.85)">${escapeHtml(post.description)}</p>
            </div>
            <div class="body">
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <span class="chip">${escapeHtml(post.tag)}</span>
                <span class="chip">Taiwan SEO</span>
              </div>
              <p style="margin:16px 0 0;font-weight:700;color:#166534">Read guide →</p>
            </div>
          </a>
        `).join('')}
      </div>
    </section>

    <section style="margin-top:24px;background:white;border-radius:24px;padding:24px;box-shadow:0 10px 30px rgba(17,24,39,.06);border:1px solid #e5e7eb">
      <h2 style="margin-top:0">Popular topics</h2>
      <div class="chips">
        ${BLOG_POSTS.map(post => `<a class="chip" href="/blog/${escapeAttr(post.slug)}">${escapeHtml(post.title)}</a>`).join('')}
      </div>
    </section>
  </main>
</body>
</html>`;
}

function buildBlogPostHtml(post) {
  const title = post.title;
  const description = post.description;
  const featuredProducts = post.featuredProductIds
    .map(id => productMap.get(String(id)))
    .filter(Boolean);
  const relatedPosts = post.relatedSlugs
    .map(slug => blogMap.get(slug))
    .filter(Boolean)
    .slice(0, 3);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeAttr(description)}" />
  <meta name="keywords" content="${escapeAttr(post.keywords)}" />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="${SITE_URL}/blog/${escapeAttr(post.slug)}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeAttr(title)}" />
  <meta property="og:description" content="${escapeAttr(description)}" />
  <meta property="og:url" content="${SITE_URL}/blog/${escapeAttr(post.slug)}" />
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url: `${SITE_URL}/blog/${post.slug}`,
    author: { '@type': 'Organization', name: 'MIK Store' },
    publisher: { '@type': 'Organization', name: 'MIK Store' },
  })}</script>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; background: #f9fafb; color: #111827; }
    .shell { max-width: 1120px; margin: 0 auto; padding: 32px 20px 72px; }
    .hero { border-radius: 28px; padding: 32px; color: white; background: linear-gradient(135deg, #0f172a, #166534, #0f766e); box-shadow: 0 20px 50px rgba(15,23,42,.22); }
    .layout { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(280px, .85fr); gap: 24px; margin-top: 24px; }
    .card { background: white; border-radius: 24px; padding: 24px; border: 1px solid #e5e7eb; box-shadow: 0 10px 30px rgba(17,24,39,.06); }
    .section { background: white; border-radius: 24px; padding: 24px; border: 1px solid #e5e7eb; box-shadow: 0 10px 30px rgba(17,24,39,.06); margin-top: 16px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
    .product { display: block; background: white; border: 1px solid #e5e7eb; border-radius: 20px; padding: 14px; text-decoration: none; color: #111827; box-shadow: 0 8px 20px rgba(17,24,39,.04); }
    .product img { width: 100%; aspect-ratio: 1/1; object-fit: contain; background: linear-gradient(135deg, #f9fafb, #eef2f7); border-radius: 16px; }
    .pill { display:inline-flex; padding: 8px 12px; border-radius: 999px; background: rgba(255,255,255,.14); color: white; text-decoration:none; font-weight:700; font-size: 14px; margin-right: 8px; margin-top: 8px; }
    .chip { display:inline-flex; padding: 10px 14px; border-radius: 999px; background: #f3f4f6; border: 1px solid #e5e7eb; text-decoration:none; color:#374151; margin-right:8px; margin-top:8px; font-weight:600; }
    .faq { background: #f9fafb; border-radius: 18px; padding: 14px 16px; margin-top: 12px; }
    a { color: #166534; }
    p { line-height: 1.75; color: #4b5563; }
  </style>
</head>
<body>
  <main class="shell">
    <section class="hero">
      <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap">
        <div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <span style="display:inline-flex;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.14);font-weight:700">${escapeHtml(post.tag)}</span>
            <span style="display:inline-flex;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.14);font-weight:700">${escapeHtml(post.readTime)}</span>
          </div>
          <h1 style="margin:18px 0 0;font-size:clamp(2.2rem,4vw,4rem);line-height:1.02;white-space:pre-line">${escapeHtml(title)}</h1>
          <p style="max-width:820px;margin:16px 0 0;font-size:1.05rem;line-height:1.75;color:rgba(255,255,255,.86)">${escapeHtml(post.heroLead)}</p>
        </div>
        <div style="width:64px;height:64px;border-radius:24px;background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;font-size:34px;flex-shrink:0">${escapeHtml(post.emoji)}</div>
      </div>
      <div>
        <a class="pill" href="/categories">Browse categories</a>
        <a class="pill" href="/">Shop home</a>
        <a class="pill" href="/blog">Back to blog</a>
      </div>
    </section>

    <div class="layout">
      <article>
        <section class="card">
          <p style="margin:0;color:#166534;font-weight:700;text-transform:uppercase;font-size:.75rem;letter-spacing:.08em">Why this guide exists</p>
          <p style="margin-top:12px">${escapeHtml(post.intro)}</p>
        </section>

        ${post.sections.map(section => `
          <section class="section">
            <h2 style="margin-top:0">${escapeHtml(section.heading)}</h2>
            ${section.paragraphs.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('')}
            ${section.bullets?.length ? `<div class="grid">${section.bullets.map(bullet => `<div class="faq"><strong style="display:block;margin-bottom:6px;color:#111827">•</strong>${escapeHtml(bullet)}</div>`).join('')}</div>` : ''}
          </section>
        `).join('')}

        <section class="section">
          <h2 style="margin-top:0">${escapeHtml(post.ctaTitle)}</h2>
          <p>${escapeHtml(post.ctaText)}</p>
          <div>
            ${post.shopLinks.map(link => `<a class="chip" href="${escapeAttr(link.href)}">${escapeHtml(link.label)}</a>`).join('')}
          </div>
        </section>

        <section class="section">
          <h2 style="margin-top:0">Featured products</h2>
          <div class="grid">
            ${featuredProducts.map(product => {
              const slug = product.seo_slug || slugify(product.name_en) || product.id;
              return `<a class="product" href="${escapeAttr(productPath(product))}">
                ${product.image_url ? `<img src="${escapeAttr(product.image_url)}" alt="${escapeAttr(product.name_en)}" />` : ''}
                <h3 style="margin:12px 0 0">${escapeHtml(product.name_en)}</h3>
                <p style="margin:6px 0 0;color:#6b7280">NT$${Number(product.price || 0).toLocaleString()}</p>
              </a>`;
            }).join('')}
          </div>
        </section>

        <section class="section">
          <h2 style="margin-top:0">FAQ</h2>
          ${post.faqs.map(faq => `
            <div class="faq">
              <strong style="display:block;color:#111827">${escapeHtml(faq.q)}</strong>
              <p style="margin:6px 0 0">${escapeHtml(faq.a)}</p>
            </div>
          `).join('')}
        </section>
      </article>

      <aside>
        <section class="card" style="position:sticky;top:24px">
          <h2 style="margin-top:0">Quick shopping links</h2>
          <div>${post.shopLinks.map(link => `<a class="chip" href="${escapeAttr(link.href)}">${escapeHtml(link.label)}</a>`).join('')}</div>
          <div style="margin-top:18px;padding:16px;border-radius:18px;background:#ecfdf5">
            <strong style="color:#14532d">Why shoppers like this page</strong>
            <p style="margin:10px 0 0;color:#14532d">It matches search intent, explains the product need, and links directly to the live shop so people can buy immediately.</p>
          </div>
        </section>

        <section class="section">
          <h2 style="margin-top:0">Related guides</h2>
          ${relatedPosts.map(item => `<a class="chip" style="display:block;margin-right:0" href="/blog/${item.slug}">${escapeHtml(item.title)}</a>`).join('')}
        </section>
      </aside>
    </div>
  </main>
</body>
</html>`;
}

function buildWixBlogPostHtml(post) {
  const canonical = new URL(post.path, `${SITE_URL}/`).href;
  const body = (post.richContent?.nodes || []).map(wixRichHtml).join('');
  const lang = post.language === 'zh' ? 'zh-TW' : 'en-TW';
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(post.title)}</title>
  <meta name="description" content="${escapeAttr(post.description)}" />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="${escapeAttr(canonical)}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeAttr(post.title)}" />
  <meta property="og:description" content="${escapeAttr(post.description)}" />
  <meta property="og:url" content="${escapeAttr(canonical)}" />
  ${post.coverImage ? `<meta property="og:image" content="${escapeAttr(new URL(post.coverImage, `${SITE_URL}/`).href)}" />` : ''}
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: post.coverImage ? new URL(post.coverImage, `${SITE_URL}/`).href : undefined,
    datePublished: post.publishedDate,
    dateModified: post.updatedDate,
    inLanguage: lang,
    url: canonical,
    author: { '@type': 'Organization', name: 'MIK Store' },
    publisher: { '@type': 'Organization', name: 'MIK Store' },
  })}</script>
  <style>
    body{margin:0;background:#f8fafc;color:#111827;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.shell{max-width:920px;margin:auto;padding:32px 18px 80px}.article{overflow:hidden;border:1px solid #e5e7eb;border-radius:28px;background:#fff;box-shadow:0 10px 35px rgba(15,23,42,.06)}.cover{display:block;width:100%;max-height:620px;object-fit:cover;background:#f3f4f6}.body{padding:clamp(24px,5vw,56px)}h1{font-size:clamp(2rem,5vw,3.6rem);line-height:1.05;margin:14px 0}h2,h3,h4{margin-top:2rem;line-height:1.2}p,li{font-size:1.05rem;line-height:1.8;color:#374151}a{color:#15803d}figure{margin:28px 0}figure img{display:block;max-width:100%;max-height:720px;margin:auto;border-radius:18px}figcaption{text-align:center;color:#6b7280;margin-top:8px}.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:28px 0}.gallery img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:16px}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse}td{border:1px solid #e5e7eb;padding:12px;vertical-align:top}.meta{font-size:.8rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#15803d}.back{display:inline-block;margin-bottom:18px;text-decoration:none;font-weight:700}
  </style>
</head>
<body><main class="shell"><a class="back" href="${post.language === 'zh' ? '/zh/blog' : '/blog'}">← ${post.language === 'zh' ? '所有文章' : 'All articles'}</a><article class="article">${post.coverImage ? `<img class="cover" src="${escapeAttr(post.coverImage)}" alt="${escapeAttr(post.coverAlt || post.title)}" />` : ''}<div class="body"><div class="meta">MIK Store · ${post.minutesToRead} min read</div><h1>${escapeHtml(post.title)}</h1>${post.excerpt ? `<p style="font-size:1.2rem;color:#6b7280">${escapeHtml(post.excerpt)}</p>` : ''}${body}</div></article></main></body>
</html>`;
}

function buildCategoriesHtml() {
  const items = CATEGORIES.filter(category => category.id !== 'all');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>All Categories in Taiwan | MIK Store</title>
  <meta name="description" content="Browse all Indian grocery categories available in Taiwan from MIK Store." />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="${SITE_URL}/categories" />
</head>
<body style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;background:#f9fafb;color:#111827">
  <main style="max-width:980px;margin:0 auto;padding:32px 20px 72px">
    <h1>All Categories in Taiwan</h1>
    <p style="color:#4b5563;max-width:720px;line-height:1.7">Explore the complete Indian grocery catalog with Taiwan delivery support.</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
      ${items.map(item => `<a href="/category/${encodeURIComponent(item.id)}" style="display:block;background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:14px;text-decoration:none;color:#111827"><strong>${escapeHtml(item.name)}</strong></a>`).join('')}
    </div>
  </main>
</body>
</html>`;
}

function buildServiceHtml(service) {
  const canonicalPath = `/services/${service.slug}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(service.name)} | MIK Store Taiwan</title>
  <meta name="description" content="${escapeAttr(`${service.name} at MIK Store Taiwan. ${service.price}, ${service.duration}. ${service.summary}`)}" />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="${SITE_URL}${canonicalPath}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeAttr(service.name)} | MIK Store Taiwan" />
  <meta property="og:description" content="${escapeAttr(service.summary)}" />
  <meta property="og:image" content="${escapeAttr(service.image)}" />
  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Service', name: service.name, description: service.summary, provider: { '@type': 'Organization', name: 'MIK Store' } })}</script>
</head>
<body style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;background:#f7f1e7;color:#20251c">
  <main style="max-width:980px;margin:0 auto;padding:32px 20px 72px">
    <a href="/services" style="color:#31593a;font-weight:700;text-decoration:none">← All services</a>
    <article style="margin-top:22px;overflow:hidden;border-radius:28px;background:#213a29;color:white;box-shadow:0 20px 50px rgba(33,58,41,.18)">
      <img src="${escapeAttr(service.image)}" alt="${escapeAttr(service.name)}" style="display:block;width:100%;max-height:520px;object-fit:cover" />
      <div style="padding:clamp(28px,5vw,54px)"><p style="color:#efc56d;font-weight:800;text-transform:uppercase;letter-spacing:.15em">${escapeHtml(service.eyebrow)}</p><h1 style="font-size:clamp(2.5rem,6vw,4.5rem);line-height:1;margin:16px 0">${escapeHtml(service.name)}</h1><p style="font-weight:800">${escapeHtml(service.price)} · ${escapeHtml(service.duration)}</p><p style="max-width:720px;line-height:1.75;color:#e7e5e4">${escapeHtml(service.summary)}</p><a href="https://line.me/ti/p/@688vynca" style="display:inline-block;margin-top:12px;border-radius:999px;background:#efc56d;color:#213323;padding:12px 20px;font-weight:800;text-decoration:none">Ask about booking</a></div>
    </article>
  </main>
</body>
</html>`;
}

function buildStandardHtml(route) {
  const canonical = `${SITE_URL}${route.path === '/' ? '/' : route.path}`;
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(route.title)}</title><meta name="description" content="${escapeAttr(route.description)}" />
  <meta name="robots" content="index,follow" /><link rel="canonical" href="${escapeAttr(canonical)}" />
  <meta property="og:type" content="website" /><meta property="og:title" content="${escapeAttr(route.title)}" />
  <meta property="og:description" content="${escapeAttr(route.description)}" /><meta property="og:url" content="${escapeAttr(canonical)}" />
  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebPage', name: route.h1, description: route.description, url: canonical, isPartOf: { '@type': 'WebSite', name: 'MIK Store', url: SITE_URL } })}</script>
</head><body><main style="max-width:980px;margin:auto;padding:40px 20px;font-family:system-ui;color:#1f2937"><p style="font-weight:800;color:#166534">MIK Store Taiwan</p><h1>${escapeHtml(route.h1)}</h1><p style="max-width:720px;line-height:1.75">${escapeHtml(route.description)}</p><nav aria-label="Related pages">${(route.links || []).map(link => `<a href="${escapeAttr(link)}" style="display:inline-block;margin:12px 12px 0 0;color:#166534;font-weight:700">${escapeHtml(link.replace(/^\//, '').replace(/-/g, ' ') || 'Shop home')}</a>`).join('')}</nav></main></body></html>`;
}

function ensureDir(filePath) {
  mkdirSync(dirname(filePath), { recursive: true });
}

function writePage(pathname, html) {
  const filePath = join(PUBLIC_DIR, pathname.replace(/^\//, ''), 'index.html');
  ensureDir(filePath);
  writeFileSync(filePath, html, 'utf8');
}

function writeSeoArtifacts() {
  // Remove obsolete generated product pages so deleted or renamed Wix items do not linger.
  rmSync(join(PUBLIC_DIR, 'product'), { recursive: true, force: true });
  rmSync(join(PUBLIC_DIR, 'product-page'), { recursive: true, force: true });
  rmSync(join(PUBLIC_DIR, 'zh', 'product-page'), { recursive: true, force: true });
  ensureDir(join(PUBLIC_DIR, 'sitemap.xml'));
  const urls = [
    `${SITE_URL}/`,
    `${SITE_URL}/categories`,
    `${SITE_URL}/blog`,
  ];
  for (const product of products) {
    const legacyPath = productPath(product);
    const productUrl = `${SITE_URL}${legacyPath}`;
    urls.push(productUrl);
    writePage(legacyPath, buildProductHtml(product));
    writePage(`/zh${legacyPath}`, buildProductHtml(product));
  }
  for (const category of CATEGORIES.filter(item => item.id !== 'all')) {
    writePage(`/category/${category.id}`, buildCategoryHtml(category.id));
    urls.push(`${SITE_URL}/category/${encodeURIComponent(category.id)}`);
  }
  for (const [legacyPath, categoryId] of LEGACY_COLLECTION_ROUTES) {
    const html = buildCategoryHtml(categoryId).replaceAll(`${SITE_URL}/category/${encodeURIComponent(categoryId)}`, `${SITE_URL}/${legacyPath}`);
    writePage(`/${legacyPath}`, html);
    writePage(`/zh/${legacyPath}`, html.replace('<html lang="en">', '<html lang="zh-TW">').replaceAll(`${SITE_URL}/${legacyPath}`, `${SITE_URL}/zh/${legacyPath}`));
    urls.push(`${SITE_URL}/${legacyPath}`, `${SITE_URL}/zh/${legacyPath}`);
  }
  for (const post of BLOG_POSTS) {
    writePage(`/blog/${post.slug}`, buildBlogPostHtml(post));
    urls.push(`${SITE_URL}/blog/${encodeURIComponent(post.slug)}`);
  }
  for (const post of WIX_BLOG_POSTS) {
    writePage(post.path, buildWixBlogPostHtml(post));
    urls.push(new URL(post.path, `${SITE_URL}/`).href);
  }
  for (const service of SERVICES) {
    writePage(`/services/${service.slug}`, buildServiceHtml(service));
    urls.push(`${SITE_URL}/services/${service.slug}`);
  }
  for (const route of PUBLIC_STANDARD_ROUTES) {
    writePage(route.path, buildStandardHtml(route));
    urls.push(`${SITE_URL}${route.path === '/' ? '/' : route.path}`);
  }
  writePage('/categories', buildCategoriesHtml());
  writePage('/blog', buildBlogIndexHtml());
  writeFileSync(
    join(PUBLIC_DIR, 'robots.txt'),
    `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /checkout\nDisallow: /account\nSitemap: ${SITE_URL}/sitemap.xml\n`,
    'utf8',
  );
  writeFileSync(
    join(PUBLIC_DIR, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...new Set(urls)].map(url => `  <url><loc>${escapeHtml(url)}</loc><changefreq>weekly</changefreq><priority>${url.includes('/product-page/') ? '0.8' : '0.9'}</priority></url>`).join('\n')}\n</urlset>\n`,
    'utf8',
  );
}

writeSeoArtifacts();
console.log(`Prerendered ${products.length} products into ${relative(ROOT, PUBLIC_DIR)}/`);
