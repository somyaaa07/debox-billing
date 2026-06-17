import { useState, useEffect, useCallback } from "react";
import {
  FiPlus, FiSearch, FiFilter, FiArrowUp, FiArrowDown, FiRefreshCw,
  FiEye, FiEdit, FiTrash2, FiArrowRight, FiCheck, FiAlertCircle,FiMoreVertical,
} from "react-icons/fi";
import {
  tokens, fmt, Badge, Btn, Card, StatCard, Modal, ConfirmModal,
  PageHeader, SearchBar, Select, Pagination, Table, EmptyState,
  Spinner, useToast, ToastProvider, pageStyle,
} from "../shared.jsx";
import { purchaseOrderService } from "../../services/api.js";


// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_OPTS = [
  { value: "pending",   label: "Pending"   },
  { value: "approved",  label: "Approved"  },
  { value: "rejected",  label: "Rejected"  },
  { value: "converted", label: "Converted" },
  { value: "completed", label: "Completed" },
];

const SORT_OPTS = [
  { value: "createdAt",   label: "Date Created" },
  { value: "poNumber",    label: "PO Number"    },
  { value: "totalAmount", label: "Amount"       },
];

// ─── Component ────────────────────────────────────────────────────────────────
function PurchaseOrderPageInner({ onView, onCreate, onEdit }) {
  const toast = useToast();

  const [rows,        setRows]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [pagination,  setPagination]  = useState({ page: 1, totalPages: 1, total: 0, limit: 15 });
  const [search,      setSearch]      = useState("");
  const [status,      setStatus]      = useState("");
  const [sortBy,      setSortBy]      = useState("createdAt");
  const [sortOrder,   setSortOrder]   = useState("DESC");
  const [delTarget,   setDelTarget]   = useState(null);
  const [converting,  setConverting]  = useState(null);
  const [actionRow,   setActionRow]   = useState(null);
  const [newStatus,   setNewStatus]   = useState("");
  const [statusModal, setStatusModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

// Menu Button
    const MenuItem = ({
      icon,
      label,
      onClick,
      danger = false,
      }) => (
      <button
        onClick={onClick}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 14px",
          border: "none",
          background: "white",
          cursor: "pointer",
          fontSize: "14px",
          color: danger ? "#dc2626" : "#374151",
          transition: "0.2s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "#f3f4f6")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "white")
        }
      >
        {icon}
        {label}
      </button>
    );

  // ── fetch ──────────────────────────────────────────────────────────────────
  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const r = await purchaseOrderService.getAll({ 
        page, 
        limit: 15, 
        search, 
        status, 
        sortBy, 
        sortOrder 
      });
      setRows(r.data?.data || []);
      setPagination(r.data?.pagination || { page: 1, totalPages: 1, total: 0, limit: 15 });
    } catch (e) {
      toast(e.response?.data?.message || e.message || "Failed to load purchase orders", "error");
    } finally {
      setLoading(false);
    }
  }, [search, status, sortBy, sortOrder]);

  useEffect(() => { load(1); }, [load]);

  // ── sort ───────────────────────────────────────────────────────────────────
  const handleSort = (col) => {
    if (sortBy === col) setSortOrder(o => o === "ASC" ? "DESC" : "ASC");
    else { setSortBy(col); setSortOrder("ASC"); }
  };

  // ── delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      await purchaseOrderService.delete(delTarget.id);
      toast("Purchase order deleted");
      load(pagination.page);
    } catch (e) {
      toast(e.response?.data?.message || e.message || "Failed to delete", "error");
    } finally {
      setDelTarget(null);
    }
  };

  // ── status update ──────────────────────────────────────────────────────────
  const openStatusModal = (row) => {
    setActionRow(row);
    setNewStatus(row.status);
    setStatusModal(true);
  };

  const handleStatusSave = async () => {
    try {
      await purchaseOrderService.updateStatus(actionRow.id, newStatus);
      toast(`Status updated to ${newStatus}`);
      setStatusModal(false);
      load(pagination.page);
    } catch (e) {
      toast(e.response?.data?.message || e.message || "Failed to update status", "error");
    }
  };

  // ── convert ────────────────────────────────────────────────────────────────
  const handleConvert = async (row) => {
    if (row.status === "converted") { 
      toast("Already converted", "warning"); 
      return; 
    }
    setConverting(row.id);
    try {
      const r = await purchaseOrderService.convertToPI(row.id);
      toast(r.data?.message || "Converted to Proforma Invoice");
      load(pagination.page);
    } catch (e) {
      toast(e.response?.data?.message || e.message || "Conversion failed", "error");
    } finally {
      setConverting(null);
    }
  };

  // ── columns ────────────────────────────────────────────────────────────────
  const cols = [
    {
      key: "poNumber",
      label: "PO Number",
      sortable: true,
      render: (v, row) => (
        <button 
          onClick={() => {
            if (!onView) { console.warn("onView prop not provided"); return; }
            onView(row);
          }} 
          style={{
            background: "none",
            border: "none",
            color: tokens.accent,
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 14,
            padding: 0,
            textDecoration: "none",
          }}
        >
          {v || row.internalPoNumber}
        </button>
      ),
    },
    {
      key: "internalPoNumber",
      label: "Internal #",
      render: (v) => <span style={{ color: tokens.textSub, fontSize: 13 }}>{v}</span>,
    },
    { 
      key: "client",  
      label: "Client",  
      render: (_, row) => row.client?.name || "—" 
    },
    { 
      key: "company", 
      label: "Company", 
      render: (_, row) => row.client?.company || "—" 
    },
    {
      key: "totalAmount",
      label: "Amount",
      sortable: true,
      render: v => <span style={{ fontWeight: 600, color: tokens.success }}>{fmt.currency(v)}</span>,
    },
    { 
      key: "status", 
      label: "Status", 
      render: v => <Badge status={v} /> 
    },
    {
      key: "poDate",
      label: "PO Date",
      sortable: true,
      render: v => fmt.date(v),
    },
    // {
    //   key: "actions",
    //   label: "Actions",
    //   render: (_, row) => (
    //     <div style={actionCellS}>
    //       <Btn 
    //         size="sm" 
    //         variant="ghost" 
    //         onClick={() => {
    //           if (!onView) { console.warn("onView prop not provided"); return; }
    //           onView(row);
    //         }}
    //         icon={<FiEye size={16} />}
    //       >
           
    //       </Btn>
    //       <Btn 
    //         size="sm" 
    //         variant="ghost" 
    //         onClick={() => openStatusModal(row)}
    //         icon={<FiFilter size={16} />}
    //       >
    //         Status
    //       </Btn>
    //       <Btn 
    //         size="sm" 
    //         variant="primary" 
    //         onClick={() => handleConvert(row)}
    //         disabled={row.status === "converted" || converting === row.id}
    //         icon={<FiArrowRight size={16} />}
    //       >
    //         {converting === row.id ? "…" : "PI"}
    //       </Btn>
    //       {onEdit && (
    //          <Btn
    //           size="sm"
    //           variant="ghost"
    //           onClick={() => onEdit(row)}
    //           icon={<FiEdit size={18} />}
    //           />
    //       )}
    //         <Btn
    //         size="sm"
    //         variant="danger"
    //         onClick={() => setDelTarget(row)}
    //         icon={<FiTrash2 size={18} />}
    //       />
    //     </div>
    //   ),
    // },

    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
          }}
        >
      <button
        onClick={() =>
          setActiveMenu(activeMenu === row.id ? null : row.id)
        }
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          padding: "8px",
          borderRadius: "8px",
        }}
      >
        <FiMoreVertical size={20} />
      </button>

      {activeMenu === row.id && (
        <div
          style={{
            position: "absolute",
            top: "40px",
            right: 0,
            background: "#fff",
            minWidth: "180px",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0,0,0,.12)",
            border: "1px solid #e5e7eb",
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          <MenuItem
            icon={<FiEye />}
            label="View"
            onClick={() => {
              onView(row);
              setActiveMenu(null);
            }}
          />

          <MenuItem
            icon={<FiEdit />}
            label="Edit"
            onClick={() => {
              onEdit?.(row);
              setActiveMenu(null);
            }}
          />

          <MenuItem
            icon={<FiFilter />}
            label="Update Status"
            onClick={() => {
              openStatusModal(row);
              setActiveMenu(null);
            }}
          />

          <MenuItem
            icon={<FiArrowRight />}
            label="Convert to PI"
            onClick={() => {
              handleConvert(row);
              setActiveMenu(null);
            }}
          />

          <MenuItem
            danger
            icon={<FiTrash2 />}
            label="Delete"
            onClick={() => {
              setDelTarget(row);
              setActiveMenu(null);
            }}
          />
        </div>
      )}
    </div>
  ),
}
  ];

  // ── stats ──────────────────────────────────────────────────────────────────
  const total     = rows.reduce((s, r) => s + parseFloat(r.totalAmount || 0), 0);
  const pending   = rows.filter(r => r.status === "pending").length;
  const converted = rows.filter(r => r.status === "converted").length;

  return (
    <div style={pageWrapperS}>
      {/* Page Header */}
      <div style={headerWrapperS}>
        <div>
          <h1 style={pageTitleS}>Purchase Orders</h1>
          <p style={pageSubtitleS}>Manage incoming purchase orders and track conversions</p>
        </div>
        {onCreate && (
          <Btn 
            variant="primary" 
            onClick={onCreate}
            icon={<FiPlus size={18} />}
            style={createButtonS}
          >
            New PO
          </Btn>
        )}
      </div>

      {/* Stats Grid - Responsive */}
      <div style={statsGridS}>
        <StatCard 
          label="Total POs" 
          value={pagination.total} 
          icon={<FiFilter size={20} />}
        />
        <StatCard 
          label="Total Value" 
          value={fmt.currency(total)} 
          icon={<FiArrowUp size={20} />}
          color={tokens.success}
        />
        <StatCard 
          label="Pending" 
          value={pending} 
          icon={<FiAlertCircle size={20} />}
          color={tokens.danger}
        />
        <StatCard 
          label="Converted" 
          value={converted} 
          icon={<FiCheck size={20} />}
          color={tokens.accent}
        />
      </div>

      {/* Filter Section */}
      <Card style={filterCardS}>
        <div style={filterWrapperS}>
          <div style={searchInputWrapperS}>
            <SearchBar 
              value={search} 
              onChange={v => setSearch(v)} 
              placeholder="Search PO number…"
              icon={<FiSearch size={16} />}
            />
          </div>

          <div style={filterControlsS}>
            <Select 
              value={status} 
              onChange={setStatus} 
              options={STATUS_OPTS} 
              placeholder="All Statuses"
            />
            <Select 
              value={sortBy} 
              onChange={setSortBy} 
              options={SORT_OPTS}
              placeholder={null}
            />
            <Btn 
              variant="ghost" 
              size="sm"
              onClick={() => setSortOrder(o => o === "ASC" ? "DESC" : "ASC")}
              icon={sortOrder === "ASC" ? <FiArrowUp size={16} /> : <FiArrowDown size={16} />}
              style={sortButtonS}
            >
              Sort
            </Btn>
            <Btn 
              variant="ghost" 
              size="sm" 
              onClick={() => load(1)}
              icon={<FiRefreshCw size={16} />}
              style={refreshButtonS}
            >
              Refresh
            </Btn>
          </div>
        </div>
      </Card>

      {/* Table Card */}
      <Card style={tableCardS}>
        {!loading && rows.length === 0 ? (
          <EmptyState 
            icon={<FiFilter size={40} />}
            title="No purchase orders" 
            message="No POs match your current filters."
            action={onCreate && (
              <Btn variant="primary" onClick={onCreate}>
                Create First PO
              </Btn>
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

      {/* Status Update Modal */}
      <Modal 
        open={statusModal} 
        onClose={() => setStatusModal(false)} 
        title="Update PO Status" 
        width={380}
      >
        <div style={modalContentS}>
          <label style={labelS}>New Status</label>
          <select 
            value={newStatus} 
            onChange={e => setNewStatus(e.target.value)} 
            style={selectInputS}
          >
            {STATUS_OPTS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div style={modalActionsS}>
          <Btn variant="ghost" onClick={() => setStatusModal(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={handleStatusSave}>Save Status</Btn>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={handleDelete}
        title="Delete Purchase Order"
        message={`Delete PO "${delTarget?.poNumber || delTarget?.internalPoNumber}"? This action cannot be undone.`}
      />
    </div>
  );
}

export default function PurchaseOrderPage(props) {
  return <ToastProvider><PurchaseOrderPageInner {...props} /></ToastProvider>;
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

const createButtonS = {
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const statsGridS = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 16,
  marginBottom: 28,
};

const filterCardS = {
  padding: "16px 20px",
  marginBottom: 20,
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  background: "#fafbfc",
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
  minWidth: "auto",
};

const refreshButtonS = {
  minWidth: "auto",
};

// const tableCardS = {
//   border: "1px solid #e5e7eb",
//   borderRadius: 10,
//   overflow: "hidden",
//   boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
// };

const tableCardS = {
  background: "#fff",
  borderRadius: "20px",
  overflow: "hidden",
  boxShadow: "0 10px 30px rgba(0,0,0,.08)",
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
  gap: 6,
  flexWrap: "wrap",
};

const modalContentS = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  marginBottom: 24,
};

const labelS = {
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
};

const selectInputS = {
  padding: "10px 13px",
  fontSize: 14,
  color: "#1f2937",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "#ffffff",
  fontFamily: "inherit",
  outline: "none",
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const modalActionsS = {
  display: "flex",
  gap: 10,
  justifyContent: "flex-end",
};

//  ── USAGE ────────────────────────────────────────────────────────────────────
//  <PurchaseOrderPage
//    onView={(po)  => navigate(`/purchase-orders/${po.id}`)}
//    onCreate={()  => navigate("/purchase-orders/new")}
//    onEdit={(po)  => navigate(`/purchase-orders/${po.id}/edit`)}
//  />
// ─────────────────────────────────────────────────────────────────────────────