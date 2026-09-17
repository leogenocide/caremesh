import express from 'express';
import { db } from '../db/database.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

export function formatNotification(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    timestamp: row.timestamp,
    isRead: Boolean(row.is_read),
    targetView: row.target_view,
    targetSubTab: row.target_sub_tab,
    targetEntityId: row.target_entity_id
  };
}

// GET /api/notifications
router.get('/', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : (req.query.userId || 'usr_me');
  const rows = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  res.json(rows.map(formatNotification));
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : (req.body?.userId || 'usr_me');
  const row = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  if (row.user_id && row.user_id !== userId) {
    return res.status(403).json({ error: 'Access forbidden: cannot modify another account’s notifications.' });
  }

  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true, id: req.params.id });
});

// POST /api/notifications/read-all
router.post('/read-all', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : (req.body?.userId || 'usr_me');
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
  res.json({ success: true });
});

export default router;
