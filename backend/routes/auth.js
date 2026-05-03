const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const SECRET = process.env.JWT_SECRET || 'tutormarket_secret_2024';

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password || !role) return res.status(400).json({ error: 'All fields are required' });
    if (!['student','tutor'].includes(role)) return res.status(400).json({ error: 'Role must be student or tutor' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email format' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const exists = await db.users.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(409).json({ error: 'Username or email already exists' });
    const hashed = bcrypt.hashSync(password, 10);
    const userId = uuidv4();
    await db.users.insert({ _id: userId, username, email, password: hashed, role, createdAt: new Date() });
    if (role === 'tutor') {
      await db.tutors.insert({ _id: uuidv4(), userId, subject: 'General', bio: 'New tutor — please update your profile.', hourlyRate: 50.0, rating: 0.0, totalReviews: 0, availability: {} });
    }
    const token = jwt.sign({ id: userId, username, email, role }, SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: userId, username, email, role } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = await db.users.findOne({ email });
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid email or password' });
    const token = jwt.sign({ id: user._id, username: user.username, email: user.email, role: user.role }, SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await db.users.findOne({ _id: req.user.id });
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({ id: user._id, username: user.username, email: user.email, role: user.role });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
