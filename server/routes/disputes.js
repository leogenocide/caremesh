import express from 'express';
import { db } from '../db/database.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

export function formatDispute(row) {
  if (!row) return null;

  const author = db.prepare('SELECT id, name, role FROM users WHERE id = ?').get(row.author_id);

  let responses;
  try {
    const respRows = db.prepare('SELECT * FROM dispute_responses WHERE dispute_id = ? ORDER BY created_at ASC').all(row.id);
    responses = respRows.map(r => {
      const rAuthor = db.prepare('SELECT id, name, role FROM users WHERE id = ?').get(r.author_id);
      return {
        id: r.id,
        disputeId: r.dispute_id,
        type: r.type,
        author: rAuthor ? {
          id: rAuthor.id,
          name: rAuthor.name,
          role: rAuthor.role || 'Community Contributor'
        } : { id: r.author_id, name: 'Anonymous', role: 'Community Member' },
        timestamp: r.timestamp,
        reason: r.reason,
        explanation: r.explanation,
        evidenceIds: JSON.parse(r.evidence_ids || '[]')
      };
    });
  } catch {
    responses = [];
  }

  return {
    id: row.id,
    claimId: row.claim_id,
    observationId: row.observation_id,
    author: author ? {
      id: author.id,
      name: author.name,
      role: author.role || 'Community Contributor'
    } : { id: row.author_id, name: 'Anonymous', role: 'Community Member' },
    timestamp: row.timestamp,
    reason: row.reason,
    explanation: row.explanation,
    counterEvidenceIds: JSON.parse(row.counter_evidence_ids || '[]'),
    relatedObservationId: row.related_observation_id,
    status: row.status,
    responses
  };
}

// GET /api/disputes
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM disputes ORDER BY created_at DESC').all();
  res.json(rows.map(formatDispute));
});

