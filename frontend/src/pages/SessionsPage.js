import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = { pending: 'badge-yellow', confirmed: 'badge-green', completed: 'badge-blue', cancelled: 'badge-red' };
const STATUS_ICONS = { pending: '⏳', confirmed: '✅', completed: '🏆', cancelled: '❌' };

function RatingModal({ session, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!rating) { setError('Please select a rating'); return; }
    setLoading(true);
    try {
      await axios.post('/api/ratings', { session_id: session.id, rating, review });
      onSubmit();
      onClose();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to submit rating');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">⭐ Rate Your Session</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p style={{ color:'var(--text-muted)',fontSize:'0.875rem',marginBottom:'20px' }}>
          How was your session with <strong>{session.tutor_name}</strong>?
        </p>
        <div style={{ display:'flex',gap:'8px',justifyContent:'center',marginBottom:'20px' }}>
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
              style={{ fontSize:'2.5rem',background:'none',border:'none',cursor:'pointer',transition:'transform 0.1s',
                transform: (hover || rating) >= n ? 'scale(1.2)' : 'scale(1)',
                filter: (hover || rating) >= n ? 'none' : 'grayscale(1)' }}>
              ⭐
            </button>
          ))}
        </div>
        <div style={{ textAlign:'center',fontFamily:'Sora,sans-serif',fontWeight:700,fontSize:'0.9rem',
          color:'var(--primary)',marginBottom:'20px' }}>
          {rating ? ['','Poor','Fair','Good','Great','Excellent!'][rating] : 'Tap to rate'}
        </div>
        <div className="input-group" style={{ marginBottom:'16px' }}>
          <label className="input-label">Write a review (optional)</label>
          <textarea className="input-field" rows={3} value={review} onChange={e => setReview(e.target.value)}
            placeholder="Share your experience..." style={{ resize:'vertical' }} />
        </div>
        {error && <div className="alert alert-error" style={{ marginBottom:'12px' }}>⚠️ {error}</div>}
        <div style={{ display:'flex',gap:'10px' }}>
          <button className="btn btn-secondary" style={{ flex:1,justifyContent:'center' }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex:1,justifyContent:'center' }} onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="spinner" style={{ width:18,height:18 }}/> : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [ratingSession, setRatingSession] = useState(null);
  const [updating, setUpdating] = useState('');

  const load = async () => {
    try {
      const res = await axios.get('/api/sessions/my');
      setSessions(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await axios.patch(`/api/sessions/${id}/status`, { status });
      setSessions(ss => ss.map(s => s.id === id ? { ...s, status } : s));
    } catch (e) { alert(e.response?.data?.error || 'Update failed'); }
    setUpdating('');
  };

  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.status === filter);

  if (loading) return <div className="loading-overlay"><div className="spinner" style={{ width:40,height:40 }}/><p>Loading sessions...</p></div>;

  return (
    <div className="page-container fade-in">
      {ratingSession && <RatingModal session={ratingSession} onClose={() => setRatingSession(null)} onSubmit={load} />}

      <div className="page-header">
        <h1 className="page-title">📅 My Sessions</h1>
        <p className="page-subtitle">Track and manage all your tutoring sessions</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex',gap:'8px',marginBottom:'24px',flexWrap:'wrap' }}>
        {['all','pending','confirmed','completed','cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            style={{ textTransform:'capitalize' }}>
            {STATUS_ICONS[f] || '📋'} {f} ({f === 'all' ? sessions.length : sessions.filter(s => s.status === f).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign:'center',padding:'60px',color:'var(--text-muted)' }}>
          <div style={{ fontSize:'3rem',marginBottom:'12px' }}>📭</div>
          <h3>No {filter === 'all' ? '' : filter} sessions found</h3>
        </div>
      ) : (
        <div style={{ display:'flex',flexDirection:'column',gap:'16px' }}>
          {filtered.map(s => (
            <div key={s.id} className="session-card">
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px',flexWrap:'wrap' }}>
                  <div style={{ fontFamily:'Sora,sans-serif',fontWeight:700,fontSize:'1rem' }}>
                    {user.role === 'student' ? `📚 ${s.tutor_name || 'Tutor'}` : `🎓 ${s.student_name || 'Student'}`}
                  </div>
                  <span className={`badge ${STATUS_COLORS[s.status]}`} style={{ textTransform:'capitalize' }}>
                    {STATUS_ICONS[s.status]} {s.status}
                  </span>
                  {s.payment_status === 'paid' && <span className="badge badge-green">💳 Paid</span>}
                </div>
                <div style={{ display:'flex',gap:'20px',flexWrap:'wrap',fontSize:'0.85rem',color:'var(--text-muted)' }}>
                  <span>📅 {s.date}</span>
                  <span>🕐 {s.time}</span>
                  <span>⏱ {s.duration} min</span>
                  <span>💰 ${s.amount?.toFixed(2)}</span>
                  {s.subject && <span>📖 {s.subject}</span>}
                </div>
                {s.notes && (
                  <div style={{ marginTop:'8px',fontSize:'0.82rem',color:'var(--text-muted)',
                    padding:'8px 12px',background:'var(--bg)',borderRadius:'var(--radius)',
                    borderLeft:'3px solid var(--primary)' }}>
                    "{s.notes}"
                  </div>
                )}
              </div>

              <div style={{ display:'flex',gap:'8px',flexDirection:'column',minWidth:'160px' }}>
                {/* Student actions */}
                {user.role === 'student' && s.status === 'pending' && s.payment_status === 'unpaid' && (
                  <button className="btn btn-primary btn-sm"
                    onClick={() => window.location.href = `/book/${s.tutor_id}`}>
                    💳 Pay Now
                  </button>
                )}
                {user.role === 'student' && s.status === 'confirmed' && (
                  <button className="btn btn-sm" style={{ background:'#D1FAE5',color:'var(--success)' }}
                    disabled={updating === s.id}
                    onClick={() => updateStatus(s.id, 'completed')}>
                    ✅ Mark Complete
                  </button>
                )}
                {user.role === 'student' && s.status === 'completed' && (
                  <button className="btn btn-secondary btn-sm" onClick={() => setRatingSession(s)}>
                    ⭐ Rate Session
                  </button>
                )}
                {/* Tutor actions */}
                {user.role === 'tutor' && s.status === 'confirmed' && (
                  <button className="btn btn-sm" style={{ background:'#D1FAE5',color:'var(--success)' }}
                    disabled={updating === s.id}
                    onClick={() => updateStatus(s.id, 'completed')}>
                    ✅ Mark Complete
                  </button>
                )}
                {/* Cancel */}
                {['pending','confirmed'].includes(s.status) && (
                  <button className="btn btn-danger btn-sm" disabled={updating === s.id}
                    onClick={() => { if (window.confirm('Cancel this session?')) updateStatus(s.id, 'cancelled'); }}>
                    ❌ Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
