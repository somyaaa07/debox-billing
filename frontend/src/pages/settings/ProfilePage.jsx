// ─── ProfilePage.jsx ──────────────────────────────────────────────────────────
// User Profile page:
// • View & edit personal info (name, email, phone)
// • Change password (with old-password confirmation)
// • Avatar initial/upload
// • Recent activity log
// • Account preferences (notifications, theme preference)
// Calls: GET /api/auth/me  ·  PATCH /api/auth/profile  ·  PATCH /api/auth/password
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import {
  tokens, fmt, Btn, Card, SectionDivider,
  PageHeader, Spinner, Badge,
  useToast, ToastProvider, pageStyle,
} from "../shared.jsx";

// ─── API ──────────────────────────────────────────────────────────────────────
const API_BASE = "/api";
const getToken  = () => localStorage.getItem("token") || "";

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...( !(opts.body instanceof FormData) && { "Content-Type": "application/json" }),
      Authorization: `Bearer ${getToken()}`,
    },
    ...opts,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Request failed");
  return json;
}

const api = {
  getMe:          ()      => apiFetch("/auth/me"),
  updateProfile:  (data)  => apiFetch("/auth/profile",  { method: "PATCH", body: JSON.stringify(data) }),
  changePassword: (data)  => apiFetch("/auth/password", { method: "PATCH", body: JSON.stringify(data) }),
  getActivity:    ()      => apiFetch("/activity?limit=20"),
  uploadAvatar:   (file)  => {
    const fd = new FormData(); fd.append("avatar", file);
    return apiFetch("/auth/avatar", { method: "POST", body: fd });
  },
};

