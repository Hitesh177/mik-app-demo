#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE_ID = '889ce193-8563-4c1e-9692-ff4495fe8db7';
const OUTPUT = join(ROOT, 'src', 'data', 'wixBlogPosts.js');
const IMAGE_DIR = join(ROOT, 'public', 'images', 'blog', 'wix');

function readEnv() {
  const result = { ...process.env };
  for (const filename of ['.env.local', '.env']) {
    const path = join(ROOT, filename);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const index = trimmed.indexOf('=');
      if (index < 1) continue;
      let value = trimmed.slice(index + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      result[trimmed.slice(0, index).trim()] = value;
    }
  }
  return result;
}

const env = readEnv();
if (!env.WIX_API_KEY) throw new Error('WIX_API_KEY is missing from .env.local');

function safeSegment(value) {
  return String(value || 'asset')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'asset';
}

function imageUrl(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.url || value.src?.url || value.image?.url || '';
}

function isImageSource(value) {
  return typeof value === 'string' && (
    /\.(avif|gif|jpe?g|png|webp)(?:$|[?#])/i.test(value)
    || /~mv2\.(avif|gif|jpe?g|png|webp)$/i.test(value)
  );
}

function collectImageUrls(value, output = new Set()) {
  if (!value || typeof value !== 'object') return output;
  if (Array.isArray(value)) {
    value.forEach(item => collectImageUrls(item, output));
    return output;
  }
  for (const [key, child] of Object.entries(value)) {
    if ((key === 'url' || key === 'src' || key === 'id') && isImageSource(child)) {
      output.add(child);
    }
    collectImageUrls(child, output);
  }
  return output;
}

async function downloadImage(url, postSlug, index) {
  const normalizedAsset = url.replace(/^media\//, '');
  const remoteUrl = /^https:\/\//.test(url) ? url : `https://static.wixstatic.com/media/${normalizedAsset}`;
  const parsed = new URL(remoteUrl);
  const originalName = decodeURIComponent(parsed.pathname.split('/').pop() || 'image.jpg');
  const extension = extname(originalName).toLowerCase().match(/^\.(avif|gif|jpe?g|png|webp)$/)?.[0] || '.jpg';
  const relativePath = `/images/blog/wix/${safeSegment(postSlug)}-${index + 1}${extension}`;
  const outputPath = join(ROOT, 'public', relativePath);
  if (!existsSync(outputPath)) {
    const response = await fetch(remoteUrl);
    if (!response.ok) throw new Error(`Image download failed (${response.status}): ${remoteUrl}`);
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, Buffer.from(await response.arrayBuffer()));
  }
  return relativePath;
}

async function queryPosts() {
  const response = await fetch('https://www.wixapis.com/v3/posts/query', {
    method: 'POST',
    headers: {
      Authorization: env.WIX_API_KEY,
      'wix-site-id': SITE_ID,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fieldsets: ['RICH_CONTENT', 'URL'],
      query: { paging: { limit: 100, offset: 0 } },
    }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`Wix Blog query failed (${response.status}): ${JSON.stringify(payload)}`);
  return payload.posts || [];
}

function replaceUrls(value, replacements) {
  if (typeof value === 'string') return replacements.get(value) || value;
  if (Array.isArray(value)) return value.map(item => replaceUrls(item, replacements));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, replaceUrls(child, replacements)]));
}

mkdirSync(IMAGE_DIR, { recursive: true });
const rawPosts = await queryPosts();
const posts = [];

for (const rawPost of rawPosts) {
  const slug = rawPost.slug;
  const language = rawPost.language === 'zh' ? 'zh' : 'en';
  const remoteImages = [...collectImageUrls(rawPost)];
  const replacements = new Map();
  for (const [index, url] of remoteImages.entries()) {
    replacements.set(url, await downloadImage(url, `${slug}-${rawPost.id}`, index));
  }
  const localized = replaceUrls(rawPost, replacements);
  const coverImage = imageUrl(localized.media?.wixMedia?.image) || imageUrl(localized.media?.image);
  posts.push({
    source: 'wix',
    id: localized.id,
    contentId: localized.contentId,
    translationId: localized.translationId,
    language,
    slug,
    path: `${language === 'zh' ? '/zh' : ''}/post/${slug}`,
    title: localized.title,
    description: localized.excerpt || localized.customExcerpt || '',
    excerpt: localized.excerpt || localized.customExcerpt || '',
    publishedDate: localized.firstPublishedDate || localized.lastPublishedDate,
    updatedDate: localized.lastPublishedDate,
    minutesToRead: localized.minutesToRead || 1,
    coverImage,
    coverAlt: localized.media?.altText || localized.title,
    richContent: localized.richContent || null,
  });
}

posts.sort((a, b) => String(b.publishedDate).localeCompare(String(a.publishedDate)));
writeFileSync(
  OUTPUT,
  `// Generated by scripts/import-wix-blog.mjs. Do not edit manually.\nexport const WIX_BLOG_POSTS = ${JSON.stringify(posts, null, 2)};\n\nexport const WIX_BLOG_POST_BY_PATH = new Map(WIX_BLOG_POSTS.map(post => [post.path, post]));\n`,
  'utf8',
);

const richCount = posts.filter(post => post.richContent?.nodes?.length).length;
const imageCount = new Set(posts.flatMap(post => [...collectImageUrls(post)].filter(url => String(url).startsWith('/images/')))).size;
console.log(`Imported ${posts.length} Wix blog posts (${richCount} with rich content, ${imageCount} local image references).`);
