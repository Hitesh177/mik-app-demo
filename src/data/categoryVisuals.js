export const CATEGORY_VISUALS = {
  'atta-flour': [
    '/products/4269f1c4c0bf7de00ebe.jpeg',
    '/products/c3291bbb445eb5005123.jpg',
    '/products/14acb4531895715a33cf.jpg',
  ],
  masala: [
    '/products/2b1bca81c2a43bd51f13.jpg',
    '/products/e03dcdf1d7c151ec4d25.jpg',
    '/products/77840979d1ae7fe6ab7f.jpg',
  ],
  'rice-oils': [
    '/products/b99c87f0672e4b4f1062.jpg',
    '/products/dc2cb3c841e1c9690f38.jpg',
    '/products/8e8bfa53958d34d8e034.jpg',
  ],
  pickles: [
    '/products/2acefebd9bf8cf3418db.jpeg',
    '/products/6e338be523c7d3ded661.jpg',
    '/products/6b3853be3a8f1fd64a37.jpeg',
  ],
  'instant-food': [
    '/products/7d93885582c3b954c7c5.jpg',
    '/products/b9e1957cbe86bf838dc5.jpeg',
    '/products/8b75df8cd69c1f9971f7.jpg',
  ],
  'papad-biscuits': [
    '/products/55de5b5f28f82e355ade.jpg',
    '/products/8cc0c5ce7c9544fd49c0.jpg',
    '/products/6a0f5cfef8d32eedbceb.jpg',
  ],
  'noodles-sauces': [
    '/products/0997334088d56fbe20e2.jpg',
    '/products/62aaa6d25304e857e9e4.jpg',
    '/products/33855bc48e1a3ec5eed7.jpg',
  ],
  snacks: [
    '/products/2f6e02ea82c96ec5db94.jpg',
    '/products/bac972eaf468bec4d546.jpg',
    '/products/2121eccdd9798648d508.png',
  ],
  sweets: [
    '/products/568a788b38f734a996d8.jpg',
    '/products/6b5a87ef8150886faef3.jpg',
    '/products/574bf596a4605d443932.jpg',
  ],
  'ready-to-eat': [
    '/products/74140825cf9470364971.jpg',
    '/products/7377345543f552e94444.jpg',
    '/products/73f2418af31325304160.jpg',
  ],
  toiletry: [
    '/products/6ba1e206f31e79b9e8a3.jpg',
    '/products/b4ff8945406ef11f8b08.jpg',
    '/products/f7ae417ee0640b44920a.jpg',
  ],
  'mouth-freshener': [
    '/products/d7928f1f785b8fd5eacb.jpg',
    '/products/3e77580be4d1639fe000.jpg',
  ],
  'fresh-frozen': [
    '/products/8d8c1d28fb8860a97b20.jpg',
    '/products/c6e612a6e20d31e7c202.jpg',
    '/products/a1e463d145fa1dd65737.jpg',
  ],
  'dal-pulses': [
    '/products/f90a7fa704c5a3be975e.jpeg',
    '/products/fb3a101d46f5fdb72bc3.jpeg',
    '/products/e33841343332298b6632.jpeg',
  ],
  spices: [
    '/products/6c8b8133bdf573557619.jpg',
    '/products/27936b59cd32ec306e35.jpg',
    '/products/c18759438af1a26f40b0.jpg',
  ],
  'tea-coffee': [
    '/products/5abd8aa7919dd266e128.jpg',
    '/products/8b795f0856923974d15b.jpg',
    '/products/a1ab11a76574b1fff652.jpg',
  ],
  puja: [
    '/products/f3d5a23edacd0e57d7d4.jpg',
    '/products/109ca5111d2ecad67077.jpg',
    '/products/c07522d872966d18bee4.jpg',
  ],
  household: [
    '/products/a749b95a194ab019f19d.jpg',
    '/products/9fa5eb30317efdf151ef.jpg',
    '/products/feea6b4964480c08793d.jpg',
  ],
  'mdh-haldirams': [
    '/products/2f6e02ea82c96ec5db94.jpg',
    '/products/bac972eaf468bec4d546.jpg',
    '/products/568a788b38f734a996d8.jpg',
  ],
};

export const CATEGORY_TILE_IMAGES = {
  masala: '/categories/ground-spices.png',
  'fresh-food': '/categories/fresh-food.png',
  'frozen-food-curries': '/categories/frozen-food-curries.png',
  'indian-handicrafts': '/categories/indian-handicrafts.png',
  'deals-discounts-mikstore-taiwan': '/categories/offers-and-deals.png',
  'offers-and-deals': '/categories/offers-and-deals.png',
  others: '/categories/others.png',
  'popular-items': '/categories/popular-items.png',
};

const CATEGORY_VISUAL_ALIASES = {
  'whole-spices': 'spices',
  'ground-spices': 'masala',
  'flour-rice-pulses': 'atta-flour',
  'frozen-food-and-curries': 'frozen-food-curries',
  'daily-groceries': 'instant-food',
  'indian-daily-grocery': 'instant-food',
  'ready-to-eat-food': 'ready-to-eat',
  'mayurs-ready-to-eat-food': 'ready-to-eat',
  'indian-sweet': 'sweets',
  'indian-sweets': 'sweets',
  'ghee-oil-butter': 'rice-oils',
  'ghee-oil-liquid-products': 'rice-oils',
  'tea-other-beverages': 'tea-coffee',
  'tea-coffee-beverages': 'tea-coffee',
  'personal-hygiene': 'toiletry',
  'fresh-finds': 'fresh-food',
  'household-kitchen-equipments': 'household',
  'household-kitchen-equipment': 'household',
  'snacks-sauce-pickle': 'snacks',
  'snacks-sauces-pickles': 'snacks',
  equipment: 'household',
  'indian-equipment-art-things': 'household',
};

export function categoryVisualKey(categoryId) {
  const normalized = String(categoryId || '')
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-z0-9]+/g, '-');

  if (CATEGORY_VISUALS[normalized]) return normalized;
  return CATEGORY_VISUAL_ALIASES[normalized] || normalized;
}
