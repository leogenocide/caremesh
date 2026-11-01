# CareMesh Data Dictionary

Generated from the CareMesh SQLite database schema.

## Table: claim_evidence

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| claim_id | TEXT | No | Yes | — | claims.id |
| evidence_id | TEXT | No | Yes | — | evidence.id |
| is_supporting | INTEGER | No | No | 1 | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |

**Foreign key relationships:** evidence_id → evidence.id; claim_id → claims.id

## Table: claims

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| observation_id | TEXT | No | Yes | — | observations.id |
| assertion_text | TEXT | No | Yes | — | — |
| status | TEXT | No | Yes | — | — |
| assessment_notes | TEXT | No | No | — | — |
| last_updated | TEXT | No | No | — | — |
| author_id | TEXT | No | No | — | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |

**Foreign key relationships:** observation_id → observations.id

## Table: communities

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| name | TEXT | No | Yes | — | — |
| handle | TEXT | No | Yes | — | — |
| category | TEXT | No | Yes | — | — |
| privacy | TEXT | No | Yes | — | — |
| privacy_label | TEXT | No | No | — | — |
| description | TEXT | No | No | — | — |
| location | TEXT | No | No | — | — |
| member_count | INTEGER | No | No | 1 | — |
| avatar | TEXT | No | No | — | — |
| banner | TEXT | No | No | — | — |
| created_date | TEXT | No | No | — | — |
| pinned_post_id | TEXT | No | No | — | — |
| rules | TEXT | No | No | '[]' | — |
| media_gallery | TEXT | No | No | '[]' | — |
| files | TEXT | No | No | '[]' | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |
| creator_id | TEXT | No | No | — | — |

**Foreign key relationships:** None declared

## Table: community_members

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| community_id | TEXT | No | Yes | — | communities.id |
| user_id | TEXT | No | Yes | — | users.id |
| role | TEXT | No | No | 'member' | — |
| joined_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |

**Foreign key relationships:** user_id → users.id; community_id → communities.id

## Table: conversations

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| user1_id | TEXT | No | Yes | — | users.id |
| user2_id | TEXT | No | Yes | — | users.id |
| title | TEXT | No | No | — | — |
| subtitle | TEXT | No | No | — | — |
| last_message | TEXT | No | No | — | — |
| last_time | TEXT | No | No | — | — |
| unread_count | INTEGER | No | No | 0 | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |

**Foreign key relationships:** user2_id → users.id; user1_id → users.id

## Table: decisions

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| plan_id | TEXT | No | No | — | — |
| project_id | TEXT | No | No | — | — |
| title | TEXT | No | Yes | — | — |
| rationale | TEXT | No | Yes | — | — |
| date | TEXT | No | No | — | — |
| decided_by | TEXT | No | Yes | — | — |
| version_tag | TEXT | No | No | — | — |
| is_revision_decision | INTEGER | No | No | 0 | — |
| incorporated_feedback_ids | TEXT | No | No | '[]' | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |

**Foreign key relationships:** None declared

## Table: direct_messages

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| conversation_id | TEXT | No | Yes | — | conversations.id |
| sender_id | TEXT | No | Yes | — | users.id |
| text | TEXT | No | Yes | — | — |
| timestamp | TEXT | No | No | — | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |

**Foreign key relationships:** sender_id → users.id; conversation_id → conversations.id

## Table: dispute_responses

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| dispute_id | TEXT | No | Yes | — | disputes.id |
| type | TEXT | No | Yes | — | — |
| author_id | TEXT | No | Yes | — | users.id |
| timestamp | TEXT | No | Yes | — | — |
| reason | TEXT | No | No | — | — |
| explanation | TEXT | No | Yes | — | — |
| evidence_ids | TEXT | No | No | '[]' | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |

**Foreign key relationships:** author_id → users.id; dispute_id → disputes.id

## Table: disputes

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| claim_id | TEXT | No | No | — | — |
| observation_id | TEXT | No | No | — | — |
| author_id | TEXT | No | Yes | — | users.id |
| timestamp | TEXT | No | No | — | — |
| reason | TEXT | No | Yes | — | — |
| explanation | TEXT | No | Yes | — | — |
| counter_evidence_ids | TEXT | No | No | '[]' | — |
| related_observation_id | TEXT | No | No | — | — |
| status | TEXT | No | Yes | — | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |

