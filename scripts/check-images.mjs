#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const scanRoots = [join(root, 'src'), join(root, 'public')];
const sourceExtensions = new Set(['.js', '.jsx', '.html']);
const missing = [];

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

for (const file of scanRoots.flatMap(walk).filter(path => sourceExtensions.has(extname(path)))) {
  const source = readFileSync(file, 'utf8');
  const references = [...source.matchAll(/(?:src|image_url|image|poster):?\s*[={]?['"](\/[^'"?#]+\.(?:png|jpe?g|webp|avif|svg|gif))['"]/gi)].map(match => match[1]);
  for (const reference of references) {
    const asset = join(root, 'public', reference.slice(1));
    if (!existsSync(asset)) missing.push(`${relative(root, file)} -> ${reference}`);
  }
}

if (missing.length) {
  console.error(`Image validation failed:\n- ${[...new Set(missing)].join('\n- ')}`);
  process.exit(1);
}
console.log('Local image validation passed.');
