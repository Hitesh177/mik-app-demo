import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import AdminLayout from '../../components/AdminLayout';
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react';

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { products: [], errors: ['CSV must have a header row and at least one data row'] };

  const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  const required = ['name_en', 'price', 'category', 'stock'];
  const missing = required.filter(r => !header.includes(r));
  if (missing.length > 0) {
    return { products: [], errors: [`Missing required columns: ${missing.join(', ')}`] };
  }

  const products = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const row = {};
    header.forEach((h, idx) => { row[h] = values[idx] || ''; });

    if (!row.name_en) { errors.push(`Row ${i + 1}: name_en is required`); continue; }
    if (isNaN(row.price) || !row.price) { errors.push(`Row ${i + 1}: invalid price`); continue; }

    products.push({
      name_en: row.name_en,
      name_zh: row.name_zh || '',
      price: Number(row.price),
      category: row.category || 'spices',
      stock: Number(row.stock) || 0,
      image_url: row.image_url || null,
      badge: row.badge || null,
    });
  }

  return { products, errors };
}

export default function AdminBulkUploadPage() {
  const navigate = useNavigate();
  const { importProducts } = useAdmin();
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [parseErrors, setParseErrors] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { products, errors } = parseCSV(ev.target.result);
      setPreview(products);
      setParseErrors(errors);
    };
    reader.readAsText(f);
  };

  const handleUpload = async () => {
    if (!preview || preview.length === 0) return;
    setLoading(true);
    try {
      await importProducts(preview);
      setResult({ imported: preview.length, errors: parseErrors.length });
      setFile(null);
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csv = 'name_en,name_zh,price,category,stock,image_url,badge\nBlack Cardamom Seed,黑荳蔻,140,spices,25,,Hot\nBasmati Rice 5kg,印度香米 5公斤,850,rice,20,,';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mik_products_template.csv';
    a.click();
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/products')} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Upload CSV</h1>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
          <p className="text-blue-800 font-semibold text-sm">CSV Format</p>
          <p className="text-blue-700 text-sm">Required columns: <code className="bg-blue-100 px-1 rounded">name_en, price, category, stock</code></p>
          <p className="text-blue-700 text-sm">Optional: <code className="bg-blue-100 px-1 rounded">name_zh, image_url, badge</code></p>
          <p className="text-blue-600 text-xs">Valid categories: fresh-frozen, atta-flour, dal-pulses, spices, masala, rice-oils, pickles, tea-coffee, instant-food, papad-biscuits, noodles-sauces, snacks, sweets, ready-to-eat, toiletry, puja, household, mouth-freshener</p>
          <button onClick={downloadTemplate} className="flex items-center gap-2 text-blue-700 font-medium text-sm mt-2">
            <Download size={14} />
            Download template CSV
          </button>
        </div>

        {/* File upload */}
        <div
          className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          <Upload size={32} className="mx-auto text-gray-400 mb-3" />
          <p className="font-medium text-gray-700">{file ? file.name : 'Click to select CSV file'}</p>
          <p className="text-gray-400 text-sm mt-1">Supports .csv files up to 10MB</p>
        </div>

        {/* Parse errors */}
        {parseErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-1">
            <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-2">
              <AlertCircle size={16} />
              {parseErrors.length} error{parseErrors.length !== 1 ? 's' : ''} found
            </div>
            {parseErrors.map((e, i) => (
              <p key={i} className="text-red-600 text-xs">{e}</p>
            ))}
          </div>
        )}

        {/* Preview */}
        {preview && preview.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <FileText size={16} className="text-gray-500" />
              <span className="font-medium text-sm text-gray-800">Preview: {preview.length} products</span>
            </div>
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Name (EN)</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Name (ZH)</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Price</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Category</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {preview.slice(0, 10).map((p, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">{p.name_en}</td>
                      <td className="px-3 py-2 text-gray-400">{p.name_zh}</td>
                      <td className="px-3 py-2">NT${p.price}</td>
                      <td className="px-3 py-2">{p.category}</td>
                      <td className="px-3 py-2">{p.stock}</td>
                    </tr>
                  ))}
                  {preview.length > 10 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-2 text-center text-gray-400">
                        ... and {preview.length - 10} more
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle size={20} className="text-green-600" />
            <div>
              <p className="text-green-800 font-semibold text-sm">{result.imported} products imported successfully!</p>
              {result.errors > 0 && <p className="text-green-600 text-xs mt-0.5">{result.errors} rows skipped due to errors</p>}
            </div>
          </div>
        )}

        {/* Upload button */}
        {preview && preview.length > 0 && !result && (
          <button
            onClick={handleUpload}
            disabled={loading}
            className="w-full bg-green-700 text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-60"
          >
            {loading ? 'Importing...' : `Import ${preview.length} Products`}
          </button>
        )}
      </div>
    </AdminLayout>
  );
}
