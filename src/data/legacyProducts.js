export const LEGACY_PRODUCTS = [
  {
    id: 'f3a17c6f-4487-47da-8b06-dd5f904eeaed',
    name_en: 'Malika White Urid Whole - Gota',
    name_zh: '白豆子',
    seo_slug: 'malika-white-urid-whole-gota-mik',
    legacy_path: '/product-page/malika-white-urid-whole-gota-mik',
    seo_title: 'Malika White Urid Whole Gota in Taiwan | MIK Store',
    seo_description: 'Buy Malika White Urid Whole Gota online in Taiwan from MIK Store.',
    seo_keywords: 'Malika white urid whole, urad gota, Indian pulses Taiwan',
    seo_h1: 'Malika White Urid Whole - Gota 白豆子',
    seo_content: 'Malika White Urid Whole, also known as urad gota, is available from MIK Store with delivery support across Taiwan.',
    price: 90,
    category: 'dal-pulses',
    stock: 0,
    image_url: 'https://static.wixstatic.com/media/e9b5bf_952127458ad54d02b75ac27bfdd79bcd~mv2.jpg/v1/fit/w_700,h_700,q_90/file.jpg',
    badge: 'Out of stock',
    collection_names: ['Flour, Rice & Pulses'],
  },
  {
    id: 'legacy-eno-fruit-salt-lime-100gm-mik',
    name_en: 'Eno Fruit Salt (Lime)',
    name_zh: '印度蘇打果鹽（檸檬味）',
    seo_slug: 'eno-fruit-salt-lime-100gm-mik',
    legacy_path: '/product-page/eno-fruit-salt-lime-100gm-mik',
    seo_title: 'Eno Fruit Salt Lime in Taiwan | MIK Store',
    seo_description: 'Buy Eno Fruit Salt Lime sachets online in Taiwan from MIK Store.',
    seo_keywords: 'Eno fruit salt lime, Eno Taiwan, Indian grocery Taiwan',
    seo_h1: 'Eno Fruit Salt (Lime) 印度蘇打果鹽（檸檬味）',
    seo_content: 'Eno Fruit Salt Lime is available in sachets and packs through MIK Store, with pickup and delivery options across Taiwan.',
    price: 20,
    category: 'daily-groceries',
    stock: 0,
    image_url: 'https://static.wixstatic.com/media/e9b5bf_09a4732176e04773b5cc99dbc347c7e1~mv2.jpg/v1/fit/w_500,h_500,q_90/file.jpg',
    badge: 'Out of stock',
    collection_names: ['Indian Daily Grocery'],
  },
];

export function withLegacyProducts(products = []) {
  const byPath = new Map(products.map(product => [product.legacy_path || `/product-page/${product.seo_slug || product.id}`, product]));
  for (const product of LEGACY_PRODUCTS) {
    if (!byPath.has(product.legacy_path)) byPath.set(product.legacy_path, product);
  }
  return [...byPath.values()];
}
