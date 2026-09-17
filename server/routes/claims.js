import express from 'express';
import { db } from '../db/database.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

export function formatClaim(row) {
  if (!row) return null;

  const supEvRows = db.prepare(`SELECT evidence_id FROM claim_evidence WHERE claim_id = ? AND is_supporting = 1`).all(row.id);
  const contraEvRows = db.prepare(`SELECT evidence_id FROM claim_evidence WHERE claim_id = ? AND is_supporting = 0`).all(row.id);
  const disputeRows = db.prepare(`SELECT id FROM disputes WHERE claim_id = ?`).all(row.id);

  return {
    id: row.id,
    observationId: row.observation_id,
    assertionText: row.assertion_text,
    status: row.status,
    supportingEvidenceIds: supEvRows.map(r => r.evidence_id),
    contradictingEvidenceIds: contraEvRows.map(r => r.evidence_id),
    disputeIds: disputeRows.map(r => r.id),
    assessmentNotes: row.assessment_notes || '',
    lastUpdated: row.last_updated || 'Today'
  };
}

// GET /api/claims
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM claims ORDER BY created_at DESC').all();
  res.json(rows.map(formatClaim));
});

// GET /api/claims/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM claims WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Claim not found' });
  }
  res.json(formatClaim(row));
});

// POST /api/claims
router.post('/', optionalAuth, (req, res) => {
  const { observationId, assertionText, status, assessmentNotes, supportingEvidenceIds = [], contradictingEvidenceIds = [] } = req.body;

  if (!observationId || !assertionText) {
    return res.status(400).json({ error: 'observationId and assertionText are required.' });
  }

  const id = `clm_${Date.now()}`;
  const claimStatus = status || 'under_assessment';
  const authorId = req.user ? req.user.id : null;
  const lastUpdated = 'Just now';

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO claims (id, observation_id, assertion_text, status, assessment_notes, last_updated, author_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, observationId, assertionText, claimStatus, assessmentNotes || '', lastUpdated, authorId);

    for (const evId of supportingEvidenceIds) {
      db.prepare(`
        INSERT OR IGNORE INTO claim_evidence (id, claim_id, evidence_id, is_supporting)
        VALUES (?, ?, ?, 1)
      `).run(`clmev_${id}_${evId}_1`, id, evId);
    }

    for (const evId of contradictingEvidenceIds) {
      db.prepare(`
        INSERT OR IGNORE INTO claim_evidence (id, claim_id, evidence_id, is_supporting)
        VALUES (?, ?, ?, 0)
      `).run(`clmev_${id}_${evId}_0`, id, evId);
    }
  });

  tx();

  const created = formatClaim(db.prepare('SELECT * FROM claims WHERE id = ?').get(id));
  res.status(201).json(created);
});

// PATCH /api/claims/:id/status
router.patch('/:id/status', optionalAuth, (req, res) => {
  const { status, assessmentNotes } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(req.params.id);
  if (!claim) {
    return res.status(404).json({ error: 'Claim not found' });
  }

  const updatedNotes = assessmentNotes !== undefined ? assessmentNotes : claim.assessment_notes;
  db.prepare(`
    UPDATE claims
    SET status = ?, assessment_notes = ?, last_updated = ?
    WHERE id = ?
  `).run(status, updatedNotes, 'Just now', req.params.id);

  res.json(formatClaim(db.prepare('SELECT * FROM claims WHERE id = ?').get(req.params.id)));
});

export default router;
