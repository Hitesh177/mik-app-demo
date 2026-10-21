import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  FileText,
  Mail,
  Scale,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import SeoHead from '../components/SeoHead';

const sections = [
  {
    title: 'Online store terms',
    body: [
      'You must be the age of majority where you live, or have consent for a minor dependent to use this website. Products and services may not be used for an illegal or unauthorised purpose.',
      'Do not transmit viruses, worms, destructive code, or otherwise violate applicable law. A breach of these terms may result in immediate termination of access to the service.',
    ],
  },
  {
    title: 'General conditions',
    body: [
      'MIK Store may refuse service to anyone for any lawful reason. Except for credit-card information, content may be transferred across networks and adapted to technical requirements. Card information is encrypted during network transfer.',
      'You may not reproduce, copy, sell, resell, or exploit any part of the service or access to it without written permission. Section headings are provided only for convenience.',
    ],
  },
  {
    title: 'Accuracy and timeliness of information',
    body: [
      'Website material is provided for general information. MIK Store does not promise that every item of information is always complete, current, or error-free, and reliance on it is at your own risk.',
      'Historical information is provided for reference. Site content may be changed at any time, and customers are responsible for monitoring relevant updates.',
    ],
  },
  {
    title: 'Service and price changes',
    body: [
      'Product prices may change without notice. MIK Store may modify, suspend, or discontinue all or part of the service without prior notice and is not liable for such changes to the extent allowed by law.',
    ],
  },
  {
    title: 'Products and services',
    body: [
      'Some products or services may be available only online, in limited quantities, and subject to the published Shipping & Returns policy. Product colours and images are displayed as accurately as practical, but screens and representative photography may differ from the physical item.',
      'MIK Store may limit sales by person, region, jurisdiction, order, or quantity; change descriptions and pricing; or discontinue products. Availability and quality cannot be guaranteed beyond rights that cannot legally be excluded.',
    ],
  },
  {
    title: 'Billing and account information',
    body: [
      'MIK Store may refuse, limit, or cancel an order, including orders associated with the same account, card, billing address, or shipping address. If an order changes or is cancelled, MIK Store may contact you using the details supplied at checkout.',
      'You must provide accurate, current, and complete purchase and account information and keep contact and payment details up to date.',
    ],
  },
  {
    title: 'Optional tools',
    body: [
      'Third-party tools may be offered without MIK Store monitoring or control. They are provided as available and without endorsement. Use is at your own risk and is also governed by the relevant provider’s terms.',
      'Future tools, resources, and service features will also be covered by these terms.',
    ],
  },
  {
    title: 'Third-party links',
    body: [
      'Links may lead to websites or services not affiliated with MIK Store. MIK Store is not responsible for evaluating their content, accuracy, products, policies, or practices.',
      'Review third-party policies before completing a transaction. Questions about third-party products or services should be directed to that provider.',
    ],
  },
  {
    title: 'Comments and submissions',
    body: [
      'Ideas, feedback, contest entries, and other submissions sent to MIK Store may be edited, copied, published, distributed, translated, and otherwise used without restriction, unless law or a separate written agreement requires otherwise.',
      'Submissions must not violate another person’s rights, contain unlawful or abusive material, include malware, or misrepresent their origin. You are responsible for what you submit and its accuracy. MIK Store may monitor or remove objectionable content but is not required to do so.',
    ],
  },
  {
    title: 'Personal information',
    body: ['Personal information submitted through the store is handled under the MIK Store Privacy Policy.'],
  },
  {
    title: 'Errors and omissions',
    body: [
      'The website may occasionally contain errors involving descriptions, prices, promotions, offers, shipping charges, transit times, or availability. MIK Store may correct errors, update information, or cancel affected orders, including after an order is submitted.',
      'There is no general obligation to update information except where required by law, and a displayed refresh date does not mean every item has been updated.',
    ],
  },
  {
    title: 'Prohibited uses',
    body: [
      'You may not use the site for unlawful acts; infringement; harassment, abuse, discrimination, or defamation; false or misleading submissions; malware distribution; collecting others’ personal information; spam, phishing, scraping, crawling, or circumvention of security features; or obscene or immoral purposes.',
      'MIK Store may terminate access for prohibited use.',
    ],
  },
  {
    title: 'Warranties and limitation of liability',
    body: [
      'MIK Store does not guarantee uninterrupted, timely, secure, or error-free service, or that service results will always be accurate or reliable. The service may be suspended or cancelled where permitted by law.',
      'Except for protections that cannot legally be excluded, the service and products are supplied as available and without implied warranties. MIK Store and its personnel, affiliates, suppliers, and service providers are not liable for indirect, incidental, punitive, special, or consequential loss arising from use of the service. Where exclusion is not permitted, liability is limited to the maximum extent allowed by law.',
    ],
  },
  {
    title: 'Indemnification',
    body: [
      'To the extent permitted by law, you agree to indemnify MIK Store, its related entities, personnel, suppliers, and service providers against third-party claims arising from your breach of these terms, incorporated policies, applicable law, or another party’s rights.',
    ],
  },
  {
    title: 'Severability',
    body: ['If a provision is found unlawful, void, or unenforceable, it will be enforced to the maximum lawful extent and severed where necessary without affecting the remaining provisions.'],
  },
  {
    title: 'Termination',
    body: [
      'Obligations and liabilities arising before termination survive. You may stop using the service at any time. MIK Store may terminate or restrict access if it reasonably believes these terms have been breached, while amounts already due remain payable.',
    ],
  },
  {
    title: 'Entire agreement',
    body: [
      'These terms and the policies or operating rules posted for the service form the entire agreement governing use of the service and replace earlier related communications and proposals. A failure to enforce a provision is not a waiver of it.',
      'Ambiguities will not automatically be interpreted against the party that drafted the terms.',
    ],
  },
  {
    title: 'Governing law',
    body: ['These terms and separate service agreements are governed by and construed under the laws of Taiwan (Republic of China).'],
  },
  {
    title: 'Changes to these terms',
    body: [
      'The current version is available on this page. MIK Store may update or replace any portion by posting changes here. You should review the page periodically; continued use after an update constitutes acceptance of the revised terms.',
    ],
  },
  {
    title: 'Contact information',
    body: ['Questions about these Terms of Service can be sent through MIK Store customer support.'],
  },
];

