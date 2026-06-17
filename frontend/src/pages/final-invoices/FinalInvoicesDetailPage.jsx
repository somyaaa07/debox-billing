// ─── FinalInvoiceDetailPage.jsx ──────────────────────────────────────────────
import { useState, useEffect } from "react";
import {
  tokens, fmt, Badge, Btn, Card, StatCard, Modal, ConfirmModal,
  DetailRow, PageHeader, SectionDivider, Spinner, EmptyState,
  useToast, ToastProvider, pageStyle,
} from "../shared.jsx";
import { invoiceService } from "../../services/api.js";

const STATUS_OPTS = [
  { value: "draft",          label: "Draft"          },
  { value: "sent",           label: "Sent"           },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "paid",           label: "Paid"           },
  { value: "overdue",        label: "Overdue"        },
];

function FinalInvoiceDetailInner({ invoiceId, onBack, onEdit, onRecordPayment }) {
  const toast = useToast();

  const [invoice,     setInvoice]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [actionLoad,  setActionLoad]  = useState("");
  const [statusModal, setStatusModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [newStatus,   setNewStatus]   = useState("");

  useEffect(() => {
    if (!invoiceId) return;
    setLoading(true);
    invoiceService.getOne(invoiceId)
      .then(r => { setInvoice(r.data.data); setNewStatus(r.data.data.status); })
      .catch(e => toast(e.response?.data?.message || e.message, "error"))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  const handleStatusSave = async () => {
    setActionLoad("status");
    try {
      await invoiceService.updateStatus(invoice.id, newStatus);
      setInvoice(prev => ({ ...prev, status: newStatus }));
      toast(`Status updated to ${newStatus}`);
      setStatusModal(false);
    } catch (e) { toast(e.response?.data?.message || e.message, "error"); }
    finally    { setActionLoad(""); }
  };

  const handlePdf = async () => {
    setActionLoad("pdf");
    try {
      const res  = await invoiceService.downloadPdf(invoice.id);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `invoice-${invoice.invoiceNumber}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast("PDF downloaded");
    } catch (e) { toast(e.response?.data?.message || e.message, "error"); }
    finally    { setActionLoad(""); }
  };

  const handleEmail = async () => {
    setActionLoad("email");
    try {
      await invoiceService.email(invoice.id);
      setInvoice(prev => ({ ...prev, status: "sent" }));
      toast("Invoice emailed successfully");
    } catch (e) { toast(e.response?.data?.message || e.message, "error"); }
    finally    { setActionLoad(""); }
  };

  const handleDelete = async () => {
    try {
      await invoiceService.delete(invoice.id);
      toast("Invoice deleted");
      onBack?.();
    } catch (e) { toast(e.response?.data?.message || e.message, "error"); }
  };

  if (loading) return (
    <div style={{ ...pageStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spinner size={40} />
    </div>
  );

  if (!invoice) return (
    <div style={pageStyle}>
      <EmptyState icon="📄" title="Invoice not found"
        message="This invoice does not exist or was deleted."
        action={<Btn onClick={onBack}>Go Back</Btn>} />
    </div>
  );

  const { client, items = [], payments = [] } = invoice;
  const isOverdue = invoice.status !== "paid" && new Date(invoice.dueDate) < new Date();

  return (
    <div style={pageStyle}>
      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        subtitle={`Final Tax Invoice · ${fmt.date(invoice.invoiceDate)}`}
        actions={
          <>
            {onBack && <Btn variant="ghost" onClick={onBack} icon="←">Back</Btn>}
            <Btn variant="ghost" onClick={() => setStatusModal(true)} icon="⟳">Status</Btn>
            <Btn variant="ghost" onClick={handlePdf} disabled={actionLoad === "pdf"} icon="⬇">
              {actionLoad === "pdf" ? "…" : "PDF"}
            </Btn>
            <Btn variant="ghost" onClick={handleEmail} disabled={actionLoad === "email"} icon="✉">
              {actionLoad === "email" ? "Sending…" : "Email"}
            </Btn>
            {onRecordPayment && parseFloat(invoice.dueAmount) > 0 && (
              <Btn variant="success" onClick={() => onRecordPayment(invoice)} icon="💳">
                Record Payment
              </Btn>
            )}
            {onEdit && <Btn variant="ghost" onClick={() => onEdit(invoice)} icon="✎">Edit</Btn>}
            <Btn variant="danger" onClick={() => setDeleteModal(true)} icon="🗑">Delete</Btn>
          </>
        }
      />

      {isOverdue && (
        <div style={{
          background: "#7F1D1D30", border: `1px solid ${tokens.danger}50`,
          borderRadius: 10, padding: "12px 18px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>⚠</span>
          <span style={{ color: tokens.danger, fontWeight: 600, fontSize: 14 }}>
            This invoice is overdue. Due date was {fmt.date(invoice.dueDate)}.
            Outstanding amount: {fmt.currency(invoice.dueAmount)}
          </span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Amount" value={fmt.currency(invoice.totalAmount)} icon="💰" />
        <StatCard label="Amount Paid"  value={fmt.currency(invoice.paidAmount)}  icon="✅" color={tokens.success} />
        <StatCard label="Amount Due"
          value={fmt.currency(invoice.dueAmount)}
          icon="⚠"
          color={parseFloat(invoice.dueAmount) > 0 ? tokens.danger : tokens.success}
        />
        <StatCard label="GST"    value={fmt.currency(invoice.gstAmount)} icon="🏛" />
        <StatCard label="Status" value={<Badge status={invoice.status} />} icon="🔖" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <Card style={{ padding: "20px 24px" }}>
          <SectionDivider label="Bill To" />
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

        <Card style={{ padding: "20px 24px" }}>
          <SectionDivider label="Invoice Info" />
          <DetailRow label="Invoice #"     value={invoice.invoiceNumber} />
          <DetailRow label="Status"        value={<Badge status={invoice.status} />} />
          <DetailRow label="Invoice Date"  value={fmt.date(invoice.invoiceDate)} />
          <DetailRow label="Due Date"      value={fmt.date(invoice.dueDate)} />
          <DetailRow label="Sent At"       value={fmt.date(invoice.sentAt)} />
          <DetailRow label="Paid At"       value={fmt.date(invoice.paidAt)} />
          {invoice.proformaInvoiceId && (
            <DetailRow label="Source PI"   value={`PI #${invoice.proformaInvoiceId?.slice(0, 8)}…`} />
          )}
        </Card>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${tokens.border}` }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: tokens.text }}>
            Line Items ({items.length})
          </h3>
        </div>
        {items.length === 0 ? (
          <EmptyState icon="📦" title="No items" message="This invoice has no line items." />
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["#", "Description", "HSN", "Qty", "Unit", "Unit Price", "GST %", "GST Amt", "Total"].map(h => (
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
            <div style={{
              display: "flex", justifyContent: "flex-end",
              padding: "16px 20px", borderTop: `1px solid ${tokens.border}`,
            }}>
              <div style={{ width: 300 }}>
                <TR label="Subtotal"    value={fmt.currency(invoice.subtotal)} />
                <TR label="GST"         value={fmt.currency(invoice.gstAmount)} />
                <div style={{ height: 1, background: tokens.border, margin: "8px 0" }} />
                <TR label="Total"       value={fmt.currency(invoice.totalAmount)} bold color={tokens.text} />
                <TR label="Paid"        value={fmt.currency(invoice.paidAmount)}  color={tokens.success} />
                <TR label="Outstanding" value={fmt.currency(invoice.dueAmount)}
                  color={parseFloat(invoice.dueAmount) > 0 ? tokens.danger : tokens.success} bold />
              </div>
            </div>
          </>
        )}
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 20px", borderBottom: `1px solid ${tokens.border}` }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: tokens.text }}>
            Payment History ({payments.length})
          </h3>
          {onRecordPayment && parseFloat(invoice.dueAmount) > 0 && (
            <Btn size="sm" variant="success" onClick={() => onRecordPayment(invoice)} icon="＋">
              Record Payment
            </Btn>
          )}
        </div>
        {payments.length === 0 ? (
          <EmptyState icon="💳" title="No payments" message="No payments recorded for this invoice yet." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Receipt #", "Date", "Amount", "Mode", "Reference", "Notes"].map(h => (
                    <th key={h} style={{
                      padding: "10px 14px", textAlign: "left", fontSize: 12,
                      color: tokens.textSub, fontWeight: 600, textTransform: "uppercase",
                      borderBottom: `1px solid ${tokens.border}`, whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={p.id || i}
                    style={{ borderBottom: `1px solid ${tokens.border}20`, transition: "background .1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = tokens.elevated}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ ...td, fontWeight: 700, color: tokens.accent }}>{p.paymentNumber}</td>
                    <td style={td}>{fmt.date(p.paymentDate)}</td>
                    <td style={{ ...td, fontWeight: 700, color: tokens.success }}>{fmt.currency(p.amount)}</td>
                    <td style={td}>
                      <span style={{
                        background: tokens.elevated, color: tokens.textSub,
                        padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                        textTransform: "capitalize",
                      }}>{p.paymentMode}</span>
                    </td>
                    <td style={td}>{p.referenceNumber || "—"}</td>
                    <td style={{ ...td, maxWidth: 200, whiteSpace: "normal" }}>{p.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          <Btn variant="primary" onClick={handleStatusSave} disabled={actionLoad === "status"}>
            {actionLoad === "status" ? "Saving…" : "Save Status"}
          </Btn>
        </div>
      </Modal>

      <ConfirmModal
        open={deleteModal} onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete} title="Delete Invoice"
        message={`Delete "${invoice.invoiceNumber}"? This action cannot be undone.`}
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

export default function FinalInvoiceDetailPage(props) {
  return <ToastProvider><FinalInvoiceDetailInner {...props} /></ToastProvider>;
}