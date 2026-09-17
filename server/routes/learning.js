import express from 'express';
import { db } from '../db/database.js';
import { searchInstitutionalGuidance } from '../services/learningService.js';

const router = express.Router();

// GET /api/learning/search
router.get('/search', (req, res) => {
  const { q = '', category = '' } = req.query;
  const results = searchInstitutionalGuidance(q, category);
  res.json(results);
});

// GET /api/learning/lessons
router.get('/lessons', (req, res) => {
  const rows = db.prepare(`
    SELECT l.*, o.goal as outcome_goal, o.actual_results, o.outcome_status, p.title as source_plan_title
    FROM lessons l
    JOIN outcomes o ON l.outcome_id = o.id
    LEFT JOIN plans p ON l.source_plan_id = p.id
    WHERE l.status = 'active'
    ORDER BY l.created_at DESC
  `).all();

  res.json(rows.map(r => ({
    id: r.id,
    outcomeId: r.outcome_id,
    sourcePlanId: r.source_plan_id,
    sourcePlanTitle: r.source_plan_title,
    lessonText: r.lesson_text,
    context: r.context,
    applicabilityTags: JSON.parse(r.applicability_tags || '[]'),
    confidence: r.confidence,
    status: r.status,
    outcome: {
      goal: r.outcome_goal,
      actualResults: JSON.parse(r.actual_results || '[]'),
      outcomeStatus: r.outcome_status
    }
  })));
});

// GET /api/learning/guidance
router.get('/guidance', (req, res) => {
  const rows = db.prepare(`
    SELECT g.*, l.lesson_text, l.applicability_tags, p.title as source_plan_title
    FROM future_guidance g
    JOIN lessons l ON g.lesson_id = l.id
    LEFT JOIN plans p ON l.source_plan_id = p.id
    ORDER BY g.created_at DESC
  `).all();

  res.json(rows.map(r => ({
    id: r.id,
    lessonId: r.lesson_id,
    lessonText: r.lesson_text,
    sourcePlanTitle: r.source_plan_title,
    recommendationText: r.recommendation_text,
    applicableCategory: r.applicable_category,
    checklistItems: JSON.parse(r.checklist_items || '[]'),
    targetPhases: JSON.parse(r.target_phases || '[]')
  })));
});

export default router;
