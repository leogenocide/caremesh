import express from 'express';
import { db } from '../db/database.js';
import { formatUser } from './auth.js';
import { optionalAuth } from '../middleware/auth.js';
import { parsePaginationParams, executePaginatedQuery } from '../utils/pagination.js';
import { isPlatformAdmin } from './communities.js';

const router = express.Router();

export function formatProject(row) {
  if (!row) return null;

  const organizerRow = db.prepare('SELECT * FROM users WHERE id = ?').get(row.organizer_id);
  const organizer = organizerRow ? formatUser(organizerRow) : { id: row.organizer_id, name: 'Anonymous' };

  const participantRows = db.prepare(`
    SELECT u.* FROM project_participants pp
    JOIN users u ON pp.user_id = u.id
    WHERE pp.project_id = ?
  `).all(row.id);
  const participants = participantRows.map(formatUser);

  const messageRows = db.prepare(`
    SELECT pm.*, u.id as u_id, u.name, u.role, u.avatar
    FROM project_messages pm
    JOIN users u ON pm.sender_id = u.id
    WHERE pm.project_id = ?
    ORDER BY pm.created_at ASC
  `).all(row.id);
  const chatMessages = messageRows.map(m => ({
    id: m.id,
    sender: { id: m.u_id, name: m.name, role: m.role, avatar: m.avatar },
    text: m.text,
    time: m.time
  }));

  return {
    id: row.id,
    title: row.title,
    eventType: row.event_type,
    customEventType: row.custom_event_type || null,
    isCustomEventType: Boolean(row.custom_event_type),
    attendeePrivacy: row.attendee_privacy || 'public',
    chatPrivacy: row.chat_privacy || 'members_only',
    description: row.description,
    location: {
      address: row.address,
      lat: row.lat,
      lng: row.lng
    },
    date: row.date,
    time: row.time,
    organizer,
    participants,
    maxParticipants: row.max_participants,
    status: row.status,
    relatedRequestIds: [],
    relatedResourceIds: [],
    relatedPlanIds: row.plan_id ? [row.plan_id] : [],
    chatMessages
  };
}

// GET /api/projects
router.get('/', (req, res) => {
  const { isPaginated, page, limit } = parsePaginationParams(req.query);
  const { eventType, status } = req.query;
  const whereClauses = [];
  const params = [];

  if (eventType) {
    whereClauses.push('event_type = ?');
    params.push(eventType);
  }
  if (status) {
    whereClauses.push('status = ?');
    params.push(status);
  }

  // Exclude quarantined projects/events from public view
  whereClauses.push('(is_quarantined = 0 OR is_quarantined IS NULL)');

  const whereSql = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';
  const countSql = `SELECT COUNT(*) FROM projects${whereSql}`;
  const dataSql = `SELECT * FROM projects${whereSql} ORDER BY created_at DESC`;

  if (isPaginated) {
    const result = executePaginatedQuery(db, {
      countSql,
      countParams: params,
      dataSql,
      dataParams: params,
      page,
      limit,
      formatter: formatProject
    });
    return res.json(result);
  }

  const rows = db.prepare(dataSql).all(...params);
  res.json(rows.map(formatProject));
});

// GET /api/projects/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!row || row.is_quarantined) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(formatProject(row));
});

