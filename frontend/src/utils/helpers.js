// utils/helpers.js  (note: helpers.js NOT helper.js)
import { format, parseISO, isValid } from 'date-fns';

export const formatCurrency = (amount, currency = 'INR') => {
  const num = parseFloat(amount || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatDate = (date, fmt = 'dd MMM yyyy') => {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);
    return isValid(d) ? format(d, fmt) : '—';
  } catch { return '—'; }
};

export const formatDateTime = (date) => formatDate(date, 'dd MMM yyyy, hh:mm a');

export const truncate = (str, len = 40) =>
  str && str.length > len ? `${str.slice(0, len)}…` : str || '—';

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export const statusBadgeClass = (status) => {
  const map = {
    draft:          'badge-slate',
    sent:           'badge-blue',
    approved:       'badge-green',
    rejected:       'badge-red',
    pending:        'badge-amber',
    converted:      'badge-purple',
    completed:      'badge-green',
    paid:           'badge-green',
    partially_paid: 'badge-amber',
    overdue:        'badge-red',
    active:         'badge-green',
    inactive:       'badge-slate',
  };
  return map[status] || 'badge-slate';
};

export const statusLabel = (status) =>
  (status || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export const calcItemTotals = (items = []) => {
  const subtotal = items.reduce(
    (s, i) => s + parseFloat(i.unitPrice || 0) * parseFloat(i.quantity || 0), 0
  );
  const gstAmount = items.reduce((s, i) => {
    const base = parseFloat(i.unitPrice || 0) * parseFloat(i.quantity || 0);
    return s + base * parseFloat(i.gstRate || 0) / 100;
  }, 0);
  const discount    = items.reduce((s, i) => s + parseFloat(i.discount || 0), 0);
  const totalAmount = subtotal + gstAmount - discount;
  return { subtotal, gstAmount, discount, totalAmount };
};

export const today = () => new Date().toISOString().split('T')[0];