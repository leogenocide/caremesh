import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'caremesh-dev-supersecret-jwt-key-2026';

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      handle: user.handle,
      name: user.name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    if (user) {
      delete user.password_hash;
      req.user = {
        ...user,
        skills: JSON.parse(user.skills || '[]'),
        badges: JSON.parse(user.badges || '[]'),
        privacySettings: JSON.parse(user.privacy_settings || '{}'),
        stats: JSON.parse(user.stats || '{}'),
        location: {
          address: user.address,
          neighborhood: user.neighborhood,
          lat: user.lat,
          lng: user.lng
        }
      };
    } else {
      req.user = null;
    }
  } catch {
    req.user = null;
  }
  next();
}

export function requireAuth(req, res, next) {
  optionalAuth(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    next();
  });
}

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions.' });
    }
    next();
  };
}
