// // pages/reports/ReportsPage.jsx
// import React, { useState, useEffect, useCallback } from 'react';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
// import { TrendingUp, FileText, AlertCircle, RefreshCw, Calendar } from 'lucide-react';
// import toast from 'react-hot-toast';

// // ✅ Import from your existing api.js — no more fetch()
// import { reportService } from '../../services/api';
// import { formatCurrency, formatDate } from '../../utils/helpers';
// import StatusBadge from '../../components/common/StatusBadge';
// import PageLoader from '../../components/common/Loader';

// // ─── Date helpers ──────────────────────────────────────────────────
// const toDateStr = (d) => d.toISOString().slice(0, 10);
// const thisMonthStart = () => { const d = new Date(); d.setDate(1); return toDateStr(d); };
// const today = () => toDateStr(new Date());

// const QUICK_RANGES = [
//   { label: 'This Month',   start: thisMonthStart(),  end: today() },
//   {
//     label: 'Last Month',
//     start: (() => { const d = new Date(); d.setMonth(d.getMonth()-1); d.setDate(1); return toDateStr(d); })(),
//     end:   (() => { const d = new Date(); d.setDate(0); return toDateStr(d); })(),
//   },
//   {
//     label: 'Last 3 Months',
//     start: (() => { const d = new Date(); d.setMonth(d.getMonth()-3); return toDateStr(d); })(),
//     end: today(),
//   },
//   {
//     label: 'This Year',
//     start: (() => { const d = new Date(); d.setMonth(0); d.setDate(1); return toDateStr(d); })(),
//     end: today(),
//   },
// ];

// const TABS = [
//   { key: 'revenue',     label: 'Revenue',     icon: TrendingUp  },
//   { key: 'gst',         label: 'GST',         icon: FileText    },
//   { key: 'outstanding', label: 'Outstanding', icon: AlertCircle },
// ];

// // ─── DateRangePicker ───────────────────────────────────────────────
// function DateRangePicker({ start, end, onStart, onEnd, onApply, loading }) {
//   return (
//     <div className="card p-4 mb-5">
//       <div className="flex flex-wrap gap-3 items-end">
//         <div>
//           <label className="label">From</label>
//           <input type="date" value={start} onChange={e => onStart(e.target.value)} className="input w-40"/>
//         </div>
//         <div>
//           <label className="label">To</label>
//           <input type="date" value={end} onChange={e => onEnd(e.target.value)} className="input w-40"/>
//         </div>
//         <button onClick={onApply} disabled={loading} className="btn-primary">
//           {loading ? 'Loading…' : 'Apply'}
//         </button>
//         <div className="flex gap-2 flex-wrap">
//           {QUICK_RANGES.map(r => (
//             <button key={r.label} onClick={() => { onStart(r.start); onEnd(r.end); setTimeout(onApply, 50); }}
//               className="btn-ghost btn-sm">
//               {r.label}
//             </button>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── Revenue Report ────────────────────────────────────────────────
// function RevenueReport() {
//   const [start, setStart]   = useState(thisMonthStart());
//   const [end,   setEnd]     = useState(today());
//   const [data,  setData]    = useState(null);
//   const [loading, setLoading] = useState(false);

//   const load = useCallback(async () => {
//     setLoading(true);
//     try {
//       // ✅ using axios reportService — correct baseURL + auth token auto-injected
//       const res = await reportService.getRevenue({ startDate: start, endDate: end });
//       setData(res.data.data);
//     } catch (e) {
//       toast.error(e.response?.data?.message || 'Failed to load revenue report');
//     } finally { setLoading(false); }
//   }, [start, end]);

//   useEffect(() => { load(); }, []);

//   const invoices = data?.invoices || [];
//   const summary  = data?.summary  || { totalBilled: 0, totalPaid: 0, totalDue: 0 };

//   // Group by month for chart
//   const byMonth = invoices.reduce((acc, inv) => {
//     const m = inv.invoiceDate?.slice(0, 7) || 'Unknown';
//     if (!acc[m]) acc[m] = { month: m, Revenue: 0, Billed: 0 };
//     acc[m].Revenue += parseFloat(inv.paidAmount  || 0);
//     acc[m].Billed  += parseFloat(inv.totalAmount || 0);
//     return acc;
//   }, {});
//   const chartData = Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));

//   return (
//     <div className="space-y-5">
//       <DateRangePicker start={start} end={end} onStart={setStart} onEnd={setEnd} onApply={load} loading={loading}/>

//       {loading ? <PageLoader/> : data && (
//         <>
//           {/* Summary cards */}
//           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
//             {[
//               { label: 'Total Billed',    value: formatCurrency(summary.totalBilled), color: 'text-slate-800 dark:text-slate-100' },
//               { label: 'Total Paid',      value: formatCurrency(summary.totalPaid),   color: 'text-emerald-600' },
//               { label: 'Total Due',       value: formatCurrency(summary.totalDue),    color: 'text-red-600'     },
//               { label: 'Invoices',        value: invoices.length,                     color: 'text-blue-600'    },
//               { label: 'Collection %',    value: summary.totalBilled > 0
//                   ? `${((summary.totalPaid / summary.totalBilled) * 100).toFixed(1)}%`
//                   : '—', color: 'text-purple-600' },
//             ].map(s => (
//               <div key={s.label} className="card p-4">
//                 <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{s.label}</p>
//                 <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
//               </div>
//             ))}
//           </div>

