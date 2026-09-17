import { db } from '../db/database.js';

/**
 * Searches past project outcomes, lessons learned, and future guidance
 * based on keyword, category, or problem context
 */
export function searchInstitutionalGuidance(query = '', category = '') {
  let sql = `
    SELECT 
      g.id as guidance_id,
      g.recommendation_text,
      g.applicable_category,
      g.checklist_items,
      g.target_phases,
      l.id as lesson_id,
      l.lesson_text,
      l.context as lesson_context,
      l.applicability_tags,
      l.confidence,
      o.id as outcome_id,
      o.goal as outcome_goal,
      o.actual_results,
      o.outcome_status,
      o.unexpected_effects,
      p.id as source_plan_id,
      p.title as source_plan_title
    FROM future_guidance g
    JOIN lessons l ON g.lesson_id = l.id
    JOIN outcomes o ON l.outcome_id = o.id
    LEFT JOIN plans p ON o.plan_id = p.id
    WHERE l.status = 'active'
  `;

  const params = [];
  if (category) {
    sql += ` AND (g.applicable_category LIKE ? OR l.applicability_tags LIKE ?)`;
    params.push(`%${category}%`, `%${category}%`);
  }

  if (query) {
    sql += ` AND (g.recommendation_text LIKE ? OR l.lesson_text LIKE ? OR o.goal LIKE ? OR p.title LIKE ?)`;
    params.push(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);
  }

  const rows = db.prepare(sql).all(...params);

  return rows.map(r => ({
    id: r.guidance_id,
    recommendationText: r.recommendation_text,
    applicableCategory: r.applicable_category,
    checklistItems: JSON.parse(r.checklist_items || '[]'),
    targetPhases: JSON.parse(r.target_phases || '[]'),
    lesson: {
      id: r.lesson_id,
      lessonText: r.lesson_text,
      context: r.lesson_context,
      applicabilityTags: JSON.parse(r.applicability_tags || '[]'),
      confidence: r.confidence
    },
    outcome: {
      id: r.outcome_id,
      goal: r.outcome_goal,
      actualResults: JSON.parse(r.actual_results || '[]'),
      outcomeStatus: r.outcome_status,
      unexpectedEffects: r.unexpected_effects
    },
    sourcePlan: r.source_plan_id ? {
      id: r.source_plan_id,
      title: r.source_plan_title
    } : null
  }));
}

/**
 * Creates structured Outcome -> Lesson -> Guidance records when a plan or project completes
 */
export function recordOutcomeAndGuidance({
  planId = null,
  projectId = null,
  goal,
  actualResults = [],
  outcomeStatus = 'achieved',
  evidenceTypes = [],
  linkedEvidenceIds = [],
  linkedObservationIds = [],
  unexpectedEffects = '',
  lessons = '',
  guidanceForFuture = '',
  evaluator = 'Working Group'
}) {
  const outcomeId = `out_${Date.now()}`;
  const evaluatedAt = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const recordTx = db.transaction(() => {
    // 1. Insert Outcome
    db.prepare(`
      INSERT INTO outcomes (
        id, plan_id, project_id, goal, actual_results, outcome_status, evidence_types,
        linked_evidence_ids, linked_observation_ids, unexpected_effects, lessons, guidance_for_future, evaluated_at, evaluator
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      outcomeId,
      planId,
      projectId,
      goal,
      JSON.stringify(actualResults),
      outcomeStatus,
      JSON.stringify(evidenceTypes),
      JSON.stringify(linkedEvidenceIds),
      JSON.stringify(linkedObservationIds),
      unexpectedEffects,
      lessons,
      guidanceForFuture,
      evaluatedAt,
      evaluator
    );

    // 2. Insert Lesson if present
    let lessonId = null;
    if (lessons && lessons.trim()) {
      lessonId = `lsn_${Date.now()}`;
      db.prepare(`
        INSERT INTO lessons (id, outcome_id, source_plan_id, source_project_id, lesson_text, context, applicability_tags, confidence, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        lessonId,
        outcomeId,
        planId,
        projectId,
        lessons.trim(),
        `Generated from outcome evaluation of plan ${planId || projectId}`,
        JSON.stringify(['community_coordination', 'operations']),
        'high',
        'active'
      );
    }

    // 3. Insert Future Guidance if present
    let guidanceId = null;
    if (guidanceForFuture && guidanceForFuture.trim() && lessonId) {
      guidanceId = `gui_${Date.now()}`;
      db.prepare(`
        INSERT INTO future_guidance (id, lesson_id, recommendation_text, applicable_category, checklist_items, target_phases)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        guidanceId,
        lessonId,
        guidanceForFuture.trim(),
        'General Community Planning',
        JSON.stringify([guidanceForFuture.trim()]),
        JSON.stringify(['planning', 'implementation'])
      );
    }

    return { outcomeId, lessonId, guidanceId };
  });

  return recordTx();
}
