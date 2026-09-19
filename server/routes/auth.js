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
    socialLinks: JSON.parse(row.social_links || '{}'),
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
  const { name, handle, email, password, bio, location, skills } = req.body;

  if (!name || !handle || !email || !password) {
    return res.status(400).json({ error: 'Name, handle, email, and password are required.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE handle = ? OR email = ?').get(handle, email);
  if (existing) {
    return res.status(409).json({ error: 'User with this handle or email already exists.' });
  }

  const id = `usr_${Date.now()}`;
  const passwordHash = bcrypt.hashSync(password, 10);
  
  if (email.trim().toLowerCase() === SYSTEM_ADMIN_EMAIL.toLowerCase()) {
    return res.status(400).json({ error: 'System Administrator account is pre-provisioned and cannot be registered.' });
  }

  const userRole = 'Community Member';
  const isPublicMod = 0;
  const userBadges = ['Community Member'];

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

  // Account restriction check
  if (user.status === 'restricted') {
    return res.status(403).json({
      error: 'Account Restricted',
      message: 'Your account has been restricted by an administrator due to community standard violations.',
      reason: user.restriction_reason || 'Violation of community safety and anti-spam standards.'
    });
  }

  const formatted = formatUser(user);
  const token = signToken(formatted);

  res.json({ token, user: formatted });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/google (Gmail / Google Login with mandatory password verification)
router.post('/google', (req, res) => {
  const { email, password, credential } = req.body;

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
    return res.status(400).json({ error: 'Gmail or Google email is required.' });
  }

  // MANDATORY SECURITY ENFORCEMENT: Every login from Gmail requires password authentication.
  // No guest user can bypass password checks or obtain admin access without valid password.
  if (!password) {
    return res.status(401).json({ 
      error: 'Password authentication required. Every login from Gmail requires account password verification.' 
    });
  }

  const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ? OR handle = ?').get(targetEmail, targetEmail);
  if (!user || !user.password_hash) {
    return res.status(401).json({ error: 'Invalid credentials. Account not found or password not configured.' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid password for this account.' });
  }

  // Account restriction check
  if (user.status === 'restricted') {
    return res.status(403).json({
      error: 'Account Restricted',
      message: 'Your account has been restricted by an administrator due to community standard violations.',
      reason: user.restriction_reason || 'Violation of community safety and anti-spam standards.'
    });
  }

  const formatted = formatUser(user);
  const token = signToken(formatted);

  return res.json({ token, user: formatted, isNewUser: false });
});

export default router;
