import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft, FiRefreshCw, FiDownload, FiMail, FiEdit2, FiTrash2,
  FiBarChart2, FiHome, FiPackage, FiDollarSign, FiTag, FiCalendar, FiCheck
} from "react-icons/fi";
import {
  tokens, fmt, Badge, Btn, Card, StatCard, Modal, ConfirmModal,
  DetailRow, PageHeader, SectionDivider, Spinner, EmptyState,
  useToast, ToastProvider, pageStyle,
} from "../shared.jsx";
import { quotationService } from "../../services/api.js";

const STATUS_OPTIONS = [
  { value: "draft",    label: "Draft"    },
  { value: "sent",     label: "Sent"     },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function QuotationDetailInner({ quotationId: propId, onBack, onEdit }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const quotationId  = propId || id;
  const handleBack   = onBack  ?? (() => navigate("/quotations"));
  const handleEdit   = onEdit  ?? ((q) => navigate(`/quotations/${q.id}/edit`));

  const toast = useToast();

  const [quotation,    setQuotation]  = useState(null);
  const [loading,      setLoading]    = useState(true);
  const [actionLoad,   setActionLoad] = useState("");
  const [statusModal,  setStatusModal]= useState(false);
  const [deleteModal,  setDeleteModal]= useState(false);
  const [newStatus,    setNewStatus]  = useState("");

  // ── fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!quotationId) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    quotationService.getOne(quotationId, { signal: controller.signal })
      .then(r => {
        const data = r.data?.data || r.data;
        setQuotation(data);
        setNewStatus(data?.status);
      })
      .catch(e => {
        if (e.code === "ERR_CANCELED") return;
        toast(e.response?.data?.message || e.message || "Failed to load quotation", "error");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [quotationId]);

  // ── status update ─────────────────────────────────────────────────────────
  const handleStatusUpdate = async () => {
    setActionLoad("status");
    try {
      const r = await quotationService.updateStatus(quotation.id, newStatus);
      setQuotation(prev => ({ ...prev, status: newStatus, ...(r.data?.data || r.data) }));
      toast(`Status updated to ${newStatus}`);
      setStatusModal(false);
    } catch (e) {
      toast(e.response?.data?.message || e.message || "Failed to update status", "error");
    } finally {
      setActionLoad("");
    }
  };

  // ── pdf download ──────────────────────────────────────────────────────────
  const handleDownloadPdf = async () => {
    setActionLoad("pdf");
    try {
      const r = await quotationService.downloadPdf(quotation.id);
      const blob = new Blob([r.data], { type: "application/pdf" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url;
      a.download = `quotation-${quotation.quotationNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast("PDF downloaded");
    } catch (e) {
      toast(e.response?.data?.message || e.message || "PDF generation failed", "error");
    } finally {
      setActionLoad("");
    }
  };

  // ── email ─────────────────────────────────────────────────────────────────
  const handleEmail = async () => {
    setActionLoad("email");
    try {
      const r = await quotationService.email(quotation.id);
      setQuotation(prev => ({ ...prev, status: "sent" }));
      toast(r.data?.message || "Quotation emailed");
    } catch (e) {
      toast(e.response?.data?.message || e.message || "Failed to send email", "error");
    } finally {
      setActionLoad("");
    }
  };

  // ── delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      await quotationService.delete(quotation.id);
      toast("Quotation deleted");
      handleBack();
    } catch (e) {
      toast(e.response?.data?.message || e.message || "Failed to delete", "error");
    }
  };

  // ── loading / empty ───────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ ...pageStyle, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#ffffff" }}>
      <Spinner size={40} />
    </div>
  );

  if (!quotation) return (
    <div style={{ ...pageStyle, background: "#ffffff", minHeight: "100vh" }}>
      <EmptyState
        icon={<FiPackage size={40} />}
        title="Quotation not found"
        message="This quotation does not exist or was deleted."
        action={<Btn onClick={handleBack}>Go Back</Btn>}
      />
    </div>
  );

  const { client, items = [] } = quotation;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ ...pageStyle, background: "#ffffff", minHeight: "100vh", paddingTop: 24, paddingBottom: 40 }}>
      
      {/* Header with Actions */}
      <div style={headerWrapperS}>
        <div>
          <h1 style={titleS}>Quotation {quotation.quotationNumber}</h1>
          <p style={subtitleS}>Created on {fmt.date(quotation.createdAt)}</p>
        </div>
        <div style={actionButtonsS}>
          <Btn variant="ghost" onClick={handleBack} icon={<FiArrowLeft size={18} />}>Back</Btn>
          <Btn variant="ghost" onClick={() => setStatusModal(true)} icon={<FiRefreshCw size={18} />}>Status</Btn>
          <Btn variant="ghost" onClick={handleDownloadPdf} disabled={actionLoad === "pdf"} icon={<FiDownload size={18} />}>
            {actionLoad === "pdf" ? "…" : "PDF"}
          </Btn>
          <Btn variant="ghost" onClick={handleEmail} disabled={actionLoad === "email"} icon={<FiMail size={18} />}>
            {actionLoad === "email" ? "Sending…" : "Email"}
          </Btn>
          <Btn variant="primary" onClick={() => handleEdit(quotation)} icon={<FiEdit2 size={18} />}>Edit</Btn>
          <Btn variant="danger" onClick={() => setDeleteModal(true)} icon={<FiTrash2 size={18} />}>Delete</Btn>
        </div>
      </div>

      {/* Stats Grid - Responsive */}
      <div style={statsGridS}>
        <StatCard 
          label="Subtotal" 
          value={fmt.currency(quotation.subtotal)} 
          icon={<FiBarChart2 size={20} />} 
        />
        <StatCard 
          label="GST" 
          value={fmt.currency(quotation.gstAmount)} 
          icon={<FiHome size={20} />} 
        />
        <StatCard 
          label="Discount" 
          value={fmt.currency(quotation.discount)} 
          icon={<FiTag size={20} />} 
          color={tokens.warning} 
        />
        <StatCard 
          label="Total" 
          value={fmt.currency(quotation.totalAmount)} 
          icon={<FiDollarSign size={20} />} 
          color={tokens.success} 
        />
      </div>

      {/* Client & Quotation Info - Responsive */}
      <div style={detailsGridS}>
        <Card style={cardS}>
          <SectionDivider label="Client Details" />
          {client ? (
            <>
              <DetailRow label="Name"    value={client.name} />
              <DetailRow label="Company" value={client.company} />
              <DetailRow label="Email"   value={client.email} />
              <DetailRow label="Phone"   value={client.phone} />
              <DetailRow label="GST No." value={client.gstNumber} />
              <DetailRow label="Address" value={client.address} />
            </>
          ) : (
            <p style={{ color: tokens.muted, fontSize: 14, margin: 0 }}>No client linked</p>
          )}
        </Card>

        <Card style={cardS}>
          <SectionDivider label="Quotation Info" />
          <DetailRow label="Status"      value={<Badge status={quotation.status} />} />
          <DetailRow label="Quote Date"  value={fmt.date(quotation.quotationDate)} />
          <DetailRow label="Valid Until" value={fmt.date(quotation.validUntil)} />
          <DetailRow label="Approved At" value={fmt.date(quotation.approvedAt)} />
          <DetailRow label="Sent At"     value={fmt.date(quotation.sentAt)} />
          {quotation.notes && (
            <>
              <SectionDivider label="Notes" />
              <p style={{ fontSize: 13, color: tokens.textSub, margin: 0, lineHeight: 1.6 }}>
                {quotation.notes}
              </p>
            </>
          )}
          {quotation.terms && (
            <>
              <SectionDivider label="Terms & Conditions" />
              <p style={{ fontSize: 13, color: tokens.textSub, margin: 0, lineHeight: 1.6 }}>
                {quotation.terms}
              </p>
            </>
          )}
        </Card>
      </div>

      {/* Line Items */}
      <Card style={cardS}>
        <div style={tableHeaderS}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: tokens.text }}>
            <FiPackage size={18} style={{ marginRight: 8, verticalAlign: "middle" }} />
            Line Items
          </h3>
        </div>
        {items.length === 0 ? (
          <EmptyState 
            icon={<FiPackage size={40} />} 
            title="No items" 
            message="This quotation has no line items." 
          />
        ) : (
          <>
            <div style={tableWrapperS}>
              <table style={tableS}>
                <thead>
                  <tr>
                    {["#", "Description", "HSN", "Qty", "Unit", "Unit Price", "GST %", "GST Amt", "Discount", "Total"].map(h => (
                      <th key={h} style={tableHeadS}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={item.id || i}
                      style={tableRowS}
                      onMouseEnter={e => e.currentTarget.style.background = "#000"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={tdS}>{i + 1}</td>
                      <td style={{ ...tdS, maxWidth: 220, whiteSpace: "normal" }}>{item.description}</td>
                      <td style={tdS}>{item.hsnCode || "—"}</td>
                      <td style={tdS}>{item.quantity}</td>
                      <td style={tdS}>{item.unit || "—"}</td>
                      <td style={tdS}>{fmt.currency(item.unitPrice)}</td>
                      <td style={tdS}>{item.gstRate}%</td>
                      <td style={tdS}>{fmt.currency(item.gstAmount)}</td>
                      <td style={tdS}>{fmt.currency(item.discount)}</td>
                      <td style={{ ...tdS, fontWeight: 700, color: tokens.success }}>{fmt.currency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Summary */}
            <div style={totalSummaryS}>
              <div style={totalBoxS}>
                <TotalRow label="Subtotal" value={fmt.currency(quotation.subtotal)} />
                <TotalRow label="GST"      value={fmt.currency(quotation.gstAmount)} />
                <TotalRow label="Discount" value={`- ${fmt.currency(quotation.discount)}`} color={tokens.warning} />
                <div style={{ height: 1, background: "#e5e7eb", margin: "8px 0" }} />
                <TotalRow label="Total" value={fmt.currency(quotation.totalAmount)} bold color={tokens.success} />
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Status Update Modal */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Update Status" width={380}>
        <FormSelect
          label="New Status"
          value={newStatus}
          onChange={e => setNewStatus(e.target.value)}
          options={STATUS_OPTIONS}
        />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <Btn variant="ghost" onClick={() => setStatusModal(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={handleStatusUpdate} disabled={actionLoad === "status"}>
            {actionLoad === "status" ? "Saving…" : "Save Status"}
          </Btn>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Quotation"
        message={`Are you sure you want to delete ${quotation.quotationNumber}? This action cannot be undone.`}
      />
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const headerWrapperS = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 32,
  flexWrap: "wrap",
  gap: 20,
};

const titleS = {
  fontSize: "clamp(24px, 5vw, 32px)",
  fontWeight: 800,
  margin: 0,
  color: "#1f2937",
  letterSpacing: "-0.5px",
};

const subtitleS = {
  fontSize: 14,
  color: "#6b7280",
  margin: "8px 0 0 0",
};

const actionButtonsS = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const statsGridS = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 16,
  marginBottom: 32,
};

const detailsGridS = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: 20,
  marginBottom: 20,
};

const cardS = {
  padding: "20px 24px",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};

const tableHeaderS = {
  padding: "16px 20px",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
};

const tableWrapperS = {
  overflowX: "auto",
};

const tableS = {
  width: "100%",
  borderCollapse: "collapse",
};

const tableHeadS = {
  padding: "10px 14px",
  textAlign: "left",
  fontSize: "clamp(11px, 1.5vw, 12px)",
  color: "#6b7280",
  fontWeight: 600,
  textTransform: "uppercase",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
  background: "#f9fafb",
};

const tableRowS = {
  borderBottom: "1px solid #e5e7eb20",
  transition: "background 0.15s ease",
};

const tdS = {
  padding: "12px 14px",
  fontSize: "clamp(12px, 1.5vw, 14px)",
  color: "#374151",
  whiteSpace: "nowrap",
};

const totalSummaryS = {
  display: "flex",
  justifyContent: "flex-end",
  padding: "16px 20px",
};

const totalBoxS = {
  width: "100%",
  maxWidth: 280,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function TotalRow({ label, value, bold, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", gap: 16 }}>
      <span style={{ fontSize: "clamp(12px, 1.5vw, 13px)", color: "#6b7280", flex: 1 }}>{label}</span>
      <span style={{ fontSize: "clamp(13px, 1.5vw, 14px)", fontWeight: bold ? 700 : 500, color: color || "#374151", whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );
}

function FormSelect({ label, value, onChange, options }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {label && <label style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>{label}</label>}
      <select value={value} onChange={onChange} style={{
        background: "#ffffff",
        border: "1px solid #d1d5db",
        color: "#1f2937",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 14,
        outline: "none",
        fontFamily: "inherit",
        cursor: "pointer",
        transition: "border-color 0.2s",
      }}
        onFocus={e => e.target.style.borderColor = tokens.primary}
        onBlur={e => e.target.style.borderColor = "#d1d5db"}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
export default function QuotationDetailPage(props) {
  return (
    <ToastProvider>
      <QuotationDetailInner {...props} />
    </ToastProvider>
  );
}