**Foreign key relationships:** author_id → users.id

## Table: email_verification_codes

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| email | TEXT | No | Yes | — | — |
| code_hash | TEXT | No | Yes | — | — |
| expires_at | DATETIME | No | Yes | — | — |
| used | INTEGER | No | No | 0 | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |

**Foreign key relationships:** None declared

## Table: evidence

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| title | TEXT | No | Yes | — | — |
| type | TEXT | No | Yes | — | — |
| author | TEXT | No | Yes | — | — |
| author_id | TEXT | No | No | — | — |
| timestamp | TEXT | No | No | — | — |
| url | TEXT | No | No | — | — |
| description | TEXT | No | No | — | — |
| provenance_chain | TEXT | No | No | '[]' | — |
| metadata | TEXT | No | No | '{}' | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |
| parent_evidence_id | TEXT | No | No | — | — |
| parent_observation_id | TEXT | No | No | — | — |

**Foreign key relationships:** None declared

## Table: future_guidance

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| lesson_id | TEXT | No | No | — | lessons.id |
| recommendation_text | TEXT | No | Yes | — | — |
| applicable_category | TEXT | No | No | — | — |
| checklist_items | TEXT | No | No | '[]' | — |
| target_phases | TEXT | No | No | '[]' | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |

**Foreign key relationships:** lesson_id → lessons.id

## Table: lessons

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| outcome_id | TEXT | No | No | — | outcomes.id |
| source_plan_id | TEXT | No | No | — | — |
| source_project_id | TEXT | No | No | — | — |
| lesson_text | TEXT | No | Yes | — | — |
| context | TEXT | No | No | — | — |
| applicability_tags | TEXT | No | No | '[]' | — |
| confidence | TEXT | No | No | 'high' | — |
| status | TEXT | No | No | 'active' | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |

**Foreign key relationships:** outcome_id → outcomes.id

## Table: match_endorsements

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| match_id | TEXT | No | Yes | — | — |
| user_id | TEXT | No | Yes | — | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |

**Foreign key relationships:** None declared

## Table: moderation_audit_logs

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| moderator_id | TEXT | No | Yes | — | — |
| moderator_role | TEXT | No | Yes | — | — |
| community_id | TEXT | No | No | — | — |
| action_type | TEXT | No | Yes | — | — |
| target_type | TEXT | No | Yes | — | — |
| target_id | TEXT | No | Yes | — | — |
| target_author_id | TEXT | No | No | — | — |
| target_content_snapshot | TEXT | No | No | — | — |
| reason | TEXT | No | No | — | — |
| notes | TEXT | No | No | — | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |

**Foreign key relationships:** None declared

## Table: moderator_elections

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| community_id | TEXT | No | Yes | — | communities.id |
| candidate_id | TEXT | No | Yes | — | users.id |
| nominated_by_id | TEXT | No | Yes | — | users.id |
| status | TEXT | No | No | 'active' | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |

**Foreign key relationships:** nominated_by_id → users.id; candidate_id → users.id; community_id → communities.id

## Table: moderator_votes

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| election_id | TEXT | No | Yes | — | moderator_elections.id |
| community_id | TEXT | No | Yes | — | — |
| voter_id | TEXT | No | Yes | — | users.id |
| vote | TEXT | No | Yes | — | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |

**Foreign key relationships:** voter_id → users.id; election_id → moderator_elections.id

## Table: notifications

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| user_id | TEXT | No | No | — | — |
| type | TEXT | No | Yes | — | — |
| title | TEXT | No | Yes | — | — |
| body | TEXT | No | Yes | — | — |
| timestamp | TEXT | No | No | — | — |
| is_read | INTEGER | No | No | 0 | — |
| target_view | TEXT | No | No | — | — |
| target_sub_tab | TEXT | No | No | — | — |
| target_entity_id | TEXT | No | No | — | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |

**Foreign key relationships:** None declared

## Table: observation_evidence

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| observation_id | TEXT | No | Yes | — | observations.id |
| evidence_id | TEXT | No | Yes | — | evidence.id |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |

**Foreign key relationships:** evidence_id → evidence.id; observation_id → observations.id

## Table: observation_relations

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| source_observation_id | TEXT | No | Yes | — | observations.id |
| target_observation_id | TEXT | No | Yes | — | observations.id |
| relation_type | TEXT | No | Yes | — | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |

