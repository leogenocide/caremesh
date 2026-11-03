import express from "express";
import { randomBytes, randomInt, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "../db/database.js";
import { signToken, requireAuth } from "../middleware/auth.js";
import { SYSTEM_ADMIN_EMAIL } from "../utils/admin.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../utils/mailer.js";

const router = express.Router();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const OTP_EXPIRY_MS = 15 * 60 * 1000;
const BCRYPT_ROUNDS = 10;
const MAX_OTP_ATTEMPTS = 5;
const OTP_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const otpAttempts = new Map();

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

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
      lng: row.lng,
    },
    skills: safeJsonParse(row.skills, []),
    badges: safeJsonParse(row.badges, []),
    privacySettings: safeJsonParse(row.privacy_settings, {}),
    socialLinks: safeJsonParse(row.social_links, {}),
    stats: safeJsonParse(row.stats, {}),
    isPublicModerator: Boolean(row.is_public_moderator),
    isEmailVerified: Boolean(row.is_email_verified),
    status: row.status || "active",
    restrictionReason: row.restriction_reason || null,
    restrictedAt: row.restricted_at || null,
    restrictedById: row.restricted_by_id || null,
    googleId: row.google_id || null,
    authProvider: row.auth_provider || "local",
  };
}

function isRestricted(user) {
  return user?.status === "restricted";
}

function restrictedResponse(res, user) {
  return res.status(403).json({
    error: "Account Restricted",
    message:
      "Your account has been restricted by an administrator due to community standard violations.",
    reason:
      user.restriction_reason ||
      "Violation of community safety and anti-spam standards.",
    restrictedAt: user.restricted_at || null,
  });
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}
function normalizeHandle(handle) {
  const value = handle.trim();
  return value.startsWith("@") ? value : `@${value}`;
}
function validEmail(email) {
  return (
    typeof email === "string" &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}
function validPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    Buffer.byteLength(password, "utf8") <= 72
  );
}
function validOtp(code) {
  return typeof code === "string" && /^\d{6}$/.test(code);
}
function validHandle(handle) {
  return (
    typeof handle === "string" &&
    handle.length >= 2 &&
    handle.length <= 30 &&
    /^@[A-Za-z0-9_]{1,29}$/.test(handle)
  );
}
function getOtpAttemptKey(purpose, email, req) {
  return `${purpose}:${email}:${req.ip || "unknown"}`;
}
function checkOtpAttempt(purpose, email, req) {
  const key = getOtpAttemptKey(purpose, email, req);
  const now = Date.now();
  let record = otpAttempts.get(key);
  if (!record || now - record.startedAt >= OTP_ATTEMPT_WINDOW_MS) {
    record = { count: 0, startedAt: now };
  }
  if (record.count >= MAX_OTP_ATTEMPTS) {
    otpAttempts.set(key, record);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((OTP_ATTEMPT_WINDOW_MS - (now - record.startedAt)) / 1000),
      ),
    };
  }
  record.count += 1;
  otpAttempts.set(key, record);
  for (const [storedKey, stored] of otpAttempts.entries()) {
    if (now - stored.startedAt >= OTP_ATTEMPT_WINDOW_MS)
      otpAttempts.delete(storedKey);
  }
  return { allowed: true, retryAfterSeconds: 0 };
}
function clearOtpAttempts(purpose, email, req) {
  otpAttempts.delete(getOtpAttemptKey(purpose, email, req));
}
function invalidatePasswordResetCodes(userId) {
  db.prepare(
    "UPDATE password_reset_codes SET used = 1 WHERE user_id = ? AND used = 0",
  ).run(userId);
}

