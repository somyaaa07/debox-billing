// ─── PaymentFormPage.jsx ──────────────────────────────────────────────────────
// Record a new payment against a Final Invoice.
// Features: client picker, invoice lookup with auto-fill of due amount,
// payment mode, reference number, date, notes, form validation.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import {
  FiArrowLeft, FiSave, FiFileText, FiDollarSign, FiCheckCircle,
  FiAlertCircle, FiInfo, FiCalendar, FiCreditCard
} from "react-icons/fi";
import {
  tokens, fmt, Btn, Card, Input, Textarea, SectionDivider,
  PageHeader, Spinner, StatCard, Badge, DetailRow,
  useToast, ToastProvider, pageStyle,
} from "../shared.jsx";
import { clientService, invoiceService, paymentService } from "../../services/api.js";

// ─── API ──────────────────────────────────────────────────────────────────────
const api = {
  getClients: () => clientService.getAll({ limit: 200 }).then(r => r.data),
  getInvoices: (clientId) => invoiceService.getAll({
    clientId,
    limit: 100,
  }).then(r => r.data),
  getInvoice: (id) => invoiceService.getOne(id).then(r => r.data),
  createPayment: (data) => paymentService.create(data).then(r => r.data),
};

// ─── Constants ────────────────────────────────────────────────────────────────
const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "upi", label: "UPI" },
  { value: "cheque", label: "Cheque" },
  { value: "credit_card", label: "Credit Card" },
  { value: "other", label: "Other" },
];

