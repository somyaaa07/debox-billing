// src/components/common/Loader.jsx
import React from 'react';
export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    </div>
  );
}
export function ButtonLoader({ size = 16 }) {
  return <div style={{ width: size, height: size }} className="border-2 border-white/40 border-t-white rounded-full animate-spin flex-shrink-0" />;
}
export default PageLoader;
