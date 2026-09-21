import express from 'express';
import { db, logModerationAudit } from '../db/database.js';
import { formatUser } from './auth.js';
import { optionalAuth } from '../middleware/auth.js';
import { isSystemAdmin, SYSTEM_ADMIN_EMAIL } from './communities.js';

const router = express.Router();

// GET /api/users
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM users').all();
  res.json(rows.map(formatUser));
});

// GET /api/users/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(formatUser(row));
});

// PATCH /api/users/:id
router.patch('/:id', optionalAuth, (req, res) => {
  const currentUserId = req.user?.id || req.body?.currentUserId;
  if (!currentUserId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  const callingUser = req.user || db.prepare('SELECT * FROM users WHERE id = ?').get(currentUserId);
  const isPlatformAdmin = callingUser && isSystemAdmin(callingUser);

  if (currentUserId !== req.params.id && !isPlatformAdmin) {
    return res.status(403).json({ error: 'Access forbidden: you cannot modify another user’s profile.' });
  }

  const { name, avatar, bio, location, skills, badges, privacySettings, socialLinks, isPublicModerator } = req.body;
  const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);

  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  const updatedName = name !== undefined ? name : targetUser.name;
  const updatedAvatar = avatar !== undefined ? avatar : targetUser.avatar;
  const updatedBio = bio !== undefined ? bio : targetUser.bio;
  const updatedAddress = location?.address || targetUser.address;
  const updatedNeighborhood = location?.neighborhood || targetUser.neighborhood;
  const updatedLat = location?.lat !== undefined ? location.lat : targetUser.lat;
  const updatedLng = location?.lng !== undefined ? location.lng : targetUser.lng;
  const updatedSkills = skills ? JSON.stringify(skills) : targetUser.skills;
  const updatedBadges = badges ? JSON.stringify(badges) : targetUser.badges;
  const updatedPrivacy = privacySettings ? JSON.stringify(privacySettings) : targetUser.privacy_settings;
  const updatedSocial = socialLinks !== undefined ? JSON.stringify(socialLinks) : targetUser.social_links;
  const updatedMod = (isPublicModerator !== undefined && isPlatformAdmin) ? (isPublicModerator ? 1 : 0) : targetUser.is_public_moderator;

  db.prepare(`
    UPDATE users 
    SET name = ?, avatar = ?, bio = ?, address = ?, neighborhood = ?, lat = ?, lng = ?, skills = ?, badges = ?, privacy_settings = ?, social_links = ?, is_public_moderator = ?
    WHERE id = ?
  `).run(
    updatedName,
    updatedAvatar,
    updatedBio,
    updatedAddress,
    updatedNeighborhood,
    updatedLat,
    updatedLng,
    updatedSkills,
    updatedBadges,
    updatedPrivacy,
    updatedSocial,
    updatedMod,
    req.params.id
  );

  const updated = formatUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id));
  res.json(updated);
});

// POST /api/users/:id/restrict - Restrict user account (System Admin only)
router.post('/:id/restrict', optionalAuth, (req, res) => {
  const adminId = req.user?.id || req.body?.adminId;
  const admin = req.user || (adminId ? db.prepare('SELECT * FROM users WHERE id = ?').get(adminId) : null);

  if (!admin || !isSystemAdmin(admin)) {
    return res.status(403).json({ error: 'Only system administrators can restrict user accounts.' });
  }

  const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { reason = 'Violation of community safety standards', notes = '' } = req.body;

  db.prepare(`
    UPDATE users
    SET status = 'restricted',
        restriction_reason = ?,
        restricted_at = CURRENT_TIMESTAMP,
        restricted_by_id = ?
    WHERE id = ?
  `).run(reason, admin.id, req.params.id);

  logModerationAudit(db, {
    moderatorId: admin.id,
    moderatorRole: admin.role || 'System Administrator',
    communityId: null,
    actionType: 'restrict_user',
    targetType: 'user',
    targetId: req.params.id,
    targetAuthorId: req.params.id,
    reason,
    notes
  });

  const updated = formatUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id));
  res.json({ success: true, user: updated });
});

