// ─── ProformaInvoiceDetailPage.jsx ───────────────────────────────────────────
import { useState, useEffect } from "react";
import {
  tokens, fmt, Badge, Btn, Card, StatCard, Modal, ConfirmModal,
  DetailRow, PageHeader, SectionDivider, Spinner, EmptyState,
  useToast, ToastProvider, pageStyle,
} from "../shared.jsx";
import { proformaService } from "../../services/api.js";

const STATUS_OPTS = [
  { value:"draft",          label:"Draft"          },
  { value:"sent",           label:"Sent"           },
  { value:"approved",       label:"Approved"       },
  { value:"partially_paid", label:"Partially Paid" },
  { value:"converted",      label:"Converted"      },
];

function ProformaInvoiceDetailInner({ piId, onBack, onEdit, onFICreated }) {
  const toast = useToast();

  const [pi,           setPi]           = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [actionLoad,   setActionLoad]   = useState("");
  const [statusModal,  setStatusModal]  = useState(false);
  const [deleteModal,  setDeleteModal]  = useState(false);
  const [convertModal, setConvertModal] = useState(false);
  const [newStatus,    setNewStatus]    = useState("");

  useEffect(() => {
    if (!piId) return;
    setLoading(true);
    proformaService.getOne(piId)
      .then(r => { setPi(r.data.data); setNewStatus(r.data.data.status); })
      .catch(e => toast(e.response?.data?.message || e.message, "error"))
      .finally(() => setLoading(false));
  }, [piId]);

  const handleStatusSave = async () => {
    setActionLoad("status");
    try {
      await proformaService.updateStatus(pi.id, newStatus);
      setPi(prev => ({ ...prev, status: newStatus }));
      toast(`Status updated to ${newStatus}`);
      setStatusModal(false);
    } catch(e) { toast(e.response?.data?.message || e.message, "error"); }
    finally    { setActionLoad(""); }
  };

  const handleConvert = async () => {
    setActionLoad("convert");
    try {
      const r = await proformaService.convertToInvoice(pi.id);
      toast(r.data.message || "Converted to Final Invoice");
      setPi(prev => ({ ...prev, status: "converted" }));
      setConvertModal(false);
      onFICreated?.(r.data.data);
    } catch(e) { toast(e.response?.data?.message || e.message, "error"); }
    finally    { setActionLoad(""); }
  };

  const handlePdf = async () => {
    setActionLoad("pdf");
    try {
      const res  = await proformaService.downloadPdf(pi.id);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `PI-${pi.piNumber}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast("PDF downloaded");
    } catch(e) { toast(e.response?.data?.message || e.message, "error"); }
    finally    { setActionLoad(""); }
  };

  const handleEmail = async () => {
    setActionLoad("email");
    try {
      await proformaService.email(pi.id);
      toast("Email sent successfully");
      setPi(prev => ({ ...prev, status: "sent" }));
    } catch(e) { toast(e.response?.data?.message || e.message, "error"); }
    finally    { setActionLoad(""); }
  };

  const handleDelete = async () => {
    try {
      await proformaService.delete(pi.id);
      toast("Proforma invoice deleted");
      onBack?.();
    } catch(e) { toast(e.response?.data?.message || e.message, "error"); }
  };

  if (loading) return (
    <div style={{ ...pageStyle, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <Spinner size={40}/>
    </div>
  );
  if (!pi) return (
    <div style={pageStyle}>
      <EmptyState icon="📄" title="Proforma invoice not found"
        message="This PI does not exist or was deleted."
        action={<Btn onClick={onBack}>Go Back</Btn>}/>
    </div>
  );

  const { client, items = [] } = pi;

  return (
    <div style={pageStyle}>
      <PageHeader
        title={`PI: ${pi.piNumber}`}
        subtitle={`Proforma Invoice · ${fmt.date(pi.piDate)}`}
        actions={
          <>
            {onBack && <Btn variant="ghost" onClick={onBack} icon="←">Back</Btn>}
            <Btn variant="ghost" onClick={() => setStatusModal(true)} icon="⟳">Status</Btn>
            <Btn variant="ghost" onClick={handlePdf} disabled={actionLoad==="pdf"} icon="⬇">
              {actionLoad==="pdf" ? "…" : "PDF"}
            </Btn>
            <Btn variant="ghost" onClick={handleEmail} disabled={actionLoad==="email"} icon="✉">
              {actionLoad==="email" ? "Sending…" : "Email"}
            </Btn>
            <Btn variant="primary"
              onClick={() => setConvertModal(true)}
              disabled={pi.status==="converted" || actionLoad==="convert"}
              icon="→">
              Convert to FI
            </Btn>
            {onEdit && <Btn variant="ghost" onClick={() => onEdit(pi)} icon="✎">Edit</Btn>}
            <Btn variant="danger" onClick={() => setDeleteModal(true)} icon="🗑">Delete</Btn>
          </>
        }
      />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:14, marginBottom:24 }}>
        <StatCard label="Subtotal"   value={fmt.currency(pi.subtotal)}    icon="📊"/>
        <StatCard label="GST"        value={fmt.currency(pi.gstAmount)}   icon="🏛"/>
        <StatCard label="Total"      value={fmt.currency(pi.totalAmount)} icon="💰" color={tokens.success}/>
        <StatCard label="Due"        value={fmt.currency(pi.dueAmount)}
          icon="⚠" color={parseFloat(pi.dueAmount)>0 ? tokens.danger : tokens.success}/>
        <StatCard label="Status"     value={<Badge status={pi.status}/>}  icon="🔖"/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
        <Card style={{ padding:"20px 24px" }}>
          <SectionDivider label="Bill To"/>
          {client ? (
            <>
              <DetailRow label="Name"    value={client.name}/>
              <DetailRow label="Company" value={client.company}/>
              <DetailRow label="Email"   value={client.email}/>
              <DetailRow label="Phone"   value={client.phone}/>
              <DetailRow label="GST No." value={client.gstNumber}/>
              <DetailRow label="Address" value={client.address}/>
            </>
          ) : (
            <p style={{ color: tokens.muted, fontSize:14, margin:0 }}>No client linked</p>
          )}
        </Card>

        <Card style={{ padding:"20px 24px" }}>
          <SectionDivider label="Invoice Info"/>
          <DetailRow label="PI Number"    value={pi.piNumber}/>
          <DetailRow label="Status"       value={<Badge status={pi.status}/>}/>
          <DetailRow label="PI Date"      value={fmt.date(pi.piDate)}/>
          <DetailRow label="Valid Until"  value={fmt.date(pi.validUntil)}/>
          <DetailRow label="Sent At"      value={fmt.date(pi.sentAt)}/>
          <DetailRow label="Converted At" value={fmt.date(pi.convertedAt)}/>
          {pi.purchaseOrderId && (
            <DetailRow label="Source PO"  value={`PO #${pi.purchaseOrderId?.slice(0,8)}…`}/>
          )}
          {pi.notes && (
            <>
              <SectionDivider label="Notes"/>
              <p style={{ fontSize:14, color: tokens.textSub, margin:0, lineHeight:1.6 }}>{pi.notes}</p>
            </>
          )}
        </Card>
      </div>

      <Card style={{ marginBottom:20 }}>
        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${tokens.border}` }}>
          <h3 style={{ margin:0, fontSize:15, fontWeight:700, color: tokens.text }}>
            Line Items ({items.length})
          </h3>
        </div>
        {items.length === 0 ? (
          <EmptyState icon="📦" title="No items" message="This proforma invoice has no line items."/>
        ) : (
          <>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr>
                    {["#","Description","HSN","Qty","Unit","Unit Price","GST %","CGST","SGST","IGST","Total"]
                      .map(h => (
                        <th key={h} style={{
                          padding:"10px 14px", textAlign:"left", fontSize:12,
                          color: tokens.textSub, fontWeight:600, textTransform:"uppercase",
                          borderBottom:`1px solid ${tokens.border}`, whiteSpace:"nowrap",
                        }}>{h}</th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={item.id || i}
                      style={{ borderBottom:`1px solid ${tokens.border}20`, transition:"background .1s" }}
                      onMouseEnter={e => e.currentTarget.style.background = tokens.elevated}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={td}>{i+1}</td>
                      <td style={{ ...td, maxWidth:220, whiteSpace:"normal" }}>{item.description}</td>
                      <td style={td}>{item.hsnCode || "—"}</td>
                      <td style={td}>{item.quantity}</td>
                      <td style={td}>{item.unit || "Nos"}</td>
                      <td style={td}>{fmt.currency(item.unitPrice)}</td>
                      <td style={td}>{item.gstRate}%</td>
                      <td style={td}>{fmt.currency(item.cgstAmount)}</td>
                      <td style={td}>{fmt.currency(item.sgstAmount)}</td>
                      <td style={td}>{fmt.currency(item.igstAmount)}</td>
                      <td style={{ ...td, fontWeight:700, color: tokens.success }}>
                        {fmt.currency(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end",
              padding:"16px 20px", borderTop:`1px solid ${tokens.border}` }}>
              <div style={{ width:300 }}>
                <TR label="Subtotal"    value={fmt.currency(pi.subtotal)}/>
                <TR label="CGST"        value={fmt.currency(items.reduce((s,i)=>s+parseFloat(i.cgstAmount||0),0))}/>
                <TR label="SGST"        value={fmt.currency(items.reduce((s,i)=>s+parseFloat(i.sgstAmount||0),0))}/>
                <TR label="IGST"        value={fmt.currency(items.reduce((s,i)=>s+parseFloat(i.igstAmount||0),0))}/>
                <TR label="Total GST"   value={fmt.currency(pi.gstAmount)}/>
                <div style={{ height:1, background: tokens.border, margin:"8px 0" }}/>
                <TR label="Grand Total" value={fmt.currency(pi.totalAmount)} bold color={tokens.success}/>
                <TR label="Amount Due"  value={fmt.currency(pi.dueAmount)}
                  color={parseFloat(pi.dueAmount)>0 ? tokens.danger : tokens.success}/>
              </div>
            </div>
          </>
        )}
      </Card>

      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Update Status" width={360}>
        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:13, color: tokens.textSub, fontWeight:500, display:"block", marginBottom:6 }}>
            New Status
          </label>
          <select value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{
            background: tokens.elevated, border:`1px solid ${tokens.border}`,
            color: tokens.text, borderRadius:8, padding:"9px 14px", fontSize:14,
            outline:"none", fontFamily:"inherit", cursor:"pointer", width:"100%",
          }}>
            {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <Btn variant="ghost" onClick={() => setStatusModal(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={handleStatusSave} disabled={actionLoad==="status"}>
            {actionLoad==="status" ? "Saving…" : "Save Status"}
          </Btn>
        </div>
      </Modal>

      <ConfirmModal open={convertModal} onClose={() => setConvertModal(false)}
        onConfirm={handleConvert} title="Convert to Final Invoice" danger={false}
        message={`Convert PI "${pi.piNumber}" to a Final Invoice? This PI will be marked as converted.`}/>

      <ConfirmModal open={deleteModal} onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete} title="Delete Proforma Invoice"
        message={`Delete "${pi.piNumber}"? This cannot be undone.`}/>
    </div>
  );
}

const td = { padding:"12px 14px", fontSize:14, color: tokens.text, whiteSpace:"nowrap" };

function TR({ label, value, bold, color }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"5px 0" }}>
      <span style={{ fontSize:13, color: tokens.textSub }}>{label}</span>
      <span style={{ fontSize:14, fontWeight: bold ? 700 : 500, color: color || tokens.text }}>{value}</span>
    </div>
  );
}

export default function ProformaInvoiceDetailPage(props) {
  return <ToastProvider><ProformaInvoiceDetailInner {...props}/></ToastProvider>;
}