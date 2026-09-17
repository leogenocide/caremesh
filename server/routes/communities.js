import express from 'express';
import { db, logModerationAudit } from '../db/database.js';
import { formatUser } from './auth.js';
import { optionalAuth } from '../middleware/auth.js';
import { parsePaginationParams, executePaginatedQuery } from '../utils/pagination.js';

const router = express.Router();

export function isSystemAdmin(user) {
  if (!user) return false;
  if (user.id === 'usr_me') return true;
  const role = (user.role || '').toLowerCase();
  return role.includes('admin') || role.includes('coordinator');
}

export function isPlatformAdmin(user) {
  if (!user) return false;
  if (user.id === 'usr_me') return true;
  if (user.is_public_moderator) return true;
  const role = (user.role || '').toLowerCase();
  return role.includes('admin') || role.includes('coordinator');
}

export function formatCommunity(row, currentUserId = 'usr_me') {
  if (!row) return null;

  const memberRows = db.prepare(`
    SELECT u.id, cm.role FROM community_members cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.community_id = ?
  `).all(row.id);

  const adminIds = memberRows.filter(m => m.role === 'admin').map(m => m.id);
  const moderatorIds = memberRows.filter(m => m.role === 'moderator').map(m => m.id);
  const memberIds = memberRows.map(m => m.id);
  const isJoined = memberIds.includes(currentUserId);

  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    category: row.category,
    privacy: row.privacy,
    privacyLabel: row.privacy_label,
    description: row.description,
    location: row.location,
    memberCount: memberIds.length || row.member_count,
    avatar: row.avatar,
    banner: row.banner,
    createdDate: row.created_date,
    pinnedPostId: row.pinned_post_id,
    adminIds,
    moderatorIds,
    memberIds,
    rules: JSON.parse(row.rules || '[]'),
    mediaGallery: JSON.parse(row.media_gallery || '[]'),
    files: JSON.parse(row.files || '[]'),
    isJoined,
    linkedPlanIds: [],
    linkedEventIds: [],
    linkedRequestIds: db.prepare('SELECT id FROM requests WHERE community_id = ?').all(row.id).map(r => r.id)
  };
}

export function formatPost(row) {
  if (!row) return null;

  const authorRow = db.prepare('SELECT * FROM users WHERE id = ?').get(row.author_id);
  const author = authorRow ? formatUser(authorRow) : { id: row.author_id, name: 'Anonymous' };

  const commentRows = db.prepare(`
    SELECT pc.*, u.id as u_id, u.name, u.role, u.avatar
    FROM post_comments pc
    JOIN users u ON pc.author_id = u.id
    WHERE pc.post_id = ?
    ORDER BY pc.created_at ASC
  `).all(row.id);

  const comments = commentRows.map(c => ({
    id: c.id,
    author: { id: c.u_id, name: c.name, role: c.role, avatar: c.avatar },
    text: c.text,
    time: c.time
  }));

  return {
    id: row.id,
    communityId: row.community_id,
    author,
    content: row.content,
    category: row.category || null,
    timestamp: row.timestamp,
    isPinned: Boolean(row.is_pinned),
    linkedEntityType: row.linked_entity_type,
    linkedEntityId: row.linked_entity_id,
    linkedEntityTitle: row.linked_entity_title,
    endorsedCount: row.endorsed_count,
    endorserIds: JSON.parse(row.endorser_ids || '[]'),
    mediaUrls: JSON.parse(row.media_urls || '[]'),
    poll: row.poll ? JSON.parse(row.poll) : null,
    restrictedUserIds: JSON.parse(row.restricted_user_ids || '[]'),
    isQuarantined: Boolean(row.is_quarantined),
    quarantinedAt: row.quarantined_at || null,
    quarantinedById: row.quarantined_by_id || null,
    quarantineReason: row.quarantine_reason || null,
    comments
  };
}

// GET /api/communities
router.get('/', optionalAuth, (req, res) => {
  const currentUserId = req.user ? req.user.id : 'usr_me';
  const rows = db.prepare('SELECT * FROM communities ORDER BY created_at DESC').all();
  res.json(rows.map(r => formatCommunity(r, currentUserId)));
});

// GET /api/communities/:id
router.get('/:id', optionalAuth, (req, res) => {
  const currentUserId = req.user ? req.user.id : 'usr_me';
  const row = db.prepare('SELECT * FROM communities WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Community not found' });
  }
  res.json(formatCommunity(row, currentUserId));
});

