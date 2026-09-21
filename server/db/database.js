import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'caremesh.db');

export const db = new Database(DB_PATH);

// Optimize SQLite settings
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
export function initDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Pre-migration for existing tables so schema indexes on new columns do not fail
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
    if (tables.includes('requests')) {
      const reqCols = db.prepare("PRAGMA table_info(requests)").all();
      if (!reqCols.some(c => c.name === 'community_id')) {
        db.prepare("ALTER TABLE requests ADD COLUMN community_id TEXT").run();
      }
      if (!reqCols.some(c => c.name === 'visibility')) {
        db.prepare("ALTER TABLE requests ADD COLUMN visibility TEXT DEFAULT 'public'").run();
      }
      if (!reqCols.some(c => c.name === 'scheduled_date')) {
        db.prepare("ALTER TABLE requests ADD COLUMN scheduled_date TEXT").run();
      }
    }
    if (tables.includes('posts')) {
      const postCols = db.prepare("PRAGMA table_info(posts)").all();
      if (!postCols.some(c => c.name === 'restricted_user_ids')) {
        db.prepare("ALTER TABLE posts ADD COLUMN restricted_user_ids TEXT DEFAULT '[]'").run();
      }
      if (!postCols.some(c => c.name === 'category')) {
        db.prepare("ALTER TABLE posts ADD COLUMN category TEXT").run();
      }
      if (!postCols.some(c => c.name === 'is_quarantined')) {
        db.prepare("ALTER TABLE posts ADD COLUMN is_quarantined INTEGER DEFAULT 0").run();
      }
      if (!postCols.some(c => c.name === 'quarantined_at')) {
        db.prepare("ALTER TABLE posts ADD COLUMN quarantined_at DATETIME").run();
      }
      if (!postCols.some(c => c.name === 'quarantined_by_id')) {
        db.prepare("ALTER TABLE posts ADD COLUMN quarantined_by_id TEXT").run();
      }
      if (!postCols.some(c => c.name === 'quarantine_reason')) {
        db.prepare("ALTER TABLE posts ADD COLUMN quarantine_reason TEXT").run();
      }
    }
    if (tables.includes('users')) {
      const userCols = db.prepare("PRAGMA table_info(users)").all();
      if (!userCols.some(c => c.name === 'status')) {
        db.prepare("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'").run();
      }
      if (!userCols.some(c => c.name === 'restriction_reason')) {
        db.prepare("ALTER TABLE users ADD COLUMN restriction_reason TEXT").run();
      }
      if (!userCols.some(c => c.name === 'restricted_at')) {
        db.prepare("ALTER TABLE users ADD COLUMN restricted_at DATETIME").run();
      }
      if (!userCols.some(c => c.name === 'restricted_by_id')) {
        db.prepare("ALTER TABLE users ADD COLUMN restricted_by_id TEXT").run();
      }
    }
    if (tables.includes('readiness_checks')) {
      const rcCols = db.prepare("PRAGMA table_info(readiness_checks)").all();
      if (!rcCols.some(c => c.name === 'request_id')) {
        db.prepare("ALTER TABLE readiness_checks ADD COLUMN request_id TEXT").run();
      }
      if (!rcCols.some(c => c.name === 'event_id')) {
        db.prepare("ALTER TABLE readiness_checks ADD COLUMN event_id TEXT").run();
      }
    }
  } catch (err) {
    console.warn('Pre-migration warning:', err.message);
  }

  db.exec(schemaSql);

  // Safe migrations for newly added columns on existing tables
  try {
    const postCols = db.prepare("PRAGMA table_info(posts)").all();
    if (!postCols.some(c => c.name === 'restricted_user_ids')) {
      db.prepare("ALTER TABLE posts ADD COLUMN restricted_user_ids TEXT DEFAULT '[]'").run();
    }
    if (!postCols.some(c => c.name === 'category')) {
      db.prepare("ALTER TABLE posts ADD COLUMN category TEXT").run();
    }
    if (!postCols.some(c => c.name === 'is_quarantined')) {
      db.prepare("ALTER TABLE posts ADD COLUMN is_quarantined INTEGER DEFAULT 0").run();
    }
    if (!postCols.some(c => c.name === 'quarantined_at')) {
      db.prepare("ALTER TABLE posts ADD COLUMN quarantined_at DATETIME").run();
    }
    if (!postCols.some(c => c.name === 'quarantined_by_id')) {
      db.prepare("ALTER TABLE posts ADD COLUMN quarantined_by_id TEXT").run();
    }
    if (!postCols.some(c => c.name === 'quarantine_reason')) {
      db.prepare("ALTER TABLE posts ADD COLUMN quarantine_reason TEXT").run();
    }
    const userCols = db.prepare("PRAGMA table_info(users)").all();
    if (!userCols.some(c => c.name === 'is_public_moderator')) {
      db.prepare("ALTER TABLE users ADD COLUMN is_public_moderator INTEGER DEFAULT 0").run();
    }
    if (!userCols.some(c => c.name === 'status')) {
      db.prepare("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'").run();
    }
    if (!userCols.some(c => c.name === 'restriction_reason')) {
      db.prepare("ALTER TABLE users ADD COLUMN restriction_reason TEXT").run();
    }
    if (!userCols.some(c => c.name === 'restricted_at')) {
      db.prepare("ALTER TABLE users ADD COLUMN restricted_at DATETIME").run();
    }
    if (!userCols.some(c => c.name === 'restricted_by_id')) {
      db.prepare("ALTER TABLE users ADD COLUMN restricted_by_id TEXT").run();
    }
    if (!userCols.some(c => c.name === 'google_id')) {
      db.prepare("ALTER TABLE users ADD COLUMN google_id TEXT").run();
    }
    if (!userCols.some(c => c.name === 'auth_provider')) {
      db.prepare("ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'local'").run();
    }
    if (!userCols.some(c => c.name === 'social_links')) {
      db.prepare("ALTER TABLE users ADD COLUMN social_links TEXT DEFAULT '{}'").run();
    }
    const reportCols = db.prepare("PRAGMA table_info(reports)").all();
    if (!reportCols.some(c => c.name === 'scope')) {
      db.prepare("ALTER TABLE reports ADD COLUMN scope TEXT DEFAULT 'community'").run();
    }
    const rcCols = db.prepare("PRAGMA table_info(readiness_checks)").all();
    if (!rcCols.some(c => c.name === 'target_headcount')) {
      db.prepare("ALTER TABLE readiness_checks ADD COLUMN target_headcount INTEGER DEFAULT 5").run();
    }
    if (!rcCols.some(c => c.name === 'request_id')) {
      db.prepare("ALTER TABLE readiness_checks ADD COLUMN request_id TEXT").run();
    }
    if (!rcCols.some(c => c.name === 'event_id')) {
      db.prepare("ALTER TABLE readiness_checks ADD COLUMN event_id TEXT").run();
    }
    const raCols = db.prepare("PRAGMA table_info(resource_assignments)").all();
    if (!raCols.some(c => c.name === 'borrower_id')) {
      db.prepare("ALTER TABLE resource_assignments ADD COLUMN borrower_id TEXT").run();
    }
    if (!raCols.some(c => c.name === 'purpose')) {
      db.prepare("ALTER TABLE resource_assignments ADD COLUMN purpose TEXT").run();
    }
    if (!raCols.some(c => c.name === 'start_date')) {
      db.prepare("ALTER TABLE resource_assignments ADD COLUMN start_date TEXT").run();
    }
    if (!raCols.some(c => c.name === 'due_date')) {
      db.prepare("ALTER TABLE resource_assignments ADD COLUMN due_date TEXT").run();
    }
    if (!raCols.some(c => c.name === 'return_date')) {
      db.prepare("ALTER TABLE resource_assignments ADD COLUMN return_date TEXT").run();
    }
    if (!raCols.some(c => c.name === 'return_condition')) {
      db.prepare("ALTER TABLE resource_assignments ADD COLUMN return_condition TEXT").run();
    }
    if (!raCols.some(c => c.name === 'requested_quantity')) {
      db.prepare("ALTER TABLE resource_assignments ADD COLUMN requested_quantity TEXT").run();
    }
    if (!raCols.some(c => c.name === 'terms_accepted')) {
      db.prepare("ALTER TABLE resource_assignments ADD COLUMN terms_accepted INTEGER DEFAULT 1").run();
    }
    const reqCols = db.prepare("PRAGMA table_info(requests)").all();
    if (!reqCols.some(c => c.name === 'community_id')) {
      db.prepare("ALTER TABLE requests ADD COLUMN community_id TEXT").run();
    }
    if (!reqCols.some(c => c.name === 'visibility')) {
      db.prepare("ALTER TABLE requests ADD COLUMN visibility TEXT DEFAULT 'public'").run();
    }
    if (!reqCols.some(c => c.name === 'scheduled_date')) {
      db.prepare("ALTER TABLE requests ADD COLUMN scheduled_date TEXT").run();
    }
    if (!reqCols.some(c => c.name === 'scheduled_time')) {
      db.prepare("ALTER TABLE requests ADD COLUMN scheduled_time TEXT").run();
    }

    const projCols = db.prepare("PRAGMA table_info(projects)").all();
    if (!projCols.some(c => c.name === 'custom_event_type')) {
      db.prepare("ALTER TABLE projects ADD COLUMN custom_event_type TEXT").run();
    }
    if (!projCols.some(c => c.name === 'attendee_privacy')) {
      db.prepare("ALTER TABLE projects ADD COLUMN attendee_privacy TEXT DEFAULT 'public'").run();
    }
    if (!projCols.some(c => c.name === 'chat_privacy')) {
      db.prepare("ALTER TABLE projects ADD COLUMN chat_privacy TEXT DEFAULT 'members_only'").run();
    }

    const evCols = db.prepare("PRAGMA table_info(evidence)").all();
    if (!evCols.some(c => c.name === 'parent_evidence_id')) {
      db.prepare("ALTER TABLE evidence ADD COLUMN parent_evidence_id TEXT").run();
    }
    if (!evCols.some(c => c.name === 'parent_observation_id')) {
      db.prepare("ALTER TABLE evidence ADD COLUMN parent_observation_id TEXT").run();
    }

    const commCols = db.prepare("PRAGMA table_info(communities)").all();
    if (!commCols.some(c => c.name === 'creator_id')) {
      db.prepare("ALTER TABLE communities ADD COLUMN creator_id TEXT").run();
      try {
        db.prepare(`
          UPDATE communities
          SET creator_id = (
            SELECT user_id FROM community_members
            WHERE community_id = communities.id AND role = 'admin'
            ORDER BY joined_at ASC LIMIT 1
          )
          WHERE creator_id IS NULL
        `).run();
      } catch {
        // Ignore if community_members isn't ready
      }
    }

    db.prepare(`
      CREATE TABLE IF NOT EXISTS password_reset_codes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        email TEXT NOT NULL,
        code_hash TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        used INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_reset_codes_email ON password_reset_codes(email)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_reset_codes_user ON password_reset_codes(user_id)`).run();

    const obsCols = db.prepare("PRAGMA table_info(observations)").all();
    if (!obsCols.some(c => c.name === 'referenced_evidence_id')) {
      db.prepare("ALTER TABLE observations ADD COLUMN referenced_evidence_id TEXT").run();
    }
    if (!obsCols.some(c => c.name === 'referenced_evidence_title')) {
      db.prepare("ALTER TABLE observations ADD COLUMN referenced_evidence_title TEXT").run();
    }

    db.exec(`
      CREATE TABLE IF NOT EXISTS dispute_responses (
        id TEXT PRIMARY KEY,
        dispute_id TEXT NOT NULL,
        type TEXT NOT NULL,
        author_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        reason TEXT,
        explanation TEXT NOT NULL,
        evidence_ids TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE,
        FOREIGN KEY (author_id) REFERENCES users(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS match_endorsements (
        id TEXT PRIMARY KEY,
        match_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(match_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_match_endorsements_mid ON match_endorsements(match_id);
      CREATE INDEX IF NOT EXISTS idx_match_endorsements_uid ON match_endorsements(user_id);
    `);
  } catch (err) {
    console.warn('Migration warning for new columns:', err.message);
  }

  // 1. Remove all demo accounts from public moderators (enforce only Caleb is initial public moderator)
  try {
    db.prepare("UPDATE users SET is_public_moderator = 0 WHERE email != 'caleb.zothansanga@gmail.com' AND id != 'usr_caleb'").run();
  } catch (err) {
    console.warn('Demo accounts moderator demotion warning:', err.message);
  }

  // 2. Ensure Caleb Zothansanga System Administrator is seeded and elevated, with custom ADMIN_PASSWORD if provided
  try {
    const customAdminPassword = process.env.ADMIN_PASSWORD || process.env.SYSTEM_ADMIN_PASSWORD;
    const adminPasswordHash = customAdminPassword
      ? bcrypt.hashSync(customAdminPassword, 10)
      : '$2b$10$aDKeZ1d74tnrk82S3WoqrOKst6JiHclT2DPl.1Kp4FL3gmFtxerfK';

    const caleb = db.prepare("SELECT * FROM users WHERE email = 'caleb.zothansanga@gmail.com' OR id = 'usr_caleb'").get();
    if (!caleb) {
      db.prepare(`
        INSERT INTO users (
          id, name, handle, email, password_hash, role, avatar, bio,
          address, neighborhood, lat, lng, skills, badges,
          privacy_settings, stats, is_public_moderator, status
        ) VALUES (
          'usr_caleb', 'Caleb Zothansanga', '@caleb_admin', 'caleb.zothansanga@gmail.com',
          ?,
          'System Administrator',
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          'Primary System Administrator for CareMesh Civic Resilience Network.',
          'Eastside District, Maplewood', 'Maplewood Central', 37.7749, -122.4194,
          '["System Administration","Platform Governance","Crisis Dispatch","Network Engineering"]',
          '["System Administrator","Platform Governance","Verified Lead"]',
          '{"showExactLocation":true,"allowDirectMessages":true,"publicContributionHistory":true}',
          '{"contributions":150,"resourcesShared":25,"plansJoined":12,"requestsFulfilled":45}',
          1, 'active'
        )
      `).run(adminPasswordHash);
    } else {
      if (customAdminPassword) {
        db.prepare(`
          UPDATE users 
          SET is_public_moderator = 1, role = 'System Administrator', email = 'caleb.zothansanga@gmail.com', password_hash = ?
          WHERE id = ? OR email = 'caleb.zothansanga@gmail.com'
        `).run(adminPasswordHash, caleb.id);
      } else {
        db.prepare(`
          UPDATE users 
          SET is_public_moderator = 1, role = 'System Administrator', email = 'caleb.zothansanga@gmail.com'
          WHERE id = ? OR email = 'caleb.zothansanga@gmail.com'
        `).run(caleb.id);
      }
    }
  } catch (err) {
    console.warn('Caleb system admin sync warning:', err.message);
  }

  return db;
}

export function logModerationAudit(database, {
  moderatorId,
  moderatorRole,
  communityId = null,
  actionType,
  targetType,
  targetId,
  targetAuthorId = null,
  targetContentSnapshot = null,
  reason = null,
  notes = null
}) {
  const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const snapshotStr = typeof targetContentSnapshot === 'object' && targetContentSnapshot !== null
    ? JSON.stringify(targetContentSnapshot)
    : (targetContentSnapshot || null);

  database.prepare(`
    INSERT INTO moderation_audit_logs (
      id, moderator_id, moderator_role, community_id, action_type,
      target_type, target_id, target_author_id, target_content_snapshot,
      reason, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(
    id,
    moderatorId,
    moderatorRole,
    communityId,
    actionType,
    targetType,
    targetId,
    targetAuthorId,
    snapshotStr,
    reason,
    notes
  );

  return id;
}

export default db;