async function verifyGoogleCredential(credential) {
  if (!GOOGLE_CLIENT_ID)
    return {
      ok: false,
      status: 503,
      error: "Google authentication is not configured on this server.",
    };
  if (typeof credential !== "string" || !credential.trim())
    return {
      ok: false,
      status: 400,
      error: "Google authentication credential required.",
    };

  let response;
  try {
    response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
      { signal: AbortSignal.timeout(8000) },
    );
  } catch (error) {
    console.warn("Google verification request failed:", error.message);
    return {
      ok: false,
      status: 503,
      error:
        "Unable to verify your Google account right now. Please try again later.",
    };
  }
  if (!response.ok)
    return {
      ok: false,
      status: 401,
      error: "Invalid or expired Google credential. Please sign in again.",
    };

  let payload;
  try {
    payload = await response.json();
  } catch {
    return {
      ok: false,
      status: 401,
      error: "Invalid Google verification response.",
    };
  }
  if (payload.aud !== GOOGLE_CLIENT_ID)
    return {
      ok: false,
      status: 401,
      error: "Google credential was not issued for this application.",
    };
  if (
    payload.iss !== "https://accounts.google.com" &&
    payload.iss !== "accounts.google.com"
  ) {
    return {
      ok: false,
      status: 401,
      error: "Invalid Google credential issuer.",
    };
  }
  if (
    !payload.email ||
    !(payload.email_verified === true || payload.email_verified === "true") ||
    !payload.sub
  ) {
    return {
      ok: false,
      status: 401,
      error: "Google account email could not be verified.",
    };
  }
  return {
    ok: true,
    user: {
      email: normalizeEmail(payload.email),
      name:
        typeof payload.name === "string" && payload.name.trim()
          ? payload.name.trim().slice(0, 80)
          : payload.email.split("@")[0],
      avatar: typeof payload.picture === "string" ? payload.picture : null,
      googleId: payload.sub,
    },
  };
}

