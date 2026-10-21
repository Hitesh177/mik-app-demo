import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  Truck,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import SeoHead from '../components/SeoHead';

const SUPPORT_PHONE = '+886 921 004 175';
const SUPPORT_PHONE_LINK = 'tel:+886921004175';
const WHATSAPP_LINK = 'https://wa.me/886921004175';
const LINE_LINK = 'https://line.me/ti/p/@688vynca';
const SUPPORT_EMAIL = 'indianfoodintaipei@gmail.com';

const FAQS = [
  {
    category: 'Support',
    question: 'What is the fastest way to contact MIK Store?',
    answer: 'Message us on LINE at @miktaiwan for the fastest response. You can also call or use WhatsApp at +886 921 004 175, or email indianfoodintaipei@gmail.com.',
  },
  {
    category: 'Support',
    question: 'What are your customer support hours?',
    answer: 'Customer support is available daily from 11:00 AM to 6:00 PM Taiwan time. You can leave a LINE message after hours, and our team will reply as soon as possible. For an urgent order issue, please call us.',
  },
  {
    category: 'Orders',
    question: 'What should I send if there is a problem with my order?',
    answer: 'Contact us immediately and include your order number, a short explanation, and clear photos of any damaged, missing, or incorrect item. LINE is the fastest channel for sharing these details.',
  },
  {
    category: 'Delivery',
    question: 'How long does delivery take?',
    answer: 'Local delivery near a branch can take about 30–45 minutes within 3 km. Deliveries 5–10 km away may take around 90 minutes or longer. Nationwide convenience-store or courier delivery normally takes 24–72 hours, depending on the destination, weather, holidays, and remote-area access.',
  },
  {
    category: 'Delivery',
    question: 'Do you offer same-day delivery?',
    answer: 'Yes. Same-day cash-on-delivery service is available in supported areas of Taipei, Taoyuan, Hsinchu/Zhubei, and Taichung through Lalamove or private delivery partners. Place the order before 2:00 PM whenever possible.',
  },
  {
    category: 'Delivery',
    question: 'Do you deliver everywhere in Taiwan?',
    answer: 'Yes. Nationwide orders can be delivered through 7-Eleven, FamilyMart, or a courier. Typical delivery is one business day to Taoyuan and Taichung, one to two days to Tainan and Kaohsiung, and two to three days to Hualien and Yilan. Remote areas may take longer.',
  },
  {
    category: 'Delivery',
    question: 'How can I avoid a delivery delay?',
    answer: 'Enter a complete and accurate address, preferably in Chinese, add the correct map location or pin when requested, and provide a phone number that will remain reachable. Delivery drivers often communicate in Mandarin, so local assistance can help when needed.',
  },
  {
    category: 'Orders',
    question: 'How can I track my order?',
    answer: 'After ordering, check your confirmation email and keep your phone available for the MIK team. For the latest delivery status, send your order number through LINE or WhatsApp, or call customer support.',
  },
  {
    category: 'Orders',
    question: 'Is there a minimum order amount?',
    answer: 'No. MIK Store does not require a minimum order. Delivery fees and free-delivery eligibility depend on the delivery area, order total, parcel weight, and courier shown for your order.',
  },
  {
    category: 'Delivery',
    question: 'When is delivery free?',
    answer: 'Free delivery is generally available above NT$1,000 within 5 km of participating branches and above NT$3,000 across Taiwan for parcels up to 10 kg. Heavier orders may add approximately NT$60 per extra 5 kg. The final current rate is confirmed for your order before dispatch.',
  },
  {
    category: 'Orders',
    question: 'Can I schedule an order for a future date?',
    answer: 'Yes. Add your requested date and time when ordering or confirm it with the team through LINE. For same-day service, order before 2:00 PM. Future orders are especially useful for events, family gatherings, and planned cooking.',
  },
  {
    category: 'Orders',
    question: 'How early should I place a bulk or festival order?',
    answer: 'Please place large, bulk, festival, or special-occasion orders at least four days in advance. Early notice gives the team time to confirm stock, prepare the order, and arrange suitable delivery.',
  },
];

