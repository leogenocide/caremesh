import express from 'express';
import { db } from '../db/database.js';
import { formatUser } from './auth.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

export function formatConversation(row, currentUserId = 'usr_me') {
  if (!row) return null;

  const otherUserId = (row.user1_id === currentUserId) ? row.user2_id : row.user1_id;
  const participantRow = db.prepare('SELECT * FROM users WHERE id = ?').get(otherUserId);
  const participant = participantRow ? formatUser(participantRow) : { id: otherUserId, name: 'Neighbor' };

  const messageRows = db.prepare('SELECT * FROM direct_messages WHERE conversation_id = ? ORDER BY created_at ASC').all(row.id);
  const messages = messageRows.map(m => ({
    id: m.id,
    senderId: m.sender_id,
    text: m.text,
    timestamp: m.timestamp
  }));

  return {
    id: row.id,
    user1Id: row.user1_id,
    user2Id: row.user2_id,
    participant,
    title: row.title || participant.name,
    subtitle: row.subtitle,
    lastMessage: row.last_message,
    lastTime: row.last_time,
    unreadCount: row.unread_count,
    messages
  };
}

// GET /api/conversations
router.get('/', optionalAuth, (req, res) => {
  const userId = req.user?.id || req.query.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required to view conversations.' });
  }
  const rows = db.prepare('SELECT * FROM conversations WHERE user1_id = ? OR user2_id = ? ORDER BY created_at DESC').all(userId, userId);
  res.json(rows.map(r => formatConversation(r, userId)));
});

// GET /api/conversations/:id
router.get('/:id', optionalAuth, (req, res) => {
  const userId = req.user?.id || req.query.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required to view conversation.' });
  }
  const row = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  if (row.user1_id !== userId && row.user2_id !== userId) {
    return res.status(403).json({ error: 'Access forbidden: you are not a participant in this conversation.' });
  }

  res.json(formatConversation(row, userId));
});

// POST /api/conversations/:id/messages
router.post('/:id/messages', optionalAuth, (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const senderId = req.user?.id || req.body.senderId;
  if (!senderId) {
    return res.status(401).json({ error: 'Authentication required to send messages.' });
  }
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  if (conversation.user1_id !== senderId && conversation.user2_id !== senderId) {
    return res.status(403).json({ error: 'Access forbidden: you cannot post messages to a conversation you do not belong to.' });
  }

  const id = `dm_${req.params.id}_${Date.now()}`;
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO direct_messages (id, conversation_id, sender_id, text, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, req.params.id, senderId, text, timestamp);

    db.prepare(`
      UPDATE conversations
      SET last_message = ?, last_time = 'Just now'
      WHERE id = ?
    `).run(text, req.params.id);
  });

  tx();

  res.status(201).json(formatConversation(db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id), senderId));
});

export default router;
