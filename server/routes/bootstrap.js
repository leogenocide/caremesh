import express from 'express';
import { db } from '../db/database.js';
import { optionalAuth } from '../middleware/auth.js';
import { formatUser } from './auth.js';
import { formatObservation } from './observations.js';
import { formatClaim } from './claims.js';
import { formatDispute } from './disputes.js';
import { formatEvidence } from './evidence.js';
import { formatSafetyReport } from './safety.js';
import { formatPlan } from './plans.js';
import { formatProject } from './projects.js';
import { formatRequest } from './requests.js';
import { formatResource } from './resources.js';
import { formatCommunity, formatPost } from './communities.js';
import { formatNotification } from './notifications.js';
import { formatConversation } from './conversations.js';
import { formatReport } from './reports.js';
import { formatReadinessCheck } from './readiness.js';
import { recalculateAllMatches } from '../services/matcherService.js';

const router = express.Router();

// GET /api/bootstrap
// Returns full normalized state for instant client-side synchronization
router.get('/', optionalAuth, (req, res) => {
  const currentUserId = req.user ? req.user.id : null;
  const currentUserRow = currentUserId ? db.prepare('SELECT * FROM users WHERE id = ?').get(currentUserId) : null;
  const user = currentUserRow ? formatUser(currentUserRow) : null;

  const isGlobalMod = currentUserRow && (currentUserRow.role === 'admin' || Boolean(currentUserRow.is_public_moderator));

  const observations = db.prepare('SELECT * FROM observations WHERE (is_quarantined = 0 OR is_quarantined IS NULL) ORDER BY created_at DESC').all().map(formatObservation);
  const claims = db.prepare('SELECT * FROM claims ORDER BY created_at DESC').all().map(formatClaim);
  const disputes = db.prepare('SELECT * FROM disputes ORDER BY created_at DESC').all().map(formatDispute);
  const evidence = db.prepare('SELECT * FROM evidence ORDER BY created_at DESC').all().map(formatEvidence);
  const safetyReports = db.prepare('SELECT * FROM safety_reports ORDER BY created_at DESC').all().map(formatSafetyReport);
  const plans = db.prepare('SELECT * FROM plans WHERE (is_quarantined = 0 OR is_quarantined IS NULL) ORDER BY created_at DESC').all().map(formatPlan);
  const events = db.prepare('SELECT * FROM projects WHERE (is_quarantined = 0 OR is_quarantined IS NULL) ORDER BY created_at DESC').all().map(formatProject);
  
  // Isolated requests: public OR authored by user OR in user's communities
  const requests = currentUserId
    ? db.prepare(`
        SELECT * FROM requests
        WHERE (is_quarantined = 0 OR is_quarantined IS NULL)
        AND (
          (visibility IS NULL OR visibility = 'public')
          OR requester_id = ?
          OR (community_id IS NOT NULL AND community_id IN (SELECT community_id FROM community_members WHERE user_id = ?))
        )
        ORDER BY created_at DESC
      `).all(currentUserId, currentUserId).map(formatRequest)
    : db.prepare(`
        SELECT * FROM requests
        WHERE (is_quarantined = 0 OR is_quarantined IS NULL)
        AND (visibility IS NULL OR visibility = 'public')
        ORDER BY created_at DESC
      `).all().map(formatRequest);

  const resources = db.prepare('SELECT * FROM resources WHERE (is_quarantined = 0 OR is_quarantined IS NULL) ORDER BY created_at DESC').all().map(formatResource);
  const communities = db.prepare('SELECT * FROM communities ORDER BY created_at DESC').all().map(r => formatCommunity(r, currentUserId));
  
  // Isolated posts: public communities OR private communities where user is a member
  const posts = currentUserId
    ? db.prepare(`
        SELECT * FROM posts
        WHERE (is_quarantined = 0 OR is_quarantined IS NULL)
        AND community_id IN (
          SELECT id FROM communities WHERE privacy != 'private'
          OR id IN (SELECT community_id FROM community_members WHERE user_id = ?)
        )
        ORDER BY is_pinned DESC, created_at DESC
      `).all(currentUserId).map(formatPost)
    : db.prepare(`
        SELECT * FROM posts
        WHERE (is_quarantined = 0 OR is_quarantined IS NULL)
        AND community_id IN (
          SELECT id FROM communities WHERE privacy != 'private'
        )
        ORDER BY is_pinned DESC, created_at DESC
      `).all().map(formatPost);

  // Isolated notifications: strictly for current user
  const notifications = currentUserId
    ? db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').all(currentUserId).map(formatNotification)
    : [];

  // Isolated conversations: strictly where current user is user1 or user2
  const conversations = currentUserId
    ? db.prepare('SELECT * FROM conversations WHERE user1_id = ? OR user2_id = ? ORDER BY created_at DESC').all(currentUserId, currentUserId).map(r => formatConversation(r, currentUserId))
    : [];

  // Isolated moderation reports: only admins/moderators OR reports filed by user
  const reportsQuery = isGlobalMod
    ? db.prepare('SELECT * FROM reports ORDER BY created_at DESC').all()
    : (currentUserId
        ? db.prepare(`
            SELECT * FROM reports
            WHERE reporter_id = ?
            OR (community_id IS NOT NULL AND community_id IN (
              SELECT community_id FROM community_members WHERE user_id = ? AND role IN ('admin', 'moderator')
            ))
            ORDER BY created_at DESC
          `).all(currentUserId, currentUserId)
        : []);
  const reports = reportsQuery.map(formatReport);

  const readinessChecks = db.prepare('SELECT * FROM readiness_checks ORDER BY created_at DESC').all().map(formatReadinessCheck);

  // Derived Quick Actions
  const quickActions = requests.flatMap(req => 
    (req.quickActions || []).map(qa => ({
      ...qa,
      requestId: req.id,
      targetObjectId: req.id,
      targetObjectType: 'request',
      requestTitle: req.title,
      location: req.location.address,
      urgency: req.urgency,
      category: req.category
    }))
  );

  // Derived transparent match evaluations
  const matchingFactors = recalculateAllMatches();

  res.json({
    currentUser: user,
    observations,
    claims,
    disputes,
    evidence,
    safetyReports,
    plans,
    events,
    requests,
    resources,
    quickActions,
    matchingFactors,
    communities,
    posts,
    notifications,
    conversations,
    reports,
    readinessChecks
  });
});

export default router;
