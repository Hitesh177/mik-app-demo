import { useEffect, useMemo, useState } from 'react';
import { PlusCircle, Pencil, Trash2, LayoutPanelTop, Eye, RotateCcw } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { useAdmin } from '../../context/AdminContext';

const EMPTY_FORM = {
  title: '',
  subtitle: '',
  tag: '',
  cta_label: '',
  href: '/',
  emoji: '✨',
  bg_from: 'from-green-700',
  bg_to: 'to-green-900',
  accent: 'bg-white/20',
  sort_order: 0,
  active: true,
  start_at: '',
  end_at: '',
};

const BG_OPTIONS = [
  'from-green-700',
  'from-orange-500',
  'from-amber-600',
  'from-teal-600',
  'from-indigo-600',
];

const BG_TO_OPTIONS = [
  'to-green-900',
  'to-red-600',
  'to-yellow-500',
  'to-cyan-700',
  'to-violet-700',
];

const ACCENT_OPTIONS = ['bg-white/20', 'bg-white/25', 'bg-white/30', 'bg-black/10'];

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

export default function AdminOffersPage() {
  const { offers, addOffer, updateOffer, deleteOffer, reloadOffers } = useAdmin();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!offers || offers.length === 0) {
      reloadOffers().catch(() => {});
    }
  }, [offers, reloadOffers]);

  const sortedOffers = useMemo(
    () => [...(offers || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [offers],
  );

  const startEdit = (offer) => {
    setEditingId(offer.id);
    setForm({
      title: offer.title || '',
      subtitle: offer.subtitle || '',
      tag: offer.tag || '',
      cta_label: offer.cta_label || '',
      href: offer.href || '/',
      emoji: offer.emoji || '✨',
      bg_from: offer.bg_from || 'from-green-700',
      bg_to: offer.bg_to || 'to-green-900',
      accent: offer.accent || 'bg-white/20',
      sort_order: offer.sort_order ?? 0,
      active: Boolean(offer.active),
      start_at: toIsoInput(offer.start_at),
      end_at: toIsoInput(offer.end_at),
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const validate = () => {
    if (!form.title.trim()) return 'Offer title is required';
    if (!form.cta_label.trim()) return 'CTA label is required';
    if (!form.href.trim()) return 'Destination URL is required';
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
      sort_order: Number(form.sort_order),
      active: Boolean(form.active),
      start_at: toIso(form.start_at),
      end_at: toIso(form.end_at),
    };
    try {
      if (editingId) {
        const updated = await updateOffer(editingId, payload);
        setMessage(`Updated ${updated.title}`);
      } else {
        const created = await addOffer(payload);
        setMessage(`Created ${created.title}`);
      }
      resetForm();
    } catch (err) {
      setError(err.message || 'Failed to save offer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this homepage offer?')) return;
    try {
      await deleteOffer(id);
      if (editingId === id) resetForm();
      setMessage('Offer deleted');
    } catch (err) {
      setError(err.message || 'Failed to delete offer');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Home Offers</h1>
            <p className="text-gray-500 text-sm">Control the hero banners that appear on the storefront homepage.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 px-3 py-1.5">
            <Eye size={14} />
            Live homepage feed
          </div>
        </div>

        <div className="grid xl:grid-cols-[1.05fr_0.95fr] gap-5">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-900">{editingId ? 'Edit Offer' : 'Create Offer'}</h2>
                <p className="text-xs text-gray-500">These cards reflect directly on the homepage hero carousel.</p>
              </div>
              {editingId && (
                <button type="button" onClick={resetForm} className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700">
                  <RotateCcw size={13} />
                  Cancel edit
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="Authentic Indian Spices" />
              <Field label="Tag" value={form.tag} onChange={v => setForm(f => ({ ...f, tag: v }))} placeholder="Freshly Imported" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
              <textarea className="input-field min-h-24 resize-none" value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Hand-picked from India's finest farms" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Field label="CTA Label" value={form.cta_label} onChange={v => setForm(f => ({ ...f, cta_label: v }))} placeholder="Shop Now" />
              <Field label="Hero Link" value={form.href} onChange={v => setForm(f => ({ ...f, href: v }))} placeholder="/category/spices" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Emoji" value={form.emoji} onChange={v => setForm(f => ({ ...f, emoji: v }))} placeholder="🌶️" />
              <Field label="Sort Order" type="number" value={form.sort_order} onChange={v => setForm(f => ({ ...f, sort_order: v }))} placeholder="0" />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <SelectField label="Gradient Start" value={form.bg_from} onChange={v => setForm(f => ({ ...f, bg_from: v }))} options={BG_OPTIONS} />
              <SelectField label="Gradient End" value={form.bg_to} onChange={v => setForm(f => ({ ...f, bg_to: v }))} options={BG_TO_OPTIONS} />
              <SelectField label="Accent" value={form.accent} onChange={v => setForm(f => ({ ...f, accent: v }))} options={ACCENT_OPTIONS} />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <Field label="Start At" type="datetime-local" value={form.start_at} onChange={v => setForm(f => ({ ...f, start_at: v }))} />
              <Field label="End At" type="datetime-local" value={form.end_at} onChange={v => setForm(f => ({ ...f, end_at: v }))} />
              <ToggleField label="Active" checked={form.active} onChange={v => setForm(f => ({ ...f, active: v }))} />
            </div>

            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            {message && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-700 px-4 py-3 text-white font-semibold disabled:opacity-60"
            >
              <PlusCircle size={16} />
              {saving ? 'Saving...' : editingId ? 'Update Offer' : 'Create Offer'}
            </button>
          </form>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <LayoutPanelTop size={16} className="text-green-700" />
                <h2 className="font-semibold text-gray-900">Homepage Hero Preview</h2>
              </div>
              <div className={`rounded-3xl overflow-hidden bg-gradient-to-r ${form.bg_from} ${form.bg_to} text-white p-5 shadow-lg`}>
                <div className="inline-flex items-center gap-2 text-[11px] font-bold px-2.5 py-1 rounded-full mb-3 bg-white/20 uppercase tracking-widest">
                  {form.tag || 'Tag'}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="max-w-xs">
                    <h3 className="text-2xl font-black whitespace-pre-line">{form.title || 'Your offer title'}</h3>
                    <p className="text-sm text-white/80 mt-2">{form.subtitle || 'Offer description'}</p>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white text-gray-900 font-bold px-4 py-2">
                      {form.cta_label || 'Call to action'}
                    </div>
                  </div>
                  <div className="text-6xl select-none">{form.emoji || '✨'}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Offers</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {sortedOffers.length === 0 ? (
                  <div className="p-6 text-sm text-gray-400">No offers yet.</div>
                ) : sortedOffers.map(offer => (
                  <div key={offer.id} className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900">{offer.title}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${offer.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {offer.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">{offer.tag} • {offer.cta_label}</p>
                        <p className="text-xs text-gray-400 mt-1">{offer.href} • {offer.bg_from} / {offer.bg_to}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(offer)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-green-700">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(offer.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5">Sort #{offer.sort_order ?? 0}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5">{offer.emoji}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5">{offer.accent}</span>
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
