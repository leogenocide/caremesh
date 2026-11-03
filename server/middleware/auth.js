import jwt from "jsonwebtoken";
import { db } from "../db/database.js";

export const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
// ---------------------------------------------------------
// JWT TOKEN GENERATION
// ---------------------------------------------------------

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      handle: user.handle,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
}
// ---------------------------------------------------------
// HELPERS
// ---------------------------------------------------------

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization;

  if (typeof authHeader !== "string") {
    return null;
  }

  const match = authHeader.match(/^Bearer\s+(\S+)$/i);

  return match ? match[1] : null;
}

function buildAuthenticatedUser(row) {
  if (!row) return null;

  // Never expose the password hash through req.user.
  const { password_hash, ...safeUser } = row;

  return {
    ...safeUser,

    skills: safeJsonParse(row.skills, []),
    badges: safeJsonParse(row.badges, []),
    privacySettings: safeJsonParse(row.privacy_settings, {}),
    socialLinks: safeJsonParse(row.social_links, {}),
    stats: safeJsonParse(row.stats, {}),

    isPublicModerator: Boolean(row.is_public_moderator),
    isEmailVerified: Boolean(row.is_email_verified),

    location: {
      address: row.address,
      neighborhood: row.neighborhood,
      lat: row.lat,
      lng: row.lng,
    },
  };
}

// ---------------------------------------------------------
// OPTIONAL AUTHENTICATION
// ---------------------------------------------------------

export function optionalAuth(req, res, next) {
  const token = getBearerToken(req);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Tokens must contain a valid user ID.
    if (
      !decoded ||
      typeof decoded !== "object" ||
      typeof decoded.id !== "string" ||
      !decoded.id
    ) {
      req.user = null;
      return next();
    }

    const user = db
      .prepare(
        `
      SELECT *
      FROM users
      WHERE id = ?
    `,
      )
      .get(decoded.id);

    req.user = buildAuthenticatedUser(user);
  } catch {
    // Invalid, expired, or malformed tokens are treated as unauthenticated.
    req.user = null;
  }

  return next();
}

// ---------------------------------------------------------
// REQUIRED AUTHENTICATION
// ---------------------------------------------------------

export function requireAuth(req, res, next) {
  return optionalAuth(req, res, () => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required. Please log in.",
      });
    }

    return next();
  });
}

// ---------------------------------------------------------
// ROLE-BASED AUTHORIZATION
// ---------------------------------------------------------

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required.",
      });
    }

    if (!Array.isArray(allowedRoles)) {
      return res.status(500).json({
        error: "Invalid role configuration.",
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Forbidden: insufficient permissions.",
      });
    }

    return next();
  };
}
