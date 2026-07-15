import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, ShieldCheck, Truck, RotateCcw, FileText, HelpCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import SeoHead from '../components/SeoHead';

const CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    description: 'How MIK Store handles your account, order, and delivery information.',
    icon: ShieldCheck,
    sections: [
      {
        heading: 'What we collect',
        body: 'We only collect the information needed to process orders, save delivery details, manage rewards, and support customer service.',
      },
      {
        heading: 'How we use it',
        body: 'Order and account data is used to fulfill purchases, sync rewards across devices, and improve service quality for customers in Taiwan.',
      },
      {
        heading: 'Your control',
        body: 'You can update your profile details from your account page and contact us if you need help with data access or changes.',
      },
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    description: 'The terms for using the MIK Store website and placing orders.',
    icon: FileText,
    sections: [
      {
        heading: 'Ordering',
        body: 'By placing an order, you agree that product availability, pricing, and delivery timing may change based on stock and service area.',
      },
      {
        heading: 'Payments',
        body: 'Payment methods shown at checkout must be used according to the instructions on the order screen or payment provider flow.',
      },
      {
        heading: 'Account usage',
        body: 'Please keep your account details accurate so your orders, rewards, and delivery updates stay synced correctly across devices.',
      },
    ],
  },
  shipping: {
    title: 'Shipping & Delivery',
    description: 'Delivery timing, service area, and order handling for MIK Store.',
    icon: Truck,
    sections: [
      {
        heading: 'Service area',
        body: 'MIK Store focuses on Indian grocery delivery for customers across Taiwan, including Taipei and nearby delivery zones where service is available.',
      },
      {
        heading: 'Order processing',
        body: 'Orders move through placed, confirmed, packed, shipped, and fulfilled states so customers can track progress from the account area.',
      },
      {
        heading: 'Delivery updates',
        body: 'We recommend keeping your phone number and address updated so delivery communication reaches you quickly if a courier needs help.',
      },
    ],
  },
  returns: {
    title: 'Returns Policy',
    description: 'How to request help if an item arrives damaged or incorrect.',
    icon: RotateCcw,
    sections: [
      {
        heading: 'If something is wrong',
        body: 'If your order arrives damaged or incorrect, contact us as soon as possible with your order number and a short description of the issue.',
      },
      {
        heading: 'Review process',
        body: 'We review return or refund requests on a case-by-case basis and may ask for photos or order details before taking action.',
      },
      {
        heading: 'Fast support',
        body: 'The fastest way to reach us is through the support options shown on the order confirmation page or through customer account contact details.',
      },
    ],
  },
  faq: {
    title: 'FAQ',
    description: 'Common questions about shopping, rewards, delivery, and support at MIK Store.',
    icon: HelpCircle,
    sections: [
      {
        heading: 'Can I see my orders later?',
        body: 'Yes. When you sign in with your customer account, your order history and rewards are synced across devices.',
      },
      {
        heading: 'Do you have loyalty rewards?',
        body: 'Yes. Customers earn points on orders and can redeem 100 points for a 10% discount when the reward is available.',
      },
      {
        heading: 'Can I contact support?',
        body: 'Yes. Use the WhatsApp and call options shown after checkout or the contact links in the footer for support.',
      },
    ],
  },
  contact: {
    title: 'Contact Us',
    description: 'Ways to reach MIK Store for order help and customer support.',
    icon: MessageCircle,
    sections: [
      {
        heading: 'WhatsApp',
        body: 'Tap the WhatsApp button on the site or in the order confirmation screen for the quickest help with orders and delivery.',
      },
      {
        heading: 'Phone',
        body: 'Call the support number shown in the footer if you prefer to speak directly with a team member.',
      },
      {
        heading: 'Email',
        body: 'You can also email hello@mik.store with your order number and issue summary for follow-up.',
      },
    ],
  },
};

const ROUTE_MAP = {
  privacy: '/privacy',
  terms: '/terms',
  shipping: '/shipping',
  returns: '/returns',
  faq: '/faq',
  contact: '/contact',
};

export default function InfoPage({ slug: propSlug }) {
  const params = useParams();
  const slug = propSlug || params.slug;
  const content = CONTENT[slug];

  if (!content) return <Navigate to="/" replace />;

  const Icon = content.icon;
  const pageTitle = `${content.title} | MIK Store`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SeoHead
        title={pageTitle}
        description={content.description}
        canonical={typeof window !== 'undefined' ? `${window.location.origin}${ROUTE_MAP[slug]}` : undefined}
        ogType="website"
      />

      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 pb-28">
        <div className="flex items-center gap-3 mb-5">
          <Link to="/" className="p-1.5 rounded-lg hover:bg-gray-100" aria-label="Back to home">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Information</p>
            <h1 className="text-2xl font-bold text-gray-900">{content.title}</h1>
            <p className="text-sm text-gray-500">{content.description}</p>
          </div>
        </div>

        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center">
              <Icon size={24} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">MIK Store support pages</p>
              <p className="text-sm text-gray-500">Clear, public information for shoppers and search engines.</p>
            </div>
          </div>

          <div className="grid gap-4">
            {content.sections.map(section => (
              <article key={section.heading} className="rounded-2xl bg-gray-50 p-4">
                <h2 className="text-sm font-bold text-gray-900">{section.heading}</h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">{section.body}</p>
              </article>
            ))}
          </div>

          <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-800">
            If you still need help, use the WhatsApp button on the site or go back to the footer contact links.
          </div>
        </section>
      </main>

      <Footer />
      <BottomNav active="home" />
    </div>
  );
}
