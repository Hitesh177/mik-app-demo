import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, MessageCircle, Phone } from 'lucide-react';
import Confetti from '../components/Confetti';
import SeoHead from '../components/SeoHead';

export default function OrderConfirmationPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const order = state?.order;

  if (!order) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8">
      <SeoHead
        title="Order Confirmed | MIK Store"
        description="Your MIK Store order has been placed successfully."
        robots="noindex,nofollow"
        ogType="website"
      />
      <Confetti />
      <div className="max-w-md w-full space-y-5">
        {/* Success icon */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle size={44} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Order Placed!</h1>
          <p className="text-gray-500 mt-1">Thank you for your order</p>
        </div>

        {/* Order details */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Order ID</span>
            <span className="font-bold text-gray-900">{order.order_number}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Status</span>
            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">
              Pending
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Payment</span>
            <span className="font-medium text-sm capitalize">{order.payment_method.replace('_', ' ')}</span>
          </div>
          {order.coupon_code && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Coupon</span>
              <span className="font-medium text-sm text-indigo-700">{order.coupon_code}</span>
            </div>
          )}
          {order.coupon_discount_amount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Coupon Discount</span>
              <span className="font-medium text-sm text-indigo-700">-{`NT$${Number(order.coupon_discount_amount || 0).toLocaleString()}`}</span>
            </div>
          )}
          {order.points_redeemed > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Loyalty Discount</span>
              <span className="font-medium text-sm text-amber-700">-{`NT$${Number(order.discount_amount || 0).toLocaleString()}`}</span>
            </div>
          )}
          {order.points_earned > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Points Earned</span>
              <span className="font-medium text-sm text-green-700">{order.points_earned}</span>
            </div>
          )}

          <div className="border-t pt-3">
            <p className="text-sm font-semibold text-gray-700 mb-2">Items Ordered</p>
            <div className="space-y-1">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.name} × {item.quantity}</span>
                  <span className="font-medium">NT${(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-3 flex justify-between font-bold">
            <span>Total</span>
            <span>NT${order.total.toLocaleString()}</span>
          </div>

          <div className="border-t pt-3">
            <p className="text-sm font-semibold text-gray-700 mb-1">Delivery To</p>
            <p className="text-sm text-gray-600">{order.customer_name}</p>
            <p className="text-sm text-gray-600">{order.customer_address}</p>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-3">
          <p className="text-green-800 font-semibold text-sm">Need help with your order?</p>
          <div className="flex gap-3">
            <a
              href="https://wa.me/886912345678"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
            <a
              href="tel:+886912345678"
              className="flex-1 flex items-center justify-center gap-2 bg-white border border-green-300 text-green-700 py-2.5 rounded-xl text-sm font-medium"
            >
              <Phone size={16} />
              Call Us
            </a>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full bg-green-700 text-white font-bold py-4 rounded-2xl text-base"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
