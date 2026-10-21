function normalize(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, ' ')
    .trim();
}

function editDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const previous = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = previous;
    }
  }
  return row[b.length];
}

export function productSearchScore(product, query, categoryLabel = '') {
  const q = normalize(query);
  if (!q) return 0;
  const name = normalize(product.name_en);
  const chineseName = normalize(product.name_zh);
  const category = normalize(categoryLabel);
  const pool = normalize([name, chineseName, category, product.seo_title, product.seo_keywords, product.seo_h1].filter(Boolean).join(' '));
  if (name === q) return 1000;
  if (name.startsWith(q)) return 800;
  if (category.startsWith(q)) return 650;
  const position = pool.indexOf(q);
  if (position >= 0) return 600 - Math.min(position, 200);

  // Typo tolerance is deliberately conservative to avoid irrelevant groceries.
  if (q.length < 3) return -1;
  const queryWords = q.split(' ');
  const poolWords = [...new Set(pool.split(' ').filter(Boolean))];
  let total = 0;
  for (const queryWord of queryWords) {
    const threshold = queryWord.length >= 8 ? 2 : 1;
    const best = poolWords.reduce((minimum, word) => {
      if (Math.abs(word.length - queryWord.length) > threshold) return minimum;
      return Math.min(minimum, editDistance(queryWord, word));
    }, Infinity);
    if (best > threshold) return -1;
    total += best;
  }
  return 350 - total * 50;
}

export function searchProducts(products, query, categoryLabelFor = () => '') {
  if (!String(query || '').trim()) return products;
  return products
    .map(product => ({ product, score: productSearchScore(product, query, categoryLabelFor(product)) }))
    .filter(result => result.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map(result => result.product);
}
