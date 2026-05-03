import React, { useState, useEffect } from 'react';
import axios from 'axios';

const tabs = ['Overview', 'Users', 'Sessions', 'Flagged Messages'];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [flagged, setFlagged] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, uRes, sessRes, fRes] = await Promise.all([
          axios.get('/api/admin/stats'),
          axios.get('/api/admin/users'),
          axios.get('/api/admin/sessions'),
          axios.get('/api/admin/flagged-messages'),
        ]);
        setStats(sRes.data);
        setUsers(uRes.data);
        setSessions(sessRes.data);
        setFlagged(fRes.data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const deleteUser = async (id) => {
    if (!window.confirm('Remove this user from the platform?')) return;
    try {
      await axios.delete(`/api/admin/users/${id}`);
      setUsers(us => us.filter(u => u.id !== id));
    } catch (e) { alert(e.response?.data?.error || 'Delete failed'); }
  };

  const ROLE_COLORS = { admin: 'badge-red', tutor: 'badge-purple', student: 'badge-blue' };
  const STATUS_COLORS = { pending: 'badge-yellow', confirmed: 'badge-green', completed: 'badge-blue', cancelled: 'badge-red' };

  if (loading) return <div className="loading-overlay"><div className="spinner" style={{ width:40,height:40 }}/><p>Loading admin panel...</p></div>;

  return (
    <div className="page-container fade-in">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0F0A1E, #1E1040)',
        borderRadius: '20px', padding: '28px 32px',
        color: 'white', marginBottom: '28px'
      }}>
        <div style={{ display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px' }}>
          <span style={{ fontSize:'1.5rem' }}>🛡️</span>
          <h1 style={{ fontSize:'1.6rem',fontWeight:800 }}>Admin Control Panel</h1>
        </div>
        <p style={{ color:'rgba(255,255,255,0.6)',fontSize:'0.9rem' }}>
          Full oversight of TutorMarket platform activity
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex',gap:'8px',marginBottom:'24px',borderBottom:'2px solid var(--border)',paddingBottom:'0' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{
              padding:'10px 20px',border:'none',background:'none',cursor:'pointer',
              fontFamily:'Sora,sans-serif',fontWeight:600,fontSize:'0.875rem',
              color: activeTab === t ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === t ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom:'-2px',transition:'all 0.15s'
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'Overview' && (
        <div className="fade-in">
          <div className="grid-3" style={{ marginBottom:'28px' }}>
            {[
              { icon:'🎓',label:'Students',val:stats.students,color:'var(--secondary)' },
              { icon:'📚',label:'Tutors',val:stats.tutors,color:'var(--primary)' },
              { icon:'📅',label:'Total Sessions',val:stats.sessions,color:'var(--success)' },
              { icon:'✅',label:'Active Sessions',val:stats.activeSessions,color:'var(--warning)' },
              { icon:'⚠️',label:'Flagged Messages',val:stats.flaggedMessages,color:'var(--error)' },
              { icon:'💰',label:'Total Revenue',val:`$${(stats.revenue||0).toFixed(0)}`,color:'var(--success)' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div style={{ fontSize:'2rem',marginBottom:'8px' }}>{s.icon}</div>
                <div style={{ fontFamily:'Sora,sans-serif',fontWeight:800,fontSize:'2rem',color:s.color }}>{s.val}</div>
                <div style={{ fontSize:'0.8rem',color:'var(--text-muted)',marginTop:'4px',fontWeight:500 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid-2">
            <div className="card">
              <h3 style={{ fontSize:'1rem',marginBottom:'16px' }}>📊 Platform Health</h3>
              {[
                { label:'User Growth', value: users.length, max: 100, color:'var(--primary)' },
                { label:'Session Completion Rate', value: sessions.filter(s=>s.status==='completed').length, max: Math.max(sessions.length,1), color:'var(--success)' },
                { label:'Payment Success Rate', value: sessions.filter(s=>s.payment_status==='paid').length, max: Math.max(sessions.length,1), color:'var(--secondary)' },
              ].map(m => (
                <div key={m.label} style={{ marginBottom:'16px' }}>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'6px',fontSize:'0.85rem' }}>
                    <span style={{ fontWeight:600 }}>{m.label}</span>
                    <span style={{ color:'var(--text-muted)' }}>{m.value}/{m.max}</span>
                  </div>
                  <div style={{ height:8,background:'var(--border)',borderRadius:4,overflow:'hidden' }}>
                    <div style={{ height:'100%',borderRadius:4,background:m.color,
                      width:`${Math.min(100,(m.value/m.max)*100)}%`,transition:'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="card">
              <h3 style={{ fontSize:'1rem',marginBottom:'16px' }}>⚡ Recent Activity</h3>
              <div style={{ display:'flex',flexDirection:'column',gap:'10px' }}>
                {sessions.slice(0,5).map(s => (
                  <div key={s.id} style={{ display:'flex',alignItems:'center',gap:'10px',
                    padding:'10px',background:'var(--bg)',borderRadius:'var(--radius)' }}>
                    <div style={{ width:8,height:8,borderRadius:'50%',flexShrink:0,
                      background: s.status==='confirmed'?'var(--success)':s.status==='pending'?'var(--warning)':'var(--text-muted)' }} />
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:'0.82rem',fontWeight:600,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis' }}>
                        {s.student_name} → {s.tutor_name}
                      </div>
                      <div style={{ fontSize:'0.72rem',color:'var(--text-muted)' }}>{s.date} {s.time}</div>
                    </div>
                    <span className={`badge ${STATUS_COLORS[s.status]}`} style={{ fontSize:'0.65rem' }}>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users */}
      {activeTab === 'Users' && (
        <div className="fade-in">
          <div style={{ marginBottom:'16px',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
            <p style={{ color:'var(--text-muted)',fontSize:'0.875rem' }}>{users.length} total users</p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display:'flex',alignItems:'center',gap:'10px' }}>
                        <div style={{ width:32,height:32,borderRadius:'50%',background:'var(--grad-main)',
                          color:'white',display:'flex',alignItems:'center',justifyContent:'center',
                          fontSize:'0.8rem',fontWeight:700,flexShrink:0 }}>
                          {u.username[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight:600,fontSize:'0.875rem',fontFamily:'Sora,sans-serif' }}>{u.username}</span>
                      </div>
                    </td>
                    <td style={{ color:'var(--text-muted)',fontSize:'0.85rem' }}>{u.email}</td>
                    <td><span className={`badge ${ROLE_COLORS[u.role]}`} style={{ textTransform:'capitalize' }}>{u.role}</span></td>
                    <td style={{ color:'var(--text-muted)',fontSize:'0.82rem' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      {u.role !== 'admin' && (
                        <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)}>🗑️ Remove</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sessions */}
      {activeTab === 'Sessions' && (
        <div className="fade-in">
          <div style={{ marginBottom:'16px' }}>
            <p style={{ color:'var(--text-muted)',fontSize:'0.875rem' }}>{sessions.length} total sessions</p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Student</th><th>Tutor</th><th>Date</th><th>Time</th><th>Amount</th><th>Status</th><th>Payment</th></tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight:600,fontSize:'0.875rem' }}>{s.student_name}</td>
                    <td style={{ fontWeight:600,fontSize:'0.875rem' }}>{s.tutor_name}</td>
                    <td style={{ color:'var(--text-muted)',fontSize:'0.85rem' }}>{s.date}</td>
                    <td style={{ color:'var(--text-muted)',fontSize:'0.85rem' }}>{s.time}</td>
                    <td style={{ fontWeight:700,color:'var(--primary)',fontSize:'0.875rem' }}>${s.amount?.toFixed(2)}</td>
                    <td><span className={`badge ${STATUS_COLORS[s.status]}`} style={{ textTransform:'capitalize' }}>{s.status}</span></td>
                    <td>
                      <span className={`badge ${s.payment_status==='paid'?'badge-green':s.payment_status==='refunded'?'badge-yellow':'badge-gray'}`}
                        style={{ textTransform:'capitalize' }}>{s.payment_status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Flagged Messages */}
      {activeTab === 'Flagged Messages' && (
        <div className="fade-in">
          {flagged.length === 0 ? (
            <div style={{ textAlign:'center',padding:'60px',color:'var(--text-muted)' }}>
              <div style={{ fontSize:'3rem',marginBottom:'12px' }}>✅</div>
              <h3>No flagged messages</h3>
              <p style={{ marginTop:'6px',fontSize:'0.875rem' }}>The platform is clean!</p>
            </div>
          ) : (
            <div style={{ display:'flex',flexDirection:'column',gap:'12px' }}>
              {flagged.map(m => (
                <div key={m.id} style={{ padding:'16px',background:'#FEF2F2',borderRadius:'var(--radius)',
                  border:'1px solid #FECACA' }}>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'8px' }}>
                    <div style={{ fontSize:'0.85rem',fontWeight:600 }}>
                      <span style={{ color:'var(--error)' }}>{m.sender_name}</span>
                      <span style={{ color:'var(--text-muted)',margin:'0 6px' }}>→</span>
                      <span>{m.receiver_name}</span>
                    </div>
                    <div style={{ fontSize:'0.75rem',color:'var(--text-muted)' }}>{new Date(m.created_at).toLocaleString()}</div>
                  </div>
                  <div style={{ background:'white',padding:'10px 14px',borderRadius:'var(--radius)',
                    fontSize:'0.875rem',border:'1px solid #FECACA',color:'var(--error)' }}>
                    ⚠️ "{m.content}"
                  </div>
                  <div style={{ marginTop:'8px',fontSize:'0.75rem',color:'var(--error)',fontWeight:600 }}>
                    BLOCKED — Contains inappropriate content
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