// POST /api/communities
router.post('/', optionalAuth, (req, res) => {
  const { name, handle, category, privacy = 'public', description, location } = req.body;
  if (!name || !handle || !description) {
    return res.status(400).json({ error: 'Name, handle, and description are required' });
  }

  const id = `com_${Date.now()}`;
  const creatorId = req.user ? req.user.id : 'usr_me';
  const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`;

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO communities (id, name, handle, category, privacy, privacy_label, description, location, member_count, avatar, banner, created_date, rules, media_gallery, files)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=200&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80', 'Formed Today', '[]', '[]', '[]')
    `).run(
      id,
      name,
      cleanHandle,
      category || 'general',
      privacy,
      `${privacy === 'public' ? 'Public Group' : 'Private Circle'} · 1 member`,
      description,
      location || 'Maplewood Corridor'
    );

    db.prepare(`
      INSERT INTO community_members (id, community_id, user_id, role)
      VALUES (?, ?, ?, 'admin')
    `).run(`cm_${id}_${creatorId}`, id, creatorId);
  });

  tx();

  res.status(201).json(formatCommunity(db.prepare('SELECT * FROM communities WHERE id = ?').get(id), creatorId));
});

// POST /api/communities/:id/join
router.post('/:id/join', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : (req.body.userId || 'usr_me');
  const community = db.prepare('SELECT * FROM communities WHERE id = ?').get(req.params.id);
  if (!community) {
    return res.status(404).json({ error: 'Community not found' });
  }

  const existing = db.prepare('SELECT id FROM community_members WHERE community_id = ? AND user_id = ?').get(req.params.id, userId);
  if (existing) {
    db.prepare('DELETE FROM community_members WHERE community_id = ? AND user_id = ?').run(req.params.id, userId);
  } else {
    db.prepare(`
      INSERT INTO community_members (id, community_id, user_id, role)
      VALUES (?, ?, ?, 'member')
    `).run(`cm_${req.params.id}_${userId}`, req.params.id, userId);
  }

  res.json(formatCommunity(db.prepare('SELECT * FROM communities WHERE id = ?').get(req.params.id), userId));
});

// GET /api/posts
router.get('/feed/posts', optionalAuth, (req, res) => {
  const { isPaginated, page, limit } = parsePaginationParams(req.query);
  const { communityId } = req.query;
  const currentUserId = req.user ? req.user.id : null;
  const whereClauses = ['(is_quarantined = 0 OR is_quarantined IS NULL)'];
  const params = [];

  if (communityId) {
    const comm = db.prepare('SELECT privacy FROM communities WHERE id = ?').get(communityId);
    if (comm && comm.privacy === 'private') {
      if (!currentUserId) {
        return res.status(403).json({ error: 'Access forbidden: this is a private community circle.' });
      }
      const caller = req.user || db.prepare('SELECT * FROM users WHERE id = ?').get(currentUserId);
      const isMember = db.prepare('SELECT id FROM community_members WHERE community_id = ? AND user_id = ?').get(communityId, currentUserId);
      if (!isMember && !isSystemAdmin(caller)) {
        return res.status(403).json({ error: 'Access forbidden: you are not a member of this private circle.' });
      }
    }
    whereClauses.push('community_id = ?');
    params.push(communityId);
  } else {
    // In global feed, only display posts from non-private communities or private ones where user is a member
    if (currentUserId) {
      whereClauses.push(`community_id IN (
        SELECT id FROM communities WHERE privacy != 'private'
        OR id IN (SELECT community_id FROM community_members WHERE user_id = ?)
      )`);
      params.push(currentUserId);
    } else {
      whereClauses.push(`community_id IN (SELECT id FROM communities WHERE privacy != 'private')`);
    }
  }

  const whereSql = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';
  const countSql = `SELECT COUNT(*) FROM posts${whereSql}`;
  const dataSql = `SELECT * FROM posts${whereSql} ORDER BY is_pinned DESC, created_at DESC`;

  if (isPaginated) {
    const result = executePaginatedQuery(db, {
      countSql,
      countParams: params,
      dataSql,
      dataParams: params,
      page,
      limit,
      formatter: formatPost
    });
    return res.json(result);
  }

  const rows = db.prepare(dataSql).all(...params);
  res.json(rows.map(formatPost));
});

