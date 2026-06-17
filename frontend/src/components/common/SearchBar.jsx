// components/common/SearchBar.jsx
import React from 'react';

// ✅ FIX: moved to its own dedicated file
export default function SearchBar({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        width="15" height="15" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`input pl-9 py-2 ${className}`}
      />
    </div>
  );
}

// Named export as well so both import styles work:
// import SearchBar from '../../components/common/SearchBar'
// import { SearchBar } from '../../components/common/SearchBar'
export { SearchBar };