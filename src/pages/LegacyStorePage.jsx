import { Link, useLocation } from 'react-router-dom';
import { Gift, MessageCircle, Star, Users } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import ProductCard from '../components/ProductCard';
import SeoHead from '../components/SeoHead';
import { useAdmin } from '../context/AdminContext';
import { useCustomer } from '../context/CustomerContext';

const LINE_URL = 'https://line.me/ti/p/@688vynca';

const STATIC_PAGES = {
  gift: {
    eyebrow: 'A gift with plenty of choice',
    title: 'MIK Store Gift Card',
    description: 'Give friends and family the freedom to choose authentic Indian groceries, sweets, spices, and everyday essentials.',
    icon: Gift,
    cards: [
      ['Choose an amount', 'Tell our team the value you would like to gift.'],
      ['Add your message', 'Include the recipient name and a personal note.'],
      ['Arrange delivery', 'We will confirm payment and delivery details directly with you.'],
    ],
    action: 'Request a gift card',
    href: LINE_URL,
  },
  groups: {
    eyebrow: 'The MIK community',
    title: 'Groups',
    description: 'Join MIK Store customers across Taiwan to hear about arrivals, recipes, events, and community updates.',
    icon: Users,
    cards: [
      ['New arrivals', 'Get updates when popular Indian groceries and seasonal items land.'],
      ['Food and recipes', 'Share cooking ideas and discover ways to use products from the store.'],
      ['Local community', 'Stay connected with customers and MIK Store locations around Taiwan.'],
    ],
    action: 'Join via LINE',
    href: LINE_URL,
  },
  referral: {
    eyebrow: 'Share MIK Store',
    title: 'Refer Friends',
    description: 'Invite friends to discover MIK Store. Sign in first so your customer account is available when referral benefits are offered.',
    icon: MessageCircle,
    cards: [
      ['Sign in', 'Use the same account you use for orders and rewards.'],
      ['Share with a friend', 'Send them MIK Store through your preferred messaging app.'],
      ['Get support', 'Ask the MIK team about the current referral offer before sharing.'],
    ],
    action: 'Open my account',
    href: '/account',
  },
};

function PageFrame({ title, description, children, active = 'home' }) {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-[#f8f5ee] flex flex-col">
      <SeoHead title={`${title} | MIK Store Taiwan`} description={description} canonical={typeof window !== 'undefined' ? `${window.location.origin}${pathname}` : undefined} />
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-7 pb-28">{children}</main>
      <Footer />
      <BottomNav active={active} />
    </div>
  );
}

function ProductLanding({ type }) {
  const { products } = useAdmin();
  const config = type === 'deals'
    ? {
        title: 'Deals & Discounts',
        description: 'Shop current offers and popular-value picks from MIK Store Taiwan.',
        eyebrow: 'More value in every basket',
        test: product => /sale|deal|offer|discount/i.test(`${product.badge || ''} ${product.name_en || ''}`),
      }
    : type === 'brand'
      ? {
          title: 'MIK Brand Products',
          description: 'Explore products selected and packed under the MIK Store brand.',
          eyebrow: 'From our own shelves',
          test: product => /\bmik\b|mayur/i.test(`${product.name_en || ''} ${(product.collection_names || []).join(' ')}`),
        }
      : {
          title: 'Order Online',
          description: 'Browse the current MIK Store catalog and order Indian groceries for delivery across Taiwan.',
          eyebrow: 'You order, we deliver',
          test: () => true,
        };
  const matched = products.filter(config.test);
  const visible = (matched.length ? matched : products).slice(0, type === 'order' ? 36 : 24);

  return (
    <PageFrame title={config.title} description={config.description} active="categories">
      <section className="overflow-hidden rounded-[2rem] bg-[#203b2a] px-6 py-10 text-white sm:px-10">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#efc56d]">{config.eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">{config.title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-200 sm:text-base">{config.description}</p>
      </section>
      <section className="mt-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-widest text-green-700">Shop now</p><h2 className="text-2xl font-black text-gray-900">{type === 'order' ? 'All products' : config.title}</h2></div>
          <Link to="/categories" className="text-sm font-bold text-green-700">View categories →</Link>
        </div>
        {visible.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{visible.map(product => <ProductCard key={product.id} product={product} compact />)}</div> : <div className="rounded-3xl bg-white p-8 text-center text-gray-500">Current products will appear here as soon as the catalog finishes syncing.</div>}
      </section>
    </PageFrame>
  );
}

function LoyaltyPage() {
  const { customer, isLoggedIn } = useCustomer();
  const points = customer?.rewards?.points || 0;
  const next = customer?.rewards?.next_reward_at ?? 100;
  return (
    <PageFrame title="MIK Stars" description="View MIK Store loyalty rewards and your current points balance.">
      <section className="grid gap-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#203b2a] to-[#31593a] p-7 text-white md:grid-cols-[1fr_.8fr] md:p-12">
        <div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#efc56d]">MIK Stars</p><h1 className="mt-3 text-4xl font-black sm:text-6xl">Shop. Earn. Save.</h1><p className="mt-4 max-w-xl leading-7 text-stone-200">Earn loyalty points on eligible orders. Every 100 points unlocks a 10% reward that can be used when available at checkout.</p><Link to={isLoggedIn ? '/account' : '/login'} className="mt-7 inline-flex rounded-full bg-[#efc56d] px-6 py-3 font-black text-[#203b2a]">{isLoggedIn ? 'Manage my rewards' : 'Sign in to view points'}</Link></div>
        <div className="self-center rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur"><Star className="text-[#efc56d]" size={34} fill="currentColor" /><p className="mt-5 text-sm text-white/70">Current balance</p><p className="text-5xl font-black">{isLoggedIn ? points : '—'}</p><p className="mt-2 text-sm text-white/70">{isLoggedIn ? (customer?.rewards?.can_redeem_100 ? 'A 10% reward is ready.' : `${next} points until your next reward.`) : 'Sign in to load your live balance.'}</p></div>
      </section>
    </PageFrame>
  );
}

function StaticLanding({ type }) {
  const page = STATIC_PAGES[type];
  const Icon = page.icon;
  const external = page.href.startsWith('http');
  return (
    <PageFrame title={page.title} description={page.description}>
      <section className="rounded-[2rem] border border-stone-200 bg-white p-7 shadow-sm sm:p-12">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-800"><Icon size={28} /></div>
        <p className="mt-7 text-xs font-black uppercase tracking-[0.2em] text-green-700">{page.eyebrow}</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-gray-950 sm:text-6xl">{page.title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600">{page.description}</p>
        <div className="mt-8 grid gap-3 md:grid-cols-3">{page.cards.map(([title, body], index) => <article key={title} className="rounded-2xl bg-[#f8f5ee] p-5"><span className="text-sm font-black text-amber-600">0{index + 1}</span><h2 className="mt-3 font-black text-gray-900">{title}</h2><p className="mt-2 text-sm leading-6 text-gray-600">{body}</p></article>)}</div>
        {external ? <a href={page.href} target="_blank" rel="noreferrer" className="mt-8 inline-flex rounded-full bg-green-800 px-6 py-3 font-bold text-white">{page.action}</a> : <Link to={page.href} className="mt-8 inline-flex rounded-full bg-green-800 px-6 py-3 font-bold text-white">{page.action}</Link>}
      </section>
    </PageFrame>
  );
}

export default function LegacyStorePage({ type }) {
  if (['deals', 'brand', 'order'].includes(type)) return <ProductLanding type={type} />;
  if (type === 'loyalty') return <LoyaltyPage />;
  return <StaticLanding type={type} />;
}
