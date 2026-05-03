const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

router.post('/book', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ error: 'Students only' });
    const { tutor_id, subject, date, time, duration, notes } = req.body;
    if (!tutor_id || !date || !time) return res.status(400).json({ error: 'Tutor, date and time are required' });
    const conflict = await db.sessions.findOne({ tutorId: tutor_id, date, time, status: { $nin: ['cancelled'] } });
    if (conflict) return res.status(409).json({ error: 'This time slot is already booked. Please choose another time.' });
    const tp = await db.tutors.findOne({ userId: tutor_id });
    if (!tp) return res.status(404).json({ error: 'Tutor not found' });
    const dur = duration || 60;
    const amount = (tp.hourlyRate * dur) / 60;
    const sessionId = uuidv4();
    await db.sessions.insert({ _id: sessionId, studentId: req.user.id, tutorId: tutor_id, subject: subject || 'General', date, time, duration: dur, status: 'pending', paymentStatus: 'unpaid', amount, notes: notes || '', createdAt: new Date() });
    res.status(201).json({ sessionId, amount, message: 'Session created. Proceed to payment.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/my', authMiddleware, async (req, res) => {
  try {
    let sessions;
    if (req.user.role === 'student') {
      sessions = await db.sessions.find({ studentId: req.user.id }).sort({ date: -1 });
      sessions = await Promise.all(sessions.map(async s => {
        const tutor = await db.users.findOne({ _id: s.tutorId });
        const tp = await db.tutors.findOne({ userId: s.tutorId });
        return { ...s, id: s._id, tutor_name: tutor?.username, tutor_subject: tp?.subject, student_id: s.studentId, tutor_id: s.tutorId, payment_status: s.paymentStatus };
      }));
    } else if (req.user.role === 'tutor') {
      sessions = await db.sessions.find({ tutorId: req.user.id }).sort({ date: -1 });
      sessions = await Promise.all(sessions.map(async s => {
        const student = await db.users.findOne({ _id: s.studentId });
        return { ...s, id: s._id, student_name: student?.username, student_id: s.studentId, tutor_id: s.tutorId, payment_status: s.paymentStatus };
      }));
    } else {
      sessions = await db.sessions.find({}).sort({ createdAt: -1 });
      sessions = await Promise.all(sessions.map(async s => {
        const student = await db.users.findOne({ _id: s.studentId });
        const tutor = await db.users.findOne({ _id: s.tutorId });
        return { ...s, id: s._id, student_name: student?.username, tutor_name: tutor?.username, student_id: s.studentId, tutor_id: s.tutorId, payment_status: s.paymentStatus };
      }));
    }
    res.json(sessions);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['confirmed','completed','cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const session = await db.sessions.findOne({ _id: req.params.id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (req.user.role === 'student' && session.studentId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    if (req.user.role === 'tutor' && session.tutorId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    await db.sessions.update({ _id: req.params.id }, { $set: { status } });
    res.json({ message: 'Updated', status });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/pay', authMiddleware, async (req, res) => {
  try {
    const session = await db.sessions.findOne({ _id: req.params.id, studentId: req.user.id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    await db.sessions.update({ _id: req.params.id }, { $set: { status: 'confirmed', paymentStatus: 'paid' } });
    res.json({ success: true, message: 'Payment confirmed! Session is now scheduled.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
