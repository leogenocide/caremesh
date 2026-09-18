import express from 'express';
import { db, logModerationAudit } from '../db/database.js';
import { formatUser } from './auth.js';
import { formatPost, isSystemAdmin } from './communities.js';
import { formatReport } from './reports.js';
import { optionalAuth } from '../middleware/auth.js';
import { parsePaginationParams, executePaginatedQuery } from '../utils/pagination.js';
import { getRateLimitTelemetry, clearClientRateLimit } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * Require caller to be a System Admin
 */
function requireSystemAdmin(req, res, next) {
  const caller = req.user;

  if (!caller || !isSystemAdmin(caller)) {
    return res.status(403).json({ error: 'Access forbidden: System Administrator privileges required.' });
  }

  req.adminUser = caller;
  next();
}

/**
 * Require caller to be either System Admin or Public Moderator
 * (Public moderators can inspect the evidence vault including circle quarantined discussions)
 */
function requireAdminOrPublicMod(req, res, next) {
  const caller = req.user;

  if (!caller || (!isSystemAdmin(caller) && !caller.is_public_moderator)) {
    return res.status(403).json({ error: 'Access forbidden: System Admin or Public Moderator privileges required.' });
  }

  req.adminUser = caller;
  next();
}

// GET /api/admin/stats
router.get('/stats', optionalAuth, requireSystemAdmin, (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const restrictedUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'restricted'").get().count;
  const activeUsers = totalUsers - restrictedUsers;

  const totalReports = db.prepare('SELECT COUNT(*) as count FROM reports').get().count;
  const pendingReports = db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'").get().count;
  const resolvedReports = totalReports - pendingReports;

  const quarantinedPosts = db.prepare('SELECT COUNT(*) as count FROM posts WHERE is_quarantined = 1').get().count;
  const totalAuditLogs = db.prepare('SELECT COUNT(*) as count FROM moderation_audit_logs').get().count;

  res.json({
    totalUsers,
    activeUsers,
    restrictedUsers,
    totalReports,
    pendingReports,
    resolvedReports,
    quarantinedPosts,
    totalAuditLogs
  });
});

// GET /api/admin/users - Search and filter users by attributes
router.get('/users', optionalAuth, requireSystemAdmin, (req, res) => {
  const { search, role, status, neighborhood, isPublicModerator } = req.query;
  const { isPaginated, page, limit } = parsePaginationParams(req.query);

  const whereClauses = [];
  const params = [];

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    whereClauses.push('(name LIKE ? OR handle LIKE ? OR email LIKE ? OR id LIKE ?)');
    params.push(term, term, term, term);
  }

  if (role) {
    whereClauses.push('LOWER(role) = LOWER(?)');
    params.push(role);
  }

  if (status) {
    whereClauses.push('status = ?');
    params.push(status);
  }

  if (neighborhood) {
    whereClauses.push('LOWER(neighborhood) LIKE LOWER(?)');
    params.push(`%${neighborhood}%`);
  }

  if (isPublicModerator !== undefined) {
    const modVal = isPublicModerator === 'true' || isPublicModerator === '1' || isPublicModerator === true ? 1 : 0;
    whereClauses.push('is_public_moderator = ?');
    params.push(modVal);
  }

  const whereSql = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';
  const countSql = `SELECT COUNT(*) FROM users${whereSql}`;
  const dataSql = `SELECT * FROM users${whereSql} ORDER BY created_at DESC`;

  const enrichUser = (userRow) => {
    const formatted = formatUser(userRow);
    const reportsCount = db.prepare('SELECT COUNT(*) as count FROM reports WHERE reported_user_id = ?').get(userRow.id).count;
    const pendingReportsCount = db.prepare("SELECT COUNT(*) as count FROM reports WHERE reported_user_id = ? AND status = 'pending'").get(userRow.id).count;
    return {
      ...formatted,
      reportsReceivedCount: reportsCount,
      pendingReportsCount
    };
  };

  if (isPaginated) {
    const result = executePaginatedQuery(db, {
      countSql,
      countParams: params,
      dataSql,
      dataParams: params,
      page,
      limit,
      formatter: enrichUser
    });
    return res.json(result);
  }

  const rows = db.prepare(dataSql).all(...params);
  res.json(rows.map(enrichUser));
});

