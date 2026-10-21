export const PUBLIC_STANDARD_ROUTES = [
  { path: '/', title: 'MIK Store | Indian Grocery Delivery in Taiwan', h1: 'Authentic Indian groceries delivered across Taiwan', description: 'Shop Indian spices, rice, pulses, fresh food, sweets, snacks, and everyday essentials from MIK Store Taiwan.', links: ['/categories', '/order-online', '/deals-discounts-mikstore-taiwan'] },
  { path: '/about-us', title: 'About MIK Store Taiwan', h1: 'About MIK Store', description: 'Learn about MIK Store and our mission to make authentic Indian groceries accessible across Taiwan.', links: ['/categories', '/customer-support'] },
  { path: '/customer-support', title: 'Customer Support | MIK Store Taiwan', h1: 'Customer Support', description: 'Get help with MIK Store orders, products, delivery, payments, and account questions in Taiwan.', links: ['/shipping-returns', '/terms-conditions', '/contact'] },
  { path: '/shipping-returns', title: 'Shipping & Returns | MIK Store Taiwan', h1: 'Shipping & Returns', description: 'Read MIK Store delivery, pickup, shipping, and returns information for customers across Taiwan.', links: ['/customer-support', '/terms-conditions'] },
  { path: '/terms-conditions', title: 'Terms & Conditions | MIK Store Taiwan', h1: 'Terms & Conditions', description: 'Terms and conditions for ordering and using the MIK Store Taiwan website.', links: ['/privacy', '/shipping-returns'] },
  { path: '/privacy', title: 'Privacy Policy | MIK Store Taiwan', h1: 'Privacy Policy', description: 'How MIK Store handles customer, account, order, and delivery information.', links: ['/terms-conditions', '/contact'] },
  { path: '/contact', title: 'Contact MIK Store Taiwan', h1: 'Contact Us', description: 'Contact MIK Store for product, order, delivery, and customer-service assistance in Taiwan.', links: ['/customer-support', '/about-us'] },
  { path: '/gift-card', title: 'MIK Store Gift Card | Taiwan', h1: 'MIK Store Gift Card', description: 'Give friends and family the freedom to choose Indian groceries, sweets, spices, and everyday essentials.', links: ['/categories', '/contact'] },
  { path: '/deals-discounts-mikstore-taiwan', title: 'Deals & Discounts | MIK Store Taiwan', h1: 'Deals & Discounts', description: 'Shop current offers and popular-value picks from MIK Store Taiwan.', links: ['/categories', '/order-online'] },
  { path: '/mik-brand-taiwan', title: 'MIK Brand Products | Taiwan', h1: 'MIK Brand Products', description: 'Explore products selected and packed under the MIK Store brand in Taiwan.', links: ['/categories', '/order-online'] },
  { path: '/order-online', title: 'Order Indian Groceries Online | MIK Store Taiwan', h1: 'Order Online', description: 'Browse MIK Store and order Indian groceries for delivery across Taiwan.', links: ['/categories', '/cart'] },
  { path: '/mik-indian-stores-taiwan-shopnow', title: 'Shop Indian Groceries | MIK Store Taiwan', h1: 'Shop MIK Store', description: 'Shop authentic Indian groceries, spices, rice, pulses, sweets, snacks, and essentials with delivery across Taiwan.', links: ['/categories', '/order-online'] },
  { path: '/most-popular', title: 'Popular Indian Groceries | MIK Store Taiwan', h1: 'Most Popular', description: 'Discover popular Indian grocery products ordered by MIK Store customers across Taiwan.', links: ['/categories', '/deals-discounts-mikstore-taiwan'] },
  { path: '/start-your-cart', title: 'Start Your Cart | MIK Store Taiwan', h1: 'Start Your Cart', description: 'Review your MIK Store basket and continue shopping for Indian groceries in Taiwan.', links: ['/categories', '/order-online'] },
  { path: '/book-online', title: 'Book a Service | MIK Store Taiwan', h1: 'Book Online', description: 'Explore consultation, beauty, and personal-care services available through MIK Store Taiwan.', links: ['/services', '/contact'] },
  { path: '/services', title: 'Services | MIK Store Taiwan', h1: 'Services', description: 'Explore consultations, workshops, and personal-care services at MIK Store Taiwan.', links: ['/book-online', '/contact'] },
  { path: '/groups', title: 'MIK Store Groups | Taiwan', h1: 'Groups', description: 'Join the MIK Store community for arrivals, recipes, events, and local updates across Taiwan.', links: ['/loyalty', '/refer-friends'] },
  { path: '/members', title: 'MIK Store Members | Taiwan', h1: 'Members', description: 'Sign in to manage your MIK Store profile, orders, delivery details, and rewards.', links: ['/account', '/loyalty'] },
  { path: '/loyalty', title: 'MIK Stars Loyalty Rewards | Taiwan', h1: 'MIK Stars', description: 'Learn about MIK Store loyalty rewards and sign in to view your current points balance.', links: ['/account', '/order-online'] },
  { path: '/refer-friends', title: 'Refer Friends | MIK Store Taiwan', h1: 'Refer Friends', description: 'Invite friends to discover MIK Store and learn about current referral benefits.', links: ['/account', '/groups'] },
  { path: '/referral', title: 'Refer Friends | MIK Store Taiwan', h1: 'Refer Friends', description: 'Invite friends to discover MIK Store and learn about current referral benefits.', links: ['/account', '/groups'] },
  { path: '/ecpay-creditcard-mikstore-taiwan', title: 'Online Payment | MIK Store Taiwan', h1: 'Online Payment', description: 'Payment information for MIK Store customers ordering groceries in Taiwan.', links: ['/terms-conditions', '/customer-support'] },
];

export const LEGACY_COLLECTION_ROUTES = [
  ['daily-groceries', 'daily-groceries'], ['everyday', 'everyday'], ['flour-rice-pulses', 'flour-rice-pulses'],
  ['fresh-finds', 'fresh-finds'], ['ghee-oil-butter', 'ghee-oil-butter'], ['ground-spices', 'ground-spices'],
  ['whole-spices', 'whole-spices'], ['equipment', 'equipment'], ['personal-hygiene', 'personal-hygiene'],
  ['ready-to-eat', 'ready-to-eat'], ['sweets', 'sweets'], ['tea-coffee-beverages', 'daily-groceries'],
  ['mdh-haldirams', 'mdh-haldirams'],
];

export const PRIVATE_NOINDEX_ROUTES = ['/cart', '/checkout', '/order-confirmation', '/my-orders', '/account', '/login', '/admin'];
