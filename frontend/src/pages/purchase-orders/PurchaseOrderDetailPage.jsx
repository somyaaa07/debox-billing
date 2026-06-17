// ─── PurchaseOrderDetailPage.jsx ─────────────────────────────────────────────
// Full detail view for a Purchase Order:
// client info, line items, totals, status management,
// attachment download, and convert-to-Proforma-Invoice.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import {
  tokens, fmt, Badge, Btn, Card, StatCard, Modal, ConfirmModal,
  DetailRow, PageHeader, SectionDivider, Spinner, EmptyState,
  useToast, ToastProvider, pageStyle,
} from "../shared.jsx";
import { purchaseOrderService } from "../../services/api.js";
import {
  FiArrowLeft,
  FiPaperclip,
  FiRefreshCw,
  FiArrowRight,
  FiEdit,
  FiTrash2,
  FiDollarSign,
  FiFileText,
  FiPackage,
  FiTag,
} from "react-icons/fi";

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "pending",   label: "Pending"   },
  { value: "approved",  label: "Approved"  },
  { value: "rejected",  label: "Rejected"  },
  { value: "converted", label: "Converted" },
  { value: "completed", label: "Completed" },
];

// ─── Component ────────────────────────────────────────────────────────────────
function PurchaseOrderDetailInner({ poId, onBack, onEdit, onPICreated }) {
  const toast = useToast();

  const [po,           setPo]           = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [actionLoad,   setActionLoad]   = useState("");
  const [statusModal,  setStatusModal]  = useState(false);
  const [deleteModal,  setDeleteModal]  = useState(false);
  const [convertModal, setConvertModal] = useState(false);
  const [newStatus,    setNewStatus]    = useState("");

  // ── fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!poId) return;
    setLoading(true);
    purchaseOrderService.getOne(poId)
      .then(res => {
        setPo(res.data.data);
        setNewStatus(res.data.data.status);
      })
      .catch(e => toast(e.response?.data?.message || e.message, "error"))
      .finally(() => setLoading(false));
  }, [poId]);

  // ── status update ──────────────────────────────────────────────────────────
  const handleStatusSave = async () => {
    setActionLoad("status");
    try {
      await purchaseOrderService.updateStatus(po.id, newStatus);
      setPo(prev => ({ ...prev, status: newStatus }));
      toast(`Status updated to ${newStatus}`);
      setStatusModal(false);
    } catch (e) {
      toast(e.response?.data?.message || e.message, "error");
    } finally {
      setActionLoad("");
    }
  };

  // ── convert → PI ───────────────────────────────────────────────────────────
  const handleConvert = async () => {
    setActionLoad("convert");
    try {
      const res = await purchaseOrderService.convertToPI(po.id);
      toast(res.data.message || "Converted to Proforma Invoice");
      setPo(prev => ({ ...prev, status: "converted" }));
      setConvertModal(false);
      onPICreated?.(res.data.data);
    } catch (e) {
      toast(e.response?.data?.message || e.message, "error");
    } finally {
      setActionLoad("");
    }
  };

  // ── delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      await purchaseOrderService.delete(po.id);
      toast("Purchase order deleted");
      onBack?.();
    } catch (e) {
      toast(e.response?.data?.message || e.message, "error");
    }
  };

  // ── attachment ─────────────────────────────────────────────────────────────
  const handleAttachment = () => {
    if (!po?.attachmentPath) return;
    // Resolve against the API base URL from the axios instance
    const base = import.meta.env.VITE_API_URL || "/api/v1";
    window.open(`${base}/${po.attachmentPath}`, "_blank");
  };

  // ── loading / empty ────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ ...pageStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spinner size={40} />
    </div>
  );
  if (!po) return (
    <div style={pageStyle}>
      <EmptyState icon="📋" title="Purchase Order not found"
        message="This PO does not exist or was deleted."
        action={<Btn onClick={onBack}>Go Back</Btn>} />
    </div>
  );

  const { client, items = [] } = po;

  // Computed totals
  const subtotal = items.reduce((s, it) => s + parseFloat(it.unitPrice || 0) * parseFloat(it.quantity || 0), 0);
  const gst      = items.reduce((s, it) => s + parseFloat(it.gstAmount || 0), 0);
  const total    = subtotal + gst;

  return (
    <div style={pageStyle}>
      {/* Header */}
      <PageHeader
        title={`PO: ${po.poNumber || po.internalPoNumber}`}
        subtitle={`Internal: ${po.internalPoNumber} · Created ${fmt.date(po.createdAt)}`}
        actions={
          <>
            {onBack && (<Btn variant="ghost" onClick={onBack} icon={<FiArrowLeft size={16} />} > Back</Btn>)}
            {po.attachmentPath && (
              <Btn variant="ghost" onClick={handleAttachment} icon={<FiPaperclip size={16} />}>Attachment</Btn>
            )}
            <Btn variant="ghost" onClick={() => setStatusModal(true)} icon={<FiRefreshCw size={16} />}>Status</Btn>
            <Btn variant="primary"
              onClick={() => setConvertModal(true)}
              disabled={po.status === "converted" || actionLoad === "convert"}
              icon={<FiArrowRight size={16} />}>
              Convert to PI
            </Btn>
            {onEdit && <Btn variant="ghost" onClick={() => onEdit(po)} icon={<FiEdit size={16} />}>Edit</Btn>}
            <Btn variant="danger" onClick={() => setDeleteModal(true)} icon={<FiTrash2 size={16} />}>Delete</Btn>
          </>
        }
      />

      {/* Stat row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 24 }}>
          <StatCard
            label="Subtotal"
            value={fmt.currency(subtotal)}
            icon={<FiFileText size={20} />}
          />

          <StatCard
            label="GST"
            value={fmt.currency(gst)}
            icon={<FiTag size={20} />}
          />

          <StatCard
            label="Total"
            value={fmt.currency(total)}
            icon={<FiDollarSign size={20} />}
          />

          <StatCard
            label="Status"
            value={<Badge status={po.status} />}
            icon={<FiPackage size={20} />}
          />
      </div>

      {/* Info cards row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Client */}
        <Card style={{ padding: "20px 24px" }}>
          <SectionDivider label="Client Details" />
          {client ? (
            <>
              <DetailRow label="Name"    value={client.name} />
              <DetailRow label="Company" value={client.company} />
              <DetailRow label="Email"   value={client.email} />
              <DetailRow label="Phone"   value={client.phone} />
              <DetailRow label="GST No." value={client.gstNumber} />
            </>
          ) : (
            <p style={{ color: tokens.muted, fontSize: 14, margin: 0 }}>No client linked</p>
          )}
        </Card>

        {/* PO Meta */}
        <Card style={{ padding: "20px 24px" }}>
          <SectionDivider label="Order Info" />
          <DetailRow label="Buyer PO #"    value={po.poNumber} />
          <DetailRow label="Internal PO #" value={po.internalPoNumber} />
          <DetailRow label="Status"        value={<Badge status={po.status} />} />
          <DetailRow label="PO Date"       value={fmt.date(po.poDate)} />
          <DetailRow label="Delivery Date" value={fmt.date(po.deliveryDate)} />
          <DetailRow label="Approved At"   value={fmt.date(po.approvedAt)} />
          <DetailRow label="Converted At"  value={fmt.date(po.convertedAt)} />
          {po.shippingAddress && (
            <>
              <SectionDivider label="Shipping Address" />
              <p style={{ fontSize: 14, color: tokens.textSub, margin: 0, lineHeight: 1.6 }}>
                {po.shippingAddress}
              </p>
            </>
          )}
          {po.notes && (
            <>
              <SectionDivider label="Notes" />
              <p style={{ fontSize: 14, color: tokens.textSub, margin: 0, lineHeight: 1.6 }}>
                {po.notes}
              </p>
            </>
          )}
        </Card>
      </div>

      {/* Line Items */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${tokens.border}` }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: tokens.text }}>
            Line Items ({items.length})
          </h3>
        </div>
        {items.length === 0 ? (
          <EmptyState icon="📦" title="No items" message="This purchase order has no line items." />
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["#", "Description", "HSN", "Qty", "Unit", "Unit Price", "GST %", "GST Amt", "Total"]
                      .map(h => (
                        <th key={h} style={{
                          padding: "10px 14px", textAlign: "left", fontSize: 12,
                          color: tokens.textSub, fontWeight: 600, textTransform: "uppercase",
                          borderBottom: `1px solid ${tokens.border}`, whiteSpace: "nowrap",
                        }}>{h}</th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={item.id || i}
                      style={{ borderBottom: `1px solid ${tokens.border}20`, transition: "background .1s" }}
                      onMouseEnter={e => e.currentTarget.style.background = tokens.elevated}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={td}>{i + 1}</td>
                      <td style={{ ...td, maxWidth: 240, whiteSpace: "normal" }}>{item.description}</td>
                      <td style={td}>{item.hsnCode || "—"}</td>
                      <td style={td}>{item.quantity}</td>
                      <td style={td}>{item.unit || "Nos"}</td>
                      <td style={td}>{fmt.currency(item.unitPrice)}</td>
                      <td style={td}>{item.gstRate}%</td>
                      <td style={td}>{fmt.currency(item.gstAmount)}</td>
                      <td style={{ ...td, fontWeight: 700, color: tokens.success }}>
                        {fmt.currency(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Totals */}
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 20px", borderTop: `1px solid ${tokens.border}` }}>
              <div style={{ width: 280 }}>
                <TR label="Subtotal" value={fmt.currency(subtotal)} />
                <TR label="GST"      value={fmt.currency(gst)} />
                <div style={{ height: 1, background: tokens.border, margin: "8px 0" }} />
                <TR label="Total" value={fmt.currency(total)} bold color={tokens.success} />
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Status Modal */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Update Status" width={360}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: tokens.textSub, fontWeight: 500, display: "block", marginBottom: 6 }}>
            New Status
          </label>
          <select value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{
            background: tokens.elevated, border: `1px solid ${tokens.border}`,
            color: tokens.text, borderRadius: 8, padding: "9px 14px", fontSize: 14,
            outline: "none", fontFamily: "inherit", cursor: "pointer", width: "100%",
          }}>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={() => setStatusModal(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={handleStatusSave} disabled={actionLoad === "status"}>
            {actionLoad === "status" ? "Saving…" : "Save Status"}
          </Btn>
        </div>
      </Modal>

      {/* Convert Confirm */}
      <ConfirmModal
        open={convertModal} onClose={() => setConvertModal(false)}
        onConfirm={handleConvert} title="Convert to Proforma Invoice" danger={false}
        message={`Convert "${po.poNumber || po.internalPoNumber}" into a Proforma Invoice? The PO will be marked as converted.`}
      />

      {/* Delete Confirm */}
      <ConfirmModal
        open={deleteModal} onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete} title="Delete Purchase Order"
        message={`Delete "${po.poNumber || po.internalPoNumber}"? This cannot be undone.`}
      />
    </div>
  );
}

const td = { padding: "12px 14px", fontSize: 14, color: tokens.text, whiteSpace: "nowrap" };

function TR({ label, value, bold, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
      <span style={{ fontSize: 13, color: tokens.textSub }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: bold ? 700 : 500, color: color || tokens.text }}>{value}</span>
    </div>
  );
}

export default function PurchaseOrderDetailPage(props) {
  return <ToastProvider><PurchaseOrderDetailInner {...props} /></ToastProvider>;
}

/* ── USAGE ────────────────────────────────────────────────────────────────────
  <PurchaseOrderDetailPage
    poId="uuid-here"
    onBack={() => navigate("/purchase-orders")}
    onEdit={(po) => navigate(`/purchase-orders/${po.id}/edit`)}
    onPICreated={(pi) => navigate(`/proforma-invoices/${pi.id}`)}
  />
─────────────────────────────────────────────────────────────────────────────*/