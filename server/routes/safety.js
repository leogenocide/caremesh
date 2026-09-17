import express from 'express';
import { db } from '../db/database.js';
import { formatUser } from './auth.js';
import { optionalAuth } from '../middleware/auth.js';
import { parsePaginationParams, executePaginatedQuery } from '../utils/pagination.js';

const router = express.Router();

export function formatSafetyReport(row) {
  if (!row) return null;

  const reporterRow = db.prepare('SELECT * FROM users WHERE id = ?').get(row.reporter_id);
  const reporter = reporterRow ? formatUser(reporterRow) : { id: row.reporter_id, name: 'Anonymous' };

  const evRows = db.prepare(`
    SELECT evidence_id FROM safety_report_evidence WHERE safety_report_id = ?
  `).all(row.id);

  const obsRows = db.prepare(`
    SELECT observation_id FROM safety_report_observations WHERE safety_report_id = ?
  `).all(row.id);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    severity: row.severity,
    status: row.status,
    location: {
      address: row.address,
      lat: row.lat,
      lng: row.lng
    },
    timestamp: row.timestamp,
    reporter,
    evidenceIds: evRows.map(r => r.evidence_id),
    relatedObservationIds: obsRows.map(r => r.observation_id),
    mitigationActions: JSON.parse(row.mitigation_actions || '[]'),
    updatesLog: JSON.parse(row.updates_log || '[]')
  };
}

// GET /api/safety
router.get('/', (req, res) => {
  const { isPaginated, page, limit } = parsePaginationParams(req.query);
  const { severity, status } = req.query;
  const whereClauses = [];
  const params = [];

  if (severity) {
    whereClauses.push('severity = ?');
    params.push(severity);
  }
  if (status) {
    whereClauses.push('status = ?');
    params.push(status);
  }

  const whereSql = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';
  const countSql = `SELECT COUNT(*) FROM safety_reports${whereSql}`;
  const dataSql = `SELECT * FROM safety_reports${whereSql} ORDER BY created_at DESC`;

  if (isPaginated) {
    const result = executePaginatedQuery(db, {
      countSql,
      countParams: params,
      dataSql,
      dataParams: params,
      page,
      limit,
      formatter: formatSafetyReport
    });
    return res.json(result);
  }

  const rows = db.prepare(dataSql).all(...params);
  res.json(rows.map(formatSafetyReport));
});

// POST /api/safety
router.post('/', optionalAuth, (req, res) => {
  const { title, description, severity, status, location, evidenceIds = [], relatedObservationIds = [], mitigationActions = [] } = req.body;

  if (!title || !description || !severity) {
    return res.status(400).json({ error: 'Title, description, and severity are required.' });
  }

  const id = `safe_${Date.now()}`;
  const reporterId = req.user ? req.user.id : (req.body.reporterId || 'usr_me');
  const reportStatus = status || 'active';
  const timestamp = 'Just now';

  const defaultUpdates = [
    { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), note: 'Safety alert filed and distributed to local emergency network.' }
  ];

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO safety_reports (id, title, description, severity, status, address, lat, lng, timestamp, reporter_id, mitigation_actions, updates_log)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title,
      description,
      severity,
      reportStatus,
      location?.address || 'Maplewood Local Area',
      location?.lat || 37.7749,
      location?.lng || -122.4194,
      timestamp,
      reporterId,
      JSON.stringify(mitigationActions),
      JSON.stringify(defaultUpdates)
    );

    for (const evId of evidenceIds) {
      db.prepare(`
        INSERT OR IGNORE INTO safety_report_evidence (id, safety_report_id, evidence_id)
        VALUES (?, ?, ?)
      `).run(`safeev_${id}_${evId}`, id, evId);
    }

    for (const obsId of relatedObservationIds) {
      db.prepare(`
        INSERT OR IGNORE INTO safety_report_observations (id, safety_report_id, observation_id)
        VALUES (?, ?, ?)
      `).run(`safeobs_${id}_${obsId}`, id, obsId);
    }
  });

  tx();

  const created = formatSafetyReport(db.prepare('SELECT * FROM safety_reports WHERE id = ?').get(id));
  res.status(201).json(created);
});

// POST /api/safety/:id/updates
router.post('/:id/updates', optionalAuth, (req, res) => {
  const { note } = req.body;
  if (!note) {
    return res.status(400).json({ error: 'Update note is required' });
  }

  const report = db.prepare('SELECT * FROM safety_reports WHERE id = ?').get(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Safety report not found' });
  }

  const logs = JSON.parse(report.updates_log || '[]');
  logs.push({
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    note
  });

  db.prepare(`UPDATE safety_reports SET updates_log = ? WHERE id = ?`).run(JSON.stringify(logs), req.params.id);
  res.json(formatSafetyReport(db.prepare('SELECT * FROM safety_reports WHERE id = ?').get(req.params.id)));
});

// DELETE /api/safety/:id
router.delete('/:id', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : (req.query.userId || req.body?.userId || 'usr_me');
  const report = db.prepare('SELECT * FROM safety_reports WHERE id = ?').get(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Safety report not found' });
  }

  const user = req.user || db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const isAdmin = user && (
    user.role === 'admin' || 
    user.role === 'coordinator' || 
    user.role === 'Emergency Coordinator' || 
    user.role === 'Admin' || 
    Boolean(user.is_public_moderator)
  );
  const isReporter = report.reporter_id === userId;

  if (!isReporter && !isAdmin) {
    return res.status(403).json({ error: 'Only the reporting user or an emergency coordinator/admin can delete this safety report.' });
  }

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM safety_report_evidence WHERE safety_report_id = ?').run(req.params.id);
    db.prepare('DELETE FROM safety_report_observations WHERE safety_report_id = ?').run(req.params.id);
    db.prepare('DELETE FROM safety_reports WHERE id = ?').run(req.params.id);
  });
  tx();

  res.json({ success: true, id: req.params.id });
});

export default router;
