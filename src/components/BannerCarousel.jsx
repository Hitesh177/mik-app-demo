import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { isChinesePath, localizedPath } from '../lib/storeRoutes';

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
    title: 'Free Delivery\non Orders Over NT$4,000',
    sub: 'Shop more and enjoy delivery across Taiwan',
    cta: 'Shop Now',
    href: '/',
    accent: 'bg-white/20',
  },
];

const ATTA_BANNER_IMAGES = [
  '/products/4269f1c4c0bf7de00ebe.jpeg',
  '/products/c3291bbb445eb5005123.jpg',
  '/products/14acb4531895715a33cf.jpg',
];

const ATTA_BANNER_POSTER = '/banners/atta-weekend-poster.png';

function normalizeOffer(offer) {
  const href = offer.href || '/';
  return {
    bg: offer.bg || `${offer.bg_from || 'from-green-700'} ${offer.bg_to || 'to-green-900'}`,
    emoji: offer.emoji || '✨',
    tag: offer.tag || '',
    title: offer.title || '',
    sub: offer.subtitle || offer.sub || '',
    cta: offer.cta_label || offer.cta || 'Shop Now',
    href,
    images: offer.images || (href === '/flour-rice-pulses' ? ATTA_BANNER_IMAGES : []),
    poster: offer.poster || (href === '/flour-rice-pulses' ? ATTA_BANNER_POSTER : ''),
    accent: offer.accent || 'bg-white/20',
    active: offer.active === undefined ? true : Boolean(offer.active),
  };
}

export default function BannerCarousel({ offers = [] }) {
  const { pathname } = useLocation();
  const isZh = isChinesePath(pathname);
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
              href={localizedPath(slide.href, isZh)}
              aria-label={slide.cta}
              className="inline-block mt-4 bg-white text-gray-900 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-gray-100 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
            >
              {slide.cta} →
            </a>
          </div>
          {slide.poster ? (
            <div className="relative hidden sm:flex w-80 h-52 flex-shrink-0 items-center justify-center animate-img-fade" key={current}>
              <div className="absolute inset-x-4 bottom-1 h-8 rounded-[50%] bg-black/20 blur-xl" />
              <div className="absolute right-4 top-2 w-28 h-28 rounded-full bg-yellow-100/35 blur-3xl" />
              <img
                src={slide.poster}
                alt="Aashirvaad, Pillsbury and Prima atta flour offer"
                className="relative z-10 h-full w-full object-contain drop-shadow-2xl transition-transform duration-500 hover:-translate-y-1 hover:scale-[1.02]"
                style={{
                  WebkitMaskImage: 'radial-gradient(ellipse at center, black 68%, transparent 100%)',
                  maskImage: 'radial-gradient(ellipse at center, black 68%, transparent 100%)',
                }}
              />
            </div>
          ) : slide.images?.length ? (
            <div className="relative hidden sm:block w-72 h-48 flex-shrink-0 animate-img-fade" key={current} aria-label="Aashirvaad, Pillsbury and Prima atta flour" role="img">
              <div className="absolute inset-x-2 bottom-0 h-8 rounded-[50%] bg-black/15 blur-xl" />
              <div className="absolute right-1 top-1 w-20 h-20 rounded-full bg-yellow-200/30 blur-2xl" />
              {slide.images.map((src, index) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  aria-hidden="true"
                  className={`absolute bottom-1 h-[88%] w-[48%] object-contain drop-shadow-2xl transition-transform duration-500 hover:-translate-y-1 ${
                    index === 0 ? 'left-2 z-30 -rotate-3' : index === 1 ? 'left-[30%] z-20 rotate-2' : 'right-0 z-10 rotate-6'
                  }`}
                />
              ))}
            </div>
          ) : (
            <div className="text-7xl sm:text-8xl select-none flex-shrink-0 hidden sm:block animate-img-fade" key={current}>
              {slide.emoji}
            </div>
          )}
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
