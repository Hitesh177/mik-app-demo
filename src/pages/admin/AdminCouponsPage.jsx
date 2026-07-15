import { useEffect, useMemo, useState } from 'react';
import { PlusCircle, Pencil, Trash2, ShieldCheck, Ticket, CircleAlert, RotateCcw } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { api } from '../../lib/api';

const EMPTY_FORM = {
  code: '',
  title: '',
  description: '',
  discount_type: 'percent',
  discount_value: 10,
  min_order_amount: 0,
  max_discount_amount: 0,
  usage_limit_total: 0,
  usage_limit_per_customer: 0,
  start_at: '',
  end_at: '',
  active: true,
  first_order_only: false,
  apply_scope: 'order',
  target_value: '',
  stackable: true,
};

function toIsoInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIso(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function money(value) {
  return `NT$${Number(value || 0).toLocaleString()}`;
}

function ruleSummary(coupon) {
  const bits = [];
  if (coupon.discount_type === 'percent') bits.push(`${coupon.discount_value}% off`);
  if (coupon.discount_type === 'fixed') bits.push(`${money(coupon.discount_value)} off`);
  if (coupon.discount_type === 'free_shipping') bits.push('Free shipping');
  if (coupon.apply_scope === 'category') bits.push(`Category: ${coupon.target_value}`);
  if (coupon.apply_scope === 'product') bits.push('Selected products');
  if (coupon.min_order_amount) bits.push(`Min ${money(coupon.min_order_amount)}`);
  if (coupon.max_discount_amount) bits.push(`Max ${money(coupon.max_discount_amount)}`);
  if (coupon.first_order_only) bits.push('First order only');
  if (coupon.usage_limit_total) bits.push(`Total limit ${coupon.usage_limit_total}`);
  if (coupon.usage_limit_per_customer) bits.push(`Per customer ${coupon.usage_limit_per_customer}`);
  return bits.join(' • ');
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const data = await api.getCoupons();
      setCoupons(Array.isArray(data.coupons) ? data.coupons : []);
    } catch (err) {
      setError(err.message || 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const activeCount = useMemo(() => coupons.filter(c => c.active).length, [coupons]);

  const startEdit = (coupon) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code || '',
      title: coupon.title || '',
      description: coupon.description || '',
      discount_type: coupon.discount_type || 'percent',
      discount_value: coupon.discount_value ?? 0,
      min_order_amount: coupon.min_order_amount ?? 0,
      max_discount_amount: coupon.max_discount_amount ?? 0,
      usage_limit_total: coupon.usage_limit_total ?? 0,
      usage_limit_per_customer: coupon.usage_limit_per_customer ?? 0,
      start_at: toIsoInput(coupon.start_at),
      end_at: toIsoInput(coupon.end_at),
      active: Boolean(coupon.active),
      first_order_only: Boolean(coupon.first_order_only),
      apply_scope: coupon.apply_scope || 'order',
      target_value: coupon.target_value || '',
      stackable: Boolean(coupon.stackable),
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const validate = () => {
    if (!form.code.trim()) return 'Coupon code is required';
    if (!form.title.trim()) return 'Coupon title is required';
    if (form.discount_type !== 'free_shipping' && Number(form.discount_value) <= 0) return 'Discount value must be greater than zero';
    if ((form.apply_scope === 'category' || form.apply_scope === 'product') && !form.target_value.trim()) return 'Target value is required for this scope';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      code: form.code.trim().toUpperCase(),
      discount_value: Number(form.discount_value),
      min_order_amount: Number(form.min_order_amount),
      max_discount_amount: Number(form.max_discount_amount),
      usage_limit_total: Number(form.usage_limit_total),
      usage_limit_per_customer: Number(form.usage_limit_per_customer),
      start_at: toIso(form.start_at),
      end_at: toIso(form.end_at),
      active: Boolean(form.active),
      first_order_only: Boolean(form.first_order_only),
      stackable: Boolean(form.stackable),
      target_value: form.target_value.trim(),
    };
    try {
      if (editingId) {
        const { coupon } = await api.updateCoupon(editingId, payload);
        setCoupons(prev => prev.map(item => (String(item.id) === String(editingId) ? coupon : item)));
        setMessage('Coupon updated');
      } else {
        const { coupon } = await api.createCoupon(payload);
        setCoupons(prev => [coupon, ...prev]);
        setMessage('Coupon created');
      }
      resetForm();
    } catch (err) {
      setError(err.message || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await api.deleteCoupon(id);
      setCoupons(prev => prev.filter(c => String(c.id) !== String(id)));
      if (editingId === id) resetForm();
      setMessage('Coupon deleted');
    } catch (err) {
      setError(err.message || 'Failed to delete coupon');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
            <p className="text-gray-500 text-sm">Create rules-driven coupon codes for checkout.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold rounded-full bg-green-50 text-green-700 px-3 py-1.5">
            <ShieldCheck size={14} />
            {activeCount} active
          </div>
        </div>

        <div className="grid xl:grid-cols-[1.05fr_0.95fr] gap-5">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-900">{editingId ? 'Edit Coupon' : 'Create Coupon'}</h2>
                <p className="text-xs text-gray-500">All validation rules are enforced by the backend.</p>
              </div>
              {editingId && (
                <button type="button" onClick={resetForm} className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700">
                  <RotateCcw size={13} />
                  Cancel edit
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Coupon Code" value={form.code} onChange={v => setForm(f => ({ ...f, code: v }))} placeholder="SAVE10" />
              <Field label="Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="10% off groceries" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea className="input-field min-h-24 resize-none" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional internal note or marketing message" />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <SelectField label="Discount Type" value={form.discount_type} onChange={v => setForm(f => ({ ...f, discount_type: v }))} options={['percent', 'fixed', 'free_shipping']} />
              <Field label="Discount Value" type="number" value={form.discount_value} onChange={v => setForm(f => ({ ...f, discount_value: v }))} placeholder="10" />
              <SelectField label="Scope" value={form.apply_scope} onChange={v => setForm(f => ({ ...f, apply_scope: v }))} options={['order', 'category', 'product']} />
            </div>

            {(form.apply_scope === 'category' || form.apply_scope === 'product') && (
              <Field
                label={form.apply_scope === 'category' ? 'Category ID' : 'Product IDs (comma separated)'}
                value={form.target_value}
                onChange={v => setForm(f => ({ ...f, target_value: v }))}
                placeholder={form.apply_scope === 'category' ? 'spices' : '1,2,3'}
              />
            )}

            <div className="grid md:grid-cols-3 gap-4">
              <Field label="Min Order Amount" type="number" value={form.min_order_amount} onChange={v => setForm(f => ({ ...f, min_order_amount: v }))} placeholder="0" />
              <Field label="Max Discount Cap" type="number" value={form.max_discount_amount} onChange={v => setForm(f => ({ ...f, max_discount_amount: v }))} placeholder="0" />
              <Field label="Total Usage Limit" type="number" value={form.usage_limit_total} onChange={v => setForm(f => ({ ...f, usage_limit_total: v }))} placeholder="0" />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <Field label="Per Customer Limit" type="number" value={form.usage_limit_per_customer} onChange={v => setForm(f => ({ ...f, usage_limit_per_customer: v }))} placeholder="0" />
              <Field label="Start At" type="datetime-local" value={form.start_at} onChange={v => setForm(f => ({ ...f, start_at: v }))} />
              <Field label="End At" type="datetime-local" value={form.end_at} onChange={v => setForm(f => ({ ...f, end_at: v }))} />
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <ToggleField label="Active" checked={form.active} onChange={v => setForm(f => ({ ...f, active: v }))} />
              <ToggleField label="First order only" checked={form.first_order_only} onChange={v => setForm(f => ({ ...f, first_order_only: v }))} />
              <ToggleField label="Stackable with loyalty" checked={form.stackable} onChange={v => setForm(f => ({ ...f, stackable: v }))} />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-700 px-4 py-3 text-white font-semibold disabled:opacity-60"
            >
              <PlusCircle size={16} />
              {saving ? 'Saving...' : editingId ? 'Update Coupon' : 'Create Coupon'}
            </button>
          </form>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Ticket size={16} className="text-green-700" />
                <h2 className="font-semibold text-gray-900">Rules you can set</h2>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Percentage discount or fixed amount discount.</li>
                <li>Min order amount and max discount cap.</li>
                <li>Scope by entire order, a single category, or selected products.</li>
                <li>Start/end date windows and global usage limits.</li>
                <li>Per-customer limit, first-order-only, and stackable loyalty option.</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Coupon Codes</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {loading ? (
                  <div className="p-6 text-sm text-gray-400">Loading coupons...</div>
                ) : coupons.length === 0 ? (
                  <div className="p-6 text-sm text-gray-400 flex items-center gap-2">
                    <CircleAlert size={14} />
                    No coupons yet.
                  </div>
                ) : coupons.map(coupon => (
                  <div key={coupon.id} className="p-5 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900">{coupon.code}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${coupon.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {coupon.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">{coupon.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{ruleSummary(coupon)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(coupon)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-green-700">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(coupon.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px] text-gray-500">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5">Used {coupon.times_used || 0}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5">{coupon.discount_type}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5">{coupon.apply_scope}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function Field({ label, value, onChange, placeholder = '', type = 'text' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        className="input-field"
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(type === 'number' ? e.target.valueAsNumber || 0 : e.target.value)}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select className="input-field" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function ToggleField({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3 cursor-pointer hover:bg-gray-50">
      <input type="checkbox" className="accent-green-700" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
  );
}
