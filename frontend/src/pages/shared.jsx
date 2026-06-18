// ─── shared.jsx ───────────────────────────────────────────────────────────────
// Reusable primitives: Toast, Modal, Badge, Spinner, Pagination, EmptyState,
// SearchBar, StatusSelect, ConfirmModal, TableSkeleton
// Used by every page in this billing suite.
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";

// ─── Design tokens ────────────────────────────────────────────────────────────
export const tokens = {
  bg:       "#0F1117",
  surface:  "#d3d3d3",
  elevated: "#ffff",
  border:   "#d3d3d3",
  accent:   "#6366F1",
  accentHover: "#4F46E5",
  success:  "#10B981",
  warning:  "#F59E0B",
  danger:   "#EF4444",
  muted:    "#6B7280",
  text:     "#000",
  textSub:  "#000",
};

// ─── Toast ────────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  const icons = { success: "✓", error: "✕", warning: "⚠" };
  const colors = {
    success: tokens.success,
    error:   tokens.danger,
    warning: tokens.warning,
  };

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, display:"flex", flexDirection:"column", gap:10 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            display:"flex", alignItems:"center", gap:10,
            background: tokens.elevated, border:`1px solid ${colors[t.type]}40`,
            borderLeft:`4px solid ${colors[t.type]}`,
            padding:"12px 16px", borderRadius:10,
            color: tokens.text, fontSize:14, minWidth:260, maxWidth:360,
            boxShadow:"0 8px 30px #0008",
            animation:"slideIn .25s ease",
          }}>
            <span style={{ color: colors[t.type], fontWeight:700, fontSize:16 }}>{icons[t.type]}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 560 }) {
  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  if (!open) return null;

  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, background:"#000A",
      zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: tokens.surface, border:`1px solid ${tokens.border}`,
        borderRadius:14, width:"100%", maxWidth:width,
        maxHeight:"90vh", overflow:"auto", boxShadow:"0 24px 64px #ffff",
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"20px 24px 0", borderBottom:`1px solid ${tokens.border}`, paddingBottom:16 }}>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700, color: tokens.text }}>{title}</h2>
          <button onClick={onClose} style={{
            background:"none", border:"none", color: tokens.muted, fontSize:20,
            cursor:"pointer", padding:"0 4px", lineHeight:1,
          }}>×</button>
        </div>
        <div style={{ padding:"20px 24px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────
export function ConfirmModal({ open, onClose, onConfirm, title, message, danger = true }) {
  return (
    <Modal open={open} onClose={onClose} title={title} width={420}>
      <p style={{ color: tokens.textSub, margin:"0 0 24px", lineHeight:1.6 }}>{message}</p>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant={danger ? "danger" : "primary"} onClick={() => { onConfirm(); onClose(); }}>
          Confirm
        </Btn>
      </div>
    </Modal>
  );
}

// ─── Btn ──────────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = "primary", size = "md",
  disabled = false, type = "button", style: sx = {}, icon }) {
  const base = {
    display:"inline-flex", alignItems:"center", gap:6, fontWeight:600,
    borderRadius:8, border:"none", cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1, transition:"all .15s", fontFamily:"inherit",
    outline:"none",
  };
  const sizes = { sm:{ padding:"6px 12px", fontSize:13 }, md:{ padding:"9px 18px", fontSize:14 }, lg:{ padding:"12px 24px", fontSize:15 } };
  const variants = {
    primary: { background: tokens.accent, color:"#fff" },
    danger:  { background: tokens.danger, color:"#fff" },
    ghost:   { background:"transparent", color: tokens.textSub, border:`1px solid ${tokens.border}` },
    success: { background: tokens.success, color:"#fff" },
    warning: { background: tokens.warning, color:"#fff" },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ ...base, ...sizes[size], ...variants[variant], ...sx }}>
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
const badgePalette = {
  draft:          { bg:"#374151", text:"#D1D5DB" },
  sent:           { bg:"#1E3A5F", text:"#93C5FD" },
  approved:       { bg:"#064E3B", text:"#6EE7B7" },
  rejected:       { bg:"#7F1D1D", text:"#FCA5A5" },
  converted:      { bg:"#312E81", text:"#C4B5FD" },
  completed:      { bg:"#064E3B", text:"#6EE7B7" },
  pending:        { bg:"#78350F", text:"#FCD34D" },
  paid:           { bg:"#064E3B", text:"#6EE7B7" },
  partially_paid: { bg:"#1E3A5F", text:"#93C5FD" },
  overdue:        { bg:"#7F1D1D", text:"#FCA5A5" },
  active:         { bg:"#064E3B", text:"#6EE7B7" },
  inactive:       { bg:"#374151", text:"#D1D5DB" },
};

