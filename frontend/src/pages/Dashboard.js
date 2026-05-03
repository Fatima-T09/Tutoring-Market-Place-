import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ icon, label, value, color = 'var(--primary)', onClick }) => (
  <div className="stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', transition: 'all 0.2s' }}
    onMouseEnter={e => onClick && (e.currentTarget.style.transform = 'translateY(-3px)')}
    onMouseLeave={e => onClick && (e.currentTarget.style.transform = 'translateY(0)')}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-value" style={{ color }}>{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

const statusColors = { pending: 'badge-yellow', confirmed: 'badge-green', completed: 'badge-blue', cancelled: 'badge-red' };

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessRes] = await Promise.all([axios.get('/api/sessions/my')]);
        setSessions(sessRes.data);
        if (user.role === 'student') {
          const tRes = await axios.get('/api/tutors');
          setTutors(tRes.data.slice(0, 3));
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchData();
  }, [user.role]);

  const upcoming = sessions.filter(s => s.status === 'confirmed' && new Date(s.date) >= new Date());
  const pending = sessions.filter(s => s.status === 'pending');
  const completed = sessions.filter(s => s.status === 'completed');

  if (loading) return (
    <div className="loading-overlay"><div className="spinner" style={{ width: 40, height: 40 }} /><p>Loading dashboard...</p></div>
  );

  return (
    <div className="page-container fade-in">
      {/* Hero greeting */}
      <div style={{
        background: 'var(--grad-main)', borderRadius: '20px', padding: '32px',
        color: 'white', marginBottom: '32px', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', right: -20, top: -20, width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(255,255,255,0.08)'
        }} />
        <div style={{
          position: 'absolute', right: 60, bottom: -40, width: 140, height: 140,
          borderRadius: '50%', background: 'rgba(255,255,255,0.05)'
        }} />
        <div style={{ position: 'relative' }}>
          <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', marginBottom: '12px' }}>
            {user.role === 'admin' ? '🛡️ Admin' : user.role === 'tutor' ? '📚 Tutor' : '🎓 Student'}
          </span>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '6px' }}>
            Welcome back, {user.username}! 👋
          </h1>
          <p style={{ opacity: 0.85, fontSize: '1rem' }}>
            {user.role === 'student' ? "Ready to learn something new today?" :
             user.role === 'tutor' ? "Your students are waiting for you." :
             "Here's an overview of your platform."}
          </p>
          {user.role === 'student' && (
            <button className="btn" onClick={() => navigate('/tutors')}
              style={{ marginTop: '20px', background: 'white', color: 'var(--primary)', fontWeight: 700 }}>
              🔍 Find a Tutor →
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: '32px' }}>
        <StatCard icon="📅" label="Upcoming Sessions" value={upcoming.length} color="var(--success)"
          onClick={() => navigate('/sessions')} />
        <StatCard icon="⏳" label="Pending Requests" value={pending.length} color="var(--warning)"
          onClick={() => navigate('/sessions')} />
        <StatCard icon="✅" label="Completed Sessions" value={completed.length} color="var(--secondary)"
          onClick={() => navigate('/sessions')} />
      </div>

      <div className="grid-2">
        {/* Recent Sessions */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.1rem' }}>Recent Sessions</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/sessions')}>View All</button>
          </div>
          {sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📭</div>
              <p>No sessions yet</p>
              {user.role === 'student' && (
                <button className="btn btn-primary btn-sm" style={{ marginTop: '12px' }} onClick={() => navigate('/tutors')}>
                  Book Your First Session
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sessions.slice(0, 4).map(s => (
                <div key={s.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', background: 'var(--bg)', borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', fontFamily: 'Sora,sans-serif' }}>
                      {s.tutor_name || s.student_name || s.subject}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      📅 {s.date} at {s.time}
                    </div>
                  </div>
                  <span className={`badge ${statusColors[s.status] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions / Featured tutors */}
        <div className="card">
          {user.role === 'student' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.1rem' }}>Featured Tutors</h2>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/tutors')}>See All</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tutors.map(t => (
                  <div key={t.id} onClick={() => navigate(`/tutors/${t.id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '12px', background: 'var(--bg)', borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: 'var(--grad-main)', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '1rem', flexShrink: 0
                    }}>{t.username[0].toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontFamily: 'Sora,sans-serif', fontSize: '0.9rem' }}>{t.username.replace('_', ' ')}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.subject}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--warning)', fontSize: '0.85rem' }}>⭐ {t.rating}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>${t.hourly_rate}/hr</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>Quick Actions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { icon: '📅', label: 'View My Schedule', path: '/sessions' },
                  { icon: '💬', label: 'Open Messages', path: '/chat' },
                  ...(user.role === 'admin' ? [{ icon: '🛡️', label: 'Admin Panel', path: '/admin' }] : []),
                ].map(a => (
                  <button key={a.path} className="btn btn-secondary" onClick={() => navigate(a.path)}
                    style={{ justifyContent: 'flex-start', borderRadius: 'var(--radius)' }}>
                    <span style={{ fontSize: '1.1rem' }}>{a.icon}</span> {a.label}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: '24px', padding: '16px', background: 'var(--grad-soft)', borderRadius: 'var(--radius-lg)' }}>
                <p style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '4px' }}>
                  💡 Pro Tip
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Keep your profile updated with your latest skills and availability to attract more students.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