// POST /api/posts
router.post('/feed/posts', optionalAuth, (req, res) => {
  const { communityId, content, category = null, mediaUrls = [], poll, linkedEntityType, linkedEntityId, linkedEntityTitle } = req.body;
  if (!communityId || !content) {
    return res.status(400).json({ error: 'communityId and content are required' });
  }

  const id = `post_${Date.now()}`;
  const authorId = req.user ? req.user.id : (req.body.authorId || 'usr_me');
  const timestamp = 'Just now';

  const comm = db.prepare('SELECT privacy FROM communities WHERE id = ?').get(communityId);
  if (comm && comm.privacy === 'private') {
    const caller = req.user || db.prepare('SELECT * FROM users WHERE id = ?').get(authorId);
    const isMember = db.prepare('SELECT id FROM community_members WHERE community_id = ? AND user_id = ?').get(communityId, authorId);
    if (!isMember && !isSystemAdmin(caller)) {
      return res.status(403).json({ error: 'Access forbidden: only circle members or administrators can post in a private community circle.' });
    }
  }

  let formattedPoll = null;
  if (poll && poll.question && poll.options?.length > 0) {
    formattedPoll = {
      id: `poll_${Date.now()}`,
      question: poll.question,
      options: poll.options.map((opt, idx) => ({
        id: `opt_${idx}`,
        text: typeof opt === 'string' ? opt : opt.text,
        votes: 0,
        voterIds: []
      }))
    };
  }

  db.prepare(`
    INSERT INTO posts (id, community_id, author_id, content, category, timestamp, is_pinned, linked_entity_type, linked_entity_id, linked_entity_title, endorsed_count, endorser_ids, media_urls, poll)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 0, '[]', ?, ?)
  `).run(
    id,
    communityId,
    authorId,
    content,
    category || null,
    timestamp,
    linkedEntityType || null,
    linkedEntityId || null,
    linkedEntityTitle || null,
    JSON.stringify(mediaUrls),
    formattedPoll ? JSON.stringify(formattedPoll) : null
  );

  const created = formatPost(db.prepare('SELECT * FROM posts WHERE id = ?').get(id));
  res.status(201).json(created);
});

// POST /api/posts/:id/endorse
router.post('/feed/posts/:id/endorse', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : (req.body.userId || 'usr_me');
  const post = db.prepare('SELECT author_id, endorsed_count, endorser_ids FROM posts WHERE id = ?').get(req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  // Author cannot endorse their own post
  if (post.author_id === userId) {
    return res.status(400).json({ error: 'You cannot endorse your own post.' });
  }

  const endorsers = JSON.parse(post.endorser_ids || '[]');
  const hasEndorsed = endorsers.includes(userId);
  const updatedEndorsers = hasEndorsed ? endorsers.filter(id => id !== userId) : [...endorsers, userId];
  const newCount = updatedEndorsers.length;

  db.prepare(`
    UPDATE posts
    SET endorsed_count = ?, endorser_ids = ?
    WHERE id = ?
  `).run(newCount, JSON.stringify(updatedEndorsers), req.params.id);

  res.json(formatPost(db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id)));
});