// POST /api/users/:id/unrestrict - Restore user account to active status (System Admin only)
router.post('/:id/unrestrict', optionalAuth, (req, res) => {
  const adminId = req.user?.id || req.body?.adminId;
  const admin = req.user || (adminId ? db.prepare('SELECT * FROM users WHERE id = ?').get(adminId) : null);

  if (!admin || !isSystemAdmin(admin)) {
    return res.status(403).json({ error: 'Only system administrators can unrestrict user accounts.' });
  }

  const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  db.prepare(`
    UPDATE users
    SET status = 'active',
        restriction_reason = NULL,
        restricted_at = NULL,
        restricted_by_id = NULL
    WHERE id = ?
  `).run(req.params.id);

  logModerationAudit(db, {
    moderatorId: adminId,
    moderatorRole: admin.role || 'admin',
    communityId: null,
    actionType: 'unrestrict_user',
    targetType: 'user',
    targetId: req.params.id,
    targetAuthorId: req.params.id,
    reason: req.body?.reason || 'Account reinstated by System Administrator',
    notes: req.body?.notes || 'User access rights and write capabilities restored.'
  });

  const updated = formatUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id));
  res.json({ success: true, user: updated });
});

// DELETE /api/users/:id - Delete user account (self or system administrator)
router.delete('/:id', optionalAuth, (req, res) => {
  const targetId = req.params.id;
  const currentUserId = req.user?.id || req.body?.currentUserId;
  if (!currentUserId) {
    return res.status(401).json({ error: 'Authentication required to delete an account.' });
  }

  const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
  if (!targetUser) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  // Root System Administrator account cannot be deleted
  if (targetUser.email && targetUser.email.trim().toLowerCase() === SYSTEM_ADMIN_EMAIL.toLowerCase()) {
    return res.status(400).json({ error: 'The primary System Administrator account is protected and cannot be deleted.' });
  }

  const callingUser = req.user || db.prepare('SELECT * FROM users WHERE id = ?').get(currentUserId);
  const isPlatform = callingUser && isSystemAdmin(callingUser);

  if (currentUserId !== targetId && !isPlatform) {
    return res.status(403).json({ error: 'Access forbidden: you can only delete your own account.' });
  }

  const tx = db.transaction(() => {
    // 1. Auth & Notifications
    db.prepare('DELETE FROM password_reset_codes WHERE user_id = ?').run(targetId);
    db.prepare('DELETE FROM notifications WHERE user_id = ?').run(targetId);

    // 2. Direct Messages & Conversations
    db.prepare(`
      DELETE FROM direct_messages 
      WHERE conversation_id IN (SELECT id FROM conversations WHERE user1_id = ? OR user2_id = ?)
         OR sender_id = ?
    `).run(targetId, targetId, targetId);
    db.prepare('DELETE FROM conversations WHERE user1_id = ? OR user2_id = ?').run(targetId, targetId);

    // 3. Match Endorsements & Resource Assignments
    db.prepare('DELETE FROM match_endorsements WHERE user_id = ?').run(targetId);
    db.prepare('DELETE FROM resource_assignments WHERE borrower_id = ? OR assigned_by_id = ?').run(targetId, targetId);

    // 4. Communities memberships, elections, votes & created communities
    db.prepare('DELETE FROM moderator_votes WHERE voter_id = ?').run(targetId);
    db.prepare('DELETE FROM moderator_elections WHERE candidate_id = ? OR nominated_by_id = ?').run(targetId, targetId);
    db.prepare('DELETE FROM readiness_responses WHERE user_id = ?').run(targetId);
    db.prepare('DELETE FROM readiness_checks WHERE creator_id = ?').run(targetId);
    db.prepare('DELETE FROM community_members WHERE user_id = ?').run(targetId);
    // Reassign or clear creator_id on any communities created by this user
    db.prepare(`
      UPDATE communities 
      SET creator_id = (SELECT user_id FROM community_members WHERE community_id = communities.id AND role = 'admin' LIMIT 1)
      WHERE creator_id = ?
    `).run(targetId);

    // 5. Community feed posts & comments
    db.prepare('DELETE FROM post_comments WHERE author_id = ?').run(targetId);
    db.prepare(`
      DELETE FROM post_comments 
      WHERE post_id IN (SELECT id FROM posts WHERE author_id = ?)
    `).run(targetId);
    db.prepare('DELETE FROM posts WHERE author_id = ?').run(targetId);

    // 6. Reports
    db.prepare('DELETE FROM reports WHERE reporter_id = ? OR reported_user_id = ?').run(targetId, targetId);

    // 7. Mutual aid requests & responses
    db.prepare('DELETE FROM request_responses WHERE user_id = ?').run(targetId);
    db.prepare(`
      DELETE FROM request_responses 
      WHERE request_id IN (SELECT id FROM requests WHERE requester_id = ?)
    `).run(targetId);
    db.prepare('DELETE FROM requests WHERE requester_id = ?').run(targetId);

    // 8. Shared resources
    db.prepare('DELETE FROM resources WHERE provider_id = ?').run(targetId);

    // 9. Projects / Events & participants & messages
    db.prepare('DELETE FROM project_participants WHERE user_id = ?').run(targetId);
    db.prepare('DELETE FROM project_messages WHERE sender_id = ?').run(targetId);
    db.prepare(`
      DELETE FROM project_participants 
      WHERE project_id IN (SELECT id FROM projects WHERE organizer_id = ?)
    `).run(targetId);
    db.prepare(`
      DELETE FROM project_messages 
      WHERE project_id IN (SELECT id FROM projects WHERE organizer_id = ?)
    `).run(targetId);
    db.prepare('DELETE FROM projects WHERE organizer_id = ?').run(targetId);

    // 10. Long-term plans, participants & feedback
    db.prepare('DELETE FROM plan_participants WHERE user_id = ?').run(targetId);
    db.prepare('DELETE FROM plan_feedback WHERE author_id = ?').run(targetId);
    db.prepare(`
      DELETE FROM plan_participants 
      WHERE plan_id IN (SELECT id FROM plans WHERE proposer_id = ?)
    `).run(targetId);
    db.prepare(`
      DELETE FROM plan_feedback 
      WHERE plan_id IN (SELECT id FROM plans WHERE proposer_id = ?)
    `).run(targetId);
    db.prepare('DELETE FROM plans WHERE proposer_id = ?').run(targetId);

    // 11. Safety reports
    db.prepare('DELETE FROM safety_reports WHERE reporter_id = ?').run(targetId);

    // 12. Claims, disputes, responses & evidence
    db.prepare('DELETE FROM dispute_responses WHERE author_id = ?').run(targetId);
    db.prepare('DELETE FROM disputes WHERE author_id = ?').run(targetId);
    db.prepare('DELETE FROM claims WHERE author_id = ?').run(targetId);
    db.prepare(`
      DELETE FROM observation_relations 
      WHERE source_observation_id IN (SELECT id FROM observations WHERE author_id = ?)
         OR target_observation_id IN (SELECT id FROM observations WHERE author_id = ?)
    `).run(targetId, targetId);
    db.prepare(`
      DELETE FROM observation_evidence 
      WHERE observation_id IN (SELECT id FROM observations WHERE author_id = ?)
    `).run(targetId);
    db.prepare('DELETE FROM observations WHERE author_id = ?').run(targetId);
    db.prepare('DELETE FROM evidence WHERE author_id = ?').run(targetId);

    // 13. Audit logs: set moderator_id null or keep target
    db.prepare('UPDATE moderation_audit_logs SET moderator_id = NULL WHERE moderator_id = ?').run(targetId);
    db.prepare('UPDATE users SET restricted_by_id = NULL WHERE restricted_by_id = ?').run(targetId);
    db.prepare('UPDATE posts SET quarantined_by_id = NULL WHERE quarantined_by_id = ?').run(targetId);

    // 14. Finally delete the user record
    db.prepare('DELETE FROM users WHERE id = ?').run(targetId);
  });
  tx();

  logModerationAudit(db, {
    moderatorId: currentUserId,
    moderatorRole: isPlatform ? (callingUser?.role || 'admin') : 'User',
    communityId: null,
    actionType: 'delete_user_account',
    targetType: 'user',
    targetId: targetId,
    targetAuthorId: targetId,
    reason: req.body?.reason || (currentUserId === targetId ? 'Self-service account deletion by profile owner' : 'Account deleted by administrator'),
    notes: `Permanently removed user account ${targetUser.name} (${targetUser.handle}) and purged all personal data.`
  });

  res.json({ success: true, message: `Account for '${targetUser.name}' (${targetUser.handle}) has been permanently deleted.` });
});

export default router;
