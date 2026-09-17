import express from 'express';
import { db } from '../db/database.js';
import { formatUser } from './auth.js';
import { optionalAuth } from '../middleware/auth.js';
import { parsePaginationParams, executePaginatedQuery } from '../utils/pagination.js';

const router = express.Router();

export function formatRequest(row) {
  if (!row) return null;

  const requesterRow = db.prepare('SELECT * FROM users WHERE id = ?').get(row.requester_id);
  const requester = requesterRow ? formatUser(requesterRow) : { id: row.requester_id, name: 'Anonymous' };

  const qaRows = db.prepare('SELECT * FROM quick_actions WHERE request_id = ?').all(row.id);
  const quickActions = qaRows.map(qa => ({
    id: qa.id,
    title: qa.title,
    actionType: qa.action_type,
    timeEstimate: qa.time_estimate,
    neededContribution: qa.needed_contribution
  }));

  const respRows = db.prepare(`
    SELECT rr.*, u.id as u_id, u.name, u.role, u.avatar
    FROM request_responses rr
    JOIN users u ON rr.user_id = u.id
    WHERE rr.request_id = ?
    ORDER BY rr.created_at DESC
  `).all(row.id);
  const responses = respRows.map(r => ({
    user: { id: r.u_id, name: r.name, role: r.role, avatar: r.avatar },
    role: r.role,
    time: r.time
  }));

  // Find persistent assignments
  const assignmentRows = db.prepare('SELECT resource_id FROM resource_assignments WHERE request_id = ?').all(row.id);
  const matchedResourceIds = assignmentRows.map(a => a.resource_id);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    location: {
      address: row.address,
      lat: row.lat,
      lng: row.lng
    },
    urgency: row.urgency,
    requiredSkills: JSON.parse(row.required_skills || '[]'),
    requiredResources: JSON.parse(row.required_resources || '[]'),
    peopleNeeded: row.people_needed,
    peopleJoined: row.people_joined,
    progressPercentage: row.progress_percentage,
    status: row.status,
    requester,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    communityId: row.community_id || null,
    visibility: row.visibility || 'public',
    scheduledDate: row.scheduled_date || null,
    scheduledTime: row.scheduled_time || null,
    matchedResourceIds,
    quickActions,
    responses,
    evidenceIds: []
  };
}

// GET /api/requests
router.get('/', optionalAuth, (req, res) => {
  const { isPaginated, page, limit } = parsePaginationParams(req.query);
  const { category, status, urgency, communityId } = req.query;
  const whereClauses = [];
  const params = [];

  if (category) {
    whereClauses.push('category = ?');
    params.push(category);
  }
  if (status) {
    whereClauses.push('status = ?');
    params.push(status);
  }
  if (urgency) {
    whereClauses.push('urgency = ?');
    params.push(urgency);
  }
  if (communityId) {
    whereClauses.push('community_id = ?');
    params.push(communityId);
  }

  // Visibility filtering
  const currentUserId = req.user ? req.user.id : null;
  if (currentUserId) {
    whereClauses.push(`(
      (visibility IS NULL OR visibility = 'public')
      OR requester_id = ?
      OR (community_id IS NOT NULL AND community_id IN (SELECT community_id FROM community_members WHERE user_id = ?))
    )`);
    params.push(currentUserId, currentUserId);
  } else {
    whereClauses.push(`(visibility IS NULL OR visibility = 'public')`);
  }

  const whereSql = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';
  const countSql = `SELECT COUNT(*) FROM requests${whereSql}`;
  const dataSql = `SELECT * FROM requests${whereSql} ORDER BY created_at DESC`;

  if (isPaginated) {
    const result = executePaginatedQuery(db, {
      countSql,
      countParams: params,
      dataSql,
      dataParams: params,
      page,
      limit,
      formatter: formatRequest
    });
    return res.json(result);
  }

  const rows = db.prepare(dataSql).all(...params);
  res.json(rows.map(formatRequest));
});

// GET /api/requests/:id
router.get('/:id', optionalAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Request not found' });
  }

  if (row.visibility === 'group_only') {
    const currentUserId = req.user ? req.user.id : null;
    if (!currentUserId) {
      return res.status(403).json({ error: 'Access forbidden: this is a private group request.' });
    }
    const isRequester = row.requester_id === currentUserId;
    let isMember = false;
    if (row.community_id) {
      const membership = db.prepare('SELECT id FROM community_members WHERE community_id = ? AND user_id = ?').get(row.community_id, currentUserId);
      if (membership) isMember = true;
    }
    if (!isRequester && !isMember) {
      return res.status(403).json({ error: 'Access forbidden: you are not a member of the group hosting this request.' });
    }
  }

  res.json(formatRequest(row));
});

