const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware, requireRole } = require('../middleware/auth');
router.use(authMiddleware, requireRole('admin'));

router.get('/users', async (req, res) => {
  try {
    const users = await db.users.find({}).sort({ createdAt: -1 });
    res.json(users.map(u => ({ id: u._id, username: u.username, email: u.email, role: u.role, created_at: u.createdAt })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
    await db.users.remove({ _id: req.params.id });
    res.json({ message: 'User deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/sessions', async (req, res) => {
  try {
    const sessions = await db.sessions.find({}).sort({ createdAt: -1 });
    const result = await Promise.all(sessions.map(async s => {
      const student = await db.users.findOne({ _id: s.studentId });
      const tutor = await db.users.findOne({ _id: s.tutorId });
      return { ...s, id: s._id, student_name: student?.username, tutor_name: tutor?.username, payment_status: s.paymentStatus };
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/flagged-messages', async (req, res) => {
  try {
    const msgs = await db.messages.find({ isFlagged: true }).sort({ createdAt: -1 });
    const result = await Promise.all(msgs.map(async m => {
      const sender = await db.users.findOne({ _id: m.senderId });
      const receiver = await db.users.findOne({ _id: m.receiverId });
      return { ...m, id: m._id, sender_name: sender?.username, receiver_name: receiver?.username, created_at: m.createdAt };
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/stats', async (req, res) => {
  try {
    const [students, tutors, sessions, active, flagged] = await Promise.all([
      db.users.count({ role: 'student' }),
      db.users.count({ role: 'tutor' }),
      db.sessions.count({}),
      db.sessions.count({ status: 'confirmed' }),
      db.messages.count({ isFlagged: true }),
    ]);
    const paidSessions = await db.sessions.find({ paymentStatus: 'paid' });
    const revenue = paidSessions.reduce((s, sess) => s + (sess.amount || 0), 0);
    res.json({ students, tutors, sessions, activeSessions: active, flaggedMessages: flagged, revenue });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