// GET /api/admin/users/:id/reports - Disciplinary dossier / all reports received against this user
router.get('/users/:id/reports', optionalAuth, requireSystemAdmin, (req, res) => {
  const targetUserId = req.params.id;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(targetUserId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const reports = db.prepare(`
    SELECT * FROM reports
    WHERE reported_user_id = ?
    ORDER BY created_at DESC
  `).all(targetUserId).map(formatReport);

  const audits = db.prepare(`
    SELECT mal.*, u.name as moderator_name, u.avatar as moderator_avatar
    FROM moderation_audit_logs mal
    LEFT JOIN users u ON mal.moderator_id = u.id
    WHERE mal.target_author_id = ? OR mal.target_id = ?
    ORDER BY mal.created_at DESC
  `).all(targetUserId, targetUserId);

  const quarantinedPosts = db.prepare(`
    SELECT * FROM posts
    WHERE author_id = ? AND is_quarantined = 1
    ORDER BY quarantined_at DESC
  `).all(targetUserId).map(formatPost);

  res.json({
    user: formatUser(user),
    reportsCount: reports.length,
    reports,
    auditHistory: audits,
    quarantinedPosts
  });
});

// POST /api/admin/users/:id/toggle-public-moderator - Promote or revoke Public Moderator role
router.post('/users/:id/toggle-public-moderator', optionalAuth, requireSystemAdmin, (req, res) => {
  const targetUserId = req.params.id;
  const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(targetUserId);

  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  const newStatus = req.body.isPublicModerator !== undefined
    ? (req.body.isPublicModerator ? 1 : 0)
    : (targetUser.is_public_moderator ? 0 : 1);
  const actionType = newStatus ? 'promote_public_moderator' : 'revoke_public_moderator';
  const reason = req.body.reason || (newStatus ? 'Appointed to Public Records Moderator' : 'Public Records Moderator role revoked');

  db.prepare('UPDATE users SET is_public_moderator = ? WHERE id = ?').run(newStatus, targetUserId);

  logModerationAudit(db, {
    moderatorId: req.adminUser.id,
    moderatorRole: req.adminUser.role || 'System Administrator',
    actionType,
    targetType: 'user',
    targetId: targetUserId,
    targetAuthorId: targetUserId,
    targetContentSnapshot: {
      id: targetUser.id,
      name: targetUser.name,
      handle: targetUser.handle,
      email: targetUser.email,
      previousRole: targetUser.is_public_moderator ? 'Public Moderator' : 'Member'
    },
    reason,
    notes: req.body.notes || `Public Moderator status changed to ${Boolean(newStatus)} by ${req.adminUser.name}`
  });

  const updated = formatUser(db.prepare('SELECT * FROM users WHERE id = ?').get(targetUserId));
  res.json({ success: true, user: updated, isPublicModerator: Boolean(newStatus) });
});

// GET /api/admin/audit-logs - Stream of all moderation audit logs across platform
router.get('/audit-logs', optionalAuth, requireSystemAdmin, (req, res) => {
  const { actionType, targetType, moderatorId, communityId, search } = req.query;
  const { isPaginated, page, limit } = parsePaginationParams(req.query);

  const whereClauses = [];
  const params = [];

  if (actionType) {
    whereClauses.push('mal.action_type = ?');
    params.push(actionType);
  }

  if (targetType) {
    whereClauses.push('mal.target_type = ?');
    params.push(targetType);
  }

  if (moderatorId) {
    whereClauses.push('mal.moderator_id = ?');
    params.push(moderatorId);
  }

  if (communityId) {
    whereClauses.push('mal.community_id = ?');
    params.push(communityId);
  }

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    whereClauses.push('(mal.reason LIKE ? OR mal.notes LIKE ? OR mal.action_type LIKE ? OR u.name LIKE ?)');
    params.push(term, term, term, term);
  }

  const whereSql = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';
  const countSql = `
    SELECT COUNT(*) FROM moderation_audit_logs mal
    LEFT JOIN users u ON mal.moderator_id = u.id
    ${whereSql}
  `;
  const dataSql = `
    SELECT mal.*, u.name as moderator_name, u.avatar as moderator_avatar, c.name as community_name
    FROM moderation_audit_logs mal
    LEFT JOIN users u ON mal.moderator_id = u.id
    LEFT JOIN communities c ON mal.community_id = c.id
    ${whereSql}
    ORDER BY mal.created_at DESC
  `;

  if (isPaginated) {
    const result = executePaginatedQuery(db, {
      countSql,
      countParams: params,
      dataSql,
      dataParams: params,
      page,
      limit,
      formatter: r => r
    });
    return res.json(result);
  }

  const rows = db.prepare(dataSql).all(...params);
  res.json(rows);
});

// GET /api/admin/vault - Quarantined posts across the platform (accessible to System Admin & Public Moderators)
router.get('/vault', optionalAuth, requireAdminOrPublicMod, (req, res) => {
  const { search, communityId } = req.query;
  const { isPaginated, page, limit } = parsePaginationParams(req.query);

  const whereClauses = ['p.is_quarantined = 1'];
  const params = [];

  if (communityId) {
    whereClauses.push('p.community_id = ?');
    params.push(communityId);
  }

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    whereClauses.push('(p.content LIKE ? OR p.quarantine_reason LIKE ? OR u.name LIKE ?)');
    params.push(term, term, term);
  }

  const whereSql = ` WHERE ${whereClauses.join(' AND ')}`;
  const countSql = `
    SELECT COUNT(*) FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    ${whereSql}
  `;
  const dataSql = `
    SELECT p.*, c.name as community_name, c.handle as community_handle,
           qmod.name as quarantined_by_name
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    LEFT JOIN communities c ON p.community_id = c.id
    LEFT JOIN users qmod ON p.quarantined_by_id = qmod.id
    ${whereSql}
    ORDER BY p.quarantined_at DESC, p.created_at DESC
  `;

  const enrichVaultPost = (row) => {
    const post = formatPost(row);
    return {
      ...post,
      communityName: row.community_name || 'Community Circle',
      communityHandle: row.community_handle || '',
      quarantinedByName: row.quarantined_by_name || 'Safety Moderator'
    };
  };

  if (isPaginated) {
    const result = executePaginatedQuery(db, {
      countSql,
      countParams: params,
      dataSql,
      dataParams: params,
      page,
      limit,
      formatter: enrichVaultPost
    });
    return res.json(result);
  }

  const rows = db.prepare(dataSql).all(...params);
  res.json(rows.map(enrichVaultPost));
});

