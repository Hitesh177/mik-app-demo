import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import {
  LayoutDashboard, Package, ShoppingBag, LogOut, Store,
  Menu, Bell, ChevronRight, Ticket, Megaphone
} from 'lucide-react';
import { useState } from 'react';

const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { path: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { path: '/admin/products', label: 'Products', icon: Package },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { path: '/admin/coupons', label: 'Coupons', icon: Ticket },
      { path: '/admin/offers', label: 'Home Offers', icon: Megaphone },
    ],
  },
  {
    label: 'Sales',
    items: [
      { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    ],
  },
];

function NavItem({ item, active, onClick, badge }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
        ${active
          ? 'bg-green-700 text-white shadow-sm'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
        }`}
    >
      <div className="relative flex-shrink-0">
        <Icon size={17} className={active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} />
        {active && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-300 rounded-full animate-pulse" />
        )}
      </div>
      <span className="flex-1">{item.label}</span>
      {badge > 0 && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'}`}>
          {badge}
        </span>
      )}
      {active && !badge && <ChevronRight size={14} className="text-green-200" />}
    </Link>
  );
}

export default function AdminLayout({ children }) {
  const { logout, orders } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pendingCount = orders.filter(o => o.status === 'pending').length;

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  const isActive = (path) => {
    if (path === '/admin/products') return location.pathname.startsWith('/admin/products');
    if (path === '/admin/orders') return location.pathname.startsWith('/admin/orders');
    if (path === '/admin/coupons') return location.pathname.startsWith('/admin/coupons');
    if (path === '/admin/offers') return location.pathname.startsWith('/admin/offers');
    return location.pathname === path;
  };

  const breadcrumb = location.pathname
    .split('/')
    .filter(Boolean)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' › ');

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-800 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-white font-bold text-base">M</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">MIK Store</p>
              <p className="text-xs text-gray-400 leading-tight">Mayur Indian Kitchen</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-1.5">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <NavItem
                    key={item.path}
                    item={item}
                    active={isActive(item.path)}
                    onClick={() => setSidebarOpen(false)}
                    badge={item.path === '/admin/orders' ? pendingCount : 0}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 pb-4 pt-3 border-t border-gray-100 space-y-0.5">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
          >
            <Store size={17} className="text-gray-400" />
            View Storefront
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
            >
              <Menu size={18} />
            </button>
            <p className="text-xs text-gray-400 hidden lg:block">{breadcrumb}</p>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <button
                onClick={() => navigate('/admin/orders')}
                className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-600 px-3 py-1.5 rounded-lg text-xs font-medium"
              >
                <Bell size={12} />
                {pendingCount} pending
              </button>
            )}
            <div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