// ─── Component ────────────────────────────────────────────────────────────────
function PaymentFormInner({ invoiceId: prefillInvoiceId, onSaved, onCancel }) {
  const toast = useToast();

  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [invLoad, setInvLoad] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    clientId: "",
    finalInvoiceId: prefillInvoiceId || "",
    amount: "",
   paymentMode: "bank_transfer",
    paymentDate: new Date().toISOString().slice(0, 10),
    referenceNumber: "",
    notes: "",
  });

  // ── load clients ────────────────────────────────────────────────────────────
  useEffect(() => {
    api.getClients()
      .then(r => setClients(r.data || []))
      .catch(e => toast(e.message, "error"));
  }, []);

  // ── if prefill invoiceId, load that invoice ─────────────────────────────────
  useEffect(() => {
    if (!prefillInvoiceId) return;
    setInvLoad(true);
    api.getInvoice(prefillInvoiceId)
      .then(r => {
        const inv = r.data;
        setInvoice(inv);
        setForm(f => ({
          ...f,
          clientId: inv.clientId || "",
          finalInvoiceId: inv.id,
          amount: parseFloat(inv.dueAmount) || "",
        }));
        return api.getInvoices(inv.clientId);
      })
      .then(r => setInvoices(r.data || []))
      .catch(e => toast(e.message, "error"))
      .finally(() => setInvLoad(false));
  }, [prefillInvoiceId]);

  // ── when client changes, load their invoices ────────────────────────────────
  const handleClientChange = async (clientId) => {
    setForm(f => ({ ...f, clientId, finalInvoiceId: "", amount: "" }));
    setInvoice(null);
    if (!clientId) { setInvoices([]); return; }
    setInvLoad(true);
    try {
      const r = await api.getInvoices(clientId);
      setInvoices(r.data || []);
    } catch (e) { toast(e.message, "error"); }
    finally { setInvLoad(false); }
  };

  // ── when invoice changes, auto-fill due amount ──────────────────────────────
  const handleInvoiceChange = async (invoiceId) => {
    setForm(f => ({ ...f, finalInvoiceId: invoiceId, amount: "" }));
    setInvoice(null);
    if (!invoiceId) return;
    try {
      const r = await api.getInvoice(invoiceId);
      setInvoice(r.data);
      setForm(f => ({ ...f, amount: parseFloat(r.data.dueAmount) || "" }));
    } catch (e) { toast(e.message, "error"); }
  };

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── validate ────────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.clientId) e.clientId = "Client is required";
    if (!form.finalInvoiceId) e.finalInvoiceId = "Invoice is required";
    if (!form.amount || parseFloat(form.amount) <= 0) e.amount = "Enter a valid amount";
    if (invoice && parseFloat(form.amount) > parseFloat(invoice.dueAmount)) {
      e.amount = `Amount cannot exceed due amount ${fmt.currency(invoice.dueAmount)}`;
    }
    if (!form.paymentDate) e.paymentDate = "Payment date is required";
    if (!form.paymentMode) e.paymentMode = "Select a payment mode";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) { toast("Please fix form errors", "error"); return; }
    setLoading(true);
    try {
      await api.createPayment({
        ...form,
        amount: parseFloat(form.amount),
      });
      toast("Payment recorded successfully");
      onSaved?.();
    } catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  };

  // ── client options ──────────────────────────────────────────────────────────
  const clientOpts = [
    { value: "", label: "— Select Client —" },
    ...clients.map(c => ({ value: c.id, label: `${c.name}${c.company ? ` (${c.company})` : ""}` })),
  ];

  const invoiceOpts = [
    { value: "", label: invLoad ? "Loading…" : "— Select Invoice —" },
    ...invoices.map(inv => ({
      value: inv.id,
      label: `${inv.invoiceNumber} · Due: ${fmt.currency(inv.dueAmount)} · ${inv.status}`,
    })),
  ];

  return (
    <div style={pageWrapperS}>
      {/* Page Header */}
      <div style={headerWrapperS}>
        <div>
          <h1 style={pageTitleS}>Record Payment</h1>
          <p style={pageSubtitleS}>Log a payment received against a Final Invoice</p>
        </div>
        <div style={headerActionsS}>
          {onCancel && (
            <button onClick={onCancel} style={cancelButtonS}>
              Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              ...submitButtonS,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            <FiSave size={16} />
            {loading ? "Saving…" : "Record Payment"}
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={mainGridS}>
        {/* Left: Form */}
        <div style={leftSectionS}>

          {/* Link to Invoice Section */}
          <Card style={cardS}>
            <div style={cardHeaderS}>
              <h3 style={sectionTitleS}>
                <FiFileText size={18} style={{ marginRight: 8 }} />
                Link to Invoice
              </h3>
            </div>

            <div style={cardContentS}>
              <div style={formGridS}>
                <FormField
                  label="Client *"
                  value={form.clientId}
                  onChange={e => handleClientChange(e.target.value)}
                  options={clientOpts}
                  error={errors.clientId}
                />
                <FormField
                  label="Invoice *"
                  value={form.finalInvoiceId}
                  onChange={e => handleInvoiceChange(e.target.value)}
                  options={invoiceOpts}
                  error={errors.finalInvoiceId}
                  disabled={!form.clientId}
                />
              </div>

              {/* Invoice Preview */}
              {invoice && (
                <div style={invoicePreviewS}>
                  <p style={invoicePreviewTitleS}>Invoice Details</p>
                  <div style={invoiceDetailsGridS}>
                    <MiniStat label="Invoice #" value={invoice.invoiceNumber} />
                    <MiniStat label="Total" value={fmt.currency(invoice.totalAmount)} />
                    <MiniStat label="Paid" value={fmt.currency(invoice.paidAmount)} color="#10b981" />
                    <MiniStat label="Due" value={fmt.currency(invoice.dueAmount)} color="#ef4444" />
                    <MiniStat label="Status" value={<Badge status={invoice.status} />} />
                    <MiniStat label="Due Date" value={fmt.date(invoice.dueDate)} />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Payment Details Section */}
          <Card style={cardS}>
            <div style={cardHeaderS}>
              <h3 style={sectionTitleS}>
                <FiDollarSign size={18} style={{ marginRight: 8 }} />
                Payment Details
              </h3>
            </div>

            <div style={cardContentS}>
              <div style={formGridS}>
                {/* Amount */}
                <div>
                  <label style={labelS}>
                    Amount (₹) <span style={requiredS}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={e => setField("amount", e.target.value)}
                    placeholder={invoice ? `Max: ${fmt.currency(invoice.dueAmount)}` : "Enter amount"}
                    style={{
                      ...inputS,
                      ...(errors.amount ? inputErrorS : {}),
                    }}
                  />
                  {errors.amount && (
                    <span style={errorTextS}>{errors.amount}</span>
                  )}
                  {invoice && (
                    <button
                      onClick={() => setField("amount", parseFloat(invoice.dueAmount))}
                      style={useFullAmountButtonS}
                    >
                      Use full due amount →
                    </button>
                  )}
                </div>

                {/* Payment Mode */}
                <FormField
                  label="Payment Mode *"
                  value={form.paymentMode}
                  onChange={e => setField("paymentMode", e.target.value)}
                  options={PAYMENT_MODES}
                  error={errors.paymentMode}
                />

                {/* Payment Date */}
                <div>
                  <label style={labelS}>
                    Payment Date <span style={requiredS}>*</span>
                  </label>
                  <div style={dateInputWrapperS}>
                    <FiCalendar size={16} style={dateIconS} />
                    <input
                      type="date"
                      value={form.paymentDate}
                      onChange={e => setField("paymentDate", e.target.value)}
                      style={{
                        ...inputS,
                        paddingLeft: 36,
                        ...(errors.paymentDate ? inputErrorS : {}),
                      }}
                    />
                  </div>
                  {errors.paymentDate && (
                    <span style={errorTextS}>{errors.paymentDate}</span>
                  )}
                </div>

                {/* Reference Number */}
                <div>
                  <label style={labelS}>Reference Number</label>
                  <input
                    type="text"
                    value={form.referenceNumber}
                    onChange={e => setField("referenceNumber", e.target.value)}
                    placeholder="UTR / Cheque No. / TXN ID"
                    style={inputS}
                  />
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginTop: 16 }}>
                <label style={labelS}>Notes</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={e => setField("notes", e.target.value)}
                  placeholder="Internal notes about this payment…"
                  style={{
                    ...textareaS,
                  }}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Summary */}
        <div style={rightSectionS}>

          {/* Payment Amount Summary */}
          <div style={summaryCardS}>
            <div style={summaryCardHeaderS}>
              <FiCreditCard size={20} style={{ color: "#3b82f6" }} />
              <span style={summaryCardTitleS}>Payment Amount</span>
            </div>
            <p style={summaryCardValueS} style={{ color: "#10b981" }}>
              {form.amount ? fmt.currency(form.amount) : "₹0.00"}
            </p>
          </div>

          {/* Invoice Summary */}
          {invoice && (
            <>
              <div style={summaryCardS}>
                <div style={summaryCardHeaderS}>
                  <FiFileText size={20} style={{ color: "#6b7280" }} />
                  <span style={summaryCardTitleS}>Invoice Total</span>
                </div>
                <p style={summaryCardValueS}>
                  {fmt.currency(invoice.totalAmount)}
                </p>
              </div>

              <div style={summaryCardS}>
                <div style={summaryCardHeaderS}>
                  <FiCheckCircle size={20} style={{ color: "#10b981" }} />
                  <span style={summaryCardTitleS}>Already Paid</span>
                </div>
                <p style={{ ...summaryCardValueS, color: "#10b981" }}>
                  {fmt.currency(invoice.paidAmount)}
                </p>
              </div>

              <div style={summaryCardS}>
                <div style={summaryCardHeaderS}>
                  <FiAlertCircle size={20} style={{ color: "#f59e0b" }} />
                  <span style={summaryCardTitleS}>Remaining After</span>
                </div>
                <p style={{ ...summaryCardValueS, color: "#f59e0b" }}>
                  {fmt.currency(Math.max(0, parseFloat(invoice.dueAmount) - (parseFloat(form.amount) || 0)))}
                </p>
              </div>
            </>
          )}

          {/* Mode Details Info */}
          <div style={modeInfoCardS}>
            <div style={modeInfoHeaderS}>
              <FiInfo size={16} />
              <span>Mode Details</span>
            </div>
      <p style={modeInfoTextS}>
              {form.paymentMode === "cheque" && "Enter cheque number in Reference Number field."}
              {form.paymentMode === "upi" && "Enter UTR / Transaction ID in Reference Number field."}
              {form.paymentMode === "bank_transfer" && "Enter bank transfer reference in Reference Number field."}
              {form.paymentMode === "credit_card" && "Enter card transaction reference in Reference Number field."}
              {form.paymentMode === "cash" && "No reference required for cash payments."}
              {form.paymentMode === "other" && "Add any relevant reference in the field above, if applicable."}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div style={bottomActionBarS}>
        {onCancel && (
          <button onClick={onCancel} style={cancelButtonS}>
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            ...submitButtonS,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          <FiSave size={16} />
          {loading ? "Recording…" : "Record Payment"}
        </button>
      </div>
    </div>
  );
}

// ─── Form Field Component ──────────────────────────────────────────────────────
function FormField({ label, value, onChange, options, error, disabled }) {
  return (
    <div>
      {label && <label style={labelS}>{label}</label>}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{
          ...inputS,
          ...(error ? inputErrorS : {}),
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <span style={errorTextS}>{error}</span>}
    </div>
  );
}

// ─── Mini Stat Component ───────────────────────────────────────────────────────
function MiniStat({ label, value, color }) {
  return (
    <div>
      <p style={miniStatLabelS}>{label}</p>
      <p style={{ ...miniStatValueS, color: color || "#1f2937" }}>
        {value}
      </p>
    </div>
  );
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

const headerActionsS = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const cancelButtonS = {
  padding: "10px 20px",
  fontSize: 14,
  fontWeight: 600,
  color: "#6b7280",
  background: "#f3f4f6",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const submitButtonS = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 20px",
  fontSize: 14,
  fontWeight: 600,
  color: "#ffffff",
  background: "#3b82f6",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  transition: "all 0.2s ease",
  whiteSpace: "nowrap",
};

const mainGridS = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: 24,
  marginBottom: 24,
};

const leftSectionS = {
  display: "flex",
  flexDirection: "column",
  gap: 20,
};

const rightSectionS = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const cardS = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  overflow: "hidden",
  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
};