// POST /api/posts/:id/comments
router.post('/feed/posts/:id/comments', optionalAuth, (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Comment text is required' });
  }
  const id = `c_${Date.now()}`;
  const authorId = req.body.authorId || req.body.userId || (req.user ? req.user.id : 'usr_me');
  const time = 'Just now';

  const targetPost = db.prepare('SELECT community_id, restricted_user_ids FROM posts WHERE id = ?').get(req.params.id);
  if (!targetPost) {
    return res.status(404).json({ error: 'Post not found' });
  }

  if (targetPost.community_id) {
    const comm = db.prepare('SELECT privacy FROM communities WHERE id = ?').get(targetPost.community_id);
    if (comm && comm.privacy === 'private') {
      const caller = req.user || db.prepare('SELECT * FROM users WHERE id = ?').get(authorId);
      const isMember = db.prepare('SELECT id FROM community_members WHERE community_id = ? AND user_id = ?').get(targetPost.community_id, authorId);
      if (!isMember && !isSystemAdmin(caller)) {
        return res.status(403).json({ error: 'Access forbidden: only circle members or administrators can comment in a private community circle.' });
      }
    }
  }

  const restricted = JSON.parse(targetPost.restricted_user_ids || '[]');
  if (restricted.includes(authorId)) {
    return res.status(403).json({ error: 'You have been restricted from commenting on this post by the author.' });
  }

  db.prepare(`
    INSERT INTO post_comments (id, post_id, author_id, text, time)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, req.params.id, authorId, text, time);

  res.status(201).json(formatPost(db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id)));
});

// POST /api/posts/:id/poll/vote
router.post('/feed/posts/:id/poll/vote', optionalAuth, (req, res) => {
  const { optionId } = req.body;
  const userId = req.user ? req.user.id : (req.body.userId || 'usr_me');

  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post || !post.poll) {
    return res.status(404).json({ error: 'Poll not found on post' });
  }

  const poll = JSON.parse(post.poll);
  poll.options = poll.options.map(opt => {
    const withoutUser = (opt.voterIds || []).filter(id => id !== userId);
    if (opt.id === optionId) {
      return {
        ...opt,
        voterIds: [...withoutUser, userId],
        votes: withoutUser.length + 1
      };
    }
    return {
      ...opt,
      voterIds: withoutUser,
      votes: withoutUser.length
    };
  });

  db.prepare(`UPDATE posts SET poll = ? WHERE id = ?`).run(JSON.stringify(poll), req.params.id);
  res.json(formatPost(db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id)));
});

// PATCH /api/communities/feed/posts/:id
router.patch('/feed/posts/:id', optionalAuth, (req, res) => {
  const { content, category, mediaUrls } = req.body;
  const userId = req.user ? req.user.id : (req.body.userId || 'usr_me');

  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  // Check if author or community admin
  const member = db.prepare('SELECT role FROM community_members WHERE community_id = ? AND user_id = ?').get(post.community_id, userId);
  const isAdmin = member && (member.role === 'admin' || member.role === 'moderator');

  if (post.author_id !== userId && !isAdmin) {
    return res.status(403).json({ error: 'Only post authors or group administrators can edit this post.' });
  }

  const updatedContent = content !== undefined ? content.trim() : post.content;
  const updatedCategory = category !== undefined ? category : post.category;
  const updatedMedia = mediaUrls !== undefined ? JSON.stringify(mediaUrls) : post.media_urls;

  db.prepare(`
    UPDATE posts
    SET content = ?, category = ?, media_urls = ?
    WHERE id = ?
  `).run(updatedContent, updatedCategory, updatedMedia, req.params.id);

  res.json(formatPost(db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id)));
});

// DELETE /api/communities/feed/posts/:id
router.delete('/feed/posts/:id', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : (req.query.userId || req.body?.userId || 'usr_me');

  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  // Check if author or admin
  const user = req.user || db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const member = db.prepare('SELECT role FROM community_members WHERE community_id = ? AND user_id = ?').get(post.community_id, userId);
  const isAdmin = (member && (member.role === 'admin' || member.role === 'moderator')) || isPlatformAdmin(user);

  if (post.author_id !== userId && !isAdmin) {
    return res.status(403).json({ error: 'Only post authors or group/system administrators can delete this post.' });
  }

  if (post.author_id !== userId && isAdmin) {
    const reason = req.body?.reason || req.query?.reason || 'Quarantined by moderator';
    const notes = req.body?.notes || req.query?.notes || null;
    db.prepare(`
      UPDATE posts
      SET is_quarantined = 1,
          quarantined_at = CURRENT_TIMESTAMP,
          quarantined_by_id = ?,
          quarantine_reason = ?
      WHERE id = ?
    `).run(userId, reason, req.params.id);

    logModerationAudit(db, {
      moderatorId: userId,
      moderatorRole: member?.role || 'moderator',
      communityId: post.community_id,
      actionType: 'quarantine_post',
      targetType: 'post',
      targetId: req.params.id,
      targetAuthorId: post.author_id,
      targetContentSnapshot: { content: post.content, category: post.category },
      reason,
      notes
    });

    return res.json({ success: true, id: req.params.id, quarantined: true });
  }

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM post_comments WHERE post_id = ?').run(req.params.id);
    db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  });
  tx();

  res.json({ success: true, id: req.params.id });
});

// PATCH /api/communities/feed/posts/:postId/comments/:commentId
router.patch('/feed/posts/:postId/comments/:commentId', optionalAuth, (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Comment text cannot be empty.' });
  }

  const userId = req.user ? req.user.id : (req.body.userId || 'usr_me');
  const comment = db.prepare('SELECT * FROM post_comments WHERE id = ? AND post_id = ?').get(req.params.commentId, req.params.postId);
  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  if (comment.author_id !== userId) {
    return res.status(403).json({ error: 'Only comment authors can edit this comment.' });
  }

  db.prepare(`
    UPDATE post_comments
    SET text = ?
    WHERE id = ?
  `).run(text.trim(), req.params.commentId);

  res.json(formatPost(db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.postId)));
});

// DELETE /api/communities/feed/posts/:postId/comments/:commentId
router.delete('/feed/posts/:postId/comments/:commentId', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : (req.query.userId || req.body?.userId || 'usr_me');
  const comment = db.prepare('SELECT * FROM post_comments WHERE id = ? AND post_id = ?').get(req.params.commentId, req.params.postId);
  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.postId);
  const user = req.user || db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const isPlatformAdmin = user && (
    user.role === 'Admin' || 
    user.role === 'admin' || 
    user.role === 'coordinator' || 
    user.role === 'Emergency Coordinator' || 
    user.role === 'System Administrator' || 
    Boolean(user.is_public_moderator)
  );
  const member = post ? db.prepare('SELECT role FROM community_members WHERE community_id = ? AND user_id = ?').get(post.community_id, userId) : null;
  const isAdmin = (member && (member.role === 'admin' || member.role === 'moderator')) || isPlatformAdmin;

  if (comment.author_id !== userId && !isAdmin) {
    return res.status(403).json({ error: 'Only comment authors or administrators can delete this comment.' });
  }

  db.prepare('DELETE FROM post_comments WHERE id = ?').run(req.params.commentId);

  res.json(formatPost(db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.postId)));
});

// POST /api/communities/feed/posts/:id/kick-user (Post author kicks/restricts member from post)
router.post('/feed/posts/:id/kick-user', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : (req.body.userId || 'usr_me');
  const { targetUserId } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ error: 'targetUserId is required.' });
  }

  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const member = db.prepare('SELECT role FROM community_members WHERE community_id = ? AND user_id = ?').get(post.community_id, userId);
  const isAdmin = member && (member.role === 'admin' || member.role === 'moderator');

  if (post.author_id !== userId && !isAdmin) {
    return res.status(403).json({ error: 'Only the post author or community admin can kick users from this post.' });
  }

  const tx = db.transaction(() => {
    // 1. Remove all comments by targetUserId on this post
    db.prepare('DELETE FROM post_comments WHERE post_id = ? AND author_id = ?').run(req.params.id, targetUserId);

    // 2. Add targetUserId to restricted_user_ids
    const restricted = JSON.parse(post.restricted_user_ids || '[]');
    if (!restricted.includes(targetUserId)) {
      restricted.push(targetUserId);
      db.prepare('UPDATE posts SET restricted_user_ids = ? WHERE id = ?').run(JSON.stringify(restricted), req.params.id);
    }
  });

  tx();

  res.json(formatPost(db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id)));
});

// DELETE /api/communities/:id/members/:userId (Kick member from community)
router.delete('/:id/members/:userId', optionalAuth, (req, res) => {
  const currentUserId = req.user ? req.user.id : (req.body?.adminId || 'usr_me');
  const targetUserId = req.params.userId;

  const community = db.prepare('SELECT * FROM communities WHERE id = ?').get(req.params.id);
  if (!community) {
    return res.status(404).json({ error: 'Community not found' });
  }

  const currentMember = db.prepare('SELECT role FROM community_members WHERE community_id = ? AND user_id = ?').get(req.params.id, currentUserId);
  const isAdminOrMod = currentMember && (currentMember.role === 'admin' || currentMember.role === 'moderator');

  if (!isAdminOrMod) {
    return res.status(403).json({ error: 'Only circle admins or moderators can kick members.' });
  }

  db.prepare('DELETE FROM community_members WHERE community_id = ? AND user_id = ?').run(req.params.id, targetUserId);

  logModerationAudit(db, {
    moderatorId: currentUserId,
    moderatorRole: currentMember?.role || 'moderator',
    communityId: req.params.id,
    actionType: 'kick_member',
    targetType: 'user',
    targetId: targetUserId,
    targetAuthorId: targetUserId,
    reason: req.body?.reason || 'Kicked from circle by moderator',
    notes: req.body?.notes || null
  });

  res.json({
    success: true,
    community: formatCommunity(db.prepare('SELECT * FROM communities WHERE id = ?').get(req.params.id), currentUserId),
    kickedUserId: targetUserId
  });
});

// POST /api/communities/:id/kick (Alias for kicking a member)
router.post('/:id/kick', optionalAuth, (req, res) => {
  const currentUserId = req.user ? req.user.id : (req.body.adminId || 'usr_me');
  const targetUserId = req.body.targetUserId || req.body.userId;

  if (!targetUserId) {
    return res.status(400).json({ error: 'targetUserId or userId is required.' });
  }

  const currentMember = db.prepare('SELECT role FROM community_members WHERE community_id = ? AND user_id = ?').get(req.params.id, currentUserId);
  const isAdminOrMod = currentMember && (currentMember.role === 'admin' || currentMember.role === 'moderator');

  if (!isAdminOrMod) {
    return res.status(403).json({ error: 'Only circle admins or moderators can kick members.' });
  }

  db.prepare('DELETE FROM community_members WHERE community_id = ? AND user_id = ?').run(req.params.id, targetUserId);

  logModerationAudit(db, {
    moderatorId: currentUserId,
    moderatorRole: currentMember?.role || 'moderator',
    communityId: req.params.id,
    actionType: 'kick_member',
    targetType: 'user',
    targetId: targetUserId,
    targetAuthorId: targetUserId,
    reason: req.body?.reason || 'Kicked from circle by moderator',
    notes: req.body?.notes || null
  });

  res.json({
    success: true,
    community: formatCommunity(db.prepare('SELECT * FROM communities WHERE id = ?').get(req.params.id), currentUserId),
    kickedUserId: targetUserId
  });
});

// Helper for elections
export function formatElection(row, currentUserId = 'usr_me') {
  if (!row) return null;
  const candidateRow = db.prepare('SELECT * FROM users WHERE id = ?').get(row.candidate_id);
  const candidate = candidateRow ? formatUser(candidateRow) : { id: row.candidate_id, name: 'Candidate' };

  const nominatorRow = db.prepare('SELECT * FROM users WHERE id = ?').get(row.nominated_by_id);
  const nominatedBy = nominatorRow ? formatUser(nominatorRow) : { id: row.nominated_by_id, name: 'Member' };

  const voteRows = db.prepare('SELECT voter_id, vote FROM moderator_votes WHERE election_id = ?').all(row.id);
  const votesFor = voteRows.filter(v => v.vote === 'for').map(v => v.voter_id);
  const votesAgainst = voteRows.filter(v => v.vote === 'against').map(v => v.voter_id);
  const hasVoted = voteRows.some(v => v.voter_id === currentUserId);
  const userVote = voteRows.find(v => v.voter_id === currentUserId)?.vote || null;

  return {
    id: row.id,
    communityId: row.community_id,
    candidate,
    candidateId: row.candidate_id,
    nominatedBy,
    nominatedById: row.nominated_by_id,
    status: row.status, // 'active' | 'passed' | 'rejected'
    createdAt: row.created_at,
    votesCount: votesFor.length,
    votesFor,
    votesAgainst,
    hasVoted,
    userVote,
    threshold: 3
  };
}

// GET /api/communities/:id/elections
router.get('/:id/elections', optionalAuth, (req, res) => {
  const currentUserId = req.user ? req.user.id : 'usr_me';
  const rows = db.prepare('SELECT * FROM moderator_elections WHERE community_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json(rows.map(r => formatElection(r, currentUserId)));
});

// POST /api/communities/:id/elections/nominate
router.post('/:id/elections/nominate', optionalAuth, (req, res) => {
  const nominatorId = req.user ? req.user.id : (req.body.nominatorId || 'usr_me');
  const { candidateId } = req.body;

  if (!candidateId) {
    return res.status(400).json({ error: 'candidateId is required.' });
  }

  const candidateMember = db.prepare('SELECT * FROM community_members WHERE community_id = ? AND user_id = ?').get(req.params.id, candidateId);
  if (!candidateMember) {
    return res.status(400).json({ error: 'Candidate must be a member of the community.' });
  }

  // Members cannot nominate themselves
  if (candidateId === nominatorId) {
    return res.status(400).json({ error: 'You cannot nominate yourself as moderator. Nominations must come from fellow community members.' });
  }

  if (candidateMember.role === 'admin' || candidateMember.role === 'moderator') {
    return res.status(400).json({ error: 'Member is already an admin or moderator.' });
  }

  const existingElection = db.prepare("SELECT * FROM moderator_elections WHERE community_id = ? AND candidate_id = ? AND status = 'active'").get(req.params.id, candidateId);
  if (existingElection) {
    return res.status(400).json({ error: 'An active election for this candidate is already underway.' });
  }

  const electionId = `elec_${Date.now()}`;
  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO moderator_elections (id, community_id, candidate_id, nominated_by_id, status)
      VALUES (?, ?, ?, ?, 'active')
    `).run(electionId, req.params.id, candidateId, nominatorId);

    db.prepare(`
      INSERT INTO moderator_votes (id, election_id, community_id, voter_id, vote)
      VALUES (?, ?, ?, ?, 'for')
    `).run(`v_${Date.now()}_${nominatorId}`, electionId, req.params.id, nominatorId);
  });
  tx();

  const created = formatElection(db.prepare('SELECT * FROM moderator_elections WHERE id = ?').get(electionId), nominatorId);
  res.status(201).json(created);
});

