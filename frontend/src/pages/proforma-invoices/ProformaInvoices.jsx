// ─── ProformaInvoicePage.jsx (FIXED) ─────────────────────────────────────────
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  tokens, fmt, Badge, Btn, Card, StatCard, Modal, ConfirmModal,
  PageHeader, SearchBar, Select, Pagination, Table, EmptyState,
  useToast, ToastProvider, pageStyle,
} from "../shared.jsx";
import {
  FiFileText,
  FiDollarSign,
  FiAlertTriangle,
  FiEdit,
  FiCheckCircle,
} from "react-icons/fi";
import { proformaService } from "../../services/api.js";

// ─── Optional: lightweight error boundary ────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError)
      return (
        <div style={{ padding: 40, textAlign: "center", color: tokens.danger }}>
          Something went wrong. Please refresh the page.
        </div>
      );
    return this.props.children;
  }
}

const STATUS_OPTS = [
  { value: "draft",          label: "Draft"          },
  { value: "sent",           label: "Sent"           },
  { value: "approved",       label: "Approved"       },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "converted",      label: "Converted"      },
];

// ─── Detail View Modal ────────────────────────────────────────────────────────
// FIX #1 — self-contained View modal so onView prop is no longer required
function PIDetailModal({ row, onClose }) {
  if (!row) return null;
  const fields = [
    ["PI Number",    row.piNumber],
    ["Client",       row.client?.name    || "—"],
    ["Company",      row.client?.company || "—"],
    ["Status",       <Badge status={row.status} />],
    ["PI Date",      fmt.date(row.piDate)],
    ["Valid Until",  fmt.date(row.validUntil)],
    ["Total Amount", <span style={{ color: tokens.success, fontWeight: 700 }}>{fmt.currency(row.totalAmount)}</span>],
    ["Due Amount",   <span style={{ color: parseFloat(row.dueAmount) > 0 ? tokens.danger : tokens.success, fontWeight: 700 }}>{fmt.currency(row.dueAmount)}</span>],
  ];
  return (
    <Modal open onClose={onClose} title={`Proforma Invoice — ${row.piNumber}`} width={480}>
      <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "10px 16px", marginBottom: 24 }}>
        {fields.map(([label, value]) => (
          <>
            <span key={label + "_l"} style={{ fontSize: 13, color: tokens.textSub, fontWeight: 500, alignSelf: "center" }}>{label}</span>
            <span key={label + "_v"} style={{ fontSize: 14, color: tokens.text }}>{value}</span>
          </>
        ))}
      </div>
      {row.notes && (
        <div style={{ background: tokens.elevated, borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: tokens.textSub }}>
          <strong>Notes:</strong> {row.notes}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn variant="ghost" onClick={onClose}>Close</Btn>
      </div>
    </Modal>
  );
}

