import express from 'express';
import { db, logModerationAudit } from '../db/database.js';
import { formatUser } from './auth.js';
import { optionalAuth } from '../middleware/auth.js';
import { isSystemAdmin } from './communities.js';

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

  const { name, avatar, bio, location, skills, badges, privacySettings, isPublicModerator } = req.body;
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
  const updatedMod = (isPublicModerator !== undefined && isPlatformAdmin) ? (isPublicModerator ? 1 : 0) : targetUser.is_public_moderator;

  db.prepare(`
    UPDATE users 
    SET name = ?, avatar = ?, bio = ?, address = ?, neighborhood = ?, lat = ?, lng = ?, skills = ?, badges = ?, privacy_settings = ?, is_public_moderator = ?
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
    updatedMod,
    req.params.id
  );

  const updated = formatUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id));
  res.json(updated);
});

// POST /api/users/:id/toggle-public-moderator
router.post('/:id/toggle-public-moderator', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const nextVal = user.is_public_moderator ? 0 : 1;
  db.prepare('UPDATE users SET is_public_moderator = ? WHERE id = ?').run(nextVal, req.params.id);
  res.json(formatUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)));
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

export default router;
