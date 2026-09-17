import express from 'express';
import { db } from '../db/database.js';
import { formatUser } from './auth.js';
import { optionalAuth } from '../middleware/auth.js';
import { recordOutcomeAndGuidance } from '../services/learningService.js';

const router = express.Router();

export function formatPlan(row) {
  if (!row) return null;

  const proposerRow = db.prepare('SELECT * FROM users WHERE id = ?').get(row.proposer_id);
  const proposer = proposerRow ? formatUser(proposerRow) : { id: row.proposer_id, name: 'Anonymous' };

  // Participants
  const participantRows = db.prepare(`
    SELECT pp.*, u.id as u_id, u.name, u.handle, u.role as u_role, u.avatar
    FROM plan_participants pp
    JOIN users u ON pp.user_id = u.id
    WHERE pp.plan_id = ?
  `).all(row.id);
  const participants = participantRows.map(p => ({
    user: { id: p.u_id, name: p.name, handle: p.handle, role: p.u_role, avatar: p.avatar },
    role: p.role,
    joinedAt: p.joined_at
  }));

  // Milestones
  const milestoneRows = db.prepare('SELECT * FROM plan_milestones WHERE plan_id = ?').all(row.id);
  const milestones = milestoneRows.map(m => ({
    id: m.id,
    title: m.title,
    dueDate: m.due_date,
    status: m.status,
    completedDate: m.completed_date,
    assignedTo: m.assigned_to
  }));

  // Feedback
  const feedbackRows = db.prepare(`
    SELECT pf.*, u.id as u_id, u.name, u.role as u_role, u.avatar
    FROM plan_feedback pf
    LEFT JOIN users u ON pf.author_id = u.id
    WHERE pf.plan_id = ?
  `).all(row.id);
  const feedback = feedbackRows.map(fb => ({
    id: fb.id,
    type: fb.type,
    author: { id: fb.u_id, name: fb.name, role: fb.u_role, avatar: fb.avatar },
    text: fb.text,
    suggestedChange: fb.suggested_change,
    status: fb.status,
    resolutionNote: fb.resolution_note,
    date: fb.date
  }));

  // Revisions
  const revisionRows = db.prepare('SELECT * FROM plan_revisions WHERE plan_id = ? ORDER BY version ASC').all(row.id);
  const revisionHistory = revisionRows.map(r => ({
    version: r.version,
    date: r.date,
    revisedBy: r.revised_by,
    summaryOfChanges: r.summary_of_changes,
    reasoningForChanges: r.reasoning_for_changes,
    incorporatedFeedbackIds: JSON.parse(r.incorporated_feedback_ids || '[]')
  }));

  // Updates
  const updateRows = db.prepare('SELECT * FROM plan_updates WHERE plan_id = ? ORDER BY created_at ASC').all(row.id);
  const updates = updateRows.map(u => ({
    date: u.date,
    note: u.note
  }));

  // Decisions
  const decisionRows = db.prepare('SELECT * FROM decisions WHERE plan_id = ? ORDER BY created_at ASC').all(row.id);
  const decisions = decisionRows.map(d => ({
    id: d.id,
    title: d.title,
    rationale: d.rationale,
    date: d.date,
    decidedBy: d.decided_by,
    versionTag: d.version_tag,
    isRevisionDecision: Boolean(d.is_revision_decision),
    incorporatedFeedbackIds: JSON.parse(d.incorporated_feedback_ids || '[]')
  }));

  // Outcome
  const outcomeRow = db.prepare('SELECT * FROM outcomes WHERE plan_id = ?').get(row.id);
  const outcomeReport = outcomeRow ? {
    goal: outcomeRow.goal,
    actualResults: JSON.parse(outcomeRow.actual_results || '[]'),
    outcomeStatus: outcomeRow.outcome_status,
    evidenceTypes: JSON.parse(outcomeRow.evidence_types || '[]'),
    linkedEvidenceIds: JSON.parse(outcomeRow.linked_evidence_ids || '[]'),
    linkedObservationIds: JSON.parse(outcomeRow.linked_observation_ids || '[]'),
    unexpectedEffects: outcomeRow.unexpected_effects || '',
    lessons: outcomeRow.lessons || '',
    guidanceForFuture: outcomeRow.guidance_for_future || '',
    evaluatedAt: outcomeRow.evaluated_at,
    evaluator: outcomeRow.evaluator
  } : null;

  return {
    id: row.id,
    title: row.title,
    problemStatement: row.problem_statement,
    desiredOutcome: row.desired_outcome,
    proposedApproach: row.proposed_approach,
    resourcesNeeded: row.resources_needed,
    location: row.location,
    affectedParties: row.affected_parties,
    lifecycleStage: row.lifecycle_stage,
    overallStatus: row.overall_status,
    currentVersion: row.current_version,
    proposer,
    participants,
    milestones,
    feedback,
    revisionHistory,
    updates,
    decisions,
    goals: JSON.parse(row.goals || '[]'),
    outcomesEvaluation: row.outcomes_evaluation,
    outcomeReport,
    linkedRequestIds: [],
    linkedResourceIds: [],
    linkedEventIds: [],
    linkedObservationIds: [],
    linkedClaimIds: [],
    evidenceIds: []
  };
}

