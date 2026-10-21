import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, ShoppingBasket, Sparkles } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import SeoHead from '../components/SeoHead';

export default function AboutPage() {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="min-h-screen bg-[#f7f1e7] text-[#20251c]">
      <SeoHead
        title="About MIK Store | Indian Grocery Store in Taiwan"
        description="Learn about MIK Store, the Taiwan-based Indian grocery destination connected to Mayur Indian Kitchen. Shop imported Indian groceries, spices, pantry staples, and more."
        canonical={siteUrl ? `${siteUrl}/about-us` : undefined}
        ogType="website"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About MIK Store',
          description: 'MIK Store is an Indian grocery destination in Taiwan, connected to the Mayur Indian Kitchen family.',
          mainEntity: {
            '@type': 'Organization',
            name: 'MIK Store',
            areaServed: 'Taiwan',
          },
        }}
      />

      <Header />

      <main className="pb-24">
        <section className="mx-auto max-w-7xl px-4 pt-6 sm:pt-10">
          <div className="relative isolate overflow-hidden rounded-[2rem] bg-[#263b2a] shadow-[0_24px_60px_rgba(55,48,28,0.2)]">
            <img
              src="/about/mik-store-hero.jpg"
              alt="Indian grocery selection from MIK Store Taiwan"
              className="absolute inset-0 h-full w-full object-cover opacity-70"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#172618]/95 via-[#20351e]/70 to-[#20351e]/15" />
            <div className="relative max-w-2xl px-7 py-16 text-white sm:px-12 sm:py-24">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.26em] text-[#f0c575]">
                <Sparkles size={15} aria-hidden="true" /> Taiwan&apos;s Indian pantry
              </p>
              <h1 className="mt-5 font-serif text-5xl leading-[0.95] sm:text-7xl">Good food begins with a good pantry.</h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-stone-100 sm:text-lg">
                MIK Store brings the ingredients, familiar brands, and everyday discoveries of Indian cooking closer to homes across Taiwan.
              </p>
              <Link
                to="/"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#f2c46d] px-5 py-3 text-sm font-bold text-[#20331e] transition hover:bg-white"
              >
                Shop the store <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:py-24">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#a3582c]">Our point of view</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight text-[#223a26] sm:text-5xl">The everyday ingredients that make home taste like home.</h2>
          </div>
          <div className="border-l-2 border-[#d7a14a] pl-6 text-lg leading-8 text-[#4c5547]">
            From aromatic whole and ground spices to rice, pulses, ready-to-eat favourites, snacks and specialty ingredients, we curate a practical Indian grocery shop for Taiwan. The focus is simple: products people genuinely want to cook, share, and come back for.
          </div>
        </section>

        <section className="bg-[#ddd3c0] py-7 sm:py-10">
          <div className="mx-auto grid max-w-6xl gap-5 px-6 sm:grid-cols-3 sm:px-10">
            {[
              ['Indian groceries for Taiwan', 'A focused online shop for pantry staples, spices, snacks, and cooking essentials.'],
              ['Built around real kitchens', 'Our assortment is shaped by the ingredients people use to make Indian food at home.'],
              ['A connected MIK family', 'MIK Store shares a food heritage with Mayur Indian Kitchen in Taipei.'],
            ].map(([title, body], index) => (
              <article key={title} className="border-t border-[#9d8560] pt-4">
                <span className="font-serif text-2xl text-[#a3582c]">0{index + 1}</span>
                <h3 className="mt-2 text-lg font-bold text-[#293527]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#586052]">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-6 py-16 sm:px-10 lg:grid-cols-2 lg:items-center lg:py-24">
          <div className="relative">
            <div className="absolute -left-3 -top-3 h-full w-full rounded-[1.8rem] border border-[#c99a54]" />
            <img
              src="/about/mayur-kitchen.jpg"
              alt="Mayur Indian Kitchen in Taipei, part of the MIK family"
              className="relative aspect-[4/3] w-full rounded-[1.8rem] object-cover shadow-xl"
              loading="lazy"
            />
          </div>
          <div className="lg:pl-8">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#a3582c]">From restaurant to retail</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight text-[#223a26] sm:text-5xl">A love of regional Indian food led us here.</h2>
            <p className="mt-5 text-base leading-7 text-[#4c5547]">
              MIK Store is connected to the Mayur Indian Kitchen family in Taipei, known for bringing a wide range of Indian cooking traditions to the city. That same respect for flavour guides the store: make hard-to-find ingredients easier to discover, buy, and enjoy at home.
            </p>
            <a
              href="https://www.indianfoodtaiwan.com/about-us-mik-taipei"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#215a34] underline decoration-[#d7a14a] decoration-2 underline-offset-4 hover:text-[#a3582c]"
            >
              Discover Mayur Indian Kitchen <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-10 sm:px-10">
          <div className="grid gap-6 rounded-[2rem] bg-[#243b2b] px-7 py-10 text-white sm:px-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#efc56d]"><MapPin size={15} aria-hidden="true" /> Serving Taiwan</p>
              <h2 className="mt-3 font-serif text-3xl sm:text-4xl">Your Indian grocery shop, wherever you are.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-200">Explore the store for ingredients and pantry favourites selected for Indian cooking in Taiwan.</p>
            </div>
            <Link to="/categories" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#efc56d] px-5 py-3 text-sm font-bold text-[#213323] hover:bg-white">
              <ShoppingBasket size={17} aria-hidden="true" /> Browse categories
            </Link>
          </div>
        </section>
      </main>

      <Footer />
      <BottomNav active="home" />
    </div>
  );
}
