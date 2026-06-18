// ─── PurchaseOrderFormPage.jsx ────────────────────────────────────────────────
// Create / Edit a Purchase Order.
// Features: client picker, dynamic line items with auto-totals,
// file attachment upload, form validation, edit pre-population.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import {
  FiPlus,
  FiTrash2,
  FiPaperclip,
  FiFileText,
  FiDollarSign,
  FiPackage,
} from "react-icons/fi";
import {
  tokens, fmt, Btn, Card, Input, Textarea, FormSelect, SectionDivider,
  PageHeader, Spinner, useToast, ToastProvider, pageStyle, StatCard,
} from "../shared";
// FIX: removed all inline apiFetch / api / buildFormData — use shared services instead
import { purchaseOrderService, clientService, productService } from "../../services/api.js";

// ─── Empty item template ──────────────────────────────────────────────────────
const emptyItem = () => ({
  _id:         Math.random().toString(36).slice(2),
  productId:   "",
  description: "",
  hsnCode:     "",
  quantity:    1,
  unit:        "Nos",
  unitPrice:   0,
  gstRate:     18,
  gstAmount:   0,
  totalPrice:  0,
});

const UNITS     = ["Nos", "Pcs", "Kg", "Ltr", "Mtr", "Set", "Box", "Bag", "Pair", "Roll"];
const GST_RATES = [0, 5, 12, 18, 28];
const STATUS_OPTS = [
  { value: "pending",   label: "Pending"   },
  { value: "approved",  label: "Approved"  },
  { value: "rejected",  label: "Rejected"  },
  { value: "completed", label: "Completed" },
];

