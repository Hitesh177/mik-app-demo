import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  Mail,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  RotateCcw,
  Store,
  Truck,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import SeoHead from '../components/SeoHead';

const deliveryOptions = [
  {
    icon: MapPin,
    title: 'Local free delivery',
    body: 'Free delivery within 3 km of participating MIK stores in Taipei, Taoyuan, Zhubei, and Taichung for orders of NT$1,000 or more and under 5 kg.',
  },
  {
    icon: Store,
    title: 'Store pickup',
    body: 'Collect your order from a Mayur Indian Kitchen location. Cash and card payments are available; the source policy notes a 3% card surcharge.',
  },
  {
    icon: Truck,
    title: 'Taiwan-wide delivery',
    body: 'Cash on delivery and convenience-store delivery are available across Taiwan. Courier charges and timing depend on destination, weight, stock, and service.',
  },
  {
    icon: Clock3,
    title: 'Express and fresh food',
    body: 'Express orders usually target 24–48 hours. Fresh-food shoppers can choose the 45-minute delivery option where available in Taipei, Hsinchu, or Taichung.',
  },
];

const shippingRules = [
  'Normal orders are processed and shipped within 3–5 working days. Friday, Saturday, and major-holiday orders may take longer.',
  'MIK may use its own delivery team, Lalamove, Uber Eats, or Foodpanda. Any extra delivery or transfer charge is confirmed with you first.',
  'Do not transfer payment until your order is confirmed by phone or official LINE. An automatic email is not an order confirmation.',
  'Convenience-store delivery is recommended when you cannot reliably receive a parcel at home, work, or university accommodation.',
  'Delivery is available within Taiwan only. Carrier delays, severe weather, incorrect addresses, or late order changes can affect timing.',
  'Legacy VIP discounts from 2020–2021 no longer apply. Current benefits depend on the active membership programme.',
];

const returnRules = [
  'Contact MIK before using the item. Exchanges are considered only when goods remain fully resalable.',
  'Items must be unused and returned with original packaging, tags, labels, invoices, and proof of purchase.',
  'Pack returns securely. Damage caused by inadequate return packaging may affect eligibility.',
  'Report damaged or defective goods within 24 hours of delivery.',
  'The return and exchange window is 7 days. Requests made after 7 days are not eligible.',
  'After inspection, MIK will notify you whether the request is approved or rejected. Approved exchanges are processed within 3–5 working days after receipt.',
  'Customers pay return shipping, and shipping charges are non-refundable. Replacements are limited to defective or damaged items.',
];

