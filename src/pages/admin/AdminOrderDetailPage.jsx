import { useParams, useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import AdminLayout from '../../components/AdminLayout';
import { ArrowLeft, User, Phone, MapPin, Package, CreditCard, CheckCircle, XCircle, Clock, ArrowRight, ReceiptText } from 'lucide-react';

const STATUS_BADGE = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  packed: 'bg-violet-100 text-violet-700',
  shipped: 'bg-cyan-100 text-cyan-700',
  fulfilled: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500',
};

const STATUS_FLOW = [
  { key: 'pending', label: 'Placed', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: ReceiptText },
  { key: 'packed', label: 'Packed', icon: Package },
  { key: 'shipped', label: 'Out for delivery', icon: ArrowRight },
  { key: 'fulfilled', label: 'Delivered', icon: CheckCircle },
];

function Timeline({ events }) {
  const items = Array.isArray(events) ? events : [];
  return (
    <div className="space-y-3">
      {STATUS_FLOW.map(step => {
        const event = items.find(e => e.status === step.key);
        const done = Boolean(event);
        const Icon = step.icon;
        return (
          <div key={step.key} className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-300'}`}>
              <Icon size={14} />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
              <p className="text-xs text-gray-400">{done ? event.note : 'Waiting for this step'}</p>
            </div>
          </div>
        );
      })}
      {items.find(e => e.status === 'cancelled') && (
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-red-100 text-red-500">
            <XCircle size={14} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-700">Cancelled</p>
            <p className="text-xs text-red-400">{items.find(e => e.status === 'cancelled')?.note}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orders, updateOrderStatus } = useAdmin();
  const order = orders.find(o => o.id === id);

  if (!order) {
    return (
      <AdminLayout>
        <div className="text-center py-20 text-gray-400">Order not found</div>
      </AdminLayout>
    );
  }

  const formatDate = (iso) => new Date(iso).toLocaleString('en-TW', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const handleStatusChange = async (status) => {
    try {
      await updateOrderStatus(order.id, status);
    } catch (error) {
      console.error('Failed to update order status', error);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/orders')} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Order {order.order_number}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[order.status]}`}>
                {order.status}
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-0.5">{formatDate(order.created_at)}</p>
          </div>
        </div>

        {/* Customer info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <h2 className="font-semibold text-gray-800">Customer Details</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <User size={16} className="text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">{order.customer_name}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone size={16} className="text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">{order.customer_phone}</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <MapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">{order.customer_address}</span>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <h2 className="font-semibold text-gray-800">Items Ordered</h2>
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package size={14} className="text-gray-400" />
                  </div>
                  <span className="text-gray-700">{item.name}</span>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <span className="text-gray-400">×{item.quantity}</span>
                  <span className="font-semibold w-20">NT${(item.price * item.quantity).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 space-y-1">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>NT${order.subtotal.toLocaleString()}</span>
            </div>
            {order.coupon_code && (
              <div className="flex justify-between text-sm text-indigo-600">
                <span>Coupon {order.coupon_code}</span>
                <span>-NT${Number(order.coupon_discount_amount || 0).toLocaleString()}</span>
              </div>
            )}
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-amber-600">
                <span>Loyalty discount</span>
                <span>-NT${Number(order.discount_amount || 0).toLocaleString()}</span>
              </div>
            )}
            {order.points_earned > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Points earned</span>
                <span>{order.points_earned}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-500">
              <span>Delivery</span>
              <span className="text-green-700">FREE</span>
            </div>
            <div className="flex justify-between font-bold text-base mt-1">
              <span>Total</span>
              <span>NT${order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <CreditCard size={18} className="text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-800">Payment Method</p>
              <p className="text-sm text-gray-500 capitalize">{order.payment_method.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <h2 className="font-semibold text-gray-800">Tracking Timeline</h2>
          <Timeline events={order.events} />
        </div>

        {/* Status actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <h2 className="font-semibold text-gray-800">Update Status</h2>
          <div className="grid grid-cols-2 gap-2">
            {['confirmed', 'packed', 'shipped', 'fulfilled'].map(status => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={order.status === status}
                className="flex items-center justify-center gap-2 bg-gray-50 text-gray-700 py-3 rounded-xl text-sm font-semibold hover:bg-gray-100 disabled:opacity-50"
              >
                <CheckCircle size={16} />
                {status === 'fulfilled' ? 'Mark Delivered' : `Mark ${status}`}
              </button>
            ))}
            <button
              onClick={() => handleStatusChange('cancelled')}
              disabled={order.status === 'cancelled'}
              className="flex items-center justify-center gap-2 border border-red-300 text-red-600 py-3 rounded-xl text-sm font-semibold hover:bg-red-50 disabled:opacity-50 col-span-2"
            >
              <XCircle size={16} />
              Cancel Order
            </button>
          </div>
        </div>

        {order.status === 'fulfilled' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle size={20} className="text-green-600" />
            <p className="text-green-800 font-medium text-sm">This order has been fulfilled</p>
          </div>
        )}

        {order.status === 'cancelled' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
            <XCircle size={20} className="text-red-500" />
            <p className="text-red-700 font-medium text-sm">This order was cancelled</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
