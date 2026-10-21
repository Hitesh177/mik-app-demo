#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const origin = process.env.MIK_LEGACY_SITE_URL || 'https://www.indianstoretaiwan.com';

async function xml(url) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.text();
}

function locations(source) {
  return [...source.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1].replaceAll('&amp;', '&'));
}

const rootSitemap = await xml(`${origin}/sitemap.xml`);
const sitemapUrls = locations(rootSitemap).filter(url => /sitemap\.xml(?:$|\?)/.test(url));
const pageUrls = sitemapUrls.length
  ? (await Promise.all(sitemapUrls.map(async url => locations(await xml(url))))).flat()
  : locations(rootSitemap);

const ignoredPrefixes = ['/members/', '/_api/', '/search'];
const missing = [];
for (const url of new Set(pageUrls)) {
  const pathname = decodeURI(new URL(url).pathname).replace(/\/$/, '') || '/';
  if (ignoredPrefixes.some(prefix => pathname.startsWith(prefix))) continue;
  const file = pathname === '/' ? join(dist, 'index.html') : join(dist, pathname.slice(1), 'index.html');
  if (!existsSync(file)) missing.push(pathname);
}

if (missing.length) {
  console.error(`Live migration check found ${missing.length} URLs without prerendered HTML:\n- ${missing.join('\n- ')}`);
  process.exit(1);
}

const generatedSitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
console.log(`Live migration check passed for ${new Set(pageUrls).size} indexed URLs; generated sitemap is ${generatedSitemap.length.toLocaleString()} bytes.`);
