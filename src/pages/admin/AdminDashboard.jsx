import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import AdminLayout from '../../components/AdminLayout';
import {
  Package, AlertCircle, ShoppingBag, TrendingUp,
  PlusCircle, Upload, ArrowRight, Clock, CheckCircle2, XCircle, Activity, Ticket, Megaphone, ReceiptText, Repeat2, BadgePercent, ShieldCheck
} from 'lucide-react';

/* ── Animated counter hook ── */
function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  const frame = useRef(null);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);
  return value;
}

/* ── Live clock ── */
function useClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

/* ── Stat card ── */
function StatCard({ label, value, rawValue, icon: Icon, grad, sub, trend }) {
  const animated = useCountUp(rawValue ?? 0);
  return (
    <div className={`rounded-2xl p-5 flex flex-col gap-3 bg-gradient-to-br ${grad} text-white shadow-sm`}>
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
          <Icon size={18} className="text-white" />
        </div>
        {trend != null && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-white/20 text-white' : 'bg-red-400/30 text-white'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-black leading-tight">
          {value ? value : animated.toLocaleString()}
        </p>
        <p className="text-sm text-white/80 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-white/60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Revenue bar chart (last 7 days) ── */
function RevenueChart({ orders }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const data = days.map(d => {
    const dayStr = d.toDateString();
    const rev = orders
      .filter(o => new Date(o.created_at).toDateString() === dayStr)
      .reduce((s, o) => s + o.total, 0);
    return { label: d.toLocaleDateString('en-US', { weekday: 'short' }), rev };
  });

  const max = Math.max(...data.map(d => d.rev), 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-gray-800">Revenue — Last 7 Days</h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">NT$</span>
      </div>
      <div className="flex items-end gap-2 h-28">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[9px] text-gray-400 font-medium">
              {d.rev > 0 ? (d.rev >= 1000 ? Math.round(d.rev / 100) / 10 + 'k' : d.rev) : ''}
            </span>
            <div className="w-full flex items-end justify-center">
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-green-600 to-green-400 transition-all duration-700 min-h-[3px]"
                style={{ height: `${Math.max(4, (d.rev / max) * 88)}px` }}
              />
            </div>
            <span className="text-[9px] text-gray-400">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Order status donut ── */
function StatusDonut({ orders }) {
  const pending = orders.filter(o => ['pending', 'confirmed', 'packed', 'shipped'].includes(o.status)).length;
  const fulfilled = orders.filter(o => o.status === 'fulfilled').length;
  const cancelled = orders.filter(o => o.status === 'cancelled').length;
  const total = orders.length || 1;

  const pPct = (pending / total) * 360;
  const fPct = (fulfilled / total) * 360;
  const cPct = (cancelled / total) * 360;

  const gradient = `conic-gradient(
    #22c55e 0deg ${fPct}deg,
    #f59e0b ${fPct}deg ${fPct + pPct}deg,
    #ef4444 ${fPct + pPct}deg ${fPct + pPct + cPct}deg,
    #e5e7eb ${fPct + pPct + cPct}deg 360deg
  )`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h2 className="font-semibold text-gray-800 mb-4">Order Status</h2>
      <div className="flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <div className="w-24 h-24 rounded-full" style={{ background: gradient }} />
          <div className="absolute inset-3 bg-white rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-gray-700">{total}</span>
          </div>
        </div>
        <div className="space-y-2 flex-1">
          {[
            { label: 'Fulfilled', count: fulfilled, color: 'bg-green-500' },
            { label: 'In progress', count: pending, color: 'bg-amber-400' },
            { label: 'Cancelled', count: cancelled, color: 'bg-red-400' },
          ].map(({ label, count, color }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <span className="text-xs text-gray-600">{label}</span>
              </div>
              <span className="text-xs font-bold text-gray-800">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Top products ── */
function TopProducts({ products }) {
  const top = [...products].sort((a, b) => b.stock - a.stock).slice(0, 4);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h2 className="font-semibold text-gray-800 mb-4">Top Stock Products</h2>
      <div className="space-y-3">
        {top.map(p => (
          <div key={p.id} className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {p.image_url
                ? <img src={p.image_url} alt={p.name_en} className="w-full h-full object-contain p-1" />
                : <div className="w-full h-full flex items-center justify-center text-base">🛒</div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{p.name_en}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-500"
                    style={{ width: `${Math.min(100, (p.stock / 100) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 flex-shrink-0">{p.stock}</span>
              </div>
            </div>
            <span className="text-xs font-bold text-gray-700 flex-shrink-0">NT${p.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Activity feed ── */
function ActivityFeed({ orders }) {
  const recent = [...orders]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const timeAgo = (iso) => {
    const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  const icons = {
    pending: { cls: 'bg-amber-100 text-amber-600', icon: Clock },
    confirmed: { cls: 'bg-blue-100 text-blue-600', icon: ReceiptText },
    packed: { cls: 'bg-violet-100 text-violet-600', icon: Package },
    shipped: { cls: 'bg-cyan-100 text-cyan-600', icon: ArrowRight },
    fulfilled: { cls: 'bg-green-100 text-green-600', icon: CheckCircle2 },
    cancelled: { cls: 'bg-red-100 text-red-500', icon: XCircle },
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={15} className="text-gray-400" />
        <h2 className="font-semibold text-gray-800">Recent Activity</h2>
      </div>
      <div className="space-y-3">
        {recent.map(o => {
          const cfg = icons[o.status] || icons.pending;
          const Icon = cfg.icon;
          return (
            <div key={o.id} className="flex items-start gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.cls}`}>
                <Icon size={13} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800">
                  {o.order_number}
                  <span className="font-normal text-gray-400 ml-1">by {o.customer_name}</span>
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">NT${o.total.toLocaleString()} · {o.items.length} items</p>
              </div>
              <span className="text-[10px] text-gray-300 flex-shrink-0">{timeAgo(o.created_at)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AuditTrail({ logs }) {
  const recent = Array.isArray(logs) ? logs : [];
  const timeAgo = (iso) => {
    const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck size={15} className="text-gray-400" />
        <h2 className="font-semibold text-gray-800">Audit Trail</h2>
      </div>
      <div className="space-y-3">
        {recent.length === 0 ? (
          <p className="text-sm text-gray-400">No admin actions recorded yet.</p>
        ) : recent.map(log => (
          <div key={log.id} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100 text-gray-500">
              <ShieldCheck size={13} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800">
                {log.action}
                <span className="font-normal text-gray-400 ml-1">{log.entity_type}</span>
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5 truncate">{log.summary}</p>
            </div>
            <span className="text-[10px] text-gray-300 flex-shrink-0">{timeAgo(log.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main dashboard ── */
export default function AdminDashboard() {
  const { products, orders, analytics, auditLogs } = useAdmin();
  const navigate = useNavigate();
  const clock = useClock();

  const kpis = analytics?.kpis || {};
  const outOfStock = products.filter(p => p.stock === 0).length;
  const lowStock   = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const today      = new Date().toDateString();
  const todayOrders  = orders.filter(o => new Date(o.created_at).toDateString() === today);
  const revenueToday = todayOrders.reduce((s, o) => s + o.total, 0);
  const openOrders = orders.filter(o => ['pending', 'confirmed', 'packed', 'shipped'].includes(o.status));
  const avgOrderValue = kpis.average_order_value ?? (orders.length ? revenueToday / Math.max(1, orders.length) : 0);
  const repeatCustomers = kpis.repeat_customers ?? 0;
  const returningRate = kpis.returning_rate ?? 0;
  const couponRedemptions = kpis.coupon_redemptions ?? 0;
  const topCoupon = analytics?.top_coupon;
  const topProduct = Array.isArray(analytics?.top_products) ? analytics.top_products[0] : null;

  const greeting = () => {
    const h = clock.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const timeStr = clock.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{greeting()} 👋</h1>
            <p className="text-gray-400 text-sm mt-0.5 flex items-center gap-2">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              <span className="bg-gray-100 text-gray-500 text-xs font-mono px-2 py-0.5 rounded-lg">{timeStr}</span>
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/products/new')}
            className="flex items-center gap-2 bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-800 transition-colors"
          >
            <PlusCircle size={16} />
            Add Product
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Products"  rawValue={products.length}  icon={Package}     grad="from-blue-500 to-blue-700"    sub={`${lowStock} low stock`}          trend={5} />
          <StatCard label="Out of Stock"    rawValue={outOfStock}        icon={AlertCircle} grad="from-red-400 to-red-600"      sub="Needs restocking"                trend={outOfStock > 0 ? -10 : 0} />
          <StatCard label="Orders Today"    rawValue={todayOrders.length}icon={ShoppingBag} grad="from-violet-500 to-violet-700" sub={`${openOrders.length} in progress`} trend={12} />
          <StatCard label="Revenue Today"   value={'NT$' + revenueToday.toLocaleString()} rawValue={revenueToday} icon={TrendingUp} grad="from-green-500 to-green-700" sub="All time: NT$0" trend={8} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Average Order" value={`NT$${Number(avgOrderValue || 0).toLocaleString()}`} rawValue={Number(avgOrderValue || 0)} icon={ReceiptText} grad="from-cyan-500 to-cyan-700" sub="Basket health" trend={4} />
          <StatCard label="Repeat Customers" rawValue={repeatCustomers} icon={Repeat2} grad="from-orange-500 to-orange-700" sub={`${returningRate}% returning`} trend={returningRate > 0 ? 6 : 0} />
          <StatCard label="Coupon Uses" rawValue={couponRedemptions} icon={BadgePercent} grad="from-pink-500 to-pink-700" sub={topCoupon ? `${topCoupon.coupon_code} most used` : 'No coupon redemptions yet'} trend={3} />
          <StatCard label="Audit Events" rawValue={auditLogs.length} icon={ShieldCheck} grad="from-slate-600 to-slate-800" sub={topProduct ? `${topProduct.name_en} leading item` : 'Actions are tracked'} trend={0} />
        </div>

        {/* Pending alert */}
        {openOrders.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
                <Clock size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-800 text-sm">{openOrders.length} order{openOrders.length !== 1 ? 's' : ''} waiting for action</p>
                <p className="text-amber-600 text-xs mt-0.5">Review, confirm, pack, or dispatch the queue</p>
              </div>
            </div>
            <button onClick={() => navigate('/admin/orders')}
              className="flex items-center gap-1.5 bg-amber-600 text-white px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0">
              View Orders <ArrowRight size={13} />
            </button>
          </div>
        )}

        {/* Charts row */}
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <RevenueChart orders={orders} />
          </div>
          <StatusDonut orders={orders} />
        </div>

        {/* Bottom row: Recent orders + Top Products + Activity */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Recent orders */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Recent Orders</h2>
              <button onClick={() => navigate('/admin/orders')} className="flex items-center gap-1 text-xs text-green-700 font-medium hover:underline">
                View all <ArrowRight size={12} />
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {[...orders]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 6)
                .map(order => {
                  const borderCls = ['pending', 'confirmed', 'packed', 'shipped'].includes(order.status)
                    ? 'border-l-4 border-amber-400'
                    : order.status === 'fulfilled'
                    ? 'border-l-4 border-green-500'
                    : 'border-l-4 border-red-400';
                  const Icon = order.status === 'fulfilled' ? CheckCircle2 : order.status === 'cancelled' ? XCircle : order.status === 'shipped' ? ArrowRight : order.status === 'packed' ? Package : order.status === 'confirmed' ? ReceiptText : Clock;
                  const iconCls = order.status === 'fulfilled' ? 'text-green-500' : order.status === 'cancelled' ? 'text-red-400' : 'text-amber-500';
                  const formatDate = (iso) => {
                    const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
                    if (diff < 60) return diff + 'm ago';
                    if (diff < 1440) return Math.floor(diff / 60) + 'h ago';
                    return new Date(iso).toLocaleDateString('en-TW', { month: 'short', day: 'numeric' });
                  };
                  return (
                    <div key={order.id} onClick={() => navigate('/admin/orders/' + order.id)}
                      className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors ${borderCls}`}>
                      <Icon size={15} className={`flex-shrink-0 ${iconCls}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900">{order.order_number}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{order.customer_name} · {order.items.length} items</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-sm text-gray-900">NT${order.total.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <TopProducts products={products} />
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { label: 'Add Product', sub: 'Single item', icon: PlusCircle, bg: 'bg-green-50 hover:bg-green-100', ibg: 'bg-green-700', tcls: 'text-green-800', scls: 'text-green-600', path: '/admin/products/new' },
                  { label: 'CSV Upload',  sub: 'Bulk import', icon: Upload, bg: 'bg-blue-50 hover:bg-blue-100', ibg: 'bg-blue-600', tcls: 'text-blue-800', scls: 'text-blue-600', path: '/admin/products/bulk-upload' },
                  { label: 'Coupons', sub: 'Promo rules', icon: Ticket, bg: 'bg-amber-50 hover:bg-amber-100', ibg: 'bg-amber-600', tcls: 'text-amber-800', scls: 'text-amber-600', path: '/admin/coupons' },
                  { label: 'Home Offers', sub: 'Hero banners', icon: Megaphone, bg: 'bg-purple-50 hover:bg-purple-100', ibg: 'bg-purple-600', tcls: 'text-purple-800', scls: 'text-purple-600', path: '/admin/offers' },
                  { label: 'Manage Orders', sub: `${openOrders.length} active`, icon: ShoppingBag, bg: 'bg-violet-50 hover:bg-violet-100', ibg: 'bg-violet-600', tcls: 'text-violet-800', scls: 'text-violet-600', path: '/admin/orders' },
                ].map(a => {
                  const Icon = a.icon;
                  return (
                    <button key={a.path} onClick={() => navigate(a.path)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl ${a.bg} transition-colors text-left`}>
                      <div className={`w-8 h-8 ${a.ibg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon size={15} className="text-white" />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${a.tcls}`}>{a.label}</p>
                        <p className={`text-xs ${a.scls}`}>{a.sub}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <AuditTrail logs={auditLogs} />

        {/* Activity feed */}
        <ActivityFeed orders={orders} />
      </div>
    </AdminLayout>
  );
}