// GET /api/plans
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM plans ORDER BY created_at DESC').all();
  res.json(rows.map(formatPlan));
});

// GET /api/plans/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Plan not found' });
  }
  res.json(formatPlan(row));
});

// POST /api/plans
router.post('/', optionalAuth, (req, res) => {
  const {
    title,
    problemStatement,
    desiredOutcome,
    proposedApproach,
    resourcesNeeded,
    location,
    affectedParties,
    goals = [],
    milestones = []
  } = req.body;

  if (!title || !problemStatement || !desiredOutcome) {
    return res.status(400).json({ error: 'Title, problemStatement, and desiredOutcome are required.' });
  }

  const id = `plan_${Date.now()}`;
  const proposerId = req.user ? req.user.id : (req.body.proposerId || 'usr_me');
  const proposerName = req.user ? req.user.name : 'Maya Lin';
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const tx = db.transaction(() => {
    // 1. Insert Plan
    db.prepare(`
      INSERT INTO plans (id, title, problem_statement, desired_outcome, proposed_approach, resources_needed, location, affected_parties, lifecycle_stage, overall_status, current_version, proposer_id, goals, outcomes_evaluation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', 'planning', 'v1.0', ?, ?, 'Draft proposal in active community review.')
    `).run(
      id,
      title,
      problemStatement,
      desiredOutcome,
      proposedApproach || '',
      resourcesNeeded || '',
      location || 'Maplewood Corridor',
      affectedParties || 'Local Community',
      proposerId,
      JSON.stringify(goals)
    );

    // 2. Add Proposer as participant
    db.prepare(`
      INSERT INTO plan_participants (id, plan_id, user_id, role, joined_at)
      VALUES (?, ?, ?, 'Author & Lead Coordinator', 'Just now')
    `).run(`pp_${id}_${proposerId}`, id, proposerId);

    // 3. Add Milestones
    if (milestones && milestones.length > 0) {
      for (let idx = 0; idx < milestones.length; idx++) {
        const m = milestones[idx];
        db.prepare(`
          INSERT INTO plan_milestones (id, plan_id, title, due_date, status, completed_date, assigned_to)
          VALUES (?, ?, ?, ?, ?, NULL, ?)
        `).run(`m_${id}_${idx}`, id, m.title || m, m.dueDate || 'Pending', 'pending', m.assignedTo || proposerName);
      }
    } else {
      db.prepare(`
        INSERT INTO plan_milestones (id, plan_id, title, due_date, status, completed_date, assigned_to)
        VALUES (?, ?, ?, '2 weeks', 'in_progress', NULL, ?)
      `).run(`m_${id}_1`, id, 'Neighborhood safety review and stakeholder consultation', proposerName);
    }

    // 4. Initial revision history entry
    db.prepare(`
      INSERT INTO plan_revisions (id, plan_id, version, date, revised_by, summary_of_changes, reasoning_for_changes, incorporated_feedback_ids)
      VALUES (?, ?, 'v1.0', ?, ?, 'Initial proposal created and published for community review.', 'Initial baseline draft.', '[]')
    `).run(`rev_${id}_v1.0`, id, currentDate, proposerName);

    // 5. Initial update
    db.prepare(`
      INSERT INTO plan_updates (id, plan_id, date, note)
      VALUES (?, ?, 'Today', 'Proposal submitted for public feedback and risk evaluation.')
    `).run(`upd_${id}_0`, id);

    // 6. Notification
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, body, timestamp, is_read, target_view, target_entity_id)
      VALUES (?, ?, 'plan_update', 'New Plan Proposed', ?, 'Just now', 0, 'plans', ?)
    `).run(`notif_${Date.now()}`, proposerId, `New proposal "${title}" opened for public review.`, id);
  });

  tx();

  const created = formatPlan(db.prepare('SELECT * FROM plans WHERE id = ?').get(id));
  res.status(201).json(created);
});

// PATCH /api/plans/:id/stage
router.patch('/:id/stage', optionalAuth, (req, res) => {
  const { lifecycleStage, overallStatus } = req.body;
  if (!lifecycleStage) {
    return res.status(400).json({ error: 'lifecycleStage is required' });
  }

  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);
  if (!plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  const newOverall = overallStatus || (lifecycleStage === 'completed' ? 'completed' : lifecycleStage === 'active' ? 'in_progress' : plan.overall_status);

  db.prepare(`
    UPDATE plans
    SET lifecycle_stage = ?, overall_status = ?
    WHERE id = ?
  `).run(lifecycleStage, newOverall, req.params.id);

  // Add update note
  db.prepare(`
    INSERT INTO plan_updates (id, plan_id, date, note)
    VALUES (?, ?, 'Today', ?)
  `).run(`upd_${req.params.id}_${Date.now()}`, req.params.id, `Lifecycle stage transitioned to: ${lifecycleStage.toUpperCase()}`);

  res.json(formatPlan(db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id)));
});

// POST /api/plans/:id/feedback
router.post('/:id/feedback', optionalAuth, (req, res) => {
  const { type, text, suggestedChange } = req.body;
  if (!type || !text) {
    return res.status(400).json({ error: 'Feedback type and text are required' });
  }

  const id = `fb_${Date.now()}`;
  const authorId = req.user ? req.user.id : (req.body.authorId || 'usr_me');
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  db.prepare(`
    INSERT INTO plan_feedback (id, plan_id, type, author_id, text, suggested_change, status, resolution_note, date)
    VALUES (?, ?, ?, ?, ?, ?, 'open', '', ?)
  `).run(id, req.params.id, type, authorId, text, suggestedChange || '', date);

  res.status(201).json(formatPlan(db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id)));
});

// POST /api/plans/:id/revisions
router.post('/:id/revisions', optionalAuth, (req, res) => {
  const {
    version,
    summaryOfChanges,
    reasoningForChanges,
    incorporatedFeedbackIds = [],
    updatedProblemStatement,
    updatedDesiredOutcome,
    updatedProposedApproach,
    updatedResourcesNeeded,
    decisionTitle,
    decisionRationale
  } = req.body;

  if (!version || !summaryOfChanges || !reasoningForChanges) {
    return res.status(400).json({ error: 'version, summaryOfChanges, and reasoningForChanges are required' });
  }

  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);
  if (!plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  const revisedBy = req.user ? req.user.name : 'Maya Lin';
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const tx = db.transaction(() => {
    // 1. Insert revision
    db.prepare(`
      INSERT INTO plan_revisions (id, plan_id, version, date, revised_by, summary_of_changes, reasoning_for_changes, incorporated_feedback_ids)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `rev_${req.params.id}_${version}`,
      req.params.id,
      version,
      currentDate,
      revisedBy,
      summaryOfChanges,
      reasoningForChanges,
      JSON.stringify(incorporatedFeedbackIds)
    );

    // 2. Update plan version & fields
    db.prepare(`
      UPDATE plans
      SET current_version = ?,
          problem_statement = COALESCE(?, problem_statement),
          desired_outcome = COALESCE(?, desired_outcome),
          proposed_approach = COALESCE(?, proposed_approach),
          resources_needed = COALESCE(?, resources_needed),
          lifecycle_stage = 'revised'
      WHERE id = ?
    `).run(
      version,
      updatedProblemStatement || null,
      updatedDesiredOutcome || null,
      updatedProposedApproach || null,
      updatedResourcesNeeded || null,
      req.params.id
    );

    // 3. Mark feedback as adopted
    for (const fbId of incorporatedFeedbackIds) {
      db.prepare(`
        UPDATE plan_feedback
        SET status = 'adopted', resolution_note = ?
        WHERE id = ?
      `).run(`Adopted in revision ${version}`, fbId);
    }

    // 4. Log revision decision
    const decTitle = decisionTitle || `Adopted revision ${version}: ${summaryOfChanges.slice(0, 60)}`;
    const decRationale = decisionRationale || reasoningForChanges;
    db.prepare(`
      INSERT INTO decisions (id, plan_id, project_id, title, rationale, date, decided_by, version_tag, is_revision_decision, incorporated_feedback_ids)
      VALUES (?, ?, NULL, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      `dec_${Date.now()}`,
      req.params.id,
      decTitle,
      decRationale,
      currentDate,
      revisedBy,
      version,
      JSON.stringify(incorporatedFeedbackIds)
    );

    // 5. Update timeline
    db.prepare(`
      INSERT INTO plan_updates (id, plan_id, date, note)
      VALUES (?, ?, 'Today', ?)
    `).run(`upd_${req.params.id}_${Date.now()}`, req.params.id, `Published revision ${version}: ${summaryOfChanges}`);
  });

  tx();

  res.json(formatPlan(db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id)));
});

// POST /api/plans/:id/milestones/:mId/toggle
router.post('/:id/milestones/:mId/toggle', optionalAuth, (req, res) => {
  const milestone = db.prepare('SELECT * FROM plan_milestones WHERE id = ? AND plan_id = ?').get(req.params.mId, req.params.id);
  if (!milestone) {
    return res.status(404).json({ error: 'Milestone not found' });
  }

  const isCompleted = milestone.status === 'completed';
  const newStatus = isCompleted ? 'pending' : 'completed';
  const completedDate = isCompleted ? null : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  db.prepare(`
    UPDATE plan_milestones
    SET status = ?, completed_date = ?
    WHERE id = ?
  `).run(newStatus, completedDate, req.params.mId);

  // Add update note
  db.prepare(`
    INSERT INTO plan_updates (id, plan_id, date, note)
    VALUES (?, ?, 'Today', ?)
  `).run(`upd_${req.params.id}_${Date.now()}`, req.params.id, `Milestone "${milestone.title}" marked as ${newStatus.toUpperCase()}`);

  res.json(formatPlan(db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id)));
});

// POST /api/plans/:id/decisions
router.post('/:id/decisions', optionalAuth, (req, res) => {
  const { title, rationale, versionTag, isRevisionDecision = false, incorporatedFeedbackIds = [] } = req.body;
  if (!title || !rationale) {
    return res.status(400).json({ error: 'Decision title and rationale are required' });
  }

  const id = `dec_${Date.now()}`;
  const decidedBy = req.user ? req.user.name : (req.body.decidedBy || 'Working Group');
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  db.prepare(`
    INSERT INTO decisions (id, plan_id, project_id, title, rationale, date, decided_by, version_tag, is_revision_decision, incorporated_feedback_ids)
    VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    req.params.id,
    title,
    rationale,
    date,
    decidedBy,
    versionTag || null,
    isRevisionDecision ? 1 : 0,
    JSON.stringify(incorporatedFeedbackIds)
  );

  res.status(201).json(formatPlan(db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id)));
});

