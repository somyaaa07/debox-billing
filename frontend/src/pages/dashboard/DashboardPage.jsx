// src/pages/dashboard/DashboardPage.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, Users, AlertCircle, FileText, ShoppingCart, ClipboardList, Receipt, CreditCard, ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { dashboardService } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import StatusBadge from '../../components/common/StatusBadge';
import PageLoader from '../../components/common/Loader';

/* ─── Inline styles (add to your global CSS or index.css instead) ─── */
const injectStyles = () => {
  if (document.getElementById('db-styles')) return;
  const style = document.createElement('style');
  style.id = 'db-styles';
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700&family=Inter:wght@400;500;600&display=swap');

    /* Base */
    .db-root { font-family: 'Inter', sans-serif; }

    /* Accent bar */
    .db-accent { width: 48px; height: 3px; background: #4579fe; border-radius: 2px; margin-bottom: 10px; }

    /* Page title */
    .db-page-title {
      font-family: 'Orbitron', sans-serif;
      font-size: 22px; font-weight: 700;
      color: #4579fe; letter-spacing: 0.04em;
      margin: 0 0 4px;
    }
    .db-page-subtitle { font-size: 13px; color: #6b7280; margin: 0; }

    /* Stat card */
    .db-stat-card {
      background: #fff;
      border: 1px solid #e8eeff;
      border-radius: 14px;
      padding: 16px 18px;
      display: flex; align-items: center; gap: 14px;
      transition: box-shadow 0.18s;
    }
    .db-stat-card:hover { box-shadow: 0 4px 20px rgba(69,121,254,0.12); }
    .db-stat-icon {
      width: 46px; height: 46px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .db-stat-label {
      font-size: 11px; font-weight: 500; text-transform: uppercase;
      letter-spacing: 0.04em; color: #9ca3af; margin-bottom: 3px;
    }
    .db-stat-value {
      font-family: 'Orbitron', sans-serif;
      font-size: 17px; font-weight: 700; color: #1a1a2e;
      letter-spacing: 0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    /* Secondary stat card */
    .db-sec-card {
      background: #fff;
      border: 1px solid #e8eeff;
      border-radius: 12px;
      padding: 14px 16px;
      display: flex; align-items: center; justify-content: space-between;
      transition: box-shadow 0.18s, border-color 0.18s;
      text-decoration: none;
    }
    .db-sec-card:hover { box-shadow: 0 4px 18px rgba(69,121,254,0.11); border-color: #b3c6ff; }
    .db-sec-label {
      font-size: 11px; font-weight: 500; text-transform: uppercase;
      letter-spacing: 0.04em; color: #9ca3af; margin-bottom: 4px;
    }
    .db-sec-value {
      font-family: 'Orbitron', sans-serif;
      font-size: 22px; font-weight: 700;
    }
    .db-sec-arrow { color: #d1d5db; transition: color 0.15s; }
    .db-sec-card:hover .db-sec-arrow { color: #6b7280; }

    /* Card shell */
    .db-card {
      background: #fff;
      border: 1px solid #e8eeff;
      border-radius: 14px;
      overflow: hidden;
    }
    .db-card-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px 0; margin-bottom: 4px;
    }
    .db-card-title {
      font-family: 'Orbitron', sans-serif;
      font-size: 12px; font-weight: 700;
      color: #1a1a2e; letter-spacing: 0.04em;
    }
    .db-card-sub { font-size: 11px; color: #b0b8d0; margin-top: 2px; }
    .db-view-all {
      font-size: 12px; color: #4579fe; font-weight: 500;
      text-decoration: none; transition: color 0.15s;
    }
    .db-view-all:hover { color: #2a5ce0; }

    /* Quick action item */
    .db-ql-item {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 10px; border-radius: 10px;
      text-decoration: none; color: inherit;
      transition: background 0.15s;
    }
    .db-ql-item:hover { background: #f0f4ff; }
    .db-ql-icon {
      width: 34px; height: 34px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .db-ql-label {
      font-size: 13px; font-weight: 500; color: #374151; flex: 1;
    }
    .db-ql-item:hover .db-ql-label { color: #1a1a2e; }
    .db-ql-arr { color: #d1d5db; transition: color 0.15s; }
    .db-ql-item:hover .db-ql-arr { color: #9ca3af; }

    /* Table */
    .db-table { width: 100%; border-collapse: collapse; }
    .db-table thead th {
      font-size: 11px; font-weight: 500; text-transform: uppercase;
      letter-spacing: 0.04em; color: #9ca3af;
      padding: 10px 20px;
      text-align: left;
      border-bottom: 1px solid #f0f4ff;
    }
    .db-table tbody td {
      font-size: 13px; color: #374151;
      padding: 10px 20px;
      border-bottom: 1px solid #f8f9fe;
    }
    .db-table tbody tr:last-child td { border-bottom: none; }
    .db-table tbody tr:hover td { background: #fafbff; }
    .db-inv-num {
      font-family: 'Orbitron', sans-serif;
      font-size: 11px; font-weight: 500; color: #4579fe;
      letter-spacing: 0.02em; text-decoration: none;
    }
    .db-inv-num:hover { color: #2a5ce0; text-decoration: underline; }
    .db-pay-num {
      font-family: 'Orbitron', sans-serif;
      font-size: 11px; font-weight: 500; color: #374151;
      letter-spacing: 0.02em;
    }
    .db-amt-dark {
      font-family: 'Orbitron', sans-serif;
      font-size: 12px; font-weight: 600; color: #1a1a2e;
    }
    .db-amt-green {
      font-family: 'Orbitron', sans-serif;
      font-size: 12px; font-weight: 600; color: #059669;
    }
    .db-badge-mode {
      display: inline-block; font-size: 11px; font-weight: 500;
      padding: 2px 9px; border-radius: 20px;
      background: #eef2ff; color: #4579fe;
      text-transform: capitalize;
    }
    .db-empty { text-align: center; color: #9ca3af; padding: 32px 0; font-size: 13px; }
  `;
  document.head.appendChild(style);
};

/* ─── Stat card ─── */
const StatCard = ({ icon: Icon, label, value, iconBg, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className="db-stat-card"
  >
    <div className="db-stat-icon" style={{ background: iconBg }}>
      <Icon size={20} color="#fff" />
    </div>
    <div style={{ minWidth: 0 }}>
      <p className="db-stat-label">{label}</p>
      <p className="db-stat-value">{value}</p>
    </div>
  </motion.div>
);

/* ─── Secondary stat card ─── */
const SecCard = ({ label, value, valueColor, path, delay }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
    <Link to={path} className="db-sec-card">
      <div>
        <p className="db-sec-label">{label}</p>
        <p className="db-sec-value" style={{ color: valueColor }}>{value}</p>
      </div>
      <ArrowUpRight size={18} className="db-sec-arrow" />
    </Link>
  </motion.div>
);

/* ─── Quick action item ─── */
const QuickLink = ({ label, path, icon: Icon, iconBg, iconColor }) => (
  <Link to={path} className="db-ql-item">
    <div className="db-ql-icon" style={{ background: iconBg }}>
      <Icon size={16} color={iconColor} />
    </div>
    <span className="db-ql-label">{label}</span>
    <ArrowUpRight size={14} className="db-ql-arr" />
  </Link>
);

/* ─── Custom tooltip for Recharts ─── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid #e8eeff', borderRadius: 10,
      padding: '10px 14px', fontSize: 12, fontFamily: 'Inter, sans-serif',
    }}>
      <p style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 11, color: '#9ca3af', marginBottom: 6 }}>{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.stroke, margin: '2px 0', fontWeight: 500 }}>
          {entry.dataKey}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

const formatYAxis = (v) =>
  v >= 100000 ? `₹${(v / 100000).toFixed(1)}L`
  : v >= 1000 ? `₹${(v / 1000).toFixed(0)}K`
  : `₹${v}`;

/* ─── Main page ─── */
export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    injectStyles();
    dashboardService.get()
      .then(({ data: res }) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (!data) return null;

  const {
    summary,
    monthlyRevenue = [],
    recentInvoices = [],
    recentPayments = [],
  } = data;

  const chartData = monthlyRevenue.map((m) => ({
    month: m.month,
    Revenue: parseFloat(m.revenue || 0),
    Billed: parseFloat(m.billed || 0),
  }));

  const quickActions = [
    { label: 'New Quotation',       path: '/quotations/new',        icon: FileText,     iconBg: '#eef2ff', iconColor: '#4579fe' },
    { label: 'New Purchase Order',  path: '/purchase-orders/new',   icon: ShoppingCart, iconBg: '#fffbeb', iconColor: '#f59e0b' },
    { label: 'New Proforma Invoice',path: '/proforma-invoices/new', icon: ClipboardList,iconBg: '#faf5ff', iconColor: '#a855f7' },
    { label: 'New Invoice',         path: '/final-invoices/new',    icon: Receipt,      iconBg: '#ecfdf5', iconColor: '#059669' },
    { label: 'Record Payment',      path: '/payments/new',          icon: CreditCard,   iconBg: '#f0fdfa', iconColor: '#0d9488' },
    { label: 'View Reports',        path: '/reports',               icon: TrendingUp,   iconBg: '#eef2ff', iconColor: '#6366f1' },
  ];

  return (
    <div className="db-root space-y-5">

      {/* Header */}
      <div>
        <div className="db-accent" />
        <h1 className="db-page-title">Dashboard</h1>
        <p className="db-page-subtitle">Overview of your business performance</p>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp}  label="Total Revenue"     value={formatCurrency(summary.totalRevenue)} iconBg="#4579fe" delay={0}    />
        <StatCard icon={AlertCircle} label="Total Outstanding" value={formatCurrency(summary.totalDue)}     iconBg="#ff4d6d" delay={0.05} />
        <StatCard icon={TrendingUp}  label="This Month"        value={formatCurrency(summary.monthRevenue)} iconBg="#00b894" delay={0.1}  />
        <StatCard icon={Users}       label="Total Clients"     value={summary.totalClients}                 iconBg="#a855f7" delay={0.15} />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SecCard label="Overdue Invoices" value={summary.overdueInvoices} valueColor="#ff4d6d" path="/final-invoices?status=overdue"     delay={0.2}  />
        <SecCard label="Pending POs"      value={summary.pendingPOs}      valueColor="#f59e0b" path="/purchase-orders?status=pending"    delay={0.25} />
        <SecCard label="Draft PIs"        value={summary.draftPIs}        valueColor="#4579fe" path="/proforma-invoices?status=draft"    delay={0.3}  />
        <SecCard label="Active Clients"   value={summary.totalClients}    valueColor="#00b894" path="/clients"                          delay={0.35} />
      </div>

      {/* Chart + Quick actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Revenue chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="db-card xl:col-span-2"
        >
          <div className="db-card-header">
            <div>
              <p className="db-card-title">Revenue Overview</p>
              <p className="db-card-sub">Last 12 months</p>
            </div>
          </div>
          <div style={{ padding: '12px 20px 20px' }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData} margin={{ top: 5, right: 8, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#4579fe" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#4579fe" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="bilGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#b0b8d0', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: '#b0b8d0', fontFamily: 'Inter' }} axisLine={false} tickLine={false} width={52} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'Inter', color: '#6b7280' }} />
                  <Area type="monotone" dataKey="Revenue" stroke="#4579fe" strokeWidth={2.5} fill="url(#revGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: '#4579fe' }} />
                  <Area type="monotone" dataKey="Billed"  stroke="#a78bfa" strokeWidth={2}   fill="url(#bilGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: '#a78bfa' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b0b8d0', fontSize: 13 }}>
                No revenue data yet
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="db-card"
        >
          <div className="db-card-header">
            <p className="db-card-title">Quick Actions</p>
          </div>
          <div style={{ padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {quickActions.map((item) => (
              <QuickLink key={item.path} {...item} />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Recent invoices */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="db-card"
        >
          <div className="db-card-header">
            <p className="db-card-title">Recent Invoices</p>
            <Link to="/final-invoices" className="db-view-all">View all</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="db-table">
              <thead>
                <tr><th>Invoice</th><th>Client</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recentInvoices.length === 0 ? (
                  <tr><td colSpan={4} className="db-empty">No invoices yet</td></tr>
                ) : recentInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <Link to={`/final-invoices/${inv.id}`} className="db-inv-num">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td>{inv.client?.name}</td>
                    <td><span className="db-amt-dark">{formatCurrency(inv.totalAmount)}</span></td>
                    <td><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Recent payments */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="db-card"
        >
          <div className="db-card-header">
            <p className="db-card-title">Recent Payments</p>
            <Link to="/payments" className="db-view-all">View all</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="db-table">
              <thead>
                <tr><th>Reference</th><th>Client</th><th>Amount</th><th>Mode</th></tr>
              </thead>
              <tbody>
                {recentPayments.length === 0 ? (
                  <tr><td colSpan={4} className="db-empty">No payments yet</td></tr>
                ) : recentPayments.map((p) => (
                  <tr key={p.id}>
                    <td><span className="db-pay-num">{p.paymentNumber}</span></td>
                    <td>{p.client?.name}</td>
                    <td><span className="db-amt-green">{formatCurrency(p.amount)}</span></td>
                    <td>
                      <span className="db-badge-mode">
                        {p.paymentMode?.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

      </div>
    </div>
  );
}