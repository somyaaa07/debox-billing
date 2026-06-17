// src/components/layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, ShoppingCart, ClipboardList,
  Receipt, CreditCard, BarChart3, Settings, Package, X, Zap,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Clients', icon: Users, path: '/clients' },
  { type: 'divider', label: 'WORKFLOW' },
  { label: 'Quotations', icon: FileText, path: '/quotations' },
  { label: 'Purchase Orders', icon: ShoppingCart, path: '/purchase-orders' },
  { label: 'Proforma Invoices', icon: ClipboardList, path: '/proforma-invoices' },
  { label: 'Final Invoices', icon: Receipt, path: '/final-invoices' },
  { label: 'Payments', icon: CreditCard, path: '/payments' },
  { type: 'divider', label: 'INSIGHTS' },
  { label: 'Reports', icon: BarChart3, path: '/reports' },
  { type: 'divider', label: 'SYSTEM' },
  { label: 'Products', icon: Package, path: '/settings/products' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

const hideScrollbarStyle = {
  scrollbarWidth: 'none',       // Firefox
  msOverflowStyle: 'none',      // IE/Edge
};

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ background: 'linear-gradient(180deg, #0F0F23 0%, #141428 100%)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700"
              // style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              ><Zap size={15} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-[15px] leading-none tracking-tight">BillFlow</p>
              <p className="text-[10px] mt-0.5 font-medium tracking-widest uppercase"
                style={{ color: '#6366F1' }}>Pro</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: '#64748b' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 overflow-y-auto py-3 px-3"
          style={hideScrollbarStyle}
        >
          {/* Hide WebKit scrollbar (Chrome/Safari) */}
          <style>{`
            nav::-webkit-scrollbar { display: none; }
          `}</style>

          {navItems.map((item, idx) => {
            if (item.type === 'divider') {
              return (
                <div key={idx} className="flex items-center gap-2 px-2 pt-5 pb-2">
                  <span
                    className="text-[9px] font-bold tracking-[0.15em] uppercase"
                    style={{ color: 'rgba(255,255,255,0.2)' }}
                  >
                    {item.label}
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                </div>
              );
            }

            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-[13px] font-medium transition-all group overflow-hidden"
                style={({ isActive }) => ({
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                  background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                })}
                onMouseEnter={e => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  }
                }}
                onMouseLeave={e => {
                  // Let NavLink's style prop re-apply
                }}
              >
                {({ isActive }) => (
                  <>
                    {/* Active left rail */}
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                        style={{ background: '#6366F1' }}
                      />
                    )}
                    <Icon
                      size={16}
                      style={{ color: isActive ? '#818CF8' : 'rgba(255,255,255,0.3)' }}
                    />
                    <span className="flex-1">{item.label}</span>
                    {isActive && (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                        style={{ background: 'rgba(99,102,241,0.3)', color: '#A5B4FC' }}
                      >
                        ●
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Workflow hint */}
        <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div
            className="rounded-xl px-3 py-3"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
          >
            <p className="text-[9px] font-bold tracking-widest uppercase mb-1.5"
              style={{ color: 'rgba(99,102,241,0.7)' }}>Workflow</p>
            <div className="flex items-center gap-1 flex-wrap">
              {['Quote', 'PO', 'PI', 'Invoice', 'Payment'].map((step, i, arr) => (
                <React.Fragment key={step}>
                  <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {step}
                  </span>
                  {i < arr.length - 1 && (
                    <span style={{ color: 'rgba(99,102,241,0.5)', fontSize: 9 }}>›</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}