//           {/* Chart */}
//           {chartData.length > 0 && (
//             <div className="card card-body">
//               <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Monthly Revenue</h3>
//               <ResponsiveContainer width="100%" height={220}>
//                 <BarChart data={chartData}>
//                   <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
//                   <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
//                   <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
//                   <Tooltip formatter={v => [formatCurrency(v), '']} contentStyle={{ borderRadius: 10, fontSize: 12 }}/>
//                   <Bar dataKey="Revenue" fill="#2563eb" radius={[4,4,0,0]}/>
//                   <Bar dataKey="Billed"  fill="#8b5cf6" radius={[4,4,0,0]}/>
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>
//           )}

//           {/* Table */}
//           <div className="card">
//             <div className="card-header">
//               <h3 className="font-semibold text-slate-900 dark:text-slate-100">Invoice Breakdown ({invoices.length})</h3>
//             </div>
//             {invoices.length === 0 ? (
//               <p className="text-center text-slate-400 py-10">No invoices in selected range</p>
//             ) : (
//               <div className="table-wrapper">
//                 <table className="table">
//                   <thead><tr><th>Invoice #</th><th>Client</th><th>Date</th><th>Total</th><th>Paid</th><th>Due</th><th>Status</th></tr></thead>
//                   <tbody>
//                     {invoices.map((inv, i) => (
//                       <tr key={i}>
//                         <td className="font-semibold text-blue-600">{inv.invoiceNumber}</td>
//                         <td>
//                           <p className="font-medium">{inv.client?.name || '—'}</p>
//                           <p className="text-xs text-slate-400">{inv.client?.company}</p>
//                         </td>
//                         <td className="text-xs text-slate-500">{formatDate(inv.invoiceDate)}</td>
//                         <td className="font-semibold">{formatCurrency(inv.totalAmount)}</td>
//                         <td className="text-emerald-600 font-semibold">{formatCurrency(inv.paidAmount)}</td>
//                         <td className={`font-semibold ${parseFloat(inv.dueAmount) > 0 ? 'text-red-600' : 'text-slate-400'}`}>
//                           {formatCurrency(inv.dueAmount)}
//                         </td>
//                         <td><StatusBadge status={inv.status}/></td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// // ─── GST Report ────────────────────────────────────────────────────
// function GSTReport() {
//   const [start, setStart]   = useState(thisMonthStart());
//   const [end,   setEnd]     = useState(today());
//   const [data,  setData]    = useState(null);
//   const [loading, setLoading] = useState(false);

//   const load = useCallback(async () => {
//     setLoading(true);
//     try {
//       // ✅ axios service — correct URL /api/v1/reports/gst
//       const res = await reportService.getGST({ startDate: start, endDate: end });
//       setData(res.data.data);
//     } catch (e) {
//       toast.error(e.response?.data?.message || 'Failed to load GST report');
//     } finally { setLoading(false); }
//   }, [start, end]);

//   useEffect(() => { load(); }, []);

//   const rows      = data || [];
//   const totalCGST = rows.reduce((s, r) => s + parseFloat(r.totalCGST     || 0), 0);
//   const totalSGST = rows.reduce((s, r) => s + parseFloat(r.totalSGST     || 0), 0);
//   const totalIGST = rows.reduce((s, r) => s + parseFloat(r.totalIGST     || 0), 0);
//   const totalGST  = rows.reduce((s, r) => s + parseFloat(r.totalGST      || 0), 0);
//   const taxable   = rows.reduce((s, r) => s + parseFloat(r.taxableAmount  || 0), 0);

//   const chartData = rows.map(r => ({ period: r.period, GST: parseFloat(r.totalGST || 0) }));

//   return (
//     <div className="space-y-5">
//       <DateRangePicker start={start} end={end} onStart={setStart} onEnd={setEnd} onApply={load} loading={loading}/>

//       {loading ? <PageLoader/> : data && (
//         <>
//           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
//             {[
//               { label: 'Taxable Amount', value: formatCurrency(taxable),   color: 'text-slate-800 dark:text-slate-100' },
//               { label: 'Total CGST',     value: formatCurrency(totalCGST), color: 'text-blue-600'   },
//               { label: 'Total SGST',     value: formatCurrency(totalSGST), color: 'text-blue-600'   },
//               { label: 'Total IGST',     value: formatCurrency(totalIGST), color: 'text-amber-600'  },
//               { label: 'Total GST',      value: formatCurrency(totalGST),  color: 'text-emerald-600'},
//             ].map(s => (
//               <div key={s.label} className="card p-4">
//                 <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{s.label}</p>
//                 <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
//               </div>
//             ))}
//           </div>

//           {chartData.length > 0 && (
//             <div className="card card-body">
//               <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">GST by Period</h3>
//               <ResponsiveContainer width="100%" height={200}>
//                 <BarChart data={chartData}>
//                   <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
//                   <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
//                   <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
//                   <Tooltip formatter={v => [formatCurrency(v), 'GST']} contentStyle={{ borderRadius: 10, fontSize: 12 }}/>
//                   <Bar dataKey="GST" fill="#f59e0b" radius={[4,4,0,0]}/>
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>
//           )}