export function Badge({ status }) {
  const s = (status || "draft").toLowerCase();
  const p = badgePalette[s] || badgePalette.draft;
  return (
    <span style={{
      background: p.bg, color: p.text,
      padding:"3px 10px", borderRadius:99, fontSize:12, fontWeight:600,
      textTransform:"capitalize", whiteSpace:"nowrap",
    }}>
      {s.replace(/_/g, " ")}
    </span>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 24 }) {
  return (
    <>
      <div style={{
        width:size, height:size, border:`3px solid ${tokens.border}`,
        borderTop:`3px solid ${tokens.accent}`, borderRadius:"50%",
        animation:"spin .7s linear infinite",
      }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export function Pagination({ pagination, onChange }) {
  if (!pagination) return null;
  const { page, totalPages, total, limit } = pagination;
  if (totalPages <= 1) return null;
  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1)
      pages.push(i);
    else if (pages[pages.length - 1] !== "…")
      pages.push("…");
  }

  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
      flexWrap:"wrap", gap:12, padding:"16px 0" }}>
      <span style={{ color: tokens.textSub, fontSize:13 }}>
        Showing {from}–{to} of {total}
      </span>
      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
        <PgBtn onClick={() => onChange(page - 1)} disabled={page === 1}>‹</PgBtn>
        {pages.map((p, i) =>
          p === "…"
            ? <span key={i} style={{ color: tokens.muted, padding:"0 4px" }}>…</span>
            : <PgBtn key={p} onClick={() => onChange(p)} active={p === page}>{p}</PgBtn>
        )}
        <PgBtn onClick={() => onChange(page + 1)} disabled={page === totalPages}>›</PgBtn>
      </div>
    </div>
  );
}

function PgBtn({ children, onClick, disabled, active }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width:34, height:34, borderRadius:7, border:`1px solid ${active ? tokens.accent : tokens.border}`,
      background: active ? tokens.accent : "transparent",
      color: active ? "#fff" : tokens.textSub,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
      fontWeight:600, fontSize:14, transition:"all .15s",
    }}>{children}</button>
  );
}

// ─── SearchBar ────────────────────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = "Search…" }) {
  return (
    <div style={{ position:"relative" }}>
      <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
        color: tokens.muted, fontSize:16 }}>⌕</span>
      <input value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: '#fff', border:`1px solid ${tokens.border}`,
          color: tokens.text, borderRadius:8, padding:"9px 14px 9px 36px",
          fontSize:14, outline:"none", width:220,
          fontFamily:"inherit",
        }}
      />
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
export function Select({ value, onChange, options, placeholder = "All", style: sx = {} }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{
        background: '#fff', border:`1px solid ${tokens.border}`,
        color: tokens.text, borderRadius:8, padding:"9px 14px",
        fontSize:14, outline:"none", cursor:"pointer", fontFamily:"inherit", ...sx,
      }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, error, style: sx = {}, ...props }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      {label && <label style={{ fontSize:13, color: tokens.textSub, fontWeight:500 }}>{label}</label>}
      <input {...props} style={{
        background: "#fff", border:`1px solid ${error ? tokens.danger : tokens.border}`,
        color: tokens.text, borderRadius:8, padding:"9px 14px", fontSize:14,
        outline:"none", fontFamily:"inherit", width:"100%", boxSizing:"border-box", ...sx,
      }}/>
      {error && <span style={{ fontSize:12, color: tokens.danger }}>{error}</span>}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
