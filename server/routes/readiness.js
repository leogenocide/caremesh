import express from 'express';
import { db } from '../db/database.js';
import { formatUser } from './auth.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

export function formatReadinessCheck(row) {
  if (!row) return null;

  const creatorRow = db.prepare('SELECT * FROM users WHERE id = ?').get(row.creator_id);
  const creator = creatorRow ? formatUser(creatorRow) : { id: row.creator_id, name: 'Coordinator' };

  const responseRows = db.prepare(`
    SELECT rr.*, u.name, u.handle, u.avatar, u.role
    FROM readiness_responses rr
    JOIN users u ON rr.user_id = u.id
    WHERE rr.readiness_check_id = ?
    ORDER BY rr.updated_at DESC
  `).all(row.id);

  const responses = responseRows.map(r => ({
    id: r.id,
    userId: r.user_id,
    userName: r.name,
    userHandle: r.handle,
    userAvatar: r.avatar,
    userRole: r.role,
    status: r.status, // 'ready' | 'standby' | 'unavailable'
    note: r.note || '',
    gearNotes: r.note || '',
    availableHours: r.available_hours || '',
    hoursAvailable: r.available_hours || '',
    user: {
      id: r.user_id,
      name: r.name,
      handle: r.handle,
      avatar: r.avatar,
      role: r.role
    },
    updatedAt: r.updated_at
  }));

  const readyCount = responses.filter(r => r.status === 'ready').length;
  const standbyCount = responses.filter(r => r.status === 'standby').length;
  const unavailableCount = responses.filter(r => r.status === 'unavailable').length;
  const totalResponses = responses.length;
  const targetHeadcount = Number(row.target_headcount) || 5;
  const readyPercentage = Math.round((readyCount / Math.max(1, targetHeadcount)) * 100);

  return {
    id: row.id,
    creator,
    creatorId: row.creator_id,
    communityId: row.community_id,
    requestId: row.request_id || null,
    title: row.title,
    description: row.description || '',
    notes: row.description || '',
    targetDate: row.target_date || '',
    shiftTime: row.target_date || '',
    targetHeadcount,
    requiredSkills: JSON.parse(row.required_skills || '[]'),
    status: row.status, // 'active' | 'closed'
    createdAt: row.created_at,
    responses,
    readyCount,
    standbyCount,
    unavailableCount,
    totalResponses,
    readyPercentage,
    stats: {
      totalResponses,
      readyCount,
      standbyCount,
      unavailableCount,
      readyPercentage
    }
  };
}

// GET /api/readiness
router.get('/', optionalAuth, (req, res) => {
  const { communityId, requestId } = req.query;
  let sql = 'SELECT * FROM readiness_checks WHERE 1=1';
  const params = [];

  if (communityId) {
    sql += ' AND community_id = ?';
    params.push(communityId);
  }
  if (requestId) {
    sql += ' AND request_id = ?';
    params.push(requestId);
  }

  sql += ' ORDER BY created_at DESC';

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(formatReadinessCheck));
});

// GET /api/readiness/:id
router.get('/:id', optionalAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM readiness_checks WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Readiness check not found' });
  }
  res.json(formatReadinessCheck(row));
});

// POST /api/readiness
router.post('/', optionalAuth, (req, res) => {
  const creatorId = req.user?.id || req.body?.creatorId;
  if (!creatorId) {
    return res.status(401).json({ error: 'Authentication required to initiate a readiness check.' });
  }

  const {
    title,
    description = '',
    notes = '',
    targetDate = 'Upcoming Mission',
    shiftTime,
    targetHeadcount = 5,
    requiredSkills = [],
    communityId = null,
    requestId = null
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'title is required.' });
  }

  const id = `rc_${Date.now()}`;
  const finalDescription = notes || description;
  const finalDate = shiftTime || targetDate;
  const finalHeadcount = Number(targetHeadcount) || 5;

  db.prepare(`
    INSERT INTO readiness_checks (id, creator_id, community_id, request_id, title, description, target_date, target_headcount, required_skills, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `).run(
    id,
    creatorId,
    communityId || null,
    requestId || null,
    title,
    finalDescription,
    finalDate,
    finalHeadcount,
    JSON.stringify(requiredSkills)
  );

  // Dispatch notifications to committed volunteers if linked to a request
  if (requestId) {
    try {
      const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(requestId);
      const volunteerRows = db.prepare('SELECT DISTINCT user_id FROM request_responses WHERE request_id = ? AND user_id != ?').all(requestId, creatorId);
      const notifInsert = db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, body, timestamp, is_read, target_view, target_sub_tab, target_entity_id)
        VALUES (?, ?, 'readiness_check', 'Volunteer Readiness Check', ?, 'Just now', 0, 'collaborate', 'requests', ?)
      `);
      for (const v of volunteerRows) {
        notifInsert.run(
          `notif_${Date.now()}_${v.user_id}`,
          v.user_id,
          `Roll-Call: Please confirm your readiness for help request "${request?.title || title}".`,
          requestId
        );
      }
    } catch (e) {
      console.warn('Could not dispatch volunteer readiness notifications:', e.message);
    }
  }

  const created = formatReadinessCheck(db.prepare('SELECT * FROM readiness_checks WHERE id = ?').get(id));
  res.status(201).json(created);
});

// POST /api/readiness/:id/respond
router.post('/:id/respond', optionalAuth, (req, res) => {
  const userId = req.user?.id || req.body?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required to respond to readiness checks.' });
  }

  const check = db.prepare('SELECT * FROM readiness_checks WHERE id = ?').get(req.params.id);
  if (!check) {
    return res.status(404).json({ error: 'Readiness check not found' });
  }

  const { status, note = '', gearNotes = '', availableHours = '', hoursAvailable = '' } = req.body;
  if (!status || !['ready', 'standby', 'unavailable'].includes(status)) {
    return res.status(400).json({ error: 'Valid status (ready, standby, unavailable) is required.' });
  }

  const finalNote = gearNotes || note;
  const finalHours = hoursAvailable ? String(hoursAvailable) : String(availableHours);

  const existing = db.prepare('SELECT id FROM readiness_responses WHERE readiness_check_id = ? AND user_id = ?').get(req.params.id, userId);

  if (existing) {
    db.prepare(`
      UPDATE readiness_responses
      SET status = ?, note = ?, available_hours = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, finalNote, finalHours, existing.id);
  } else {
    const id = `rr_${Date.now()}_${userId}`;
    db.prepare(`
      INSERT INTO readiness_responses (id, readiness_check_id, user_id, status, note, available_hours)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, req.params.id, userId, status, finalNote, finalHours);
  }

  const updated = formatReadinessCheck(db.prepare('SELECT * FROM readiness_checks WHERE id = ?').get(req.params.id));
  res.json(updated);
});

// POST /api/readiness/:id/close
router.post('/:id/close', optionalAuth, (req, res) => {
  const userId = req.user?.id || req.body?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required to close readiness checks.' });
  }

  const check = db.prepare('SELECT * FROM readiness_checks WHERE id = ?').get(req.params.id);
  if (!check) {
    return res.status(404).json({ error: 'Readiness check not found' });
  }

  db.prepare("UPDATE readiness_checks SET status = 'closed' WHERE id = ?").run(req.params.id);
  const updated = formatReadinessCheck(db.prepare('SELECT * FROM readiness_checks WHERE id = ?').get(req.params.id));
  res.json(updated);
});

export default router;
