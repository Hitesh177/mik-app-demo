import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-36 right-4 z-40 w-10 h-10 bg-white border border-gray-200 text-gray-600 rounded-full shadow-lg flex items-center justify-center hover:bg-green-700 hover:text-white hover:border-green-700 transition-all active:scale-90 animate-slide-up-modal"
      aria-label="Scroll to top"
    >
      <ArrowUp size={18} />
    </button>
  );
}
