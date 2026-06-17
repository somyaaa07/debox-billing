// ─── ProductPage.jsx ──────────────────────────────────────────────────────────
// Complete Product management page:
// List with search, sort, pagination — Create / Edit in slide-over modal —
// Delete with confirm — all CRUD via productService (axios + /api/v1).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import {
  tokens, fmt, Btn, Card, StatCard, Input, Textarea,
  Modal, ConfirmModal, PageHeader, SearchBar, Select,
  Pagination, EmptyState, Spinner, Badge,
  useToast, ToastProvider, SectionDivider, pageStyle,
} from "../shared.jsx";

// ─── Use the shared productService (axios, /api/v1, correct auth) ─────────────
import { productService } from "../../services/api.js";   // ← adjust path if needed

// Thin wrappers so the rest of the file stays unchanged
const api = {
  getProducts:   (params)     => productService.getAll(params).then(r  => r.data),
  createProduct: (data)       => productService.create(data).then(r    => r.data),
  updateProduct: (id, data)   => productService.update(id, data).then(r => r.data),
  deleteProduct: (id)         => productService.delete(id).then(r      => r.data),
};

// ─── Constants ────────────────────────────────────────────────────────────────
const GST_RATES = [0, 5, 12, 18, 28];
const UNITS     = ["Nos", "Pcs", "Kg", "Ltr", "Mtr", "Set", "Box", "Bag", "Pair", "Roll", "Hr", "Day", "Month"];
const SORT_OPTS = [
  { value: "createdAt", label: "Date Added"  },
  { value: "name",      label: "Name"        },
  { value: "price",     label: "Price"       },
  { value: "sku",       label: "SKU"         },
];

// ─── Empty form ───────────────────────────────────────────────────────────────
const emptyForm = () => ({
  name:        "",
  sku:         "",
  description: "",
  hsnCode:     "",
  unit:        "Nos",
  price:       "",
  gstRate:     18,
  category:    "",
  isActive:    true,
});

