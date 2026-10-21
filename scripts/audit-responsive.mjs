#!/usr/bin/env node
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PUBLIC_STANDARD_ROUTES } from '../src/data/publicRoutes.js';
import { SERVICES } from '../src/data/services.js';
import { BLOG_POSTS } from '../src/data/blogPosts.js';
import { WIX_BLOG_POSTS } from '../src/data/wixBlogPosts.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const baseUrl = process.env.RESPONSIVE_AUDIT_URL || 'http://127.0.0.1:5190';
const outputDir = join(root, 'artifacts', 'responsive-audit');
mkdirSync(outputDir, { recursive: true });

const routes = [...new Set([
  ...PUBLIC_STANDARD_ROUTES.map(route => route.path),
  '/categories', '/daily-groceries', '/category/dal-pulses',
  '/product-page/malika-white-urid-whole-gota-mik',
  '/blog', `/blog/${BLOG_POSTS[0].slug}`, WIX_BLOG_POSTS[0]?.path,
  ...SERVICES.map(service => `/services/${service.slug}`),
  '/cart', '/checkout', '/account', '/my-orders',
].filter(Boolean))];

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 1000 },
];
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}),
});
const failures = [];
let checks = 0;

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  for (const route of routes) {
    const pageErrors = [];
    const onPageError = error => pageErrors.push(error.message);
    page.on('pageerror', onPageError);
    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(350);
    const audit = await page.evaluate(() => {
      const rootElement = document.documentElement;
      const overflow = Math.max(rootElement.scrollWidth, document.body.scrollWidth) - window.innerWidth;
      const offenders = [...document.querySelectorAll('body *')]
        .filter(element => {
          const style = getComputedStyle(element);
          if (style.position === 'fixed' || style.position === 'absolute') return false;
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && (rect.left < -2 || rect.right > window.innerWidth + 2);
        })
        .slice(0, 6)
        .map(element => `${element.tagName.toLowerCase()}.${String(element.className || '').split(' ').slice(0, 3).join('.')}`);
      return {
        overflow,
        offenders,
        h1: document.querySelectorAll('h1').length,
        title: document.title,
        bodyText: document.body.innerText.trim().length,
      };
    });
    checks += 1;
    const reasons = [];
    if (!response?.ok()) reasons.push(`HTTP ${response?.status() || 'no response'}`);
    if (audit.overflow > 2) reasons.push(`${audit.overflow}px horizontal overflow (${audit.offenders.join(', ')})`);
    if (!audit.h1) reasons.push('missing h1');
    if (audit.bodyText < 40) reasons.push('page content is nearly empty');
    if (pageErrors.length) reasons.push(`page errors: ${pageErrors.join('; ')}`);
    if (reasons.length) {
      failures.push({ viewport: viewport.name, route, reasons });
      await page.screenshot({
        path: join(outputDir, `${viewport.name}-${route.replace(/^\/|\W+/g, '-') || 'home'}.png`),
        fullPage: false,
        timeout: 10000,
      });
    }
    page.off('pageerror', onPageError);
  }
  console.log(`Checked ${routes.length} routes at ${viewport.width}px (${viewport.name}).`);
  await context.close();
}
await browser.close();

if (failures.length) {
  console.error(JSON.stringify({ checks, failures }, null, 2));
  process.exit(1);
}
console.log(`Responsive audit passed: ${checks} page/viewport checks across ${routes.length} routes.`);
