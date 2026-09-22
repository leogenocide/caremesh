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
  let quarantinedVaultItems = quarantinedPosts;
  try {
    quarantinedVaultItems += (
      db.prepare('SELECT COUNT(*) as count FROM requests WHERE is_quarantined = 1').get().count +
      db.prepare('SELECT COUNT(*) as count FROM resources WHERE is_quarantined = 1').get().count +
      db.prepare('SELECT COUNT(*) as count FROM observations WHERE is_quarantined = 1').get().count +
      db.prepare('SELECT COUNT(*) as count FROM projects WHERE is_quarantined = 1').get().count +
      db.prepare('SELECT COUNT(*) as count FROM plans WHERE is_quarantined = 1').get().count +
      db.prepare('SELECT COUNT(*) as count FROM post_comments WHERE is_quarantined = 1').get().count
    );
  } catch {}

  const totalAuditLogs = db.prepare('SELECT COUNT(*) as count FROM moderation_audit_logs').get().count;

  res.json({
    totalUsers,
    activeUsers,
    restrictedUsers,
    totalReports,
    pendingReports,
    resolvedReports,
    quarantinedPosts,
    quarantinedVaultItems,
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

// POST /api/admin/vault/quarantine - System Admin quarantines any entity from public view into Vault
router.post('/vault/quarantine', optionalAuth, requireSystemAdmin, (req, res) => {
  const { targetType, targetId, reason = 'Quarantined by System Administrator', notes = '' } = req.body;
  if (!targetType || !targetId) {
    return res.status(400).json({ error: 'targetType and targetId are required.' });
  }

  const validTypes = ['post', 'comment', 'request', 'resource', 'observation', 'project', 'plan'];
  if (!validTypes.includes(targetType)) {
    return res.status(400).json({ error: `Invalid targetType. Must be one of: ${validTypes.join(', ')}` });
  }

  const tableMap = {
    post: 'posts',
    comment: 'post_comments',
    request: 'requests',
    resource: 'resources',
    observation: 'observations',
    project: 'projects',
    plan: 'plans'
  };

  const authorFieldMap = {
    post: 'author_id',
    comment: 'author_id',
    request: 'requester_id',
    resource: 'provider_id',
    observation: 'author_id',
    project: 'organizer_id',
    plan: 'proposer_id'
  };

  const table = tableMap[targetType];
  const item = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(targetId);
  if (!item) {
    return res.status(404).json({ error: `${targetType} not found.` });
  }

  db.prepare(`
    UPDATE ${table}
    SET is_quarantined = 1,
        quarantined_at = CURRENT_TIMESTAMP,
        quarantined_by_id = ?,
        quarantine_reason = ?
    WHERE id = ?
  `).run(req.adminUser.id, reason, targetId);

  const authorId = item[authorFieldMap[targetType]] || null;
  const commId = item.community_id || null;

  logModerationAudit(db, {
    moderatorId: req.adminUser.id,
    moderatorRole: 'System Administrator',
    communityId: commId,
    actionType: `quarantine_${targetType}`,
    targetType,
    targetId,
    targetAuthorId: authorId,
    targetContentSnapshot: item,
    reason,
    notes
  });

  res.json({ success: true, targetType, targetId, quarantined: true });
});

// GET /api/admin/vault - Quarantined items across the platform (accessible to System Admin & Public Moderators)
router.get('/vault', optionalAuth, requireAdminOrPublicMod, (req, res) => {
  const { search, communityId, itemType } = req.query;
  const results = [];

  const enrichItem = (row, type, contentText, titleText, authorId, commId, extra = {}) => {
    const author = authorId ? db.prepare('SELECT id, name, handle, avatar, role FROM users WHERE id = ?').get(authorId) : null;
    const comm = commId ? db.prepare('SELECT id, name, handle FROM communities WHERE id = ?').get(commId) : null;
    const qmod = row.quarantined_by_id ? db.prepare('SELECT id, name FROM users WHERE id = ?').get(row.quarantined_by_id) : null;

    return {
      id: row.id,
      itemType: type,
      title: titleText || (type === 'comment' ? 'Feed Comment' : 'Community Item'),
      content: contentText || '',
      category: row.category || extra.category || '',
      author: author || { id: authorId, name: 'Unknown User', handle: `@user_${authorId}` },
      communityName: comm?.name || (commId ? 'Community Group' : 'CareMesh Platform'),
      communityHandle: comm?.handle || '',
      communityId: commId || null,
      quarantinedAt: row.quarantined_at,
      quarantineReason: row.quarantine_reason || 'Safety review quarantine',
      quarantinedByName: qmod?.name || 'System Administrator',
      rawItem: row,
      ...extra
    };
  };

  // 1. Posts
  if (!itemType || itemType === 'all' || itemType === 'post') {
    let postSql = `SELECT p.*, c.name as community_name, c.handle as community_handle, qmod.name as quarantined_by_name FROM posts p LEFT JOIN communities c ON p.community_id = c.id LEFT JOIN users qmod ON p.quarantined_by_id = qmod.id WHERE p.is_quarantined = 1`;
    const postParams = [];
    if (communityId) {
      postSql += ` AND p.community_id = ?`;
      postParams.push(communityId);
    }
    const postRows = db.prepare(postSql).all(...postParams);
    for (const r of postRows) {
      let media = [];
      try { media = JSON.parse(r.media_urls || '[]'); } catch { media = []; }
      results.push(enrichItem(r, 'post', r.content, r.title || 'Discussion Post', r.author_id, r.community_id, { mediaUrls: media }));
    }
  }

  // 2. Comments
  if (!itemType || itemType === 'all' || itemType === 'comment') {
    try {
      const commRows = db.prepare(`SELECT * FROM post_comments WHERE is_quarantined = 1`).all();
      for (const r of commRows) {
        results.push(enrichItem(r, 'comment', r.text, 'Feed Comment', r.author_id, null));
      }
    } catch {}
  }

  // 3. Requests
  if (!itemType || itemType === 'all' || itemType === 'request') {
    try {
      const reqRows = db.prepare(`SELECT * FROM requests WHERE is_quarantined = 1`).all();
      for (const r of reqRows) {
        results.push(enrichItem(r, 'request', r.description, r.title, r.requester_id, r.community_id, { urgency: r.urgency, category: r.category }));
      }
    } catch {}
  }

  // 4. Resources
  if (!itemType || itemType === 'all' || itemType === 'resource') {
    try {
      const resRows = db.prepare(`SELECT * FROM resources WHERE is_quarantined = 1`).all();
      for (const r of resRows) {
        results.push(enrichItem(r, 'resource', r.description, r.title, r.provider_id, null, { contributionType: r.contribution_type, availability: r.availability }));
      }
    } catch {}
  }

  // 5. Observations
  if (!itemType || itemType === 'all' || itemType === 'observation') {
    try {
      const obsRows = db.prepare(`SELECT * FROM observations WHERE is_quarantined = 1`).all();
      for (const r of obsRows) {
        results.push(enrichItem(r, 'observation', r.description, r.title, r.author_id, null, { category: r.category, address: r.address }));
      }
    } catch {}
  }

  // 6. Events / Projects
  if (!itemType || itemType === 'all' || itemType === 'project' || itemType === 'event') {
    try {
      const projRows = db.prepare(`SELECT * FROM projects WHERE is_quarantined = 1`).all();
      for (const r of projRows) {
        results.push(enrichItem(r, 'project', r.description, r.title, r.organizer_id, null, { eventType: r.event_type, date: r.date }));
      }
    } catch {}
  }

  // 7. Plans
  if (!itemType || itemType === 'all' || itemType === 'plan') {
    try {
      const planRows = db.prepare(`SELECT * FROM plans WHERE is_quarantined = 1`).all();
      for (const r of planRows) {
        results.push(enrichItem(r, 'plan', r.problem_statement || r.desired_outcome, r.title, r.proposer_id, null, { lifecycleStage: r.lifecycle_stage }));
      }
    } catch {}
  }

  let filtered = results;
  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    filtered = results.filter(it => 
      it.title?.toLowerCase().includes(term) ||
      it.content?.toLowerCase().includes(term) ||
      it.quarantineReason?.toLowerCase().includes(term) ||
      it.author?.name?.toLowerCase().includes(term) ||
      it.author?.handle?.toLowerCase().includes(term)
    );
  }

  filtered.sort((a, b) => new Date(b.quarantinedAt || 0) - new Date(a.quarantinedAt || 0));
  res.json(filtered);
});

// POST /api/admin/vault/:id/restore - System Admin restores a quarantined item of any type
router.post('/vault/:id/restore', optionalAuth, requireSystemAdmin, (req, res) => {
  const targetId = req.params.id;
  const targetType = req.body?.itemType || req.query?.itemType;

  const tables = targetType ? [
    targetType === 'post' ? 'posts' :
    targetType === 'comment' ? 'post_comments' :
    targetType === 'request' ? 'requests' :
    targetType === 'resource' ? 'resources' :
    targetType === 'observation' ? 'observations' :
    targetType === 'project' || targetType === 'event' ? 'projects' :
    targetType === 'plan' ? 'plans' : 'posts'
  ] : ['posts', 'requests', 'resources', 'observations', 'projects', 'plans', 'post_comments'];

  let foundTable = null;
  let item = null;

  for (const tbl of tables) {
    try {
      const row = db.prepare(`SELECT * FROM ${tbl} WHERE id = ?`).get(targetId);
      if (row && row.is_quarantined) {
        foundTable = tbl;
        item = row;
        break;
      }
    } catch {}
  }

  if (!foundTable || !item) {
    return res.status(404).json({ error: 'Quarantined item not found or already restored.' });
  }

  db.prepare(`
    UPDATE ${foundTable}
    SET is_quarantined = 0,
        quarantined_at = NULL,
        quarantined_by_id = NULL,
        quarantine_reason = NULL
    WHERE id = ?
  `).run(targetId);

  const authorId = item.author_id || item.requester_id || item.provider_id || item.organizer_id || item.proposer_id || null;

  logModerationAudit(db, {
    moderatorId: req.adminUser.id,
    moderatorRole: 'System Administrator',
    communityId: item.community_id || null,
    actionType: `restore_${foundTable.replace(/s$/, '')}`,
    targetType: foundTable.replace(/s$/, ''),
    targetId,
    targetAuthorId: authorId,
    targetContentSnapshot: item,
    reason: req.body?.reason || 'Restored to public view by System Administrator after review',
    notes: req.body?.notes || 'Cleared of violations and returned to public platform.'
  });

  const restoredRow = db.prepare(`SELECT * FROM ${foundTable} WHERE id = ?`).get(targetId);
  const responseData = { success: true, id: targetId, restored: true, table: foundTable };
  if (foundTable === 'posts') {
    responseData.post = formatPost(restoredRow);
  }
  res.json(responseData);
});

// POST /api/admin/vault/:id/purge - System Admin permanently purges a quarantined item of any type
router.post('/vault/:id/purge', optionalAuth, requireSystemAdmin, (req, res) => {
  const targetId = req.params.id;
  const targetType = req.body?.itemType || req.query?.itemType;

  const tables = targetType ? [
    targetType === 'post' ? 'posts' :
    targetType === 'comment' ? 'post_comments' :
    targetType === 'request' ? 'requests' :
    targetType === 'resource' ? 'resources' :
    targetType === 'observation' ? 'observations' :
    targetType === 'project' || targetType === 'event' ? 'projects' :
    targetType === 'plan' ? 'plans' : 'posts'
  ] : ['posts', 'requests', 'resources', 'observations', 'projects', 'plans', 'post_comments'];

  let foundTable = null;
  let item = null;

  for (const tbl of tables) {
    try {
      const row = db.prepare(`SELECT * FROM ${tbl} WHERE id = ?`).get(targetId);
      if (row) {
        foundTable = tbl;
        item = row;
        break;
      }
    } catch {}
  }

  if (!foundTable || !item) {
    return res.status(404).json({ error: 'Item not found.' });
  }

  const authorId = item.author_id || item.requester_id || item.provider_id || item.organizer_id || item.proposer_id || null;

  const tx = db.transaction(() => {
    if (foundTable === 'posts') {
      db.prepare('DELETE FROM post_comments WHERE post_id = ?').run(targetId);
      db.prepare('DELETE FROM posts WHERE id = ?').run(targetId);
    } else if (foundTable === 'post_comments') {
      db.prepare('DELETE FROM post_comments WHERE id = ?').run(targetId);
    } else if (foundTable === 'requests') {
      db.prepare('DELETE FROM quick_actions WHERE request_id = ?').run(targetId);
      db.prepare('DELETE FROM request_responses WHERE request_id = ?').run(targetId);
      db.prepare('DELETE FROM resource_assignments WHERE request_id = ?').run(targetId);
      db.prepare('DELETE FROM requests WHERE id = ?').run(targetId);
    } else if (foundTable === 'resources') {
      db.prepare('DELETE FROM resource_assignments WHERE resource_id = ?').run(targetId);
      db.prepare('DELETE FROM resources WHERE id = ?').run(targetId);
    } else if (foundTable === 'observations') {
      db.prepare('DELETE FROM observation_evidence WHERE observation_id = ?').run(targetId);
      db.prepare('DELETE FROM observation_relations WHERE source_observation_id = ? OR target_observation_id = ?').run(targetId, targetId);
      db.prepare('DELETE FROM safety_report_observations WHERE observation_id = ?').run(targetId);
      db.prepare('DELETE FROM observations WHERE id = ?').run(targetId);
    } else if (foundTable === 'projects') {
      db.prepare('DELETE FROM project_messages WHERE project_id = ?').run(targetId);
      db.prepare('DELETE FROM project_participants WHERE project_id = ?').run(targetId);
      db.prepare('DELETE FROM projects WHERE id = ?').run(targetId);
    } else if (foundTable === 'plans') {
      db.prepare('DELETE FROM plan_feedback WHERE plan_id = ?').run(targetId);
      db.prepare('DELETE FROM plan_milestones WHERE plan_id = ?').run(targetId);
      db.prepare('DELETE FROM plan_participants WHERE plan_id = ?').run(targetId);
      db.prepare('DELETE FROM plan_revisions WHERE plan_id = ?').run(targetId);
      db.prepare('DELETE FROM plans WHERE id = ?').run(targetId);
    }
  });
  tx();

  logModerationAudit(db, {
    moderatorId: req.adminUser.id,
    moderatorRole: 'System Administrator',
    communityId: item.community_id || null,
    actionType: `purge_${foundTable.replace(/s$/, '')}`,
    targetType: foundTable.replace(/s$/, ''),
    targetId,
    targetAuthorId: authorId,
    targetContentSnapshot: item,
    reason: req.body?.reason || 'Permanently purged by System Administrator',
    notes: req.body?.notes || 'Irrevocably removed from database with complete historical snapshot logged.'
  });

  res.json({ success: true, purgedId: targetId, table: foundTable });
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