// ─── Component ────────────────────────────────────────────────────────────────
function PurchaseOrderFormInner({ poId, onSaved, onCancel }) {
  const toast   = useToast();
  const fileRef = useRef();
  const isEdit  = !!poId;

  const [clients,  setClients]  = useState([]);
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [initLoad, setInitLoad] = useState(isEdit);
  const [file,     setFile]     = useState(null);
  const [errors,   setErrors]   = useState({});

  const [form, setForm] = useState({
    clientId:        "",
    poNumber:        "",
    poDate:          new Date().toISOString().slice(0, 10),
    deliveryDate:    "",
    status:          "pending",
    notes:           "",
    shippingAddress: "",
    items:           [emptyItem()],
  });

  // ── load clients + products ─────────────────────────────────────────────────
  useEffect(() => {
    // FIX: use clientService and productService from api.js
    Promise.all([
      clientService.getAll({ limit: 200 }),
      productService.getAll({ limit: 200 }),
    ])
      .then(([c, p]) => {
        // FIX: normalise response shape — handle both r.data and r.data.data
        setClients(c.data?.data  ?? c.data  ?? []);
        setProducts(p.data?.data ?? p.data  ?? []);
      })
      .catch(e => toast(e.response?.data?.message || e.message, "error"));
  }, []);

  // ── load existing PO for edit ───────────────────────────────────────────────
  useEffect(() => {
    if (!isEdit) return;
    // FIX: use purchaseOrderService.getOne from api.js
    purchaseOrderService.getOne(poId)
      .then(r => {
        // FIX: normalise — backend wraps in r.data.data
        const po = r.data?.data ?? r.data;
        setForm({
          clientId:        po.clientId          || "",
          poNumber:        po.poNumber          || "",
          poDate:          po.poDate?.slice(0, 10) || "",
          deliveryDate:    po.deliveryDate?.slice(0, 10) || "",
          status:          po.status            || "pending",
          notes:           po.notes             || "",
          shippingAddress: po.shippingAddress   || "",
          items: (po.items || []).map(it => ({
            _id:         Math.random().toString(36).slice(2),
            productId:   it.productId   || "",
            description: it.description || "",
            hsnCode:     it.hsnCode     || "",
            quantity:    parseFloat(it.quantity)  || 1,
            unit:        it.unit        || "Nos",
            unitPrice:   parseFloat(it.unitPrice) || 0,
            gstRate:     parseFloat(it.gstRate)   || 18,
            gstAmount:   parseFloat(it.gstAmount) || 0,
            totalPrice:  parseFloat(it.totalPrice)|| 0,
          })),
        });
      })
      .catch(e => toast(e.response?.data?.message || e.message, "error"))
      .finally(() => setInitLoad(false));
  }, [poId]);

  // ── field helpers ───────────────────────────────────────────────────────────
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const setItem = (idx, k, v) => {
    setForm(f => {
      const items = [...f.items];
      items[idx] = recalcItem({ ...items[idx], [k]: v });
      return { ...f, items };
    });
  };

  const addItem    = () => setForm(f => ({ ...f, items: [...f.items, emptyItem()] }));
  const removeItem = idx => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  // ── auto-fill from product ──────────────────────────────────────────────────
  const applyProduct = (idx, productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) { setItem(idx, "productId", productId); return; }
    setForm(f => {
      const items = [...f.items];
      items[idx] = recalcItem({
        ...items[idx],
        productId,
        description: product.name,
        hsnCode:     product.hsnCode || "",
        unit:        product.unit    || "Nos",
        unitPrice:   parseFloat(product.price)   || 0,
        gstRate:     parseFloat(product.gstRate) || 18,
      });
      return { ...f, items };
    });
  };

  // ── totals ──────────────────────────────────────────────────────────────────
  const totals = form.items.reduce(
    (acc, it) => ({
      subtotal: acc.subtotal + parseFloat(it.unitPrice) * parseFloat(it.quantity || 0),
      gst:      acc.gst     + parseFloat(it.gstAmount  || 0),
      total:    acc.total   + parseFloat(it.totalPrice || 0),
    }),
    { subtotal: 0, gst: 0, total: 0 }
  );

  // ── validate ────────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.clientId) e.clientId = "Client is required";
    if (!form.poDate)   e.poDate   = "PO date is required";
    if (form.items.length === 0) e.items = "Add at least one item";
    form.items.forEach((it, i) => {
      if (!it.description)  e[`item_${i}_desc`] = "Required";
      if (it.quantity <= 0) e[`item_${i}_qty`]  = "Must be > 0";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) { toast("Please fix form errors", "error"); return; }
    setLoading(true);
    try {
      // FIX: build FormData here so purchaseOrderService gets multipart when
      //      a file is attached, plain JSON otherwise — matches api.js expectations.
      const itemsClean = form.items.map(({ _id, ...rest }) => rest);

      if (file) {
        // multipart — purchaseOrderService.create/update both support FormData
        const fd = new FormData();
        fd.append("file", file);
        fd.append("clientId",        form.clientId);
        fd.append("poNumber",        form.poNumber);
        fd.append("poDate",          form.poDate);
        fd.append("deliveryDate",    form.deliveryDate);
        fd.append("status",          form.status);
        fd.append("notes",           form.notes);
        fd.append("shippingAddress", form.shippingAddress);
        fd.append("subtotal",    totals.subtotal);
fd.append("gstAmount",   totals.gst);
fd.append("totalAmount", totals.total);
        fd.append("items",           JSON.stringify(itemsClean));

        if (isEdit) {
          await purchaseOrderService.update(poId, fd);
        } else {
          await purchaseOrderService.create(fd);
        }
      } else {
        // JSON — no file attached
const payload = {
  ...form,
  items: itemsClean,
  subtotal:    totals.subtotal,   // ← yeh add karo
  gstAmount:   totals.gst,        // ← yeh add karo
  totalAmount: totals.total,      // ← yeh add karo
};        if (isEdit) {
          await purchaseOrderService.update(poId, payload);
        } else {
          await purchaseOrderService.create(payload);
        }
      }

      toast(isEdit ? "Purchase order updated" : "Purchase order created");
      onSaved?.();
    } catch (e) {
      toast(e.response?.data?.message || e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (initLoad) return (
    <div style={{ ...pageStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spinner size={40} />
    </div>
  );

  const clientOpts = [
    { value: "", label: "— Select Client —" },
    ...clients.map(c => ({ value: c.id, label: `${c.name}${c.company ? ` (${c.company})` : ""}` })),
  ];
  const productOpts = [
    { value: "", label: "— Select Product —" },
    ...products.map(p => ({ value: p.id, label: p.name })),
  ];

  return (
    <div style={pageStyle}>
      <PageHeader
        title={isEdit ? "Edit Purchase Order" : "New Purchase Order"}
        subtitle={isEdit ? `Editing PO ${poId}` : "Fill in the details below"}
        actions={
          <>
            {onCancel && <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>}
            <Btn variant="primary" onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving…" : isEdit ? "Update PO" : "Create PO"}
            </Btn>
          </>
        }
      />

      <div style={{display: "grid",
    gridTemplateColumns:
      window.innerWidth < 992 ? "1fr": "2fr 1fr",gap: 20,marginBottom: 20,}}>
        {/* Left: main form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card style={{ padding: "20px 24px" }}>
            <SectionDivider label="Basic Details" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
              <FormSelect label="Client *" value={form.clientId}
                onChange={e => setField("clientId", e.target.value)}
                options={clientOpts} error={errors.clientId} />
              <Input label="PO Number (Buyer's)" value={form.poNumber}
                onChange={e => setField("poNumber", e.target.value)}
                placeholder="PO-2024-001" />
              <Input label="PO Date *" type="date" value={form.poDate}
                onChange={e => setField("poDate", e.target.value)}
                error={errors.poDate} />
              <Input label="Delivery Date" type="date" value={form.deliveryDate}
                onChange={e => setField("deliveryDate", e.target.value)} />
              <FormSelect label="Status" value={form.status}
                onChange={e => setField("status", e.target.value)}
                options={STATUS_OPTS} />
              <div>
                <label style={{ fontSize: 13, color: tokens.textSub, fontWeight: 500, display: "block", marginBottom: 5 }}>
                  Attachment
                </label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                 
                  <Btn variant="ghost"size="sm"icon={<FiPaperclip size={16} />}onClick={() => fileRef.current?.click()}>Choose File</Btn>
                  <span style={{ fontSize: 13, color: tokens.textSub }}>
                    {file ? file.name : "No file selected"}
                  </span>
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.png"
                    style={{ display: "none" }}
                    onChange={e => setFile(e.target.files[0] || null)} />
                </div>
              </div>
            </div>
          </Card>

          <Card style={{ padding: "20px 24px" }}>
            <Textarea label="Shipping Address" rows={2}
              value={form.shippingAddress}
              onChange={e => setField("shippingAddress", e.target.value)}
              placeholder="Delivery address…" />
            <div style={{ marginTop: 14 }}>
              <Textarea label="Notes" rows={2}
                value={form.notes}
                onChange={e => setField("notes", e.target.value)}
                placeholder="Internal notes…" />
            </div>
          </Card>
        </div>

        {/* Right: totals */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
         <StatCard
            label="Subtotal"
            value={fmt.currency(totals.subtotal)}
            icon={<FiFileText size={18} />}
          />

          <StatCard
            label="GST"
            value={fmt.currency(totals.gst)}
            icon={<FiPackage size={18} />}
          />

          <StatCard
            label="Total"
            value={fmt.currency(totals.total)}
            icon={<FiDollarSign size={18} />}
            color={tokens.success}
          />
        </div>
      </div>

      {/* Line Items */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 20px", borderBottom: `1px solid ${tokens.border}`,
        }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: tokens.text }}>Line Items</h3>
            <Btn
              size="sm"
              variant="primary"
              onClick={addItem}
              icon={<FiPlus size={16} />}
            >
              Add Item
            </Btn>        
        </div>
        {errors.items && (
          <p style={{ color: tokens.danger, fontSize: 13, padding: "8px 20px", margin: 0 }}>{errors.items}</p>
        )}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr>
                {["Product", "Description", "HSN", "Qty", "Unit", "Unit Price", "GST %", "GST Amt", "Total", ""].map(h => (
                  <th key={h} style={{
                    padding: "10px 12px", fontSize: 12, color: tokens.textSub, fontWeight: 600,
                    textTransform: "uppercase", borderBottom: `1px solid ${tokens.border}`,
                    textAlign: "left", whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {form.items.map((item, idx) => (
                <tr key={item._id} style={{ borderBottom: `1px solid ${tokens.border}20` }}>
                  <td style={{ padding: "8px 10px", minWidth: 160 }}>
                    <select value={item.productId}
                      onChange={e => applyProduct(idx, e.target.value)}
                      style={cellSelectStyle}>
                      {productOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "8px 10px", minWidth: 180 }}>
                    <input value={item.description}
                      onChange={e => setItem(idx, "description", e.target.value)}
                      placeholder="Description *"
                      style={{ ...cellInputStyle, borderColor: errors[`item_${idx}_desc`] ? tokens.danger : tokens.border }} />
                  </td>
                  <td style={{ padding: "8px 10px", minWidth: 90 }}>
                    <input value={item.hsnCode}
                      onChange={e => setItem(idx, "hsnCode", e.target.value)}
                      placeholder="HSN" style={cellInputStyle} />
                  </td>
                  <td style={{ padding: "8px 10px", minWidth: 70 }}>
                    <input type="number" min="0" value={item.quantity}
                      onChange={e => setItem(idx, "quantity", parseFloat(e.target.value) || 0)}
                      style={{ ...cellInputStyle, borderColor: errors[`item_${idx}_qty`] ? tokens.danger : tokens.border }} />
                  </td>
                  <td style={{ padding: "8px 10px", minWidth: 90 }}>
                    <select value={item.unit} onChange={e => setItem(idx, "unit", e.target.value)}
                      style={cellSelectStyle}>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "8px 10px", minWidth: 100 }}>
                    <input type="number" min="0" step="0.01" value={item.unitPrice}
                      onChange={e => setItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                      style={cellInputStyle} />
                  </td>
                  <td style={{ padding: "8px 10px", minWidth: 80 }}>
                    <select value={item.gstRate}
                      onChange={e => setItem(idx, "gstRate", parseFloat(e.target.value))}
                      style={cellSelectStyle}>
                      {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "8px 10px", minWidth: 90, color: tokens.textSub, fontSize: 13 }}>
                    {fmt.currency(item.gstAmount)}
                  </td>
                  <td style={{ padding: "8px 10px", minWidth: 100, fontWeight: 600, color: tokens.success, fontSize: 14 }}>
                    {fmt.currency(item.totalPrice)}
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <button
                        onClick={() => removeItem(idx)}
                        disabled={form.items.length === 1}
                        style={{
                          background: "none",
                          border: "none",
                          color: tokens.danger,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: form.items.length === 1 ? 0.3 : 1,
                        }}
                      >
                        <FiTrash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table totals footer */}
        <div style={{
          display: "flex", justifyContent: "flex-end",
          padding: "16px 20px", borderTop: `1px solid ${tokens.border}`,
        }}>
          <div style={{ width: 280 }}>
            <TotalRow label="Subtotal" value={fmt.currency(totals.subtotal)} />
            <TotalRow label="GST"      value={fmt.currency(totals.gst)} />
            <div style={{ height: 1, background: tokens.border, margin: "8px 0" }} />
            <TotalRow label="Total" value={fmt.currency(totals.total)} bold color={tokens.success} />
          </div>
        </div>
      </Card>

      {/* Action bar */}
      <div style={{display: "flex",gap: 12,justifyContent: "flex-end",flexWrap: "wrap",}}>     
       {onCancel && <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>}
        <Btn variant="primary" onClick={handleSubmit} disabled={loading} size="lg">
          {loading ? "Saving…" : isEdit ? "Update Purchase Order" : "Create Purchase Order"}
        </Btn>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function recalcItem(item) {
  const qty   = parseFloat(item.quantity)  || 0;
  const price = parseFloat(item.unitPrice) || 0;
  const rate  = parseFloat(item.gstRate)   || 0;
  const base  = qty * price;
  const gst   = parseFloat(((base * rate) / 100).toFixed(2));
  const total = parseFloat((base + gst).toFixed(2));
  return { ...item, gstAmount: gst, totalPrice: total };
}

function TotalRow({ label, value, bold, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
      <span style={{ fontSize: 13, color: tokens.textSub }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: bold ? 700 : 500, color: color || tokens.text }}>{value}</span>
    </div>
  );
}

const cellInputStyle = {
  background: '#fff', border: `1px solid ${tokens.border}`,
  color: '#000', borderRadius: 6, padding: "6px 10px", fontSize: 13,
  outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box",
};

const cellSelectStyle = {
  background: '#fff', border: `1px solid ${tokens.border}`,
  color: tokens.text, borderRadius: 6, padding: "6px 8px", fontSize: 13,
  outline: "none", fontFamily: "inherit", width: "100%", cursor: "pointer",
};

// ─── Export ───────────────────────────────────────────────────────────────────
export default function PurchaseOrderFormPage(props) {
  return <ToastProvider><PurchaseOrderFormInner {...props} /></ToastProvider>;
}

/* ── USAGE ────────────────────────────────────────────────────────────────────
  // Create
  <PurchaseOrderFormPage
    onSaved={() => navigate("/purchase-orders")}
    onCancel={() => navigate("/purchase-orders")}
  />

  // Edit
  <PurchaseOrderFormPage
    poId="uuid-here"
    onSaved={() => navigate("/purchase-orders")}
    onCancel={() => navigate(-1)}
  />
─────────────────────────────────────────────────────────────────────────────*/