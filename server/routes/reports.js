import express from 'express';
import { db, logModerationAudit } from '../db/database.js';
import { formatUser } from './auth.js';
import { optionalAuth } from '../middleware/auth.js';
import { parsePaginationParams, executePaginatedQuery } from '../utils/pagination.js';

const router = express.Router();

export const DEFAULT_SAFE_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

export function formatReport(row) {
  if (!row) return null;

  const reportedUserRow = db.prepare('SELECT * FROM users WHERE id = ?').get(row.reported_user_id);
  const reportedUser = reportedUserRow ? formatUser(reportedUserRow) : { id: row.reported_user_id, name: 'Unknown Member' };

  const reporterRow = db.prepare('SELECT * FROM users WHERE id = ?').get(row.reporter_id);
  const reporter = reporterRow ? formatUser(reporterRow) : { id: row.reporter_id, name: 'Community Member' };

  let resolvedBy = null;
  if (row.resolved_by_id) {
    const resolverRow = db.prepare('SELECT * FROM users WHERE id = ?').get(row.resolved_by_id);
    resolvedBy = resolverRow ? formatUser(resolverRow) : { id: row.resolved_by_id, name: 'Moderator' };
  }

  let community = null;
  if (row.community_id) {
    community = db.prepare('SELECT id, name, handle FROM communities WHERE id = ?').get(row.community_id);
  }

  return {
    id: row.id,
    type: row.type,
    targetType: row.type,
    scope: row.scope || (row.type === 'post' || row.type === 'comment' ? 'community' : 'public_records'),
    targetId: row.target_id,
    targetTitle: row.target_title,
    targetContent: row.target_content,
    reportedUser,
    reportedUserId: row.reported_user_id,
    reporter,
    reporterId: row.reporter_id,
    community,
    communityId: row.community_id,
    reason: row.reason,
    details: row.details,
    status: row.status,
    actionTaken: row.action_taken,
    resolvedBy,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at
  };
}

// GET /api/reports
router.get('/', optionalAuth, (req, res) => {
  const { isPaginated, page, limit } = parsePaginationParams(req.query);
  const { communityId, type, status, scope } = req.query;
  const currentUserId = req.user?.id || req.query.userId;
  const currentUserRow = currentUserId ? db.prepare('SELECT role, is_public_moderator FROM users WHERE id = ?').get(currentUserId) : null;
  const isGlobalMod = currentUserRow && (currentUserRow.role === 'admin' || currentUserRow.role === 'System Administrator' || Boolean(currentUserRow.is_public_moderator));

  const whereClauses = [];
  const params = [];

  if (!isGlobalMod) {
    whereClauses.push(`(
      reporter_id = ?
      OR (community_id IS NOT NULL AND community_id IN (
        SELECT community_id FROM community_members WHERE user_id = ? AND role IN ('admin', 'moderator')
      ))
    )`);
    params.push(currentUserId, currentUserId);
  }

  if (communityId) {
    whereClauses.push('community_id = ?');
    params.push(communityId);
  }
  if (scope) {
    whereClauses.push('scope = ?');
    params.push(scope);
  }
  if (type) {
    whereClauses.push('type = ?');
    params.push(type);
  }
  if (status) {
    whereClauses.push('status = ?');
    params.push(status);
  }

  const whereSql = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';
  const countSql = `SELECT COUNT(*) FROM reports${whereSql}`;
  const dataSql = `SELECT * FROM reports${whereSql} ORDER BY created_at DESC`;

  if (isPaginated) {
    const result = executePaginatedQuery(db, {
      countSql,
      countParams: params,
      dataSql,
      dataParams: params,
      page,
      limit,
      formatter: formatReport
    });
    return res.json(result);
  }

  const rows = db.prepare(dataSql).all(...params);
  res.json(rows.map(formatReport));
});