// POST /api/disputes
router.post('/', optionalAuth, (req, res) => {
  const { claimId, observationId, reason, explanation, counterEvidenceIds = [], relatedObservationId, status } = req.body;

  if (!reason || !explanation) {
    return res.status(400).json({ error: 'Reason and explanation are required.' });
  }

  const id = `disp_${Date.now()}`;
  const authorId = req.user ? req.user.id : (req.body.author?.id || 'usr_me');
  const disputeStatus = status || 'active_challenge';
  const timestamp = 'Just now';

  const tx = db.transaction(() => {
    // 1. Insert dispute record
    db.prepare(`
      INSERT INTO disputes (id, claim_id, observation_id, author_id, timestamp, reason, explanation, counter_evidence_ids, related_observation_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      claimId || null,
      observationId || null,
      authorId,
      timestamp,
      reason,
      explanation,
      JSON.stringify(counterEvidenceIds),
      relatedObservationId || null,
      disputeStatus
    );

    // 2. Update claim status to 'disputed' if not already
    if (claimId) {
      db.prepare(`
        UPDATE claims
        SET status = 'disputed', last_updated = 'Just now'
        WHERE id = ?
      `).run(claimId);

      // Attach counter evidence to claim
      for (const evId of counterEvidenceIds) {
        db.prepare(`
          INSERT OR IGNORE INTO claim_evidence (id, claim_id, evidence_id, is_supporting)
          VALUES (?, ?, ?, 0)
        `).run(`clmev_${claimId}_${evId}_0`, claimId, evId);
      }
    }

    // 3. Update observation status if observationId supplied
    if (observationId) {
      db.prepare(`
        UPDATE observations
        SET status = 'disputed'
        WHERE id = ?
      `).run(observationId);
    }
  });

  tx();

  const created = formatDispute(db.prepare('SELECT * FROM disputes WHERE id = ?').get(id));
  res.status(201).json(created);
});

// PATCH /api/disputes/:id/status
router.patch('/:id/status', optionalAuth, (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  db.prepare(`UPDATE disputes SET status = ? WHERE id = ?`).run(status, req.params.id);
  const updated = formatDispute(db.prepare('SELECT * FROM disputes WHERE id = ?').get(req.params.id));
  res.json(updated);
});

// POST /api/disputes/:id/responses
router.post('/:id/responses', optionalAuth, (req, res) => {
  const dispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(req.params.id);
  if (!dispute) {
    return res.status(404).json({ error: 'Dispute not found' });
  }

  const { type, reason, explanation, evidenceIds = [] } = req.body;
  if (!type || !explanation) {
    return res.status(400).json({ error: 'Type (support or challenge) and explanation are required.' });
  }

  const id = `dresp_${Date.now()}`;
  const authorId = req.user ? req.user.id : (req.body.author?.id || 'usr_me');
  const timestamp = 'Just now';

  db.prepare(`
    INSERT INTO dispute_responses (id, dispute_id, type, author_id, timestamp, reason, explanation, evidence_ids)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    req.params.id,
    type,
    authorId,
    timestamp,
    reason || (type === 'support' ? 'Supporting Corroboration' : 'Counter-Challenge / Rebuttal'),
    explanation.trim(),
    JSON.stringify(evidenceIds)
  );

  const author = db.prepare('SELECT id, name, role FROM users WHERE id = ?').get(authorId);
  const created = {
    id,
    disputeId: req.params.id,
    type,
    author: author ? {
      id: author.id,
      name: author.name,
      role: author.role || 'Community Contributor'
    } : { id: authorId, name: 'Anonymous', role: 'Community Member' },
    timestamp,
    reason: reason || (type === 'support' ? 'Supporting Corroboration' : 'Counter-Challenge / Rebuttal'),
    explanation: explanation.trim(),
    evidenceIds
  };

  res.status(201).json(created);
});

// DELETE /api/disputes/:id
router.delete('/:id', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : (req.query.userId || req.body?.userId || 'usr_me');
  const disp = db.prepare('SELECT * FROM disputes WHERE id = ?').get(req.params.id);
  if (!disp) {
    return res.status(404).json({ error: 'Dispute not found' });
  }

  const user = req.user || db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const isAdmin = user && (
    user.role === 'admin' || 
    user.role === 'coordinator' || 
    user.role === 'Emergency Coordinator' || 
    user.role === 'Admin' || 
    Boolean(user.is_public_moderator)
  );
  const isAuthor = disp.author_id === userId;

  if (!isAuthor && !isAdmin) {
    return res.status(403).json({ error: 'Only the dispute author or an administrator can delete this dispute.' });
  }

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM dispute_responses WHERE dispute_id = ?').run(req.params.id);
    db.prepare('DELETE FROM disputes WHERE id = ?').run(req.params.id);
  });
  tx();

  res.json({ success: true, id: req.params.id });
});

// DELETE /api/disputes/:id/responses/:responseId
router.delete('/:id/responses/:responseId', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : (req.query.userId || req.body?.userId || 'usr_me');
  const response = db.prepare('SELECT * FROM dispute_responses WHERE id = ? AND dispute_id = ?').get(req.params.responseId, req.params.id);
  if (!response) {
    return res.status(404).json({ error: 'Dispute response not found' });
  }

  const disp = db.prepare('SELECT * FROM disputes WHERE id = ?').get(req.params.id);
  const user = req.user || db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const isAdmin = user && (
    user.role === 'admin' || 
    user.role === 'coordinator' || 
    user.role === 'Emergency Coordinator' || 
    user.role === 'Admin' || 
    Boolean(user.is_public_moderator)
  );
  const isResponseAuthor = response.author_id === userId;
  const isDisputeAuthor = disp && disp.author_id === userId;

  if (!isResponseAuthor && !isDisputeAuthor && !isAdmin) {
    return res.status(403).json({ error: 'Only the response author, dispute author, or an administrator can delete this response.' });
  }

  db.prepare('DELETE FROM dispute_responses WHERE id = ?').run(req.params.responseId);

  res.json({ success: true, id: req.params.responseId });
});

export default router;
