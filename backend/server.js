require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', methods: ['GET','POST'] }
});

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tutors', require('./routes/tutors'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Socket.IO - Real-time messaging
const connectedUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('register', (userId) => {
    connectedUsers.set(userId, socket.id);
    console.log(`User ${userId} registered to socket ${socket.id}`);
  });

  socket.on('send_message', (data) => {
    const { receiver_id, message } = data;
    const receiverSocketId = connectedUsers.get(receiver_id);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receive_message', message);
    }
  });

  socket.on('typing', (data) => {
    const { receiver_id, sender_id } = data;
    const receiverSocketId = connectedUsers.get(receiver_id);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', { sender_id });
    }
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Tutoring Marketplace Backend running on port ${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api`);
  console.log(`\n📋 Demo Accounts:`);
  console.log(`   Admin:   admin@tutormarket.com / admin123`);
  console.log(`   Student: student@tutormarket.com / student123`);
  console.log(`   Tutor:   fatima@tutormarket.com / tutor123`);
});
