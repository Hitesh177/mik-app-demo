import { useState } from 'react';
import { ArrowLeft, ExternalLink, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { api } from '../lib/api';

function formatMoney(value) {
  return `NT$${Number(value || 0).toLocaleString()}`;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, totalPrice, syncError } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const continueToWix = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.createWixCheckout();
      window.location.assign(result.checkout_url);
    } catch (checkoutError) {
      setError(checkoutError.message || 'Wix checkout is temporarily unavailable. Please try again.');
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <main className="min-h-[70vh] bg-stone-50 px-4 py-16">
        <div className="mx-auto max-w-lg rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-950">Your cart is empty</h1>
          <p className="mt-2 text-sm text-gray-500">Add products before continuing to checkout.</p>
          <button onClick={() => navigate('/')} className="mt-6 rounded-xl bg-green-700 px-6 py-3 font-semibold text-white">Continue shopping</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#ecfdf3,_#fafaf9_42%)] px-4 py-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <button onClick={() => navigate('/cart')} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-green-800">
          <ArrowLeft size={18} /> Back to cart
        </button>
        <section className="overflow-hidden rounded-[2rem] border border-green-100 bg-white shadow-xl shadow-green-950/5">
          <div className="bg-green-800 px-6 py-7 text-white sm:px-10">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15"><LockKeyhole size={22} /></span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-200">Secure checkout</p>
                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Complete your order with Wix</h1>
              </div>
            </div>
          </div>
          <div className="grid gap-8 p-6 sm:p-10 md:grid-cols-[1fr_0.8fr]">
            <div>
              <h2 className="text-lg font-bold text-gray-950">Order summary</h2>
              <div className="mt-4 space-y-3">
                {cart.map(item => (
                  <div key={item.wix_line_item_id || item.id} className="flex items-start justify-between gap-4 text-sm">
                    <span className="text-gray-600">{item.name_en} <span className="text-gray-400">x {item.quantity}</span></span>
                    <span className="shrink-0 font-semibold text-gray-900">{formatMoney(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-stone-200 pt-5 text-lg font-bold">
                <span>Cart subtotal</span><span>{formatMoney(totalPrice)}</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-gray-500">Final shipping, taxes, coupons, loyalty rewards, and payment options are calculated by Wix.</p>
            </div>
            <div className="rounded-3xl bg-stone-50 p-5">
              <ShieldCheck className="text-green-700" size={28} />
              <h2 className="mt-4 text-lg font-bold text-gray-950">One trusted checkout</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">Wix securely handles your delivery details, discount eligibility, payment, and order confirmation.</p>
              {(error || syncError) && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error || syncError}</p>}
              <button onClick={continueToWix} disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-700 px-5 py-4 font-bold text-white shadow-lg shadow-green-900/15 transition hover:bg-green-800 disabled:cursor-wait disabled:opacity-60">
                {loading ? 'Opening Wix checkout...' : 'Continue securely'} {!loading && <ExternalLink size={18} />}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
