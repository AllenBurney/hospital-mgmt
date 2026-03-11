import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      background: 'rgba(10, 22, 40, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(0, 196, 180, 0.12)',
      position: 'sticky', top: 0, zIndex: 100,
      padding: '0 32px',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 36, height: 36, background: 'var(--teal)', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, color: 'var(--navy)',
          }}>+</div>
          <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: 'var(--white)' }}>
            MediGraph
          </span>
        </Link>

        {/* Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[
            { to: '/hospitals', label: 'Hospitals' },
            { to: '/find-hospital', label: '🔍 Find Nearby' },
            { to: '/graph', label: '⬡ Network Graph' },
            ...(user ? [{ to: '/appointments', label: 'My Appointments' }] : []),
            ...(user?.role === 'hospital_admin' ? [{ to: '/admin', label: 'Admin Panel' }] : []),
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 14,
                color: isActive(to) ? 'var(--teal)' : 'var(--slate)',
                background: isActive(to) ? 'var(--teal-glow)' : 'transparent',
                transition: 'all 0.2s',
                textDecoration: 'none',
                fontWeight: isActive(to) ? 600 : 400,
              }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 12px', background: 'var(--teal-glow)',
                borderRadius: 8, border: '1px solid var(--border)',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--teal)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--navy)',
                }}>
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <span style={{ fontSize: 13, color: 'var(--white)' }}>{user.name?.split(' ')[0]}</span>
                <span style={{
                  fontSize: 11, padding: '2px 7px', borderRadius: 10,
                  background: 'rgba(0,196,180,0.2)', color: 'var(--teal)',
                }}>
                  {user.role === 'hospital_admin' ? 'Admin' : user.role === 'super_admin' ? 'Super' : 'Patient'}
                </span>
              </div>
              <button className="btn btn-outline" style={{ padding: '7px 16px', fontSize: 13 }} onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline" style={{ padding: '7px 16px', fontSize: 13 }}>Login</Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '7px 16px', fontSize: 13 }}>Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
