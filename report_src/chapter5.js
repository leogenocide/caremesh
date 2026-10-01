export const chapter5 = `
  <!-- CHAPTER 5: SYSTEM DESIGN -->
  <div class="page-break" style="padding-top: 10mm;">
    <div class="chapter-title">5. SYSTEM DESIGN</div>

    <h2>5.1 Introduction</h2>
    <p>
      System Design represents the operational synthesis where requirements specifications, architectural paradigms, and relational models are translated into concrete implementation blueprints. In <strong>A Social Coordination Network</strong>, system design is governed by three paramount engineering imperatives:
    </p>
    <ol>
      <li><strong>Defensive Ingestion:</strong> Guaranteeing that all incoming user telemetry, field observations, and evidence attachments are sanitized, validated against strict geospatial and semantic bounds, and categorized deterministically.</li>
      <li><strong>Storage Optimization &amp; Durability:</strong> Leveraging SQLite Write-Ahead Logging (WAL) and B-Tree indexing to deliver high-concurrency read/write throughput on low-cost edge server hardware.</li>
      <li><strong>Cognitive Clarity:</strong> Structuring outputs, spatial map visualizations, and deliberative dashboards so that stressed disaster victims, mutual aid responders, and municipal liaisons can achieve immediate operational awareness.</li>
    </ol>

    <h2>5.2 Input Design &amp; Data Ingestion</h2>
    <p>
      Input design dictates how human actions in the browser are transformed into safe, structured relational records. Because user inputs during emergencies are frequently submitted under conditions of extreme distress, intermittent connectivity, or degraded touchscreen responsiveness, the input subsystem enforces strict validation rules and ergonomic form design:
    </p>

    <table>
      <thead>
        <tr>
          <th style="width: 20%;">Input Interface</th>
          <th style="width: 25%;">Target Domain Entity</th>
          <th style="width: 25%;">Validation &amp; Sanitization Rules</th>
          <th style="width: 30%;">Error Handling &amp; Fallback Behavior</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Incident Observation Form</strong></td>
          <td><code>observations</code>, <code>evidence</code></td>
          <td>Title (5-120 chars); Category enum; Lat (-90 to +90) &amp; Lng (-180 to +180) verified; Photo MIME types restricted to JPEG, PNG, WebP; Max 10MB payload.</td>
          <td>Inline field highlights; automatic GPS coordinate extraction via HTML5 Geolocation API with manual pin-drop fallback on Leaflet map.</td>
        </tr>
        <tr>
          <td><strong>Mutual Aid Request Form</strong></td>
          <td><code>requests</code></td>
          <td>Title (non-empty); Urgency tier ('critical', 'high', 'medium', 'low'); Headcount integer (&ge; 1); Required skills selected from predefined taxonomy.</td>
          <td>Automatic proximity lookup based on user's registered home coordinates; prompt warning if requesting dangerous operations without safety gear.</td>
        </tr>
        <tr>
          <td><strong>Roll-Call Readiness Submission</strong></td>
          <td><code>readiness_responses</code></td>
          <td>Status enum ('ready', 'standby', 'unavailable'); Available hours format validated; Gear inventory checklist sanitization.</td>
          <td>Optimistic local UI update; offline queuing in IndexedDB with automatic background synchronization when connection restores.</td>
        </tr>
        <tr>
          <td><strong>Deliberative Plan Critique Modal</strong></td>
          <td><code>plan_feedback</code></td>
          <td>Critique taxonomy enforcement ('feasibility', 'safety', 'budget', 'equity'); Required actionable amendment proposal (&ge; 20 chars).</td>
          <td>Rejects vague or purely disparaging commentary; mandates constructive alternative proposals before permitting submission.</td>
        </tr>
      </tbody>
    </table>

    <h2>5.3 Physical Design (WAL Mode &amp; Indexing Strategy)</h2>
    <p>
      The physical storage architecture is optimized around Better-SQLite3 compiled with direct C-level bindings. To transcend the traditional concurrency limits of embedded databases, the system applies specialized database pragmas upon server initialization:
    </p>
    <pre>
-- Production Initialization Pragmas
PRAGMA journal_mode = WAL;            -- Enables concurrent readers and serialized background writers
PRAGMA synchronous = NORMAL;          -- Maximizes I/O performance while preserving full ACID integrity
PRAGMA foreign_keys = ON;             -- Enforces referential integrity cascades across all tables
PRAGMA cache_size = -64000;           -- Allocates 64MB of dedicated RAM page cache
PRAGMA temp_store = MEMORY;           -- Executes temporary sorting and aggregations in RAM
PRAGMA busy_timeout = 5000;           -- Waits up to 5000ms on lock contention before throwing SQLITE_BUSY
    </pre>

    <p>
      To accelerate high-frequency queries—such as spatial bounding-box lookups, active roll-call tallies, and unread notification queries—the physical layer maintains optimized B-Tree indices:
    </p>
    <ul>
      <li><code>CREATE INDEX idx_obs_geo ON observations(lat, lng) WHERE is_quarantined = 0;</code> &mdash; Accelerates map viewport spatial filtering by an order of magnitude.</li>
      <li><code>CREATE INDEX idx_requests_status_urgency ON requests(status, urgency);</code> &mdash; Speeds up open emergency request triage.</li>
      <li><code>CREATE INDEX idx_readiness_check_status ON readiness_responses(readiness_check_id, status);</code> &mdash; Enables instant sub-millisecond calculation of aggregate group readiness percentages.</li>
      <li><code>CREATE INDEX idx_audit_moderator ON moderation_audit_logs(moderator_id, created_at);</code> &mdash; Guarantees rapid governance audit trail retrieval.</li>
    </ul>

    <h2>5.4 Logical Design (Complete Relational Schema Specifications)</h2>
    <p>
      The logical design organizes the system domain into an exhaustive, third-normal-form relational architecture persisted inside SQLite. Semi-structured dynamic attributes (such as volunteer skills, evidence provenance hashes, decision audit histories, and checklist arrays) are maintained within validated JSON text columns, avoiding brittle migration penalties while maintaining absolute relational referential integrity.
    </p>
    <p>
      Below is the complete specifications catalog for all <strong>45 relational tables</strong> comprising the entire system schema:
    </p>

    <!-- STRICT FIXED-LAYOUT TABLE PREVENTING MARGIN OVERFLOW -->
    <table style="table-layout: fixed !important; width: 100% !important; word-break: break-word !important; overflow-wrap: break-word !important; font-size: 8.2pt !important;">
      <colgroup>
        <col style="width: 14%;">
        <col style="width: 11%;">
        <col style="width: 18%;">
        <col style="width: 29%;">
        <col style="width: 28%;">
      </colgroup>
      <thead>
        <tr>
          <th>Table Name</th>
          <th>Primary Key</th>
          <th>Foreign Key Constraints</th>
          <th>Attributes &amp; SQL Types</th>
          <th>Domain Function &amp; Integrity Rules</th>
        </tr>
      </thead>
      <tbody>

        <tr>
          <td><code>users</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>None</code></td>
          <td><code>name TEXT NOT NULL, handle TEXT UNIQUE NOT NULL, email TEXT UNIQUE, password_hash TEXT, role TEXT, avatar TEXT, bio TEXT, address TEXT, neighborhood TEXT, lat REAL, lng REAL, skills JSON, badges JSON, stats JSON, is_public_moderator INT DEFAULT 0, status TEXT DEFAULT "active", restriction_reason TEXT, restricted_at DATETIME, restricted_by_id TEXT, google_id TEXT, auth_provider TEXT, is_email_verified INT, created_at DATETIME</code></td>
          <td>Core civic identity anchor. Protects salted passwords via Bcrypt, maintains geographic home coordinates, and tracks skills and civic badges.</td>
        </tr>
        <tr>
          <td><code>password_reset_codes</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>user_id -> users(id) ON DELETE CASCADE</code></td>
          <td><code>code_hash TEXT NOT NULL, expires_at DATETIME NOT NULL, used INTEGER DEFAULT 0, created_at DATETIME</code></td>
          <td>Cryptographic single-use nonce for zero-knowledge account credential recovery with 15-minute TTL.</td>
        </tr>
        <tr>
          <td><code>email_verification_codes</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>user_id -> users(id) ON DELETE CASCADE</code></td>
          <td><code>code TEXT NOT NULL, expires_at DATETIME NOT NULL, created_at DATETIME</code></td>
          <td>Temporal email ownership verification tokens ensuring legitimate citizen registration.</td>
        </tr>
        <tr>
          <td><code>communities</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>creator_id -> users(id)</code></td>
          <td><code>name TEXT NOT NULL, handle TEXT UNIQUE NOT NULL, category TEXT, privacy TEXT DEFAULT "open", description TEXT, location TEXT, member_count INT DEFAULT 1, rules JSON, media_gallery JSON, created_at DATETIME</code></td>
          <td>Defines localized neighborhood mutual aid hubs, spatial boundaries, privacy settings, and civic bylaws.</td>
        </tr>
        <tr>
          <td><code>community_members</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>community_id -> communities(id) ON DELETE CASCADE, user_id -> users(id) ON DELETE CASCADE</code></td>
          <td><code>role TEXT DEFAULT "member", joined_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(community_id, user_id)</code></td>
          <td>Enforces N:M relationship between residents and community hubs, governing local moderator permissions.</td>
        </tr>
        <tr>
          <td><code>posts</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>community_id -> communities(id) ON DELETE CASCADE, author_id -> users(id)</code></td>
          <td><code>content TEXT NOT NULL, category TEXT, timestamp TEXT, is_pinned INT DEFAULT 0, linked_entity_type TEXT, linked_entity_id TEXT, endorsed_count INT DEFAULT 0, media_urls JSON, poll JSON, is_quarantined INT DEFAULT 0, quarantined_at DATETIME, quarantined_by_id TEXT, quarantine_reason TEXT</code></td>
          <td>Neighborhood feed broadcast repository for urgent safety alerts, general discussions, media uploads, and community polls.</td>
        </tr>
        <tr>
          <td><code>post_comments</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>post_id -> posts(id) ON DELETE CASCADE, author_id -> users(id)</code></td>
          <td><code>text TEXT NOT NULL, time TEXT, is_quarantined INT DEFAULT 0, quarantined_at DATETIME, quarantined_by_id TEXT, quarantine_reason TEXT, created_at DATETIME</code></td>
          <td>Threaded commentary attached to neighborhood broadcasts, enabling granular localized discussions.</td>
        </tr>
        <tr>
          <td><code>evidence</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>author_id -> users(id)</code></td>
          <td><code>title TEXT NOT NULL, type TEXT ("photo"|"document"|"sensor"), author TEXT NOT NULL, timestamp TEXT, url TEXT, description TEXT, provenance_chain JSON, metadata JSON, parent_evidence_id TEXT, parent_observation_id TEXT, created_at DATETIME</code></td>
          <td>Immutable verification artifacts storing digital assets, SHA-256 content hashes, and cryptographic provenance chains.</td>
        </tr>
        <tr>
          <td><code>observations</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>author_id -> users(id) ON DELETE CASCADE</code></td>
          <td><code>title TEXT NOT NULL, category TEXT, description TEXT, address TEXT, neighborhood TEXT, lat REAL, lng REAL, timestamp TEXT, media_urls JSON, status TEXT, is_supporting INT DEFAULT 0, supporting_target_id TEXT, is_contradiction INT DEFAULT 0, contradiction_target_id TEXT, referenced_evidence_id TEXT, is_quarantined INT DEFAULT 0, quarantined_at DATETIME, quarantined_by_id TEXT, quarantine_reason TEXT, created_at DATETIME</code></td>
          <td>Field incident telemetry capturing hazards, outages, and structural damage with spatial coordinates and verification status.</td>
        </tr>
        <tr>
          <td><code>observation_relations</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>source_observation_id -> observations(id) ON DELETE CASCADE, target_observation_id -> observations(id) ON DELETE CASCADE</code></td>
          <td><code>relation_type TEXT NOT NULL ("supporting"|"contradictory"), created_at DATETIME DEFAULT CURRENT_TIMESTAMP</code></td>
          <td>Directed graph edges linking field reports, modeling corroborated evidence or formal spatial contradictions.</td>
        </tr>
        <tr>
          <td><code>observation_evidence</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>observation_id -> observations(id) ON DELETE CASCADE, evidence_id -> evidence(id) ON DELETE CASCADE</code></td>
          <td><code>created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(observation_id, evidence_id)</code></td>
          <td>Junction table establishing mandatory empirical grounding between field observations and proof artifacts.</td>
        </tr>
        <tr>
          <td><code>claims</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>observation_id -> observations(id) ON DELETE CASCADE</code></td>
          <td><code>assertion_text TEXT NOT NULL, status TEXT ("reported"|"under_assessment"|"supported"|"disputed"|"resolved"|"outdated"), created_at DATETIME DEFAULT CURRENT_TIMESTAMP</code></td>
          <td>Atomic propositional assertions extracted from field telemetry subject to community verification.</td>
        </tr>
        <tr>
          <td><code>claim_evidence</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>claim_id -> claims(id) ON DELETE CASCADE, evidence_id -> evidence(id) ON DELETE CASCADE</code></td>
          <td><code>support_type TEXT NOT NULL ("supports"|"refutes"), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(claim_id, evidence_id)</code></td>
          <td>Bipolar argumentation links connecting evidence items to claims with affirmative or refutational semantics.</td>
        </tr>
        <tr>
          <td><code>disputes</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>observation_id -> observations(id) ON DELETE CASCADE, author_id -> users(id) ON DELETE CASCADE</code></td>
          <td><code>reason TEXT NOT NULL, status TEXT ("active"|"resolved"|"dismissed"), counter_evidence JSON, resolution_notes TEXT, resolved_at DATETIME, resolved_by_id TEXT, created_at DATETIME</code></td>
          <td>Formal arbitration queue triggered when residents report factual contradictions or misleading field telemetry.</td>
        </tr>
        <tr>
          <td><code>dispute_responses</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>dispute_id -> disputes(id) ON DELETE CASCADE, author_id -> users(id) ON DELETE CASCADE</code></td>
          <td><code>content TEXT NOT NULL, evidence_urls JSON, created_at DATETIME DEFAULT CURRENT_TIMESTAMP</code></td>
          <td>Public testimony and rebuttal arguments submitted during formal contradiction arbitration.</td>
        </tr>
        <tr>
          <td><code>safety_reports</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>reporter_id -> users(id)</code></td>
          <td><code>hazard_type TEXT NOT NULL, severity TEXT ("critical"|"high"|"medium"|"low"), description TEXT, lat REAL, lng REAL, address TEXT, status TEXT DEFAULT "open", resolved_at DATETIME, resolved_by_id TEXT, created_at DATETIME</code></td>
          <td>Direct emergency hazard dispatches for fallen power lines, gas leaks, structural collapses, and bio-hazards.</td>
        </tr>
        <tr>
          <td><code>safety_report_evidence</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>safety_report_id -> safety_reports(id) ON DELETE CASCADE, evidence_id -> evidence(id) ON DELETE CASCADE</code></td>
          <td><code>created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(safety_report_id, evidence_id)</code></td>
          <td>Links immediate hazard dispatches with visual or sensor evidence artifacts.</td>
        </tr>
        <tr>
          <td><code>safety_report_observations</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>safety_report_id -> safety_reports(id) ON DELETE CASCADE, observation_id -> observations(id) ON DELETE CASCADE</code></td>
          <td><code>created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(safety_report_id, observation_id)</code></td>
          <td>Cross-links critical hazard alarms with broader contextual field observations.</td>
        </tr>
        <tr>
          <td><code>requests</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>requester_id -> users(id), community_id -> communities(id)</code></td>
          <td><code>title TEXT NOT NULL, category TEXT NOT NULL, urgency TEXT NOT NULL ("critical"|"high"|"medium"|"low"), people_needed INT DEFAULT 1, required_skills JSON, description TEXT, location TEXT, lat REAL, lng REAL, status TEXT DEFAULT "open", created_at DATETIME</code></td>
          <td>Core mutual aid requests capturing urgent community needs, skill requirements, and headcount targets.</td>
        </tr>
        <tr>
          <td><code>request_responses</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>request_id -> requests(id) ON DELETE CASCADE, user_id -> users(id) ON DELETE CASCADE</code></td>
          <td><code>role TEXT DEFAULT "volunteer", message TEXT, status TEXT DEFAULT "committed", created_at DATETIME, UNIQUE(request_id, user_id)</code></td>
          <td>Dynamic assembly junction pulling volunteers from different neighborhoods into an incident Request Group.</td>
        </tr>
        <tr>
          <td><code>readiness_checks</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>request_id -> requests(id) ON DELETE CASCADE, creator_id -> users(id), community_id -> communities(id)</code></td>
          <td><code>title TEXT NOT NULL, description TEXT, target_date TEXT, target_headcount INT DEFAULT 1, required_skills JSON, status TEXT DEFAULT "active", created_at DATETIME</code></td>
          <td>Operational roll-call checks triggered for a request group to assess live response readiness.</td>
        </tr>
        <tr>
          <td><code>readiness_responses</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>readiness_check_id -> readiness_checks(id) ON DELETE CASCADE, user_id -> users(id) ON DELETE CASCADE</code></td>
          <td><code>status TEXT NOT NULL ("ready"|"standby"|"unavailable"), available_hours TEXT, gear_held TEXT, notes TEXT, responded_at DATETIME, UNIQUE(readiness_check_id, user_id)</code></td>
          <td>Volunteer roll-call status submissions providing live headcount, standby status, and equipment held.</td>
        </tr>
        <tr>
          <td><code>resources</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>provider_id -> users(id)</code></td>
          <td><code>name TEXT NOT NULL, category TEXT NOT NULL ("food"|"medical"|"tools"|"shelter"|"transport"), quantity INT DEFAULT 1, unit TEXT, condition TEXT, location TEXT, lat REAL, lng REAL, availability_window TEXT, status TEXT DEFAULT "available", created_at DATETIME</code></td>
          <td>Catalog of tangible physical assets, medical caches, power generators, and tools offered for mutual aid.</td>
        </tr>
        <tr>
          <td><code>resource_assignments</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>request_id -> requests(id) ON DELETE CASCADE, resource_id -> resources(id) ON DELETE CASCADE, assigned_by_id -> users(id)</code></td>
          <td><code>allocated_quantity INT DEFAULT 1, status TEXT DEFAULT "assigned", assigned_at DATETIME, completed_at DATETIME</code></td>
          <td>Formal allocation binding a verified physical resource to an open mutual aid request.</td>
        </tr>
        <tr>
          <td><code>quick_actions</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>None</code></td>
          <td><code>title TEXT NOT NULL, category TEXT NOT NULL, icon TEXT, action_type TEXT, template_payload JSON, display_order INT DEFAULT 0</code></td>
          <td>Pre-configured rapid incident triage templates for common emergencies (e.g. sandbagging, wellness checks).</td>
        </tr>
        <tr>
          <td><code>plans</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>proposer_id -> users(id), community_id -> communities(id)</code></td>
          <td><code>title TEXT NOT NULL, description TEXT, stage TEXT DEFAULT "proposal" ("proposal"|"deliberation"|"voting"|"implementation"|"completed"), budget REAL DEFAULT 0, voting_deadline DATETIME, execution_start DATETIME, execution_end DATETIME, votes_affirmative INT DEFAULT 0, votes_negative INT DEFAULT 0, status TEXT DEFAULT "active", created_at DATETIME</code></td>
          <td>5-stage deliberative civic governance proposals structuring collective action, budgets, and milestone tracking.</td>
        </tr>
        <tr>
          <td><code>plan_participants</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>plan_id -> plans(id) ON DELETE CASCADE, user_id -> users(id) ON DELETE CASCADE</code></td>
          <td><code>role TEXT DEFAULT "stakeholder", vote TEXT ("yes"|"no"|"abstain"), voted_at DATETIME, UNIQUE(plan_id, user_id)</code></td>
          <td>Tracks civic participation, voting ballots, and stakeholder commitments for deliberative plans.</td>
        </tr>
        <tr>
          <td><code>plan_milestones</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>plan_id -> plans(id) ON DELETE CASCADE</code></td>
          <td><code>title TEXT NOT NULL, target_date TEXT, status TEXT DEFAULT "pending", completed_at DATETIME, order_idx INT DEFAULT 0</code></td>
          <td>Discrete measurable execution milestones attached to approved community action plans.</td>
        </tr>
        <tr>
          <td><code>plan_feedback</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>plan_id -> plans(id) ON DELETE CASCADE, author_id -> users(id)</code></td>
          <td><code>critique_type TEXT NOT NULL ("feasibility"|"safety"|"budget"|"equity"|"general"), content TEXT NOT NULL, suggested_amendment TEXT, resolution_status TEXT DEFAULT "unresolved", resolution_notes TEXT, resolved_at DATETIME, created_at DATETIME</code></td>
          <td>Enforces critique taxonomy on civic plans; unresolved critiques block stage advancement to voting.</td>
        </tr>
        <tr>
          <td><code>plan_revisions</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>plan_id -> plans(id) ON DELETE CASCADE, editor_id -> users(id)</code></td>
          <td><code>revision_number INT NOT NULL, summary_of_changes TEXT, diff_payload JSON, created_at DATETIME DEFAULT CURRENT_TIMESTAMP</code></td>
          <td>Version-controlled audit ledger of plan amendments prompted by community critique resolution.</td>
        </tr>
        <tr>
          <td><code>plan_updates</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>plan_id -> plans(id) ON DELETE CASCADE, author_id -> users(id)</code></td>
          <td><code>headline TEXT NOT NULL, body TEXT NOT NULL, media_urls JSON, posted_at DATETIME DEFAULT CURRENT_TIMESTAMP</code></td>
          <td>Progress dispatches and execution updates published by plan coordinators during implementation.</td>
        </tr>
        <tr>
          <td><code>decisions</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>plan_id -> plans(id) ON DELETE CASCADE, recorded_by_id -> users(id)</code></td>
          <td><code>decision_text TEXT NOT NULL, rationalization TEXT, dissenting_opinions TEXT, ratified_at DATETIME DEFAULT CURRENT_TIMESTAMP</code></td>
          <td>Formal institutional record of ratified collective decisions, documenting rationale and minority dissents.</td>
        </tr>
        <tr>
          <td><code>outcomes</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>plan_id -> plans(id) ON DELETE CASCADE</code></td>
          <td><code>goal_summary TEXT, actual_results JSON, outcome_status TEXT ("achieved"|"partially_achieved"|"failed"), unexpected_consequences TEXT, evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP</code></td>
          <td>Empirical post-action evaluation measuring real-world outcomes against initial plan specifications.</td>
        </tr>
        <tr>
          <td><code>lessons</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>plan_id -> plans(id) ON DELETE CASCADE</code></td>
          <td><code>category TEXT NOT NULL, observation_text TEXT NOT NULL, actionable_learning TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP</code></td>
          <td>Codified institutional learnings extracted from completed plans to prevent recurrent failure modes.</td>
        </tr>
        <tr>
          <td><code>future_guidance</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>plan_id -> plans(id) ON DELETE CASCADE</code></td>
          <td><code>scenario_context TEXT NOT NULL, recommended_action TEXT NOT NULL, cautionary_notes TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP</code></td>
          <td>Predictive operational guidance stored in living memory for future crisis coordinators.</td>
        </tr>
        <tr>
          <td><code>projects</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>creator_id -> users(id), community_id -> communities(id)</code></td>
          <td><code>title TEXT NOT NULL, summary TEXT, status TEXT DEFAULT "active", budget_allocated REAL, start_date TEXT, target_completion TEXT, created_at DATETIME</code></td>
          <td>Long-term community infrastructure resilience projects (e.g. microgrid setup, flood embankment repair).</td>
        </tr>
        <tr>
          <td><code>project_participants</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>project_id -> projects(id) ON DELETE CASCADE, user_id -> users(id) ON DELETE CASCADE</code></td>
          <td><code>role TEXT DEFAULT "contributor", hours_logged REAL DEFAULT 0, UNIQUE(project_id, user_id)</code></td>
          <td>Tracks volunteer contributions and time commitments dedicated to long-term resilience projects.</td>
        </tr>
        <tr>
          <td><code>project_messages</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>project_id -> projects(id) ON DELETE CASCADE, author_id -> users(id)</code></td>
          <td><code>message TEXT NOT NULL, attachments JSON, sent_at DATETIME DEFAULT CURRENT_TIMESTAMP</code></td>
          <td>Collaborative task communications channel between project contributors.</td>
        </tr>
        <tr>
          <td><code>conversations</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>None</code></td>
          <td><code>type TEXT DEFAULT "direct" ("direct"|"incident_team"), created_at DATETIME DEFAULT CURRENT_TIMESTAMP</code></td>
          <td>Private communication channels between coordinators or incident response team members.</td>
        </tr>
        <tr>
          <td><code>direct_messages</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>conversation_id -> conversations(id) ON DELETE CASCADE, sender_id -> users(id)</code></td>
          <td><code>recipient_id TEXT, content TEXT NOT NULL, is_read INT DEFAULT 0, sent_at DATETIME DEFAULT CURRENT_TIMESTAMP</code></td>
          <td>Encrypted or protected point-to-point text dispatches for tactical coordination.</td>
        </tr>
        <tr>
          <td><code>notifications</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>user_id -> users(id) ON DELETE CASCADE</code></td>
          <td><code>title TEXT NOT NULL, message TEXT NOT NULL, type TEXT, action_url TEXT, is_read INT DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP</code></td>
          <td>In-app notification queue alerting users to roll-calls, match alerts, and community replies.</td>
        </tr>
        <tr>
          <td><code>reports</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>reporter_id -> users(id)</code></td>
          <td><code>target_type TEXT NOT NULL, target_id TEXT NOT NULL, reason TEXT NOT NULL, status TEXT DEFAULT "pending", resolved_by_id TEXT, created_at DATETIME</code></td>
          <td>User-flagged content reports for abusive, spam, or malicious posts requiring moderator triage.</td>
        </tr>
        <tr>
          <td><code>moderator_elections</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>community_id -> communities(id) ON DELETE CASCADE</code></td>
          <td><code>title TEXT NOT NULL, nomination_deadline DATETIME, voting_deadline DATETIME, status TEXT DEFAULT "active"</code></td>
          <td>Democratic civic mechanisms enabling communities to elect and cycle neighborhood moderators.</td>
        </tr>
        <tr>
          <td><code>moderator_votes</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>election_id -> moderator_elections(id) ON DELETE CASCADE, voter_id -> users(id), candidate_id -> users(id)</code></td>
          <td><code>cast_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(election_id, voter_id)</code></td>
          <td>Ballot ledger recording anonymous votes cast in community moderator elections.</td>
        </tr>
        <tr>
          <td><code>moderation_audit_logs</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>moderator_id -> users(id)</code></td>
          <td><code>moderator_role TEXT, action_type TEXT NOT NULL ("quarantine"|"restore"|"resolve_dispute"|"ban"), target_type TEXT, target_id TEXT, reason TEXT, snapshot JSON, created_at DATETIME DEFAULT CURRENT_TIMESTAMP</code></td>
          <td>Immutable tamper-evident ledger tracking every moderation and verification action for democratic accountability.</td>
        </tr>
      </tbody>
    </table>

    <h2>5.5 Output Design &amp; Reporting</h2>
    <p>
      Output design governs the synthesis of raw database records into clear, actionable information products tailored for distinct operational personas:
    </p>
    <ul>
      <li><strong>Live Emergency Dispatch Map Canvas:</strong> Synthesizes active observations, urgent mutual aid requests, and verified safety hazards into an interactive Leaflet geospatial interface. Employs color-coded danger markers (Red: Critical Hazard, Orange: Aid Request, Blue: Resource Cache) and dynamic cluster grouping to prevent visual clutter.</li>
      <li><strong>Request-Group Readiness Roll-Call Gauge:</strong> Displays real-time operational readiness metrics for incident response teams. Computes confirmed headcount versus required quota, percentage of required skills covered, and gear readiness, visualized via an accessible radial SVG progress bar.</li>
      <li><strong>Deliberative Plan Stage Progress Digest:</strong> Visualizes the 5-stage civic lifecycle (Proposal &rarr; Deliberation &rarr; Voting &rarr; Implementation &rarr; Completed &rarr; Living Memory), highlighting unresolved critiques, budget consumption, and milestone completion bars.</li>
      <li><strong>Printable Emergency Manifests:</strong> Generates lightweight, printer-friendly CSS formats for offline volunteer muster manifests, dispatch checklists, and resource distribution logs for distribution in zero-connectivity field zones.</li>
    </ul>

    <h2>5.6 User Interface (UI) Architecture &amp; Wireframes</h2>
    <p>
      The user interface is engineered adhering strictly to human factors design, cognitive ergonomics, and WCAG 2.1 AA accessibility standards. The design system utilizes an intentional color hierarchy: Deep Navy (<code>#0f172a</code>) for structural chrome, Sapphire Blue (<code>#2563eb</code>) for primary actions, Emerald Green (<code>#059669</code>) for verified evidence and readiness, Amber Orange (<code>#d97706</code>) for open mutual aid, Crimson Red (<code>#dc2626</code>) for critical hazards and contradictions, and Purple (<code>#7c3aed</code>) for deliberative governance.
    </p>

    <!-- UI Wireframe 1: Dispatch Map -->
    <div class="ui-mockup-card">
      <div class="ui-mockup-header">
        <span><strong>VIEW WIREFRAME 1: LIVE INCIDENT DISPATCH MAP</strong></span>
        <span style="font-size: 8.5pt; color: #64748b;">/map &bull; Leaflet + React 19</span>
      </div>
      <div style="padding: 12px; font-family: 'Segoe UI', sans-serif; font-size: 9pt;">
        <div style="display: flex; gap: 10px; margin-bottom: 8px;">
          <span style="background: #2563eb; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 8pt;">All Layers Active</span>
          <span style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 8pt;">Filter: Critical Hazards</span>
          <span style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 8pt;">Filter: Open Requests</span>
          <span style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 8pt;">Filter: Resources</span>
        </div>
        <div style="background: #e2e8f0; height: 120px; border-radius: 4px; display: flex; align-items: center; justify-content: center; border: 1px dashed #94a3b8; color: #475569;">
          [ Interactive Leaflet Map Canvas &ndash; Geotagged Pins &bull; Clustered Incidents &bull; Fuzzed Coordinates ]
        </div>
      </div>
    </div>

    <!-- UI Wireframe 2: Request Group Readiness Card -->
    <div class="ui-mockup-card">
      <div class="ui-mockup-header">
        <span><strong>VIEW WIREFRAME 2: REQUEST GROUP READINESS ROLL-CALL CARD</strong></span>
        <span style="font-size: 8.5pt; color: #059669; font-weight: bold;">Group Readiness: 83%</span>
      </div>
      <div style="padding: 12px; font-family: 'Segoe UI', sans-serif; font-size: 9pt;">
        <div style="font-weight: bold; font-size: 10.5pt; color: #0f172a; margin-bottom: 4px;">Incident Team: Sandbagging &amp; Barrier Construction &bull; Request #REQ-104</div>
        <div style="color: #475569; margin-bottom: 8px;">Target Muster: Oct 24, 08:00 AM &bull; Location: Riverfront Sector 4 &bull; Quota: 12 Responders</div>
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Confirmed Headcount: <strong>10 / 12</strong> (2 Standby Needed)</span>
            <span style="color: #059669; font-weight: 600;">83% Ready</span>
          </div>
          <div style="background: #e2e8f0; border-radius: 3px; height: 8px; width: 100%;">
            <div style="background: #059669; width: 83%; height: 8px; border-radius: 3px;"></div>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button style="background: #059669; color: #fff; border: none; padding: 4px 10px; border-radius: 4px; font-size: 8.5pt; cursor: pointer;">I am Ready</button>
          <button style="background: #f59e0b; color: #fff; border: none; padding: 4px 10px; border-radius: 4px; font-size: 8.5pt; cursor: pointer;">Standby / Delay</button>
          <button style="background: #64748b; color: #fff; border: none; padding: 4px 10px; border-radius: 4px; font-size: 8.5pt; cursor: pointer;">Unavailable</button>
        </div>
      </div>
    </div>
  </div>
`;
