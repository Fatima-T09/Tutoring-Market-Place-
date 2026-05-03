import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname.startsWith(path) ? 'active' : '';

  const links = user?.role === 'admin'
    ? [{ path: '/dashboard', label: '📊 Dashboard' }, { path: '/admin', label: '🛡️ Admin' }]
    : user?.role === 'tutor'
    ? [
        { path: '/dashboard', label: '🏠 Home' },
        { path: '/sessions', label: '📅 Sessions' },
        { path: '/chat', label: '💬 Messages' },
      ]
    : [
        { path: '/dashboard', label: '🏠 Home' },
        { path: '/tutors', label: '🔍 Find Tutors' },
        { path: '/sessions', label: '📅 Sessions' },
        { path: '/chat', label: '💬 Messages' },
      ];

  return (
    <nav className="navbar">
      <a className="nav-brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
        ✦ TutorMarket
      </a>

      <div className="nav-links" style={{ display: 'flex' }}>
        {links.map(l => (
          <button key={l.path} className={`nav-link ${isActive(l.path)}`} onClick={() => navigate(l.path)}>
            {l.label}
          </button>
        ))}
      </div>

      <div className="nav-user">
        <div style={{ position: 'relative' }}>
          <div
            className="nav-avatar"
            style={{ cursor: 'pointer' }}
            onClick={() => setMenuOpen(!menuOpen)}
            title={user?.username}
          >
            {user?.username?.[0]?.toUpperCase()}
          </div>
          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '46px',
              background: 'white', borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)',
              padding: '8px', minWidth: '180px', zIndex: 200
            }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
                <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '0.9rem' }}>{user?.username}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                <span className={`badge badge-purple`} style={{ marginTop: 4, textTransform: 'capitalize' }}>{user?.role}</span>
              </div>
              <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 'var(--radius)' }}
                onClick={() => { logout(); navigate('/auth'); setMenuOpen(false); }}>
                🚪 Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
