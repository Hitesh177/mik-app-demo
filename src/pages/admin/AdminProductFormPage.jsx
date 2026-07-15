import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import AdminLayout from '../../components/AdminLayout';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { CATEGORIES } from '../../data/mockData';

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

export default function AdminProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, addProduct, updateProduct, deleteProduct } = useAdmin();
  const isEdit = Boolean(id);
  const existing = isEdit ? products.find(p => p.id === id) : null;

  const [form, setForm] = useState({
    name_en: '',
    name_zh: '',
    seo_slug: '',
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    seo_h1: '',
    seo_content: '',
    price: '',
    category: 'spices',
    stock: '',
    image_url: '',
    badge: '',
  });
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        name_en: existing.name_en || '',
        name_zh: existing.name_zh || '',
        seo_slug: existing.seo_slug || '',
        seo_title: existing.seo_title || '',
        seo_description: existing.seo_description || '',
        seo_keywords: existing.seo_keywords || '',
        seo_h1: existing.seo_h1 || '',
        seo_content: existing.seo_content || '',
        price: existing.price || '',
        category: existing.category || 'spices',
        stock: existing.stock ?? '',
        image_url: existing.image_url || '',
        badge: existing.badge || '',
      });
    }
  }, [existing]);

  const validate = () => {
    const e = {};
    if (!form.name_en.trim()) e.name_en = 'English name is required';
    if (!form.price || isNaN(form.price)) e.price = 'Valid price is required';
    if (form.stock === '' || isNaN(form.stock)) e.stock = 'Valid stock quantity is required';
    if (form.seo_slug && !slugify(form.seo_slug)) e.seo_slug = 'SEO slug is invalid';
    return e;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const data = {
      ...form,
      seo_slug: form.seo_slug || slugify(form.name_en),
      seo_title: form.seo_title || `${form.name_en} in Taiwan | MIK Store`,
      seo_description: form.seo_description || `Buy ${form.name_en} online in Taiwan from MIK Store. Fast delivery and trusted Indian grocery service.`,
      seo_keywords: form.seo_keywords || `${form.name_en}, ${form.category.replace('-', ' ')}, Indian grocery Taiwan`,
      seo_h1: form.seo_h1 || form.name_en,
      seo_content: form.seo_content || `${form.name_en} is available for quick delivery across Taiwan.`,
      price: Number(form.price),
      stock: Number(form.stock),
      image_url: form.image_url || null,
      badge: form.badge || null,
    };
    setBusy(true);
    try {
      if (isEdit) {
        await updateProduct(id, data);
      } else {
        await addProduct(data);
      }
      setSaved(true);
      setTimeout(() => navigate('/admin/products'), 800);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteProduct(id);
      navigate('/admin/products');
    } finally {
      setBusy(false);
    }
  };

  const BADGE_OPTIONS = ['', 'New', 'Hot', 'Out of stock'];

  return (
    <AdminLayout>
      <div className="max-w-xl space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/products')} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          {/* English Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Product Name (English) *</label>
            <input
              className={`input-field ${errors.name_en ? 'border-red-400' : ''}`}
              placeholder="e.g. Black Cardamom Seed"
              value={form.name_en}
              onChange={e => { setForm(f => ({ ...f, name_en: e.target.value })); setErrors(er => ({ ...er, name_en: '' })); }}
            />
            {errors.name_en && <p className="text-red-500 text-xs mt-1">{errors.name_en}</p>}
          </div>

          {/* Chinese Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Product Name (Chinese)</label>
            <input
              className="input-field"
              placeholder="e.g. 黑荳蔻"
              value={form.name_zh}
              onChange={e => setForm(f => ({ ...f, name_zh: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">SEO Slug</label>
            <input
              className="input-field"
              placeholder="e.g. chana-dal-bengal-gram-907g"
              value={form.seo_slug}
              onChange={e => setForm(f => ({ ...f, seo_slug: e.target.value }))}
            />
            <p className="text-[11px] text-gray-400 mt-1">Used in the public product URL.</p>
          </div>

          {/* Price & Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Price (NT$) *</label>
              <input
                type="number"
                className={`input-field ${errors.price ? 'border-red-400' : ''}`}
                placeholder="140"
                value={form.price}
                onChange={e => { setForm(f => ({ ...f, price: e.target.value })); setErrors(er => ({ ...er, price: '' })); }}
              />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Stock Quantity *</label>
              <input
                type="number"
                className={`input-field ${errors.stock ? 'border-red-400' : ''}`}
                placeholder="25"
                value={form.stock}
                onChange={e => { setForm(f => ({ ...f, stock: e.target.value })); setErrors(er => ({ ...er, stock: '' })); }}
              />
              {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Category</label>
            <select
              className="input-field"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            >
              {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Badge */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Badge (Optional)</label>
            <select
              className="input-field"
              value={form.badge}
              onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
            >
              {BADGE_OPTIONS.map(b => <option key={b} value={b}>{b || 'None'}</option>)}
            </select>
          </div>

          {/* Image URL */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Image URL (Optional)</label>
            <input
              className="input-field"
              placeholder="https://example.com/image.jpg"
              value={form.image_url}
              onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
            />
          </div>

          <div className="space-y-4 pt-1">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">SEO Title</label>
              <input
                className="input-field"
                placeholder="Black Cardamom Seed in Taiwan | MIK Store"
                value={form.seo_title}
                onChange={e => setForm(f => ({ ...f, seo_title: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">SEO Description</label>
              <textarea
                className="input-field min-h-24 resize-none"
                placeholder="A concise search-friendly description."
                value={form.seo_description}
                onChange={e => setForm(f => ({ ...f, seo_description: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">SEO Keywords</label>
              <input
                className="input-field"
                placeholder="chana dal Taiwan, Indian grocery Taiwan"
                value={form.seo_keywords}
                onChange={e => setForm(f => ({ ...f, seo_keywords: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">SEO H1</label>
              <input
                className="input-field"
                placeholder="Chana Dal in Taiwan"
                value={form.seo_h1}
                onChange={e => setForm(f => ({ ...f, seo_h1: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">SEO Content</label>
              <textarea
                className="input-field min-h-32 resize-none"
                placeholder="Long-form content for search engines and shoppers."
                value={form.seo_content}
                onChange={e => setForm(f => ({ ...f, seo_content: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {saved && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm font-medium">
            ✓ Product {isEdit ? 'updated' : 'added'} successfully!
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            type="button"
            disabled={busy}
            className="flex-1 bg-green-700 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-60"
          >
            {busy ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add Product')}
          </button>
          {isEdit && (
            <button
              onClick={() => setDeleteConfirm(true)}
              type="button"
              className="flex items-center gap-2 border border-red-300 text-red-600 px-4 py-3 rounded-xl text-sm font-medium hover:bg-red-50"
            >
              <Trash2 size={15} />
              Delete
            </button>
          )}
        </div>

        {/* Delete confirm */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
              <h3 className="font-bold text-gray-900">Delete Product?</h3>
              <p className="text-gray-500 text-sm mt-1">This action cannot be undone.</p>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setDeleteConfirm(false)} type="button" className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
                <button onClick={handleDelete} type="button" className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-60" disabled={busy}>
                  {busy ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