**Foreign key relationships:** target_observation_id → observations.id; source_observation_id → observations.id

## Table: observations

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| title | TEXT | No | Yes | — | — |
| category | TEXT | No | Yes | — | — |
| description | TEXT | No | Yes | — | — |
| address | TEXT | No | No | — | — |
| neighborhood | TEXT | No | No | — | — |
| lat | REAL | No | No | — | — |
| lng | REAL | No | No | — | — |
| author_id | TEXT | No | Yes | — | users.id |
| timestamp | TEXT | No | No | — | — |
| media_urls | TEXT | No | No | '[]' | — |
| status | TEXT | No | Yes | — | — |
| is_supporting | INTEGER | No | No | 0 | — |
| supporting_target_id | TEXT | No | No | — | — |
| is_contradiction | INTEGER | No | No | 0 | — |
| contradiction_target_id | TEXT | No | No | — | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |
| referenced_evidence_id | TEXT | No | No | — | — |
| referenced_evidence_title | TEXT | No | No | — | — |
| is_quarantined | INTEGER | No | No | 0 | — |
| quarantined_at | DATETIME | No | No | — | — |
| quarantined_by_id | TEXT | No | No | — | — |
| quarantine_reason | TEXT | No | No | — | — |

**Foreign key relationships:** author_id → users.id

## Table: outcomes

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| plan_id | TEXT | No | No | — | — |
| project_id | TEXT | No | No | — | — |
| goal | TEXT | No | Yes | — | — |
| actual_results | TEXT | No | Yes | — | — |
| outcome_status | TEXT | No | Yes | — | — |
| evidence_types | TEXT | No | No | '[]' | — |
| linked_evidence_ids | TEXT | No | No | '[]' | — |
| linked_observation_ids | TEXT | No | No | '[]' | — |
| unexpected_effects | TEXT | No | No | — | — |
| lessons | TEXT | No | No | — | — |
| guidance_for_future | TEXT | No | No | — | — |
| evaluated_at | TEXT | No | No | — | — |
| evaluator | TEXT | No | No | — | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |

**Foreign key relationships:** None declared

## Table: password_reset_codes

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| user_id | TEXT | No | Yes | — | users.id |
| email | TEXT | No | Yes | — | — |
| code_hash | TEXT | No | Yes | — | — |
| expires_at | DATETIME | No | Yes | — | — |
| used | INTEGER | No | No | 0 | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |

**Foreign key relationships:** user_id → users.id

## Table: plan_feedback

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| plan_id | TEXT | No | Yes | — | plans.id |
| type | TEXT | No | Yes | — | — |
| author_id | TEXT | No | Yes | — | users.id |
| text | TEXT | No | Yes | — | — |
| suggested_change | TEXT | No | No | — | — |
| status | TEXT | No | Yes | — | — |
| resolution_note | TEXT | No | No | — | — |
| date | TEXT | No | No | — | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |

**Foreign key relationships:** author_id → users.id; plan_id → plans.id

## Table: plan_milestones

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| plan_id | TEXT | No | Yes | — | plans.id |
| title | TEXT | No | Yes | — | — |
| due_date | TEXT | No | No | — | — |
| status | TEXT | No | Yes | — | — |
| completed_date | TEXT | No | No | — | — |
| assigned_to | TEXT | No | No | — | — |

**Foreign key relationships:** plan_id → plans.id

## Table: plan_participants

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| plan_id | TEXT | No | Yes | — | plans.id |
| user_id | TEXT | No | Yes | — | users.id |
| role | TEXT | No | No | — | — |
| joined_at | TEXT | No | No | — | — |

**Foreign key relationships:** user_id → users.id; plan_id → plans.id

## Table: plan_revisions

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| plan_id | TEXT | No | Yes | — | plans.id |
| version | TEXT | No | Yes | — | — |
| date | TEXT | No | No | — | — |
| revised_by | TEXT | No | Yes | — | — |
| summary_of_changes | TEXT | No | Yes | — | — |
| reasoning_for_changes | TEXT | No | Yes | — | — |
| incorporated_feedback_ids | TEXT | No | No | '[]' | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |

**Foreign key relationships:** plan_id → plans.id

## Table: plan_updates

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| plan_id | TEXT | No | Yes | — | plans.id |
| date | TEXT | No | Yes | — | — |
| note | TEXT | No | Yes | — | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |

**Foreign key relationships:** plan_id → plans.id

## Table: plans

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| title | TEXT | No | Yes | — | — |
| problem_statement | TEXT | No | No | — | — |
| desired_outcome | TEXT | No | No | — | — |
| proposed_approach | TEXT | No | No | — | — |
| resources_needed | TEXT | No | No | — | — |
| location | TEXT | No | No | — | — |
| affected_parties | TEXT | No | No | — | — |
| lifecycle_stage | TEXT | No | Yes | — | — |
| overall_status | TEXT | No | Yes | — | — |
| current_version | TEXT | No | No | 'v1.0' | — |
| proposer_id | TEXT | No | Yes | — | users.id |
| goals | TEXT | No | No | '[]' | — |
| outcomes_evaluation | TEXT | No | No | — | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |
| is_quarantined | INTEGER | No | No | 0 | — |
| quarantined_at | DATETIME | No | No | — | — |
| quarantined_by_id | TEXT | No | No | — | — |
| quarantine_reason | TEXT | No | No | — | — |

**Foreign key relationships:** proposer_id → users.id

## Table: post_comments

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| post_id | TEXT | No | Yes | — | posts.id |
| author_id | TEXT | No | Yes | — | users.id |
| text | TEXT | No | Yes | — | — |
| time | TEXT | No | No | — | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |
| is_quarantined | INTEGER | No | No | 0 | — |
| quarantined_at | DATETIME | No | No | — | — |
| quarantined_by_id | TEXT | No | No | — | — |
| quarantine_reason | TEXT | No | No | — | — |

**Foreign key relationships:** author_id → users.id; post_id → posts.id

## Table: posts

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| community_id | TEXT | No | Yes | — | communities.id |
| author_id | TEXT | No | Yes | — | users.id |
| content | TEXT | No | Yes | — | — |
| timestamp | TEXT | No | No | — | — |
| is_pinned | INTEGER | No | No | 0 | — |
| linked_entity_type | TEXT | No | No | — | — |
| linked_entity_id | TEXT | No | No | — | — |
| linked_entity_title | TEXT | No | No | — | — |
| endorsed_count | INTEGER | No | No | 0 | — |
| endorser_ids | TEXT | No | No | '[]' | — |
| media_urls | TEXT | No | No | '[]' | — |
| poll | TEXT | No | No | — | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |
| restricted_user_ids | TEXT | No | No | '[]' | — |
| category | TEXT | No | No | — | — |
| is_quarantined | INTEGER | No | No | 0 | — |
| quarantined_at | DATETIME | No | No | — | — |
| quarantined_by_id | TEXT | No | No | — | — |
| quarantine_reason | TEXT | No | No | — | — |

**Foreign key relationships:** author_id → users.id; community_id → communities.id

## Table: project_messages

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| project_id | TEXT | No | Yes | — | projects.id |
| sender_id | TEXT | No | Yes | — | users.id |
| text | TEXT | No | Yes | — | — |
| time | TEXT | No | No | — | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |

**Foreign key relationships:** sender_id → users.id; project_id → projects.id

## Table: project_participants

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| project_id | TEXT | No | Yes | — | projects.id |
| user_id | TEXT | No | Yes | — | users.id |
| joined_at | TEXT | No | No | — | — |

**Foreign key relationships:** user_id → users.id; project_id → projects.id

## Table: projects

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| title | TEXT | No | Yes | — | — |
| event_type | TEXT | No | Yes | — | — |
| description | TEXT | No | Yes | — | — |
| address | TEXT | No | No | — | — |
| lat | REAL | No | No | — | — |
| lng | REAL | No | No | — | — |
| date | TEXT | No | No | — | — |
| time | TEXT | No | No | — | — |
| organizer_id | TEXT | No | Yes | — | users.id |
| max_participants | INTEGER | No | No | 20 | — |
| status | TEXT | No | Yes | — | — |
| plan_id | TEXT | No | No | — | plans.id |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |
| custom_event_type | TEXT | No | No | — | — |
| attendee_privacy | TEXT | No | No | 'public' | — |
| chat_privacy | TEXT | No | No | 'members_only' | — |
| is_quarantined | INTEGER | No | No | 0 | — |
| quarantined_at | DATETIME | No | No | — | — |
| quarantined_by_id | TEXT | No | No | — | — |
| quarantine_reason | TEXT | No | No | — | — |