//           <div className="card">
//             <div className="card-header">
//               <h3 className="font-semibold text-slate-900 dark:text-slate-100">GST Period-wise</h3>
//             </div>
//             {rows.length === 0 ? (
//               <p className="text-center text-slate-400 py-10">No GST data in selected range</p>
//             ) : (
//               <div className="table-wrapper">
//                 <table className="table">
//                   <thead><tr><th>Period</th><th>Taxable</th><th>CGST</th><th>SGST</th><th>IGST</th><th>Total GST</th></tr></thead>
//                   <tbody>
//                     {rows.map((r, i) => (
//                       <tr key={i}>
//                         <td className="font-bold text-blue-600">{r.period}</td>
//                         <td>{formatCurrency(r.taxableAmount)}</td>
//                         <td>{formatCurrency(r.totalCGST)}</td>
//                         <td>{formatCurrency(r.totalSGST)}</td>
//                         <td>{formatCurrency(r.totalIGST)}</td>
//                         <td className="font-bold text-emerald-600">{formatCurrency(r.totalGST)}</td>
//                       </tr>
//                     ))}
//                     {/* Totals row */}
//                     <tr className="bg-slate-50 dark:bg-slate-800/60 font-bold border-t-2 border-slate-200 dark:border-slate-700">
//                       <td className="px-4 py-3">TOTAL</td>
//                       <td className="px-4 py-3">{formatCurrency(taxable)}</td>
//                       <td className="px-4 py-3">{formatCurrency(totalCGST)}</td>
//                       <td className="px-4 py-3">{formatCurrency(totalSGST)}</td>
//                       <td className="px-4 py-3">{formatCurrency(totalIGST)}</td>
//                       <td className="px-4 py-3 text-emerald-600">{formatCurrency(totalGST)}</td>
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// // ─── Outstanding Report ────────────────────────────────────────────
// function OutstandingReport() {
//   const [data, setData]       = useState(null);
//   const [loading, setLoading] = useState(false);

//   const load = async () => {
//     setLoading(true);
//     try {
//       // ✅ axios service — correct URL /api/v1/reports/outstanding
//       const res = await reportService.getOutstanding();
//       setData(res.data.data);
//     } catch (e) {
//       toast.error(e.response?.data?.message || 'Failed to load outstanding report');
//     } finally { setLoading(false); }
//   };

//   useEffect(() => { load(); }, []);

//   const invoices   = data || [];
//   const totalDue   = invoices.reduce((s, inv) => s + parseFloat(inv.dueAmount || 0), 0);
//   const now        = Date.now();
//   const ageDays    = (inv) => Math.max(0, Math.floor((now - new Date(inv.dueDate).getTime()) / 86400000));
//   const overdueCnt = invoices.filter(inv => inv.dueDate && new Date(inv.dueDate) < new Date()).length;

//   const buckets = { '0–30': 0, '31–60': 0, '61–90': 0, '90+': 0 };
//   invoices.forEach(inv => {
//     const d = ageDays(inv);
//     if      (d <= 30) buckets['0–30']  += parseFloat(inv.dueAmount || 0);
//     else if (d <= 60) buckets['31–60'] += parseFloat(inv.dueAmount || 0);
//     else if (d <= 90) buckets['61–90'] += parseFloat(inv.dueAmount || 0);
//     else              buckets['90+']   += parseFloat(inv.dueAmount || 0);
//   });
//   const bucketData = Object.entries(buckets).map(([period, amt]) => ({ period, Amount: amt }));

//   return (
//     <div className="space-y-5">
//       <div className="flex justify-end">
//         <button onClick={load} disabled={loading} className="btn-ghost btn-sm gap-2">
//           <RefreshCw size={14} className={loading ? 'animate-spin' : ''}/> Refresh
//         </button>
//       </div>

//       {loading ? <PageLoader/> : data && (
//         <>
//           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
//             {[
//               { label: 'Unpaid Invoices',  value: invoices.length,             color: 'text-slate-800 dark:text-slate-100' },
//               { label: 'Total Outstanding',value: formatCurrency(totalDue),    color: 'text-red-600'   },
//               { label: 'Overdue Count',    value: overdueCnt,                  color: 'text-red-600'   },
//               { label: '0–30 Days',        value: formatCurrency(buckets['0–30']),  color: 'text-amber-600' },
//               { label: '31–60 Days',       value: formatCurrency(buckets['31–60']), color: 'text-orange-600'},
//               { label: '60+ Days',         value: formatCurrency(buckets['61–90'] + buckets['90+']), color: 'text-red-600' },
//             ].map(s => (
//               <div key={s.label} className="card p-4">
//                 <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{s.label}</p>
//                 <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
//               </div>
//             ))}
//           </div>

//           {/* Aging chart */}
//           <div className="card card-body">
//             <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Aging Analysis</h3>
//             <ResponsiveContainer width="100%" height={180}>
//               <BarChart data={bucketData}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
//                 <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
//                 <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
//                 <Tooltip formatter={v => [formatCurrency(v), 'Due Amount']} contentStyle={{ borderRadius: 10, fontSize: 12 }}/>
//                 <Bar dataKey="Amount" radius={[4,4,0,0]}>
//                   {bucketData.map((_, i) => (
//                     <Cell key={i} fill={['#22c55e','#f59e0b','#f97316','#ef4444'][i]}/>
//                   ))}
//                 </Bar>
//               </BarChart>
//             </ResponsiveContainer>
//           </div>

