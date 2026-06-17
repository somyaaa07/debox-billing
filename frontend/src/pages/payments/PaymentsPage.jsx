// ─── PaymentPage.jsx ──────────────────────────────────────────────────────────
// Lists all recorded payments with search, client filter, payment-mode filter,
// sortable columns, pagination, receipt PDF download, and delete.
// ─────────────────────────────────────────────────────────────────────────────
import {
  FiCreditCard,
  FiDollarSign,
  FiClipboard,
  FiAward,
  FiDownload,
  FiTrash2,
  FiPlus,
  FiRefreshCw,
  FiArrowUp,
  FiArrowDown,
  FiFilter,
  FiSearch,
} from "react-icons/fi";
import { useState, useEffect, useCallback } from "react";
import {
  tokens, fmt, Badge, Btn, Card, ConfirmModal,
  SearchBar, Select, Pagination, Table, EmptyState,
  useToast, ToastProvider, pageStyle,
} from "../shared.jsx";
import { clientService, paymentService } from "../../services/api.js";

// ─── API ──────────────────────────────────────────────────────────────────────
const api = {
  getPayments: (params) => paymentService.getAll(params).then(r => r.data),
  deletePayment: (id) => paymentService.delete(id).then(r => r.data),
  downloadReceipt: (id) => paymentService.downloadReceipt(id),
  getClients: () => clientService.getAll({ limit: 200 }).then(r => r.data),
};

// ─── Constants ────────────────────────────────────────────────────────────────
const PAYMENT_MODE_OPTS = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank Transfer" },
  { value: "upi", label: "UPI" },
  { value: "cheque", label: "Cheque" },
  { value: "card", label: "Card" },
  { value: "online", label: "Online" },
];

