const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ error: 'Students only' });
    const { session_id, rating, review } = req.body;
    if (!session_id || !rating) return res.status(400).json({ error: 'Session and rating required' });
    if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });
    const session = await db.sessions.findOne({ _id: session_id, studentId: req.user.id, status: 'completed' });
    if (!session) return res.status(404).json({ error: 'Session not found or not yet completed.' });
    const existing = await db.ratings.findOne({ sessionId: session_id });
    if (existing) return res.status(409).json({ error: 'Already rated this session' });
    await db.ratings.insert({ _id: uuidv4(), sessionId: session_id, studentId: req.user.id, tutorId: session.tutorId, rating, review: review || '', createdAt: new Date() });
    const allRatings = await db.ratings.find({ tutorId: session.tutorId });
    const avg = allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length;
    await db.tutors.update({ userId: session.tutorId }, { $set: { rating: Math.round(avg * 10) / 10, totalReviews: allRatings.length } });
    res.status(201).json({ message: 'Rating submitted!' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/tutor/:tutorId', async (req, res) => {
  try {
    const ratings = await db.ratings.find({ tutorId: req.params.tutorId }).sort({ createdAt: -1 });
    const result = await Promise.all(ratings.map(async r => {
      const s = await db.users.findOne({ _id: r.studentId });
      return { rating: r.rating, review: r.review, created_at: r.createdAt, student_name: s?.username };
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