// ─── Avatar component ─────────────────────────────────────────────────────────
function Avatar({ user, size = 80, onClick }) {
  const initials = user
    ? ((user.firstName || user.name || "?")[0] + (user.lastName || "")[0]).toUpperCase()
    : "?";

  return (
    <div
      onClick={onClick}
      title={onClick ? "Click to change avatar" : ""}
      style={{
        width: size, height: size, borderRadius: "50%",
        background: user?.avatarUrl ? "transparent" : `linear-gradient(135deg,${tokens.accent},#8B5CF6)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.36, fontWeight: 700, color: "#fff",
        cursor: onClick ? "pointer" : "default",
        overflow: "hidden", flexShrink: 0,
        border: `3px solid ${tokens.border}`,
        boxShadow: "0 4px 16px #0004",
        position: "relative",
      }}
    >
      {user?.avatarUrl
        ? <img src={user.avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : initials
      }
      {onClick && (
        <div style={{
          position: "absolute", inset: 0, background: "#0006",
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: 0, transition: "opacity .2s", fontSize: 20,
          borderRadius: "50%",
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = 1}
          onMouseLeave={e => e.currentTarget.style.opacity = 0}
        >📷</div>
      )}
    </div>
  );
}

// ─── Section header ────────────────────────────────────────────────────────────
function SH({ children }) {
  return (
    <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: tokens.text }}>
      {children}
    </h3>
  );
}

// ─── Form field ───────────────────────────────────────────────────────────────
function FF({ label, error, hint, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ fontSize: 13, color: tokens.textSub, fontWeight: 500 }}>{label}</label>}
      {children}
      {hint  && <span style={{ fontSize: 12, color: tokens.muted }}>{hint}</span>}
      {error && <span style={{ fontSize: 12, color: tokens.danger }}>{error}</span>}
    </div>
  );
}

const finp = {
  background: tokens.elevated, border: `1px solid ${tokens.border}`,
  color: tokens.text, borderRadius: 8, padding: "9px 14px",
  fontSize: 14, outline: "none", fontFamily: "inherit",
  width: "100%", boxSizing: "border-box",
};

// ─── Strength meter ───────────────────────────────────────────────────────────
function StrengthMeter({ password }) {
  if (!password) return null;
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
    password.length >= 12,
  ].filter(Boolean).length;

  const labels = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];
  const colors = ["", tokens.danger, tokens.warning, tokens.warning, tokens.success, tokens.success];

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i <= score ? colors[score] : tokens.border,
            transition: "background .3s",
          }} />
        ))}
      </div>
      <span style={{ fontSize: 11, color: colors[score] }}>{labels[score]}</span>
    </div>
  );
}

// ─── Activity item ─────────────────────────────────────────────────────────────
function ActivityItem({ item }) {
  const actionColors = {
    CREATE: tokens.success, UPDATE: tokens.accent,
    DELETE: tokens.danger,  CONVERT: tokens.warning, LOGIN: tokens.textSub,
  };
  const actionIcons = {
    CREATE: "✚", UPDATE: "✎", DELETE: "✕", CONVERT: "→", LOGIN: "→", VIEW: "👁",
  };
  const color = actionColors[item.action] || tokens.textSub;
  const icon  = actionIcons[item.action]  || "•";

  return (
    <div style={{
      display: "flex", gap: 12, padding: "10px 0",
      borderBottom: `1px solid ${tokens.border}20`,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: `${color}20`, color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700, flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: "0 0 2px", fontSize: 13, color: tokens.text, lineHeight: 1.4 }}>
          {item.description}
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{
            fontSize: 11, color, fontWeight: 600,
            background: `${color}15`, padding: "1px 6px", borderRadius: 4,
          }}>{item.action}</span>
          <span style={{ fontSize: 11, color: tokens.muted }}>
            {item.module && `${item.module} · `}
            {item.createdAt ? new Date(item.createdAt).toLocaleString("en-IN") : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function ProfilePageInner({ onLogout }) {
  const toast   = useToast();
  const fileRef = useRef();

  const [user,       setUser]       = useState(null);
  const [activity,   setActivity]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState("profile");

  // Profile form
  const [profile, setProfile] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [pErrors, setPErrors] = useState({});
  const [pSaving, setPSaving] = useState(false);

  // Password form
  const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [pwErrors,setPwErrors]= useState({});
  const [pwSaving,setPwSaving]= useState(false);
  const [showPw,   setShowPw] = useState({ old: false, new: false, confirm: false });

  // Avatar
  const [avatarLoad, setAvatarLoad] = useState(false);

  // ── load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([api.getMe(), api.getActivity().catch(() => ({ data: [] }))])
      .then(([me, act]) => {
        const u = me.data || me.user;
        setUser(u);
        setProfile({
          firstName: u.firstName || u.name?.split(" ")[0] || "",
          lastName:  u.lastName  || u.name?.split(" ").slice(1).join(" ") || "",
          email:     u.email     || "",
          phone:     u.phone     || "",
        });
        setActivity(act.data || []);
      })
      .catch(e => toast(e.message, "error"))
      .finally(() => setLoading(false));
  }, []);

  // ── update profile ──────────────────────────────────────────────────────────
  const validateProfile = () => {
    const e = {};
    if (!profile.firstName.trim()) e.firstName = "First name is required";
    if (!profile.email.trim())     e.email     = "Email is required";
    if (profile.email && !/\S+@\S+\.\S+/.test(profile.email)) e.email = "Invalid email";
    setPErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;
    setPSaving(true);
    try {
      const r = await api.updateProfile(profile);
      setUser(prev => ({ ...prev, ...profile }));
      toast("Profile updated successfully");
    } catch (e) { toast(e.message, "error"); }
    finally    { setPSaving(false); }
  };

  // ── change password ─────────────────────────────────────────────────────────
  const validatePw = () => {
    const e = {};
    if (!pwForm.oldPassword)             e.oldPassword     = "Current password is required";
    if (!pwForm.newPassword)             e.newPassword     = "New password is required";
    if (pwForm.newPassword.length < 8)   e.newPassword     = "At least 8 characters";
    if (pwForm.newPassword !== pwForm.confirmPassword) e.confirmPassword = "Passwords do not match";
    if (pwForm.newPassword === pwForm.oldPassword)     e.newPassword     = "New password must differ from old";
    setPwErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePw()) return;
    setPwSaving(true);
    try {
      await api.changePassword({ oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword });
      toast("Password changed successfully");
      setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e) { toast(e.message, "error"); }
    finally    { setPwSaving(false); }
  };

  // ── avatar ──────────────────────────────────────────────────────────────────
  const handleAvatarChange = async (file) => {
    if (!file) return;
    setAvatarLoad(true);
    try {
      const r = await api.uploadAvatar(file);
      setUser(prev => ({ ...prev, avatarUrl: r.avatarUrl || r.data?.avatarUrl }));
      toast("Avatar updated");
    } catch (e) { toast(e.message, "error"); }
    finally    { setAvatarLoad(false); }
  };

  if (loading) return (
    <div style={{ ...pageStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spinner size={40} />
    </div>
  );

  const TABS = [
    { key: "profile",  label: "Profile",        icon: "👤" },
    { key: "password", label: "Security",        icon: "🔒" },
    { key: "activity", label: "Activity Log",    icon: "📋" },
  ];

  const fullName  = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.name || user.email : "User";
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long" }) : "—";

  return (
    <div style={pageStyle}>
      <PageHeader title="My Profile" subtitle="Manage your account settings" />

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24, alignItems: "start" }}>

        {/* ── Left sidebar ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Profile card */}
          <Card style={{ padding: "24px", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div style={{ position: "relative" }}>
                <Avatar user={user} size={90} onClick={() => fileRef.current?.click()} />
                {avatarLoad && (
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "#0007",
                  }}>
                    <Spinner size={24} />
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={e => handleAvatarChange(e.target.files[0])} />
            </div>
            <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: tokens.text }}>{fullName}</h2>
            <p style={{ margin: "0 0 6px", fontSize: 13, color: tokens.textSub }}>{user?.email}</p>
            <span style={{
              display: "inline-block", fontSize: 12, fontWeight: 600, padding: "3px 12px",
              borderRadius: 99, background: `${tokens.accent}20`, color: tokens.accent,
              textTransform: "capitalize",
            }}>
              {user?.role || "user"}
            </span>
            <p style={{ margin: "12px 0 0", fontSize: 12, color: tokens.muted }}>
              Member since {memberSince}
            </p>
            <button onClick={() => fileRef.current?.click()}
              style={{
                marginTop: 12, background: "none", border: `1px solid ${tokens.border}`,
                color: tokens.textSub, borderRadius: 8, padding: "6px 14px",
                fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                transition: "all .15s", width: "100%",
              }}>
              📷 Change Photo
            </button>
          </Card>

          {/* Quick stats */}
          <Card style={{ padding: "16px 18px" }}>
            <SectionDivider label="Account Info" />
            <QS label="Role"        value={<span style={{ textTransform: "capitalize" }}>{user?.role || "—"}</span>} />
            <QS label="Last Login"  value={user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("en-IN") : "—"} />
            <QS label="Status"      value={<Badge status={user?.isActive !== false ? "active" : "inactive"} />} />
            <QS label="2FA"         value={user?.twoFactorEnabled ? "Enabled" : "Disabled"} />
          </Card>

          {/* Navigation */}
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

            <div style={{ height: 1, background: tokens.border, margin: "8px 4px" }} />

            {onLogout && (
              <button onClick={onLogout} style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "10px 14px", borderRadius: 8,
                border: "none", textAlign: "left", cursor: "pointer",
                fontFamily: "inherit", fontSize: 14, fontWeight: 500,
                background: "transparent", color: tokens.danger,
                transition: "all .15s",
              }}>
                <span>→</span> Sign Out
              </button>
            )}
          </Card>
        </div>

        {/* ── Right content ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── Profile Tab ── */}
          {activeTab === "profile" && (
            <Card style={{ padding: "24px" }}>
              <SH>Personal Information</SH>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <FF label="First Name *" error={pErrors.firstName}>
                  <input value={profile.firstName}
                    onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))}
                    placeholder="John"
                    style={{ ...finp, borderColor: pErrors.firstName ? tokens.danger : tokens.border }} />
                </FF>
                <FF label="Last Name">
                  <input value={profile.lastName}
                    onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))}
                    placeholder="Doe" style={finp} />
                </FF>
                <FF label="Email Address *" error={pErrors.email}>
                  <input type="email" value={profile.email}
                    onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                    placeholder="john@example.com"
                    style={{ ...finp, borderColor: pErrors.email ? tokens.danger : tokens.border }} />
                </FF>
                <FF label="Phone Number">
                  <input type="tel" value={profile.phone}
                    onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 98765 43210" style={finp} />
                </FF>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <Btn variant="primary" onClick={handleSaveProfile} disabled={pSaving}>
                  {pSaving ? "Saving…" : "Save Changes"}
                </Btn>
              </div>
            </Card>
          )}

          {/* ── Security Tab ── */}
          {activeTab === "password" && (
            <>
              <Card style={{ padding: "24px" }}>
                <SH>Change Password</SH>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  <FF label="Current Password *" error={pwErrors.oldPassword}>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPw.old ? "text" : "password"}
                        value={pwForm.oldPassword}
                        onChange={e => setPwForm(f => ({ ...f, oldPassword: e.target.value }))}
                        placeholder="Your current password"
                        style={{ ...finp, paddingRight: 44, borderColor: pwErrors.oldPassword ? tokens.danger : tokens.border }}
                      />
                      <button onClick={() => setShowPw(p => ({ ...p, old: !p.old }))}
                        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                          background: "none", border: "none", cursor: "pointer", color: tokens.muted, fontSize: 16 }}>
                        {showPw.old ? "🙈" : "👁"}
                      </button>
                    </div>
                  </FF>

                  <FF label="New Password *" error={pwErrors.newPassword}
                    hint="Minimum 8 characters with uppercase, number and special character">
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPw.new ? "text" : "password"}
                        value={pwForm.newPassword}
                        onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                        placeholder="At least 8 characters"
                        style={{ ...finp, paddingRight: 44, borderColor: pwErrors.newPassword ? tokens.danger : tokens.border }}
                      />
                      <button onClick={() => setShowPw(p => ({ ...p, new: !p.new }))}
                        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                          background: "none", border: "none", cursor: "pointer", color: tokens.muted, fontSize: 16 }}>
                        {showPw.new ? "🙈" : "👁"}
                      </button>
                    </div>
                    <StrengthMeter password={pwForm.newPassword} />
                  </FF>

                  <FF label="Confirm New Password *" error={pwErrors.confirmPassword}>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPw.confirm ? "text" : "password"}
                        value={pwForm.confirmPassword}
                        onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                        placeholder="Repeat new password"
                        style={{ ...finp, paddingRight: 44, borderColor: pwErrors.confirmPassword ? tokens.danger : tokens.border }}
                      />
                      <button onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))}
                        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                          background: "none", border: "none", cursor: "pointer", color: tokens.muted, fontSize: 16 }}>
                        {showPw.confirm ? "🙈" : "👁"}
                      </button>
                    </div>
                    {pwForm.confirmPassword && pwForm.newPassword === pwForm.confirmPassword && (
                      <span style={{ fontSize: 12, color: tokens.success }}>✓ Passwords match</span>
                    )}
                  </FF>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Btn variant="primary" onClick={handleChangePassword} disabled={pwSaving}>
                      {pwSaving ? "Changing…" : "Change Password"}
                    </Btn>
                  </div>
                </div>
              </Card>

              {/* Security tips */}
              <Card style={{ padding: "20px 24px" }}>
                <SH>Security Tips</SH>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { icon: "🔐", tip: "Use a unique password you don't use elsewhere" },
                    { icon: "🔢", tip: "Include numbers, symbols, and mixed case letters" },
                    { icon: "📏", tip: "Longer passwords (12+ chars) are significantly stronger" },
                    { icon: "🔄", tip: "Change your password every 3–6 months" },
                    { icon: "🚫", tip: "Never share your password with anyone, including support" },
                  ].map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
                      <span style={{ fontSize: 13, color: tokens.textSub, lineHeight: 1.5 }}>{s.tip}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* ── Activity Tab ── */}
          {activeTab === "activity" && (
            <Card style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <SH>Recent Activity</SH>
                <span style={{ fontSize: 13, color: tokens.textSub }}>Last 20 actions</span>
              </div>

              {activity.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <p style={{ fontSize: 32, margin: "0 0 10px" }}>📋</p>
                  <p style={{ color: tokens.textSub, fontSize: 14 }}>No activity recorded yet</p>
                </div>
              ) : (
                <div>
                  {activity.map((item, i) => (
                    <ActivityItem key={item.id || i} item={item} />
                  ))}
                </div>
              )}

              {/* Legend */}
              <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
                {[
                  { label: "Create", color: tokens.success },
                  { label: "Update", color: tokens.accent  },
                  { label: "Delete", color: tokens.danger  },
                  { label: "Convert", color: tokens.warning },
                ].map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
                    <span style={{ fontSize: 12, color: tokens.muted }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Quick stat row ───────────────────────────────────────────────────────────
function QS({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "8px 0", borderBottom: `1px solid ${tokens.border}20` }}>
      <span style={{ fontSize: 12, color: tokens.muted }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: tokens.text }}>{value}</span>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function ProfilePage(props) {
  return <ToastProvider><ProfilePageInner {...props} /></ToastProvider>;
}

/* ── USAGE ────────────────────────────────────────────────────────────────────
  <ProfilePage
    onLogout={() => {
      localStorage.removeItem("token");
      navigate("/login");
    }}
  />
─────────────────────────────────────────────────────────────────────────────*/