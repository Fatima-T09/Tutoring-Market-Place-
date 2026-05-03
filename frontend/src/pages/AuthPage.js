import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('All fields are required.'); return; }
    if (mode === 'register' && !form.username) { setError('Username is required.'); return; }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
    if (!emailOk) { setError('Invalid email format.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0F0A1E 0%, #1E1040 50%, #0A1628 100%)',
      padding: '24px', position: 'relative', overflow: 'hidden'
    }}>
      {/* Background orbs */}
      {[
        { top: '10%', left: '15%', size: 300, color: 'rgba(108,61,244,0.15)' },
        { top: '60%', right: '10%', size: 250, color: 'rgba(59,130,246,0.12)' },
        { bottom: '10%', left: '40%', size: 200, color: 'rgba(236,72,153,0.08)' },
      ].map((orb, i) => (
        <div key={i} style={{
          position: 'absolute', width: orb.size, height: orb.size,
          borderRadius: '50%', background: orb.color,
          filter: 'blur(60px)',
          top: orb.top, left: orb.left, right: orb.right, bottom: orb.bottom,
          pointerEvents: 'none'
        }} />
      ))}

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '440px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64, borderRadius: '20px',
            background: 'linear-gradient(135deg, #6C3DF4, #3B82F6)',
            fontSize: '1.8rem', marginBottom: '16px', boxShadow: '0 8px 32px rgba(108,61,244,0.5)'
          }}>✦</div>
          <h1 style={{ color: 'white', fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '1.8rem' }}>TutorMarket</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '6px', fontSize: '0.9rem' }}>
            Connect, Learn, Grow
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '36px'
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: '12px',
            padding: '4px', marginBottom: '28px'
          }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1, padding: '10px', border: 'none', borderRadius: '10px', cursor: 'pointer',
                  fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: '0.875rem',
                  transition: 'all 0.2s',
                  background: mode === m ? 'linear-gradient(135deg,#6C3DF4,#3B82F6)' : 'transparent',
                  color: mode === m ? 'white' : 'rgba(255,255,255,0.5)',
                  boxShadow: mode === m ? '0 4px 12px rgba(108,61,244,0.35)' : 'none'
                }}>
                {m === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px', background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)', color: '#FCA5A5' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mode === 'register' && (
              <div className="input-group">
                <label className="input-label" style={{ color: 'rgba(255,255,255,0.7)' }}>Username</label>
                <input className="input-field" name="username" value={form.username}
                  onChange={handleChange} placeholder="Choose a username"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }} />
              </div>
            )}
            <div className="input-group">
              <label className="input-label" style={{ color: 'rgba(255,255,255,0.7)' }}>Email</label>
              <input className="input-field" name="email" type="email" value={form.email}
                onChange={handleChange} placeholder="your@email.com"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }} />
            </div>
            <div className="input-group">
              <label className="input-label" style={{ color: 'rgba(255,255,255,0.7)' }}>Password</label>
              <input className="input-field" name="password" type="password" value={form.password}
                onChange={handleChange} placeholder="Min. 6 characters"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }} />
            </div>
            {mode === 'register' && (
              <div className="input-group">
                <label className="input-label" style={{ color: 'rgba(255,255,255,0.7)' }}>I am a...</label>
                <select className="input-field" name="role" value={form.role} onChange={handleChange}
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}>
                  <option value="student" style={{ background: '#1E1040' }}>🎓 Student</option>
                  <option value="tutor" style={{ background: '#1E1040' }}>📚 Tutor</option>
                </select>
              </div>
            )}

            <button className="btn btn-primary btn-lg" type="submit" disabled={loading}
              style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }}>
              {loading ? <><span className="spinner" style={{ width:18,height:18,borderColor:'rgba(255,255,255,0.3)',borderTopColor:'white' }} /> Processing...</> :
                mode === 'login' ? '→ Log In' : '✓ Create Account'}
            </button>
          </form>

          <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', fontWeight: 600, marginBottom: '8px', fontFamily: 'Sora,sans-serif' }}>DEMO ACCOUNTS</p>
            {[
              { label: 'Admin', email: 'admin@tutormarket.com', pass: 'admin123' },
              { label: 'Student', email: 'student@tutormarket.com', pass: 'student123' },
              { label: 'Tutor', email: 'fatima@tutormarket.com', pass: 'tutor123' },
            ].map(d => (
              <button key={d.label} onClick={() => { setForm(f => ({ ...f, email: d.email, password: d.pass })); setMode('login'); }}
                style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', padding: '6px 12px', marginRight: '8px', marginTop: '4px',
                  color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', cursor: 'pointer',
                  fontFamily: 'Sora,sans-serif', fontWeight: 600
                }}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