//           {/* Table */}
//           <div className="card">
//             <div className="card-header">
//               <h3 className="font-semibold text-slate-900 dark:text-slate-100">Outstanding Invoices ({invoices.length})</h3>
//             </div>
//             {invoices.length === 0 ? (
//               <div className="text-center py-12">
//                 <p className="text-3xl mb-2">✅</p>
//                 <p className="text-slate-400">All invoices paid. Great work!</p>
//               </div>
//             ) : (
//               <div className="table-wrapper">
//                 <table className="table">
//                   <thead><tr><th>Invoice #</th><th>Client</th><th>Email</th><th>Total</th><th>Due</th><th>Due Date</th><th>Days Late</th><th>Status</th></tr></thead>
//                   <tbody>
//                     {invoices.map((inv, i) => {
//                       const d = ageDays(inv);
//                       return (
//                         <tr key={i}>
//                           <td className="font-bold text-blue-600">{inv.invoiceNumber}</td>
//                           <td>
//                             <p className="font-medium">{inv.client?.name || '—'}</p>
//                             <p className="text-xs text-slate-400">{inv.client?.company}</p>
//                           </td>
//                           <td className="text-xs text-slate-500">{inv.client?.email || '—'}</td>
//                           <td className="font-semibold">{formatCurrency(inv.totalAmount)}</td>
//                           <td className="font-bold text-red-600">{formatCurrency(inv.dueAmount)}</td>
//                           <td className="text-xs text-slate-500">{formatDate(inv.dueDate)}</td>
//                           <td>
//                             <span className={`font-bold text-sm ${d > 60 ? 'text-red-600' : d > 30 ? 'text-amber-600' : 'text-slate-500'}`}>
//                               {d > 0 ? `+${d}d` : 'On time'}
//                             </span>
//                           </td>
//                           <td><StatusBadge status={inv.status}/></td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// // ─── Main Page ─────────────────────────────────────────────────────
// export default function ReportsPage() {
//   const [activeTab, setActiveTab] = useState('revenue');

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="page-title">Reports</h1>
//         <p className="page-subtitle">Revenue, GST and outstanding analysis</p>
//       </div>

//       {/* Tab bar */}
//       <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit border border-slate-200 dark:border-slate-700">
//         {TABS.map(t => {
//           const Icon = t.icon;
//           return (
//             <button key={t.key} onClick={() => setActiveTab(t.key)}
//               className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
//                 activeTab === t.key
//                   ? 'bg-blue-600 text-white shadow-sm'
//                   : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
//               }`}>
//               <Icon size={15}/> {t.label}
//             </button>
//           );
//         })}
//       </div>

//       {activeTab === 'revenue'     && <RevenueReport/>}
//       {activeTab === 'gst'         && <GSTReport/>}
//       {activeTab === 'outstanding' && <OutstandingReport/>}
//     </div>
//   );
// }




// pages/reports/ReportsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import {
  FiTrendingUp, FiFileText, FiAlertCircle, FiRefreshCw,
  FiCalendar, FiDownload, FiFilter, FiChevronDown
} from 'react-icons/fi';
import toast from 'react-hot-toast';

import { reportService } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import StatusBadge from '../../components/common/StatusBadge';
import PageLoader from '../../components/common/Loader';

// ─── Date helpers ──────────────────────────────────────────────────
const toDateStr = (d) => d.toISOString().slice(0, 10);
const thisMonthStart = () => { const d = new Date(); d.setDate(1); return toDateStr(d); };
const today = () => toDateStr(new Date());

const QUICK_RANGES = [
  { label: 'This Month', start: thisMonthStart(), end: today() },
  {
    label: 'Last Month',
    start: (() => { const d = new Date(); d.setMonth(d.getMonth() - 1); d.setDate(1); return toDateStr(d); })(),
    end: (() => { const d = new Date(); d.setDate(0); return toDateStr(d); })(),
  },
  {
    label: 'Last 3 Months',
    start: (() => { const d = new Date(); d.setMonth(d.getMonth() - 3); return toDateStr(d); })(),
    end: today(),
  },
  {
    label: 'This Year',
    start: (() => { const d = new Date(); d.setMonth(0); d.setDate(1); return toDateStr(d); })(),
    end: today(),
  },
];

const TABS = [
  { key: 'revenue', label: 'Revenue', icon: FiTrendingUp },
  { key: 'gst', label: 'GST', icon: FiFileText },
  { key: 'outstanding', label: 'Outstanding', icon: FiAlertCircle },
];