export function Textarea({ label, error, rows = 3, style: sx = {}, ...props }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      {label && <label style={{ fontSize:13, color: tokens.textSub, fontWeight:500 }}>{label}</label>}
      <textarea rows={rows} {...props} style={{
        background:"#fff", border:`1px solid ${error ? tokens.danger : tokens.border}`,
        color: tokens.text, borderRadius:8, padding:"9px 14px", fontSize:14,
        outline:"none", fontFamily:"inherit", width:"100%", boxSizing:"border-box",
        resize:"vertical", ...sx,
      }}/>
      {error && <span style={{ fontSize:12, color: tokens.danger }}>{error}</span>}
    </div>
  );
}

// ─── FormSelect ───────────────────────────────────────────────────────────────
export function FormSelect({ label, error, options, style: sx = {}, ...props }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      {label && <label style={{ fontSize:13, color: tokens.textSub, fontWeight:500 }}>{label}</label>}
      <select {...props} style={{
        background: "#fff", border:`1px solid ${error ? tokens.danger : tokens.border}`,
        color: tokens.text, borderRadius:8, padding:"9px 14px", fontSize:14,
        outline:"none", fontFamily:"inherit", width:"100%", boxSizing:"border-box",
        cursor:"pointer", ...sx,
      }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <span style={{ fontSize:12, color: tokens.danger }}>{error}</span>}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style: sx = {} }) {
  return (
    <div style={{
      background: "#fff", border:`1px solid ${tokens.border}`,
      borderRadius:12, ...sx,
    }}>
      {children}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, color, icon, sub }) {
  return (
    <Card style={{ padding:"20px 24px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <p style={{ margin:"0 0 6px", fontSize:13, color: tokens.textSub }}>{label}</p>
          <p style={{ margin:0, fontSize:20, fontWeight:500, color: color || tokens.text }}>{value}</p>
          {sub && <p style={{ margin:"4px 0 0", fontSize:12, color: tokens.muted }}>{sub}</p>}
        </div>
        {/* {icon && <span style={{ fontSize:26, opacity:.7 }}>{icon}</span>} */}
      </div>
    </Card>
  );
}
// export function StatCard({
//   label,
//   value,
//   color,
//   valueColor,
//   icon: Icon,
//   iconColor,
//   iconBg,
//   sub,
// }) {
//   return (
//     <Card
    
//       style={{
//         padding: "20px",
//         borderRadius: 16,
//         border: "1px solid #e5e7eb",
//         height: "100%",
//       }}
//     >
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "flex-start",
//           gap: 12,
//         }}
//       >
//         <div style={{ flex: 1, minWidth: 0 }}>
//           <p
//             style={{
//               margin: "0 0 8px",
//               fontSize: 13,
//               fontWeight: 500,
//               color: tokens.textSub,
//             }}
//           >
//             {label}
//           </p>

//           <p
//             style={{
//               margin: 0,
//               fontSize: "clamp(20px, 3vw, 28px)",
//               fontWeight: 700,
//               color: valueColor || color || tokens.text,
//               wordBreak: "break-word",
//             }}
//           >
//             {value}
//           </p>

//           {sub && (
//             <p
//               style={{
//                 margin: "6px 0 0",
//                 fontSize: 8,
//                 color: tokens.muted,
//               }}
//             >
//               {sub}
//             </p>
//           )}
//         </div>

//         {Icon && (
//           <div
//             style={{
//               width: 48,
//               height: 48,
//               borderRadius: 12,
//               background: iconBg || "#f3f4f6",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               flexShrink: 0,
//             }}
//           >
//             <Icon
//               size={22}
//               color={iconColor || tokens.text}
//             />
//           </div>
//         )}
//       </div>
//     </Card>
//   );
// }

// ─── Table ────────────────────────────────────────────────────────────────────
export function Table({ cols, rows, onSort, sortBy, sortOrder, loading }) {
  if (loading) return <TableSkeleton cols={cols.length} />;
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c.key} onClick={() => c.sortable && onSort?.(c.key)}
                style={{
                  padding:"12px 16px", textAlign:"left", fontSize:12,
                  color: tokens.textSub, fontWeight:600, textTransform:"uppercase",
                  letterSpacing:.5, borderBottom:`1px solid ${tokens.border}`,
                  cursor: c.sortable ? "pointer" : "default", whiteSpace:"nowrap",
                  userSelect:"none",
                }}>
                {c.label}
                {c.sortable && sortBy === c.key && (
                  <span style={{ marginLeft:4 }}>{sortOrder === "ASC" ? "↑" : "↓"}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{
              borderBottom:`1px solid ${tokens.border}20`,
              transition:"background .1s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#d3d3d3'}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              {cols.map(c => (
                <td key={c.key} style={{ padding:"14px 16px", fontSize:14, color: tokens.text, whiteSpace: c.wrap ? "normal" : "nowrap" }}>
                  {c.render ? c.render(row[c.key], row) : (row[c.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── TableSkeleton ────────────────────────────────────────────────────────────
export function TableSkeleton({ cols = 5, rows = 6 }) {
  return (
    <div style={{ padding:"8px 0" }}>
      {Array(rows).fill(0).map((_, i) => (
        <div key={i} style={{ display:"flex", gap:16, padding:"14px 16px", borderBottom:`1px solid ${tokens.border}20` }}>
          {Array(cols).fill(0).map((_, j) => (
            <div key={j} style={{
              flex:1, height:16, borderRadius:6,
              background:`linear-gradient(90deg,${tokens.elevated} 25%,${tokens.border}50 50%,${tokens.elevated} 75%)`,
              backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite",
            }}/>
          ))}
        </div>
      ))}
      <style>{`@keyframes shimmer{from{background-position:200% 0}to{background-position:-200% 0}}`}</style>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = "📄", title, message, action }) {
  return (
    <div style={{ textAlign:"center", padding:"64px 32px" }}>
      <div style={{ fontSize:48, marginBottom:16, opacity:.6 }}>{icon}</div>
      <h3 style={{ margin:"0 0 8px", color: tokens.text, fontSize:18 }}>{title}</h3>
      <p style={{ margin:"0 0 24px", color: tokens.textSub, fontSize:14 }}>{message}</p>
      {action}
    </div>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
      flexWrap:"wrap", gap:12, marginBottom:28 }}>
      <div>
        <h1 style={{ margin:0, fontSize:24, fontWeight:700, color: tokens.text }}>{title}</h1>
        {subtitle && <p style={{ margin:"4px 0 0", fontSize:14, color: tokens.textSub }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>{actions}</div>}
    </div>
  );
}

// ─── SectionDivider ───────────────────────────────────────────────────────────
export function SectionDivider({ label }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, margin:"8px 0" }}>
      <span style={{ fontSize:13, fontWeight:600, color: tokens.textSub, whiteSpace:"nowrap" }}>{label}</span>
      <div style={{ flex:1, height:1, background: tokens.border }}/>
    </div>
  );
}

// ─── DetailRow ────────────────────────────────────────────────────────────────
export function DetailRow({ label, value, color }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
      padding:"10px 0", borderBottom:`1px solid ${tokens.border}20` }}>
      <span style={{ fontSize:13, color: tokens.textSub }}>{label}</span>
      <span style={{ fontSize:14, fontWeight:600, color: color || tokens.text }}>{value ?? "—"}</span>
    </div>
  );
}

// ─── fmt helpers ─────────────────────────────────────────────────────────────
export const fmt = {
  currency: v => `₹${parseFloat(v || 0).toLocaleString("en-IN", { minimumFractionDigits:2, maximumFractionDigits:2 })}`,
  date:     v => v ? new Date(v).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—",
  datetime: v => v ? new Date(v).toLocaleString("en-IN") : "—",
};

// ─── useApi hook ──────────────────────────────────────────────────────────────
export function useApi(fn, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const run = useCallback(async (...args) => {
    setLoading(true); setError(null);
    try { const d = await fn(...args); setData(d); return d; }
    catch(e) { setError(e.message || "Error"); }
    finally  { setLoading(false); }
  }, deps);

  useEffect(() => { run(); }, [run]);
  return { data, loading, error, refetch: run };
}

// ─── global page wrapper styles ───────────────────────────────────────────────
export const pageStyle = {
  minHeight:"100vh", background: "#fff", color: tokens.text,
  fontFamily:`"Inter","Segoe UI",system-ui,sans-serif`,
  padding:"32px 24px", boxSizing:"border-box",
};