const cardHeaderS = {
  padding: "16px 20px",
  borderBottom: "1px solid #f3f4f6",
  background: "#fafbfc",
};

const sectionTitleS = {
  fontSize: 16,
  fontWeight: 700,
  color: "#1f2937",
  margin: 0,
  display: "flex",
  alignItems: "center",
};

const cardContentS = {
  padding: "20px 24px",
};

const formGridS = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 16,
};

const labelS = {
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  display: "block",
  marginBottom: 8,
};

const requiredS = {
  color: "#ef4444",
};

const inputS = {
  width: "100%",
  padding: "10px 13px",
  fontSize: 14,
  color: "#1f2937",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "#ffffff",
  fontFamily: "inherit",
  outline: "none",
  transition: "all 0.2s ease",
  boxSizing: "border-box",
};

const inputErrorS = {
  borderColor: "#fecaca",
  backgroundColor: "#fef2f2",
};

const errorTextS = {
  fontSize: 12,
  color: "#dc2626",
  display: "block",
  marginTop: 6,
};

const dateInputWrapperS = {
  position: "relative",
};

const dateIconS = {
  position: "absolute",
  left: 12,
  top: "50%",
  transform: "translateY(-50%)",
  color: "#6b7280",
  pointerEvents: "none",
};

const useFullAmountButtonS = {
  marginTop: 8,
  background: "none",
  border: "none",
  color: "#3b82f6",
  fontSize: 13,
  cursor: "pointer",
  padding: 0,
  fontFamily: "inherit",
  fontWeight: 500,
};