// POST /api/plans/:id/outcome
router.post('/:id/outcome', optionalAuth, (req, res) => {
  const {
    goal,
    actualResults = [],
    outcomeStatus = 'achieved',
    evidenceTypes = [],
    linkedEvidenceIds = [],
    linkedObservationIds = [],
    unexpectedEffects = '',
    lessons = '',
    guidanceForFuture = ''
  } = req.body;

  if (!goal || actualResults.length === 0) {
    return res.status(400).json({ error: 'Goal and at least one actual result item are required.' });
  }

  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);
  if (!plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  const evaluator = req.user ? req.user.name : 'Maya Lin';
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Delete prior outcome if re-evaluating
  db.prepare('DELETE FROM outcomes WHERE plan_id = ?').run(req.params.id);

  // Record outcome, lesson, and future guidance in pipeline
  recordOutcomeAndGuidance({
    planId: req.params.id,
    goal,
    actualResults,
    outcomeStatus,
    evidenceTypes,
    linkedEvidenceIds,
    linkedObservationIds,
    unexpectedEffects,
    lessons,
    guidanceForFuture,
    evaluator
  });

  // Update plan lifecycle stage to completed
  db.prepare(`
    UPDATE plans
    SET lifecycle_stage = 'completed', overall_status = 'completed'
    WHERE id = ?
  `).run(req.params.id);

  // Record final decision & timeline update
  const statusEmoji = outcomeStatus === 'achieved' ? '🟢 Achieved' : outcomeStatus === 'partially_achieved' ? '🟡 Partially Achieved' : '🔴 Not Achieved';
  db.prepare(`
    INSERT INTO decisions (id, plan_id, project_id, title, rationale, date, decided_by, version_tag, is_revision_decision, incorporated_feedback_ids)
    VALUES (?, ?, NULL, ?, ?, ?, ?, 'Outcome Verified', 0, '[]')
  `).run(
    `dec_${Date.now()}`,
    req.params.id,
    `Final Outcome Evaluation Verified (${statusEmoji})`,
    `Delivered ${actualResults.length} itemized results verified through ${evidenceTypes.join(', ')}.`,
    currentDate,
    evaluator
  );

  db.prepare(`
    INSERT INTO plan_updates (id, plan_id, date, note)
    VALUES (?, ?, 'Today', ?)
  `).run(`upd_${req.params.id}_${Date.now()}`, req.params.id, `Real-world outcome report logged: ${actualResults[0] || 'Outcome evaluated'}`);

  // Dispatched community notice to proposer
  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, body, timestamp, is_read, target_view, target_entity_id)
    VALUES (?, ?, 'plan_update', 'Outcome Evaluation Published', ?, 'Just now', 0, 'plans', ?)
  `).run(`notif_${Date.now()}`, plan.proposer_id || 'usr_me', `Plan "${plan.title}" outcome logged (${statusEmoji}).`, req.params.id);

  res.json(formatPlan(db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id)));
});

// DELETE /api/plans/:id
router.delete('/:id', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : (req.query.userId || req.body?.userId || 'usr_me');
  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);
  if (!plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  // Allow proposer or Admin
  const isProposer = plan.proposer_id === userId;
  const user = req.user || db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const isAdmin = user && (
    user.role === 'Admin' || 
    user.role === 'admin' || 
    user.role === 'coordinator' || 
    user.role === 'Emergency Coordinator' || 
    user.role === 'System Administrator' || 
    Boolean(user.is_public_moderator)
  );

  if (!isProposer && !isAdmin) {
    return res.status(403).json({ error: 'Only the plan author or an administrator can delete this plan.' });
  }

  const tx = db.transaction(() => {
    // 1. Delete future guidance linked to lessons from this plan
    db.prepare(`
      DELETE FROM future_guidance 
      WHERE lesson_id IN (SELECT id FROM lessons WHERE source_plan_id = ?)
    `).run(req.params.id);

    // 2. Delete lessons
    db.prepare('DELETE FROM lessons WHERE source_plan_id = ?').run(req.params.id);

    // 3. Delete outcomes
    db.prepare('DELETE FROM outcomes WHERE plan_id = ?').run(req.params.id);

    // 4. Delete decisions
    db.prepare('DELETE FROM decisions WHERE plan_id = ?').run(req.params.id);

    // 5. Delete plan milestones, feedback, revisions, updates, participants
    db.prepare('DELETE FROM plan_milestones WHERE plan_id = ?').run(req.params.id);
    db.prepare('DELETE FROM plan_feedback WHERE plan_id = ?').run(req.params.id);
    db.prepare('DELETE FROM plan_revisions WHERE plan_id = ?').run(req.params.id);
    db.prepare('DELETE FROM plan_updates WHERE plan_id = ?').run(req.params.id);
    db.prepare('DELETE FROM plan_participants WHERE plan_id = ?').run(req.params.id);

    // 6. Unlink any projects referencing this plan
    db.prepare('UPDATE projects SET plan_id = NULL WHERE plan_id = ?').run(req.params.id);

    // 7. Delete the plan itself
    db.prepare('DELETE FROM plans WHERE id = ?').run(req.params.id);
  });
  tx();

  res.json({ success: true, id: req.params.id });
});

// DELETE /api/plans/:id/decisions/:decisionId
router.delete('/:id/decisions/:decisionId', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : (req.query.userId || req.body?.userId || 'usr_me');
  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);
  if (!plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  const decision = db.prepare('SELECT * FROM decisions WHERE id = ? AND plan_id = ?').get(req.params.decisionId, req.params.id);
  if (!decision) {
    return res.status(404).json({ error: 'Decision not found' });
  }

  const user = req.user || db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const isProposer = plan.proposer_id === userId;
  const isAdmin = user && (
    user.role === 'Admin' || 
    user.role === 'admin' || 
    user.role === 'coordinator' || 
    user.role === 'Emergency Coordinator' || 
    user.role === 'System Administrator' || 
    Boolean(user.is_public_moderator)
  );

  if (!isProposer && !isAdmin) {
    return res.status(403).json({ error: 'Only the plan author or an administrator can delete this decision.' });
  }

  db.prepare('DELETE FROM decisions WHERE id = ? AND plan_id = ?').run(req.params.decisionId, req.params.id);

  res.json({ success: true, id: req.params.decisionId });
});

// DELETE /api/plans/:id/milestones/:milestoneId
router.delete('/:id/milestones/:milestoneId', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : (req.query.userId || req.body?.userId || 'usr_me');
  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);
  if (!plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  const milestone = db.prepare('SELECT * FROM plan_milestones WHERE id = ? AND plan_id = ?').get(req.params.milestoneId, req.params.id);
  if (!milestone) {
    return res.status(404).json({ error: 'Milestone not found' });
  }

  const user = req.user || db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const isProposer = plan.proposer_id === userId;
  const isAdmin = user && (
    user.role === 'Admin' || 
    user.role === 'admin' || 
    user.role === 'coordinator' || 
    user.role === 'Emergency Coordinator' || 
    user.role === 'System Administrator' || 
    Boolean(user.is_public_moderator)
  );

  if (!isProposer && !isAdmin) {
    return res.status(403).json({ error: 'Only the plan author or an administrator can delete this milestone.' });
  }

  db.prepare('DELETE FROM plan_milestones WHERE id = ? AND plan_id = ?').run(req.params.milestoneId, req.params.id);

  res.json({ success: true, id: req.params.milestoneId });
});

export default router;
