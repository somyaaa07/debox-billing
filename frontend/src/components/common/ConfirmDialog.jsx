// src/components/common/ConfirmDialog.jsx
import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', loading = false, danger = true }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="text-center py-2">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-red-100' : 'bg-amber-100'}`}>
          <AlertTriangle size={26} className={danger ? 'text-red-500' : 'text-amber-500'} />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title || 'Are you sure?'}</h3>
        <p className="text-slate-500 text-sm">{message || 'This action cannot be undone.'}</p>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`btn flex-1 ${danger ? 'btn-danger' : 'btn-primary'}`}
        >
          {loading ? 'Processing...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}
