import express from 'express';
import { db } from '../db/database.js';
import { optionalAuth } from '../middleware/auth.js';
import { recalculateAllMatches, evaluateMatch } from '../services/matcherService.js';

const router = express.Router();

// GET /api/matcher/evaluations
// Transparently recalculates all matches from underlying data
router.get('/evaluations', (req, res) => {
  const evaluations = recalculateAllMatches();
  res.json(evaluations);
});

// GET /api/matcher/evaluate/:requestId/:resourceId
// Single pair transparent factor breakdown
router.get('/evaluate/:requestId/:resourceId', (req, res) => {
  const requestRow = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.requestId);
  const resourceRow = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.resourceId);

  if (!requestRow || !resourceRow) {
    return res.status(404).json({ error: 'Request or Resource not found' });
  }

  const evaluation = evaluateMatch(requestRow, resourceRow);
  res.json(evaluation);
});

// GET /api/matcher/assignments
router.get('/assignments', (req, res) => {
  const rows = db.prepare(`
    SELECT ra.*, 
           req.title as request_title, 
           res.title as resource_title,
           u.name as assigned_by_name
    FROM resource_assignments ra
    LEFT JOIN requests req ON ra.request_id = req.id
    LEFT JOIN resources res ON ra.resource_id = res.id
    LEFT JOIN users u ON ra.assigned_by_id = u.id
    ORDER BY ra.assigned_at DESC
  `).all();

  res.json(rows);
});

// POST /api/matcher/assign
// Persistent assignment action (separate from match calculation)
router.post('/assign', optionalAuth, (req, res) => {
  const { requestId, projectId, resourceId, notes = '' } = req.body;

  if (!resourceId || (!requestId && !projectId)) {
    return res.status(400).json({ error: 'resourceId and either requestId or projectId are required.' });
  }

  const id = `asgn_${Date.now()}`;
  const assignedById = req.user ? req.user.id : (req.body.assignedById || 'usr_me');
  const assignedByName = req.user ? req.user.name : 'Maya Lin';

  const tx = db.transaction(() => {
    // 1. Create persistent assignment
    db.prepare(`
      INSERT INTO resource_assignments (id, request_id, project_id, resource_id, assigned_by_id, status, notes)
      VALUES (?, ?, ?, ?, ?, 'accepted', ?)
    `).run(id, requestId || null, projectId || null, resourceId, assignedById, notes);

    // 2. Update request status if relevant
    if (requestId) {
      db.prepare(`
        UPDATE requests
        SET status = 'fulfilled', progress_percentage = 100
        WHERE id = ?
      `).run(requestId);
    }

    // 3. Dispatch notification to requester and provider
    const notifInsert = db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, body, timestamp, is_read, target_view, target_sub_tab, target_entity_id)
      VALUES (?, ?, 'resource_match', 'Resource Assignment Confirmed', ?, 'Just now', 0, 'collaborate', 'matcher', ?)
    `);

    let requesterId = null;
    if (requestId) {
      const reqRow = db.prepare('SELECT requester_id FROM requests WHERE id = ?').get(requestId);
      if (reqRow) requesterId = reqRow.requester_id;
    }
    const resRow = db.prepare('SELECT provider_id FROM resources WHERE id = ?').get(resourceId);
    const providerId = resRow ? resRow.provider_id : null;

    const notifUsers = new Set([requesterId, providerId].filter(Boolean));
    if (notifUsers.size === 0) notifUsers.add('usr_me');

    for (const uid of notifUsers) {
      notifInsert.run(`notif_${Date.now()}_${uid}`, uid, `Resource assigned to request by ${assignedByName}.`, requestId || resourceId);
    }
  });

  tx();

  const created = db.prepare('SELECT * FROM resource_assignments WHERE id = ?').get(id);
  res.status(201).json({ success: true, assignment: created });
});

export default router;
