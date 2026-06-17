// pages/quotations/QuotationsPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Eye, Edit2, Trash2, Download, Mail,
  CheckCircle, FileText, XCircle, Clock, TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ✅ FIX 1: helpers (plural) not helper
import { formatCurrency, formatDate, downloadBlob } from '../../utils/helpers';

// ✅ FIX 2: import from wherever your project's api.js actually is
import { quotationService } from '../../services/api';

import StatusBadge   from '../../components/common/StatusBadge';
import { SearchBar } from '../../components/common/SearchBar';
import Pagination    from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PageLoader    from '../../components/common/Loader';
import EmptyState    from '../../components/common/EmptyState';

// ✅ FIX 3: import the fixed hook
import useDocumentList from '../../hooks/useDocumentList';

const STATUS_OPTIONS = ['', 'draft', 'sent', 'approved', 'rejected'];

export default function QuotationsPage() {
  const {
    data: quotations,
    pagination,
    loading,
    search,
    setSearch,
    page,
    setPage,
    filters,
    setFilters,
    refresh,
  } = useDocumentList(quotationService);

  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleting,      setDeleting]      = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // ── Handlers ─────────────────────────────────────────────────────

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await quotationService.delete(deleteTarget.id);
      toast.success('Quotation deleted');
      setDeleteTarget(null);
      refresh();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadPdf = async (id, number) => {
    setActionLoading(`pdf-${id}`);
    try {
      const { data } = await quotationService.downloadPdf(id);
      downloadBlob(data, `quotation-${number}.pdf`);
      toast.success('PDF downloaded');
    } catch (e) {
      toast.error(e.response?.data?.message || 'PDF download failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEmail = async (id) => {
    setActionLoading(`email-${id}`);
    try {
      const { data } = await quotationService.email(id);
      toast.success(data.message || 'Quotation emailed successfully');
      refresh();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Email failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (id) => {
    try {
      await quotationService.updateStatus(id, 'approved');
      toast.success('Quotation approved');
      refresh();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed');
    }
  };

  const handleReject = async (id) => {
    try {
      await quotationService.updateStatus(id, 'rejected');
      toast.success('Quotation rejected');
      refresh();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed');
    }
  };

  // ── Derived stats ─────────────────────────────────────────────────
  const totalValue    = quotations.reduce((s, q) => s + parseFloat(q.totalAmount || 0), 0);
  const approvedCount = quotations.filter(q => q.status === 'approved').length;
  const pendingCount  = quotations.filter(q => q.status === 'draft' || q.status === 'sent').length;
  const rejectedCount = quotations.filter(q => q.status === 'rejected').length;

  return (
    <div className="space-y-6" style={{ background: '#ffffff', minHeight: '100vh', padding: '1.5rem' }}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#111111' }}>
            Quotations
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#9aa0ab' }}>Create and manage sales quotations</p>
        </div>
        <Link
          to="/quotations/new"
          className="flex items-center gap-2"
          style={{
            background: '#4795fe', color: '#ffffff', border: 'none',
            borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500,
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          <Plus size={16} /> New Quotation
        </Link>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Value',  value: formatCurrency(totalValue),  valueColor: '#111111', icon: TrendingUp,  iconColor: '#4795fe',  iconBg: '#e8f1ff'  },
          { label: 'Approved',     value: approvedCount,               valueColor: '#1a7a42', icon: CheckCircle, iconColor: '#1a7a42',  iconBg: '#e6f7ee'  },
          { label: 'Pending',      value: pendingCount,                valueColor: '#b06b00', icon: Clock,       iconColor: '#b06b00',  iconBg: '#fff7e6'  },
          { label: 'Rejected',     value: rejectedCount,               valueColor: '#b02020', icon: XCircle,     iconColor: '#b02020',  iconBg: '#fdecea'  },
        ].map(({ label, value, valueColor, icon: Icon, iconColor, iconBg }) => (
          <div
            key={label}
            className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: '#ffffff', border: '1px solid #e8eaed' }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: iconBg }}
            >
              <Icon size={18} color={iconColor} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#9aa0ab' }}>{label}</p>
              <p className="text-xl font-bold mt-0.5" style={{ color: valueColor }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table Card ── */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e8eaed' }}>

        {/* Filters */}
        <div className="px-5 py-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center" style={{ borderBottom: '1px solid #e8eaed' }}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by number or client…"
            className="flex-1 max-w-sm"
          />
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={filters.status || ''}
              onChange={e => setFilters({ ...filters, status: e.target.value || undefined })}
              className="py-2 text-sm w-40"
              style={{
                background: '#f5f6f8', border: '1px solid #e8eaed',
                borderRadius: 8, padding: '6px 10px', fontSize: 13,
                color: '#111111', outline: 'none', cursor: 'pointer',
              }}
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>
                  {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Statuses'}
                </option>
              ))}
            </select>
            {(search || filters.status) && (
              <button
                onClick={() => { setSearch(''); setFilters({}); }}
                className="text-xs underline whitespace-nowrap"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9aa0ab' }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <PageLoader />
        ) : quotations.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No quotations found"
            description={
              search || filters.status
                ? 'Try adjusting your filters.'
                : 'Create your first quotation to get started.'
            }
            action={
              !search && !filters.status && (
                <Link
                  to="/quotations/new"
                  style={{
                    background: '#4795fe', color: '#ffffff', border: 'none',
                    borderRadius: 8, padding: '8px 14px', fontSize: 13,
                    fontWeight: 500, textDecoration: 'none',
                  }}
                >
                  Create Quotation
                </Link>
              )
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#f5f6f8', borderBottom: '1px solid #e8eaed' }}>
                    {['Number', 'Client', 'Date', 'Valid Until', 'Amount', 'Status', 'Actions'].map(h => (
                      <th
                        key={h}
                        className={`px-5 py-3 ${h === 'Amount' || h === 'Actions' ? 'text-right' : 'text-left'}`}
                        style={{ fontSize: 11, fontWeight: 500, color: '#9aa0ab', letterSpacing: '0.05em', textTransform: 'uppercase' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quotations.map(q => (
                    <tr
                      key={q.id}
                      className="transition-colors group"
                      style={{ borderBottom: '1px solid #f5f6f8' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fbff'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          to={`/quotations/${q.id}`}
                          className="font-semibold hover:underline"
                          style={{ color: '#4795fe' }}
                        >
                          {q.quotationNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium leading-tight" style={{ color: '#111111' }}>
                          {q.client?.name || '—'}
                        </p>
                        {q.client?.company && (
                          <p className="text-xs mt-0.5" style={{ color: '#9aa0ab' }}>{q.client.company}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: '#9aa0ab' }}>
                        {formatDate(q.quotationDate)}
                      </td>
                      <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: '#9aa0ab' }}>
                        {formatDate(q.validUntil)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold whitespace-nowrap" style={{ color: '#111111' }}>
                        {formatCurrency(q.totalAmount)}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={q.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">

                          {/* View */}
                          <Link
                            to={`/quotations/${q.id}`}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: '#9aa0ab' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#4795fe'; e.currentTarget.style.background = '#e8f1ff'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#9aa0ab'; e.currentTarget.style.background = ''; }}
                            title="View"
                          >
                            <Eye size={14} />
                          </Link>

                          {/* Edit */}
                          <Link
                            to={`/quotations/${q.id}/edit`}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: '#9aa0ab' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#b06b00'; e.currentTarget.style.background = '#fff7e6'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#9aa0ab'; e.currentTarget.style.background = ''; }}
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </Link>

                          {/* Download PDF */}
                          <button
                            onClick={() => handleDownloadPdf(q.id, q.quotationNumber)}
                            disabled={actionLoading === `pdf-${q.id}`}
                            className="p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9aa0ab' }}
                            onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.color = '#534AB7'; e.currentTarget.style.background = '#EEEDFE'; }}}
                            onMouseLeave={e => { e.currentTarget.style.color = '#9aa0ab'; e.currentTarget.style.background = ''; }}
                            title="Download PDF"
                          >
                            {actionLoading === `pdf-${q.id}`
                              ? <span className="w-3.5 h-3.5 border border-current/30 border-t-current rounded-full animate-spin block"/>
                              : <Download size={14} />
                            }
                          </button>

                          {/* Email */}
                          <button
                            onClick={() => handleEmail(q.id)}
                            disabled={actionLoading === `email-${q.id}`}
                            className="p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9aa0ab' }}
                            onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.color = '#0F6E56'; e.currentTarget.style.background = '#E1F5EE'; }}}
                            onMouseLeave={e => { e.currentTarget.style.color = '#9aa0ab'; e.currentTarget.style.background = ''; }}
                            title="Email to client"
                          >
                            {actionLoading === `email-${q.id}`
                              ? <span className="w-3.5 h-3.5 border border-current/30 border-t-current rounded-full animate-spin block"/>
                              : <Mail size={14} />
                            }
                          </button>

                          {/* Approve / Reject — only for draft/sent */}
                          {(q.status === 'draft' || q.status === 'sent') && (
                            <>
                              <button
                                onClick={() => handleApprove(q.id)}
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9aa0ab' }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#1a7a42'; e.currentTarget.style.background = '#e6f7ee'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = '#9aa0ab'; e.currentTarget.style.background = ''; }}
                                title="Approve"
                              >
                                <CheckCircle size={14} />
                              </button>
                              <button
                                onClick={() => handleReject(q.id)}
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9aa0ab' }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#b02020'; e.currentTarget.style.background = '#fdecea'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = '#9aa0ab'; e.currentTarget.style.background = ''; }}
                                title="Reject"
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteTarget(q)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9aa0ab' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#b02020'; e.currentTarget.style.background = '#fdecea'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#9aa0ab'; e.currentTarget.style.background = ''; }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ✅ FIX 4: use pagination.totalItems not pagination.total */}
            <div className="px-5 py-3 flex items-center justify-between gap-4" style={{ borderTop: '1px solid #e8eaed' }}>
              <p className="text-xs" style={{ color: '#9aa0ab' }}>
                Showing{' '}
                <span className="font-medium" style={{ color: '#111111' }}>
                  {quotations.length}
                </span>{' '}
                of{' '}
                <span className="font-medium" style={{ color: '#111111' }}>
                  {pagination?.totalItems ?? quotations.length}
                </span>{' '}
                quotations
              </p>
              <Pagination pagination={pagination} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Quotation"
        message={`Delete quotation "${deleteTarget?.quotationNumber}"? This cannot be undone.`}
        loading={deleting}
      />
    </div>
  );
}