**Foreign key relationships:** plan_id → plans.id; organizer_id → users.id

## Table: quick_actions

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| request_id | TEXT | No | Yes | — | requests.id |
| title | TEXT | No | Yes | — | — |
| action_type | TEXT | No | Yes | — | — |
| time_estimate | TEXT | No | No | — | — |
| needed_contribution | TEXT | No | No | — | — |

**Foreign key relationships:** request_id → requests.id

## Table: readiness_checks

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| creator_id | TEXT | No | Yes | — | users.id |
| community_id | TEXT | No | No | — | — |
| title | TEXT | No | Yes | — | — |
| description | TEXT | No | No | — | — |
| target_date | TEXT | No | No | — | — |
| required_skills | TEXT | No | No | '[]' | — |
| status | TEXT | No | No | 'open' | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |
| target_headcount | INTEGER | No | No | 5 | — |
| request_id | TEXT | No | No | — | — |
| event_id | TEXT | No | No | — | — |

**Foreign key relationships:** creator_id → users.id

## Table: readiness_responses

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| readiness_check_id | TEXT | No | Yes | — | readiness_checks.id |
| user_id | TEXT | No | Yes | — | users.id |
| status | TEXT | No | Yes | — | — |
| note | TEXT | No | No | — | — |
| available_hours | TEXT | No | No | — | — |
| updated_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |

**Foreign key relationships:** user_id → users.id; readiness_check_id → readiness_checks.id

## Table: reports

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| type | TEXT | No | Yes | — | — |
| target_id | TEXT | No | Yes | — | — |
| target_title | TEXT | No | No | — | — |
| target_content | TEXT | No | No | — | — |
| reported_user_id | TEXT | No | Yes | — | users.id |
| reporter_id | TEXT | No | Yes | — | users.id |
| community_id | TEXT | No | No | — | — |
| scope | TEXT | No | No | 'community' | — |
| reason | TEXT | No | Yes | — | — |
| details | TEXT | No | No | — | — |
| status | TEXT | No | No | 'pending' | — |
| action_taken | TEXT | No | No | 'none' | — |
| resolved_by_id | TEXT | No | No | — | — |
| resolved_at | DATETIME | No | No | — | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |

**Foreign key relationships:** reporter_id → users.id; reported_user_id → users.id

## Table: request_responses

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| request_id | TEXT | No | Yes | — | requests.id |
| user_id | TEXT | No | Yes | — | users.id |
| role | TEXT | No | No | — | — |
| time | TEXT | No | No | — | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |

**Foreign key relationships:** user_id → users.id; request_id → requests.id

## Table: requests

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| title | TEXT | No | Yes | — | — |
| description | TEXT | No | Yes | — | — |
| category | TEXT | No | Yes | — | — |
| address | TEXT | No | No | — | — |
| lat | REAL | No | No | — | — |
| lng | REAL | No | No | — | — |
| urgency | TEXT | No | Yes | — | — |
| required_skills | TEXT | No | No | '[]' | — |
| required_resources | TEXT | No | No | '[]' | — |
| people_needed | INTEGER | No | No | 1 | — |
| people_joined | INTEGER | No | No | 0 | — |
| progress_percentage | INTEGER | No | No | 0 | — |
| status | TEXT | No | Yes | — | — |
| requester_id | TEXT | No | Yes | — | users.id |
| expires_at | TEXT | No | No | — | — |
| project_id | TEXT | No | No | — | — |
| plan_id | TEXT | No | No | — | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |
| community_id | TEXT | No | No | — | — |
| visibility | TEXT | No | No | 'public' | — |
| scheduled_date | TEXT | No | No | — | — |
| scheduled_time | TEXT | No | No | — | — |
| is_quarantined | INTEGER | No | No | 0 | — |
| quarantined_at | DATETIME | No | No | — | — |
| quarantined_by_id | TEXT | No | No | — | — |
| quarantine_reason | TEXT | No | No | — | — |

**Foreign key relationships:** requester_id → users.id

