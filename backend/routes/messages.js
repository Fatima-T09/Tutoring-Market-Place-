const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const BANNED = ['spam','scam','hack','illegal','drugs','violence'];
const isBad = t => BANNED.some(w => t.toLowerCase().includes(w));

router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const uid = req.user.id;
    const msgs = await db.messages.find({ $or: [{ senderId: uid }, { receiverId: uid }] }).sort({ createdAt: -1 });
    const seen = new Set();
    const convs = [];
    for (const m of msgs) {
      const contactId = m.senderId === uid ? m.receiverId : m.senderId;
      if (seen.has(contactId)) continue;
      seen.add(contactId);
      const contact = await db.users.findOne({ _id: contactId });
      const unread = await db.messages.count({ senderId: contactId, receiverId: uid, isRead: false });
      convs.push({ contact_id: contactId, contact_name: contact?.username, contact_role: contact?.role, last_message: m.content, last_message_time: m.createdAt, unread_count: unread });
    }
    res.json(convs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    await db.messages.update({ senderId: req.params.userId, receiverId: req.user.id }, { $set: { isRead: true } }, { multi: true });
    const msgs = await db.messages.find({
      $or: [
        { senderId: req.user.id, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: req.user.id }
      ]
    }).sort({ createdAt: 1 });
    const result = await Promise.all(msgs.map(async m => {
      const sender = await db.users.findOne({ _id: m.senderId });
      return { ...m, id: m._id, sender_id: m.senderId, receiver_id: m.receiverId, is_read: m.isRead, is_flagged: m.isFlagged, created_at: m.createdAt, sender_name: sender?.username };
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { receiver_id, content } = req.body;
    if (!receiver_id || !content) return res.status(400).json({ error: 'Receiver and content required' });
    if (isBad(content)) return res.status(400).json({ error: 'Message contains inappropriate content and has been blocked.' });
    const msgId = uuidv4();
    const msg = { _id: msgId, senderId: req.user.id, receiverId: receiver_id, content, isRead: false, isFlagged: false, createdAt: new Date() };
    await db.messages.insert(msg);
    res.status(201).json({ id: msgId, sender_id: req.user.id, receiver_id, content, is_read: false, is_flagged: false, created_at: msg.createdAt });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
