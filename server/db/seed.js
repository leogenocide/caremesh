import bcrypt from 'bcryptjs';
import { db, initDatabase } from './database.js';
import {
  currentUser,
  mockUsers,
  mockEvidence,
  mockClaims,
  mockDisputes,
  mockObservations,
  mockSafetyReports,
  mockRequests,
  mockResources,
  mockEvents,
  mockPlans,
  mockCommunities,
  mockPosts,
  mockNotifications,
  mockConversations
} from '../../src/data/mockData.js';

export function seedDatabase(force = false) {
  initDatabase();

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0 && !force) {
    return;
  }

  const defaultPasswordHash = bcrypt.hashSync('password123', 10);

  // Disable FKs temporarily during seed to allow arbitrary insertion order
  db.pragma('foreign_keys = OFF');

  const insertTransaction = db.transaction(() => {
    // Clear tables if force
    if (force) {
      const tables = [
        'direct_messages', 'conversations', 'notifications', 'post_comments', 'posts',
        'community_members', 'communities', 'resource_assignments', 'quick_actions',
        'request_responses', 'requests', 'resources', 'project_messages', 'project_participants',
        'projects', 'future_guidance', 'lessons', 'outcomes', 'decisions', 'plan_updates',
        'plan_revisions', 'plan_feedback', 'plan_milestones', 'plan_participants', 'plans',
        'safety_report_observations', 'safety_report_evidence', 'safety_reports', 'disputes',
        'claim_evidence', 'claims', 'observation_evidence', 'observation_relations',
        'observations', 'evidence', 'users'
      ];
      for (const table of tables) {
        db.prepare(`DELETE FROM ${table}`).run();
      }
    }

    // 1. Users
    const insertUser = db.prepare(`
      INSERT OR REPLACE INTO users (id, name, handle, email, password_hash, role, avatar, bio, address, neighborhood, lat, lng, skills, badges, privacy_settings, stats)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const u of mockUsers) {
      const email = u.id === 'usr_me' ? 'maya@caremesh.org' : `${u.handle.replace('@', '')}@caremesh.org`;
      insertUser.run(
        u.id,
        u.name,
        u.handle,
        email,
        defaultPasswordHash,
        u.role || 'Community Volunteer',
        u.avatar || '',
        u.bio || '',
        u.location?.address || 'Maplewood Local Area',
        u.location?.neighborhood || 'Maplewood',
        u.location?.lat || 37.7749,
        u.location?.lng || -122.4194,
        JSON.stringify(u.skills || []),
        JSON.stringify(u.badges || []),
        JSON.stringify(u.privacySettings || { showExactLocation: true, allowDirectMessages: true, publicContributionHistory: true }),
        JSON.stringify(u.stats || { contributions: 12, resourcesShared: 2, plansJoined: 1, requestsFulfilled: 3 })
      );
    }

    // 2. Evidence
    const insertEvidence = db.prepare(`
      INSERT OR REPLACE INTO evidence (id, title, type, author, author_id, timestamp, url, description, provenance_chain, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const ev of mockEvidence) {
      insertEvidence.run(
        ev.id,
        ev.title,
        ev.type,
        ev.author,
        ev.authorId || null,
        ev.timestamp,
        ev.url || '',
        ev.description || '',
        JSON.stringify(ev.provenanceChain || []),
        JSON.stringify(ev.metadata || {})
      );
    }

    // 3. Observations
    const insertObs = db.prepare(`
      INSERT OR REPLACE INTO observations (id, title, category, description, address, neighborhood, lat, lng, author_id, timestamp, media_urls, status, is_supporting, supporting_target_id, is_contradiction, contradiction_target_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertObsEvidence = db.prepare(`
      INSERT OR IGNORE INTO observation_evidence (id, observation_id, evidence_id)
      VALUES (?, ?, ?)
    `);
    const insertObsRelation = db.prepare(`
      INSERT OR IGNORE INTO observation_relations (id, source_observation_id, target_observation_id, relation_type)
      VALUES (?, ?, ?, ?)
    `);

    for (const obs of mockObservations) {
      insertObs.run(
        obs.id,
        obs.title,
        obs.category,
        obs.description,
        obs.location?.address || '',
        obs.location?.neighborhood || '',
        obs.location?.lat || 37.7749,
        obs.location?.lng || -122.4194,
        obs.author?.id || currentUser.id,
        obs.timestamp,
        JSON.stringify(obs.mediaUrls || []),
        obs.status,
        obs.isSupporting ? 1 : 0,
        obs.supportingTargetId || null,
        obs.isContradiction ? 1 : 0,
        obs.contradictionTargetId || null
      );
    }

    // Junctions for Observations
    for (const obs of mockObservations) {
      for (const evId of (obs.evidenceIds || [])) {
        insertObsEvidence.run(`obsev_${obs.id}_${evId}`, obs.id, evId);
      }
      for (const supId of (obs.supportingObservationIds || [])) {
        insertObsRelation.run(`obsrel_${supId}_${obs.id}`, supId, obs.id, 'supporting');
      }
      for (const contraId of (obs.contradictoryObservationIds || [])) {
        insertObsRelation.run(`obsrel_${contraId}_${obs.id}`, contraId, obs.id, 'contradictory');
      }
    }

    // 4. Claims & Claim Evidence
    const insertClaim = db.prepare(`
      INSERT OR REPLACE INTO claims (id, observation_id, assertion_text, status, assessment_notes, last_updated, author_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertClaimEvidence = db.prepare(`
      INSERT OR IGNORE INTO claim_evidence (id, claim_id, evidence_id, is_supporting)
      VALUES (?, ?, ?, ?)
    `);

    for (const c of mockClaims) {
      insertClaim.run(
        c.id,
        c.observationId,
        c.assertionText,
        c.status,
        c.assessmentNotes || '',
        c.lastUpdated || 'Today',
        c.authorId || null
      );

      for (const evId of (c.supportingEvidenceIds || [])) {
        insertClaimEvidence.run(`clmev_${c.id}_${evId}_1`, c.id, evId, 1);
      }
      for (const evId of (c.contradictingEvidenceIds || [])) {
        insertClaimEvidence.run(`clmev_${c.id}_${evId}_0`, c.id, evId, 0);
      }
    }

    // 5. Disputes / Challenges
    const insertDispute = db.prepare(`
      INSERT OR REPLACE INTO disputes (id, claim_id, observation_id, author_id, timestamp, reason, explanation, counter_evidence_ids, related_observation_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const d of mockDisputes) {
      insertDispute.run(
        d.id,
        d.claimId || null,
        d.observationId || null,
        d.author?.id || currentUser.id,
        d.timestamp,
        d.reason,
        d.explanation,
        JSON.stringify(d.counterEvidenceIds || []),
        d.relatedObservationId || null,
        d.status
      );
    }

    // 6. Safety Reports
    const insertSafety = db.prepare(`
      INSERT OR REPLACE INTO safety_reports (id, title, description, severity, status, address, lat, lng, timestamp, reporter_id, mitigation_actions, updates_log)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const s of mockSafetyReports) {
      insertSafety.run(
        s.id,
        s.title,
        s.description,
        s.severity,
        s.status,
        s.location?.address || '',
        s.location?.lat || 37.7749,
        s.location?.lng || -122.4194,
        s.timestamp,
        s.reporter?.id || currentUser.id,
        JSON.stringify(s.mitigationActions || []),
        JSON.stringify(s.updatesLog || [])
      );
    }

    // 7. Long-Term Plans
    const insertPlan = db.prepare(`
      INSERT OR REPLACE INTO plans (id, title, problem_statement, desired_outcome, proposed_approach, resources_needed, location, affected_parties, lifecycle_stage, overall_status, current_version, proposer_id, goals, outcomes_evaluation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertPlanParticipant = db.prepare(`
      INSERT OR IGNORE INTO plan_participants (id, plan_id, user_id, role, joined_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertPlanMilestone = db.prepare(`
      INSERT OR REPLACE INTO plan_milestones (id, plan_id, title, due_date, status, completed_date, assigned_to)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertPlanFeedback = db.prepare(`
      INSERT OR REPLACE INTO plan_feedback (id, plan_id, type, author_id, text, suggested_change, status, resolution_note, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertPlanRevision = db.prepare(`
      INSERT OR REPLACE INTO plan_revisions (id, plan_id, version, date, revised_by, summary_of_changes, reasoning_for_changes, incorporated_feedback_ids)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertPlanUpdate = db.prepare(`
      INSERT OR REPLACE INTO plan_updates (id, plan_id, date, note)
      VALUES (?, ?, ?, ?)
    `);
    const insertDecision = db.prepare(`
      INSERT OR REPLACE INTO decisions (id, plan_id, project_id, title, rationale, date, decided_by, version_tag, is_revision_decision, incorporated_feedback_ids)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertOutcome = db.prepare(`
      INSERT OR REPLACE INTO outcomes (id, plan_id, project_id, goal, actual_results, outcome_status, evidence_types, linked_evidence_ids, linked_observation_ids, unexpected_effects, lessons, guidance_for_future, evaluated_at, evaluator)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertLesson = db.prepare(`
      INSERT OR REPLACE INTO lessons (id, outcome_id, source_plan_id, source_project_id, lesson_text, context, applicability_tags, confidence, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertGuidance = db.prepare(`
      INSERT OR REPLACE INTO future_guidance (id, lesson_id, recommendation_text, applicable_category, checklist_items, target_phases)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const p of mockPlans) {
      insertPlan.run(
        p.id,
        p.title,
        p.problemStatement || '',
        p.desiredOutcome || '',
        p.proposedApproach || '',
        p.resourcesNeeded || '',
        p.location || '',
        p.affectedParties || '',
        p.lifecycleStage || 'community_review',
        p.overallStatus || 'planning',
        p.currentVersion || 'v1.0',
        p.proposer?.id || currentUser.id,
        JSON.stringify(p.goals || []),
        p.outcomesEvaluation || ''
      );

      for (const part of (p.participants || [])) {
        insertPlanParticipant.run(`pp_${p.id}_${part.user?.id || part.id}`, p.id, part.user?.id || part.id, part.role || 'Member', part.joinedAt || 'Recently');
      }

      for (const m of (p.milestones || [])) {
        insertPlanMilestone.run(m.id, p.id, m.title, m.dueDate, m.status, m.completedDate || null, m.assignedTo || 'Community');
      }

      for (const fb of (p.feedback || [])) {
        insertPlanFeedback.run(fb.id, p.id, fb.type, fb.author?.id || currentUser.id, fb.text, fb.suggestedChange || '', fb.status, fb.resolutionNote || '', fb.date || 'Oct 15');
      }

      for (const rev of (p.revisionHistory || [])) {
        insertPlanRevision.run(`rev_${p.id}_${rev.version}`, p.id, rev.version, rev.date, rev.revisedBy, rev.summaryOfChanges, rev.reasoningForChanges, JSON.stringify(rev.incorporatedFeedbackIds || []));
      }

      for (let idx = 0; idx < (p.updates || []).length; idx++) {
        const u = p.updates[idx];
        insertPlanUpdate.run(`upd_${p.id}_${idx}`, p.id, u.date, u.note);
      }

      for (const d of (p.decisions || [])) {
        insertDecision.run(d.id, p.id, null, d.title, d.rationale, d.date, d.decidedBy, d.versionTag || null, d.isRevisionDecision ? 1 : 0, JSON.stringify(d.incorporatedFeedbackIds || []));
      }

      // Outcomes, Lessons & Future Guidance
      if (p.outcomeReport) {
        const outcomeId = `out_${p.id}`;
        insertOutcome.run(
          outcomeId,
          p.id,
          null,
          p.outcomeReport.goal,
          JSON.stringify(p.outcomeReport.actualResults || []),
          p.outcomeReport.outcomeStatus || 'achieved',
          JSON.stringify(p.outcomeReport.evidenceTypes || []),
          JSON.stringify(p.outcomeReport.linkedEvidenceIds || []),
          JSON.stringify(p.outcomeReport.linkedObservationIds || []),
          p.outcomeReport.unexpectedEffects || '',
          p.outcomeReport.lessons || '',
          p.outcomeReport.guidanceForFuture || '',
          p.outcomeReport.evaluatedAt || 'Today',
          p.outcomeReport.evaluator || 'Working Group'
        );

        if (p.outcomeReport.lessons) {
          const lessonId = `lsn_${p.id}`;
          insertLesson.run(
            lessonId,
            outcomeId,
            p.id,
            null,
            p.outcomeReport.lessons,
            `Observed during ${p.title}`,
            JSON.stringify(['stormwater', 'watershed', 'volunteer_operations']),
            'high',
            'active'
          );

          if (p.outcomeReport.guidanceForFuture) {
            insertGuidance.run(
              `gui_${p.id}`,
              lessonId,
              p.outcomeReport.guidanceForFuture,
              'Environmental Planning',
              JSON.stringify(['Pre-scan utility conduits with GPR', 'Establish dedicated sediment trap forebay']),
              JSON.stringify(['planning', 'equipment_prep'])
            );
          }
        }
      }
    }

    // 8. Projects / Events
    const insertProject = db.prepare(`
      INSERT OR REPLACE INTO projects (id, title, event_type, description, address, lat, lng, date, time, organizer_id, max_participants, status, plan_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertProjectParticipant = db.prepare(`
      INSERT OR IGNORE INTO project_participants (id, project_id, user_id, joined_at)
      VALUES (?, ?, ?, ?)
    `);
    const insertProjectMessage = db.prepare(`
      INSERT OR REPLACE INTO project_messages (id, project_id, sender_id, text, time)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const evt of mockEvents) {
      insertProject.run(
        evt.id,
        evt.title,
        evt.eventType,
        evt.description,
        evt.location?.address || '',
        evt.location?.lat || 37.7749,
        evt.location?.lng || -122.4194,
        evt.date,
        evt.time,
        evt.organizer?.id || currentUser.id,
        evt.maxParticipants || 20,
        evt.status,
        evt.relatedPlanIds?.[0] || null
      );

      for (const part of (evt.participants || [])) {
        insertProjectParticipant.run(`projp_${evt.id}_${part.id}`, evt.id, part.id, 'Recently');
      }

      for (const msg of (evt.chatMessages || [])) {
        insertProjectMessage.run(`msg_${evt.id}_${msg.id}`, evt.id, msg.sender?.id || currentUser.id, msg.text, msg.time);
      }
    }

    // 9. Resources
    const insertResource = db.prepare(`
      INSERT OR REPLACE INTO resources (id, title, description, category, contribution_type, provider_id, address, lat, lng, availability, quantity, condition, conditions_terms, valid_until)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const res of mockResources) {
      insertResource.run(
        res.id,
        res.title,
        res.description,
        res.category,
        res.contributionType,
        res.provider?.id || currentUser.id,
        res.location?.address || '',
        res.location?.lat || 37.7749,
        res.location?.lng || -122.4194,
        res.availability,
        res.quantity || '',
        res.condition || '',
        res.conditionsTerms || '',
        res.validUntil || ''
      );
    }

    // 10. Help Requests & Quick Actions
    const insertRequest = db.prepare(`
      INSERT OR REPLACE INTO requests (id, title, description, category, address, lat, lng, urgency, required_skills, required_resources, people_needed, people_joined, progress_percentage, status, requester_id, expires_at, project_id, plan_id, community_id, visibility, scheduled_date, scheduled_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertQuickAction = db.prepare(`
      INSERT OR REPLACE INTO quick_actions (id, request_id, title, action_type, time_estimate, needed_contribution)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertRequestResponse = db.prepare(`
      INSERT OR REPLACE INTO request_responses (id, request_id, user_id, role, time)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const req of mockRequests) {
      insertRequest.run(
        req.id,
        req.title,
        req.description,
        req.category,
        req.location?.address || '',
        req.location?.lat || 37.7749,
        req.location?.lng || -122.4194,
        req.urgency,
        JSON.stringify(req.requiredSkills || []),
        JSON.stringify(req.requiredResources || []),
        req.peopleNeeded || 1,
        req.peopleJoined || 0,
        req.progressPercentage || 0,
        req.status,
        req.requester?.id || currentUser.id,
        req.expiresAt || null,
        null,
        null,
        req.communityId || null,
        req.visibility || 'public',
        req.scheduledDate || null,
        req.scheduledTime || null
      );

      for (const qa of (req.quickActions || [])) {
        insertQuickAction.run(qa.id, req.id, qa.title, qa.actionType, qa.timeEstimate, qa.neededContribution);
      }

      for (let idx = 0; idx < (req.responses || []).length; idx++) {
        const resp = req.responses[idx];
        insertRequestResponse.run(`resp_${req.id}_${idx}`, req.id, resp.user?.id || currentUser.id, resp.role, resp.time);
      }
    }

    // 11. Initial Resource Assignments (Coordinated matches)
    const insertAssignment = db.prepare(`
      INSERT OR REPLACE INTO resource_assignments (id, request_id, project_id, resource_id, assigned_by_id, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertAssignment.run('asgn_01', 'req_02', null, 'res_01', 'usr_priya', 'accepted', 'Delivered 3-inch trash pump to Elm St intake');
    insertAssignment.run('asgn_02', 'req_03', null, 'res_02', 'usr_elena', 'in_transit', '6 oil heaters staged at Pine Crest Manor');

    // 12. Communities & Social Posts
    const insertCommunity = db.prepare(`
      INSERT OR REPLACE INTO communities (id, name, handle, category, privacy, privacy_label, description, location, member_count, avatar, banner, created_date, pinned_post_id, rules, media_gallery, files)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertCommunityMember = db.prepare(`
      INSERT OR IGNORE INTO community_members (id, community_id, user_id, role)
      VALUES (?, ?, ?, ?)
    `);
    const insertPost = db.prepare(`
      INSERT OR REPLACE INTO posts (id, community_id, author_id, content, timestamp, is_pinned, linked_entity_type, linked_entity_id, linked_entity_title, endorsed_count, endorser_ids, media_urls, poll)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertPostComment = db.prepare(`
      INSERT OR REPLACE INTO post_comments (id, post_id, author_id, text, time)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const com of mockCommunities) {
      insertCommunity.run(
        com.id,
        com.name,
        com.handle,
        com.category,
        com.privacy,
        com.privacyLabel || '',
        com.description,
        com.location,
        com.memberCount,
        com.avatar,
        com.banner,
        com.createdDate,
        com.pinnedPostId || null,
        JSON.stringify(com.rules || []),
        JSON.stringify(com.mediaGallery || []),
        JSON.stringify(com.files || [])
      );

      for (const mId of (com.memberIds || [])) {
        const role = com.adminIds?.includes(mId) ? 'admin' : com.moderatorIds?.includes(mId) ? 'moderator' : 'member';
        insertCommunityMember.run(`cm_${com.id}_${mId}`, com.id, mId, role);
      }
    }

    for (const post of mockPosts) {
      insertPost.run(
        post.id,
        post.communityId,
        post.author?.id || currentUser.id,
        post.content,
        post.timestamp,
        post.isPinned ? 1 : 0,
        post.linkedEntityType || null,
        post.linkedEntityId || null,
        post.linkedEntityTitle || null,
        post.endorsedCount || 0,
        JSON.stringify(post.endorserIds || []),
        JSON.stringify(post.mediaUrls || []),
        post.poll ? JSON.stringify(post.poll) : null
      );

      for (const c of (post.comments || [])) {
        insertPostComment.run(c.id, post.id, c.author?.id || currentUser.id, c.text, c.time);
      }
    }

    // 13. Notifications
    const insertNotif = db.prepare(`
      INSERT OR REPLACE INTO notifications (id, user_id, type, title, body, timestamp, is_read, target_view, target_sub_tab, target_entity_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const n of mockNotifications) {
      insertNotif.run(
        n.id,
        n.userId || 'usr_me',
        n.type,
        n.title,
        n.body,
        n.timestamp,
        n.isRead ? 1 : 0,
        n.targetView,
        n.targetSubTab || null,
        n.targetEntityId || null
      );
    }

    // 14. Conversations & Direct Messages
    const insertConv = db.prepare(`
      INSERT OR REPLACE INTO conversations (id, user1_id, user2_id, title, subtitle, last_message, last_time, unread_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertDM = db.prepare(`
      INSERT OR REPLACE INTO direct_messages (id, conversation_id, sender_id, text, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const conv of mockConversations) {
      insertConv.run(
        conv.id,
        'usr_me',
        conv.participant?.id || 'usr_dave',
        conv.title,
        conv.subtitle,
        conv.lastMessage,
        conv.lastTime,
        conv.unreadCount || 0
      );

      for (const msg of (conv.messages || [])) {
        insertDM.run(`dm_${conv.id}_${msg.id}`, conv.id, msg.senderId, msg.text, msg.timestamp);
      }
    }
  });

  insertTransaction();
  db.pragma('foreign_keys = ON');
  console.log('✅ CareMesh Database seeded successfully with normalized relational records.');
}

if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase(true);
}
