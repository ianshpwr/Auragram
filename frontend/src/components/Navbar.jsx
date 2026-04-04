// src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../store/authSlice.js';
import { toggleNotificationPanel, selectUnreadCount } from '../store/uiSlice.js';
import TierBadge from './TierBadge.jsx';

export function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const unreadCount = useSelector(selectUnreadCount);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Feed', id: 'nav-feed' },
    { to: '/leaderboard', label: 'Leaderboard', id: 'nav-leaderboard' },
  ];

  return (
    <nav className="sticky top-0 z-40 border-b border-white/5 backdrop-blur-xl"
      style={{ background: 'rgba(10,10,15,0.85)' }}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0" id="nav-logo">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg font-black"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
            ✦
          </div>
          <span className="font-display font-bold text-lg text-gradient hidden sm:block">
            AuraGram
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map(({ to, label, id }) => (
            <NavLink
              key={to}
              to={to}
              id={id}
              end={to === '/'}
              className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Notification bell */}
              <button
                id="notification-bell"
                onClick={() => dispatch(toggleNotificationPanel())}
                className="relative btn-ghost p-2"
              >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-brand-500 
                    text-white text-[10px] font-bold flex items-center justify-center px-1 animate-pulse-glow">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  id="user-menu-btn"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-all"
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-white/80 hidden sm:block">{user.username}</span>
                  <TierBadge tier={user.tier} size="xs" className="hidden sm:flex" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 card py-2 animate-fade-in z-50">
                    <Link
                      to={`/profile/${user._id}`}
                      id="nav-profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <span>👤</span> Profile
                    </Link>
                    <div className="border-t border-white/5 my-1" />
                    <button
                      id="nav-logout"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400/70 hover:text-red-400 hover:bg-white/5 transition-all"
                    >
                      <span>→</span> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" id="nav-login" className="btn-ghost text-sm">Sign in</Link>
              <Link to="/register" id="nav-register" className="btn-primary text-sm">Join AuraGram</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
