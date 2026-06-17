// ─── SettingPage.jsx ──────────────────────────────────────────────────────────
// App settings page: Company Info, GST Details, Email (SMTP),
// Invoice Defaults, and Logo Upload — all in one tabbed page.
// Uses settingsService (axios, /api/v1, correct billflow-auth token).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import {
  tokens, Btn, Card, Input, Textarea, SectionDivider,
  PageHeader, Spinner, StatCard,
  useToast, ToastProvider, pageStyle,
} from "../shared.jsx";

// ─── Use the shared settingsService (axios, /api/v1, correct auth) ────────────
import { settingsService } from "../../services/api.js";   // ← adjust path if needed

const api = {
  getSettings:    ()     => settingsService.get().then(r => r.data),
  // your settingsService uses PUT, not PATCH
  updateSettings: (data) => settingsService.update(data).then(r => r.data),
  uploadLogo:     (file) => {
    const fd = new FormData();
    fd.append("logo", file);
    return settingsService.uploadLogo(fd).then(r => r.data);
  },
};

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { key: "company",  label: "Company Info",     icon: "🏢" },
  { key: "gst",      label: "GST & Tax",        icon: "🏛"  },
  { key: "email",    label: "Email / SMTP",     icon: "✉"  },
  { key: "invoice",  label: "Invoice Defaults", icon: "📄" },
  { key: "logo",     label: "Logo & Branding",  icon: "🎨" },
];

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ fontSize: 13, color: tokens.textSub, fontWeight: 500 }}>{label}</label>}
      {children}
      {hint && <span style={{ fontSize: 12, color: tokens.muted }}>{hint}</span>}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
