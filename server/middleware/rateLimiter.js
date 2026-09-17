import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';
import { JWT_SECRET } from './auth.js';
import { isSystemAdmin } from '../routes/communities.js';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const EXEMPT_PATHS = new Set([
  '/api/health',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/google',
  '/api/auth/switch-user'
]);

// In-memory rate limiting store: clientId -> { count: number, resetTime: number }
const writeTracker = new Map();

// Default 30 write actions per 60 seconds
const WINDOW_MS = 60 * 1000;
const MAX_WRITES = parseInt(process.env.RATE_LIMIT_MAX_WRITES || '30', 10);

/**
 * Resolve caller user from authorization header or request body
 */
function resolveCaller(req) {
  if (req.user) return req.user;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded?.id) {
        return db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
      }
    } catch {
      // Invalid token, fall through
    }
  }

  const headerUserId = req.headers['x-user-id'] || req.headers['x-mock-user'];
  if (headerUserId) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(headerUserId);
    if (user) return user;
  }

  const fallbackId = req.body?.userId || req.body?.authorId || req.body?.reporterId || req.body?.borrowerId;
  if (fallbackId) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(fallbackId);
  }

  return null;
}

/**
 * Write Rate Limiting & Account Restriction Middleware
 */
export function writeRateLimiter(req, res, next) {
  // 1. Only enforce on state-modifying write methods
  if (!WRITE_METHODS.has(req.method)) {
    return next();
  }

  // 2. Allow essential auth and health endpoints
  const cleanPath = req.originalUrl ? req.originalUrl.split('?')[0] : req.path;
  if (EXEMPT_PATHS.has(cleanPath)) {
    return next();
  }

  const caller = resolveCaller(req);

  // 3. System Administrator & Coordinator Exemption
  if (caller && isSystemAdmin(caller)) {
    res.setHeader('X-RateLimit-Limit', 'Unlimited');
    res.setHeader('X-RateLimit-Remaining', 'Unlimited');
    return next();
  }

  // 4. Account Restriction Enforcement (Audit-preserved ban)
  if (caller && caller.status === 'restricted') {
    return res.status(403).json({
      error: 'Account Restricted',
      message: 'Your account has been restricted by an administrator due to community standard violations.',
      reason: caller.restriction_reason || 'Violation of community safety and anti-spam standards.',
      restrictedAt: caller.restricted_at
    });
  }

  // 5. Rate Limit Tracking per Client ID (user ID or remote IP)
  const now = Date.now();
  const clientId = caller ? `user_${caller.id}` : `ip_${req.ip || 'anonymous'}`;

  const currentRecord = writeTracker.get(clientId);

  if (!currentRecord || now > currentRecord.resetTime) {
    writeTracker.set(clientId, {
      clientId,
      userId: caller ? caller.id : null,
      user: caller ? { id: caller.id, name: caller.name, handle: caller.handle, avatar: caller.avatar, role: caller.role } : null,
      ip: req.ip || 'anonymous',
      count: 1,
      resetTime: now + WINDOW_MS,
      lastActionAt: now,
      lastPath: cleanPath,
      lastMethod: req.method
    });

    res.setHeader('X-RateLimit-Limit', MAX_WRITES);
    res.setHeader('X-RateLimit-Remaining', MAX_WRITES - 1);
    res.setHeader('X-RateLimit-Reset', Math.ceil((now + WINDOW_MS) / 1000));
    return next();
  }

  currentRecord.lastActionAt = now;
  currentRecord.lastPath = cleanPath;
  currentRecord.lastMethod = req.method;

  if (currentRecord.count >= MAX_WRITES) {
    const retryAfterSeconds = Math.max(1, Math.ceil((currentRecord.resetTime - now) / 1000));

    res.setHeader('Retry-After', retryAfterSeconds);
    res.setHeader('X-RateLimit-Limit', MAX_WRITES);
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader('X-RateLimit-Reset', Math.ceil(currentRecord.resetTime / 1000));

    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'You have submitted too many requests in a short period. Please pause a moment before continuing.',
      reason: `Anti-spam policy: maximum ${MAX_WRITES} write actions per minute per account.`,
      retryAfterSeconds,
      resetAt: new Date(currentRecord.resetTime).toISOString()
    });
  }

  currentRecord.count += 1;
  res.setHeader('X-RateLimit-Limit', MAX_WRITES);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_WRITES - currentRecord.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(currentRecord.resetTime / 1000));

  next();
}

/**
 * Get live rate limiting and anti-spam telemetry for administrative dashboard
 */
export function getRateLimitTelemetry() {
  const now = Date.now();
  const trackedClients = [];

  for (const [clientId, record] of writeTracker.entries()) {
    if (now > record.resetTime) {
      writeTracker.delete(clientId);
      continue;
    }

    const remainingSeconds = Math.max(0, Math.ceil((record.resetTime - now) / 1000));
    trackedClients.push({
      clientId,
      userId: record.userId || null,
      user: record.user || null,
      ip: record.ip || 'unknown',
      count: record.count,
      maxWrites: MAX_WRITES,
      remainingWrites: Math.max(0, MAX_WRITES - record.count),
      isThrottled: record.count >= MAX_WRITES,
      remainingSeconds,
      resetTime: record.resetTime,
      lastActionAt: record.lastActionAt,
      lastMethod: record.lastMethod,
      lastPath: record.lastPath
    });
  }

  // Sort by count descending (most active first)
  trackedClients.sort((a, b) => b.count - a.count);

  return {
    windowSeconds: WINDOW_MS / 1000,
    maxWrites: MAX_WRITES,
    totalActiveTrackers: trackedClients.length,
    throttledCount: trackedClients.filter(c => c.isThrottled).length,
    trackedClients
  };
}

/**
 * Clear rate limit for a specific client ID or all clients
 */
export function clearClientRateLimit(clientId) {
  if (clientId === 'all') {
    writeTracker.clear();
    return true;
  }
  return writeTracker.delete(clientId);
}

/**
 * Helper to clear rate limit tracker (used in test suites)
 */
export function resetRateLimits() {
  writeTracker.clear();
}

export default writeRateLimiter;