// ─── StatCard Component ────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }) {
  const colorMap = {
    blue: { bg: "#eff6ff", icon: "#2563eb", text: "#2563eb" },
    green: { bg: "#ecfdf5", icon: "#16a34a", text: "#16a34a" },
    orange: { bg: "#fff7ed", icon: "#ea580c", text: "#ea580c" },
    purple: { bg: "#f5f3ff", icon: "#7c3aed", text: "#7c3aed" },
    red: { bg: "#fee2e2", icon: "#dc2626", text: "#dc2626" },
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <div style={statCardS}>
      <div style={{ ...statIconWrapperS, background: c.bg, color: c.icon }}>
        {Icon && <Icon size={20} />}
      </div>
      <div style={statContentS}>
        <p style={statLabelS}>{label}</p>
        <p style={{ ...statValueS, color: c.text }}>{value}</p>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
function PaymentPageInner({ onView, onCreate }) {
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 15 });
  const [search, setSearch] = useState("");
  const [clientId, setClientId] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("DESC");
  const [delTarget, setDelTarget] = useState(null);
  const [clients, setClients] = useState([]);
  const [downloading, setDownloading] = useState(null);

  // ── load clients for filter ─────────────────────────────────────────────────
  useEffect(() => {
    api.getClients()
      .then(r => setClients(r.data || []))
      .catch(() => { });
  }, []);

  // ── fetch ──────────────────────────────────────────────────────────────────
  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 15, sortBy, sortOrder };
      if (search) params.search = search;
      if (clientId) params.clientId = clientId;
      if (paymentMode) params.paymentMode = paymentMode;
      const r = await api.getPayments(params);
      setRows(r.data || []);
      setPagination(r.pagination || { page: 1, totalPages: 1, total: 0, limit: 15 });
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [search, clientId, paymentMode, sortBy, sortOrder]);

  useEffect(() => { load(1); }, [load]);

  // ── sort ───────────────────────────────────────────────────────────────────
  const handleSort = col => {
    if (sortBy === col) setSortOrder(o => o === "ASC" ? "DESC" : "ASC");
    else { setSortBy(col); setSortOrder("ASC"); }
  };

  // ── delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      await api.deletePayment(delTarget.id);
      toast("Payment deleted and invoice amounts reversed");
      load(pagination.page);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setDelTarget(null);
    }
  };

  // ── receipt ────────────────────────────────────────────────────────────────
  const handleReceipt = async row => {
    setDownloading(row.id);
    try {
      const res = await api.downloadReceipt(row.id);
      const blob = res.data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${row.paymentNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Receipt downloaded");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setDownloading(null);
    }
  };

  // ── mode badge ─────────────────────────────────────────────────────────────
  const modeBadge = mode => {
    const colors = {
      cash: { bg: "#dcfce7", text: "#166534" },
      bank: { bg: "#dbeafe", text: "#1e40af" },
      upi: { bg: "#e9d5ff", text: "#5b21b6" },
      cheque: { bg: "#fef3c7", text: "#92400e" },
      card: { bg: "#f3e8ff", text: "#6b21a8" },
      online: { bg: "#dbeafe", text: "#1e40af" },
    };
    const m = (mode || "").toLowerCase();
    const c = colors[m] || { bg: "#f3f4f6", text: "#374151" };
    return (
      <span style={{
        background: c.bg,
        color: c.text,
        padding: "4px 12px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        textTransform: "capitalize",
        display: "inline-block",
      }}>
        {m || "—"}
      </span>
    );
  };

  // ── columns ────────────────────────────────────────────────────────────────
  const cols = [
    {
      key: "paymentNumber",
      label: "Receipt #",
      sortable: true,
      render: (v, row) => (
        <button
          onClick={() => onView?.(row)}
          style={{
            fontWeight: 700,
            color: tokens.accent,
            cursor: onView ? "pointer" : "default",
            background: "none",
            border: "none",
            fontSize: 14,
            padding: 0,
          }}
        >
          {v}
        </button>
      ),
    },
    {
      key: "client",
      label: "Client",
      render: (_, row) => row.client?.name || "—",
    },
    {
      key: "company",
      label: "Company",
      render: (_, row) => row.client?.company || "—",
    },
    {
      key: "finalInvoice",
      label: "Invoice #",
      render: (_, row) => row.finalInvoice?.invoiceNumber || "—",
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: v => (
        <span style={{ fontWeight: 700, color: tokens.success, fontSize: 15 }}>
          {fmt.currency(v)}
        </span>
      ),
    },
    {
      key: "paymentMode",
      label: "Mode",
      render: v => modeBadge(v),
    },
    {
      key: "referenceNumber",
      label: "Ref #",
      render: v => <span style={{ color: "#6b7280", fontSize: 13 }}>{v || "—"}</span>,
    },
    {
      key: "paymentDate",
      label: "Date",
      sortable: true,
      render: v => fmt.date(v),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div style={actionCellS}>
          <button
            onClick={() => handleReceipt(row)}
            disabled={downloading === row.id}
            title="Download Receipt"
            style={iconButtonS}
          >
            <FiDownload size={16} />
          </button>
          <button
            onClick={() => setDelTarget(row)}
            title="Delete Payment"
            style={{ ...iconButtonS, color: "#ef4444" }}
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  // ── stats ──────────────────────────────────────────────────────────────────
  const totalCollected = rows.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
  const modeBreakdown = rows.reduce((acc, r) => {
    const m = r.paymentMode || "other";
    acc[m] = (acc[m] || 0) + parseFloat(r.amount || 0);
    return acc;
  }, {});
  const topMode = Object.entries(modeBreakdown).sort((a, b) => b[1] - a[1])[0];

  const clientOpts = [
    { value: "", label: "All Clients" },
    ...clients.map(c => ({ value: c.id, label: c.name }))
  ];

  return (
    <div style={pageWrapperS}>
      {/* Page Header */}
      <div style={headerWrapperS}>
        <div>
          <h1 style={pageTitleS}>Payments</h1>
          <p style={pageSubtitleS}>Track all received payments and download receipts</p>
        </div>
        {onCreate && (
          <button
            onClick={onCreate}
            style={createButtonS}
          >
            <FiPlus size={18} />
            <span>Record Payment</span>
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div style={statsGridS}>
        <StatCard
          label="Total Payments"
          value={pagination.total}
          icon={FiCreditCard}
          color="blue"
        />
        <StatCard
          label="Total Collected"
          value={fmt.currency(totalCollected)}
          icon={FiDollarSign}
          color="green"
        />
        <StatCard
          label="Page Total"
          value={fmt.currency(totalCollected)}
          icon={FiClipboard}
          color="orange"
        />
        <StatCard
          label="Top Mode"
          value={topMode ? `${topMode[0]} (${fmt.currency(topMode[1])})` : "—"}
          icon={FiAward}
          color="purple"
        />
      </div>

      {/* Filters */}
      <Card style={filterCardS}>
        <div style={filterWrapperS}>
          <div style={searchInputWrapperS}>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search payment #, ref…"
              icon={<FiSearch size={16} />}
            />
          </div>

          <div style={filterControlsS}>
            <Select
              value={clientId}
              onChange={setClientId}
              options={clientOpts}
              placeholder={null}
            />
            <Select
              value={paymentMode}
              onChange={setPaymentMode}
              options={PAYMENT_MODE_OPTS}
              placeholder="All Modes"
            />
            <Select
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: "createdAt", label: "Date Created" },
                { value: "paymentDate", label: "Payment Date" },
                { value: "amount", label: "Amount" },
              ]}
              placeholder={null}
            />
            <button
              onClick={() => setSortOrder(o => o === "ASC" ? "DESC" : "ASC")}
              title="Toggle sort direction"
              style={sortButtonS}
            >
              {sortOrder === "ASC" ? <FiArrowUp size={16} /> : <FiArrowDown size={16} />}
            </button>
            <button
              onClick={() => load(1)}
              title="Refresh data"
              style={refreshButtonS}
            >
              <FiRefreshCw size={16} />
            </button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card style={tableCardS}>
        {!loading && rows.length === 0 ? (
          <EmptyState
            icon={<FiCreditCard size={40} />}
            title="No payments recorded"
            message="No payments match your current filters."
            action={onCreate && (
              <button onClick={onCreate} style={createButtonS}>
                <FiPlus size={16} />
                <span>Record First Payment</span>
              </button>
            )}
          />
        ) : (
          <>
            <div style={tableWrapperS}>
              <Table
                cols={cols}
                rows={rows}
                loading={loading}
                onSort={handleSort}
                sortBy={sortBy}
                sortOrder={sortOrder}
              />
            </div>
            {!loading && (
              <div style={paginationWrapperS}>
                <Pagination pagination={pagination} onChange={p => load(p)} />
              </div>
            )}
          </>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={handleDelete}
        title="Delete Payment"
        message={`Delete payment "${delTarget?.paymentNumber}" of ${fmt.currency(delTarget?.amount)}? Invoice amounts will be reversed automatically.`}
      />
    </div>
  );
}

export default function PaymentPage(props) {
  return <ToastProvider><PaymentPageInner {...props} /></ToastProvider>;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const pageWrapperS = {
  background: "#ffffff",
  minHeight: "100vh",
  padding: "clamp(16px, 4vw, 24px)",
  paddingBottom: 40,
};

const headerWrapperS = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 32,
  gap: 20,
  flexWrap: "wrap",
};

const pageTitleS = {
  fontSize: "clamp(24px, 5vw, 32px)",
  fontWeight: 800,
  margin: 0,
  color: "#111827",
  letterSpacing: "-0.5px",
};

const pageSubtitleS = {
  fontSize: 14,
  color: "#6b7280",
  margin: "8px 0 0 0",
};

const statCardS = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 16,
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  transition: "all 0.2s ease",
};

const statIconWrapperS = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 40,
  height: 40,
  borderRadius: 8,
  flexShrink: 0,
};

const statContentS = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  flex: 1,
};

