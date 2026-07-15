#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { CATEGORIES, PRODUCTS as SEED_PRODUCTS } from '../src/data/mockData.js';
import { BLOG_POSTS } from '../src/data/blogPosts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC_DIR = join(ROOT, 'public');
const STORE_SCRIPT = join(ROOT, 'server', 'sqlite_store.py');
const SITE_URL = (process.env.MIK_PUBLIC_SITE_URL || 'http://127.0.0.1:5173').replace(/\/$/, '');

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
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

const products = readProductsFromStore() || SEED_PRODUCTS;
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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeAttr(description)}" />
  <meta name="keywords" content="${escapeAttr(keywords)}" />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="${SITE_URL}/product/${encodeURIComponent(slug)}" />
  <meta property="og:type" content="product" />
  <meta property="og:title" content="${escapeAttr(title)}" />
  <meta property="og:description" content="${escapeAttr(description)}" />
  <meta property="og:url" content="${SITE_URL}/product/${encodeURIComponent(slug)}" />
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
      url: `${SITE_URL}/product/${encodeURIComponent(slug)}`,
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
          return `<a href="/product/${encodeURIComponent(relSlug)}"><strong>${escapeHtml(item.name_en)}</strong><br /><span style="color:#6b7280">NT$${Number(item.price || 0).toLocaleString()}</span></a>`;
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
        return `<a href="/product/${encodeURIComponent(slug)}" style="display:block;background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:14px;text-decoration:none;color:#111827"><strong>${escapeHtml(item.name_en)}</strong><br /><span style="color:#6b7280">NT$${Number(item.price || 0).toLocaleString()}</span></a>`;
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
              return `<a class="product" href="/product/${encodeURIComponent(slug)}">
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

function ensureDir(filePath) {
  mkdirSync(dirname(filePath), { recursive: true });
}

function writePage(pathname, html) {
  const filePath = join(PUBLIC_DIR, pathname.replace(/^\//, ''), 'index.html');
  ensureDir(filePath);
  writeFileSync(filePath, html, 'utf8');
}

function writeSeoArtifacts() {
  ensureDir(join(PUBLIC_DIR, 'sitemap.xml'));
  const urls = [
    `${SITE_URL}/`,
    `${SITE_URL}/categories`,
    `${SITE_URL}/blog`,
  ];
  const sitemapEntries = [];
  for (const product of products) {
    const slug = product.seo_slug || slugify(product.name_en) || product.id;
    const productUrl = `${SITE_URL}/product/${encodeURIComponent(slug)}`;
    urls.push(productUrl);
    sitemapEntries.push(`  <url><loc>${productUrl}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
    writePage(`/product/${slug}`, buildProductHtml(product));
  }
  for (const category of CATEGORIES.filter(item => item.id !== 'all')) {
    writePage(`/category/${category.id}`, buildCategoryHtml(category.id));
    urls.push(`${SITE_URL}/category/${encodeURIComponent(category.id)}`);
  }
  for (const post of BLOG_POSTS) {
    writePage(`/blog/${post.slug}`, buildBlogPostHtml(post));
    urls.push(`${SITE_URL}/blog/${encodeURIComponent(post.slug)}`);
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
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${url}</loc><changefreq>weekly</changefreq><priority>${url.includes('/product/') ? '0.8' : '0.9'}</priority></url>`).join('\n')}\n</urlset>\n`,
    'utf8',
  );
}

writeSeoArtifacts();
console.log(`Prerendered ${products.length} products into ${relative(ROOT, PUBLIC_DIR)}/`);