// ─── DateRangePicker ───────────────────────────────────────────────
function DateRangePicker({ start, end, onStart, onEnd, onApply, loading }) {
  return (
    <div style={dateRangeCardS}>
      <div style={dateRangeWrapperS}>
        <div style={dateInputGroupS}>
          <label style={dateInputLabelS}>
            <FiCalendar size={14} style={{ marginRight: 6 }} />
            From
          </label>
          <input
            type="date"
            value={start}
            onChange={e => onStart(e.target.value)}
            style={dateInputS}
          />
        </div>

        <div style={dateInputGroupS}>
          <label style={dateInputLabelS}>
            <FiCalendar size={14} style={{ marginRight: 6 }} />
            To
          </label>
          <input
            type="date"
            value={end}
            onChange={e => onEnd(e.target.value)}
            style={dateInputS}
          />
        </div>

        <button
          onClick={onApply}
          disabled={loading}
          style={{
            ...applyButtonS,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Loading…' : 'Apply'}
        </button>

        <div style={quickRangeWrapperS}>
          {QUICK_RANGES.map(r => (
            <button
              key={r.label}
              onClick={() => { onStart(r.start); onEnd(r.end); setTimeout(onApply, 50); }}
              style={quickRangeButtonS}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── StatCard Component ────────────────────────────────────────────
function StatCard({ label, value, color, icon: Icon }) {
  return (
    <div style={statCardS}>
      <div style={statIconWrapperS(color)}>
        {Icon && <Icon size={18} />}
      </div>
      <div style={statContentS}>
        <p style={statLabelS}>{label}</p>
        <p style={{ ...statValueS, color }}>{value}</p>
      </div>
    </div>
  );
}

// ─── Revenue Report ────────────────────────────────────────────────
function RevenueReport() {
  const [start, setStart] = useState(thisMonthStart());
  const [end, setEnd] = useState(today());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportService.getRevenue({ startDate: start, endDate: end });
      setData(res.data.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load revenue report');
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  useEffect(() => { load(); }, []);

  const invoices = data?.invoices || [];
  const summary = data?.summary || { totalBilled: 0, totalPaid: 0, totalDue: 0 };

  const byMonth = invoices.reduce((acc, inv) => {
    const m = inv.invoiceDate?.slice(0, 7) || 'Unknown';
    if (!acc[m]) acc[m] = { month: m, Revenue: 0, Billed: 0 };
    acc[m].Revenue += parseFloat(inv.paidAmount || 0);
    acc[m].Billed += parseFloat(inv.totalAmount || 0);
    return acc;
  }, {});
  const chartData = Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));

  const collectionRate = summary.totalBilled > 0
    ? ((summary.totalPaid / summary.totalBilled) * 100).toFixed(1)
    : 0;

  return (
    <div style={reportSectionS}>
      <DateRangePicker start={start} end={end} onStart={setStart} onEnd={setEnd} onApply={load} loading={loading} />

      {loading ? (
        <PageLoader />
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div style={statsGridS}>
            <StatCard
              label="Total Billed"
              value={formatCurrency(summary.totalBilled)}
              color="#1f2937"
              icon={FiFileText}
            />
            <StatCard
              label="Total Paid"
              value={formatCurrency(summary.totalPaid)}
              color="#10b981"
              icon={FiTrendingUp}
            />
            <StatCard
              label="Total Due"
              value={formatCurrency(summary.totalDue)}
              color="#ef4444"
              icon={FiAlertCircle}
            />
            <StatCard
              label="Invoices Count"
              value={invoices.length}
              color="#3b82f6"
              icon={FiFileText}
            />
            <StatCard
              label="Collection %"
              value={`${collectionRate}%`}
              color="#8b5cf6"
              icon={FiTrendingUp}
            />
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div style={chartCardS}>
              <h3 style={chartTitleS}>Monthly Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={v => formatCurrency(v)}
                    contentStyle={tooltipStyleS}
                  />
                  <Legend wrapperStyle={{ paddingTop: 20 }} />
                  <Line
                    type="monotone"
                    dataKey="Revenue"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Billed"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Table */}
          <div style={tableCardS}>
            <div style={tableHeaderS}>
              <h3 style={tableHeadingS}>Invoice Breakdown ({invoices.length})</h3>
            </div>
            {invoices.length === 0 ? (
              <p style={emptyStateS}>No invoices in selected range</p>
            ) : (
              <div style={tableWrapperS}>
                <table style={tableS}>
                  <thead>
                    <tr style={tableHeadRowS}>
                      <th style={tableHeadCellS}>Invoice #</th>
                      <th style={tableHeadCellS}>Client</th>
                      <th style={tableHeadCellS}>Date</th>
                      <th style={tableHeadCellS}>Total</th>
                      <th style={tableHeadCellS}>Paid</th>
                      <th style={tableHeadCellS}>Due</th>
                      <th style={tableHeadCellS}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv, i) => (
                      <tr key={i} style={tableBodyRowS}>
                        <td style={{ ...tableBodyCellS, fontWeight: 700, color: '#3b82f6' }}>
                          {inv.invoiceNumber}
                        </td>
                        <td style={tableBodyCellS}>
                          <p style={tableClientNameS}>{inv.client?.name || '—'}</p>
                          <p style={tableClientCompanyS}>{inv.client?.company}</p>
                        </td>
                        <td style={{ ...tableBodyCellS, fontSize: 13, color: '#6b7280' }}>
                          {formatDate(inv.invoiceDate)}
                        </td>
                        <td style={{ ...tableBodyCellS, fontWeight: 600 }}>
                          {formatCurrency(inv.totalAmount)}
                        </td>
                        <td style={{ ...tableBodyCellS, fontWeight: 600, color: '#10b981' }}>
                          {formatCurrency(inv.paidAmount)}
                        </td>
                        <td
                          style={{
                            ...tableBodyCellS,
                            fontWeight: 600,
                            color: parseFloat(inv.dueAmount) > 0 ? '#ef4444' : '#6b7280',
                          }}
                        >
                          {formatCurrency(inv.dueAmount)}
                        </td>
                        <td style={tableBodyCellS}>
                          <StatusBadge status={inv.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

// ─── GST Report ────────────────────────────────────────────────────
function GSTReport() {
  const [start, setStart] = useState(thisMonthStart());
  const [end, setEnd] = useState(today());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportService.getGST({ startDate: start, endDate: end });
      setData(res.data.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load GST report');
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  useEffect(() => { load(); }, []);

  const rows = data || [];
  const totalCGST = rows.reduce((s, r) => s + parseFloat(r.totalCGST || 0), 0);
  const totalSGST = rows.reduce((s, r) => s + parseFloat(r.totalSGST || 0), 0);
  const totalIGST = rows.reduce((s, r) => s + parseFloat(r.totalIGST || 0), 0);
  const totalGST = rows.reduce((s, r) => s + parseFloat(r.totalGST || 0), 0);
  const taxable = rows.reduce((s, r) => s + parseFloat(r.taxableAmount || 0), 0);

  const chartData = rows.map(r => ({ period: r.period, CGST: parseFloat(r.totalCGST || 0), SGST: parseFloat(r.totalSGST || 0), IGST: parseFloat(r.totalIGST || 0) }));

  return (
    <div style={reportSectionS}>
      <DateRangePicker start={start} end={end} onStart={setStart} onEnd={setEnd} onApply={load} loading={loading} />

      {loading ? (
        <PageLoader />
      ) : data ? (
        <>
          <div style={statsGridS}>
            <StatCard
              label="Taxable Amount"
              value={formatCurrency(taxable)}
              color="#1f2937"
              icon={FiFileText}
            />
            <StatCard
              label="Total CGST"
              value={formatCurrency(totalCGST)}
              color="#3b82f6"
              icon={FiTrendingUp}
            />
            <StatCard
              label="Total SGST"
              value={formatCurrency(totalSGST)}
              color="#06b6d4"
              icon={FiTrendingUp}
            />
            <StatCard
              label="Total IGST"
              value={formatCurrency(totalIGST)}
              color="#f59e0b"
              icon={FiTrendingUp}
            />
            <StatCard
              label="Total GST"
              value={formatCurrency(totalGST)}
              color="#10b981"
              icon={FiFileText}
            />
          </div>

          {chartData.length > 0 && (
            <div style={chartCardS}>
              <h3 style={chartTitleS}>GST Collection by Type</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip formatter={v => formatCurrency(v)} contentStyle={tooltipStyleS} />
                  <Legend wrapperStyle={{ paddingTop: 15 }} />
                  <Bar dataKey="CGST" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="SGST" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="IGST" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={tableCardS}>
            <div style={tableHeaderS}>
              <h3 style={tableHeadingS}>GST Period-wise Breakdown</h3>
            </div>
            {rows.length === 0 ? (
              <p style={emptyStateS}>No GST data in selected range</p>
            ) : (
              <div style={tableWrapperS}>
                <table style={tableS}>
                  <thead>
                    <tr style={tableHeadRowS}>
                      <th style={tableHeadCellS}>Period</th>
                      <th style={tableHeadCellS}>Taxable</th>
                      <th style={tableHeadCellS}>CGST</th>
                      <th style={tableHeadCellS}>SGST</th>
                      <th style={tableHeadCellS}>IGST</th>
                      <th style={tableHeadCellS}>Total GST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} style={tableBodyRowS}>
                        <td style={{ ...tableBodyCellS, fontWeight: 700, color: '#3b82f6' }}>
                          {r.period}
                        </td>
                        <td style={tableBodyCellS}>{formatCurrency(r.taxableAmount)}</td>
                        <td style={tableBodyCellS}>{formatCurrency(r.totalCGST)}</td>
                        <td style={tableBodyCellS}>{formatCurrency(r.totalSGST)}</td>
                        <td style={tableBodyCellS}>{formatCurrency(r.totalIGST)}</td>
                        <td style={{ ...tableBodyCellS, fontWeight: 700, color: '#10b981' }}>
                          {formatCurrency(r.totalGST)}
                        </td>
                      </tr>
                    ))}
                    <tr style={totalRowS}>
                      <td style={{ ...tableBodyCellS, fontWeight: 700 }}>TOTAL</td>
                      <td style={{ ...tableBodyCellS, fontWeight: 700 }}>{formatCurrency(taxable)}</td>
                      <td style={{ ...tableBodyCellS, fontWeight: 700 }}>{formatCurrency(totalCGST)}</td>
                      <td style={{ ...tableBodyCellS, fontWeight: 700 }}>{formatCurrency(totalSGST)}</td>
                      <td style={{ ...tableBodyCellS, fontWeight: 700 }}>{formatCurrency(totalIGST)}</td>
                      <td style={{ ...tableBodyCellS, fontWeight: 700, color: '#10b981' }}>
                        {formatCurrency(totalGST)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

// ─── Outstanding Report ────────────────────────────────────────────
function OutstandingReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await reportService.getOutstanding();
      setData(res.data.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load outstanding report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const invoices = data || [];
  const totalDue = invoices.reduce((s, inv) => s + parseFloat(inv.dueAmount || 0), 0);
  const now = Date.now();
  const ageDays = (inv) => Math.max(0, Math.floor((now - new Date(inv.dueDate).getTime()) / 86400000));
  const overdueCnt = invoices.filter(inv => inv.dueDate && new Date(inv.dueDate) < new Date()).length;

  const buckets = { '0–30': 0, '31–60': 0, '61–90': 0, '90+': 0 };
  invoices.forEach(inv => {
    const d = ageDays(inv);
    if (d <= 30) buckets['0–30'] += parseFloat(inv.dueAmount || 0);
    else if (d <= 60) buckets['31–60'] += parseFloat(inv.dueAmount || 0);
    else if (d <= 90) buckets['61–90'] += parseFloat(inv.dueAmount || 0);
    else buckets['90+'] += parseFloat(inv.dueAmount || 0);
  });
  const bucketData = Object.entries(buckets).map(([period, amt]) => ({ period, Amount: amt }));

  return (
    <div style={reportSectionS}>
      <div style={refreshButtonWrapperS}>
        <button onClick={load} disabled={loading} style={refreshButtonS}>
          <FiRefreshCw size={16} style={{ marginRight: 6, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <PageLoader />
      ) : data ? (
        <>
          <div style={statsGridS}>
            <StatCard
              label="Unpaid Invoices"
              value={invoices.length}
              color="#1f2937"
              icon={FiFileText}
            />
            <StatCard
              label="Total Outstanding"
              value={formatCurrency(totalDue)}
              color="#ef4444"
              icon={FiAlertCircle}
            />
            <StatCard
              label="Overdue Count"
              value={overdueCnt}
              color="#dc2626"
              icon={FiAlertCircle}
            />
            <StatCard
              label="0–30 Days"
              value={formatCurrency(buckets['0–30'])}
              color="#f59e0b"
              icon={FiTrendingUp}
            />
            <StatCard
              label="31–60 Days"
              value={formatCurrency(buckets['31–60'])}
              color="#f97316"
              icon={FiTrendingUp}
            />
            <StatCard
              label="60+ Days"
              value={formatCurrency(buckets['61–90'] + buckets['90+'])}
              color="#ef4444"
              icon={FiAlertCircle}
            />
          </div>

          {/* Aging Chart */}
          {bucketData.length > 0 && (
            <div style={chartCardS}>
              <h3 style={chartTitleS}>Aging Analysis</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={bucketData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip formatter={v => formatCurrency(v)} contentStyle={tooltipStyleS} />
                  <Bar dataKey="Amount" radius={[4, 4, 0, 0]}>
                    {bucketData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={['#10b981', '#f59e0b', '#f97316', '#ef4444'][i]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Table */}
          <div style={tableCardS}>
            <div style={tableHeaderS}>
              <h3 style={tableHeadingS}>Outstanding Invoices ({invoices.length})</h3>
            </div>
            {invoices.length === 0 ? (
              <div style={emptyStateFullS}>
                <p style={emptyStateIconS}>✅</p>
                <p style={emptyStateTextS}>All invoices paid. Great work!</p>
              </div>
            ) : (
              <div style={tableWrapperS}>
                <table style={tableS}>
                  <thead>
                    <tr style={tableHeadRowS}>
                      <th style={tableHeadCellS}>Invoice #</th>
                      <th style={tableHeadCellS}>Client</th>
                      <th style={tableHeadCellS}>Email</th>
                      <th style={tableHeadCellS}>Total</th>
                      <th style={tableHeadCellS}>Due</th>
                      <th style={tableHeadCellS}>Due Date</th>
                      <th style={tableHeadCellS}>Days Late</th>
                      <th style={tableHeadCellS}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv, i) => {
                      const d = ageDays(inv);
                      return (
                        <tr key={i} style={tableBodyRowS}>
                          <td style={{ ...tableBodyCellS, fontWeight: 700, color: '#3b82f6' }}>
                            {inv.invoiceNumber}
                          </td>
                          <td style={tableBodyCellS}>
                            <p style={tableClientNameS}>{inv.client?.name || '—'}</p>
                            <p style={tableClientCompanyS}>{inv.client?.company}</p>
                          </td>
                          <td style={{ ...tableBodyCellS, fontSize: 13, color: '#6b7280' }}>
                            {inv.client?.email || '—'}
                          </td>
                          <td style={{ ...tableBodyCellS, fontWeight: 600 }}>
                            {formatCurrency(inv.totalAmount)}
                          </td>
                          <td style={{ ...tableBodyCellS, fontWeight: 700, color: '#ef4444' }}>
                            {formatCurrency(inv.dueAmount)}
                          </td>
                          <td style={{ ...tableBodyCellS, fontSize: 13, color: '#6b7280' }}>
                            {formatDate(inv.dueDate)}
                          </td>
                          <td
                            style={{
                              ...tableBodyCellS,
                              fontWeight: 700,
                              fontSize: 13,
                              color: d > 60 ? '#ef4444' : d > 30 ? '#f59e0b' : '#6b7280',
                            }}
                          >
                            {d > 0 ? `+${d}d` : 'On time'}
                          </td>
                          <td style={tableBodyCellS}>
                            <StatusBadge status={inv.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────
export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('revenue');

  return (
    <div style={pageWrapperS}>
      {/* Page Header */}
      <div style={pageHeaderS}>
        <div>
          <h1 style={pageTitleS}>Reports</h1>
          <p style={pageSubtitleS}>Revenue, GST and outstanding analysis</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={tabBarS}>
        {TABS.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                ...tabButtonS,
                ...(isActive ? tabButtonActiveS : tabButtonInactiveS),
              }}
            >
              <Icon size={16} style={{ marginRight: 6 }} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'revenue' && <RevenueReport />}
      {activeTab === 'gst' && <GSTReport />}
      {activeTab === 'outstanding' && <OutstandingReport />}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const pageWrapperS = {
  background: '#ffffff',
  minHeight: '100vh',
  padding: 'clamp(16px, 4vw, 24px)',
  paddingBottom: 40,
};

const pageHeaderS = {
  marginBottom: 32,
};

const pageTitleS = {
  fontSize: 'clamp(28px, 5vw, 32px)',
  fontWeight: 800,
  margin: 0,
  color: '#111827',
  letterSpacing: '-0.5px',
};

const pageSubtitleS = {
  fontSize: 14,
  color: '#6b7280',
  margin: '8px 0 0 0',
};

const dateRangeCardS = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: '16px 20px',
  marginBottom: 24,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
};

const dateRangeWrapperS = {
  display: 'flex',
  gap: 12,
  alignItems: 'flex-end',
  flexWrap: 'wrap',
};

const dateInputGroupS = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const dateInputLabelS = {
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  display: 'flex',
  alignItems: 'center',
};

const dateInputS = {
  padding: '8px 12px',
  fontSize: 14,
  color: '#1f2937',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  background: '#ffffff',
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'all 0.2s ease',
  cursor: 'pointer',
};

const applyButtonS = {
  padding: '8px 16px',
  fontSize: 14,
  fontWeight: 600,
  color: '#ffffff',
  background: '#3b82f6',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const quickRangeWrapperS = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
};

const quickRangeButtonS = {
  padding: '6px 14px',
  fontSize: 13,
  fontWeight: 500,
  color: '#6b7280',
  background: '#f3f4f6',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const statCardS = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: 16,
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  transition: 'all 0.2s ease',
};

const statIconWrapperS = (color) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  borderRadius: 8,
  background: `${color}15`,
  color: color,
  flexShrink: 0,
});

const statContentS = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  flex: 1,
};

const statLabelS = {
  fontSize: 12,
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  margin: 0,
};

const statValueS = {
  fontSize: 'clamp(18px, 3vw, 20px)',
  fontWeight: 700,
  margin: 0,
};

const statsGridS = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 12,
  marginBottom: 24,
};

const reportSectionS = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
};

const chartCardS = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: '20px 24px',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
};

const chartTitleS = {
  fontSize: 16,
  fontWeight: 700,
  color: '#1f2937',
  margin: '0 0 16px 0',
};

const tooltipStyleS = {
  borderRadius: 10,
  fontSize: 12,
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const tableCardS = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  overflow: 'hidden',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
};

const tableHeaderS = {
  padding: '16px 20px',
  borderBottom: '1px solid #e5e7eb',
  background: '#fafbfc',
};

const tableHeadingS = {
  fontSize: 16,
  fontWeight: 700,
  color: '#1f2937',
  margin: 0,
};

const tableWrapperS = {
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
};

const tableS = {
  width: '100%',
  borderCollapse: 'collapse',
};

const tableHeadRowS = {
  background: '#fafbfc',
  borderBottom: '1px solid #e5e7eb',
};

const tableHeadCellS = {
  padding: '12px 16px',
  fontSize: 12,
  fontWeight: 700,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  textAlign: 'left',
  whiteSpace: 'nowrap',
};

const tableBodyRowS = {
  borderBottom: '1px solid #e5e7eb',
  transition: 'background 0.15s ease',
};

const tableBodyCellS = {
  padding: '12px 16px',
  fontSize: 14,
  color: '#374151',
  textAlign: 'left',
};

const tableClientNameS = {
  fontWeight: 600,
  color: '#1f2937',
  margin: 0,
};

const tableClientCompanyS = {
  fontSize: 12,
  color: '#9ca3af',
  margin: '2px 0 0 0',
};

const totalRowS = {
  background: '#f9fafb',
  borderTop: '2px solid #e5e7eb',
  fontWeight: 700,
};

const emptyStateS = {
  textAlign: 'center',
  padding: '40px 20px',
  color: '#9ca3af',
  fontSize: 14,
};

const emptyStateFullS = {
  textAlign: 'center',
  padding: '60px 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const emptyStateIconS = {
  fontSize: 48,
  margin: 0,
};

const emptyStateTextS = {
  color: '#9ca3af',
  fontSize: 14,
  margin: '12px 0 0 0',
};

const tabBarS = {
  display: 'flex',
  gap: 8,
  background: '#f3f4f6',
  padding: 8,
  borderRadius: 10,
  marginBottom: 28,
  width: 'fit-content',
  border: '1px solid #e5e7eb',
};

const tabButtonS = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 16px',
  fontSize: 14,
  fontWeight: 600,
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const tabButtonActiveS = {
  background: '#3b82f6',
  color: '#ffffff',
  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
};

const tabButtonInactiveS = {
  background: 'transparent',
  color: '#6b7280',
};

const refreshButtonWrapperS = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginBottom: 16,
};

const refreshButtonS = {
  display: 'flex',
  alignItems: 'center',
  padding: '8px 14px',
  fontSize: 13,
  fontWeight: 600,
  color: '#6b7280',
  background: '#f3f4f6',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};