## Table: resource_assignments

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| request_id | TEXT | No | No | — | — |
| project_id | TEXT | No | No | — | — |
| resource_id | TEXT | No | Yes | — | resources.id |
| assigned_by_id | TEXT | No | Yes | — | users.id |
| assigned_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |
| status | TEXT | No | Yes | — | — |
| notes | TEXT | No | No | — | — |
| borrower_id | TEXT | No | No | — | — |
| purpose | TEXT | No | No | — | — |
| start_date | TEXT | No | No | — | — |
| due_date | TEXT | No | No | — | — |
| return_date | TEXT | No | No | — | — |
| return_condition | TEXT | No | No | — | — |
| requested_quantity | TEXT | No | No | — | — |
| terms_accepted | INTEGER | No | No | 1 | — |

**Foreign key relationships:** assigned_by_id → users.id; resource_id → resources.id

## Table: resources

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| title | TEXT | No | Yes | — | — |
| description | TEXT | No | Yes | — | — |
| category | TEXT | No | Yes | — | — |
| contribution_type | TEXT | No | Yes | — | — |
| provider_id | TEXT | No | Yes | — | users.id |
| address | TEXT | No | No | — | — |
| lat | REAL | No | No | — | — |
| lng | REAL | No | No | — | — |
| availability | TEXT | No | Yes | — | — |
| quantity | TEXT | No | No | — | — |
| condition | TEXT | No | No | — | — |
| conditions_terms | TEXT | No | No | — | — |
| valid_until | TEXT | No | No | — | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |
| is_quarantined | INTEGER | No | No | 0 | — |
| quarantined_at | DATETIME | No | No | — | — |
| quarantined_by_id | TEXT | No | No | — | — |
| quarantine_reason | TEXT | No | No | — | — |

**Foreign key relationships:** provider_id → users.id

## Table: safety_report_evidence

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| safety_report_id | TEXT | No | Yes | — | safety_reports.id |
| evidence_id | TEXT | No | Yes | — | evidence.id |

**Foreign key relationships:** evidence_id → evidence.id; safety_report_id → safety_reports.id

## Table: safety_report_observations

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| safety_report_id | TEXT | No | Yes | — | safety_reports.id |
| observation_id | TEXT | No | Yes | — | observations.id |

**Foreign key relationships:** observation_id → observations.id; safety_report_id → safety_reports.id

## Table: safety_reports

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| title | TEXT | No | Yes | — | — |
| description | TEXT | No | Yes | — | — |
| severity | TEXT | No | Yes | — | — |
| status | TEXT | No | Yes | — | — |
| address | TEXT | No | No | — | — |
| lat | REAL | No | No | — | — |
| lng | REAL | No | No | — | — |
| timestamp | TEXT | No | No | — | — |
| reporter_id | TEXT | No | Yes | — | users.id |
| mitigation_actions | TEXT | No | No | '[]' | — |
| updates_log | TEXT | No | No | '[]' | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |

**Foreign key relationships:** reporter_id → users.id

## Table: users

| Field | Data type | Primary key | Required | Default | Foreign key |
|---|---|---|---|---|---|
| id | TEXT | Yes | Yes | — | — |
| name | TEXT | No | Yes | — | — |
| handle | TEXT | No | Yes | — | — |
| email | TEXT | No | No | — | — |
| password_hash | TEXT | No | No | — | — |
| role | TEXT | No | No | — | — |
| avatar | TEXT | No | No | — | — |
| bio | TEXT | No | No | — | — |
| address | TEXT | No | No | — | — |
| neighborhood | TEXT | No | No | — | — |
| lat | REAL | No | No | — | — |
| lng | REAL | No | No | — | — |
| skills | TEXT | No | No | '[]' | — |
| badges | TEXT | No | No | '[]' | — |
| privacy_settings | TEXT | No | No | '{}' | — |
| stats | TEXT | No | No | '{}' | — |
| created_at | DATETIME | No | No | CURRENT_TIMESTAMP | — |
| is_public_moderator | INTEGER | No | No | 0 | — |
| google_id | TEXT | No | No | — | — |
| auth_provider | TEXT | No | No | 'local' | — |
| status | TEXT | No | No | 'active' | — |
| restriction_reason | TEXT | No | No | — | — |
| restricted_at | DATETIME | No | No | — | — |
| restricted_by_id | TEXT | No | No | — | — |
| social_links | TEXT | No | No | '{}' | — |
| is_email_verified | INTEGER | No | No | 0 | — |

**Foreign key relationships:** None declared
