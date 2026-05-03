import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

let socket;

export default function ChatPage() {
  const { userId: paramUserId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [convsLoading, setConvsLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);

  // Socket setup
  useEffect(() => {
    socket = io(window.location.origin.replace('3000','5000'));
    socket.emit('register', user.id);

    socket.on('receive_message', (msg) => {
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on('user_typing', ({ sender_id }) => {
      if (sender_id === activeUser?.contact_id) {
        setTyping(true);
        setTimeout(() => setTyping(false), 2000);
      }
    });

    return () => socket.disconnect();
  }, [user.id]);

  // Load conversations
  useEffect(() => {
    axios.get('/api/messages/conversations')
      .then(r => setConversations(r.data))
      .finally(() => setConvsLoading(false));
  }, []);

  // Open chat from URL param
  useEffect(() => {
    if (paramUserId && conversations.length === 0) {
      // Try to start chat with that user even without existing conversation
      axios.get(`/api/tutors/${paramUserId}`).then(r => {
        const pseudo = { contact_id: paramUserId, contact_name: r.data.username, contact_role: 'tutor', last_message: '' };
        openChat(pseudo);
      }).catch(() => {});
    } else if (paramUserId && conversations.length > 0) {
      const conv = conversations.find(c => c.contact_id === paramUserId);
      if (conv) openChat(conv);
    }
  }, [paramUserId, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openChat = async (conv) => {
    setActiveUser(conv);
    setLoading(true);
    try {
      const res = await axios.get(`/api/messages/${conv.contact_id}`);
      setMessages(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!text.trim() || !activeUser) return;
    setSending(true);
    const msgText = text.trim();
    setText('');
    try {
      const res = await axios.post('/api/messages/send', { receiver_id: activeUser.contact_id, content: msgText });
      const newMsg = { ...res.data, sender_name: user.username };
      setMessages(prev => [...prev, newMsg]);
      socket.emit('send_message', { receiver_id: activeUser.contact_id, message: newMsg });
      // Refresh conversations
      const convsRes = await axios.get('/api/messages/conversations');
      setConversations(convsRes.data);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to send message');
      setText(msgText);
    }
    setSending(false);
  };

  const handleTyping = () => {
    if (activeUser) {
      socket.emit('typing', { receiver_id: activeUser.contact_id, sender_id: user.id });
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    handleTyping();
  };

  const handleSearch = async (q) => {
    setSearchUser(q);
    if (!q.trim()) { setSearchResults([]); return; }
    try {
      const res = await axios.get(`/api/tutors?search=${encodeURIComponent(q)}`);
      setSearchResults(res.data.slice(0,5));
    } catch (e) {}
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const displayName = (name) => name?.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) || 'Unknown';

  return (
    <div style={{ background: 'white', height: 'calc(100vh - 64px)' }}>
      <div className="chat-layout">
        {/* Sidebar */}
        <div className="chat-sidebar">
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
            <h2 style={{ fontFamily:'Sora,sans-serif',fontWeight:700,fontSize:'1rem',marginBottom:'10px' }}>💬 Messages</h2>
            <input className="input-field" value={searchUser} onChange={e => handleSearch(e.target.value)}
              placeholder="Search users..." style={{ fontSize:'0.85rem' }} />
            {searchResults.length > 0 && (
              <div style={{ position:'absolute',background:'white',border:'1px solid var(--border)',borderRadius:'var(--radius)',
                boxShadow:'var(--shadow-lg)',zIndex:100,left:16,right:16,marginTop:4 }}>
                {searchResults.map(t => (
                  <div key={t.id} className="conv-item" onClick={() => {
                    const pseudo = { contact_id: t.id, contact_name: t.username, contact_role: 'tutor' };
                    openChat(pseudo); setSearchUser(''); setSearchResults([]);
                    navigate(`/chat/${t.id}`);
                  }}>
                    <div style={{ width:36,height:36,borderRadius:'50%',background:'var(--grad-main)',color:'white',
                      display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,flexShrink:0 }}>
                      {t.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight:600,fontSize:'0.875rem' }}>{displayName(t.username)}</div>
                      <div style={{ fontSize:'0.75rem',color:'var(--text-muted)' }}>{t.subject}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {convsLoading ? (
            <div style={{ padding:'20px',textAlign:'center',color:'var(--text-muted)',fontSize:'0.85rem' }}>Loading...</div>
          ) : conversations.length === 0 ? (
            <div style={{ padding:'32px 16px',textAlign:'center',color:'var(--text-muted)' }}>
              <div style={{ fontSize:'2rem',marginBottom:'8px' }}>🔍</div>
              <p style={{ fontSize:'0.85rem' }}>Search above to start a conversation</p>
            </div>
          ) : conversations.map(c => (
            <div key={c.contact_id} className={`conv-item ${activeUser?.contact_id === c.contact_id ? 'active' : ''}`}
              onClick={() => { openChat(c); navigate(`/chat/${c.contact_id}`); }}>
              <div style={{ width:40,height:40,borderRadius:'50%',background:'var(--grad-main)',color:'white',
                display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'0.95rem',flexShrink:0 }}>
                {c.contact_name?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                  <span style={{ fontWeight:600,fontSize:'0.875rem',fontFamily:'Sora,sans-serif' }}>{displayName(c.contact_name)}</span>
                  {c.unread_count > 0 && (
                    <span style={{ background:'var(--primary)',color:'white',borderRadius:'50%',
                      width:18,height:18,display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:'0.65rem',fontWeight:700,flexShrink:0 }}>{c.unread_count}</span>
                  )}
                </div>
                <div style={{ fontSize:'0.75rem',color:'var(--text-muted)',overflow:'hidden',
                  whiteSpace:'nowrap',textOverflow:'ellipsis',marginTop:'2px' }}>
                  {c.last_message || 'Start a conversation'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main chat area */}
        <div className="chat-main">
          {!activeUser ? (
            <div style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'12px',color:'var(--text-muted)' }}>
              <div style={{ fontSize:'4rem' }}>💬</div>
              <h3 style={{ fontFamily:'Sora,sans-serif' }}>Select a conversation</h3>
              <p style={{ fontSize:'0.875rem' }}>Choose from the sidebar or search for a tutor</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="chat-header">
                <div style={{ width:40,height:40,borderRadius:'50%',background:'var(--grad-main)',color:'white',
                  display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700 }}>
                  {activeUser.contact_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily:'Sora,sans-serif',fontWeight:700,fontSize:'0.95rem' }}>{displayName(activeUser.contact_name)}</div>
                  <div style={{ fontSize:'0.75rem',color:'var(--success)' }}>
                    {typing ? '✍️ typing...' : '● Online'}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {loading ? (
                  <div style={{ textAlign:'center',color:'var(--text-muted)',padding:'20px' }}>Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign:'center',color:'var(--text-muted)',padding:'40px' }}>
                    <div style={{ fontSize:'2.5rem',marginBottom:'8px' }}>👋</div>
                    <p>Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((m, i) => {
                    const isMine = m.sender_id === user.id;
                    const showDate = i === 0 || new Date(messages[i-1].created_at).toDateString() !== new Date(m.created_at).toDateString();
                    return (
                      <React.Fragment key={m.id || i}>
                        {showDate && (
                          <div style={{ textAlign:'center',fontSize:'0.72rem',color:'var(--text-muted)',
                            padding:'8px',background:'rgba(0,0,0,0.04)',borderRadius:'50px',alignSelf:'center' }}>
                            {new Date(m.created_at).toLocaleDateString()}
                          </div>
                        )}
                        <div style={{ display:'flex',flexDirection:'column',alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                          <div className={`msg-bubble ${isMine ? 'sent' : 'received'}`}>
                            {m.content}
                            <div className="msg-time" style={{ textAlign: isMine ? 'right' : 'left' }}>
                              {formatTime(m.created_at)} {isMine && (m.is_read ? '✓✓' : '✓')}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                {typing && (
                  <div style={{ display:'flex',alignItems:'flex-start' }}>
                    <div className="msg-bubble received" style={{ padding:'10px 16px' }}>
                      <span style={{ display:'inline-flex',gap:4 }}>
                        {[0,1,2].map(i => <span key={i} style={{ width:6,height:6,borderRadius:'50%',background:'var(--text-muted)',
                          animation:'pulse 1s ease infinite',animationDelay:`${i*0.2}s`,display:'inline-block' }} />)}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="chat-input-area">
                <textarea className="input-field" value={text} onChange={e => setText(e.target.value)}
                  onKeyDown={handleKeyDown} placeholder="Type a message... (Enter to send)"
                  rows={1} disabled={sending}
                  style={{ flex:1,resize:'none',borderRadius:'20px',padding:'10px 16px',maxHeight:'120px',
                    lineHeight:1.5,fontSize:'0.9rem' }} />
                <button className="btn btn-primary" onClick={sendMessage} disabled={!text.trim() || sending}
                  style={{ borderRadius:'50%',width:44,height:44,padding:0,justifyContent:'center',flexShrink:0 }}>
                  {sending ? <span className="spinner" style={{ width:18,height:18,borderColor:'rgba(255,255,255,0.3)',borderTopColor:'white' }}/> : '➤'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
