import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BadgePercent, Gift, LogOut, Mail, MapPin, Phone, UserCircle2, WalletCards } from 'lucide-react';
import { useCustomer } from '../context/CustomerContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import SeoHead from '../components/SeoHead';
import { api } from '../lib/api';

function formatMoney(value) {
  return `NT$${Number(value || 0).toLocaleString()}`;
}

function GoogleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.43l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.86A6 6 0 0 1 6.08 12c0-.65.11-1.28.31-1.86V7.52H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.48l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 6.01c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6.01 12 6.01Z" />
    </svg>
  );
}

function FacebookLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
      <circle cx="12" cy="12" r="11" fill="#1877F2" />
      <path fill="#fff" d="M13.52 19v-6.38h2.14l.32-2.49h-2.46V8.54c0-.72.2-1.21 1.23-1.21h1.32V5.1a17.7 17.7 0 0 0-1.92-.1c-1.9 0-3.2 1.16-3.2 3.29v1.84H8.8v2.49h2.15V19h2.57Z" />
    </svg>
  );
}

function MiniOrder({ order }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{order.order_number}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date(order.created_at).toLocaleDateString('en-TW', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
        <span className="text-sm font-bold text-gray-900">{formatMoney(order.total)}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {order.items.slice(0, 3).map(item => (
          <span key={item.product_id || item.name} className="inline-flex rounded-full bg-white px-2 py-0.5 text-[11px] text-gray-600">
            {item.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function CustomerAccountPage() {
  const navigate = useNavigate();
  const { customer, orders, isReady, isLoggedIn, logout, updateProfile, refreshCustomer } = useCustomer();
  const [profile, setProfile] = useState({ name: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [message, setMessage] = useState('');

  const startWixLogin = async () => {
    if (signingIn) return;
    setSigningIn(true);
    setMessage('');
    try {
      const result = await api.startWixLogin();
      if (!result.url) throw new Error('Wix did not return a login URL');
      window.location.assign(result.url);
    } catch (error) {
      setMessage(error.message || 'Unable to start Wix sign-in.');
      setSigningIn(false);
    }
  };

  useEffect(() => {
    if (customer) {
      setProfile({
        name: customer.name || '',
        phone: customer.phone || '',
        address: customer.address || '',
      });
    }
  }, [customer]);

  const totalOrders = orders.length;
  const totalSpend = useMemo(() => orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0), [orders]);
  const rewardPoints = customer?.rewards?.points || 0;
  const canRedeem = customer?.rewards?.can_redeem_100;
  const nextRewardAt = customer?.rewards?.next_reward_at ?? 100;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await updateProfile(profile);
      await refreshCustomer();
      setMessage('Profile saved');
    } catch (error) {
      setMessage(error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500">
        Loading account...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SeoHead
        title="My Account | Orders, Rewards & Addresses | MIK Store"
        description="Manage your MIK Store customer profile, saved address, loyalty points, and order history."
        robots="noindex,nofollow"
        ogType="website"
      />
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 pb-28">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
            <p className="text-sm text-gray-500">Orders, profile, and loyalty rewards</p>
          </div>
        </div>

        {!isLoggedIn ? (
          <section className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-[#e9edf4] p-4 shadow-sm sm:p-6">
            <div className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-white/80 blur-3xl" />
            <div className="absolute -bottom-28 -right-16 h-72 w-72 rounded-full bg-[#b7c8e0]/70 blur-3xl" />

            <div className="relative grid overflow-hidden rounded-[1.6rem] bg-white shadow-xl shadow-slate-300/30 md:grid-cols-[1.05fr_0.95fr]">
              <div className="flex min-h-[300px] flex-col justify-between bg-gradient-to-br from-[#17233d] via-[#294563] to-[#d9682d] p-7 text-white sm:p-10 md:min-h-[440px]">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-2xl font-black">M</div>
                <h2 className="max-w-md text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
                  Shop Indian groceries across Taiwan.
                </h2>
              </div>

              <div className="flex min-h-[390px] flex-col p-6 sm:p-10 md:min-h-[440px]">
                <button onClick={() => navigate(-1)} className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900">
                  <ArrowLeft size={16} /> Back
                </button>

                <div className="flex flex-1 items-center justify-center py-8">
                  <div className="w-full max-w-sm">
                    <p className="mb-5 text-center text-sm font-semibold text-slate-500">Choose how you want to continue</p>
                    <div className="grid gap-3">
                      <button
                        type="button"
                        onClick={startWixLogin}
                        disabled={signingIn}
                        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md disabled:cursor-wait disabled:opacity-60"
                      >
                        <GoogleLogo />
                        Continue with Google
                      </button>
                      <button
                        type="button"
                        onClick={startWixLogin}
                        disabled={signingIn}
                        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#1877f2] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#1268d3] hover:shadow-md disabled:cursor-wait disabled:opacity-60"
                      >
                        <FacebookLogo />
                        Continue with Facebook
                      </button>
                      <button
                        type="button"
                        onClick={startWixLogin}
                        disabled={signingIn}
                        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md disabled:cursor-wait disabled:opacity-60"
                      >
                        <Mail className="h-5 w-5" />
                        Continue with email
                      </button>
                    </div>
                    {signingIn && <p className="mt-4 text-center text-xs font-semibold text-slate-400">Opening secure sign-in...</p>}
                  </div>
                </div>

                {message && <p className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600">{message}</p>}
              </div>
            </div>
          </section>
        ) : (
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-4">
            <div className="space-y-4">
              <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center">
                      <UserCircle2 size={28} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Signed in customer</p>
                      <h2 className="text-2xl font-bold text-gray-900">{customer?.name || 'Customer'}</h2>
                      <p className="text-sm text-gray-500">{customer?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>

                <div className="mt-6 grid sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">Loyalty points</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{rewardPoints}</p>
                    <p className="mt-1 text-xs text-gray-500">{canRedeem ? 'Ready for a 10% discount' : `${nextRewardAt} points to your next reward`}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">Total orders</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{totalOrders}</p>
                    <p className="mt-1 text-xs text-gray-500">Synced from Wix</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">Lifetime spend</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{formatMoney(totalSpend)}</p>
                    <p className="mt-1 text-xs text-gray-500">Across previous orders</p>
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Profile</h3>
                    <p className="text-sm text-gray-500">Saved details for checkout and delivery</p>
                  </div>
                  <div className="inline-flex items-center gap-2 text-xs font-semibold rounded-full bg-amber-50 text-amber-800 px-3 py-1">
                    <BadgePercent size={13} />
                    100 points = 10% off
                  </div>
                </div>

                <form onSubmit={handleSave} className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      className="input-field"
                      value={profile.name}
                      onChange={e => setProfile(v => ({ ...v, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      className="input-field"
                      value={profile.phone}
                      onChange={e => setProfile(v => ({ ...v, phone: e.target.value }))}
                      placeholder="+886 ..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      className="input-field min-h-24 resize-none"
                      value={profile.address}
                      onChange={e => setProfile(v => ({ ...v, address: e.target.value }))}
                      placeholder="Delivery address in Taiwan"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-2xl bg-green-700 px-4 py-3 text-white font-semibold disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : 'Save profile'}
                  </button>
                </form>

                {message && <p className="mt-3 text-sm text-gray-600">{message}</p>}
              </section>

              <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Recent orders</h3>
                    <p className="text-sm text-gray-500">Your live order history from Wix</p>
                  </div>
                  <button onClick={() => navigate('/account/my-orders')} className="text-sm font-semibold text-green-700 hover:text-green-800">
                    View all
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-500">
                    No orders yet. Once you place an order, it will appear here across devices.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 4).map(order => (
                      <MiniOrder key={order.id} order={order} />
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="space-y-4">
              <div className="bg-gradient-to-br from-emerald-600 to-green-700 text-white rounded-3xl p-6 shadow-lg">
                <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
                  <Gift size={16} />
                  Loyalty program
                </div>
                <p className="mt-4 text-3xl font-bold">Earn as you shop</p>
                <p className="mt-2 text-white/85 text-sm">
                  100 points unlock a 10% discount on your next order. Points are stored per customer and synced from the backend.
                </p>
                <div className="mt-5 rounded-2xl bg-white/10 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/80">Current points</span>
                    <span className="font-bold">{rewardPoints}</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white"
                      style={{ width: `${Math.min(100, (rewardPoints % 100))}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-white/75">
                    {canRedeem ? 'You can redeem 100 points at checkout right now.' : `${nextRewardAt} points until your next discount.`}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 p-5">
                <p className="font-semibold text-gray-900">Why this feels like a live grocery app</p>
                <ul className="mt-4 space-y-3 text-sm text-gray-600">
                  <li className="flex gap-3">
                    <MapPin size={16} className="mt-0.5 text-green-700 flex-shrink-0" />
                    Customer profile and address stay saved in the backend database.
                  </li>
                  <li className="flex gap-3">
                    <WalletCards size={16} className="mt-0.5 text-green-700 flex-shrink-0" />
                    Orders and rewards sync across devices for the same Gmail account.
                  </li>
                  <li className="flex gap-3">
                    <Phone size={16} className="mt-0.5 text-green-700 flex-shrink-0" />
                    Checkout becomes faster because delivery details are already there.
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
      <BottomNav active="orders" />
    </div>
  );
}
