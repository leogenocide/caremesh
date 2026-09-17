import express from 'express';
import { db } from '../db/database.js';
import { formatUser } from './auth.js';
import { optionalAuth } from '../middleware/auth.js';
import { parsePaginationParams, executePaginatedQuery } from '../utils/pagination.js';

const router = express.Router();

export function formatObservation(row) {
  if (!row) return null;

  const authorRow = db.prepare('SELECT * FROM users WHERE id = ?').get(row.author_id);
  const author = authorRow ? formatUser(authorRow) : { id: row.author_id, name: 'Anonymous' };

  const evRows = db.prepare(`
    SELECT e.id FROM observation_evidence oe
    JOIN evidence e ON oe.evidence_id = e.id
    WHERE oe.observation_id = ?
  `).all(row.id);

  const claimRows = db.prepare(`SELECT id FROM claims WHERE observation_id = ?`).all(row.id);

  const supObsRows = db.prepare(`
    SELECT source_observation_id FROM observation_relations
    WHERE target_observation_id = ? AND relation_type = 'supporting'
  `).all(row.id);

  const contraObsRows = db.prepare(`
    SELECT source_observation_id FROM observation_relations
    WHERE target_observation_id = ? AND relation_type = 'contradictory'
  `).all(row.id);

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    location: {
      address: row.address,
      neighborhood: row.neighborhood,
      lat: row.lat,
      lng: row.lng
    },
    author,
    timestamp: row.timestamp,
    mediaUrls: JSON.parse(row.media_urls || '[]'),
    status: row.status,
    isSupporting: Boolean(row.is_supporting),
    supportingTargetId: row.supporting_target_id,
    isContradiction: Boolean(row.is_contradiction),
    contradictionTargetId: row.contradiction_target_id,
    referencedEvidenceId: row.referenced_evidence_id || null,
    referencedEvidenceTitle: row.referenced_evidence_title || null,
    claimIds: claimRows.map(c => c.id),
    evidenceIds: evRows.map(e => e.id),
    supportingObservationIds: supObsRows.map(r => r.source_observation_id),
    contradictoryObservationIds: contraObsRows.map(r => r.source_observation_id),
    relatedRequestIds: [],
    relatedResourceIds: [],
    relatedEventIds: [],
    relatedPlanIds: []
  };
}

// GET /api/observations
router.get('/', (req, res) => {
  const { isPaginated, page, limit } = parsePaginationParams(req.query);
  const { category, status } = req.query;
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

  const whereSql = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';
  const countSql = `SELECT COUNT(*) FROM observations${whereSql}`;
  const dataSql = `SELECT * FROM observations${whereSql} ORDER BY created_at DESC`;

  if (isPaginated) {
    const result = executePaginatedQuery(db, {
      countSql,
      countParams: params,
      dataSql,
      dataParams: params,
      page,
      limit,
      formatter: formatObservation
    });
    return res.json(result);
  }

  const rows = db.prepare(dataSql).all(...params);
  res.json(rows.map(formatObservation));
});

// GET /api/observations/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM observations WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Observation not found' });
  }
  res.json(formatObservation(row));
});

