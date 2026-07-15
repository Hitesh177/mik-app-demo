import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import AdminLayout from '../../components/AdminLayout';
import { PlusCircle, Upload, Search, Pencil, Trash2, Check } from 'lucide-react';
import { CATEGORIES } from '../../data/mockData';

function StockBar({ stock }) {
  const max = 100;
  const pct = Math.min(100, (stock / max) * 100);
  const color = stock === 0 ? 'bg-red-400' : stock <= 10 ? 'bg-amber-400' : 'bg-green-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-medium ${stock === 0 ? 'text-red-500' : stock <= 10 ? 'text-amber-600' : 'text-gray-700'}`}>
        {stock === 0 ? '—' : stock}
      </span>
    </div>
  );
}

function InlineStockEdit({ product, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(product.stock));

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="text-left group">
        <StockBar stock={product.stock} />
        <span className="text-[9px] text-gray-300 group-hover:text-blue-400 transition-colors">click to edit</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        value={val}
        onChange={e => setVal(e.target.value)}
        className="w-16 border border-blue-400 rounded-lg px-2 py-1 text-xs outline-none text-center"
        autoFocus
        onKeyDown={e => {
          if (e.key === 'Enter') { onSave(parseInt(val, 10) || 0); setEditing(false); }
          if (e.key === 'Escape') setEditing(false);
        }}
      />
      <button onClick={() => { onSave(parseInt(val, 10) || 0); setEditing(false); }}
        className="p-1 bg-green-600 text-white rounded-lg hover:bg-green-700">
        <Check size={11} />
      </button>
    </div>
  );
}

const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'price_asc', label: 'Price (Low-High)' },
  { value: 'price_desc', label: 'Price (High-Low)' },
  { value: 'stock', label: 'Stock' },
];

export default function AdminProductsPage() {
  const { products, deleteProduct, updateProduct } = useAdmin();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStock, setFilterStock] = useState('all');
  const [sort, setSort] = useState('name');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const filtered = products
    .filter(p => {
      if (filterCategory !== 'all' && p.category !== filterCategory) return false;
      if (filterStock === 'in_stock' && p.stock === 0) return false;
      if (filterStock === 'out_of_stock' && p.stock > 0) return false;
      if (search && !p.name_en.toLowerCase().includes(search.toLowerCase()) && !p.name_zh.includes(search)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'name') return a.name_en.localeCompare(b.name_en);
      if (sort === 'price_asc') return a.price - b.price;
      if (sort === 'price_desc') return b.price - a.price;
      if (sort === 'stock') return b.stock - a.stock;
      return 0;
    });

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-500 text-sm">{products.length} total products</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/admin/products/bulk-upload')}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-50"
            >
              <Upload size={15} />
              <span className="hidden sm:inline">CSV Upload</span>
            </button>
            <button
              onClick={() => navigate('/admin/products/new')}
              className="flex items-center gap-2 bg-green-700 text-white px-3 py-2 rounded-xl text-sm font-medium"
            >
              <PlusCircle size={15} />
              Add Product
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2 flex-1 min-w-[180px]">
            <Search size={15} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              className="bg-transparent text-sm outline-none w-full"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none bg-white"
          >
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={filterStock}
            onChange={e => setFilterStock(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none bg-white"
          >
            <option value="all">All Stock</option>
            <option value="in_stock">In Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none bg-white"
          >
            {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-gray-500 font-medium px-4 py-3">Product</th>
                  <th className="text-left text-gray-500 font-medium px-4 py-3">Category</th>
                  <th className="text-left text-gray-500 font-medium px-4 py-3">Price</th>
                  <th className="text-left text-gray-500 font-medium px-4 py-3">Stock</th>
                  <th className="text-right text-gray-500 font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">No products found</td>
                  </tr>
                ) : filtered.map(product => (
                  <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${product.stock === 0 ? 'bg-red-50/30' : product.stock <= 10 ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                          {product.image_url
                            ? <img src={product.image_url} alt={product.name_en} className="w-full h-full object-contain p-1" />
                            : <div className="w-full h-full flex items-center justify-center text-lg">🛒</div>
                          }
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{product.name_en}</p>
                          <p className="text-gray-400 text-xs">{product.name_zh}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                        {CATEGORIES.find(c => c.id === product.category)?.name || product.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">NT${product.price}</td>
                    <td className="px-4 py-3">
                      <InlineStockEdit
                        product={product}
                        onSave={async (newStock) => {
                          setBusyId(product.id);
                          try {
                            await updateProduct?.(product.id, { stock: newStock });
                          } catch (error) {
                            console.error('Failed to update stock', error);
                          } finally {
                            setBusyId(null);
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => navigate(`/admin/products/${product.id}`)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setDeleteConfirm(product.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-50 text-xs text-gray-400">
              Showing {filtered.length} of {products.length} products
            </div>
          )}
        </div>

        {/* Delete confirm modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
              <h3 className="font-bold text-gray-900 text-lg">Delete Product?</h3>
              <p className="text-gray-500 text-sm mt-1">This action cannot be undone.</p>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setBusyId(deleteConfirm);
                    try {
                      await deleteProduct(deleteConfirm);
                      setDeleteConfirm(null);
                    } catch (error) {
                      console.error('Failed to delete product', error);
                    } finally {
                      setBusyId(null);
                    }
                  }}
                  className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-60"
                  disabled={busyId === deleteConfirm}
                >
                  {busyId === deleteConfirm ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
