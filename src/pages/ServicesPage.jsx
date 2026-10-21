import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Clock3, MessageCircle, Sparkles } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import SeoHead from '../components/SeoHead';
import { SERVICES, SERVICE_BY_SLUG } from '../data/services';
import SmartImage from '../components/SmartImage';

const lineUrl = 'https://line.me/ti/p/@688vynca';

function ServiceCard({ service }) {
  return (
    <Link
      to={`/services/${service.slug}`}
      className="group overflow-hidden rounded-[1.7rem] border border-black/5 bg-white shadow-[0_16px_45px_rgba(27,46,37,0.08)] transition hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(27,46,37,0.14)]"
    >
      <SmartImage src={service.image} alt={service.name} className="aspect-[4/3] w-full object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
      <div className="p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a3582c]">{service.eyebrow}</p>
        <h2 className="mt-2 font-serif text-2xl text-[#223a26]">{service.name}</h2>
        <div className="mt-4 flex items-center justify-between text-sm font-semibold text-[#596255]">
          <span>{service.price} · {service.duration}</span>
          <ArrowRight size={18} className="transition group-hover:translate-x-1" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}

function ServicesIndex() {
  const canonical = typeof window !== 'undefined' ? `${window.location.origin}/services` : undefined;
  return (
    <div className="min-h-screen bg-[#f7f1e7] text-[#20251c]">
      <SeoHead title="Services | MIK Store Taiwan" description="Explore consultation, beauty, and personal-care services from MIK Store Taiwan." canonical={canonical} />
      <Header />
      <main className="pb-24">
        <section className="relative overflow-hidden bg-[#213a29] text-white">
          <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_15%_20%,#efc56d_0,transparent_28%),radial-gradient(circle_at_85%_10%,#719b78_0,transparent_28%)]" />
          <div className="relative mx-auto max-w-6xl px-5 py-16 sm:py-24">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#efc56d]"><Sparkles size={15} /> MIK Store services</p>
            <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[0.98] sm:text-7xl">A little time, thoughtfully set aside for you.</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-stone-200 sm:text-lg">Browse the consultation, workshop, and personal-care services carried over from the original MIK Store website.</p>
          </div>
        </section>
        <section className="mx-auto grid max-w-6xl gap-6 px-5 py-12 sm:grid-cols-2 lg:grid-cols-3 sm:py-16">
          {SERVICES.map(service => <ServiceCard key={service.slug} service={service} />)}
        </section>
      </main>
      <Footer />
      <BottomNav active="home" />
    </div>
  );
}

function ServiceDetail({ service }) {
  const index = SERVICES.findIndex(item => item.slug === service.slug);
  const previous = SERVICES[(index - 1 + SERVICES.length) % SERVICES.length];
  const next = SERVICES[(index + 1) % SERVICES.length];
  const canonical = typeof window !== 'undefined' ? `${window.location.origin}/services/${service.slug}` : undefined;

  return (
    <div className="min-h-screen bg-[#f7f1e7] text-[#20251c]">
      <SeoHead
        title={`${service.name} | MIK Store Taiwan`}
        description={`${service.name} at MIK Store Taiwan. ${service.price}, ${service.duration}. ${service.summary}`}
        canonical={canonical}
        jsonLd={{ '@context': 'https://schema.org', '@type': 'Service', name: service.name, description: service.summary, provider: { '@type': 'Organization', name: 'MIK Store' } }}
      />
      <Header />
      <main className="pb-24">
        <section className="mx-auto max-w-7xl px-4 py-6 sm:py-10">
          <Link to="/services" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#31593a] hover:text-[#a3582c]"><ArrowLeft size={17} /> All services</Link>
          <div className="grid overflow-hidden rounded-[2rem] bg-[#213a29] text-white shadow-[0_24px_60px_rgba(55,48,28,0.2)] lg:grid-cols-[1.02fr_0.98fr]">
            <SmartImage src={service.image} alt={service.name} className="h-full min-h-[320px] w-full object-cover sm:min-h-[440px]" sizes="(max-width: 1024px) 100vw, 52vw" eager />
            <div className="flex flex-col justify-center px-7 py-10 sm:px-12 sm:py-16">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#efc56d]">{service.eyebrow}</p>
              <h1 className="mt-4 font-serif text-5xl leading-none sm:text-6xl">{service.name}</h1>
              <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold">
                <span className="rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15">{service.price}</span>
                <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15"><Clock3 size={16} /> {service.duration}</span>
              </div>
              <p className="mt-7 text-base leading-7 text-stone-200">{service.summary}</p>
              <a href={lineUrl} target="_blank" rel="noreferrer" className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-[#efc56d] px-6 py-3 text-sm font-black text-[#213323] transition hover:bg-white"><MessageCircle size={18} /> Ask about booking</a>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:px-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:py-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#a3582c]">What to expect</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight text-[#223a26] sm:text-5xl">Simple, personal, and easy to arrange.</h2>
          </div>
          <div className="rounded-[1.8rem] border border-[#d9cdb8] bg-white/70 p-6 sm:p-8">
            <div className="space-y-5">
              {service.highlights.map(item => <div key={item} className="flex items-center gap-3 text-base font-semibold text-[#435043]"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e3ecdf] text-[#31593a]"><Check size={17} /></span>{item}</div>)}
            </div>
            <p className="mt-7 border-t border-[#ded4c2] pt-6 text-sm leading-6 text-[#667063]">Please confirm availability, location, and final payment details with the MIK team before travelling. The original Wix listing contained placeholder descriptive copy; this page keeps its published service facts while presenting them clearly.</p>
          </div>
        </section>

        <nav className="mx-auto grid max-w-6xl gap-4 px-6 pb-10 sm:grid-cols-2 sm:px-10" aria-label="Other services">
          <Link to={`/services/${previous.slug}`} className="rounded-2xl border border-[#d9cdb8] bg-white/60 p-5 transition hover:bg-white"><span className="text-xs font-bold uppercase tracking-[0.18em] text-[#a3582c]">Previous</span><strong className="mt-2 block font-serif text-xl text-[#223a26]">{previous.name}</strong></Link>
          <Link to={`/services/${next.slug}`} className="rounded-2xl border border-[#d9cdb8] bg-white/60 p-5 text-right transition hover:bg-white"><span className="text-xs font-bold uppercase tracking-[0.18em] text-[#a3582c]">Next</span><strong className="mt-2 block font-serif text-xl text-[#223a26]">{next.name}</strong></Link>
        </nav>
      </main>
      <Footer />
      <BottomNav active="home" />
    </div>
  );
}

export default function ServicesPage() {
  const { legacyServiceSlug } = useParams();
  if (!legacyServiceSlug) return <ServicesIndex />;
  const service = SERVICE_BY_SLUG.get(legacyServiceSlug);
  return service ? <ServiceDetail service={service} /> : <Navigate to="/services" replace />;
}