export default function ShippingReturnsPage() {
  const canonical = typeof window !== 'undefined'
    ? `${window.location.origin}/shipping-returns`
    : 'https://www.indianstoretaiwan.com/shipping-returns';

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-900">
      <SeoHead
        title="Shipping & Returns in Taiwan | MIK Store"
        description="MIK Store delivery, pickup, shipping, return, exchange, and damaged-item policies for Indian grocery orders across Taiwan."
        canonical={canonical}
        keywords="MIK Store shipping Taiwan, Indian grocery delivery Taiwan, MIK Store returns, cash on delivery Taiwan"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'MIK Store Shipping & Returns',
          url: canonical,
          description: 'Shipping, delivery, pickup, returns, and exchange policies for MIK Store Taiwan.',
        }}
      />

      <Header />

      <main className="pb-28">
        <section className="relative overflow-hidden bg-[#12382a] text-white">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,#e8b755_0,transparent_24%),radial-gradient(circle_at_85%_10%,#78a879_0,transparent_25%)]" />
          <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-20">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-100 hover:text-white">
              <ArrowLeft size={17} /> Back to store
            </Link>
            <div className="mt-9 max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#e8b755]">MIK Store Taiwan</p>
              <h1 className="mt-4 text-4xl font-black leading-tight sm:text-6xl">Shipping &amp; Returns</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-emerald-50/85 sm:text-lg">
                Clear delivery choices across Taiwan, straightforward order confirmation, and a fair process when something arrives damaged or incorrect.
              </p>
            </div>
            <div className="mt-9 flex flex-wrap gap-3 text-sm font-semibold">
              <span className="rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15">Taiwan-wide delivery</span>
              <span className="rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15">Cash on delivery</span>
              <span className="rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15">7-day return window</span>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <section aria-labelledby="delivery-heading">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-700">Choose what works for you</p>
              <h2 id="delivery-heading" className="mt-2 text-3xl font-black sm:text-4xl">Delivery and pickup</h2>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {deliveryOptions.map(({ icon: Icon, title, body }) => (
                <article key={title} className="rounded-[1.75rem] border border-black/5 bg-white p-6 shadow-[0_16px_45px_rgba(27,46,37,0.07)]">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                      <Icon size={21} />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold">{title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-12 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-[2rem] bg-white p-6 shadow-[0_16px_45px_rgba(27,46,37,0.07)] sm:p-8">
              <div className="flex items-center gap-3">
                <PackageCheck className="text-emerald-700" />
                <h2 className="text-2xl font-black">Before your order ships</h2>
              </div>
              <div className="mt-6 space-y-4">
                {shippingRules.map(rule => (
                  <div key={rule} className="flex gap-3">
                    <CheckCircle2 size={18} className="mt-1 shrink-0 text-emerald-700" />
                    <p className="text-sm leading-6 text-slate-600">{rule}</p>
                  </div>
                ))}
              </div>
            </article>

            <aside className="rounded-[2rem] bg-[#e8b755] p-7 text-[#203027] sm:p-8">
              <CreditCard size={28} />
              <h2 className="mt-5 text-2xl font-black">Payments</h2>
              <p className="mt-3 text-sm leading-6">
                Online card and PayPal payments are supported. For LINE Pay, Apple Pay, Samsung Pay, or another online method, contact the MIK team before paying.
              </p>
              <div className="mt-6 rounded-2xl bg-white/55 p-4">
                <div className="flex gap-3">
                  <AlertTriangle size={19} className="mt-0.5 shrink-0" />
                  <p className="text-sm font-semibold leading-6">Wait for confirmation by phone or official LINE before making a bank transfer.</p>
                </div>
              </div>
            </aside>
          </section>

          <section className="mt-12 rounded-[2rem] bg-[#1c293c] p-6 text-white sm:p-9" aria-labelledby="returns-heading">
            <div className="flex items-center gap-3">
              <RotateCcw className="text-[#e8b755]" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e8b755]">Returns and exchanges</p>
                <h2 id="returns-heading" className="mt-1 text-3xl font-black">Tell us quickly. Keep everything together.</h2>
              </div>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {returnRules.map((rule, index) => (
                <div key={rule} className="rounded-2xl bg-white/7 p-4 ring-1 ring-white/10">
                  <span className="text-xs font-black text-[#e8b755]">{String(index + 1).padStart(2, '0')}</span>
                  <p className="mt-2 text-sm leading-6 text-slate-200">{rule}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10 rounded-[2rem] border border-emerald-900/10 bg-[#e5eee4] p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-800">Need help with an order?</p>
            <h2 className="mt-2 text-2xl font-black">Contact MIK before sending anything back</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <a href="https://line.me/ti/p/@688vynca" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 text-sm font-bold hover:-translate-y-0.5 hover:shadow-md">
                <MessageCircle size={19} className="text-emerald-700" /> LINE @miktaiwan
              </a>
              <a href="tel:+886921004175" className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 text-sm font-bold hover:-translate-y-0.5 hover:shadow-md">
                <Phone size={19} className="text-emerald-700" /> +886 921 004 175
              </a>
              <a href="mailto:indianfoodintaipei@gmail.com" className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 text-sm font-bold hover:-translate-y-0.5 hover:shadow-md">
                <Mail size={19} className="text-emerald-700" /> Email support
              </a>
            </div>
          </section>
        </div>
      </main>

      <Footer />
      <BottomNav active="home" />
    </div>
  );
}
