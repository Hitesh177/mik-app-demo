import { Link } from 'react-router-dom';
import { MessageCircle, Phone, Mail, MapPin, Share2, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-10">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 bg-green-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <div>
                <p className="font-bold text-white text-sm">MIK Store</p>
                <p className="text-xs text-gray-500">Mayur Indian Kitchen</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Authentic Indian groceries delivered island-wide in Taiwan. Free delivery on orders over NT$4,000.
            </p>
            <div className="flex gap-3 mt-4">
              <a
                href="https://wa.me/886912345678"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with us on WhatsApp"
                className="w-8 h-8 bg-gray-800 hover:bg-green-700 rounded-lg flex items-center justify-center transition-colors"
              >
                <MessageCircle size={15} />
              </a>
              <Link to="/categories" aria-label="Browse categories" className="w-8 h-8 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors">
                <Share2 size={15} />
              </Link>
              <Link to="/account" aria-label="My account" className="w-8 h-8 bg-gray-800 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors">
                <Heart size={15} />
              </Link>
            </div>
          </div>

          {/* Shop */}
          <div>
            <p className="text-white font-semibold text-sm mb-3">Shop</p>
            <ul className="space-y-2 text-xs">
              {['Spices', 'Rice & Grains', 'Lentils & Pulses', 'Sweets & Snacks', 'Oils & Ghee', 'Beverages'].map(cat => (
                <li key={cat}>
                  <Link to="/" className="hover:text-white transition-colors">{cat}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <p className="text-white font-semibold text-sm mb-3">Help</p>
            <ul className="space-y-2 text-xs">
              <li><Link to="/account" className="hover:text-white transition-colors">My Account</Link></li>
              <li><Link to="/my-orders" className="hover:text-white transition-colors">My Orders</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">Blog & Guides</Link></li>
              <li><Link to="/shipping-returns" className="hover:text-white transition-colors">Shipping &amp; Returns</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-white font-semibold text-sm mb-3">Contact</p>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2 text-xs">
                <Phone size={13} className="mt-0.5 flex-shrink-0 text-green-500" />
                <span>+886 912-345-678</span>
              </li>
              <li className="flex items-start gap-2 text-xs">
                <MessageCircle size={13} className="mt-0.5 flex-shrink-0 text-green-500" />
                <a href="https://wa.me/886912345678" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp us</a>
              </li>
              <li className="flex items-start gap-2 text-xs">
                <MessageCircle size={13} className="mt-0.5 flex-shrink-0 text-green-500" />
                <a
                  href="https://line.me/ti/p/@688vynca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Customer Support on LINE
                </a>
              </li>
              <li className="flex items-start gap-2 text-xs">
                <Mail size={13} className="mt-0.5 flex-shrink-0 text-green-500" />
                <a href="mailto:hello@mik.store" className="hover:text-white transition-colors">hello@mik.store</a>
              </li>
              <li className="flex items-start gap-2 text-xs">
                <MapPin size={13} className="mt-0.5 flex-shrink-0 text-green-500" />
                <span>Taipei, Taiwan</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Email signup */}
        <div className="border border-gray-800 rounded-2xl p-5 mb-8 bg-gray-800/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Get deals & updates</p>
              <p className="text-gray-500 text-xs mt-0.5">Subscribe to our newsletter for offers and new arrivals</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 sm:w-48 bg-gray-700 border border-gray-600 text-white placeholder-gray-500 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-600"
              />
              <button className="bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors flex-shrink-0">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-gray-800">
          <p className="text-xs text-gray-600">© 2026 Mayur Indian Kitchen. All rights reserved.</p>
          <div className="flex gap-4 text-xs">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms-conditions" className="hover:text-white transition-colors">Terms &amp; Conditions</Link>
            <Link to="/admin" className="hover:text-white transition-colors">Store Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