// POST /api/admin/vault/:id/restore - System Admin restores a quarantined post
router.post('/vault/:id/restore', optionalAuth, requireSystemAdmin, (req, res) => {
  const postId = req.params.id;
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  if (!post.is_quarantined) {
    return res.status(400).json({ error: 'Post is not currently quarantined.' });
  }

  db.prepare(`
    UPDATE posts
    SET is_quarantined = 0,
        quarantined_at = NULL,
        quarantined_by_id = NULL,
        quarantine_reason = NULL
    WHERE id = ?
  `).run(postId);

  logModerationAudit(db, {
    moderatorId: req.adminUser.id,
    moderatorRole: req.adminUser.role || 'admin',
    communityId: post.community_id,
    actionType: 'restore_post',
    targetType: 'post',
    targetId: postId,
    targetAuthorId: post.author_id,
    targetContentSnapshot: { content: post.content },
    reason: req.body.reason || 'Restored by System Administrator after review',
    notes: req.body.notes || 'Post cleared of violations and returned to community feed.'
  });

  const restored = formatPost(db.prepare('SELECT * FROM posts WHERE id = ?').get(postId));
  res.json({ success: true, post: restored });
});

// POST /api/admin/vault/:id/purge - System Admin permanently purges a quarantined post
router.post('/vault/:id/purge', optionalAuth, requireSystemAdmin, (req, res) => {
  const postId = req.params.id;
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  // Preserve snapshot for audit trail before permanent purge
  const snapshot = {
    id: post.id,
    authorId: post.author_id,
    communityId: post.community_id,
    content: post.content,
    quarantineReason: post.quarantine_reason
  };

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM post_comments WHERE post_id = ?').run(postId);
    db.prepare('DELETE FROM posts WHERE id = ?').run(postId);
  });
  tx();

  logModerationAudit(db, {
    moderatorId: req.adminUser.id,
    moderatorRole: req.adminUser.role || 'admin',
    communityId: post.community_id,
    actionType: 'purge_post',
    targetType: 'post',
    targetId: postId,
    targetAuthorId: post.author_id,
    targetContentSnapshot: snapshot,
    reason: req.body.reason || 'Permanently purged by System Administrator',
    notes: req.body.notes || 'Irrevocably removed from database following severe safety breach.'
  });

  res.json({ success: true, purgedId: postId });
});

// GET /api/admin/antispam/telemetry - Live rate limiting and anti-spam monitoring
router.get('/antispam/telemetry', optionalAuth, requireSystemAdmin, (req, res) => {
  const telemetry = getRateLimitTelemetry();

  // Query restricted users from database
  const restrictedRows = db.prepare(`
    SELECT id, name, handle, role, avatar, status, restriction_reason, restricted_at, restricted_by_id
    FROM users
    WHERE status = 'restricted'
    ORDER BY restricted_at DESC
  `).all();

  const restrictedUsers = restrictedRows.map(u => {
    let restrictedByName = null;
    if (u.restricted_by_id) {
      const admin = db.prepare('SELECT name FROM users WHERE id = ?').get(u.restricted_by_id);
      restrictedByName = admin ? admin.name : u.restricted_by_id;
    }
    return {
      ...u,
      restrictedByName
    };
  });

  res.json({
    ...telemetry,
    restrictedUsers
  });
});

// POST /api/admin/antispam/reset-client - Reset rate limit quota for specific client or all
router.post('/antispam/reset-client', optionalAuth, requireSystemAdmin, (req, res) => {
  const { clientId } = req.body;
  if (!clientId) {
    return res.status(400).json({ error: 'clientId is required (e.g. "user_usr_123", "ip_127.0.0.1", or "all")' });
  }

  const success = clearClientRateLimit(clientId);

  logModerationAudit(db, {
    moderatorId: req.adminUser.id,
    moderatorRole: req.adminUser.role || 'admin',
    actionType: 'reset_rate_limit',
    targetType: 'client',
    targetId: clientId,
    reason: req.body.reason || 'Manual quota reset by System Administrator',
    notes: `Rate limit tracker reset for ${clientId}`
  });

  res.json({ success: Boolean(success), clientId });
});

export default router;
