#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');
const distDir = join(root, 'dist');
const appShell = readFileSync(join(distDir, 'index.html'), 'utf8');

function walk(directory) {
  const { readdirSync } = awaitFs;
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

// Keep the filesystem import synchronous so this script remains deterministic.
import * as awaitFs from 'node:fs';

function extract(html, pattern, fallback = '') {
  return html.match(pattern)?.[1]?.trim() || fallback;
}

function mergePage(source) {
  const title = extract(source, /<title>([\s\S]*?)<\/title>/i, 'MIK Store Taiwan');
  const description = extract(source, /<meta\s+name="description"\s+content="([^"]*)"/i);
  const robots = extract(source, /<meta\s+name="robots"\s+content="([^"]*)"/i, 'index,follow');
  const canonical = extract(source, /<link\s+rel="canonical"\s+href="([^"]*)"/i);
  const jsonLd = [...source.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)].map(match => `<script type="application/ld+json">${match[1]}</script>`).join('\n');
  const body = extract(source, /<body[^>]*>([\s\S]*?)<\/body>/i);
  return appShell
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`)
    .replace('</head>', `  <meta name="description" content="${description}" />\n  <meta name="robots" content="${robots}" />\n  ${canonical ? `<link rel="canonical" href="${canonical}" />` : ''}\n  ${jsonLd}\n</head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}

for (const sourcePath of walk(publicDir).filter(path => path.endsWith('/index.html'))) {
  const relativePath = sourcePath.slice(publicDir.length + 1);
  const targetPath = join(distDir, relativePath);
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, mergePage(readFileSync(sourcePath, 'utf8')), 'utf8');
}

if (!existsSync(join(distDir, 'index.html'))) throw new Error('Production app shell was not generated.');
console.log('Merged prerendered content into the production React app shell.');
