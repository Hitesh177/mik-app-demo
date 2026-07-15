import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '../context/CustomerContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import { ArrowLeft, Package, CheckCircle2, XCircle, ChevronDown, Truck, Star, BadgePercent, LogIn } from 'lucide-react';
import SeoHead from '../components/SeoHead';

const STEPS = [
  { key: 'placed', label: 'Order Placed', icon: Package },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'packed', label: 'Packed', icon: Package },
  { key: 'shipped', label: 'Out for Delivery', icon: Truck },
  { key: 'fulfilled', label: 'Delivered', icon: Star },
];

function getStepIndex(status) {
  if (status === 'cancelled') return -1;
  if (status === 'fulfilled') return 4;
  if (status === 'shipped') return 3;
  if (status === 'packed') return 2;
  if (status === 'confirmed') return 1;
  return 0;
}

function OrderTimeline({ status, events }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 mt-3 bg-red-50 rounded-xl px-3 py-2">
        <XCircle size={14} className="text-red-500" />
        <span className="text-xs text-red-500 font-semibold">Order Cancelled</span>
      </div>
    );
  }
  const eventStatuses = new Set((events || []).map(event => event.status));
  const activeStep = getStepIndex(status);
  return (
    <div className="mt-3 flex items-center gap-1">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = eventStatuses.has(step.key) || i <= activeStep;
        const active = i === activeStep;
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                done ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-gray-300'
              } ${active ? 'ring-2 ring-green-300 ring-offset-1' : ''}`}>
                <Icon size={13} />
              </div>
              <span className={`text-[9px] font-medium text-center leading-tight w-12 ${done ? 'text-green-700' : 'text-gray-300'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-4 mx-0.5 rounded-full ${i < activeStep ? 'bg-green-500' : 'bg-gray-100'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatMoney(value) {
  return `NT$${Number(value || 0).toLocaleString()}`;
}

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const { customer, orders, isReady, isLoggedIn } = useCustomer();
  const [expanded, setExpanded] = useState(null);

  const myOrders = [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const rewardPoints = customer?.rewards?.points || 0;

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500">
        Loading orders...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SeoHead
        title="My Orders | Track Your Delivery | MIK Store"
        description="View your live MIK Store order history, delivery status timeline, and loyalty rewards."
        robots="noindex,nofollow"
        ogType="website"
      />
      <Header />
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 space-y-4 pb-28">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-400 text-sm">{myOrders.length} order{myOrders.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {!isLoggedIn ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <Package size={28} className="text-gray-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-700">Sign in to see your orders</p>
              <p className="text-gray-400 text-sm mt-1">Your order history is linked to your Google account and synced across devices.</p>
            </div>
            <button
              onClick={() => navigate('/account')}
              className="inline-flex items-center justify-center gap-2 bg-green-700 text-white font-semibold px-6 py-3 rounded-xl text-sm"
            >
              <LogIn size={16} />
              Go to Account
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Customer rewards</p>
                <p className="font-bold text-gray-900 text-lg">{rewardPoints} points</p>
                <p className="text-sm text-gray-500">
                  {customer?.rewards?.can_redeem_100 ? 'You can redeem 100 points for 10% off right now.' : `${customer?.rewards?.next_reward_at ?? 100} points to the next discount.`}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-800 px-3 py-1.5 text-sm font-semibold">
                <BadgePercent size={14} />
                10% reward
              </div>
            </div>

            {myOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Package size={28} className="text-gray-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-700">No orders yet</p>
                  <p className="text-gray-400 text-sm mt-1">Your order history will appear here after checkout</p>
                </div>
                <button onClick={() => navigate('/')} className="bg-green-700 text-white font-semibold px-6 py-3 rounded-xl text-sm">
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myOrders.map(order => {
                  const isOpen = expanded === order.id;
                  const labelMap = {
                    pending: 'Placed',
                    confirmed: 'Confirmed',
                    packed: 'Packed',
                    shipped: 'On the way',
                    fulfilled: 'Delivered',
                    cancelled: 'Cancelled',
                  };
                  const statusLabel = labelMap[order.status] || 'In Progress';
                  const statusCls = order.status === 'fulfilled'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : order.status === 'cancelled'
                    ? 'bg-red-50 text-red-500 border-red-200'
                    : order.status === 'shipped'
                    ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                    : order.status === 'packed'
                    ? 'bg-violet-50 text-violet-700 border-violet-200'
                    : order.status === 'confirmed'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200';

                  return (
                    <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                      <button
                        className="w-full text-left p-4"
                        onClick={() => setExpanded(isOpen ? null : order.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-900">{order.order_number}</span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusCls}`}>
                                {statusLabel}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {new Date(order.created_at).toLocaleDateString('en-TW', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {order.items.slice(0, 3).map((item, i) => (
                                <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                  {item.name}
                                </span>
                              ))}
                              {order.items.length > 3 && (
                                <span className="text-xs text-gray-400">+{order.items.length - 3} more</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                            <p className="font-bold text-gray-900">{formatMoney(order.total)}</p>
                            <p className="text-xs text-gray-400">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                            <ChevronDown size={16} className={`text-gray-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                        <OrderTimeline status={order.status} events={order.events} />
                      </button>

                      {isOpen && (
                        <div className="border-t border-gray-50 px-4 pb-4 pt-3 space-y-2">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Order Items</p>
                          {order.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs">×{item.quantity ?? item.qty ?? 1}</span>
                                <span className="text-gray-700">{item.name}</span>
                              </div>
                              <span className="font-semibold text-gray-900">{formatMoney((item.price || 0) * (item.quantity ?? item.qty ?? 1))}</span>
                            </div>
                          ))}
                          <div className="border-t pt-2 flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-medium">{formatMoney(order.subtotal)}</span>
                          </div>
                          {order.coupon_code && (
                            <div className="flex justify-between text-sm text-indigo-700">
                              <span>Coupon {order.coupon_code}</span>
                              <span>-{formatMoney(order.coupon_discount_amount || 0)}</span>
                            </div>
                          )}
                          {order.discount_amount > 0 && (
                            <div className="flex justify-between text-sm text-amber-700">
                              <span>Loyalty discount</span>
                              <span>-{formatMoney(order.discount_amount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm text-gray-500">
                            <span>Points earned</span>
                            <span>{order.points_earned || 0}</span>
                          </div>
                          <div className="border-t pt-2 flex justify-between font-bold text-gray-900">
                            <span>Total</span>
                            <span>{formatMoney(order.total)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
      <BottomNav active="orders" />
    </div>
  );
}
