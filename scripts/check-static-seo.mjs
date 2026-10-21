#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEGACY_COLLECTION_ROUTES, PUBLIC_STANDARD_ROUTES } from '../src/data/publicRoutes.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const expected = [
  ...PUBLIC_STANDARD_ROUTES.map(route => route.path),
  '/categories', '/blog',
  ...LEGACY_COLLECTION_ROUTES.flatMap(([path]) => [`/${path}`, `/zh/${path}`]),
];
const errors = [];

for (const pathname of new Set(expected)) {
  const file = pathname === '/' ? join(dist, 'index.html') : join(dist, pathname.slice(1), 'index.html');
  if (!existsSync(file)) { errors.push(`${pathname}: missing HTML`); continue; }
  const html = readFileSync(file, 'utf8');
  if (!/<title>[^<]+<\/title>/i.test(html)) errors.push(`${pathname}: missing title`);
  if (!/<meta\s+name="description"\s+content="[^"]+"/i.test(html)) errors.push(`${pathname}: missing description`);
  if (!/<link\s+rel="canonical"\s+href="[^"]+"/i.test(html)) errors.push(`${pathname}: missing canonical`);
  if (!/<h1[\s>]/i.test(html)) errors.push(`${pathname}: missing h1`);
  if (!/type="module"[^>]+src="\/assets\//i.test(html)) errors.push(`${pathname}: missing production React bundle`);
}

const sitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
if (urls.length !== new Set(urls).size) errors.push('sitemap: duplicate URLs');

if (errors.length) {
  console.error(`Static SEO validation failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`Static SEO validation passed for ${new Set(expected).size} standard routes.`);
