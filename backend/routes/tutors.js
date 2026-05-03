const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const tutorProfiles = await db.tutors.find({});
    const userIds = tutorProfiles.map(t => t.userId);
    let users = await db.users.find({ _id: { $in: userIds } });
    if (search) {
      const q = search.toLowerCase();
      const filtered = tutorProfiles.filter(t =>
        t.subject.toLowerCase().includes(q) || t.bio.toLowerCase().includes(q)
      );
      const filteredIds = filtered.map(t => t.userId);
      users = users.filter(u => filteredIds.includes(u._id) || u.username.toLowerCase().includes(q));
    }
    const result = users.map(u => {
      const tp = tutorProfiles.find(t => t.userId === u._id);
      return { id: u._id, username: u.username, email: u.email, subject: tp?.subject, bio: tp?.bio, hourly_rate: tp?.hourlyRate, rating: tp?.rating, total_reviews: tp?.totalReviews, availability: tp?.availability };
    }).filter(r => r.subject).sort((a,b) => b.rating - a.rating);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await db.users.findOne({ _id: req.params.id, role: 'tutor' });
    if (!user) return res.status(404).json({ error: 'Tutor not found' });
    const tp = await db.tutors.findOne({ userId: req.params.id });
    const reviews = await db.ratings.find({ tutorId: req.params.id }).sort({ createdAt: -1 }).limit(10);
    const reviewsWithNames = await Promise.all(reviews.map(async r => {
      const s = await db.users.findOne({ _id: r.studentId });
      return { rating: r.rating, review: r.review, created_at: r.createdAt, student_name: s?.username };
    }));
    res.json({ id: user._id, username: user.username, email: user.email, subject: tp?.subject, bio: tp?.bio, hourly_rate: tp?.hourlyRate, rating: tp?.rating, total_reviews: tp?.totalReviews, availability: tp?.availability, reviews: reviewsWithNames });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/profile/update', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'tutor') return res.status(403).json({ error: 'Tutors only' });
    const { bio, hourly_rate, availability, subject } = req.body;
    await db.tutors.update({ userId: req.user.id }, { $set: { bio, hourlyRate: hourly_rate, availability, subject } });
    res.json({ message: 'Profile updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/availability', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Date required' });
    const tp = await db.tutors.findOne({ userId: req.params.id });
    if (!tp) return res.status(404).json({ error: 'Tutor not found' });
    const dayKey = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const slots = (tp.availability || {})[dayKey] || [];
    const booked = await db.sessions.find({ tutorId: req.params.id, date, status: { $nin: ['cancelled'] } });
    const bookedTimes = booked.map(b => b.time);
    res.json({ date, slots: slots.filter(s => !bookedTimes.includes(s)), bookedSlots: bookedTimes });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