// ─── Create / Edit Modal ──────────────────────────────────────────────────────
// FIX #1 & #2 — self-contained Create/Edit modal so onCreate / onEdit props are no longer required
function PIFormModal({ row, onClose, onSaved, toast }) {
  const isEdit = !!row;
  const [form, setForm] = useState({
    piNumber:    row?.piNumber    || "",
    clientId:    row?.clientId   || "",
    piDate:      row?.piDate     || new Date().toISOString().slice(0, 10),
    validUntil:  row?.validUntil || "",
    totalAmount: row?.totalAmount || "",
    notes:       row?.notes      || "",
    status:      row?.status     || "draft",
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (isEdit) {
        await proformaService.update(row.id, form);
        toast("Proforma invoice updated");
      } else {
        await proformaService.create(form);
        toast("Proforma invoice created");
      }
      onSaved?.();
      onClose();
    } catch (e) {
      toast(e.response?.data?.message || e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    background: tokens.elevated, border: `1px solid ${tokens.border}`,
    color: tokens.text, borderRadius: 8, padding: "9px 14px",
    fontSize: 14, outline: "none", fontFamily: "inherit", width: "100%",
    boxSizing: "border-box",
  };
  const labelStyle = { fontSize: 13, color: tokens.textSub, fontWeight: 500, display: "block", marginBottom: 4 };

  return (
    <Modal open onClose={onClose} title={isEdit ? `Edit PI — ${row.piNumber}` : "New Proforma Invoice"} width={480}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
        <div>
          <label style={labelStyle}>PI Number</label>
          <input style={inputStyle} value={form.piNumber} onChange={e => set("piNumber", e.target.value)} placeholder="PI-0001" />
        </div>
        <div>
          <label style={labelStyle}>Status</label>
          <select style={{ ...inputStyle, cursor: "pointer" }} value={form.status} onChange={e => set("status", e.target.value)}>
            {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>PI Date</label>
          <input style={inputStyle} type="date" value={form.piDate} onChange={e => set("piDate", e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Valid Until</label>
          <input style={inputStyle} type="date" value={form.validUntil} onChange={e => set("validUntil", e.target.value)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Total Amount</label>
          <input style={inputStyle} type="number" value={form.totalAmount} onChange={e => set("totalAmount", e.target.value)} placeholder="0.00" />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Notes</label>
          <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 72 }} value={form.notes} onChange={e => set("notes", e.target.value)} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create PI"}
        </Btn>
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function ProformaInvoicePageInner({ onView, onCreate, onEdit, onFICreated }) {
  const toast = useToast();

  const [rows,          setRows]          = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [pagination,    setPagination]    = useState({ page: 1, totalPages: 1, total: 0, limit: 15 });

  // FIX #3 — separate summary state so stats reflect ALL records, not just current page
  const [summary,       setSummary]       = useState({ totalBilled: 0, totalDue: 0, draft: 0, converted: 0 });

  const [search,        setSearch]        = useState("");
  const [status,        setStatus]        = useState("");
  const [sortBy,        setSortBy]        = useState("createdAt");
  const [sortOrder,     setSortOrder]     = useState("DESC");

  const [delTarget,     setDelTarget]     = useState(null);
  const [actionRow,     setActionRow]     = useState(null);
  const [newStatus,     setNewStatus]     = useState("");
  const [statusModal,   setStatusModal]   = useState(false);
  const [convertTarget, setConvertTarget] = useState(null);
  const [actionLoad,    setActionLoad]    = useState({});

  // FIX #1 — internal view/create/edit state (no longer relies solely on props)
  const [viewTarget,    setViewTarget]    = useState(null);
  const [showCreate,    setShowCreate]    = useState(false);
  const [editTarget,    setEditTarget]    = useState(null);

  // FIX #5 — debounce ref for search
  const debounceRef = useRef(null);

  const setAL = (id, val) => setActionLoad(p => ({ ...p, [id]: val }));

  // FIX #6 — stable load function; receives params directly instead of closing over state
  const load = useCallback(async (page = 1, overrides = {}) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        search:    overrides.search    !== undefined ? overrides.search    : search,
        status:    overrides.status    !== undefined ? overrides.status    : status,
        sortBy:    overrides.sortBy    !== undefined ? overrides.sortBy    : sortBy,
        sortOrder: overrides.sortOrder !== undefined ? overrides.sortOrder : sortOrder,
      };

      // FIX #3 — fetch table data and summary in parallel
      const [r, statsRes] = await Promise.all([
        proformaService.getAll(params),
        proformaService.getSummary?.()   // gracefully skip if endpoint doesn't exist yet
          .catch(() => null),
      ]);

      setRows(r.data.data || []);
      setPagination(r.data.pagination || { page: 1, totalPages: 1, total: 0, limit: 15 });

      if (statsRes?.data) {
        setSummary(statsRes.data);
      } else {
        // Fallback: compute from current page until backend endpoint is ready
        const pageRows = r.data.data || [];
        setSummary({
          totalBilled: pageRows.reduce((s, row) => s + parseFloat(row.totalAmount || 0), 0),
          totalDue:    pageRows.reduce((s, row) => s + parseFloat(row.dueAmount    || 0), 0),
          draft:       pageRows.filter(row => row.status === "draft").length,
          converted:   pageRows.filter(row => row.status === "converted").length,
        });
      }
    } catch (e) {
      toast(e.response?.data?.message || e.message, "error");
    } finally {
      setLoading(false);
    }
  }, []); // FIX #6 — empty deps = stable reference, no unnecessary re-renders

  useEffect(() => { load(1); }, [load]);

  // Re-load when filters change
  useEffect(() => { load(1, { search, status, sortBy, sortOrder }); },
    [search, status, sortBy, sortOrder]); // eslint-disable-line

  const handleSort = col => {
    const nextOrder = sortBy === col ? (sortOrder === "ASC" ? "DESC" : "ASC") : "ASC";
    setSortBy(col);
    setSortOrder(nextOrder);
  };

  // FIX #5 — debounced search handler
  const handleSearch = val => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(1, { search: val, status, sortBy, sortOrder }), 400);
  };

  const handleDelete = async () => {
    try {
      await proformaService.delete(delTarget.id);
      toast("Proforma invoice deleted");
      load(pagination.page, { search, status, sortBy, sortOrder });
    } catch (e) {
      toast(e.response?.data?.message || e.message, "error");
    } finally {
      setDelTarget(null);
    }
  };

  const openStatus = row => { setActionRow(row); setNewStatus(row.status); setStatusModal(true); };
  const saveStatus = async () => {
    try {
      await proformaService.updateStatus(actionRow.id, newStatus);
      toast(`Status updated to ${newStatus}`);
      setStatusModal(false);
      load(pagination.page, { search, status, sortBy, sortOrder });
    } catch (e) {
      toast(e.response?.data?.message || e.message, "error");
    }
  };

  // FIX #7 — PDF memory leak fixed with setTimeout before revokeObjectURL
  const handlePdf = async row => {
    setAL(row.id, "pdf");
    try {
      const res  = await proformaService.downloadPdf(row.id);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url;
      a.download = `PI-${row.piNumber}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000); // FIX #7
      toast("PDF downloaded");
    } catch (e) {
      toast(e.response?.data?.message || e.message, "error");
    } finally {
      setAL(row.id, "");
    }
  };

  const handleEmail = async row => {
    setAL(row.id, "email");
    try {
      await proformaService.email(row.id);
      toast("Email sent");
      load(pagination.page, { search, status, sortBy, sortOrder });
    } catch (e) {
      toast(e.response?.data?.message || e.message, "error");
    } finally {
      setAL(row.id, "");
    }
  };

  const handleConvert = async () => {
    const row = convertTarget;
    setAL(row.id, "convert");
    try {
      const r = await proformaService.convertToInvoice(row.id);
      toast(r.data.message || "Converted to Final Invoice");
      setConvertTarget(null);
      load(pagination.page, { search, status, sortBy, sortOrder });
      onFICreated?.(r.data.data);
    } catch (e) {
      toast(e.response?.data?.message || e.message, "error");
    } finally {
      setAL(row.id, "");
    }
  };

  // FIX #1 — View handler: use internal modal first, fall back to prop
  const handleView = row => {
    if (onView) onView(row);
    else setViewTarget(row);
  };

  // FIX #1 — Create handler: use internal modal first, fall back to prop
  const handleCreate = () => {
    if (onCreate) onCreate();
    else setShowCreate(true);
  };

  // FIX #2 — Edit handler: use internal modal first, fall back to prop
  const handleEdit = row => {
    if (onEdit) onEdit(row);
    else setEditTarget(row);
  };

  const cols = [
    {
      key: "piNumber", label: "PI Number", sortable: true,
      render: (v, row) => (
        <button onClick={() => handleView(row)} style={{
          background: "none", border: "none", color: tokens.accent,
          fontWeight: 700, cursor: "pointer", fontSize: 14, padding: 0,
        }}>{v}</button>
      ),
    },
    { key: "client",  label: "Client",  render: (_, row) => row.client?.name    || "—" },
    { key: "company", label: "Company", render: (_, row) => row.client?.company || "—" },
    {
      key: "totalAmount", label: "Total", sortable: true,
      render: v => <span style={{ fontWeight: 600, color: tokens.success }}>{fmt.currency(v)}</span>,
    },
    {
      key: "dueAmount", label: "Due",
      render: v => <span style={{ color: parseFloat(v) > 0 ? tokens.danger : tokens.success, fontWeight: 600 }}>{fmt.currency(v)}</span>,
    },
    { key: "status",     label: "Status",     render: v => <Badge status={v} /> },
    { key: "piDate",     label: "Date",        sortable: true, render: v => fmt.date(v) },
    { key: "validUntil", label: "Valid Until", render: v => fmt.date(v) },
    {
      key: "actions", label: "Actions",
      render: (_, row) => (
        <div style={{ display: "flex", gap: 5, flexWrap: "nowrap" }}>
          <Btn size="sm" variant="ghost"   onClick={() => handleView(row)}>View</Btn>
          <Btn size="sm" variant="ghost"   onClick={() => openStatus(row)}>Status</Btn>
          <Btn size="sm" variant="ghost"   onClick={() => handlePdf(row)}   disabled={actionLoad[row.id] === "pdf"}>
            {actionLoad[row.id] === "pdf"   ? "…" : "PDF"}
          </Btn>
          <Btn size="sm" variant="ghost"   onClick={() => handleEmail(row)} disabled={actionLoad[row.id] === "email"}>
            {actionLoad[row.id] === "email" ? "…" : "Email"}
          </Btn>
          <Btn size="sm" variant="primary"
            onClick={() => setConvertTarget(row)}
            disabled={row.status === "converted" || !!actionLoad[row.id]}>
            → FI
          </Btn>
          <Btn size="sm" variant="ghost"  onClick={() => handleEdit(row)}>Edit</Btn>
          <Btn size="sm" variant="danger" onClick={() => setDelTarget(row)}>Del</Btn>
        </div>
      ),
    },
  ];

  return (
    <div style={pageStyle}>
      <PageHeader
        title="Proforma Invoices"
        subtitle="Track and manage proforma invoices"
        actions={<Btn variant="primary" onClick={handleCreate} icon="＋">New PI</Btn>}
      />

      {/* FIX #3 — stats now come from summary state (all records) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 24 }}>
<StatCard
  label="Total PIs"
  value={pagination.total}
  valueColor="#2563eb"
  icon={FiFileText}
  iconColor="#2563eb"
  iconBg="#eff6ff"
/>

<StatCard
  label="Total Billed"
  value={fmt.currency(summary.totalBilled)}
  valueColor="#15803d"
  icon={FiDollarSign}
  iconColor="#15803d"
  iconBg="#ecfdf5"
/>

<StatCard
  label="Total Due"
  value={fmt.currency(summary.totalDue)}
  valueColor="#dc2626"
  icon={FiAlertTriangle}
  iconColor="#dc2626"
  iconBg="#fef2f2"
/>

<StatCard
  label="Draft"
  value={summary.draft}
  valueColor="#d97706"
  icon={FiEdit}
  iconColor="#d97706"
  iconBg="#fffbeb"
/>

<StatCard
  label="Converted"
  value={summary.converted}
  valueColor="#7c3aed"
  icon={FiCheckCircle}
  iconColor="#7c3aed"
  iconBg="#f5f3ff"
/>
      </div>

      <Card style={{ padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          {/* FIX #5 — debounced search */}
          <SearchBar value={search} onChange={handleSearch} placeholder="Search PI number…" />
          <Select value={status}  onChange={setStatus}  options={STATUS_OPTS} placeholder="All Statuses" />
          <Select value={sortBy}  onChange={setSortBy}
            options={[
              { value: "createdAt",   label: "Date Created" },
              { value: "piNumber",    label: "PI Number"    },
              { value: "totalAmount", label: "Amount"       },
              { value: "piDate",      label: "PI Date"      },
            ]} placeholder={null} />
          <Btn variant="ghost" size="sm"
            onClick={() => setSortOrder(o => o === "ASC" ? "DESC" : "ASC")}
            icon={sortOrder === "ASC" ? "↑" : "↓"}>{sortOrder}</Btn>
          <Btn variant="ghost" size="sm"
            onClick={() => load(1, { search, status, sortBy, sortOrder })}>Refresh</Btn>
        </div>
      </Card>

      <Card>
        {!loading && rows.length === 0 ? (
          <EmptyState icon="📄" title="No proforma invoices"
            message="No PIs match your current filters."
            action={<Btn variant="primary" onClick={handleCreate}>Create First PI</Btn>} />
        ) : (
          <>
            <Table cols={cols} rows={rows} loading={loading}
              onSort={handleSort} sortBy={sortBy} sortOrder={sortOrder} />
            <div style={{ padding: "0 16px" }}>
              <Pagination pagination={pagination}
                onChange={p => load(p, { search, status, sortBy, sortOrder })} />
            </div>
          </>
        )}
      </Card>

      {/* Status Modal */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Update PI Status" width={360}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: tokens.textSub, fontWeight: 500, display: "block", marginBottom: 6 }}>
            New Status
          </label>
          <select value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{
            background: tokens.elevated, border: `1px solid ${tokens.border}`,
            color: tokens.text, borderRadius: 8, padding: "9px 14px", fontSize: 14,
            outline: "none", fontFamily: "inherit", cursor: "pointer", width: "100%",
          }}>
            {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={() => setStatusModal(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={saveStatus}>Save</Btn>
        </div>
      </Modal>

      {/* FIX #4 — convert modal close also clears action loader */}
      <ConfirmModal
        open={!!convertTarget}
        onClose={() => { setAL(convertTarget?.id, ""); setConvertTarget(null); }}
        onConfirm={handleConvert}
        title="Convert to Final Invoice"
        danger={false}
        message={`Convert PI "${convertTarget?.piNumber}" to a Final Invoice? The PI will be marked as converted.`}
      />

      <ConfirmModal
        open={!!delTarget} onClose={() => setDelTarget(null)}
        onConfirm={handleDelete} title="Delete Proforma Invoice"
        message={`Delete PI "${delTarget?.piNumber}"? This cannot be undone.`}
      />

      {/* FIX #1 — internal View modal */}
      {viewTarget && (
        <PIDetailModal row={viewTarget} onClose={() => setViewTarget(null)} />
      )}

      {/* FIX #1 — internal Create modal */}
      {showCreate && (
        <PIFormModal
          onClose={() => setShowCreate(false)}
          onSaved={() => load(1, { search, status, sortBy, sortOrder })}
          toast={toast}
        />
      )}

      {/* FIX #2 — internal Edit modal */}
      {editTarget && (
        <PIFormModal
          row={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => load(pagination.page, { search, status, sortBy, sortOrder })}
          toast={toast}
        />
      )}
    </div>
  );
}

// FIX #8 — error boundary wraps everything
export default function ProformaInvoicePage(props) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ProformaInvoicePageInner {...props} />
      </ToastProvider>
    </ErrorBoundary>
  );
}