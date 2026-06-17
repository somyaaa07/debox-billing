// src/components/modules/LineItemsEditor.jsx
import React, { useEffect, useState } from 'react';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import { formatCurrency, calcItemTotals } from "../../utils/helpers.js";
import { productService } from '../../services/api';

const emptyItem = { description: '', hsnCode: '', quantity: 1, unit: 'Nos', unitPrice: 0, gstRate: 18, discount: 0, productId: '' };

export default function LineItemsEditor({ value = [], onChange }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    productService.getAll({ limit: 100 }).then(({ data }) => setProducts(data.data || [])).catch(() => {});
  }, []);

  const addItem = () => onChange([...value, { ...emptyItem }]);

  const removeItem = (idx) => onChange(value.filter((_, i) => i !== idx));

  const updateItem = (idx, field, val) => {
    const updated = [...value];
    updated[idx] = { ...updated[idx], [field]: val };

    // Auto-calculate gstAmount and totalPrice
    const item = updated[idx];
    const base = parseFloat(item.unitPrice || 0) * parseFloat(item.quantity || 0);
    const gst = (base * parseFloat(item.gstRate || 0)) / 100;
    const disc = parseFloat(item.discount || 0);
    updated[idx].gstAmount = gst;
    updated[idx].totalPrice = base + gst - disc;

    onChange(updated);
  };

  const selectProduct = (idx, productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const updated = [...value];
    updated[idx] = {
      ...updated[idx],
      productId: product.id,
      description: product.name,
      hsnCode: product.hsnCode || '',
      unitPrice: parseFloat(product.price),
      gstRate: parseFloat(product.gstRate),
      unit: product.unit || 'Nos',
    };
    // Recalculate
    const base = updated[idx].unitPrice * updated[idx].quantity;
    const gst = (base * updated[idx].gstRate) / 100;
    updated[idx].gstAmount = gst;
    updated[idx].totalPrice = base + gst;
    onChange(updated);
  };

  const totals = calcItemTotals(value);

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 w-8">#</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Description</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 w-24">HSN</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 w-20">Qty</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 w-20">Unit</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 w-28">Unit Price</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 w-20">GST %</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 w-24">Total</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {value.map((item, idx) => (
              <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="px-3 py-2 text-slate-400 text-xs">{idx + 1}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-col gap-1">
                    {products.length > 0 && (
                      <select
                        value={item.productId || ''}
                        onChange={(e) => selectProduct(idx, e.target.value)}
                        className="input py-1 text-xs text-slate-500"
                      >
                        <option value="">— Select product —</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    )}
                    <input
                      value={item.description}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      placeholder="Item description"
                      className="input py-1.5"
                    />
                  </div>
                </td>
                <td className="px-3 py-2">
                  <input value={item.hsnCode || ''} onChange={(e) => updateItem(idx, 'hsnCode', e.target.value)} placeholder="HSN" className="input py-1.5" />
                </td>
                <td className="px-3 py-2">
                  <input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} className="input py-1.5" />
                </td>
                <td className="px-3 py-2">
                  <select value={item.unit} onChange={(e) => updateItem(idx, 'unit', e.target.value)} className="input py-1.5">
                    {['Nos', 'Kg', 'Ltr', 'Mtr', 'Sqft', 'Project', 'Month', 'Year', 'Hour', 'Day'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)} className="input py-1.5" />
                </td>
                <td className="px-3 py-2">
                  <select value={item.gstRate} onChange={(e) => updateItem(idx, 'gstRate', e.target.value)} className="input py-1.5">
                    {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <span className="font-semibold text-slate-800">{formatCurrency(item.totalPrice || 0)}</span>
                </td>
                <td className="px-3 py-2">
                  <button onClick={() => removeItem(idx)} disabled={value.length === 1} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button type="button" onClick={addItem} className="btn-ghost btn-sm mt-3 text-blue-600 hover:bg-blue-50">
        <Plus size={15} /> Add Line Item
      </button>

      {/* Totals */}
      <div className="mt-4 flex justify-end">
        <div className="w-72 space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>GST</span>
            <span className="font-medium">{formatCurrency(totals.gstAmount)}</span>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount</span>
              <span className="font-medium">-{formatCurrency(totals.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-slate-900 text-base pt-2 border-t border-slate-200">
            <span>Total</span>
            <span>{formatCurrency(totals.totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
