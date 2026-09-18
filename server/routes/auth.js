import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { SYSTEM_ADMIN_EMAIL } from './communities.js';

const router = express.Router();

// Helper to format user row
export function formatUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    email: row.email,
    role: row.role,
    avatar: row.avatar,
    bio: row.bio,
    location: {
      address: row.address,
      neighborhood: row.neighborhood,
      lat: row.lat,
      lng: row.lng
    },
    skills: JSON.parse(row.skills || '[]'),
    badges: JSON.parse(row.badges || '[]'),
    privacySettings: JSON.parse(row.privacy_settings || '{}'),
    stats: JSON.parse(row.stats || '{}'),
    isPublicModerator: Boolean(row.is_public_moderator),
    status: row.status || 'active',
    restrictionReason: row.restriction_reason || null,
    restrictedAt: row.restricted_at || null,
    restrictedById: row.restricted_by_id || null,
    googleId: row.google_id || null,
    authProvider: row.auth_provider || 'local'
  };
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, handle, email, password, role, bio, location, skills } = req.body;

  if (!name || !handle || !email || !password) {
    return res.status(400).json({ error: 'Name, handle, email, and password are required.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE handle = ? OR email = ?').get(handle, email);
  if (existing) {
    return res.status(409).json({ error: 'User with this handle or email already exists.' });
  }

  const id = `usr_${Date.now()}`;
  const passwordHash = bcrypt.hashSync(password, 10);
  const isCaleb = email.trim().toLowerCase() === SYSTEM_ADMIN_EMAIL.toLowerCase();
  const userRole = isCaleb ? 'System Administrator' : (role || 'Community Member');
  const isPublicMod = isCaleb ? 1 : 0;
  const userBadges = isCaleb ? ['System Administrator', 'Verified Administrator'] : ['Community Member'];

  db.prepare(`
    INSERT INTO users (id, name, handle, email, password_hash, role, avatar, bio, address, neighborhood, lat, lng, skills, badges, privacy_settings, stats, is_public_moderator)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    name,
    handle.startsWith('@') ? handle : `@${handle}`,
    email,
    passwordHash,
    userRole,
    `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
    bio || '',
    location?.address || 'Maplewood Local Area',
    location?.neighborhood || 'Maplewood',
    location?.lat || 37.7749,
    location?.lng || -122.4194,
    JSON.stringify(skills || []),
    JSON.stringify(userBadges),
    JSON.stringify({ showExactLocation: true, allowDirectMessages: true, publicContributionHistory: true }),
    JSON.stringify({ contributions: 1, resourcesShared: 0, plansJoined: 0, requestsFulfilled: 0 }),
    isPublicMod
  );

  const newUser = formatUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id));
  const token = signToken(newUser);

  res.status(201).json({ token, user: newUser });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ error: 'Login identifier and password are required.' });
  }

  const cleanHandle = login.startsWith('@') ? login : `@${login}`;
  const user = db.prepare('SELECT * FROM users WHERE handle = ? OR email = ? OR id = ?').get(cleanHandle, login, login);

  if (!user || !user.password_hash) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const formatted = formatUser(user);
  const token = signToken(formatted);

  res.json({ token, user: formatted });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/google (Google OAuth / Gmail Login & Auto-Provisioning)
router.post('/google', (req, res) => {
  const { email, name, avatar, googleId, credential } = req.body;

  let googlePayload = null;
  if (credential) {
    try {
      const parts = credential.split('.');
      if (parts.length === 3) {
        const payloadStr = Buffer.from(parts[1], 'base64url').toString('utf8');
        googlePayload = JSON.parse(payloadStr);
      }
    } catch (e) {
      console.warn('Could not parse Google credential JWT:', e.message);
    }
  }

  const targetEmail = (googlePayload?.email || email || '').trim().toLowerCase();
  if (!targetEmail) {
    return res.status(400).json({ error: 'Google email is required.' });
  }

  const isCaleb = targetEmail === SYSTEM_ADMIN_EMAIL.toLowerCase();
  const targetName = (googlePayload?.name || name || targetEmail.split('@')[0] || (isCaleb ? 'Caleb Zothansanga' : 'Community Neighbor')).trim();
  const targetAvatar = googlePayload?.picture || avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
  const targetGoogleId = googlePayload?.sub || googleId || `g_${Date.now()}`;

  // 1. Check if user exists by google_id
  let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(targetGoogleId);

  // 2. If not found by google_id, check by email
  if (!user) {
    user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(targetEmail);
  }

  if (user) {
    // Existing user: Link google_id and ensure Caleb has System Administrator privileges
    if (isCaleb) {
      db.prepare(`
        UPDATE users 
        SET google_id = COALESCE(google_id, ?), 
            auth_provider = 'google',
            role = 'System Administrator',
            is_public_moderator = 1
        WHERE id = ?
      `).run(targetGoogleId, user.id);
    } else if (!user.google_id || user.auth_provider !== 'google') {
      db.prepare(`
        UPDATE users 
        SET google_id = COALESCE(google_id, ?), 
            auth_provider = 'google' 
        WHERE id = ?
      `).run(targetGoogleId, user.id);
    }

    const formatted = formatUser(db.prepare('SELECT * FROM users WHERE id = ?').get(user.id));
    const token = signToken(formatted);
    return res.json({ token, user: formatted, isNewUser: false });
  }

  // 3. New user: Generate unique handle from email
  const baseHandle = isCaleb ? 'caleb_admin' : targetEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  let handleCandidate = `@${baseHandle}`;
  const existingHandle = db.prepare('SELECT id FROM users WHERE handle = ?').get(handleCandidate);
  if (existingHandle) {
    handleCandidate = `@${baseHandle}_${Math.floor(100 + Math.random() * 900)}`;
  }

  const newId = `usr_g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newRole = isCaleb ? 'System Administrator' : 'Community Member';
  const newIsMod = isCaleb ? 1 : 0;
  const newBadges = isCaleb 
    ? ['System Administrator', 'Verified Administrator', 'Community Leader'] 
    : ['Verified Gmail Member'];

  db.prepare(`
    INSERT INTO users (
      id, name, handle, email, password_hash, role, avatar, bio,
      address, neighborhood, lat, lng, skills, badges, privacy_settings,
      stats, is_public_moderator, google_id, auth_provider
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newId,
    targetName,
    handleCandidate,
    targetEmail,
    null,
    newRole,
    targetAvatar,
    isCaleb 
      ? 'Primary System Administrator for CareMesh.' 
      : `Community member connecting via Gmail (${targetEmail}).`,
    'Maplewood Local Area',
    'Maplewood',
    37.7749,
    -122.4194,
    JSON.stringify(isCaleb ? ['System Administration', 'Platform Security', 'Mutual Aid Governance'] : ['Community Member', 'Neighbor']),
    JSON.stringify(newBadges),
    JSON.stringify({ showExactLocation: true, allowDirectMessages: true, publicContributionHistory: true }),
    JSON.stringify({ contributions: 1, resourcesShared: 0, plansJoined: 0, requestsFulfilled: 0 }),
    newIsMod,
    targetGoogleId,
    'google'
  );

  const newUser = formatUser(db.prepare('SELECT * FROM users WHERE id = ?').get(newId));
  const token = signToken(newUser);

  return res.status(201).json({ token, user: newUser, isNewUser: true });
});

export default router;