// POST /api/projects
router.post('/', optionalAuth, (req, res) => {
  const { 
    title, 
    eventType, 
    customEventType = null,
    attendeePrivacy = 'public',
    chatPrivacy = 'members_only',
    description, 
    location, 
    date, 
    time, 
    maxParticipants = 20, 
    planId 
  } = req.body;

  if (!title || !description || !eventType) {
    return res.status(400).json({ error: 'Title, description, and eventType are required.' });
  }

  const id = `evt_${Date.now()}`;
  const organizerId = req.user ? req.user.id : req.body.organizerId;
  if (!organizerId) {
    return res.status(401).json({ error: 'Authentication required to create a project or event.' });
  }

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO projects (id, title, event_type, custom_event_type, attendee_privacy, chat_privacy, description, address, lat, lng, date, time, organizer_id, max_participants, status, plan_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', ?)
    `).run(
      id,
      title,
      eventType,
      customEventType || null,
      attendeePrivacy || 'public',
      chatPrivacy || 'members_only',
      description,
      location?.address || 'Maplewood Local Area',
      location?.lat || 37.7749,
      location?.lng || -122.4194,
      date || 'Upcoming',
      time || '10:00 AM - 1:00 PM',
      organizerId,
      maxParticipants,
      planId || null
    );

    db.prepare(`
      INSERT INTO project_participants (id, project_id, user_id, joined_at)
      VALUES (?, ?, ?, 'Organizer')
    `).run(`projp_${id}_${organizerId}`, id, organizerId);
  });

  tx();

  const created = formatProject(db.prepare('SELECT * FROM projects WHERE id = ?').get(id));
  res.status(201).json(created);
});

// POST /api/projects/:id/join
router.post('/:id/join', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : req.body.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required to join an event.' });
  }

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // 1. Organizer cannot join their own project as an attendee
  if (project.organizer_id === userId) {
    return res.status(400).json({ error: 'You are the organizer of this activity.' });
  }

  // 2. Cannot join multiple times
  const existing = db.prepare('SELECT id FROM project_participants WHERE project_id = ? AND user_id = ?').get(req.params.id, userId);
  if (existing) {
    return res.status(400).json({ error: 'You are already registered for this activity.' });
  }

  db.prepare(`
    INSERT INTO project_participants (id, project_id, user_id, joined_at)
    VALUES (?, ?, ?, 'Just now')
  `).run(`projp_${req.params.id}_${userId}`, req.params.id, userId);

  res.json(formatProject(db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)));
});

// POST /api/projects/:id/messages
router.post('/:id/messages', optionalAuth, (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const senderId = req.user ? req.user.id : req.body.senderId;
  if (!senderId) {
    return res.status(401).json({ error: 'Authentication required to post messages.' });
  }

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // Enforce members_only chat privacy
  if (project.chat_privacy === 'members_only' && project.organizer_id !== senderId) {
    const isParticipant = db.prepare('SELECT 1 FROM project_participants WHERE project_id = ? AND user_id = ?').get(req.params.id, senderId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Coordination chat is restricted to registered event participants.' });
    }
  }

  const id = `msg_${Date.now()}`;
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  db.prepare(`
    INSERT INTO project_messages (id, project_id, sender_id, text, time)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, req.params.id, senderId, text, time);

  res.status(201).json(formatProject(db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)));
});

// PATCH /api/projects/:id
router.patch('/:id', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : req.body.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required to modify an event.' });
  }

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Event / project not found' });
  }

  const user = req.user || db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (project.organizer_id !== userId && !isPlatformAdmin(user)) {
    return res.status(403).json({ error: 'Only the organizer or platform administrators can edit this event.' });
  }

  const {
    title = project.title,
    eventType = project.event_type,
    customEventType = project.custom_event_type,
    attendeePrivacy = project.attendee_privacy,
    chatPrivacy = project.chat_privacy,
    description = project.description,
    location,
    date = project.date,
    time = project.time,
    maxParticipants = project.max_participants,
    status = project.status
  } = req.body;

  const address = location?.address || req.body.address || project.address;

  db.prepare(`
    UPDATE projects
    SET title = ?, event_type = ?, custom_event_type = ?, attendee_privacy = ?, chat_privacy = ?, description = ?, address = ?, date = ?, time = ?, max_participants = ?, status = ?
    WHERE id = ?
  `).run(
    title,
    eventType,
    customEventType !== undefined ? customEventType : project.custom_event_type,
    attendeePrivacy || 'public',
    chatPrivacy || 'members_only',
    description,
    address,
    date,
    time,
    maxParticipants,
    status,
    req.params.id
  );

  res.json(formatProject(db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)));
});

// DELETE /api/projects/:id
router.delete('/:id', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : (req.query.userId || req.body?.userId);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required to delete an event.' });
  }

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Event / project not found' });
  }

  const user = req.user || db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (project.organizer_id !== userId && !isPlatformAdmin(user)) {
    return res.status(403).json({ error: 'Only the organizer or platform administrators can delete this event.' });
  }

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM project_participants WHERE project_id = ?').run(req.params.id);
    db.prepare('DELETE FROM project_messages WHERE project_id = ?').run(req.params.id);
    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  });
  tx();

  res.json({ success: true, id: req.params.id });
});

export default router;
