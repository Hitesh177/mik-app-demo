import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SLIDES = [
  {
    bg: 'from-green-700 to-green-900',
    emoji: '🌶️',
    tag: 'Freshly Imported',
    title: 'Authentic Indian\nSpices & Masalas',
    sub: 'Hand-picked from India\'s finest farms',
    cta: 'Shop Spices',
    href: '/category/spices',
    accent: 'bg-white/20',
  },
  {
    bg: 'from-orange-500 to-red-600',
    emoji: '🥘',
    tag: 'Ready in Minutes',
    title: 'Taste of Home\nReady-to-Eat Meals',
    sub: 'MTR, Haldirams & more — just heat and serve',
    cta: 'Shop Ready To Eat',
    href: '/category/ready-to-eat',
    accent: 'bg-white/20',
  },
  {
    bg: 'from-amber-600 to-yellow-500',
    emoji: '🍚',
    tag: 'Premium Quality',
    title: 'India Gate\nBasmati Rice',
    sub: 'Long-grain aromatic rice, direct from India',
    cta: 'Shop Rice',
    href: '/category/rice-oils',
    accent: 'bg-white/20',
  },
  {
    bg: 'from-teal-600 to-cyan-700',
    emoji: '🚚',
    tag: 'Limited Time',
    title: 'Free Delivery\non Orders NT$999+',
    sub: 'Taiwan-wide delivery to your door',
    cta: 'Shop Now',
    href: '/',
    accent: 'bg-white/20',
  },
];

function normalizeOffer(offer) {
  return {
    bg: offer.bg || `${offer.bg_from || 'from-green-700'} ${offer.bg_to || 'to-green-900'}`,
    emoji: offer.emoji || '✨',
    tag: offer.tag || '',
    title: offer.title || '',
    sub: offer.subtitle || offer.sub || '',
    cta: offer.cta_label || offer.cta || 'Shop Now',
    href: offer.href || '/',
    accent: offer.accent || 'bg-white/20',
    active: offer.active === undefined ? true : Boolean(offer.active),
  };
}

export default function BannerCarousel({ offers = [] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const sourceSlides = offers && offers.length > 0 ? offers : SLIDES;
  const filteredSlides = sourceSlides.map(item => normalizeOffer(item)).filter(slide => slide.active !== false && slide.title);
  const slides = filteredSlides.length > 0 ? filteredSlides : SLIDES.map(item => normalizeOffer(item));

  useEffect(() => {
    if (current >= slides.length) setCurrent(0);
  }, [current, slides.length]);

  const next = useCallback(() => {
    if (!slides.length) return;
    setCurrent(c => (c + 1) % slides.length);
  }, [slides.length]);
  const prev = () => {
    if (!slides.length) return;
    setCurrent(c => (c - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const t = setInterval(next, 4000);
    return () => clearInterval(t);
  }, [paused, next, slides.length]);

  const slide = slides[current] || normalizeOffer(SLIDES[0]);

  return (
    <div
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={`bg-gradient-to-r ${slide.bg} transition-all duration-700 hover:shadow-2xl`}>
        <div className="max-w-6xl mx-auto px-6 py-10 sm:py-14 flex items-center justify-between gap-4">
          {/* Text */}
          <div className="flex-1">
            <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full mb-3 ${slide.accent} text-white/90 uppercase tracking-widest`}>
              {slide.tag}
            </span>
            <h2 className="text-white font-black text-2xl sm:text-3xl leading-tight whitespace-pre-line">
              {slide.title}
            </h2>
            <p className="text-white/80 text-sm mt-2 max-w-xs">{slide.sub}</p>
            <a
              href={slide.href}
              aria-label={slide.cta}
              className="inline-block mt-4 bg-white text-gray-900 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-gray-100 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
            >
              {slide.cta} →
            </a>
          </div>
          {/* Emoji */}
          <div className="text-7xl sm:text-8xl select-none flex-shrink-0 hidden sm:block animate-img-fade" key={current}>
            {slide.emoji}
          </div>
        </div>
      </div>

      {/* Prev / Next */}
      <button type="button" onClick={prev} aria-label="Previous banner" className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-1.5 rounded-full transition-all backdrop-blur-sm">
        <ChevronLeft size={18} />
      </button>
      <button type="button" onClick={next} aria-label="Next banner" className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-1.5 rounded-full transition-all backdrop-blur-sm">
        <ChevronRight size={18} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            type="button"
            aria-label={`Go to banner ${i + 1}`}
            className={`rounded-full transition-all ${i === current ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  );
}
