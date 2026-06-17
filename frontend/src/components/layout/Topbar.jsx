// src/components/layout/Topbar.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, User, LogOut, Settings, ChevronDown, Search } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function Topbar({ onMenuClick }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ?.split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'A';

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 flex-shrink-0"
      style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
      }}>

      {/* Left: hamburger + search */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ color: '#64748b' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <Menu size={19} />
        </button>

        {/* Search bar — visible on sm+ */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl w-56 transition-all"
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
          }}>
          <Search size={14} style={{ color: '#94A3B8' }} />
          <span className="text-sm" style={{ color: '#CBD5E1' }}>Search…</span>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5">

        {/* Notification bell */}
        <button
          className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ color: '#64748b' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <Bell size={17} />
          <span
            className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
            style={{ background: '#EF4444', boxShadow: '0 0 0 2px white' }}
          />
        </button>

        {/* Divider */}
        <div className="w-px h-6 mx-1" style={{ background: '#E2E8F0' }} />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl transition-colors"
            style={{ border: '1px solid transparent' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#F8FAFC';
              e.currentTarget.style.borderColor = '#E2E8F0';
            }}
            onMouseLeave={e => {
              if (!dropdownOpen) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }
            }}
          >
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-700"
              // style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
            >
              <span className="text-white text-[11px] font-bold">{initials}</span>
            </div>

            <div className="hidden sm:block text-left">
              <p className="text-[13px] font-semibold leading-none" style={{ color: '#1E293B' }}>
                {user?.name || 'Admin'}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>Administrator</p>
            </div>

            <ChevronDown
              size={13}
              style={{
                color: '#94A3B8',
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div
                className="absolute right-0 top-full mt-2 w-56 rounded-2xl z-20 py-2 overflow-hidden"
                style={{
                  background: '#fff',
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                {/* User info header */}
                <div className="px-4 py-3 mb-1" style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                    >
                      <span className="text-white text-xs font-bold">{initials}</span>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color: '#1E293B' }}>{user?.name}</p>
                      <p className="text-[11px]" style={{ color: '#94A3B8' }}>{user?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                {[
                  { to: '/profile', icon: User, label: 'Profile' },
                  { to: '/settings', icon: Settings, label: 'Settings' },
                ].map(({ to, icon: Icon, label }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors"
                    style={{ color: '#475569' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#1E293B'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}
                  >
                    <Icon size={15} style={{ color: '#94A3B8' }} />
                    {label}
                  </Link>
                ))}

                <div className="mx-3 my-1.5" style={{ height: 1, background: '#F1F5F9' }} />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors"
                  style={{ color: '#EF4444' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FFF5F5'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}