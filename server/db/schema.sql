-- CareMesh SQLite Normalized Schema

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT,
  role TEXT,
  avatar TEXT,
  bio TEXT,
  address TEXT,
  neighborhood TEXT,
  lat REAL,
  lng REAL,
  skills TEXT DEFAULT '[]',
  badges TEXT DEFAULT '[]',
  privacy_settings TEXT DEFAULT '{}',
  stats TEXT DEFAULT '{}',
  is_public_moderator INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active', -- 'active' | 'restricted'
  restriction_reason TEXT,
  restricted_at DATETIME,
  restricted_by_id TEXT,
  google_id TEXT UNIQUE,
  auth_provider TEXT DEFAULT 'local',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  author TEXT NOT NULL,
  author_id TEXT,
  timestamp TEXT,
  url TEXT,
  description TEXT,
  provenance_chain TEXT DEFAULT '[]',
  metadata TEXT DEFAULT '{}',
  parent_evidence_id TEXT,
  parent_observation_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS observations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  address TEXT,
  neighborhood TEXT,
  lat REAL,
  lng REAL,
  author_id TEXT NOT NULL,
  timestamp TEXT,
  media_urls TEXT DEFAULT '[]',
  status TEXT NOT NULL,
  is_supporting INTEGER DEFAULT 0,
  supporting_target_id TEXT,
  is_contradiction INTEGER DEFAULT 0,
  contradiction_target_id TEXT,
  referenced_evidence_id TEXT,
  referenced_evidence_title TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS observation_relations (
  id TEXT PRIMARY KEY,
  source_observation_id TEXT NOT NULL,
  target_observation_id TEXT NOT NULL,
  relation_type TEXT NOT NULL, -- 'supporting' | 'contradictory'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_observation_id) REFERENCES observations(id) ON DELETE CASCADE,
  FOREIGN KEY (target_observation_id) REFERENCES observations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS observation_evidence (
  id TEXT PRIMARY KEY,
  observation_id TEXT NOT NULL,
  evidence_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (observation_id) REFERENCES observations(id) ON DELETE CASCADE,
  FOREIGN KEY (evidence_id) REFERENCES evidence(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS claims (
  id TEXT PRIMARY KEY,
  observation_id TEXT NOT NULL,
  assertion_text TEXT NOT NULL,
  status TEXT NOT NULL, -- 'reported' | 'under_assessment' | 'supported' | 'disputed' | 'resolved' | 'outdated'
  assessment_notes TEXT,
  last_updated TEXT,
  author_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (observation_id) REFERENCES observations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS claim_evidence (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL,
  evidence_id TEXT NOT NULL,
  is_supporting INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
  FOREIGN KEY (evidence_id) REFERENCES evidence(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS disputes (
  id TEXT PRIMARY KEY,
  claim_id TEXT,
  observation_id TEXT,
  author_id TEXT NOT NULL,
  timestamp TEXT,
  reason TEXT NOT NULL,
  explanation TEXT NOT NULL,
  counter_evidence_ids TEXT DEFAULT '[]',
  related_observation_id TEXT,
  status TEXT NOT NULL, -- 'active_challenge' | 'reviewed' | 'resolved'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS dispute_responses (
  id TEXT PRIMARY KEY,
  dispute_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'support' | 'challenge'
  author_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  reason TEXT,
  explanation TEXT NOT NULL,
  evidence_ids TEXT DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS safety_reports (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL, -- 'low' | 'moderate' | 'high' | 'critical'
  status TEXT NOT NULL,
  address TEXT,
  lat REAL,
  lng REAL,
  timestamp TEXT,
  reporter_id TEXT NOT NULL,
  mitigation_actions TEXT DEFAULT '[]',
  updates_log TEXT DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS safety_report_evidence (
  id TEXT PRIMARY KEY,
  safety_report_id TEXT NOT NULL,
  evidence_id TEXT NOT NULL,
  FOREIGN KEY (safety_report_id) REFERENCES safety_reports(id) ON DELETE CASCADE,
  FOREIGN KEY (evidence_id) REFERENCES evidence(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS safety_report_observations (
  id TEXT PRIMARY KEY,
  safety_report_id TEXT NOT NULL,
  observation_id TEXT NOT NULL,
  FOREIGN KEY (safety_report_id) REFERENCES safety_reports(id) ON DELETE CASCADE,
  FOREIGN KEY (observation_id) REFERENCES observations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  problem_statement TEXT,
  desired_outcome TEXT,
  proposed_approach TEXT,
  resources_needed TEXT,
  location TEXT,
  affected_parties TEXT,
  lifecycle_stage TEXT NOT NULL, -- 'draft' | 'community_review' | 'revised' | 'accepted' | 'active' | 'completed' | 'cancelled'
  overall_status TEXT NOT NULL, -- 'planning' | 'in_progress' | 'blocked' | 'completed' | 'cancelled'
  current_version TEXT DEFAULT 'v1.0',
  proposer_id TEXT NOT NULL,
  goals TEXT DEFAULT '[]',
  outcomes_evaluation TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proposer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS plan_participants (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT,
  joined_at TEXT,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plan_milestones (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  title TEXT NOT NULL,
  due_date TEXT,
  status TEXT NOT NULL, -- 'pending' | 'in_progress' | 'completed'
  completed_date TEXT,
  assigned_to TEXT,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plan_feedback (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'risk' | 'alternative' | 'evidence' | 'modification' | 'critique' | 'support'
  author_id TEXT NOT NULL,
  text TEXT NOT NULL,
  suggested_change TEXT,
  status TEXT NOT NULL, -- 'open' | 'adopted' | 'addressed' | 'under_discussion' | 'rejected'
  resolution_note TEXT,
  date TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS plan_revisions (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  version TEXT NOT NULL,
  date TEXT,
  revised_by TEXT NOT NULL,
  summary_of_changes TEXT NOT NULL,
  reasoning_for_changes TEXT NOT NULL,
  incorporated_feedback_ids TEXT DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plan_updates (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  date TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  plan_id TEXT,
  project_id TEXT,
  title TEXT NOT NULL,
  rationale TEXT NOT NULL,
  date TEXT,
  decided_by TEXT NOT NULL,
  version_tag TEXT,
  is_revision_decision INTEGER DEFAULT 0,
  incorporated_feedback_ids TEXT DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS outcomes (
  id TEXT PRIMARY KEY,
  plan_id TEXT,
  project_id TEXT,
  goal TEXT NOT NULL,
  actual_results TEXT NOT NULL, -- JSON array
  outcome_status TEXT NOT NULL, -- 'achieved' | 'partially_achieved' | 'not_achieved'
  evidence_types TEXT DEFAULT '[]',
  linked_evidence_ids TEXT DEFAULT '[]',
  linked_observation_ids TEXT DEFAULT '[]',
  unexpected_effects TEXT,
  lessons TEXT,
  guidance_for_future TEXT,
  evaluated_at TEXT,
  evaluator TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  outcome_id TEXT,
  source_plan_id TEXT,
  source_project_id TEXT,
  lesson_text TEXT NOT NULL,
  context TEXT,
  applicability_tags TEXT DEFAULT '[]',
  confidence TEXT DEFAULT 'high',
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (outcome_id) REFERENCES outcomes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS future_guidance (
  id TEXT PRIMARY KEY,
  lesson_id TEXT,
  recommendation_text TEXT NOT NULL,
  applicable_category TEXT,
  checklist_items TEXT DEFAULT '[]',
  target_phases TEXT DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'assistance_operation' | 'community_activity' | 'volunteer_activity' | 'chat_only' | 'project'
  description TEXT NOT NULL,
  address TEXT,
  lat REAL,
  lng REAL,
  date TEXT,
  time TEXT,
  organizer_id TEXT NOT NULL,
  max_participants INTEGER DEFAULT 20,
  status TEXT NOT NULL, -- 'upcoming' | 'in_progress' | 'completed' | 'cancelled'
  plan_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organizer_id) REFERENCES users(id),
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

CREATE TABLE IF NOT EXISTS project_participants (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  joined_at TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_messages (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  text TEXT NOT NULL,
  time TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  address TEXT,
  lat REAL,
  lng REAL,
  urgency TEXT NOT NULL, -- 'low' | 'medium' | 'high' | 'critical'
  required_skills TEXT DEFAULT '[]',
  required_resources TEXT DEFAULT '[]',
  people_needed INTEGER DEFAULT 1,
  people_joined INTEGER DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0,
  status TEXT NOT NULL, -- 'open' | 'partially_fulfilled' | 'fulfilled' | 'cancelled' | 'expired'
  requester_id TEXT NOT NULL,
  expires_at TEXT,
  project_id TEXT,
  plan_id TEXT,
  community_id TEXT,
  visibility TEXT DEFAULT 'public', -- 'public' | 'group_only'
  scheduled_date TEXT,
  scheduled_time TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES users(id),
  FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS request_responses (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT,
  time TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS quick_actions (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  title TEXT NOT NULL,
  action_type TEXT NOT NULL,
  time_estimate TEXT,
  needed_contribution TEXT,
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  contribution_type TEXT NOT NULL, -- 'donate' | 'lend' | 'make_available' | 'offer_skill' | 'offer_time' | 'offer_transportation'
  provider_id TEXT NOT NULL,
  address TEXT,
  lat REAL,
  lng REAL,
  availability TEXT NOT NULL, -- 'immediate' | 'scheduled' | 'on_call'
  quantity TEXT,
  condition TEXT,
  conditions_terms TEXT,
  valid_until TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS resource_assignments (
  id TEXT PRIMARY KEY,
  request_id TEXT,
  project_id TEXT,
  resource_id TEXT NOT NULL,
  assigned_by_id TEXT NOT NULL,
  borrower_id TEXT,
  purpose TEXT,
  start_date TEXT,
  due_date TEXT,
  return_date TEXT,
  return_condition TEXT,
  requested_quantity TEXT,
  terms_accepted INTEGER DEFAULT 1,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL, -- 'proposed' | 'accepted' | 'in_transit' | 'completed' | 'cancelled'
  notes TEXT,
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by_id) REFERENCES users(id),
  FOREIGN KEY (borrower_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS communities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  privacy TEXT NOT NULL,
  privacy_label TEXT,
  description TEXT,
  location TEXT,
  member_count INTEGER DEFAULT 1,
  avatar TEXT,
  banner TEXT,
  created_date TEXT,
  pinned_post_id TEXT,
  rules TEXT DEFAULT '[]',
  media_gallery TEXT DEFAULT '[]',
  files TEXT DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS community_members (
  id TEXT PRIMARY KEY,
  community_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'member', -- 'admin' | 'moderator' | 'member'
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  community_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  timestamp TEXT,
  is_pinned INTEGER DEFAULT 0,
  linked_entity_type TEXT,
  linked_entity_id TEXT,
  linked_entity_title TEXT,
  endorsed_count INTEGER DEFAULT 0,
  endorser_ids TEXT DEFAULT '[]',
  media_urls TEXT DEFAULT '[]',
  poll TEXT,
  restricted_user_ids TEXT DEFAULT '[]',
  is_quarantined INTEGER DEFAULT 0,
  quarantined_at DATETIME,
  quarantined_by_id TEXT,
  quarantine_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS post_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  text TEXT NOT NULL,
  time TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  timestamp TEXT,
  is_read INTEGER DEFAULT 0,
  target_view TEXT,
  target_sub_tab TEXT,
  target_entity_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user1_id TEXT NOT NULL,
  user2_id TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  last_message TEXT,
  last_time TEXT,
  unread_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user1_id) REFERENCES users(id),
  FOREIGN KEY (user2_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS direct_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  text TEXT NOT NULL,
  timestamp TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'post' | 'profile_picture' | 'comment'
  target_id TEXT NOT NULL,
  target_title TEXT,
  target_content TEXT,
  reported_user_id TEXT NOT NULL,
  reporter_id TEXT NOT NULL,
  community_id TEXT,
  scope TEXT DEFAULT 'community', -- 'community' | 'public_records'
  reason TEXT NOT NULL, -- 'inappropriate_image' | 'harassment' | 'spam' | 'misinformation' | 'hate_speech' | 'other'
  details TEXT,
  status TEXT DEFAULT 'pending', -- 'pending' | 'resolved' | 'dismissed'
  action_taken TEXT DEFAULT 'none', -- 'none' | 'removed_post' | 'reset_avatar' | 'kicked'
  resolved_by_id TEXT,
  resolved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reported_user_id) REFERENCES users(id),
  FOREIGN KEY (reporter_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS moderator_elections (
  id TEXT PRIMARY KEY,
  community_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  nominated_by_id TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- 'active' | 'passed' | 'rejected'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES users(id),
  FOREIGN KEY (nominated_by_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS moderator_votes (
  id TEXT PRIMARY KEY,
  election_id TEXT NOT NULL,
  community_id TEXT NOT NULL,
  voter_id TEXT NOT NULL,
  vote TEXT NOT NULL, -- 'for' | 'against'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(election_id, voter_id),
  FOREIGN KEY (election_id) REFERENCES moderator_elections(id) ON DELETE CASCADE,
  FOREIGN KEY (voter_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS readiness_checks (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL,
  community_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  target_date TEXT,
  target_headcount INTEGER DEFAULT 5,
  required_skills TEXT DEFAULT '[]',
  status TEXT DEFAULT 'active', -- 'active' | 'closed'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS readiness_responses (
  id TEXT PRIMARY KEY,
  readiness_check_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL, -- 'ready' | 'standby' | 'unavailable'
  note TEXT,
  available_hours TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(readiness_check_id, user_id),
  FOREIGN KEY (readiness_check_id) REFERENCES readiness_checks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS moderation_audit_logs (
  id TEXT PRIMARY KEY,
  moderator_id TEXT NOT NULL,
  moderator_role TEXT NOT NULL, -- 'community_moderator' | 'community_admin' | 'public_moderator' | 'platform_admin'
  community_id TEXT,
  action_type TEXT NOT NULL, -- 'quarantine_post' | 'restore_post' | 'remove_observation' | 'remove_request' | 'remove_resource' | 'reset_avatar' | 'kick_member' | 'restrict_user' | 'unrestrict_user' | 'dismiss_report'
  target_type TEXT NOT NULL, -- 'post' | 'observation' | 'request' | 'resource' | 'user' | 'comment'
  target_id TEXT NOT NULL,
  target_author_id TEXT,
  target_content_snapshot TEXT, -- JSON or text snapshot
  reason TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_obs_author ON observations(author_id);
CREATE INDEX IF NOT EXISTS idx_claims_obs ON claims(observation_id);
CREATE INDEX IF NOT EXISTS idx_disputes_claim ON disputes(claim_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_comm ON requests(community_id);
CREATE INDEX IF NOT EXISTS idx_requests_vis ON requests(visibility);
CREATE INDEX IF NOT EXISTS idx_resources_cat ON resources(category);
CREATE INDEX IF NOT EXISTS idx_plans_lifecycle ON plans(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_posts_community ON posts(community_id);
CREATE INDEX IF NOT EXISTS idx_notifs_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_comm ON reports(community_id);
CREATE INDEX IF NOT EXISTS idx_elections_comm ON moderator_elections(community_id);
CREATE INDEX IF NOT EXISTS idx_readiness_comm ON readiness_checks(community_id);
CREATE INDEX IF NOT EXISTS idx_res_assignments_res ON resource_assignments(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_mod ON moderation_audit_logs(moderator_id);
CREATE INDEX IF NOT EXISTS idx_audit_target ON moderation_audit_logs(target_id);
CREATE INDEX IF NOT EXISTS idx_audit_comm ON moderation_audit_logs(community_id);
CREATE INDEX IF NOT EXISTS idx_posts_quarantined ON posts(is_quarantined);