function findGoogleUser(email) {
  return db.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(email);
}
function createGoogleHandle(email) {
  const base =
    email
      .split("@")[0]
      .replace(/[^a-zA-Z0-9_]/g, "")
      .slice(0, 25) || "user";
  let handle = `@${base}`;
  while (db.prepare("SELECT id FROM users WHERE handle = ?").get(handle)) {
    handle = `@${base}_${randomInt(1000, 100000)}`;
  }
  return handle;
}
function createGoogleAccount(googleUser) {
  const id = `usr_${randomUUID()}`;
  const handle = createGoogleHandle(googleUser.email);
  const randomPassword = randomBytes(32).toString("hex");
  const passwordHash = bcrypt.hashSync(randomPassword, BCRYPT_ROUNDS);
  db.prepare(
    `
    INSERT INTO users (
      id, name, handle, email, password_hash, role, avatar, bio,
      address, neighborhood, lat, lng, skills, badges, privacy_settings,
      stats, is_public_moderator, google_id, auth_provider, is_email_verified
    ) VALUES (
      ?, ?, ?, ?, ?, 'Community Member', ?,
      'Community neighbor verified through Google account.',
      NULL, NULL, NULL, NULL,
      '["Community Support"]', '["Verified Neighbor"]',
      '{"showExactLocation":false,"allowDirectMessages":true,"publicContributionHistory":false}',
      '{"contributions":0,"resourcesShared":0,"plansJoined":0,"requestsFulfilled":0}',
      0, ?, 'google', 1
    )
  `,
  ).run(
    id,
    googleUser.name,
    handle,
    googleUser.email,
    passwordHash,
    googleUser.avatar ||
      "https://api.dicebear.com/7.x/bottts/svg?seed=SafeNeighbor&backgroundColor=b6e3f4",
    googleUser.googleId,
  );
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

// SEND REGISTRATION VERIFICATION CODE
router.post("/send-verification-code", async (req, res) => {
  const { email, handle } = req.body || {};
  if (!validEmail(email))
    return res
      .status(400)
      .json({ error: "A valid email address is required." });
  const targetEmail = normalizeEmail(email);
  if (targetEmail === SYSTEM_ADMIN_EMAIL.toLowerCase()) {
    return res.status(400).json({ error: "This email address is reserved." });
  }

  let cleanHandle = null;
  if (handle !== undefined && handle !== null && handle !== "") {
    if (typeof handle !== "string")
      return res.status(400).json({ error: "Invalid handle." });
    cleanHandle = normalizeHandle(handle);
    if (!validHandle(cleanHandle))
      return res.status(400).json({
        error:
          "Handle must be 2–30 characters and use letters, numbers, or underscores.",
      });
  }

  const code = randomInt(100000, 1000000).toString();
  const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString();
  const codeId = `evc_${randomUUID()}`;
  db.transaction(() => {
    db.prepare(
      "UPDATE email_verification_codes SET used = 1 WHERE LOWER(email) = ? AND used = 0",
    ).run(targetEmail);
    db.prepare(
      `
      INSERT INTO email_verification_codes (id, email, code_hash, expires_at, used)
      VALUES (?, ?, ?, ?, 0)
    `,
    ).run(codeId, targetEmail, codeHash, expiresAt);
  })();

  let emailResult;
  try {
    emailResult = await sendVerificationEmail(targetEmail, code);
  } catch (error) {
    console.error("Verification email delivery failed:", error);
    emailResult = { sent: false };
  }
  if (!emailResult?.sent && process.env.NODE_ENV === "production") {
    db.prepare("UPDATE email_verification_codes SET used = 1 WHERE id = ?").run(
      codeId,
    );
    return res.status(503).json({
      error:
        "Unable to send the verification email right now. Please try again later.",
    });
  }
  return res.json({
    success: true,
    emailDispatched: Boolean(emailResult?.sent),
    message: emailResult?.sent
      ? `A 6-digit verification code has been sent to ${targetEmail}. Please check your inbox.`
      : "Verification code generated, but email delivery is not configured.",
  });
});

// REGISTER
router.post("/register", async (req, res) => {
  const {
    name,
    handle,
    email,
    password,
    verificationCode,
    avatar,
    bio,
    location,
    skills,
  } = req.body || {};
  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.trim().length > 80 ||
    typeof handle !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    return res.status(400).json({
      error:
        "A name (up to 80 characters), handle, email, and password are required.",
    });
  }
  if (!validEmail(email))
    return res
      .status(400)
      .json({ error: "A valid email address is required." });
  if (!validPassword(password))
    return res.status(400).json({
      error:
        "Password must be at least 8 characters and no more than 72 UTF-8 bytes.",
    });
  if (!validOtp(verificationCode))
    return res.status(400).json({
      error: "A valid 6-digit email verification code is required.",
    });

  const targetEmail = normalizeEmail(email);
  const cleanHandle = normalizeHandle(handle);

  if (targetEmail === SYSTEM_ADMIN_EMAIL.toLowerCase())
    return res.status(400).json({
      error:
        "System Administrator account is pre-provisioned and cannot be registered.",
    });

  if (!validHandle(cleanHandle))
    return res.status(400).json({
      error:
        "Handle must be 2–30 characters and use letters, numbers, or underscores.",
    });

  // Check for an existing account before validating the OTP.
  const existing = db
    .prepare("SELECT id FROM users WHERE handle = ? OR LOWER(email) = ?")
    .get(cleanHandle, targetEmail);

  if (existing)
    return res.status(409).json({
      error: "User with this handle or email already exists.",
    });

  if (bio !== undefined && (typeof bio !== "string" || bio.length > 500)) {
    return res
      .status(400)
      .json({ error: "Bio must be 500 characters or fewer." });
  }

  if (
    avatar !== undefined &&
    (typeof avatar !== "string" || avatar.length > 2048)
  ) {
    return res.status(400).json({ error: "Invalid avatar value." });
  }

  const userSkills = Array.isArray(skills) ? skills : [];

  if (
    userSkills.length > 30 ||
    userSkills.some((s) => typeof s !== "string" || !s.trim() || s.length > 60)
  )
    return res
      .status(400)
      .json({ error: "Please provide up to 30 valid skills." });

  const attempt = checkOtpAttempt("registration", targetEmail, req);

  if (!attempt.allowed) {
    res.setHeader("Retry-After", attempt.retryAfterSeconds);
    return res.status(429).json({
      error: "Too many verification attempts. Please request a new code later.",
      retryAfterSeconds: attempt.retryAfterSeconds,
    });
  }

  const activeCodes = db
    .prepare(
      `
    SELECT * FROM email_verification_codes
    WHERE LOWER(email) = ? AND used = 0
    ORDER BY created_at DESC LIMIT 5
  `,
    )
    .all(targetEmail);

  if (!activeCodes.length)
    return res.status(400).json({
      error: "No active verification code found. Please request a new code.",
    });

  let matchedCodeRow = null;

  for (const row of activeCodes) {
    if (new Date(row.expires_at).getTime() <= Date.now()) continue;
    if (await bcrypt.compare(verificationCode, row.code_hash)) {
      matchedCodeRow = row;
      break;
    }
  }

  if (!matchedCodeRow)
    return res.status(400).json({
      error:
        "Invalid or expired verification code. Please check your email or request a new code.",
    });

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const chosenAvatar =
    typeof avatar === "string" && avatar.trim()
      ? avatar.trim()
      : "https://api.dicebear.com/7.x/bottts/svg?seed=SafeNeighbor&backgroundColor=b6e3f4";

  // Never assign a fabricated default location to a new account.
  const address =
    typeof location?.address === "string" && location.address.trim()
      ? location.address.trim().slice(0, 200)
      : null;
  const neighborhood =
    typeof location?.neighborhood === "string" && location.neighborhood.trim()
      ? location.neighborhood.trim().slice(0, 100)
      : null;
  const coordinate = (value, min, max) => {
    if (value === undefined || value === null || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) && n >= min && n <= max ? n : NaN;
  };
  const lat = coordinate(location?.lat, -90, 90);
  const lng = coordinate(location?.lng, -180, 180);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ error: "Invalid location coordinates." });
  }
  const id = `usr_${randomUUID()}`;
  const createUser = db.transaction(() => {
    const duplicate = db
      .prepare("SELECT id FROM users WHERE handle = ? OR LOWER(email) = ?")
      .get(cleanHandle, targetEmail);
    if (duplicate) throw new Error("DUPLICATE_ACCOUNT");

    const consumed = db
      .prepare(
        `
      UPDATE email_verification_codes SET used = 1
      WHERE id = ? AND used = 0 AND expires_at > ?
    `,
      )
      .run(matchedCodeRow.id, new Date().toISOString());
    if (consumed.changes !== 1)
      throw new Error("VERIFICATION_CODE_ALREADY_USED");

    db.prepare(
      `
      INSERT INTO users (
        id, name, handle, email, password_hash, role, avatar, bio,
        address, neighborhood, lat, lng, skills, badges, privacy_settings,
        stats, is_public_moderator, is_email_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `,
    ).run(
      id,
      name.trim(),
      cleanHandle,
      targetEmail,
      passwordHash,
      "Community Member",
      chosenAvatar,
      typeof bio === "string" ? bio.trim() : "",
      address,
      neighborhood,
      lat,
      lng,
      JSON.stringify(userSkills.map((s) => s.trim())),
      JSON.stringify(["Community Member"]),
      JSON.stringify({
        showExactLocation: false,
        allowDirectMessages: true,
        publicContributionHistory: false,
      }),
      JSON.stringify({
        contributions: 0,
        resourcesShared: 0,
        plansJoined: 0,
        requestsFulfilled: 0,
      }),
      0,
    );
  });

  try {
    createUser();
  } catch (error) {
    if (error.message === "DUPLICATE_ACCOUNT")
      return res.status(409).json({
        error: "User with this handle or email already exists.",
      });
    if (error.message === "VERIFICATION_CODE_ALREADY_USED")
      return res.status(400).json({
        error: "This verification code has already been used or expired.",
      });
    throw error;
  }

  clearOtpAttempts("registration", targetEmail, req);
  const newUser = formatUser(
    db.prepare("SELECT * FROM users WHERE id = ?").get(id),
  );
  return res.status(201).json({ token: signToken(newUser), user: newUser });
});