// POST /api/communities/:id/elections/:electionId/vote
router.post('/:id/elections/:electionId/vote', optionalAuth, (req, res) => {
  const voterId = req.user ? req.user.id : (req.body.voterId || 'usr_me');
  const { vote = 'for' } = req.body;

  const election = db.prepare('SELECT * FROM moderator_elections WHERE id = ?').get(req.params.electionId);
  if (!election) {
    return res.status(404).json({ error: 'Election not found' });
  }

  if (election.status !== 'active') {
    return res.status(400).json({ error: 'Election is no longer active.' });
  }

  const member = db.prepare('SELECT * FROM community_members WHERE community_id = ? AND user_id = ?').get(req.params.id, voterId);
  if (!member) {
    return res.status(403).json({ error: 'You must be a member of this circle to vote.' });
  }

  const tx = db.transaction(() => {
    const existingVote = db.prepare('SELECT id FROM moderator_votes WHERE election_id = ? AND voter_id = ?').get(req.params.electionId, voterId);
    if (existingVote) {
      db.prepare('UPDATE moderator_votes SET vote = ? WHERE id = ?').run(vote, existingVote.id);
    } else {
      db.prepare(`
        INSERT INTO moderator_votes (id, election_id, community_id, voter_id, vote)
        VALUES (?, ?, ?, ?, ?)
      `).run(`v_${Date.now()}_${voterId}`, req.params.electionId, req.params.id, voterId, vote);
    }

    // Check threshold (3 'for' votes)
    const forVotesCount = db.prepare("SELECT COUNT(*) as count FROM moderator_votes WHERE election_id = ? AND vote = 'for'").get(req.params.electionId).count;
    if (forVotesCount >= 3) {
      db.prepare("UPDATE moderator_elections SET status = 'passed' WHERE id = ?").run(req.params.electionId);
      db.prepare("UPDATE community_members SET role = 'moderator' WHERE community_id = ? AND user_id = ?").run(req.params.id, election.candidate_id);
    }
  });
  tx();

  const updated = formatElection(db.prepare('SELECT * FROM moderator_elections WHERE id = ?').get(req.params.electionId), voterId);
  res.json(updated);
});

