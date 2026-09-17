import express from 'express';
import { db } from '../db/database.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

export function formatEvidence(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    author: row.author,
    authorId: row.author_id,
    timestamp: row.timestamp,
    url: row.url,
    description: row.description,
    provenanceChain: JSON.parse(row.provenance_chain || '[]'),
    metadata: JSON.parse(row.metadata || '{}'),
    parentEvidenceId: row.parent_evidence_id || null,
    parentObservationId: row.parent_observation_id || null
  };
}

// GET /api/evidence
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM evidence ORDER BY created_at DESC').all();
  res.json(rows.map(formatEvidence));
});

// GET /api/evidence/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM evidence WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Evidence item not found' });
  }
  res.json(formatEvidence(row));
});

// POST /api/evidence
router.post('/', optionalAuth, (req, res) => {
  const { title, type, url, description, provenanceChain, metadata, observationId, parentEvidenceId, parentObservationId } = req.body;

  if (!title || !type) {
    return res.status(400).json({ error: 'Title and type are required.' });
  }

  const id = `ev_${Date.now()}`;
  const authorName = req.user ? req.user.name : (req.body.author || 'Community Contributor');
  const authorId = req.user ? req.user.id : (req.body.authorId || null);
  const timestamp = 'Just now';

  const defaultProvenance = provenanceChain && provenanceChain.length > 0 ? provenanceChain : [
    { step: 'Evidence verified and registered on CareMesh', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ];

  db.prepare(`
    INSERT INTO evidence (id, title, type, author, author_id, timestamp, url, description, provenance_chain, metadata, parent_evidence_id, parent_observation_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    title,
    type,
    authorName,
    authorId,
    timestamp,
    url || '',
    description || '',
    JSON.stringify(defaultProvenance),
    JSON.stringify(metadata || {}),
    parentEvidenceId || null,
    parentObservationId || observationId || null
  );

  if (observationId) {
    db.prepare(`
      INSERT OR IGNORE INTO observation_evidence (id, observation_id, evidence_id)
      VALUES (?, ?, ?)
    `).run(`obsev_${observationId}_${id}`, observationId, id);
  }

  const created = formatEvidence(db.prepare('SELECT * FROM evidence WHERE id = ?').get(id));
  res.status(201).json(created);
});

// DELETE /api/evidence/:id
router.delete('/:id', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : (req.query.userId || req.body?.userId || 'usr_me');
  const ev = db.prepare('SELECT * FROM evidence WHERE id = ?').get(req.params.id);
  if (!ev) {
    return res.status(404).json({ error: 'Evidence item not found' });
  }

  const user = req.user || db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const isAdmin = user && (
    user.role === 'admin' || 
    user.role === 'coordinator' || 
    user.role === 'Emergency Coordinator' || 
    user.role === 'Admin' || 
    Boolean(user.is_public_moderator)
  );
  const isAuthor = ev.author_id === userId || ev.author === (user?.name || '');

  if (!isAuthor && !isAdmin) {
    return res.status(403).json({ error: 'Only the evidence author or an administrator can delete this evidence record.' });
  }

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM observation_evidence WHERE evidence_id = ?').run(req.params.id);
    db.prepare('DELETE FROM claim_evidence WHERE evidence_id = ?').run(req.params.id);
    db.prepare('DELETE FROM safety_report_evidence WHERE evidence_id = ?').run(req.params.id);
    db.prepare('UPDATE evidence SET parent_evidence_id = NULL WHERE parent_evidence_id = ?').run(req.params.id);
    db.prepare('DELETE FROM evidence WHERE id = ?').run(req.params.id);
  });
  tx();

  res.json({ success: true, id: req.params.id });
});

export default router;