// ─── Product Form Modal ───────────────────────────────────────────────────────
function ProductFormModal({ open, onClose, editData, onSaved }) {
  const toast   = useToast();
  const [form,   setForm]   = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const isEdit = !!editData;

  // populate form when editing
  useEffect(() => {
    if (open) {
      setForm(editData ? {
        name:        editData.name        || "",
        sku:         editData.sku         || "",
        description: editData.description || "",
        hsnCode:     editData.hsnCode     || "",
        unit:        editData.unit        || "Nos",
        price:       editData.price       ?? "",
        gstRate:     editData.gstRate     ?? 18,
        category:    editData.category    || "",
        isActive:    editData.isActive    ?? true,
      } : emptyForm());
      setErrors({});
    }
  }, [open, editData]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())                              e.name  = "Product name is required";
    if (form.price === "" || isNaN(Number(form.price))) e.price = "Enter a valid price";
    if (parseFloat(form.price) < 0)                    e.price = "Price cannot be negative";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        price:   parseFloat(form.price),
        gstRate: parseFloat(form.gstRate),
      };
      if (isEdit) await api.updateProduct(editData.id, payload);
      else        await api.createProduct(payload);
      toast(isEdit ? "Product updated" : "Product created");
      onSaved();
      onClose();
    } catch (e) {
      // axios wraps the message inside e.response?.data?.message;
      // the interceptor may have already shown a toast for 5xx errors,
      // but we still surface the specific message here for 4xx.
      toast(e.response?.data?.message || e.message || "Request failed", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Product" : "Add New Product"} width={600}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Name */}
          <div style={{ gridColumn: "1/-1" }}>
            <FLabel>Product Name *</FLabel>
            <input value={form.name} onChange={e => set("name", e.target.value)}
              placeholder="e.g. Web Development Service"
              style={{ ...finp, borderColor: errors.name ? tokens.danger : tokens.border }} />
            {errors.name && <Err>{errors.name}</Err>}
          </div>

          {/* SKU */}
          <div>
            <FLabel>SKU / Item Code</FLabel>
            <input value={form.sku} onChange={e => set("sku", e.target.value)}
              placeholder="PROD-001" style={finp} />
          </div>

          {/* Category */}
          <div>
            <FLabel>Category</FLabel>
            <input value={form.category} onChange={e => set("category", e.target.value)}
              placeholder="Services, Hardware…" style={finp} />
          </div>

          {/* Price */}
          <div>
            <FLabel>Price (₹) *</FLabel>
            <input type="number" min="0" step="0.01"
              value={form.price} onChange={e => set("price", e.target.value)}
              placeholder="0.00"
              style={{ ...finp, borderColor: errors.price ? tokens.danger : tokens.border }} />
            {errors.price && <Err>{errors.price}</Err>}
          </div>

          {/* GST Rate */}
          <div>
            <FLabel>GST Rate</FLabel>
            <select value={form.gstRate} onChange={e => set("gstRate", parseFloat(e.target.value))}
              style={{ ...finp, cursor: "pointer" }}>
              {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
            </select>
          </div>

          {/* Unit */}
          <div>
            <FLabel>Unit</FLabel>
            <select value={form.unit} onChange={e => set("unit", e.target.value)}
              style={{ ...finp, cursor: "pointer" }}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          {/* HSN */}
          <div>
            <FLabel>HSN / SAC Code</FLabel>
            <input value={form.hsnCode} onChange={e => set("hsnCode", e.target.value)}
              placeholder="998314" style={finp} />
          </div>

          {/* Price with GST preview */}
          <div style={{ gridColumn: "1/-1" }}>
            <div style={{
              display: "flex", gap: 24, padding: "10px 14px",
              background: tokens.elevated, borderRadius: 8,
              border: `1px solid ${tokens.border}`,
            }}>
              <MiniStat label="Base Price" value={fmt.currency(form.price || 0)} />
              <MiniStat label={`GST (${form.gstRate}%)`}
                value={fmt.currency((parseFloat(form.price) || 0) * (parseFloat(form.gstRate) / 100))}
                color={tokens.warning} />
              <MiniStat label="Price incl. GST"
                value={fmt.currency((parseFloat(form.price) || 0) * (1 + parseFloat(form.gstRate) / 100))}
                color={tokens.success} />
            </div>
          </div>

          {/* Description */}
          <div style={{ gridColumn: "1/-1" }}>
            <FLabel>Description</FLabel>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              rows={3} placeholder="Product or service description…"
              style={{ ...finp, resize: "vertical" }} />
          </div>

          {/* Active toggle */}
          <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 10 }}>
            <div
              onClick={() => set("isActive", !form.isActive)}
              style={{
                width: 44, height: 24, borderRadius: 12, cursor: "pointer",
                background: form.isActive ? tokens.success : tokens.border,
                position: "relative", transition: "background .2s", flexShrink: 0,
              }}
            >
              <div style={{
                position: "absolute", top: 3,
                left: form.isActive ? 22 : 2,
                width: 18, height: 18, borderRadius: "50%",
                background: "#fff", transition: "left .2s",
                boxShadow: "0 1px 4px #0004",
              }} />
            </div>
            <span style={{ fontSize: 14, color: tokens.text }}>
              {form.isActive ? "Active — visible in product picker" : "Inactive — hidden from product picker"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Update Product" : "Create Product"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function ProductPageInner() {
  const toast = useToast();

  const [rows,        setRows]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [pagination,  setPagination]  = useState({ page: 1, totalPages: 1, total: 0, limit: 15 });
  const [search,      setSearch]      = useState("");
  const [sortBy,      setSortBy]      = useState("createdAt");
  const [sortOrder,   setSortOrder]   = useState("DESC");
  const [formOpen,    setFormOpen]    = useState(false);
  const [editData,    setEditData]    = useState(null);
  const [delTarget,   setDelTarget]   = useState(null);
  const [viewProduct, setViewProduct] = useState(null);

  // ── fetch ──────────────────────────────────────────────────────────────────
  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      // productService.getAll returns { data, pagination } inside r.data
      const result = await api.getProducts({ page, limit: 15, search, sortBy, sortOrder });
      // Handle both { data, pagination } and flat array responses gracefully
      if (Array.isArray(result)) {
        setRows(result);
        setPagination(p => ({ ...p, page, total: result.length }));
      } else {
        setRows(result.data || result.products || []);
        setPagination(result.pagination || { page: 1, totalPages: 1, total: 0, limit: 15 });
      }
    } catch (e) {
      toast(e.response?.data?.message || e.message || "Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  }, [search, sortBy, sortOrder]);

  useEffect(() => { load(1); }, [load]);

  const handleSort = col => {
    if (sortBy === col) setSortOrder(o => o === "ASC" ? "DESC" : "ASC");
    else { setSortBy(col); setSortOrder("ASC"); }
  };

  const openCreate = () => { setEditData(null); setFormOpen(true); };
  const openEdit   = (p)  => { setEditData(p);  setFormOpen(true); setViewProduct(null); };

  const handleDelete = async () => {
    try {
      await api.deleteProduct(delTarget.id);
      toast("Product deleted");
      load(pagination.page);
    } catch (e) {
      toast(e.response?.data?.message || e.message || "Delete failed", "error");
    } finally {
      setDelTarget(null);
    }
  };

  // ── stats ──────────────────────────────────────────────────────────────────
  const activeCount = rows.filter(r => r.isActive !== false).length;
  const avgPrice    = rows.length
    ? rows.reduce((s, r) => s + parseFloat(r.price || 0), 0) / rows.length
    : 0;
  const categories  = [...new Set(rows.map(r => r.category).filter(Boolean))].length;

  return (
    <div style={pageStyle}>
      <PageHeader
        title="Products & Services"
        subtitle="Manage your product catalogue"
        actions={
          <Btn variant="primary" onClick={openCreate} icon="＋">Add Product</Btn>
        }
      />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Products" value={pagination.total} icon="📦" />
        <StatCard label="Active"         value={activeCount}       icon="✅" color={tokens.success} />
        <StatCard label="Categories"     value={categories}        icon="🏷"  color={tokens.accent} />
        <StatCard label="Avg Price"      value={fmt.currency(avgPrice)} icon="💰" />
      </div>

      {/* Filters */}
      <Card style={{ padding: "14px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search name, SKU…" />
          <Select value={sortBy} onChange={setSortBy} options={SORT_OPTS} placeholder={null} />
          <Btn variant="ghost" size="sm"
            onClick={() => setSortOrder(o => o === "ASC" ? "DESC" : "ASC")}
            icon={sortOrder === "ASC" ? "↑" : "↓"}>
            {sortOrder}
          </Btn>
          <Btn variant="ghost" size="sm" onClick={() => load(1)}>Refresh</Btn>
          <div style={{ marginLeft: "auto" }}>
            <Btn variant="primary" onClick={openCreate} icon="＋">Add Product</Btn>
          </div>
        </div>
      </Card>

      {/* Product grid */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <Spinner size={40} />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No products found"
          message={search ? "No products match your search." : "Add your first product to get started."}
          action={<Btn variant="primary" onClick={openCreate} icon="＋">Add Product</Btn>}
        />
      ) : (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
            gap: 16, marginBottom: 20,
          }}>
            {rows.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={() => openEdit(product)}
                onDelete={() => setDelTarget(product)}
                onView={() => setViewProduct(product)}
              />
            ))}
          </div>

          <Pagination pagination={pagination} onChange={p => load(p)} />
        </>
      )}

      {/* Create / Edit Modal */}
      <ProductFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editData={editData}
        onSaved={() => load(1)}
      />

      {/* Product Detail Modal */}
      {viewProduct && (
        <ProductDetailModal
          product={viewProduct}
          onClose={() => setViewProduct(null)}
          onEdit={() => openEdit(viewProduct)}
          onDelete={() => { setDelTarget(viewProduct); setViewProduct(null); }}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Delete "${delTarget?.name}"? This cannot be undone. Products already used in quotations/invoices will remain there.`}
      />
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, onEdit, onDelete, onView }) {
  const priceWithGst = parseFloat(product.price || 0) * (1 + parseFloat(product.gstRate || 0) / 100);
  const isActive     = product.isActive !== false;

  return (
    <Card style={{
      padding: "18px 20px", cursor: "pointer",
      transition: "transform .15s, box-shadow .15s",
      border: `1px solid ${isActive ? tokens.border : tokens.border + "80"}`,
      opacity: isActive ? 1 : 0.7,
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px #0006"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <button onClick={onView} style={{
            background: "none", border: "none", padding: 0, cursor: "pointer",
            textAlign: "left", width: "100%",
          }}>
            <h3 style={{
              margin: 0, fontSize: 15, fontWeight: 700, color: tokens.text,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{product.name}</h3>
          </button>
          {product.sku && (
            <span style={{ fontSize: 12, color: tokens.muted }}>{product.sku}</span>
          )}
        </div>
        <div style={{ flexShrink: 0, marginLeft: 8 }}>
          {isActive
            ? <span style={{ fontSize: 11, color: tokens.success, fontWeight: 600, background: `${tokens.success}20`, padding: "2px 8px", borderRadius: 99 }}>Active</span>
            : <span style={{ fontSize: 11, color: tokens.muted,   fontWeight: 600, background: tokens.elevated,        padding: "2px 8px", borderRadius: 99 }}>Inactive</span>
          }
        </div>
      </div>

      {/* Category */}
      {product.category && (
        <div style={{ marginBottom: 10 }}>
          <span style={{
            fontSize: 11, color: tokens.accent, fontWeight: 600,
            background: `${tokens.accent}15`, padding: "2px 8px", borderRadius: 99,
          }}>{product.category}</span>
        </div>
      )}

      {/* Description */}
      {product.description && (
        <p style={{
          margin: "0 0 12px", fontSize: 13, color: tokens.textSub, lineHeight: 1.5,
          overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}>{product.description}</p>
      )}

      {/* Price row */}
      <div style={{
        display: "flex", gap: 12, alignItems: "center",
        padding: "10px 12px", background: tokens.elevated, borderRadius: 8, marginBottom: 14,
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: tokens.muted }}>Base</p>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 300, color: tokens.text }}>{fmt.currency(product.price)}</p>
        </div>
        <div style={{ color: tokens.border, fontSize: 18 }}>+</div>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: tokens.muted }}>GST {product.gstRate}%</p>
          <p style={{ margin: 0, fontSize: 9, color: tokens.warning, fontWeight: 600 }}>
            {fmt.currency((parseFloat(product.price || 0) * parseFloat(product.gstRate || 0)) / 100)}
          </p>
        </div>
        <div style={{ color: tokens.border, fontSize: 18 }}>=</div>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: tokens.muted }}>Total</p>
          <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: tokens.success }}>
            {fmt.currency(priceWithGst)}
          </p>
        </div>
      </div>

      {/* Meta row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {product.unit    && <Tag icon="📐">{product.unit}</Tag>}
        {product.hsnCode && <Tag icon="🏷">HSN: {product.hsnCode}</Tag>}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        <Btn size="sm" variant="ghost" onClick={onView}   style={{ flex: 1 }}>View</Btn>
        <Btn size="sm" variant="ghost" onClick={onEdit}   style={{ flex: 1 }}>Edit</Btn>
        <Btn size="sm" variant="danger" onClick={onDelete}>🗑</Btn>
      </div>
    </Card>
  );
}

// ─── Product Detail Modal ─────────────────────────────────────────────────────
function ProductDetailModal({ product, onClose, onEdit, onDelete }) {
  const priceWithGst = parseFloat(product.price || 0) * (1 + parseFloat(product.gstRate || 0) / 100);
  const isActive     = product.isActive !== false;

  return (
    <Modal open={true} onClose={onClose} title="Product Details" width={480}>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: tokens.text }}>{product.name}</h2>
              {product.sku && <p style={{ margin: 0, fontSize: 13, color: tokens.muted }}>SKU: {product.sku}</p>}
            </div>
            <span style={{
              fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 99,
              background: isActive ? `${tokens.success}20` : tokens.elevated,
              color: isActive ? tokens.success : tokens.muted,
            }}>
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
          {product.category && (
            <span style={{
              display: "inline-block", marginTop: 8, fontSize: 12, color: tokens.accent,
              fontWeight: 600, background: `${tokens.accent}15`, padding: "3px 10px", borderRadius: 99,
            }}>{product.category}</span>
          )}
        </div>

        {/* Pricing */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          <PriceTile label="Base Price" value={fmt.currency(product.price)} />
          <PriceTile
            label={`GST (${product.gstRate}%)`}
            value={fmt.currency((parseFloat(product.price || 0) * parseFloat(product.gstRate || 0)) / 100)}
            color={tokens.warning}
          />
          <PriceTile label="Incl. GST" value={fmt.currency(priceWithGst)} color={tokens.success} />
        </div>

        {/* Meta */}
        <SectionDivider label="Details" />
        <div style={{ display: "flex", flexDirection: "column", gap: 0, margin: "8px 0 16px" }}>
          <DR label="Unit"     value={product.unit    || "—"} />
          <DR label="HSN Code" value={product.hsnCode || "—"} />
          <DR label="GST Rate" value={`${product.gstRate || 0}%`} />
          <DR label="Added"    value={product.createdAt ? new Date(product.createdAt).toLocaleDateString("en-IN") : "—"} />
          {product.updatedAt && (
            <DR label="Updated" value={new Date(product.updatedAt).toLocaleDateString("en-IN")} />
          )}
        </div>

        {product.description && (
          <>
            <SectionDivider label="Description" />
            <p style={{ fontSize: 14, color: tokens.textSub, lineHeight: 1.7, margin: "8px 0 16px" }}>
              {product.description}
            </p>
          </>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8, borderTop: `1px solid ${tokens.border}` }}>
          <Btn variant="danger"  onClick={onDelete} size="sm">Delete</Btn>
          <Btn variant="ghost"   onClick={onClose}  size="sm">Close</Btn>
          <Btn variant="primary" onClick={onEdit}   size="sm">Edit</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ─── Mini helpers ─────────────────────────────────────────────────────────────
function FLabel({ children }) {
  return <label style={{ fontSize: 13, color: tokens.textSub, fontWeight: 500, display: "block", marginBottom: 5 }}>{children}</label>;
}
function Err({ children }) {
  return <span style={{ fontSize: 12, color: tokens.danger, marginTop: 2, display: "block" }}>{children}</span>;
}
function Tag({ children, icon }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, color: tokens.textSub, background: tokens.elevated,
      padding: "2px 8px", borderRadius: 99, border: `1px solid ${tokens.border}`,
    }}>
      {icon} {children}
    </span>
  );
}
function MiniStat({ label, value, color }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: 11, color: tokens.muted }}>{label}</p>
      <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: color || tokens.text }}>{value}</p>
    </div>
  );
}
function PriceTile({ label, value, color }) {
  return (
    <div style={{
      padding: "10px 12px", background: tokens.elevated,
      borderRadius: 8, border: `1px solid ${tokens.border}`, textAlign: "center",
    }}>
      <p style={{ margin: "0 0 4px", fontSize: 11, color: tokens.muted }}>{label}</p>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: color || tokens.text }}>{value}</p>
    </div>
  );
}
function DR({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${tokens.border}20` }}>
      <span style={{ fontSize: 13, color: tokens.textSub }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: tokens.text }}>{value}</span>
    </div>
  );
}

const finp = {
  background: tokens.elevated, border: `1px solid ${tokens.border}`,
  color: tokens.text, borderRadius: 8, padding: "9px 14px",
  fontSize: 14, outline: "none", fontFamily: "inherit",
  width: "100%", boxSizing: "border-box",
};

// ─── Export ───────────────────────────────────────────────────────────────────
export default function ProductPage() {
  return <ToastProvider><ProductPageInner /></ToastProvider>;
}

/* ── USAGE ────────────────────────────────────────────────────────────────────
  <ProductPage />
─────────────────────────────────────────────────────────────────────────────*/