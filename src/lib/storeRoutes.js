const LEGACY_CATEGORY_PATHS = {
  'fresh-frozen': '/fresh-finds',
  'atta-flour': '/flour-rice-pulses',
  'dal-pulses': '/flour-rice-pulses',
  spices: '/whole-spices',
  masala: '/ground-spices',
  'rice-oils': '/ghee-oil-butter',
  'tea-coffee': '/tea-coffee-beverages',
  'instant-food': '/daily-groceries',
  sweets: '/sweets',
  'ready-to-eat': '/ready-to-eat',
  toiletry: '/personal-hygiene',
  household: '/equipment',
};

export function categoryPath(categoryId) {
  return LEGACY_CATEGORY_PATHS[categoryId] || (String(categoryId).startsWith('/') ? categoryId : `/${categoryId}`);
}

export function isChinesePath(pathname) {
  return pathname === '/zh' || pathname.startsWith('/zh/');
}

export function localizedPath(path, chinese) {
  const normalized = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  if (chinese) return normalized.startsWith('/zh') ? normalized || '/zh' : `/zh${normalized}` || '/zh';
  if (normalized === '/zh') return '/';
  return normalized.startsWith('/zh/') ? normalized.slice(3) || '/' : normalized || '/';
}

export function toggleLocalePath(pathname) {
  return localizedPath(pathname, !isChinesePath(pathname));
}