// POST /api/reports
router.post('/', optionalAuth, (req, res) => {
  const reporterId = req.user?.id || req.body?.reporterId;
  if (!reporterId) {
    return res.status(401).json({ error: 'Authentication required to submit a report.' });
  }
  const {
    type,
    targetType,
    scope,
    targetId,
    targetTitle = '',
    targetContent = '',
    reportedUserId,
    communityId = null,
    reason,
    details = '',
    notes = ''
  } = req.body;

  const resolvedType = type || targetType;
  let resolvedReportedUserId = reportedUserId || req.body.reported_user_id;

  if (!resolvedReportedUserId && resolvedType === 'post' && targetId) {
    const post = db.prepare('SELECT author_id FROM posts WHERE id = ?').get(targetId);
    if (post) resolvedReportedUserId = post.author_id;
  }
  if (!resolvedReportedUserId && (resolvedType === 'profile_picture' || resolvedType === 'user_avatar' || resolvedType === 'user' || (targetId && String(targetId).startsWith('usr_')))) {
    resolvedReportedUserId = targetId;
  }
  if (!resolvedReportedUserId) {
    resolvedReportedUserId = 'usr_system';
  }

  if (!resolvedType || !targetId || !reason) {
    return res.status(400).json({ error: 'type, targetId, and reason are required.' });
  }

  // Self-report prevention
  if (resolvedReportedUserId && resolvedReportedUserId === reporterId) {
    return res.status(400).json({ error: 'You cannot report yourself or your own content.' });
  }

  // Duplicate pending report check
  const existingPending = db.prepare(`
    SELECT id FROM reports
    WHERE reporter_id = ? AND target_id = ? AND status = 'pending'
  `).get(reporterId, targetId);

  if (existingPending) {
    return res.status(400).json({ error: 'You have already submitted a pending report for this item.' });
  }

  const id = `rep_${Date.now()}`;
  const resolvedDetails = notes || details || '';

  db.prepare(`
    INSERT INTO reports (id, reporter_id, reported_user_id, community_id, type, scope, target_id, target_title, target_content, reason, details, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(
    id,
    reporterId,
    resolvedReportedUserId || null,
    communityId || null,
    resolvedType,
    scope || 'community',
    targetId,
    targetTitle || null,
    targetContent || null,
    reason,
    resolvedDetails
  );

  const created = formatReport(db.prepare('SELECT * FROM reports WHERE id = ?').get(id));
  res.status(201).json(created);
});

// PATCH /api/reports/:id
router.patch('/:id', optionalAuth, (req, res) => {
  const moderatorId = req.user?.id || req.body?.moderatorId;
  if (!moderatorId) {
    return res.status(401).json({ error: 'Authentication required to resolve reports.' });
  }
  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);

  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  const { action = 'dismiss', notes = '' } = req.body;
  let status = 'resolved';
  let actionTaken = action;

  const tx = db.transaction(() => {
    if (action === 'dismiss') {
      status = 'dismissed';
      actionTaken = 'none';
      logModerationAudit(db, {
        moderatorId,
        moderatorRole: 'moderator',
        communityId: report.community_id,
        actionType: 'dismiss_report',
        targetType: report.type,
        targetId: report.target_id,
        targetAuthorId: report.reported_user_id,
        reason: report.reason,
        notes: notes || 'Report dismissed'
      });
    } else if (action === 'remove_post') {
      // Soft-moderation: Quarantine post to preserve evidence in Evidence Vault
      db.prepare(`
        UPDATE posts
        SET is_quarantined = 1,
            quarantined_at = CURRENT_TIMESTAMP,
            quarantined_by_id = ?,
            quarantine_reason = ?
        WHERE id = ?
      `).run(moderatorId, notes || report.reason || 'Flagged harmful content quarantined by moderator', report.target_id);

      logModerationAudit(db, {
        moderatorId,
        moderatorRole: 'moderator',
        communityId: report.community_id,
        actionType: 'quarantine_post',
        targetType: 'post',
        targetId: report.target_id,
        targetAuthorId: report.reported_user_id,
        targetContentSnapshot: { title: report.target_title, content: report.target_content },
        reason: report.reason,
        notes
      });
    } else if (action === 'restrict_and_purge') {
      // Soft-moderation quarantine post + restrict account
      db.prepare(`
        UPDATE posts
        SET is_quarantined = 1,
            quarantined_at = CURRENT_TIMESTAMP,
            quarantined_by_id = ?,
            quarantine_reason = ?
        WHERE id = ?
      `).run(moderatorId, notes || report.reason || 'Restricted and quarantined due to severe violation', report.target_id);

      if (report.reported_user_id) {
        db.prepare(`
          UPDATE users
          SET status = 'restricted',
              restriction_reason = ?,
              restricted_at = CURRENT_TIMESTAMP,
              restricted_by_id = ?
          WHERE id = ?
        `).run(notes || report.reason || 'Account restricted following disciplinary report', moderatorId, report.reported_user_id);
      }

      logModerationAudit(db, {
        moderatorId,
        moderatorRole: 'moderator',
        communityId: report.community_id,
        actionType: 'restrict_and_quarantine',
        targetType: report.type,
        targetId: report.target_id,
        targetAuthorId: report.reported_user_id,
        targetContentSnapshot: { title: report.target_title, content: report.target_content },
        reason: report.reason,
        notes
      });
    } else if (action === 'remove_observation') {
      db.prepare('DELETE FROM observation_evidence WHERE observation_id = ?').run(report.target_id);
      db.prepare('DELETE FROM observation_relations WHERE source_observation_id = ? OR target_observation_id = ?').run(report.target_id, report.target_id);
      db.prepare('DELETE FROM safety_report_observations WHERE observation_id = ?').run(report.target_id);
      db.prepare('DELETE FROM observations WHERE id = ?').run(report.target_id);

      logModerationAudit(db, {
        moderatorId,
        moderatorRole: 'moderator',
        communityId: report.community_id,
        actionType: 'remove_observation',
        targetType: 'observation',
        targetId: report.target_id,
        targetAuthorId: report.reported_user_id,
        targetContentSnapshot: { title: report.target_title, content: report.target_content },
        reason: report.reason,
        notes
      });
    } else if (action === 'remove_request') {
      db.prepare('DELETE FROM quick_actions WHERE request_id = ?').run(report.target_id);
      db.prepare('DELETE FROM request_responses WHERE request_id = ?').run(report.target_id);
      db.prepare('DELETE FROM resource_assignments WHERE request_id = ?').run(report.target_id);
      db.prepare('DELETE FROM requests WHERE id = ?').run(report.target_id);

      logModerationAudit(db, {
        moderatorId,
        moderatorRole: 'moderator',
        communityId: report.community_id,
        actionType: 'remove_request',
        targetType: 'request',
        targetId: report.target_id,
        targetAuthorId: report.reported_user_id,
        reason: report.reason,
        notes
      });
    } else if (action === 'remove_resource') {
      db.prepare('DELETE FROM resource_assignments WHERE resource_id = ?').run(report.target_id);
      db.prepare('DELETE FROM resources WHERE id = ?').run(report.target_id);

      logModerationAudit(db, {
        moderatorId,
        moderatorRole: 'moderator',
        communityId: report.community_id,
        actionType: 'remove_resource',
        targetType: 'resource',
        targetId: report.target_id,
        targetAuthorId: report.reported_user_id,
        reason: report.reason,
        notes
      });
    } else if (action === 'reset_avatar') {
      db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(DEFAULT_SAFE_AVATAR, report.reported_user_id);

      logModerationAudit(db, {
        moderatorId,
        moderatorRole: 'moderator',
        communityId: report.community_id,
        actionType: 'reset_avatar',
        targetType: 'user',
        targetId: report.reported_user_id,
        targetAuthorId: report.reported_user_id,
        reason: report.reason,
        notes
      });
    } else if (action === 'kick_member' && report.community_id) {
      db.prepare('DELETE FROM community_members WHERE community_id = ? AND user_id = ?').run(report.community_id, report.reported_user_id);

      logModerationAudit(db, {
        moderatorId,
        moderatorRole: 'moderator',
        communityId: report.community_id,
        actionType: 'kick_member',
        targetType: 'user',
        targetId: report.reported_user_id,
        targetAuthorId: report.reported_user_id,
        reason: report.reason,
        notes
      });
    }

    db.prepare(`
      UPDATE reports
      SET status = ?, action_taken = ?, resolved_by_id = ?, resolved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, actionTaken, moderatorId, req.params.id);

    if (notes) {
      db.prepare('UPDATE reports SET details = details || ? WHERE id = ?').run(` [Moderator Note: ${notes}]`, req.params.id);
    }
  });

  tx();

  const updated = formatReport(db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id));
  res.json(updated);
});

export default router;