// POST /api/communities/:id/elections/:electionId/appoint
router.post('/:id/elections/:electionId/appoint', optionalAuth, (req, res) => {
  const adminId = req.user ? req.user.id : (req.body.adminId || 'usr_me');
  const adminMember = db.prepare('SELECT role FROM community_members WHERE community_id = ? AND user_id = ?').get(req.params.id, adminId);
  if (!adminMember || adminMember.role !== 'admin') {
    return res.status(403).json({ error: 'Only community administrators can directly appoint candidates.' });
  }

  const election = db.prepare('SELECT * FROM moderator_elections WHERE id = ?').get(req.params.electionId);
  if (!election) {
    return res.status(404).json({ error: 'Election not found' });
  }

  db.transaction(() => {
    db.prepare("UPDATE moderator_elections SET status = 'passed' WHERE id = ?").run(req.params.electionId);
    db.prepare("UPDATE community_members SET role = 'moderator' WHERE community_id = ? AND user_id = ?").run(req.params.id, election.candidate_id);
  })();

  const updated = formatElection(db.prepare('SELECT * FROM moderator_elections WHERE id = ?').get(req.params.electionId), adminId);
  res.json(updated);
});

// PATCH /api/communities/:id - Update community details (admin/moderator only)
router.patch('/:id', optionalAuth, (req, res) => {
  const currentUserId = req.user ? req.user.id : (req.body.userId || 'usr_me');
  const community = db.prepare('SELECT * FROM communities WHERE id = ?').get(req.params.id);
  if (!community) {
    return res.status(404).json({ error: 'Community not found' });
  }

  // Check permissions: admin/moderator of group or platform admin
  const member = db.prepare('SELECT role FROM community_members WHERE community_id = ? AND user_id = ?').get(req.params.id, currentUserId);
  const isPlatformAdmin = req.user && (req.user.role === 'admin' || req.user.isPublicModerator);
  const isCommunityAdmin = member && (member.role === 'admin' || member.role === 'moderator');

  if (!isCommunityAdmin && !isPlatformAdmin) {
    return res.status(403).json({ error: 'Only community admins or moderators can update this circle.' });
  }

  const { name, handle, description, category, location, avatar, banner, mediaGallery } = req.body;

  const updates = [];
  const params = [];

  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (handle !== undefined) { updates.push('handle = ?'); params.push(handle); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (category !== undefined) { updates.push('category = ?'); params.push(category); }
  if (location !== undefined) { updates.push('location = ?'); params.push(typeof location === 'object' ? location.address : location); }
  if (avatar !== undefined) { updates.push('avatar = ?'); params.push(avatar); }
  if (banner !== undefined) { updates.push('banner = ?'); params.push(banner); }
  if (mediaGallery !== undefined) { updates.push('media_gallery = ?'); params.push(typeof mediaGallery === 'string' ? mediaGallery : JSON.stringify(mediaGallery)); }

  if (updates.length > 0) {
    params.push(req.params.id);
    db.prepare(`UPDATE communities SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  const updated = db.prepare('SELECT * FROM communities WHERE id = ?').get(req.params.id);
  res.json(formatCommunity(updated, currentUserId));
});

// POST /api/communities/:id/media - Upload/add a photo to group media gallery
router.post('/:id/media', optionalAuth, (req, res) => {
  const community = db.prepare('SELECT * FROM communities WHERE id = ?').get(req.params.id);
  if (!community) {
    return res.status(404).json({ error: 'Community not found' });
  }

  const { url, title, date, author } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Media URL is required' });
  }

  let gallery;
  try {
    gallery = JSON.parse(community.media_gallery || '[]');
  } catch {
    gallery = [];
  }

  const newMedia = {
    id: `media_${Date.now()}`,
    url,
    title: title || 'Field Photo',
    date: date || 'Today',
    uploader: author || (req.user ? req.user.name : 'Community Member')
  };

  gallery.unshift(newMedia);

  db.prepare('UPDATE communities SET media_gallery = ? WHERE id = ?').run(JSON.stringify(gallery), req.params.id);

  res.status(201).json(newMedia);
});

// GET /api/communities/:id/moderation/vault - Quarantined discussions in this circle
router.get('/:id/moderation/vault', optionalAuth, (req, res) => {
  const currentUserId = req.user ? req.user.id : (req.query.userId || 'usr_me');
  const caller = req.user || db.prepare('SELECT * FROM users WHERE id = ?').get(currentUserId);
  const member = db.prepare('SELECT role FROM community_members WHERE community_id = ? AND user_id = ?').get(req.params.id, currentUserId);
  const isCircleMod = member && (member.role === 'admin' || member.role === 'moderator');
  const hasAccess = isCircleMod || isPlatformAdmin(caller) || Boolean(caller?.is_public_moderator);

  if (!hasAccess) {
    return res.status(403).json({ error: 'Access forbidden: only circle moderators, admins, or public moderators can inspect this vault.' });
  }

  const { search } = req.query;
  const whereClauses = ['p.community_id = ?', 'p.is_quarantined = 1'];
  const params = [req.params.id];

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    whereClauses.push('(p.content LIKE ? OR p.quarantine_reason LIKE ? OR u.name LIKE ?)');
    params.push(term, term, term);
  }

  const rows = db.prepare(`
    SELECT p.*, c.name as community_name, c.handle as community_handle,
           qmod.name as quarantined_by_name
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    LEFT JOIN communities c ON p.community_id = c.id
    LEFT JOIN users qmod ON p.quarantined_by_id = qmod.id
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY p.quarantined_at DESC, p.created_at DESC
  `).all(...params);

  res.json(rows.map(row => ({
    ...formatPost(row),
    communityName: row.community_name || 'Community Circle',
    communityHandle: row.community_handle || '',
    quarantinedByName: row.quarantined_by_name || 'Circle Moderator'
  })));
});

// GET /api/communities/:id/moderation/audit-logs - Moderation audit trail for this circle
router.get('/:id/moderation/audit-logs', optionalAuth, (req, res) => {
  const currentUserId = req.user ? req.user.id : (req.query.userId || 'usr_me');
  const caller = req.user || db.prepare('SELECT * FROM users WHERE id = ?').get(currentUserId);
  const member = db.prepare('SELECT role FROM community_members WHERE community_id = ? AND user_id = ?').get(req.params.id, currentUserId);
  const isCircleMod = member && (member.role === 'admin' || member.role === 'moderator');
  const hasAccess = isCircleMod || isPlatformAdmin(caller) || Boolean(caller?.is_public_moderator);

  if (!hasAccess) {
    return res.status(403).json({ error: 'Access forbidden: only circle moderators and platform admins can view circle audit logs.' });
  }

  const { search, actionType } = req.query;
  const whereClauses = ['mal.community_id = ?'];
  const params = [req.params.id];

  if (actionType) {
    whereClauses.push('mal.action_type = ?');
    params.push(actionType);
  }

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    whereClauses.push('(mal.reason LIKE ? OR mal.notes LIKE ? OR mal.action_type LIKE ? OR u.name LIKE ?)');
    params.push(term, term, term, term);
  }

  const rows = db.prepare(`
    SELECT mal.*, u.name as moderator_name, u.avatar as moderator_avatar
    FROM moderation_audit_logs mal
    LEFT JOIN users u ON mal.moderator_id = u.id
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY mal.created_at DESC
  `).all(...params);

  res.json(rows);
});

export default router;