function SettingPageInner() {
  const toast   = useToast();
  const fileRef = useRef();

  const [activeTab, setActiveTab] = useState("company");
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [logoFile,  setLogoFile]  = useState(null);
  const [logoLoad,  setLogoLoad]  = useState(false);

  const [settings, setSettings] = useState({
    // Company
    company_name:    "",
    company_email:   "",
    company_phone:   "",
    company_address: "",
    company_website: "",
    company_pan:     "",
    // GST
    gst_number:       "",
    gst_state_code:   "",
    hsn_default:      "",
    default_gst_rate: "18",
    tax_type:         "intra",
    // Email
    smtp_host:       "",
    smtp_port:       "587",
    smtp_user:       "",
    smtp_pass:       "",
    smtp_from_name:  "",
    smtp_from_email: "",
    // Invoice defaults
    invoice_prefix:        "INV",
    quotation_prefix:      "QT",
    po_prefix:             "PO",
    pi_prefix:             "PI",
    payment_prefix:        "PAY",
    default_payment_terms: "30",
    default_due_days:      "30",
    invoice_footer:        "",
    invoice_notes:         "",
    // Logo
    company_logo: "",
  });

  // ── load settings ───────────────────────────────────────────────────────────
  useEffect(() => {
    api.getSettings()
      .then(result => {
        // handle both { data: {...} } and flat object responses
        const data = result?.data ?? result;
        setSettings(prev => ({ ...prev, ...data }));
      })
      .catch(e => toast(e.response?.data?.message || e.message || "Failed to load settings", "error"))
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setSettings(prev => ({ ...prev, [k]: v }));

  // ── save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateSettings(settings);
      toast("Settings saved successfully");
    } catch (e) {
      toast(e.response?.data?.message || e.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── logo upload ─────────────────────────────────────────────────────────────
  const handleLogoUpload = async () => {
    if (!logoFile) { toast("Select a file first", "warning"); return; }
    setLogoLoad(true);
    try {
      const result = await api.uploadLogo(logoFile);
      const logoPath = result?.logoPath ?? result?.logo ?? result?.url ?? "";
      if (!logoPath) throw new Error("No logo path returned from server");
      set("company_logo", logoPath);
      toast("Logo uploaded successfully");
      setLogoFile(null);
    } catch (e) {
      toast(e.response?.data?.message || e.message || "Upload failed", "error");
    } finally {
      setLogoLoad(false);
    }
  };

  if (loading) return (
    <div style={{ ...pageStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spinner size={40} />
    </div>
  );

  return (
    <div style={pageStyle}>
      <PageHeader
        title="Settings"
        subtitle="Configure your billing application"
        actions={
          <Btn variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save All Settings"}
          </Btn>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 24, alignItems: "start" }}>
        {/* Sidebar tabs */}
        <Card style={{ padding: 8 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "10px 14px", borderRadius: 8,
              border: "none", textAlign: "left", cursor: "pointer",
              fontFamily: "inherit", fontSize: 14, fontWeight: 500,
              background: activeTab === t.key ? `${tokens.accent}20` : "transparent",
              color: activeTab === t.key ? tokens.accent : tokens.textSub,
              transition: "all .15s",
            }}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </Card>

        {/* Content */}
        <div>
          {/* ── Company Info ── */}
          {activeTab === "company" && (
            <Card style={{ padding: "24px" }}>
              <SectionDivider label="Company Information" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
                <Field label="Company Name">
                  <input value={settings.company_name} onChange={e => set("company_name", e.target.value)}
                    placeholder="Acme Pvt. Ltd." style={inp} />
                </Field>
                <Field label="Company Email">
                  <input type="email" value={settings.company_email} onChange={e => set("company_email", e.target.value)}
                    placeholder="info@company.com" style={inp} />
                </Field>
                <Field label="Phone">
                  <input value={settings.company_phone} onChange={e => set("company_phone", e.target.value)}
                    placeholder="+91 98765 43210" style={inp} />
                </Field>
                <Field label="Website">
                  <input value={settings.company_website} onChange={e => set("company_website", e.target.value)}
                    placeholder="https://company.com" style={inp} />
                </Field>
                <Field label="PAN Number">
                  <input value={settings.company_pan} onChange={e => set("company_pan", e.target.value)}
                    placeholder="ABCDE1234F" style={inp} />
                </Field>
                <div style={{ gridColumn: "1/-1" }}>
                  <Field label="Address">
                    <textarea value={settings.company_address}
                      onChange={e => set("company_address", e.target.value)}
                      placeholder="Full address…" rows={3}
                      style={{ ...inp, resize: "vertical" }} />
                  </Field>
                </div>
              </div>
            </Card>
          )}

          {/* ── GST & Tax ── */}
          {activeTab === "gst" && (
            <Card style={{ padding: "24px" }}>
              <SectionDivider label="GST & Tax Configuration" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
                <Field label="GSTIN" hint="15-digit GST Identification Number">
                  <input value={settings.gst_number} onChange={e => set("gst_number", e.target.value)}
                    placeholder="27AABCU9603R1ZX" style={inp} />
                </Field>
                <Field label="State Code" hint="2-digit state code">
                  <input value={settings.gst_state_code} onChange={e => set("gst_state_code", e.target.value)}
                    placeholder="27" style={inp} />
                </Field>
                <Field label="Default GST Rate (%)">
                  <select value={settings.default_gst_rate}
                    onChange={e => set("default_gst_rate", e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                    {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </Field>
                <Field label="Default Tax Type">
                  <select value={settings.tax_type}
                    onChange={e => set("tax_type", e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                    <option value="intra">Intra-state (CGST + SGST)</option>
                    <option value="inter">Inter-state (IGST)</option>
                  </select>
                </Field>
                <Field label="Default HSN Code">
                  <input value={settings.hsn_default} onChange={e => set("hsn_default", e.target.value)}
                    placeholder="998314" style={inp} />
                </Field>
              </div>
            </Card>
          )}

          {/* ── Email / SMTP ── */}
          {activeTab === "email" && (
            <Card style={{ padding: "24px" }}>
              <SectionDivider label="SMTP Email Configuration" />
              <div style={{ marginBottom: 16, padding: "12px 16px",
                background: `${tokens.warning}15`, border: `1px solid ${tokens.warning}40`,
                borderRadius: 8, fontSize: 13, color: tokens.warning }}>
                ⚠ Leave blank to skip email sending. All fields required for emails to work.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="SMTP Host">
                  <input value={settings.smtp_host} onChange={e => set("smtp_host", e.target.value)}
                    placeholder="smtp.gmail.com" style={inp} />
                </Field>
                <Field label="SMTP Port">
                  <input value={settings.smtp_port} onChange={e => set("smtp_port", e.target.value)}
                    placeholder="587" style={inp} />
                </Field>
                <Field label="SMTP Username / Email">
                  <input value={settings.smtp_user} onChange={e => set("smtp_user", e.target.value)}
                    placeholder="your@email.com" style={inp} />
                </Field>
                <Field label="SMTP Password" hint="Stored securely">
                  <input type="password" value={settings.smtp_pass}
                    onChange={e => set("smtp_pass", e.target.value)}
                    placeholder="••••••••" style={inp} />
                </Field>
                <Field label="From Name">
                  <input value={settings.smtp_from_name} onChange={e => set("smtp_from_name", e.target.value)}
                    placeholder="Acme Billing" style={inp} />
                </Field>
                <Field label="From Email">
                  <input type="email" value={settings.smtp_from_email}
                    onChange={e => set("smtp_from_email", e.target.value)}
                    placeholder="billing@company.com" style={inp} />
                </Field>
              </div>
            </Card>
          )}

          {/* ── Invoice Defaults ── */}
          {activeTab === "invoice" && (
            <Card style={{ padding: "24px" }}>
              <SectionDivider label="Document Numbering" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 16 }}>
                <Field label="Invoice Prefix">
                  <input value={settings.invoice_prefix} onChange={e => set("invoice_prefix", e.target.value)}
                    placeholder="INV" style={inp} />
                </Field>
                <Field label="Quotation Prefix">
                  <input value={settings.quotation_prefix} onChange={e => set("quotation_prefix", e.target.value)}
                    placeholder="QT" style={inp} />
                </Field>
                <Field label="PO Prefix">
                  <input value={settings.po_prefix} onChange={e => set("po_prefix", e.target.value)}
                    placeholder="PO" style={inp} />
                </Field>
                <Field label="Proforma Prefix">
                  <input value={settings.pi_prefix} onChange={e => set("pi_prefix", e.target.value)}
                    placeholder="PI" style={inp} />
                </Field>
                <Field label="Payment Prefix">
                  <input value={settings.payment_prefix} onChange={e => set("payment_prefix", e.target.value)}
                    placeholder="PAY" style={inp} />
                </Field>
              </div>

              <SectionDivider label="Default Dates & Terms" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
                <Field label="Default Due Days" hint="Days before invoice is due">
                  <input type="number" min="0" value={settings.default_due_days}
                    onChange={e => set("default_due_days", e.target.value)}
                    placeholder="30" style={inp} />
                </Field>
                <Field label="Default Payment Terms" hint="Days for payment terms">
                  <input type="number" min="0" value={settings.default_payment_terms}
                    onChange={e => set("default_payment_terms", e.target.value)}
                    placeholder="30" style={inp} />
                </Field>
                <div style={{ gridColumn: "1/-1" }}>
                  <Field label="Default Invoice Notes">
                    <textarea value={settings.invoice_notes}
                      onChange={e => set("invoice_notes", e.target.value)}
                      placeholder="Thank you for your business!" rows={2}
                      style={{ ...inp, resize: "vertical" }} />
                  </Field>
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <Field label="Invoice Footer Text">
                    <textarea value={settings.invoice_footer}
                      onChange={e => set("invoice_footer", e.target.value)}
                      placeholder="Bank details, T&C, etc." rows={3}
                      style={{ ...inp, resize: "vertical" }} />
                  </Field>
                </div>
              </div>
            </Card>
          )}

          {/* ── Logo & Branding ── */}
          {activeTab === "logo" && (
            <Card style={{ padding: "24px" }}>
              <SectionDivider label="Company Logo" />
              <div style={{ marginTop: 16 }}>

                {/* Preview — logo path is already a full path from the server */}
                {settings.company_logo && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 13, color: tokens.textSub, marginBottom: 8 }}>Current Logo</p>
                    <img
                      src={settings.company_logo}
                      alt="Company Logo"
                      style={{
                        maxHeight: 100, maxWidth: 300,
                        border: `1px solid ${tokens.border}`, borderRadius: 8,
                        padding: 12, background: tokens.elevated,
                      }}
                      onError={e => { e.target.style.display = "none"; }}
                    />
                    <p style={{ fontSize: 12, color: tokens.muted, marginTop: 6 }}>
                      Path: {settings.company_logo}
                    </p>
                  </div>
                )}

                {/* Upload */}
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{
                    border: `2px dashed ${tokens.border}`, borderRadius: 10,
                    padding: "20px 28px", textAlign: "center", cursor: "pointer",
                    transition: "border-color .2s",
                  }}
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = tokens.accent; }}
                    onDragLeave={e => { e.currentTarget.style.borderColor = tokens.border; }}
                    onDrop={e => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = tokens.border;
                      const f = e.dataTransfer.files[0];
                      if (f) setLogoFile(f);
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
                    <p style={{ margin: 0, color: tokens.textSub, fontSize: 14 }}>
                      {logoFile ? logoFile.name : "Click or drag to upload"}
                    </p>
                    <p style={{ margin: "4px 0 0", color: tokens.muted, fontSize: 12 }}>
                      PNG, JPG, SVG — max 2MB
                    </p>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*"
                    style={{ display: "none" }}
                    onChange={e => setLogoFile(e.target.files[0] || null)} />

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <Btn variant="primary" onClick={handleLogoUpload}
                      disabled={!logoFile || logoLoad}>
                      {logoLoad ? "Uploading…" : "Upload Logo"}
                    </Btn>
                    {logoFile && (
                      <Btn variant="ghost" size="sm" onClick={() => setLogoFile(null)}>
                        Clear
                      </Btn>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 20, padding: "12px 16px",
                  background: tokens.elevated, borderRadius: 8,
                  border: `1px solid ${tokens.border}`, fontSize: 13, color: tokens.textSub }}>
                  <p style={{ margin: "0 0 6px", fontWeight: 600, color: tokens.text }}>Tips</p>
                  <p style={{ margin: 0, lineHeight: 1.7 }}>
                    • Recommended size: 300×100px or similar landscape format<br />
                    • PNG with transparent background works best on PDFs<br />
                    • Logo appears on all invoices, quotations, and proforma invoices
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Save button (bottom) */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <Btn variant="primary" onClick={handleSave} disabled={saving} size="lg">
              {saving ? "Saving…" : "Save Settings"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

const inp = {
  background: tokens.elevated,
  border: `1px solid ${tokens.border}`,
  color: tokens.text, borderRadius: 8,
  padding: "9px 14px", fontSize: 14,
  outline: "none", fontFamily: "inherit",
  width: "100%", boxSizing: "border-box",
};

export default function SettingPage() {
  return <ToastProvider><SettingPageInner /></ToastProvider>;
}

/* ── USAGE ────────────────────────────────────────────────────────────────────
  <SettingPage />
─────────────────────────────────────────────────────────────────────────────*/