// ─── FinalInvoicePage.jsx ─────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import {
  tokens, fmt, Badge, Btn, Card, StatCard, Modal, ConfirmModal,
  PageHeader, SearchBar, Select, Pagination, Table, EmptyState,
  useToast, ToastProvider, pageStyle,
} from "../shared.jsx";
import { invoiceService, clientService } from "../../services/api.js";

const STATUS_OPTS = [
  { value: "draft",          label: "Draft"          },
  { value: "sent",           label: "Sent"           },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "paid",           label: "Paid"           },
  { value: "overdue",        label: "Overdue"        },
];

function FinalInvoicePageInner({ onView, onCreate, onEdit, onRecordPayment }) {
  const toast = useToast();

  const [rows,        setRows]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [pagination,  setPagination]  = useState({ page: 1, totalPages: 1, total: 0, limit: 15 });
  const [search,      setSearch]      = useState("");
  const [status,      setStatus]      = useState("");
  const [clientId,    setClientId]    = useState("");
  const [sortBy,      setSortBy]      = useState("createdAt");
  const [sortOrder,   setSortOrder]   = useState("DESC");
  const [clients,     setClients]     = useState([]);
  const [delTarget,   setDelTarget]   = useState(null);
  const [actionRow,   setActionRow]   = useState(null);
  const [newStatus,   setNewStatus]   = useState("");
  const [statusModal, setStatusModal] = useState(false);
  const [actionLoad,  setActionLoad]  = useState({});

  const setAL = (id, val) => setActionLoad(p => ({ ...p, [id]: val }));

  useEffect(() => {
    clientService.getAll({ limit: 200 })
      .then(r => setClients(r.data.data || r.data || []))
      .catch(() => {});
  }, []);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 15, sortBy, sortOrder };
      if (search)   params.search   = search;
      if (status)   params.status   = status;
      if (clientId) params.clientId = clientId;
      const r = await invoiceService.getAll(params);
      setRows(r.data.data       || r.data       || []);
      setPagination(r.data.pagination || { page: 1, totalPages: 1, total: 0, limit: 15 });
    } catch (e) { toast(e.response?.data?.message || e.message, "error"); }
    finally    { setLoading(false); }
  }, [search, status, clientId, sortBy, sortOrder]);

  useEffect(() => { load(1); }, [load]);

  const handleSort = col => {
    if (sortBy === col) setSortOrder(o => o === "ASC" ? "DESC" : "ASC");
    else { setSortBy(col); setSortOrder("ASC"); }
  };

  const handleDelete = async () => {
    try {
      await invoiceService.delete(delTarget.id);
      toast("Invoice deleted successfully");
      load(pagination.page);
    } catch (e) { toast(e.response?.data?.message || e.message, "error"); }
    finally    { setDelTarget(null); }
  };

  const openStatus = row => { setActionRow(row); setNewStatus(row.status); setStatusModal(true); };
  const saveStatus = async () => {
    try {
      await invoiceService.updateStatus(actionRow.id, newStatus);
      toast(`Status updated to ${newStatus}`);
      setStatusModal(false);
      load(pagination.page);
    } catch (e) { toast(e.response?.data?.message || e.message, "error"); }
  };

  const handlePdf = async row => {
    setAL(row.id, "pdf");
    try {
      const res  = await invoiceService.downloadPdf(row.id);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `invoice-${row.invoiceNumber}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast("PDF downloaded");
    } catch (e) { toast(e.response?.data?.message || e.message, "error"); }
    finally    { setAL(row.id, ""); }
  };

  const handleEmail = async row => {
    setAL(row.id, "email");
    try {
      await invoiceService.email(row.id);
      toast("Invoice emailed successfully");
      load(pagination.page);
    } catch (e) { toast(e.response?.data?.message || e.message, "error"); }
    finally    { setAL(row.id, ""); }
  };

  const cols = [
    {
      key: "invoiceNumber", label: "Invoice #", sortable: true,
      render: (v, row) => (
        <button onClick={() => onView?.(row)} style={{
          background: "none", border: "none", color: tokens.accent,
          fontWeight: 700, cursor: "pointer", fontSize: 14, padding: 0,
        }}>{v}</button>
      ),
    },
    { key: "client",  label: "Client",  render: (_, r) => r.client?.name    || "—" },
    { key: "company", label: "Company", render: (_, r) => r.client?.company || "—" },
    {
      key: "totalAmount", label: "Total", sortable: true,
      render: v => <span style={{ fontWeight: 600, color: tokens.text }}>{fmt.currency(v)}</span>,
    },
    {
      key: "paidAmount", label: "Paid",
      render: v => <span style={{ color: tokens.success, fontWeight: 600 }}>{fmt.currency(v)}</span>,
    },
    {
      key: "dueAmount", label: "Due",
      render: v => (
        <span style={{ color: parseFloat(v) > 0 ? tokens.danger : tokens.success, fontWeight: 600 }}>
          {fmt.currency(v)}
        </span>
      ),
    },
    { key: "status",      label: "Status",   render: v => <Badge status={v} /> },
    { key: "invoiceDate", label: "Date",      sortable: true, render: v => fmt.date(v) },
    { key: "dueDate",     label: "Due Date",  sortable: true, render: v => fmt.date(v) },
    {
      key: "actions", label: "Actions",
      render: (_, row) => (
        <div style={{ display: "flex", gap: 5, flexWrap: "nowrap" }}>
          <Btn size="sm" variant="ghost" onClick={() => onView?.(row)}>View</Btn>
          <Btn size="sm" variant="ghost" onClick={() => openStatus(row)}>Status</Btn>
          <Btn size="sm" variant="ghost" onClick={() => handlePdf(row)} disabled={actionLoad[row.id] === "pdf"}>
            {actionLoad[row.id] === "pdf" ? "…" : "PDF"}
          </Btn>
          <Btn size="sm" variant="ghost" onClick={() => handleEmail(row)} disabled={actionLoad[row.id] === "email"}>
            {actionLoad[row.id] === "email" ? "…" : "Email"}
          </Btn>
          {onRecordPayment && parseFloat(row.dueAmount) > 0 && (
            <Btn size="sm" variant="success" onClick={() => onRecordPayment(row)}>Pay</Btn>
          )}
          {onEdit && <Btn size="sm" variant="ghost" onClick={() => onEdit(row)}>Edit</Btn>}
          <Btn size="sm" variant="danger" onClick={() => setDelTarget(row)}>Del</Btn>
        </div>
      ),
    },
  ];

  const totalBilled  = rows.reduce((s, r) => s + parseFloat(r.totalAmount || 0), 0);
  const totalPaid    = rows.reduce((s, r) => s + parseFloat(r.paidAmount   || 0), 0);
  const totalDue     = rows.reduce((s, r) => s + parseFloat(r.dueAmount    || 0), 0);
  const overdue      = rows.filter(r => r.status === "overdue").length;

  const clientOpts = [
    { value: "", label: "All Clients" },
    ...clients.map(c => ({ value: c.id, label: c.name })),
  ];

  return (
    <div style={pageStyle}>
      <PageHeader
        title="Final Invoices"
        subtitle="Manage and track all tax invoices"
        actions={onCreate && <Btn variant="primary" onClick={onCreate} icon="＋">New Invoice</Btn>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Invoices" value={pagination.total}          icon="📄" />
        <StatCard label="Total Billed"   value={fmt.currency(totalBilled)} icon="💰" />
        <StatCard label="Collected"      value={fmt.currency(totalPaid)}   icon="✅" color={tokens.success} />
        <StatCard label="Outstanding"    value={fmt.currency(totalDue)}    icon="⚠"  color={tokens.danger} />
        <StatCard label="Overdue"        value={overdue}                   icon="🔴" color={tokens.danger} />
      </div>

      <Card style={{ padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search invoice #…" />
          <Select value={status}   onChange={setStatus}   options={STATUS_OPTS}  placeholder="All Statuses" />
          <Select value={clientId} onChange={setClientId} options={clientOpts}   placeholder={null} />
          <Select value={sortBy}   onChange={setSortBy}
            options={[
              { value: "createdAt",     label: "Date Created" },
              { value: "invoiceNumber", label: "Invoice #"    },
              { value: "totalAmount",   label: "Amount"       },
              { value: "dueDate",       label: "Due Date"     },
              { value: "invoiceDate",   label: "Invoice Date" },
            ]}
            placeholder={null}
          />
          <Btn variant="ghost" size="sm"
            onClick={() => setSortOrder(o => o === "ASC" ? "DESC" : "ASC")}
            icon={sortOrder === "ASC" ? "↑" : "↓"}>
            {sortOrder}
          </Btn>
          <Btn variant="ghost" size="sm" onClick={() => load(1)}>Refresh</Btn>
        </div>
      </Card>

      <Card>
        {!loading && rows.length === 0 ? (
          <EmptyState
            icon="📄"
            title="No invoices found"
            message="No invoices match your current filters."
            action={onCreate && <Btn variant="primary" onClick={onCreate}>Create First Invoice</Btn>}
          />
        ) : (
          <>
            <Table cols={cols} rows={rows} loading={loading}
              onSort={handleSort} sortBy={sortBy} sortOrder={sortOrder} />
            <div style={{ padding: "0 16px" }}>
              <Pagination pagination={pagination} onChange={p => load(p)} />
            </div>
          </>
        )}
      </Card>

      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Update Invoice Status" width={360}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: tokens.textSub, fontWeight: 500, display: "block", marginBottom: 6 }}>
            New Status
          </label>
          <select
            value={newStatus}
            onChange={e => setNewStatus(e.target.value)}
            style={{
              background: tokens.elevated, border: `1px solid ${tokens.border}`,
              color: tokens.text, borderRadius: 8, padding: "9px 14px",
              fontSize: 14, outline: "none", fontFamily: "inherit",
              cursor: "pointer", width: "100%",
            }}
          >
            {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={() => setStatusModal(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={saveStatus}>Save</Btn>
        </div>
      </Modal>

      <ConfirmModal
        open={!!delTarget} onClose={() => setDelTarget(null)}
        onConfirm={handleDelete} title="Delete Invoice"
        message={`Delete invoice "${delTarget?.invoiceNumber}"? This action cannot be undone.`}
      />
    </div>
  );
}

export default function FinalInvoicePage(props) {
  return <ToastProvider><FinalInvoicePageInner {...props} /></ToastProvider>;
}