// LOGIN
router.post("/login", async (req, res) => {
  const { login, password } = req.body || {};
  if (
    typeof login !== "string" ||
    !login.trim() ||
    typeof password !== "string" ||
    !password
  ) {
    return res
      .status(400)
      .json({ error: "Login identifier and password are required." });
  }
  const identifier = login.trim();
  const user = db
    .prepare(
      `
    SELECT * FROM users
    WHERE handle = ? OR LOWER(email) = ? OR id = ?
  `,
    )
    .get(normalizeHandle(identifier), identifier.toLowerCase(), identifier);

  if (!user?.password_hash)
    return res.status(401).json({ error: "Invalid credentials." });
  if (!(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: "Invalid credentials." });
  }
  if (isRestricted(user)) return restrictedResponse(res, user);
  const formatted = formatUser(user);
  return res.json({ token: signToken(formatted), user: formatted });
});

// CURRENT USER
router.get("/me", requireAuth, (req, res) => res.json({ user: req.user }));

// GOOGLE SIGN-IN — only a verified Google ID token is accepted.
router.post("/google", async (req, res) => {
  const credential = req.body?.credential;

  if (typeof credential !== "string" || !credential.trim()) {
    return res.status(400).json({
      error: "Google authentication credential required.",
    });
  }

  const verification = await verifyGoogleCredential(credential);
  if (!verification.ok)
    return res.status(verification.status).json({ error: verification.error });

  const googleUser = verification.user;
  let user = findGoogleUser(googleUser.email);
  let isNewUser = false;

  if (!user) {
    const linked = db
      .prepare("SELECT id FROM users WHERE google_id = ?")
      .get(googleUser.googleId);
    if (linked)
      return res.status(409).json({
        error:
          "This Google account is already linked to another CareMesh account.",
      });
    user = createGoogleAccount(googleUser);
    isNewUser = true;
  } else {
    if (user.google_id && user.google_id !== googleUser.googleId) {
      return res.status(409).json({
        error:
          "This CareMesh account is already linked to a different Google account.",
      });
    }
    const linkedElsewhere = db
      .prepare("SELECT id FROM users WHERE google_id = ? AND id != ?")
      .get(googleUser.googleId, user.id);
    if (linkedElsewhere)
      return res.status(409).json({
        error:
          "This Google account is already linked to another CareMesh account.",
      });
    if (!user.google_id) {
      db.prepare(
        "UPDATE users SET google_id = ?, auth_provider = 'google' WHERE id = ?",
      ).run(googleUser.googleId, user.id);
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
    }
  }

  if (isRestricted(user)) return restrictedResponse(res, user);
  const formatted = formatUser(user);
  return res.json({ token: signToken(formatted), user: formatted, isNewUser });
});

