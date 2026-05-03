import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Stars = ({ rating, size = 16 }) => (
  <div className="stars">
    {[1,2,3,4,5].map(i => (
      <span key={i} style={{ fontSize: size, color: i <= Math.round(rating) ? '#F59E0B' : '#E5E7EB' }}>★</span>
    ))}
  </div>
);

const TUTOR_NAMES = {
  'tutor-001': 'Fatima Tahir',
  'tutor-002': 'Jordan Mitchell',
  'tutor-003': 'Youmei Xu',
};

const SUBJECT_EMOJIS = { 'Computer Science': '💻', 'Mathematics': '📐', 'Physics': '⚛️' };

export default function TutorProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/tutors/${id}`)
      .then(r => setTutor(r.data))
      .catch(() => navigate('/tutors'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-overlay"><div className="spinner" style={{ width:40,height:40 }}/><p>Loading profile...</p></div>;
  if (!tutor) return null;

  const displayName = TUTOR_NAMES[tutor.id] || tutor.username?.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  const availability = typeof tutor.availability === 'string' ? JSON.parse(tutor.availability) : tutor.availability || {};
  const dayOrder = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

  return (
    <div className="page-container fade-in">
      {/* Back */}
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tutors')} style={{ marginBottom: '20px' }}>
        ← Back to Tutors
      </button>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Left: Profile */}
        <div>
          {/* Profile card */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ background: 'var(--grad-main)', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{
                width: 88, height: 88, borderRadius: '50%',
                background: 'rgba(255,255,255,0.25)', border: '3px solid rgba(255,255,255,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '2rem', color: 'white',
                marginBottom: '16px'
              }}>{displayName[0]}</div>
              <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 800 }}>{displayName}</h1>
              <div style={{ color: 'rgba(255,255,255,0.8)', marginTop: '4px', fontSize: '0.9rem' }}>
                {SUBJECT_EMOJIS[tutor.subject] || '📚'} {tutor.subject} Tutor
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                <Stars rating={tutor.rating} size={18} />
                <span style={{ color: 'white', fontWeight: 700 }}>{tutor.rating}</span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>({tutor.total_reviews} reviews)</span>
              </div>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '1.4rem', color: 'var(--primary)' }}>
                    ${tutor.hourly_rate}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>per hour</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '1.4rem', color: 'var(--success)' }}>
                    {tutor.total_reviews}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>reviews</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '1.4rem', color: 'var(--secondary)' }}>
                    {Object.values(availability).flat().length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>slots/week</div>
                </div>
              </div>

              <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}>About</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.7 }}>{tutor.bio}</p>

              {user?.role === 'student' && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => navigate(`/book/${tutor.id}`)}>
                    📅 Book a Session
                  </button>
                  <button className="btn btn-secondary" onClick={() => navigate(`/chat/${tutor.id}`)}>
                    💬 Message
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Availability */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>📅 Weekly Availability</h3>
            {dayOrder.map(day => {
              const slots = availability[day] || [];
              if (slots.length === 0) return null;
              return (
                <div key={day} style={{ marginBottom: '12px' }}>
                  <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: '0.8rem',
                    color: 'var(--primary)', textTransform: 'capitalize', marginBottom: '6px' }}>
                    {day}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {slots.map(s => (
                      <span key={s} style={{
                        padding: '3px 10px', background: 'var(--grad-soft)', borderRadius: '50px',
                        fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600
                      }}>{s}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Reviews */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '20px' }}>⭐ Student Reviews</h3>
          {(!tutor.reviews || tutor.reviews.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📝</div>
              <p>No reviews yet. Be the first!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {tutor.reviews.map((r, i) => (
                <div key={i} style={{
                  padding: '16px', background: 'var(--bg)',
                  borderRadius: 'var(--radius)', border: '1px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', background: 'var(--grad-main)',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '0.875rem'
                      }}>{r.student_name?.[0]?.toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', fontFamily: 'Sora,sans-serif' }}>{r.student_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {new Date(r.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Stars rating={r.rating} size={14} />
                  </div>
                  {r.review && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{r.review}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
