import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Smartphone, Building2, BadgePercent, Gift } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAdmin } from '../context/AdminContext';
import { useCustomer } from '../context/CustomerContext';

const PAYMENT_METHODS = [
  { id: 'paytm', label: 'Paytm', icon: Smartphone, desc: 'Pay directly to owner\'s Paytm account' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: Building2, desc: 'Manual bank transfer (details shared after order)' },
  { id: 'cod', label: 'Cash on Delivery', icon: CreditCard, desc: 'Pay when you receive your order' },
];

function formatMoney(value) {
  return `NT$${Number(value || 0).toLocaleString()}`;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, totalPrice, clearCart } = useCart();
  const { addOrder } = useAdmin();
  const { customer, isLoggedIn, updateProfile, reloadOrders, refreshCustomer } = useCustomer();

  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [paymentMethod, setPaymentMethod] = useState('paytm');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [usePoints, setUsePoints] = useState(false);
  const [couponCode, setCouponCode] = useState('');

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || '',
        phone: customer.phone || '',
        address: customer.address || '',
      });
      setUsePoints(false);
    }
  }, [customer]);

  const canRedeem = Boolean(customer?.rewards?.can_redeem_100);
  const redeemPoints = usePoints && canRedeem ? 100 : 0;
  const discountAmount = useMemo(() => {
    if (!redeemPoints) return 0;
    return Math.max(0, Math.round(totalPrice * 0.10));
  }, [redeemPoints, totalPrice]);
  const payableTotal = Math.max(0, totalPrice - discountAmount);
  const pointsEarned = Math.floor(payableTotal / 10);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    if (!form.address.trim()) e.address = 'Delivery address is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      if (isLoggedIn) {
        try {
          await updateProfile(form);
        } catch {
          // Keep checkout moving even if profile sync temporarily fails.
        }
      }

      const newOrder = await addOrder({
        customer_name: form.name,
        customer_phone: form.phone,
        customer_address: form.address,
        items: cart.map(i => ({ product_id: i.id, name: i.name_en, price: i.price, quantity: i.quantity })),
        payment_method: paymentMethod,
        redeem_points: redeemPoints,
        coupon_code: couponCode.trim(),
      });

      clearCart();
      if (isLoggedIn) {
        await Promise.allSettled([reloadOrders(), refreshCustomer()]);
      }
      navigate('/order-confirmation', { state: { order: newOrder } });
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to place order' });
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg">Checkout</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 space-y-4 pb-36">
        {!isLoggedIn && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Sign in with Google to save your customer profile and earn loyalty points.</p>
            <button type="button" onClick={() => navigate('/account')} className="mt-2 font-semibold text-amber-900 underline">
              Sign in now
            </button>
          </div>
        )}

        {isLoggedIn && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <div className="flex items-center gap-2 font-semibold">
              <Gift size={16} />
              Loyalty reward active
            </div>
            <p className="mt-1">
              You have {customer?.rewards?.points || 0} points. {canRedeem ? 'Redeem 100 points now for 10% off.' : `${customer?.rewards?.next_reward_at ?? 100} more points until your next discount.`}
            </p>
          </div>
        )}

        {/* Customer info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
          <h2 className="font-semibold text-gray-800">Delivery Details</h2>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Full Name</label>
            <input
              className={`input-field ${errors.name ? 'border-red-400' : ''}`}
              placeholder="Your full name"
              value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: '' })); }}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Phone Number</label>
            <input
              className={`input-field ${errors.phone ? 'border-red-400' : ''}`}
              placeholder="+886 ..."
              type="tel"
              value={form.phone}
              onChange={e => { setForm(f => ({ ...f, phone: e.target.value })); setErrors(er => ({ ...er, phone: '' })); }}
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Delivery Address</label>
            <textarea
              className={`input-field resize-none h-20 ${errors.address ? 'border-red-400' : ''}`}
              placeholder="Full delivery address in Taiwan"
              value={form.address}
              onChange={e => { setForm(f => ({ ...f, address: e.target.value })); setErrors(er => ({ ...er, address: '' })); }}
            />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>
        </div>

        {/* Loyalty redemption */}
        {isLoggedIn && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <h2 className="font-semibold text-gray-800">Loyalty Reward</h2>
            <label
              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors
                ${redeemPoints ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <input
                type="checkbox"
                checked={usePoints}
                onChange={e => setUsePoints(e.target.checked)}
                disabled={!canRedeem}
                className="accent-amber-600"
              />
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-800 flex items-center gap-2">
                  <BadgePercent size={16} className="text-amber-700" />
                  Use 100 points for 10% off
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {canRedeem ? 'Discount will be applied to this order.' : 'You need 100 points before you can redeem.'}
                </p>
              </div>
              <span className="text-xs font-semibold text-amber-700">
                {canRedeem ? 'Ready' : 'Locked'}
              </span>
            </label>
          </div>
        )}

        {/* Payment method */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h2 className="font-semibold text-gray-800">Payment Method</h2>
          {PAYMENT_METHODS.map(method => {
            const Icon = method.icon;
            return (
              <label
                key={method.id}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors
                  ${paymentMethod === method.id ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={method.id}
                  checked={paymentMethod === method.id}
                  onChange={() => setPaymentMethod(method.id)}
                  className="accent-green-700"
                />
                <Icon size={18} className={paymentMethod === method.id ? 'text-green-700' : 'text-gray-500'} />
                <div>
                  <p className="font-medium text-sm text-gray-800">{method.label}</p>
                  <p className="text-xs text-gray-500">{method.desc}</p>
                </div>
              </label>
            );
          })}
          {paymentMethod === 'paytm' && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm">
              <p className="font-semibold text-orange-800">Paytm Payment Details</p>
              <p className="text-orange-700 mt-1">Send payment to: <strong>+91 98765-43210</strong></p>
              <p className="text-orange-600 text-xs mt-0.5">Contact us on WhatsApp after payment for confirmation</p>
            </div>
          )}
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
          <h2 className="font-semibold text-gray-800 mb-3">Order Summary</h2>
          {cart.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-600">{item.name_en} × {item.quantity}</span>
              <span className="font-medium">{formatMoney(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t pt-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400 block mb-1">Coupon Code</label>
            <input
              className="input-field"
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={e => setCouponCode(e.target.value.toUpperCase())}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Coupon rules are validated when you place the order.
            </p>
          </div>
          <div className="border-t pt-2 flex justify-between text-sm text-gray-600">
            <span>Delivery</span>
            <span className="text-green-700 font-medium">FREE</span>
          </div>
          {redeemPoints > 0 && (
            <div className="flex justify-between text-sm text-amber-700">
              <span>Loyalty discount</span>
              <span>-{formatMoney(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-gray-600">
            <span>Points earned</span>
            <span className="font-medium text-gray-900">{pointsEarned}</span>
          </div>
          <div className="flex justify-between font-bold text-base">
            <span>Total</span>
            <span>{formatMoney(payableTotal)}</span>
          </div>
        </div>
      </form>

      {errors.submit && (
        <div className="max-w-2xl w-full mx-auto px-4 -mt-2">
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
            {errors.submit}
          </div>
        </div>
      )}

      {/* Place order button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-green-700 text-white font-bold py-4 rounded-2xl text-base shadow-sm active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {loading ? 'Placing Order...' : `Place Order · ${formatMoney(payableTotal)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
