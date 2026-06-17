// components/common/StatusBadge.jsx
import React from 'react';
import { statusBadgeClass, statusLabel } from '../../utils/helpers';

// ✅ FIX: component was named 'statusBadgeClass' — renamed to 'StatusBadge'
export default function StatusBadge({ status }) {
  return (
    <span className={statusBadgeClass(status)}>
      {statusLabel(status)}
    </span>
  );
}