// POST /api/observations
router.post('/', optionalAuth, (req, res) => {
  const {
    title,
    category,
    description,
    location,
    mediaUrls = [],
    status,
    isSupporting,
    supportingTargetId,
    isContradiction,
    contradictionTargetId,
    referencedEvidenceId,
    referencedEvidenceTitle,
    evidenceIds = [],
    claimText
  } = req.body;

  if (!title || !description || !category) {
    return res.status(400).json({ error: 'Title, description, and category are required.' });
  }

  const id = `obs_${Date.now()}`;
  const authorId = req.user ? req.user.id : (req.body.authorId || req.body.author?.id || 'usr_me');
  const obsStatus = status || (isContradiction ? 'resolved_disputed' : 'action_underway');
  const timestamp = 'Just now';

  const tx = db.transaction(() => {
    // 1. Insert Observation
    db.prepare(`
      INSERT INTO observations (id, title, category, description, address, neighborhood, lat, lng, author_id, timestamp, media_urls, status, is_supporting, supporting_target_id, is_contradiction, contradiction_target_id, referenced_evidence_id, referenced_evidence_title)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title,
      category,
      description,
      location?.address || 'Maplewood Local Area',
      location?.neighborhood || 'Maplewood',
      location?.lat || 37.7749,
      location?.lng || -122.4194,
      authorId,
      timestamp,
      JSON.stringify(mediaUrls),
      obsStatus,
      isSupporting ? 1 : 0,
      supportingTargetId || null,
      isContradiction ? 1 : 0,
      contradictionTargetId || null,
      referencedEvidenceId || null,
      referencedEvidenceTitle || null
    );

    // 2. Link Evidence
    for (const evId of evidenceIds) {
      db.prepare(`
        INSERT OR IGNORE INTO observation_evidence (id, observation_id, evidence_id)
        VALUES (?, ?, ?)
      `).run(`obsev_${id}_${evId}`, id, evId);
    }

    // 3. Link Relations (supporting / contradictory)
    if (isSupporting && supportingTargetId) {
      db.prepare(`
        INSERT OR IGNORE INTO observation_relations (id, source_observation_id, target_observation_id, relation_type)
        VALUES (?, ?, ?, 'supporting')
      `).run(`obsrel_${id}_${supportingTargetId}`, id, supportingTargetId);
    }
    if (isContradiction && contradictionTargetId) {
      db.prepare(`
        INSERT OR IGNORE INTO observation_relations (id, source_observation_id, target_observation_id, relation_type)
        VALUES (?, ?, ?, 'contradictory')
      `).run(`obsrel_${id}_${contradictionTargetId}`, id, contradictionTargetId);
    }

    // 4. Create Claim if claimText provided
    if (claimText) {
      const claimId = `clm_${Date.now()}`;
      db.prepare(`
        INSERT INTO claims (id, observation_id, assertion_text, status, assessment_notes, last_updated, author_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        claimId,
        id,
        claimText,
        'under_assessment',
        'Registered with observation.',
        'Just now',
        authorId
      );

      for (const evId of evidenceIds) {
        db.prepare(`
          INSERT OR IGNORE INTO claim_evidence (id, claim_id, evidence_id, is_supporting)
          VALUES (?, ?, ?, 1)
        `).run(`clmev_${claimId}_${evId}_1`, claimId, evId);
      }
    }
  });

  tx();

  const created = formatObservation(db.prepare('SELECT * FROM observations WHERE id = ?').get(id));
  res.status(201).json(created);
});

// POST /api/observations/:id/relations
router.post('/:id/relations', optionalAuth, (req, res) => {
  const { targetObservationId, relationType } = req.body;
  if (!targetObservationId || !relationType) {
    return res.status(400).json({ error: 'targetObservationId and relationType are required' });
  }

  const relationId = `obsrel_${req.params.id}_${targetObservationId}`;
  db.prepare(`
    INSERT OR REPLACE INTO observation_relations (id, source_observation_id, target_observation_id, relation_type)
    VALUES (?, ?, ?, ?)
  `).run(relationId, req.params.id, targetObservationId, relationType);

  res.json({ success: true, relationId });
});

// PATCH /api/observations/:id
router.patch('/:id', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : (req.body.userId || 'usr_me');
  const obs = db.prepare('SELECT * FROM observations WHERE id = ?').get(req.params.id);
  if (!obs) {
    return res.status(404).json({ error: 'Observation not found' });
  }

  if (obs.author_id !== userId) {
    return res.status(403).json({ error: 'Only the author can edit this observation.' });
  }

  const {
    title = obs.title,
    category = obs.category,
    description = obs.description,
    location,
    status = obs.status,
    mediaUrls
  } = req.body;

  const address = location?.address || req.body.address || obs.address;
  const neighborhood = location?.neighborhood || req.body.neighborhood || obs.neighborhood;
  const mediaUrlsJson = mediaUrls !== undefined ? JSON.stringify(mediaUrls) : obs.media_urls;

  db.prepare(`
    UPDATE observations
    SET title = ?, category = ?, description = ?, address = ?, neighborhood = ?, status = ?, media_urls = ?
    WHERE id = ?
  `).run(title, category, description, address, neighborhood, status, mediaUrlsJson, req.params.id);

  res.json(formatObservation(db.prepare('SELECT * FROM observations WHERE id = ?').get(req.params.id)));
});

// DELETE /api/observations/:id
router.delete('/:id', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : (req.query.userId || req.body?.userId || 'usr_me');
  const obs = db.prepare('SELECT * FROM observations WHERE id = ?').get(req.params.id);
  if (!obs) {
    return res.status(404).json({ error: 'Observation not found' });
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
  const isAuthor = obs.author_id === userId;

  if (!isAuthor && !isAdmin) {
    return res.status(403).json({ error: 'Only the observation author or an administrator can delete this observation.' });
  }

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM observation_evidence WHERE observation_id = ?').run(req.params.id);
    db.prepare('DELETE FROM observation_relations WHERE source_observation_id = ? OR target_observation_id = ?').run(req.params.id, req.params.id);
    db.prepare('DELETE FROM safety_report_observations WHERE observation_id = ?').run(req.params.id);
    db.prepare('DELETE FROM observations WHERE id = ?').run(req.params.id);
  });
  tx();

  res.json({ success: true, id: req.params.id });
});

export default router;