const statLabelS = {
  fontSize: 12,
  fontWeight: 600,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  margin: 0,
};

const statValueS = {
  fontSize: "clamp(16px, 2.5vw, 18px)",
  fontWeight: 700,
  margin: 0,
};

const statsGridS = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 12,
  marginBottom: 28,
};

const filterCardS = {
  padding: "16px 20px",
  marginBottom: 20,
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  background: "#fafbfc",
  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)",
};

const filterWrapperS = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
};

const searchInputWrapperS = {
  flex: "1 1 auto",
  minWidth: 200,
};

const filterControlsS = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
};

const sortButtonS = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 12px",
  fontSize: 14,
  color: "#6b7280",
  background: "#f3f4f6",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const refreshButtonS = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 12px",
  fontSize: 14,
  color: "#6b7280",
  background: "#f3f4f6",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const createButtonS = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 18px",
  fontSize: 14,
  fontWeight: 600,
  color: "#ffffff",
  background: "#3b82f6",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  transition: "all 0.2s ease",
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const tableCardS = {
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
};

const tableWrapperS = {
  overflowX: "auto",
  WebkitOverflowScrolling: "touch",
};

const paginationWrapperS = {
  padding: "16px 20px",
  borderTop: "1px solid #e5e7eb",
  background: "#fafbfc",
};

const actionCellS = {
  display: "flex",
  gap: 8,
  alignItems: "center",
};

const iconButtonS = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  padding: 0,
  borderRadius: 6,
  background: "#f3f4f6",
  border: "1px solid #e5e7eb",
  color: "#6b7280",
  cursor: "pointer",
  transition: "all 0.2s ease",
};

/* ── USAGE ────────────────────────────────────────────────────────────────────
  <PaymentPage
    onCreate={() => navigate("/payments/new")}
    onView={(p)  => navigate(`/payments/${p.id}`)}
  />
─────────────────────────────────────────────────────────────────────────────*/