// CHANGE PASSWORD
router.post("/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (
    typeof currentPassword !== "string" ||
    !currentPassword ||
    typeof newPassword !== "string" ||
    !newPassword
  ) {
    return res.status(400).json({
      error: "Current password and new password are required.",
    });
  }
  if (!validPassword(newPassword))
    return res.status(400).json({
      error:
        "New password must be at least 8 characters and no more than 72 UTF-8 bytes.",
    });

  const user = db
    .prepare("SELECT id, password_hash FROM users WHERE id = ?")
    .get(req.user.id);
  if (!user?.password_hash)
    return res.status(404).json({ error: "User account not found." });
  if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
    return res.status(401).json({ error: "Current password is incorrect." });
  }

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  db.transaction(() => {
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
      newHash,
      req.user.id,
    );
    invalidatePasswordResetCodes(req.user.id);
  })();
  return res.json({ success: true, message: "Password updated successfully." });
});

// FORGOT PASSWORD
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body || {};
  if (!validEmail(email))
    return res
      .status(400)
      .json({ error: "A valid email address is required." });
  const targetEmail = normalizeEmail(email);
  const user = db
    .prepare("SELECT id, name, email FROM users WHERE LOWER(email) = ?")
    .get(targetEmail);

  const genericResponse = {
    success: true,
    message:
      "If an account exists with this email, a 6-digit password reset code has been sent.",
  };
  if (!user) return res.json(genericResponse);

  const code = randomInt(100000, 1000000).toString();
  const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString();
  const resetId = `prc_${randomUUID()}`;
  db.transaction(() => {
    db.prepare(
      "UPDATE password_reset_codes SET used = 1 WHERE email = ? AND used = 0",
    ).run(targetEmail);
    db.prepare(
      `
      INSERT INTO password_reset_codes (id, user_id, email, code_hash, expires_at, used)
      VALUES (?, ?, ?, ?, ?, 0)
    `,
    ).run(resetId, user.id, targetEmail, codeHash, expiresAt);
  })();

  let emailResult;
  try {
    emailResult = await sendPasswordResetEmail(targetEmail, code);
  } catch (error) {
    console.error("Password reset email delivery failed:", error);
    emailResult = { sent: false };
  }

  if (!emailResult?.sent && process.env.NODE_ENV === "production") {
    db.prepare("UPDATE password_reset_codes SET used = 1 WHERE id = ?").run(
      resetId,
    );
    return res.json(genericResponse);
  }
  if (process.env.NODE_ENV !== "production") {
    return res.json({
      ...genericResponse,
      emailDispatched: Boolean(emailResult?.sent),
      devCode: code,
    });
  }
  return res.json(genericResponse);
});