function ContactCard({ icon: Icon, eyebrow, title, detail, href, primary = false }) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      className={`group rounded-3xl border p-5 transition-all hover:-translate-y-1 hover:shadow-xl ${
        primary
          ? 'border-[#b8e7c8] bg-[#19a957] text-white shadow-lg shadow-green-900/10'
          : 'border-[#e6dfd2] bg-white text-[#17241d] hover:border-[#b8cdbf]'
      }`}
    >
      <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-2xl ${primary ? 'bg-white/18' : 'bg-[#eef7ef] text-[#17743c]'}`}>
        <Icon size={22} />
      </div>
      <p className={`text-[11px] font-bold uppercase tracking-[0.2em] ${primary ? 'text-white/75' : 'text-[#78847c]'}`}>{eyebrow}</p>
      <h2 className="mt-1 text-xl font-black tracking-tight">{title}</h2>
      <p className={`mt-2 text-sm leading-6 ${primary ? 'text-white/85' : 'text-[#667169]'}`}>{detail}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold">
        Contact now <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
      </span>
    </a>
  );
}

function FaqItem({ faq, isOpen, onToggle }) {
  return (
    <article className="border-b border-[#e8e1d6] last:border-0">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-5 py-5 text-left"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span>
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#278150]">{faq.category}</span>
          <span className="text-base font-bold leading-6 text-[#172019] sm:text-lg">{faq.question}</span>
        </span>
        <span className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edf4ec] text-[#1a7643] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown size={17} />
        </span>
      </button>
      {isOpen && <p className="max-w-3xl pb-5 pr-12 text-sm leading-7 text-[#626d65] sm:text-base">{faq.answer}</p>}
    </article>
  );
}

export default function CustomerSupportPage() {
  const [openFaq, setOpenFaq] = useState(0);
  const canonical = typeof window !== 'undefined' ? `${window.location.origin}/customer-support` : undefined;
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  return (
    <div className="min-h-screen bg-[#f7f3eb] text-[#172019]">
      <SeoHead
        title="Customer Support & Delivery FAQ | MIK Store Taiwan"
        description="Contact MIK Store Taiwan for Indian grocery order help, delivery tracking, nationwide shipping, same-day delivery, bulk orders, and customer support FAQs."
        canonical={canonical}
        keywords="MIK Store customer support, Indian grocery delivery Taiwan, MIK Taiwan LINE, order tracking Taiwan"
        jsonLd={faqJsonLd}
      />
      <Header />

      <main className="pb-24">
        <section className="relative overflow-hidden bg-[#183e2b] text-white">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border-[55px] border-white/5" />
          <div className="absolute bottom-0 left-1/3 h-40 w-40 translate-y-1/2 rounded-full bg-[#d79b47]/20 blur-2xl" />
          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-16">
            <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-white/70 transition-colors hover:text-white">
              <ArrowLeft size={18} /> Back to store
            </Link>
            <div className="grid gap-9 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#b7dc9b]">MIK customer care</p>
                <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl">Real help, from people who know your order.</h1>
                <p className="mt-6 max-w-2xl text-base leading-7 text-white/72 sm:text-lg">Questions about an item, delivery, or an existing order? Reach the MIK team directly and get practical help across Taiwan.</p>
              </div>
              <div className="rounded-3xl border border-white/12 bg-white/8 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <Clock3 size={21} className="text-[#b7dc9b]" />
                  <div>
                    <p className="text-sm font-bold">Daily, 11:00 AM–6:00 PM</p>
                    <p className="mt-0.5 text-xs text-white/60">Taiwan time · Leave a LINE message after hours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto -mt-1 max-w-6xl px-4 py-10 sm:py-14">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ContactCard icon={MessageCircle} eyebrow="Fastest response" title="Chat on LINE" detail="Message @miktaiwan for order and delivery help." href={LINE_LINK} primary />
            <ContactCard icon={MessageCircle} eyebrow="Messaging" title="WhatsApp" detail={SUPPORT_PHONE} href={WHATSAPP_LINK} />
            <ContactCard icon={Phone} eyebrow="Urgent help" title="Call the team" detail={SUPPORT_PHONE} href={SUPPORT_PHONE_LINK} />
            <ContactCard icon={Mail} eyebrow="Detailed requests" title="Send an email" detail={SUPPORT_EMAIL} href={`mailto:${SUPPORT_EMAIL}`} />
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-5 px-4 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="space-y-5">
            <article className="rounded-[2rem] bg-[#e5b75c] p-7 text-[#2f250e] sm:p-8">
              <PackageCheck size={30} />
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#6b5018]">Order issue?</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">Send the right details once.</h2>
              <p className="mt-4 text-sm leading-7 text-[#554217]">Include your order number, a short explanation, and clear photos of damaged, missing, or incorrect items. This helps the team resolve the issue faster.</p>
            </article>

            <article className="rounded-[2rem] border border-[#ddd5c8] bg-white p-7 sm:p-8">
              <div className="flex items-center gap-3">
                <Truck size={24} className="text-[#1b7b45]" />
                <h2 className="text-xl font-black">Delivery at a glance</h2>
              </div>
              <div className="mt-6 space-y-5 text-sm">
                <div><p className="font-bold">Nearby delivery</p><p className="mt-1 leading-6 text-[#6a746d]">About 30–45 minutes within 3 km of a participating branch.</p></div>
                <div><p className="font-bold">Nationwide delivery</p><p className="mt-1 leading-6 text-[#6a746d]">Usually 24–72 hours by convenience store or courier.</p></div>
                <div className="flex items-start gap-2 rounded-2xl bg-[#f3f6ef] p-4 text-[#4d5d50]"><MapPin size={18} className="mt-0.5 shrink-0 text-[#1b7b45]" /><p>Use a complete Chinese address, accurate map pin, and reachable phone number.</p></div>
              </div>
            </article>
          </div>

          <section className="rounded-[2rem] border border-[#ddd5c8] bg-white p-6 sm:p-9" aria-labelledby="faq-heading">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#24804c]">Everything customers ask</p>
            <h2 id="faq-heading" className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Frequently asked questions</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6a746d]">Clear answers about support, ordering, local delivery, and shipping across Taiwan.</p>
            <div className="mt-7">
              {FAQS.map((faq, index) => (
                <FaqItem
                  key={faq.question}
                  faq={faq}
                  isOpen={openFaq === index}
                  onToggle={() => setOpenFaq(openFaq === index ? -1 : index)}
                />
              ))}
            </div>
          </section>
        </section>
      </main>

      <Footer />
      <BottomNav active="account" />
    </div>
  );
}
