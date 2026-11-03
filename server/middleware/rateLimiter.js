import jwt from "jsonwebtoken";
import { db } from "../db/database.js";
import { JWT_SECRET } from "./auth.js";
import { isSystemAdmin } from "../utils/admin.js";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// In-memory tracking: client ID -> rate-limit record.
const writeTracker = new Map();

const WINDOW_MS = 60 * 1000;

const configuredMaxWrites = Number.parseInt(
  process.env.RATE_LIMIT_MAX_WRITES || "30",
  10,
);

if (!Number.isSafeInteger(configuredMaxWrites) || configuredMaxWrites < 1) {
  throw new Error("RATE_LIMIT_MAX_WRITES must be a positive integer.");
}

const MAX_WRITES = configuredMaxWrites;

// ---------------------------------------------------------
// HELPERS
// ---------------------------------------------------------

function getBearerToken(req) {
  const authHeader = req.headers.authorization;

  if (typeof authHeader !== "string") {
    return null;
  }

  const match = authHeader.match(/^Bearer\s+(\S+)$/i);

  return match ? match[1] : null;
}

/**
 * Resolve the caller exclusively from a verified JWT.
 *
 * Never trust x-user-id, x-mock-user, or identity fields
 * supplied through the request body.
 */
function resolveCaller(req) {
  const token = getBearerToken(req);

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (
      !decoded ||
      typeof decoded !== "object" ||
      typeof decoded.id !== "string" ||
      !decoded.id
    ) {
      return null;
    }

    // Fetch the current account status from the database.
    // This avoids relying on stale role/status information
    // embedded in a JWT.
    return (
      db
        .prepare(
          `
      SELECT id, name, handle, avatar, role, status,
             restriction_reason, restricted_at
      FROM users
      WHERE id = ?
    `,
        )
        .get(decoded.id) || null
    );
  } catch {
    return null;
  }
}

function getClientId(caller, req) {
  if (caller) {
    return `user_${caller.id}`;
  }

  return `ip_${req.ip || "anonymous"}`;
}

function cleanupExpiredRecords(now) {
  for (const [clientId, record] of writeTracker.entries()) {
    if (now >= record.resetTime) {
      writeTracker.delete(clientId);
    }
  }
}

function setRateLimitHeaders(res, record) {
  const remaining = Math.max(0, MAX_WRITES - record.count);

  res.setHeader("X-RateLimit-Limit", MAX_WRITES);
  res.setHeader("X-RateLimit-Remaining", remaining);
  res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));
}

// ---------------------------------------------------------
// WRITE RATE LIMITER
// ---------------------------------------------------------

export function writeRateLimiter(req, res, next) {
  // Only limit requests that can modify server state.
  if (!WRITE_METHODS.has(req.method)) {
    return next();
  }

  const cleanPath = req.originalUrl ? req.originalUrl.split("?")[0] : req.path;

  const caller = resolveCaller(req);

  // System administrators/coordinators retain their exemption.
  if (caller && isSystemAdmin(caller)) {
    res.setHeader("X-RateLimit-Limit", "Unlimited");
    res.setHeader("X-RateLimit-Remaining", "Unlimited");

    return next();
  }

  // Enforce account restrictions on write requests.
  if (caller && caller.status === "restricted") {
    return res.status(403).json({
      error: "Account Restricted",
      message:
        "Your account has been restricted by an administrator due to community standard violations.",
      reason:
        caller.restriction_reason ||
        "Violation of community safety and anti-spam standards.",
      restrictedAt: caller.restricted_at || null,
    });
  }

  const now = Date.now();

  cleanupExpiredRecords(now);

  const clientId = getClientId(caller, req);

  let record = writeTracker.get(clientId);

  // Start a new rate-limit window when necessary.
  if (!record || now >= record.resetTime) {
    record = {
      clientId,
      userId: caller?.id || null,

      user: caller
        ? {
            id: caller.id,
            name: caller.name,
            handle: caller.handle,
            avatar: caller.avatar,
            role: caller.role,
          }
        : null,

      ip: req.ip || "anonymous",
      count: 0,
      resetTime: now + WINDOW_MS,
      lastActionAt: now,
      lastPath: cleanPath,
      lastMethod: req.method,
    };

    writeTracker.set(clientId, record);
  }

  // Keep the most recent request information for telemetry.
  record.lastActionAt = now;
  record.lastPath = cleanPath;
  record.lastMethod = req.method;

  // Reject requests after the limit is reached.
  if (record.count >= MAX_WRITES) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((record.resetTime - now) / 1000),
    );

    res.setHeader("Retry-After", retryAfterSeconds);
    setRateLimitHeaders(res, record);

    return res.status(429).json({
      error: "Rate limit exceeded",
      message:
        "You have submitted too many requests in a short period. Please pause before continuing.",
      reason: `Anti-spam policy: maximum ${MAX_WRITES} write actions per minute per account or IP address.`,
      retryAfterSeconds,
      resetAt: new Date(record.resetTime).toISOString(),
    });
  }

  // Count this request.
  record.count += 1;

  setRateLimitHeaders(res, record);

  return next();
}

// ---------------------------------------------------------
// ADMIN RATE-LIMIT TELEMETRY
// ---------------------------------------------------------

export function getRateLimitTelemetry() {
  const now = Date.now();

  cleanupExpiredRecords(now);

  const trackedClients = [];

  for (const [clientId, record] of writeTracker.entries()) {
    const remainingSeconds = Math.max(
      0,
      Math.ceil((record.resetTime - now) / 1000),
    );

    trackedClients.push({
      clientId,
      userId: record.userId || null,
      user: record.user || null,
      ip: record.ip || "unknown",

      count: record.count,
      maxWrites: MAX_WRITES,

      remainingWrites: Math.max(0, MAX_WRITES - record.count),

      isThrottled: record.count >= MAX_WRITES,
      remainingSeconds,
      resetTime: record.resetTime,
      lastActionAt: record.lastActionAt,
      lastMethod: record.lastMethod,
      lastPath: record.lastPath,
    });
  }

  trackedClients.sort((a, b) => b.count - a.count);

  return {
    windowSeconds: WINDOW_MS / 1000,
    maxWrites: MAX_WRITES,
    totalActiveTrackers: trackedClients.length,

    throttledCount: trackedClients.filter((client) => client.isThrottled)
      .length,

    trackedClients,
  };
}

// ---------------------------------------------------------
// ADMIN RATE-LIMIT CONTROLS
// ---------------------------------------------------------

export function clearClientRateLimit(clientId) {
  if (clientId === "all") {
    writeTracker.clear();
    return true;
  }

  return writeTracker.delete(clientId);
}

// Used by automated backend tests.
export function resetRateLimits() {
  writeTracker.clear();
}

export default writeRateLimiter;
