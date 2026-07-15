import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BadgePercent, Gift, LogOut, MapPin, Phone, UserCircle2, ShieldCheck, WalletCards } from 'lucide-react';
import { useCustomer } from '../context/CustomerContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import GoogleSignInButton from '../components/GoogleSignInButton';
import SeoHead from '../components/SeoHead';

function formatMoney(value) {
  return `NT$${Number(value || 0).toLocaleString()}`;
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
  const { customer, orders, isReady, isLoggedIn, signInWithGoogle, logout, updateProfile, refreshCustomer } = useCustomer();
  const [profile, setProfile] = useState({ name: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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

  const handleGoogleCredential = async (credential) => {
    setMessage('');
    try {
      await signInWithGoogle(credential);
      await refreshCustomer();
      setMessage('Signed in successfully');
    } catch (error) {
      setMessage(error.message || 'Google sign-in failed');
    }
  };

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
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4">
            <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-green-700 text-white flex items-center justify-center">
                  <UserCircle2 size={24} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">Sign in with Google</p>
                  <p className="text-sm text-gray-500">Use Gmail to keep orders and loyalty points synced across devices.</p>
                </div>
              </div>
              <GoogleSignInButton
                onCredential={handleGoogleCredential}
                className="mt-5"
                label="Sign in with your Google account"
              />
              {message && <p className="mt-4 text-sm text-gray-600">{message}</p>}
            </section>

            <aside className="space-y-4">
              <div className="bg-gradient-to-br from-green-700 to-emerald-600 rounded-3xl text-white p-6 shadow-lg">
                <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
                  <ShieldCheck size={16} />
                  Secure customer database
                </div>
                <p className="text-2xl font-bold mt-4 leading-tight">Fast grocery shopping with secure customer profiles.</p>
                <p className="text-sm text-white/85 mt-2">
                  Orders, addresses, rewards, and login state stay synced across devices.
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 p-5">
                <p className="font-semibold text-gray-900">Loyalty Rewards</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-gray-500 text-xs">100 points</p>
                    <p className="font-bold text-gray-900">10% off</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-gray-500 text-xs">Earn rate</p>
                    <p className="font-bold text-gray-900">1 point / NT$10</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
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
                    <p className="mt-1 text-xs text-gray-500">All from this account</p>
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
                    <p className="text-sm text-gray-500">Your live order history from the customer database</p>
                  </div>
                  <button onClick={() => navigate('/my-orders')} className="text-sm font-semibold text-green-700 hover:text-green-800">
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
