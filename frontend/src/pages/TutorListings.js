import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Stars = ({ rating }) => (
  <div className="stars">
    {[1,2,3,4,5].map(i => (
      <span key={i} className={`star ${i <= Math.round(rating) ? 'star-filled' : 'star-empty'}`}>★</span>
    ))}
  </div>
);

const TUTOR_NAMES = {
  'tutor-001': 'Fatima Tahir',
  'tutor-002': 'Jordan Mitchell',
  'tutor-003': 'Youmei Xu',
};

const SUBJECT_EMOJIS = { 'Computer Science': '💻', 'Mathematics': '📐', 'Physics': '⚛️' };

export default function TutorListings() {
  const [tutors, setTutors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchTutors = async (q = '') => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/tutors${q ? `?search=${encodeURIComponent(q)}` : ''}`);
      setTutors(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchTutors(); }, []);

  const handleSearch = e => {
    e.preventDefault();
    fetchTutors(search);
  };

  return (
    <div>
      {/* Header */}
      <div className="hero-section" style={{ position: 'relative' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '10px' }}>Find Your Perfect Tutor</h1>
          <p style={{ opacity: 0.85, fontSize: '1rem', marginBottom: '28px' }}>
            Expert tutors ready to help you excel in any subject
          </p>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', maxWidth: '500px', margin: '0 auto' }}>
            <input
              className="input-field" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by subject, name, or keyword..."
              style={{ flex: 1, borderRadius: '50px', padding: '12px 20px', fontSize: '0.9rem' }}
            />
            <button className="btn" type="submit"
              style={{ background: 'white', color: 'var(--primary)', fontWeight: 700, borderRadius: '50px', padding: '12px 24px' }}>
              🔍 Search
            </button>
          </form>
        </div>
      </div>

      <div className="page-container">
        {/* Filter pills */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
          {['All', 'Computer Science', 'Mathematics', 'Physics'].map(s => (
            <button key={s} className="btn btn-secondary btn-sm"
              style={s !== 'All' && search === s ? { background: 'var(--primary)', color: 'white' } : {}}
              onClick={() => { setSearch(s === 'All' ? '' : s); fetchTutors(s === 'All' ? '' : s); }}>
              {SUBJECT_EMOJIS[s] || '📚'} {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-overlay"><div className="spinner" style={{ width:40,height:40 }}/><p>Finding tutors...</p></div>
        ) : tutors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
            <h3>No tutors found</h3>
            <p style={{ marginTop: '6px' }}>Try a different search term</p>
          </div>
        ) : (
          <div className="grid-auto fade-in">
            {tutors.map(t => {
              const displayName = TUTOR_NAMES[t.id] || t.username.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
              return (
                <div key={t.id} className="tutor-card" onClick={() => navigate(`/tutors/${t.id}`)}>
                  <div className="tutor-card-header">
                    <div className="tutor-avatar">{displayName[0]}</div>
                    <div>
                      <div className="tutor-name">{displayName}</div>
                      <div className="tutor-subject">
                        {SUBJECT_EMOJIS[t.subject] || '📚'} {t.subject}
                      </div>
                    </div>
                  </div>
                  <div className="tutor-card-body">
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px',
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {t.bio}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div>
                        <Stars rating={t.rating} />
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {t.rating} ({t.total_reviews} reviews)
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)' }}>
                          ${t.hourly_rate}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>per hour</div>
                      </div>
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                      onClick={e => { e.stopPropagation(); navigate(`/tutors/${t.id}`); }}>
                      View Profile →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