// RESET PASSWORD WITH EMAIL CODE
router.post("/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body || {};
  if (
    !validEmail(email) ||
    !validOtp(code) ||
    typeof newPassword !== "string"
  ) {
    return res.status(400).json({
      error: "Email, valid 6-digit reset code, and new password are required.",
    });
  }
  if (!validPassword(newPassword))
    return res.status(400).json({
      error:
        "New password must be at least 8 characters and no more than 72 UTF-8 bytes.",
    });

  const targetEmail = normalizeEmail(email);
  const attempt = checkOtpAttempt("password-reset", targetEmail, req);
  if (!attempt.allowed) {
    res.setHeader("Retry-After", attempt.retryAfterSeconds);
    return res.status(429).json({
      error: "Too many reset attempts. Please try again later.",
      retryAfterSeconds: attempt.retryAfterSeconds,
    });
  }

  const activeCodes = db
    .prepare(
      `
    SELECT * FROM password_reset_codes
    WHERE LOWER(email) = ? AND used = 0
    ORDER BY created_at DESC LIMIT 5
  `,
    )
    .all(targetEmail);
  if (!activeCodes.length)
    return res.status(400).json({
      error:
        "No active password reset request found, or the code has already been used.",
    });

  let matchedCodeRow = null;
  for (const row of activeCodes) {
    if (new Date(row.expires_at).getTime() <= Date.now()) continue;
    if (await bcrypt.compare(code, row.code_hash)) {
      matchedCodeRow = row;
      break;
    }
  }
  if (!matchedCodeRow)
    return res.status(400).json({
      error: "Invalid or expired reset code. Please request a new code.",
    });

  const user = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(matchedCodeRow.user_id);
  if (!user) return res.status(404).json({ error: "User account not found." });
  if (isRestricted(user)) return restrictedResponse(res, user);

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  try {
    db.transaction(() => {
      const consumed = db
        .prepare(
          `
        UPDATE password_reset_codes SET used = 1
        WHERE id = ? AND used = 0 AND expires_at > ?
      `,
        )
        .run(matchedCodeRow.id, new Date().toISOString());
      if (consumed.changes !== 1) throw new Error("RESET_CODE_ALREADY_USED");
      db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
        newHash,
        user.id,
      );
      invalidatePasswordResetCodes(user.id);
    })();
  } catch (error) {
    if (error.message === "RESET_CODE_ALREADY_USED")
      return res.status(400).json({
        error: "This reset code has already been used or expired.",
      });
    throw error;
  }

  clearOtpAttempts("password-reset", targetEmail, req);
  const updatedUser = formatUser(
    db.prepare("SELECT * FROM users WHERE id = ?").get(user.id),
  );
  return res.json({
    success: true,
    message:
      "Your password has been successfully reset. You are now logged in.",
    token: signToken(updatedUser),
    user: updatedUser,
  });
});

// RESET PASSWORD WITH GOOGLE
router.post("/reset-password-with-google", async (req, res) => {
  const { credential, newPassword } = req.body || {};
  if (typeof credential !== "string" || typeof newPassword !== "string") {
    return res
      .status(400)
      .json({ error: "Google credential and new password are required." });
  }
  if (!validPassword(newPassword))
    return res.status(400).json({
      error:
        "New password must be at least 8 characters and no more than 72 UTF-8 bytes.",
    });

  const verification = await verifyGoogleCredential(credential);
  if (!verification.ok)
    return res.status(verification.status).json({ error: verification.error });

  const { email: verifiedEmail, googleId } = verification.user;
  const user = db
    .prepare("SELECT * FROM users WHERE LOWER(email) = ?")
    .get(verifiedEmail);
  if (!user)
    return res.status(404).json({
      error:
        "No CareMesh account was found for this verified Google email. You can sign in with Google to create an account.",
    });
  if (isRestricted(user)) return restrictedResponse(res, user);
  if (user.google_id && user.google_id !== googleId)
    return res.status(403).json({
      error: "This CareMesh account is linked to a different Google account.",
    });

  const linkedElsewhere = db
    .prepare("SELECT id FROM users WHERE google_id = ? AND id != ?")
    .get(googleId, user.id);
  if (linkedElsewhere)
    return res.status(409).json({
      error:
        "This Google account is already linked to another CareMesh account.",
    });

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  db.transaction(() => {
    db.prepare(
      `
      UPDATE users SET password_hash = ?, google_id = COALESCE(google_id, ?),
      auth_provider = 'google' WHERE id = ?
    `,
    ).run(newHash, googleId, user.id);
    invalidatePasswordResetCodes(user.id);
  })();

  const updatedUser = formatUser(
    db.prepare("SELECT * FROM users WHERE id = ?").get(user.id),
  );
  return res.json({
    success: true,
    message: "Password reset successfully. You are now logged in.",
    token: signToken(updatedUser),
    user: updatedUser,
  });
});

export default router;