// POST /api/requests
router.post('/', optionalAuth, (req, res) => {
  const {
    title,
    description,
    category,
    location,
    urgency = 'medium',
    requiredSkills = [],
    requiredResources = [],
    peopleNeeded = 1,
    quickActions = [],
    communityId = null,
    visibility = 'public',
    scheduledDate = null,
    scheduledTime = null
  } = req.body;

  if (!title || !description || !category) {
    return res.status(400).json({ error: 'Title, description, and category are required.' });
  }

  const id = `req_${Date.now()}`;
  const requesterId = req.user ? req.user.id : (req.body.requesterId || 'usr_me');

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO requests (id, title, description, category, address, lat, lng, urgency, required_skills, required_resources, people_needed, people_joined, progress_percentage, status, requester_id, expires_at, community_id, visibility, scheduled_date, scheduled_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'open', ?, NULL, ?, ?, ?, ?)
    `).run(
      id,
      title,
      description,
      category,
      location?.address || 'Maplewood Local Area',
      location?.lat || 37.7749,
      location?.lng || -122.4194,
      urgency,
      JSON.stringify(requiredSkills),
      JSON.stringify(requiredResources),
      peopleNeeded,
      requesterId,
      communityId,
      visibility,
      scheduledDate,
      scheduledTime
    );

    for (let idx = 0; idx < quickActions.length; idx++) {
      const qa = quickActions[idx];
      db.prepare(`
        INSERT INTO quick_actions (id, request_id, title, action_type, time_estimate, needed_contribution)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(`qa_${id}_${idx}`, id, qa.title || title, qa.actionType || 'volunteer', qa.timeEstimate || '30 mins', qa.neededContribution || description);
    }
  });

  tx();

  const created = formatRequest(db.prepare('SELECT * FROM requests WHERE id = ?').get(id));
  res.status(201).json(created);
});

// POST /api/requests/:id/respond
router.post('/:id/respond', optionalAuth, (req, res) => {
  const { role = 'Volunteer Assistance' } = req.body;
  const userId = req.user ? req.user.id : (req.body.userId || 'usr_me');

  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id);
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  // 1. Poster cannot volunteer on their own request
  if (request.requester_id === userId) {
    return res.status(400).json({ error: 'As the requester, you cannot volunteer for your own help request.' });
  }

  // 2. User cannot volunteer again if already responded
  const existingResponse = db.prepare('SELECT id FROM request_responses WHERE request_id = ? AND user_id = ?').get(req.params.id, userId);
  if (existingResponse) {
    return res.status(400).json({ error: 'You have already volunteered for this request.' });
  }

  const id = `resp_${req.params.id}_${Date.now()}`;
  const time = 'Just now';

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO request_responses (id, request_id, user_id, role, time)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, req.params.id, userId, role, time);

    const newJoined = request.people_joined + 1;
    const progress = Math.min(100, Math.round((newJoined / (request.people_needed || 1)) * 100));
    const newStatus = progress >= 100 ? 'fulfilled' : 'partially_fulfilled';

    db.prepare(`
      UPDATE requests
      SET people_joined = ?, progress_percentage = ?, status = ?
      WHERE id = ?
    `).run(newJoined, progress, newStatus, req.params.id);
  });

  tx();

  res.json(formatRequest(db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id)));
});

// PATCH /api/requests/:id
router.patch('/:id', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : (req.body.userId || 'usr_me');
  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id);
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  const targetCommId = req.body.communityId !== undefined ? req.body.communityId : request.community_id;
  const isOwner = request.requester_id === userId;
  const isExistingCommAdmin = request.community_id ? Boolean(db.prepare("SELECT 1 FROM community_members WHERE community_id = ? AND user_id = ? AND role IN ('admin', 'moderator')").get(request.community_id, userId)) : false;
  const isTargetCommAdmin = targetCommId ? Boolean(db.prepare("SELECT 1 FROM community_members WHERE community_id = ? AND user_id = ? AND role IN ('admin', 'moderator')").get(targetCommId, userId)) : false;
  
  if (!isOwner && !isExistingCommAdmin && !isTargetCommAdmin) {
    return res.status(403).json({ error: 'Only the creator or group admin can edit this request.' });
  }

  const {
    title = request.title,
    description = request.description,
    category = request.category,
    urgency = request.urgency,
    requiredSkills,
    requiredResources,
    peopleNeeded = request.people_needed,
    status = request.status,
    communityId = request.community_id,
    visibility = request.visibility,
    scheduledDate = request.scheduled_date,
    scheduledTime = request.scheduled_time
  } = req.body;

  const skillsJson = requiredSkills !== undefined ? JSON.stringify(requiredSkills) : request.required_skills;
  const resourcesJson = requiredResources !== undefined ? JSON.stringify(requiredResources) : request.required_resources;

  db.prepare(`
    UPDATE requests
    SET title = ?, description = ?, category = ?, urgency = ?, required_skills = ?, required_resources = ?, people_needed = ?, status = ?, community_id = ?, visibility = ?, scheduled_date = ?, scheduled_time = ?
    WHERE id = ?
  `).run(title, description, category, urgency, skillsJson, resourcesJson, peopleNeeded, status, communityId, visibility, scheduledDate, scheduledTime, req.params.id);

  res.json(formatRequest(db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id)));
});

// DELETE /api/requests/:id
router.delete('/:id', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : (req.query.userId || req.body?.userId || 'usr_me');
  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id);
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  const user = req.user || db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const isAdmin = user && (
    user.role === 'Admin' || 
    user.role === 'admin' || 
    user.role === 'coordinator' || 
    user.role === 'Emergency Coordinator' || 
    user.role === 'System Administrator' || 
    Boolean(user.is_public_moderator)
  );
  const isOwner = request.requester_id === userId;

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Only the creator or an administrator can delete this request.' });
  }

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM quick_actions WHERE request_id = ?').run(req.params.id);
    db.prepare('DELETE FROM request_responses WHERE request_id = ?').run(req.params.id);
    db.prepare('DELETE FROM resource_assignments WHERE request_id = ?').run(req.params.id);
    db.prepare('DELETE FROM requests WHERE id = ?').run(req.params.id);
  });
  tx();

  res.json({ success: true, id: req.params.id });
});

export default router;