const textareaS = {
  width: "100%",
  padding: "10px 13px",
  fontSize: 14,
  color: "#1f2937",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "#ffffff",
  fontFamily: "inherit",
  outline: "none",
  resize: "vertical",
  transition: "all 0.2s ease",
  boxSizing: "border-box",
};

const invoicePreviewS = {
  marginTop: 16,
  padding: "14px 16px",
  background: "#f9fafb",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
};

const invoicePreviewTitleS = {
  margin: "0 0 12px 0",
  fontSize: 13,
  fontWeight: 600,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const invoiceDetailsGridS = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
  gap: 12,
};

const miniStatLabelS = {
  margin: 0,
  fontSize: 11,
  color: "#9ca3af",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const miniStatValueS = {
  margin: "4px 0 0 0",
  fontSize: 13,
  fontWeight: 600,
};

const summaryCardS = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 16,
  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
};

const summaryCardHeaderS = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 8,
};

const summaryCardTitleS = {
  fontSize: 13,
  fontWeight: 600,
  color: "#6b7280",
};

const summaryCardValueS = {
  fontSize: "clamp(18px, 3vw, 20px)",
  fontWeight: 700,
  color: "#1f2937",
  margin: 0,
};

const modeInfoCardS = {
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: 10,
  padding: 14,
};

const modeInfoHeaderS = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  fontWeight: 600,
  color: "#1e40af",
  marginBottom: 8,
};

const modeInfoTextS = {
  fontSize: 13,
  color: "#1e40af",
  margin: 0,
  lineHeight: 1.5,
};

const bottomActionBarS = {
  display: "flex",
  gap: 12,
  justifyContent: "flex-end",
  paddingTop: 16,
  borderTop: "1px solid #e5e7eb",
};

// ─── Export ───────────────────────────────────────────────────────────────────
export default function PaymentFormPage(props) {
  return (
    <ToastProvider>
      <PaymentFormInner {...props} />
    </ToastProvider>
  );
}

/* ── USAGE ────────────────────────────────────────────────────────────────────
  // Record from scratch
  <PaymentFormPage
    onSaved={() => navigate("/payments")}
    onCancel={() => navigate("/payments")}
  />

  // Pre-linked to an invoice
  <PaymentFormPage
    invoiceId="invoice-uuid-here"
    onSaved={() => navigate(`/invoices/${invoiceId}`)}
    onCancel={() => navigate(-1)}
  />
─────────────────────────────────────────────────────────────────────────────*/