export default function TermsConditionsPage() {
  const canonical = typeof window !== 'undefined'
    ? `${window.location.origin}/terms-conditions`
    : 'https://www.indianstoretaiwan.com/terms-conditions';

  return (
    <div className="min-h-screen bg-[#f3efe5] text-[#18201d]">
      <SeoHead
        title="Terms & Conditions | MIK Store Taiwan"
        description="Terms governing purchases of groceries, sweets, perishable and non-perishable food, accounts, payments, and use of MIK Store Taiwan."
        canonical={canonical}
        keywords="MIK Store terms and conditions, Indian grocery Taiwan terms, MIK Store Taiwan online shopping terms"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Terms & Conditions',
          url: canonical,
          description: 'Terms of Service for MIK Store Taiwan.',
        }}
      />

      <Header />

      <main className="pb-28">
        <section className="relative overflow-hidden border-b border-[#c7bca6] bg-[#172f28] text-white">
          <div className="absolute -right-24 -top-28 h-96 w-96 rounded-full border-[70px] border-[#d9a841]/10" />
          <div className="absolute bottom-0 left-0 h-32 w-full opacity-20 [background-image:linear-gradient(135deg,transparent_25%,#d9a841_25%,#d9a841_26%,transparent_26%,transparent_75%,#d9a841_75%,#d9a841_76%,transparent_76%)] [background-size:38px_38px]" />
          <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-20">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-100 hover:text-white">
              <ArrowLeft size={17} /> Back to store
            </Link>
            <div className="mt-10 grid items-end gap-8 lg:grid-cols-[1fr_auto]">
              <div className="max-w-3xl">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[#e0b754]">Store policy</p>
                <h1 className="mt-4 font-serif text-5xl font-black leading-none sm:text-7xl">Terms &amp;<br />Conditions</h1>
                <p className="mt-6 max-w-2xl text-base leading-7 text-emerald-50/80">
                  The rules that govern access to MIK Store Taiwan, customer accounts, online purchases, products, payments, and use of our services.
                </p>
              </div>
              <div className="hidden h-32 w-32 items-center justify-center rounded-full border border-white/20 bg-white/5 lg:flex">
                <Scale size={48} className="text-[#e0b754]" strokeWidth={1.4} />
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <section className="grid gap-4 sm:grid-cols-3">
            {[
              [ShoppingBag, 'Commerce', 'Orders, products, prices and billing'],
              [ShieldCheck, 'Responsible use', 'Accounts, content, security and privacy'],
              [Scale, 'Taiwan law', 'These terms are governed by Taiwan (ROC) law'],
            ].map(([Icon, title, copy]) => (
              <article key={title} className="rounded-3xl border border-black/5 bg-white p-5 shadow-[0_15px_35px_rgba(36,45,40,0.06)]">
                <Icon size={22} className="text-emerald-800" />
                <h2 className="mt-4 font-black">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">{copy}</p>
              </article>
            ))}
          </section>

          <section className="mt-8 rounded-[2rem] border border-[#cfc5b1] bg-[#fffaf0] p-6 sm:p-8">
            <div className="flex gap-4">
              <FileText className="mt-1 shrink-0 text-emerald-800" />
              <div>
                <h2 className="text-xl font-black">Overview</h2>
                <div className="mt-3 space-y-3 text-sm leading-7 text-slate-700">
                  <p>This website is operated by Mayur. In these terms, “we”, “us”, and “our” refer to Lakshmi International Co., Ltd., the company that owns Mayur’s MIK.</p>
                  <p>By visiting the website or purchasing from MIK Store, you use the service and agree to these Terms of Service and the policies linked from them. They apply to visitors, customers, merchants, vendors, and contributors.</p>
                  <p>Please read the terms before using the site. If you do not agree, do not access the service. New features and tools are also governed by these terms. Updates posted on this page apply when you continue using the service.</p>
                  <p>The commerce platform and connected services may be supplied through Wix and other approved providers.</p>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {sections.map((section, index) => (
              <article key={section.title} className="group rounded-[1.75rem] border border-black/5 bg-white p-6 shadow-[0_12px_32px_rgba(36,45,40,0.05)] transition-transform hover:-translate-y-0.5">
                <div className="flex items-start gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e0b754] text-xs font-black text-[#172f28]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h2 className="text-lg font-black">{section.title}</h2>
                    <div className="mt-3 space-y-3">
                      {section.body.map(paragraph => (
                        <p key={paragraph} className="text-sm leading-6 text-slate-600">{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <section className="mt-10 rounded-[2rem] bg-[#dce8df] p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-emerald-900">
                  <AlertCircle size={20} />
                  <p className="text-xs font-black uppercase tracking-[0.2em]">Questions about these terms?</p>
                </div>
                <h2 className="mt-3 text-2xl font-black">Talk to the MIK support team</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">For order-specific policies, also review the Shipping &amp; Returns page.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/shipping-returns" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black shadow-sm">
                  <Check size={17} /> Shipping &amp; Returns
                </Link>
                <a href="mailto:indianfoodintaipei@gmail.com" className="inline-flex items-center gap-2 rounded-full bg-[#172f28] px-5 py-3 text-sm font-black text-white">
                  <Mail size={17} /> Contact support
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
      <BottomNav active="home" />
    </div>
  );
}
