import { useState } from 'react';
import { X, Truck, Phone, Clock } from 'lucide-react';

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="bg-green-700 text-white text-xs py-2 px-4 relative">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-4 flex-wrap text-center">
        <span className="flex items-center gap-1.5 font-medium">
          <Truck size={13} />
          Free Taiwan-wide delivery on orders over NT$4,000
        </span>
        <span className="hidden sm:block text-green-300">|</span>
        <span className="flex items-center gap-1.5 font-medium hidden sm:flex">
          <Phone size={13} />
          WhatsApp: +886-912-345-678
        </span>
        <span className="hidden sm:block text-green-300">|</span>
        <span className="flex items-center gap-1.5 font-medium hidden md:flex">
          <Clock size={13} />
          Mon–Sat 10am–8pm
        </span>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-green-200 hover:text-white transition-colors"
        aria-label="Close"
      >
        <X size={14} />
      </button>
    </div>
  );
}
