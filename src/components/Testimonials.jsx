import { Star, Quote } from 'lucide-react';

const REVIEWS = [
  {
    name: 'Priya Sharma',
    location: 'Taipei',
    avatar: '👩🏽',
    rating: 5,
    text: 'Finally found a store in Taiwan with real Indian spices! The quality is exactly like back home. MTR ready meals are a lifesaver on busy days.',
  },
  {
    name: '陳大明',
    location: 'Taichung',
    avatar: '👨🏻',
    rating: 5,
    text: '印度食品種類齊全，品質非常好！咖哩葉超新鮮，印度香料香氣十足。下次還會再買！',
  },
  {
    name: 'Arjun Patel',
    location: 'Kaohsiung',
    avatar: '👨🏾',
    rating: 5,
    text: 'Best Indian grocery store in all of Taiwan. Delivery was fast, packaging was great. Taj Mahal tea tastes exactly like home.',
  },
  {
    name: 'Ananya Krishnan',
    location: 'Hsinchu',
    avatar: '👩🏽‍🦱',
    rating: 4,
    text: 'Great selection of south Indian products. Curry leaves are always fresh. Highly recommend for anyone missing home food!',
  },
];

function Stars({ count }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={13} className={i <= count ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'} />
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="mt-10 max-w-6xl mx-auto px-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">What Our Customers Say</h2>
        <p className="text-sm text-gray-500 mt-1">Trusted by Indians & food lovers across Taiwan</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {REVIEWS.map((r, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm relative">
            <Quote size={18} className="text-green-200 absolute top-4 right-4" />
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{r.avatar}</span>
              <div>
                <p className="font-semibold text-sm text-gray-900">{r.name}</p>
                <p className="text-xs text-gray-400">{r.location}</p>
              </div>
            </div>
            <Stars count={r.rating} />
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">{r.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
