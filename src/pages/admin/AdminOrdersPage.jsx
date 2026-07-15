import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import AdminLayout from '../../components/AdminLayout';
import { Eye, Clock, CheckCircle2, XCircle } from 'lucide-react';

const STATUS_CONFIG = {
  pending: { cls: 'bg-amber-50 text-amber-700 border border-amber-200', icon: Clock },
  confirmed: { cls: 'bg-blue-50 text-blue-700 border border-blue-200', icon: Clock },
  packed: { cls: 'bg-violet-50 text-violet-700 border border-violet-200', icon: Clock },
  shipped: { cls: 'bg-cyan-50 text-cyan-700 border border-cyan-200', icon: Clock },
  fulfilled: { cls: 'bg-green-50 text-green-700 border border-green-200', icon: CheckCircle2 },
  cancelled: { cls: 'bg-red-50 text-red-500 border border-red-200', icon: XCircle },
};

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'packed', 'shipped', 'fulfilled', 'cancelled'];

function StatusBadge({ status }) {
  const { cls, icon: Icon } = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize ' + cls}>
      <Icon size={11} />
      {status}
    </span>
  );
}

export default function AdminOrdersPage() {
  const { orders, updateOrderStatus } = useAdmin();
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  const filtered = orders
    .filter(o => filterStatus === 'all' || o.status === filterStatus)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await updateOrderStatus(id, newStatus);
    } catch (error) {
      console.error('Failed to update order status', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = s === 'all' ? orders.length : orders.filter(o => o.status === s).length;
    return acc;
  }, {});

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-5xl">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-400 text-sm">{orders.length} total orders</p>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 flex-wrap bg-white rounded-2xl border border-gray-100 p-2">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ' +
                (filterStatus === s ? 'bg-green-700 text-white' : 'text-gray-500 hover:bg-gray-100')}
            >
              {s === 'all' ? 'All' : s}
              <span className={'text-xs px-1.5 py-0.5 rounded-full ' +
                (filterStatus === s ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500')}>
                {counts[s]}
              </span>
            </button>
          ))}
        </div>

        {/* Orders table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="text-left text-gray-400 font-medium px-5 py-3.5 text-xs uppercase tracking-wide">Order</th>
                  <th className="text-left text-gray-400 font-medium px-5 py-3.5 text-xs uppercase tracking-wide">Customer</th>
                  <th className="text-left text-gray-400 font-medium px-5 py-3.5 text-xs uppercase tracking-wide">Items</th>
                  <th className="text-left text-gray-400 font-medium px-5 py-3.5 text-xs uppercase tracking-wide">Total</th>
                  <th className="text-left text-gray-400 font-medium px-5 py-3.5 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left text-gray-400 font-medium px-5 py-3.5 text-xs uppercase tracking-wide">Date</th>
                  <th className="text-right text-gray-400 font-medium px-5 py-3.5 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 size={32} className="text-gray-200" />
                        <p className="font-medium">No orders found</p>
                      </div>
                    </td>
                  </tr>
                ) : (() => {
                  const maxTotal = Math.max(...filtered.map(o => o.total), 1);
                  return filtered.map(order => {
                    const rowBorder = order.status === 'pending'
                      ? 'border-l-4 border-amber-400'
                      : order.status === 'fulfilled'
                      ? 'border-l-4 border-green-500'
                      : 'border-l-4 border-red-400';
                    const heatOpacity = Math.max(0.03, (order.total / maxTotal) * 0.12);
                    const heatBg = order.total > maxTotal * 0.7 ? `rgba(34,197,94,${heatOpacity})` : 'transparent';
                    return (
                      <tr key={order.id}
                        className={'hover:bg-gray-50/80 transition-colors ' + rowBorder + (updatingId === order.id ? ' opacity-50' : '')}
                        style={{ backgroundColor: heatBg }}>
                        <td className="px-5 py-4">
                          <span className="font-bold text-gray-900">{order.order_number}</span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-800 text-sm">{order.customer_name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{order.customer_phone}</p>
                        </td>
                        <td className="px-5 py-4 text-gray-500 text-sm">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                        <td className="px-5 py-4">
                          <span className={`font-bold text-sm ${order.total > maxTotal * 0.7 ? 'text-green-700' : 'text-gray-900'}`}>
                            NT${order.total.toLocaleString()}
                          </span>
                          {order.total > maxTotal * 0.7 && (
                            <span className="ml-1.5 text-[9px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-bold">HIGH</span>
                          )}
                        </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                        <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">{formatDate(order.created_at)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {order.status !== 'fulfilled' && order.status !== 'cancelled' && (
                              <>
                                <button onClick={() => handleStatusChange(order.id, 'confirmed')}
                                  className="text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors">
                                  ⇢ Confirm
                                </button>
                                <button onClick={() => handleStatusChange(order.id, 'packed')}
                                  className="text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 px-2.5 py-1.5 rounded-lg transition-colors">
                                  ⇢ Pack
                                </button>
                                <button onClick={() => handleStatusChange(order.id, 'shipped')}
                                  className="text-xs font-medium text-cyan-700 bg-cyan-50 hover:bg-cyan-100 px-2.5 py-1.5 rounded-lg transition-colors">
                                  ⇢ Ship
                                </button>
                                <button onClick={() => handleStatusChange(order.id, 'fulfilled')}
                                  className="text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg transition-colors">
                                  ✓ Fulfil
                                </button>
                                <button onClick={() => handleStatusChange(order.id, 'cancelled')}
                                  className="text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors">
                                  ✕ Cancel
                                </button>
                              </>
                            )}
                            <button onClick={() => navigate('/admin/orders/' + order.id)}
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg transition-colors">
                              <Eye size={12} /> View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-50 text-xs text-gray-400">
              {filtered.length} of {orders.length} orders
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
