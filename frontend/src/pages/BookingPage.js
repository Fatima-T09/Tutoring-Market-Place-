import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const TUTOR_NAMES = {
  'tutor-001': 'Fatima Tahir',
  'tutor-002': 'Jordan Mitchell',
  'tutor-003': 'Youmei Xu',
};

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function BookingPage() {
  const { tutorId } = useParams();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [calMonth, setCalMonth] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState(60);
  const [step, setStep] = useState(1); // 1=select, 2=confirm, 3=pay, 4=done
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [amount, setAmount] = useState(0);
  const [payLoading, setPayLoading] = useState(false);

  useEffect(() => {
    axios.get(`/api/tutors/${tutorId}`)
      .then(r => setTutor(r.data))
      .catch(() => navigate('/tutors'));
  }, [tutorId]);

  useEffect(() => {
    if (!selectedDate) return;
    const dateStr = formatDate(selectedDate);
    axios.get(`/api/tutors/${tutorId}/availability?date=${dateStr}`)
      .then(r => { setAvailableSlots(r.data.slots); setBookedSlots(r.data.bookedSlots); })
      .catch(() => {});
    setSelectedTime('');
  }, [selectedDate]);

  const formatDate = (d) => {
    const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  };

  const buildCalendar = () => {
    const year = calMonth.getFullYear(), month = calMonth.getMonth();
    const first = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const days = [];
    for (let i = 0; i < first; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
    return days;
  };

  const isDisabled = (d) => {
    if (!d) return true;
    const today = new Date(); today.setHours(0,0,0,0);
    return d < today;
  };

  const handleBook = async () => {
    if (!selectedDate || !selectedTime) { setError('Please select a date and time.'); return; }
    setLoading(true); setError('');
    try {
      const res = await axios.post('/api/sessions/book', {
        tutor_id: tutorId,
        subject: tutor.subject,
        date: formatDate(selectedDate),
        time: selectedTime,
        duration,
        notes
      });
      setSessionId(res.data.sessionId);
      setAmount(res.data.amount);
      setStep(3);
    } catch (e) {
      setError(e.response?.data?.error || 'Booking failed. Please try again.');
    }
    setLoading(false);
  };

  const handlePay = async () => {
    setPayLoading(true);
    try {
      await axios.post(`/api/sessions/${sessionId}/pay`);
      setStep(4);
    } catch (e) {
      setError('Payment failed. Please try again.');
    }
    setPayLoading(false);
  };

  if (!tutor) return <div className="loading-overlay"><div className="spinner" style={{ width:40,height:40 }}/></div>;

  const displayName = TUTOR_NAMES[tutorId] || tutor.username?.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  const calDays = buildCalendar();

  // Step 4: Done
  if (step === 4) return (
    <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <div className="card fade-in" style={{ textAlign: 'center', maxWidth: '440px', padding: '48px 40px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎉</div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Booking Confirmed!</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.95rem' }}>
          Your session with <strong>{displayName}</strong> on <strong>{selectedDate && formatDate(selectedDate)}</strong> at <strong>{selectedTime}</strong> is confirmed and paid.
        </p>
        <div style={{ padding: '16px', background: 'var(--grad-soft)', borderRadius: 'var(--radius)', marginBottom: '24px' }}>
          <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, color: 'var(--primary)' }}>Amount Paid: ${amount.toFixed(2)}</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => navigate('/sessions')}>View Sessions</button>
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => navigate('/tutors')}>Find More Tutors</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-container fade-in">
      <button className="btn btn-ghost btn-sm" onClick={() => step > 1 ? setStep(s => s-1) : navigate(`/tutors/${tutorId}`)} style={{ marginBottom: '20px' }}>
        ← {step > 1 ? 'Back' : 'Back to Profile'}
      </button>

      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
        {['Select Time','Confirm','Payment'].map((s, i) => (
          <React.Fragment key={s}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              color: step > i+1 ? 'var(--success)' : step === i+1 ? 'var(--primary)' : 'var(--text-muted)'
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: step > i+1 ? 'var(--success)' : step === i+1 ? 'var(--primary)' : 'var(--border)',
                color: step >= i+1 ? 'white' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '0.8rem'
              }}>{step > i+1 ? '✓' : i+1}</div>
              <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: '0.85rem' }}>{s}</span>
            </div>
            {i < 2 && <div style={{ flex: 1, height: 2, background: step > i+1 ? 'var(--success)' : 'var(--border)', borderRadius: 2 }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Select */}
      {step === 1 && (
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px', padding: '16px', background: 'var(--grad-soft)', borderRadius: 'var(--radius)' }}>
              <div style={{ width:48,height:48,borderRadius:'50%',background:'var(--grad-main)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'1.1rem' }}>{displayName[0]}</div>
              <div>
                <div style={{ fontFamily:'Sora,sans-serif',fontWeight:700 }}>{displayName}</div>
                <div style={{ fontSize:'0.85rem',color:'var(--text-muted)' }}>{tutor.subject} • ${tutor.hourly_rate}/hr</div>
              </div>
            </div>

            {/* Calendar */}
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth()-1, 1))}>‹</button>
              <span style={{ fontFamily:'Sora,sans-serif',fontWeight:700,fontSize:'0.95rem' }}>
                {MONTHS[calMonth.getMonth()]} {calMonth.getFullYear()}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth()+1, 1))}>›</button>
            </div>
            <div className="calendar-grid">
              {DAYS.map(d => <div key={d} style={{ textAlign:'center',fontSize:'0.72rem',fontWeight:700,color:'var(--text-muted)',padding:'6px 0',fontFamily:'Sora,sans-serif' }}>{d}</div>)}
              {calDays.map((d, i) => (
                <button key={i} disabled={!d || isDisabled(d)} onClick={() => d && !isDisabled(d) && setSelectedDate(d)}
                  className={`cal-day ${!d ? '' : isDisabled(d) ? '' : ''} ${selectedDate && d && selectedDate.toDateString() === d.toDateString() ? 'selected' : ''} ${d && !isDisabled(d) && new Date().toDateString() === d.toDateString() ? 'today' : ''}`}>
                  {d ? d.getDate() : ''}
                </button>
              ))}
            </div>

            <div className="input-group" style={{ marginTop: '20px' }}>
              <label className="input-label">Session Duration</label>
              <select className="input-field" value={duration} onChange={e => setDuration(Number(e.target.value))}>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>
              {selectedDate ? `Available Slots — ${selectedDate.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}` : 'Select a date to see available times'}
            </h3>
            {!selectedDate ? (
              <div style={{ textAlign:'center',padding:'40px',color:'var(--text-muted)' }}>
                <div style={{ fontSize:'2.5rem',marginBottom:'8px' }}>📅</div>
                <p>Pick a date from the calendar</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div style={{ textAlign:'center',padding:'40px',color:'var(--text-muted)' }}>
                <div style={{ fontSize:'2.5rem',marginBottom:'8px' }}>😔</div>
                <p>No available slots on this day</p>
                <p style={{ fontSize:'0.8rem',marginTop:'4px' }}>Try another date</p>
              </div>
            ) : (
              <div className="time-slots">
                {availableSlots.map(s => (
                  <button key={s} className={`time-slot ${selectedTime === s ? 'selected' : ''}`}
                    onClick={() => setSelectedTime(s)}>{s}</button>
                ))}
                {bookedSlots.map(s => (
                  <button key={s} className="time-slot booked" disabled>{s} (Booked)</button>
                ))}
              </div>
            )}

            <div className="input-group" style={{ marginTop: '20px' }}>
              <label className="input-label">Notes for Tutor (optional)</label>
              <textarea className="input-field" value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Topics to cover, learning goals, questions..."
                rows={3} style={{ resize: 'vertical' }} />
            </div>

            {error && <div className="alert alert-error" style={{ marginTop: '16px' }}>⚠️ {error}</div>}

            <button className="btn btn-primary" style={{ width:'100%',justifyContent:'center',marginTop:'20px' }}
              disabled={!selectedDate || !selectedTime || loading} onClick={() => setStep(2)}>
              Continue to Confirm →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Confirm */}
      {step === 2 && (
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div className="card">
            <h2 style={{ fontSize: '1.2rem', marginBottom: '24px' }}>Confirm Your Booking</h2>
            {[
              ['Tutor', displayName],
              ['Subject', tutor.subject],
              ['Date', selectedDate?.toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})],
              ['Time', selectedTime],
              ['Duration', `${duration} minutes`],
              ['Rate', `$${tutor.hourly_rate}/hr`],
              ['Total', `$${((tutor.hourly_rate * duration)/60).toFixed(2)}`],
            ].map(([k, v]) => (
              <div key={k} style={{ display:'flex',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid var(--border)' }}>
                <span style={{ color:'var(--text-muted)',fontSize:'0.875rem' }}>{k}</span>
                <span style={{ fontWeight:600,fontSize:'0.875rem',fontFamily:'Sora,sans-serif' }}>{v}</span>
              </div>
            ))}
            {notes && (
              <div style={{ marginTop:'16px',padding:'12px',background:'var(--bg)',borderRadius:'var(--radius)' }}>
                <div style={{ fontSize:'0.75rem',color:'var(--text-muted)',marginBottom:'4px',fontWeight:600 }}>YOUR NOTES</div>
                <p style={{ fontSize:'0.875rem' }}>{notes}</p>
              </div>
            )}
            {error && <div className="alert alert-error" style={{ marginTop:'16px' }}>⚠️ {error}</div>}
            <button className="btn btn-primary btn-lg" style={{ width:'100%',justifyContent:'center',marginTop:'24px' }}
              disabled={loading} onClick={handleBook}>
              {loading ? <><span className="spinner" style={{ width:18,height:18 }}/> Processing...</> : '✓ Confirm & Proceed to Payment'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Payment */}
      {step === 3 && (
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div className="card" style={{ textAlign:'center' }}>
            <div style={{ fontSize:'3rem',marginBottom:'16px' }}>💳</div>
            <h2 style={{ fontSize:'1.2rem',marginBottom:'8px' }}>Secure Payment</h2>
            <p style={{ color:'var(--text-muted)',marginBottom:'24px',fontSize:'0.9rem' }}>
              Complete your payment to confirm the session
            </p>
            <div style={{ padding:'20px',background:'var(--grad-soft)',borderRadius:'var(--radius)',marginBottom:'24px' }}>
              <div style={{ fontFamily:'Sora,sans-serif',fontWeight:800,fontSize:'2rem',color:'var(--primary)' }}>${amount.toFixed(2)}</div>
              <div style={{ color:'var(--text-muted)',fontSize:'0.85rem',marginTop:'4px' }}>
                {duration} min session with {displayName}
              </div>
            </div>

            {/* Simulated payment form */}
            <div style={{ textAlign:'left',marginBottom:'20px',display:'flex',flexDirection:'column',gap:'12px' }}>
              <div className="input-group">
                <label className="input-label">Card Number</label>
                <input className="input-field" defaultValue="4242 4242 4242 4242" readOnly
                  style={{ background:'#f9f9f9',color:'var(--text-muted)' }} />
              </div>
              <div style={{ display:'flex',gap:'12px' }}>
                <div className="input-group" style={{ flex:1 }}>
                  <label className="input-label">Expiry</label>
                  <input className="input-field" defaultValue="12/27" readOnly style={{ background:'#f9f9f9',color:'var(--text-muted)' }} />
                </div>
                <div className="input-group" style={{ flex:1 }}>
                  <label className="input-label">CVC</label>
                  <input className="input-field" defaultValue="123" readOnly style={{ background:'#f9f9f9',color:'var(--text-muted)' }} />
                </div>
              </div>
              <div style={{ padding:'10px 14px',background:'#FEF3C7',borderRadius:'var(--radius)',fontSize:'0.8rem',color:'#92400E' }}>
                🔔 <strong>Demo Mode:</strong> This simulates a Stripe payment. Click Pay to confirm.
              </div>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom:'16px' }}>⚠️ {error}</div>}

            <button className="btn btn-primary btn-lg" style={{ width:'100%',justifyContent:'center' }}
              disabled={payLoading} onClick={handlePay}>
              {payLoading ? <><span className="spinner" style={{ width:18,height:18 }}/> Processing Payment...</> : `🔒 Pay $${amount.toFixed(2)}`}
            </button>
            <p style={{ fontSize:'0.75rem',color:'var(--text-muted)',marginTop:'12px' }}>
              🔒 Secured by Stripe. Your payment info is never stored.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
