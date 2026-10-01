export const chapter4 = `
  <!-- CHAPTER 4: TECHNICAL DESIGN -->
  <div class="page-break" style="padding-top: 10mm;">
    <div class="chapter-title">4. TECHNICAL DESIGN</div>

    <h2>4.1 Introduction</h2>
    <p>
      Technical Design translates the functional and operational requirements established in the SRS into a concrete, structural software blueprint. This encompasses the relational data models, entity relationships, integrity constraints, and multi-tier data flow pipelines that govern <strong>A Social Coordination Network</strong>.
    </p>
    <p>
      This chapter details the system's structural design through two principal modeling formalisms: the <strong>Entity-Relationship Diagram (ERD)</strong>, illustrating the complete normalized database schema with full coverage of the community hubs, neighborhood social feeds, request-group readiness roll-calls, observations, and deliberative governance, and multi-tier <strong>Data Flow Diagrams (DFDs)</strong>, providing an exhaustive decomposition of the information pipelines spanning external human actors, sub-processes, and SQLite persistent datastores.
    </p>

    <h2>4.2 Complete Entity Relationship Diagram (ERD)</h2>
    <p>
      The persistence tier of the system is modeled as a normalized relational schema comprising interconnected entities across four major operational modules:
    </p>
    <ul>
      <li><strong>Module A: Community Collectives &amp; Neighborhood Social Feed:</strong> Encompasses <code>communities</code>, <code>community_members</code>, <code>posts</code> (Neighborhood Feed), and <code>post_comments</code>, providing sovereign local communication channels, pinned emergency dispatches, and grassroots discussion.</li>
      <li><strong>Module B: Epistemic Observation &amp; Evidence Provenance Graph:</strong> Encompasses <code>observations</code>, <code>evidence</code>, <code>observation_evidence</code>, <code>claims</code>, and <code>disputes</code>, anchoring ground-truth incident telemetry to tangible verification artifacts and contradiction audits.</li>
      <li><strong>Module C: Mutual Aid, Request Groups &amp; Readiness Roll-Call:</strong> Encompasses <code>requests</code>, <code>request_responses</code>, <code>readiness_checks</code>, <code>readiness_responses</code>, <code>resources</code>, and <code>resource_assignments</code>, dynamically assembling cross-neighborhood volunteer teams and tracking live operational readiness.</li>
      <li><strong>Module D: Deliberative Collective Planning &amp; Living Memory:</strong> Encompasses <code>plans</code>, <code>plan_feedback</code>, <code>decisions</code>, and <code>outcomes</code>, structuring multi-stage civic initiatives with categorized critique incorporation and historical lesson extraction.</li>
    </ul>

    <!-- COMPREHENSIVE VECTOR ER DIAGRAM -->
    <div class="diagram-container">
      <svg viewBox="0 0 1180 960" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="erdHeadSocial" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#0284c7"/>
            <stop offset="100%" stop-color="#0ea5e9"/>
          </linearGradient>
          <linearGradient id="erdHeadUser" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#1e3a8a"/>
            <stop offset="100%" stop-color="#2563eb"/>
          </linearGradient>
          <linearGradient id="erdHeadEpistemic" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#065f46"/>
            <stop offset="100%" stop-color="#059669"/>
          </linearGradient>
          <linearGradient id="erdHeadAid" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#701a75"/>
            <stop offset="100%" stop-color="#c026d3"/>
          </linearGradient>
          <linearGradient id="erdHeadGov" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#9a3412"/>
            <stop offset="100%" stop-color="#ea580c"/>
          </linearGradient>
          <filter id="erdShadow" x="-3%" y="-3%" width="106%" height="106%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-opacity="0.12"/>
          </filter>
        </defs>

        <!-- Canvas Background -->
        <rect width="1180" height="960" fill="#f8fafc" rx="8"/>

        <!-- ================= ROW 1: SOCIAL & NEIGHBORHOOD FEED ================= -->
        <!-- ENTITY: COMMUNITIES -->
        <g transform="translate(30, 30)" filter="url(#erdShadow)">
          <rect width="210" height="210" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
          <path d="M 0 6 A 6 6 0 0 1 6 0 L 204 0 A 6 6 0 0 1 210 6 L 210 28 L 0 28 Z" fill="url(#erdHeadSocial)"/>
          <text x="105" y="19" fill="#ffffff" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="11" text-anchor="middle">COMMUNITIES (NEIGHBORHOODS)</text>
          <text x="10" y="48" font-family="Consolas, monospace" font-size="9" fill="#0f172a"><tspan fill="#d97706" font-weight="bold">PK </tspan>id : TEXT</text>
          <text x="10" y="66" font-family="Consolas, monospace" font-size="9" fill="#334155">name : TEXT</text>
          <text x="10" y="84" font-family="Consolas, monospace" font-size="9" fill="#334155">handle : TEXT (UQ)</text>
          <text x="10" y="102" font-family="Consolas, monospace" font-size="9" fill="#334155">category : TEXT</text>
          <text x="10" y="120" font-family="Consolas, monospace" font-size="9" fill="#334155">privacy : TEXT</text>
          <text x="10" y="138" font-family="Consolas, monospace" font-size="9" fill="#334155">location : TEXT</text>
          <text x="10" y="156" font-family="Consolas, monospace" font-size="9" fill="#334155">member_count : INT</text>
          <text x="10" y="174" font-family="Consolas, monospace" font-size="9" fill="#334155">rules : JSON</text>
          <text x="10" y="192" font-family="Consolas, monospace" font-size="9" fill="#2563eb"><tspan font-weight="bold">FK </tspan>creator_id : TEXT</text>
        </g>

        <!-- JUNCTION: COMMUNITY_MEMBERS -->
        <g transform="translate(280, 45)" filter="url(#erdShadow)">
          <rect width="180" height="135" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
          <path d="M 0 6 A 6 6 0 0 1 6 0 L 174 0 A 6 6 0 0 1 180 6 L 180 26 L 0 26 Z" fill="#64748b"/>
          <text x="90" y="18" fill="#ffffff" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="10.5" text-anchor="middle">COMMUNITY_MEMBERS (N:M)</text>
          <text x="10" y="46" font-family="Consolas, monospace" font-size="9" fill="#0f172a"><tspan fill="#d97706" font-weight="bold">PK </tspan>id : TEXT</text>
          <text x="10" y="66" font-family="Consolas, monospace" font-size="9" fill="#2563eb"><tspan font-weight="bold">FK </tspan>community_id : TEXT</text>
          <text x="10" y="86" font-family="Consolas, monospace" font-size="9" fill="#2563eb"><tspan font-weight="bold">FK </tspan>user_id : TEXT</text>
          <text x="10" y="106" font-family="Consolas, monospace" font-size="9" fill="#334155">role : TEXT (admin/mod/member)</text>
          <text x="10" y="124" font-family="Consolas, monospace" font-size="9" fill="#334155">joined_at : DATETIME</text>
        </g>

        <!-- ENTITY: POSTS (NEIGHBORHOOD FEED) -->
        <g transform="translate(500, 30)" filter="url(#erdShadow)">
          <rect width="220" height="230" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
          <path d="M 0 6 A 6 6 0 0 1 6 0 L 214 0 A 6 6 0 0 1 220 6 L 220 28 L 0 28 Z" fill="url(#erdHeadSocial)"/>
          <text x="110" y="19" fill="#ffffff" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="11" text-anchor="middle">POSTS (NEIGHBORHOOD FEED)</text>
          <text x="10" y="48" font-family="Consolas, monospace" font-size="9" fill="#0f172a"><tspan fill="#d97706" font-weight="bold">PK </tspan>id : TEXT</text>
          <text x="10" y="66" font-family="Consolas, monospace" font-size="9" fill="#2563eb"><tspan font-weight="bold">FK </tspan>community_id : TEXT</text>
          <text x="10" y="84" font-family="Consolas, monospace" font-size="9" fill="#2563eb"><tspan font-weight="bold">FK </tspan>author_id : TEXT</text>
          <text x="10" y="102" font-family="Consolas, monospace" font-size="9" fill="#334155">content : TEXT</text>
          <text x="10" y="120" font-family="Consolas, monospace" font-size="9" fill="#334155">category : TEXT (urgent/info)</text>
          <text x="10" y="138" font-family="Consolas, monospace" font-size="9" fill="#334155">is_pinned : INTEGER</text>
          <text x="10" y="156" font-family="Consolas, monospace" font-size="9" fill="#334155">media_urls : JSON</text>
          <text x="10" y="174" font-family="Consolas, monospace" font-size="9" fill="#334155">poll : JSON</text>
          <text x="10" y="192" font-family="Consolas, monospace" font-size="9" fill="#334155">endorsed_count : INTEGER</text>
          <text x="10" y="210" font-family="Consolas, monospace" font-size="9" fill="#334155">is_quarantined : INTEGER</text>
        </g>

        <!-- ENTITY: POST_COMMENTS -->
        <g transform="translate(760, 45)" filter="url(#erdShadow)">
          <rect width="180" height="150" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
          <path d="M 0 6 A 6 6 0 0 1 6 0 L 174 0 A 6 6 0 0 1 180 6 L 180 26 L 0 26 Z" fill="url(#erdHeadSocial)"/>
          <text x="90" y="18" fill="#ffffff" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="10.5" text-anchor="middle">POST_COMMENTS</text>
          <text x="10" y="48" font-family="Consolas, monospace" font-size="9" fill="#0f172a"><tspan fill="#d97706" font-weight="bold">PK </tspan>id : TEXT</text>
          <text x="10" y="68" font-family="Consolas, monospace" font-size="9" fill="#2563eb"><tspan font-weight="bold">FK </tspan>post_id : TEXT</text>
          <text x="10" y="88" font-family="Consolas, monospace" font-size="9" fill="#2563eb"><tspan font-weight="bold">FK </tspan>author_id : TEXT</text>
          <text x="10" y="108" font-family="Consolas, monospace" font-size="9" fill="#334155">text : TEXT</text>
          <text x="10" y="126" font-family="Consolas, monospace" font-size="9" fill="#334155">is_quarantined : INT</text>
          <text x="10" y="142" font-family="Consolas, monospace" font-size="9" fill="#334155">created_at : DATETIME</text>
        </g>

        <!-- ================= ROW 2: CORE IDENTITY & EPISTEMIC GRAPH ================= -->
        <!-- ENTITY: USERS (CENTRAL ANCHOR) -->
        <g transform="translate(280, 240)" filter="url(#erdShadow)">
          <rect width="190" height="240" rx="6" fill="#ffffff" stroke="#2563eb" stroke-width="2"/>
          <path d="M 0 6 A 6 6 0 0 1 6 0 L 184 0 A 6 6 0 0 1 190 6 L 190 28 L 0 28 Z" fill="url(#erdHeadUser)"/>
          <text x="95" y="19" fill="#ffffff" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="12" text-anchor="middle">USERS (IDENTITY)</text>
          <text x="10" y="48" font-family="Consolas, monospace" font-size="9" fill="#0f172a"><tspan fill="#d97706" font-weight="bold">PK </tspan>id : TEXT</text>
          <text x="10" y="68" font-family="Consolas, monospace" font-size="9" fill="#334155">name : TEXT</text>
          <text x="10" y="88" font-family="Consolas, monospace" font-size="9" fill="#334155">handle : TEXT (UQ)</text>
          <text x="10" y="108" font-family="Consolas, monospace" font-size="9" fill="#334155">email : TEXT (UQ)</text>
          <text x="10" y="128" font-family="Consolas, monospace" font-size="9" fill="#334155">password_hash : TEXT</text>
          <text x="10" y="148" font-family="Consolas, monospace" font-size="9" fill="#334155">role : TEXT (Admin/Mod/User)</text>
          <text x="10" y="168" font-family="Consolas, monospace" font-size="9" fill="#334155">lat, lng : REAL</text>
          <text x="10" y="188" font-family="Consolas, monospace" font-size="9" fill="#334155">skills : JSON</text>
          <text x="10" y="208" font-family="Consolas, monospace" font-size="9" fill="#334155">badges, stats : JSON</text>
          <text x="10" y="228" font-family="Consolas, monospace" font-size="9" fill="#334155">is_public_moderator : INT</text>
        </g>

        <!-- ENTITY: OBSERVATIONS -->
        <g transform="translate(520, 290)" filter="url(#erdShadow)">
          <rect width="210" height="230" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
          <path d="M 0 6 A 6 6 0 0 1 6 0 L 204 0 A 6 6 0 0 1 210 6 L 210 28 L 0 28 Z" fill="url(#erdHeadEpistemic)"/>
          <text x="105" y="19" fill="#ffffff" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="11.5" text-anchor="middle">OBSERVATIONS</text>
          <text x="10" y="48" font-family="Consolas, monospace" font-size="9" fill="#0f172a"><tspan fill="#d97706" font-weight="bold">PK </tspan>id : TEXT</text>
          <text x="10" y="68" font-family="Consolas, monospace" font-size="9" fill="#2563eb"><tspan font-weight="bold">FK </tspan>author_id : TEXT</text>
          <text x="10" y="88" font-family="Consolas, monospace" font-size="9" fill="#334155">title : TEXT</text>
          <text x="10" y="108" font-family="Consolas, monospace" font-size="9" fill="#334155">category : TEXT</text>
          <text x="10" y="128" font-family="Consolas, monospace" font-size="9" fill="#334155">description : TEXT</text>
          <text x="10" y="148" font-family="Consolas, monospace" font-size="9" fill="#334155">lat, lng : REAL</text>
          <text x="10" y="168" font-family="Consolas, monospace" font-size="9" fill="#334155">status : TEXT</text>
          <text x="10" y="188" font-family="Consolas, monospace" font-size="9" fill="#334155">is_contradiction : INT</text>
          <text x="10" y="208" font-family="Consolas, monospace" font-size="9" fill="#334155">is_quarantined : INT</text>
        </g>

        <!-- ENTITY: EVIDENCE -->
        <g transform="translate(780, 290)" filter="url(#erdShadow)">
          <rect width="190" height="210" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
          <path d="M 0 6 A 6 6 0 0 1 6 0 L 184 0 A 6 6 0 0 1 190 6 L 190 28 L 0 28 Z" fill="url(#erdHeadEpistemic)"/>
          <text x="95" y="19" fill="#ffffff" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="11.5" text-anchor="middle">EVIDENCE</text>
          <text x="10" y="48" font-family="Consolas, monospace" font-size="9" fill="#0f172a"><tspan fill="#d97706" font-weight="bold">PK </tspan>id : TEXT</text>
          <text x="10" y="68" font-family="Consolas, monospace" font-size="9" fill="#334155">title : TEXT</text>
          <text x="10" y="88" font-family="Consolas, monospace" font-size="9" fill="#334155">type : TEXT (photo/doc)</text>
          <text x="10" y="108" font-family="Consolas, monospace" font-size="9" fill="#334155">author : TEXT</text>
          <text x="10" y="128" font-family="Consolas, monospace" font-size="9" fill="#2563eb"><tspan font-weight="bold">FK </tspan>author_id : TEXT</text>
          <text x="10" y="148" font-family="Consolas, monospace" font-size="9" fill="#334155">url : TEXT</text>
          <text x="10" y="168" font-family="Consolas, monospace" font-size="9" fill="#334155">provenance_chain : JSON</text>
          <text x="10" y="188" font-family="Consolas, monospace" font-size="9" fill="#334155">metadata : JSON</text>
        </g>

        <!-- JUNCTION: OBSERVATION_EVIDENCE -->
        <g transform="translate(680, 540)" filter="url(#erdShadow)">
          <rect width="180" height="100" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
          <path d="M 0 6 A 6 6 0 0 1 6 0 L 174 0 A 6 6 0 0 1 180 6 L 180 24 L 0 24 Z" fill="#475569"/>
          <text x="90" y="16" fill="#ffffff" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="9.5" text-anchor="middle">OBS_EVIDENCE (N:M)</text>
          <text x="10" y="42" font-family="Consolas, monospace" font-size="8.5" fill="#0f172a"><tspan fill="#d97706" font-weight="bold">PK </tspan>id : TEXT</text>
          <text x="10" y="62" font-family="Consolas, monospace" font-size="8.5" fill="#2563eb"><tspan font-weight="bold">FK </tspan>observation_id : TEXT</text>
          <text x="10" y="82" font-family="Consolas, monospace" font-size="8.5" fill="#2563eb"><tspan font-weight="bold">FK </tspan>evidence_id : TEXT</text>
        </g>

        <!-- ENTITY: CLAIMS & DISPUTES -->
        <g transform="translate(890, 530)" filter="url(#erdShadow)">
          <rect width="180" height="160" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
          <path d="M 0 6 A 6 6 0 0 1 6 0 L 174 0 A 6 6 0 0 1 180 6 L 180 24 L 0 24 Z" fill="#991b1b"/>
          <text x="90" y="16" fill="#ffffff" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="10" text-anchor="middle">CLAIMS &amp; DISPUTES</text>
          <text x="10" y="42" font-family="Consolas, monospace" font-size="8.5" fill="#0f172a"><tspan fill="#d97706" font-weight="bold">PK </tspan>id : TEXT</text>
          <text x="10" y="62" font-family="Consolas, monospace" font-size="8.5" fill="#2563eb"><tspan font-weight="bold">FK </tspan>observation_id : TEXT</text>
          <text x="10" y="82" font-family="Consolas, monospace" font-size="8.5" fill="#2563eb"><tspan font-weight="bold">FK </tspan>author_id : TEXT</text>
          <text x="10" y="102" font-family="Consolas, monospace" font-size="8.5" fill="#334155">reason : TEXT</text>
          <text x="10" y="122" font-family="Consolas, monospace" font-size="8.5" fill="#334155">status : TEXT (active/resolved)</text>
          <text x="10" y="142" font-family="Consolas, monospace" font-size="8.5" fill="#334155">counter_evidence : JSON</text>
        </g>

        <!-- ================= ROW 3: MUTUAL AID & REQUEST GROUPS ================= -->
        <!-- ENTITY: REQUESTS -->
        <g transform="translate(30, 270)" filter="url(#erdShadow)">
          <rect width="210" height="230" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
          <path d="M 0 6 A 6 6 0 0 1 6 0 L 204 0 A 6 6 0 0 1 210 6 L 210 28 L 0 28 Z" fill="url(#erdHeadAid)"/>
          <text x="105" y="19" fill="#ffffff" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="11.5" text-anchor="middle">REQUESTS (MUTUAL AID)</text>
          <text x="10" y="48" font-family="Consolas, monospace" font-size="9" fill="#0f172a"><tspan fill="#d97706" font-weight="bold">PK </tspan>id : TEXT</text>
          <text x="10" y="68" font-family="Consolas, monospace" font-size="9" fill="#2563eb"><tspan font-weight="bold">FK </tspan>requester_id : TEXT</text>
          <text x="10" y="88" font-family="Consolas, monospace" font-size="9" fill="#2563eb"><tspan font-weight="bold">FK </tspan>community_id : TEXT</text>
          <text x="10" y="108" font-family="Consolas, monospace" font-size="9" fill="#334155">title : TEXT</text>
          <text x="10" y="128" font-family="Consolas, monospace" font-size="9" fill="#334155">urgency : TEXT (critical/high)</text>
          <text x="10" y="148" font-family="Consolas, monospace" font-size="9" fill="#334155">people_needed : INTEGER</text>
          <text x="10" y="168" font-family="Consolas, monospace" font-size="9" fill="#334155">required_skills : JSON</text>
          <text x="10" y="188" font-family="Consolas, monospace" font-size="9" fill="#334155">status : TEXT (open/fulfilled)</text>
          <text x="10" y="208" font-family="Consolas, monospace" font-size="9" fill="#334155">lat, lng : REAL</text>
        </g>

        <!-- ENTITY: REQUEST_RESPONSES (VOLUNTEER COMMITMENTS) -->
        <g transform="translate(30, 530)" filter="url(#erdShadow)">
          <rect width="180" height="130" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
          <path d="M 0 6 A 6 6 0 0 1 6 0 L 174 0 A 6 6 0 0 1 180 6 L 180 26 L 0 26 Z" fill="#64748b"/>
          <text x="90" y="18" fill="#ffffff" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="10.5" text-anchor="middle">REQUEST_RESPONSES (N:M)</text>
          <text x="10" y="46" font-family="Consolas, monospace" font-size="9" fill="#0f172a"><tspan fill="#d97706" font-weight="bold">PK </tspan>id : TEXT</text>
          <text x="10" y="66" font-family="Consolas, monospace" font-size="9" fill="#2563eb"><tspan font-weight="bold">FK </tspan>request_id : TEXT</text>
          <text x="10" y="86" font-family="Consolas, monospace" font-size="9" fill="#2563eb"><tspan font-weight="bold">FK </tspan>user_id : TEXT</text>
          <text x="10" y="106" font-family="Consolas, monospace" font-size="9" fill="#334155">role : TEXT</text>
          <text x="10" y="122" font-family="Consolas, monospace" font-size="9" fill="#334155">created_at : DATETIME</text>
        </g>

        <!-- ENTITY: READINESS_CHECKS (ROLL-CALL QUOTA) -->
        <g transform="translate(240, 520)" filter="url(#erdShadow)">
          <rect width="210" height="190" rx="6" fill="#ffffff" stroke="#10b981" stroke-width="1.5"/>
          <path d="M 0 6 A 6 6 0 0 1 6 0 L 204 0 A 6 6 0 0 1 210 6 L 210 28 L 0 28 Z" fill="#065f46"/>
          <text x="105" y="19" fill="#ffffff" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="11" text-anchor="middle">READINESS_CHECKS (ROLL-CALL)</text>
          <text x="10" y="48" font-family="Consolas, monospace" font-size="9" fill="#0f172a"><tspan fill="#d97706" font-weight="bold">PK </tspan>id : TEXT</text>
          <text x="10" y="68" font-family="Consolas, monospace" font-size="9" fill="#2563eb"><tspan font-weight="bold">FK </tspan>creator_id : TEXT</text>
          <text x="10" y="88" font-family="Consolas, monospace" font-size="9" fill="#2563eb"><tspan font-weight="bold">FK </tspan>request_id : TEXT</text>
          <text x="10" y="108" font-family="Consolas, monospace" font-size="9" fill="#2563eb"><tspan font-weight="bold">FK </tspan>community_id : TEXT</text>
          <text x="10" y="128" font-family="Consolas, monospace" font-size="9" fill="#334155">title, description : TEXT</text>
          <text x="10" y="148" font-family="Consolas, monospace" font-size="9" fill="#334155">target_date : TEXT</text>
          <text x="10" y="168" font-family="Consolas, monospace" font-size="9" fill="#334155">target_headcount : INTEGER</text>
          <text x="10" y="184" font-family="Consolas, monospace" font-size="9" fill="#334155">status : TEXT (active/closed)</text>
        </g>

        <!-- ENTITY: READINESS_RESPONSES (VOLUNTEER LIVE STATUS) -->
        <g transform="translate(240, 740)" filter="url(#erdShadow)">
          <rect width="210" height="170" rx="6" fill="#ffffff" stroke="#10b981" stroke-width="1.5"/>
          <path d="M 0 6 A 6 6 0 0 1 6 0 L 204 0 A 6 6 0 0 1 210 6 L 210 26 L 0 26 Z" fill="#047857"/>
          <text x="105" y="18" fill="#ffffff" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="10.5" text-anchor="middle">READINESS_RESPONSES</text>
          <text x="10" y="46" font-family="Consolas, monospace" font-size="9" fill="#0f172a"><tspan fill="#d97706" font-weight="bold">PK </tspan>id : TEXT</text>
          <text x="10" y="66" font-family="Consolas, monospace" font-size="9" fill="#2563eb"><tspan font-weight="bold">FK </tspan>readiness_check_id : TEXT</text>
          <text x="10" y="86" font-family="Consolas, monospace" font-size="9" fill="#2563eb"><tspan font-weight="bold">FK </tspan>user_id : TEXT</text>
          <text x="10" y="106" font-family="Consolas, monospace" font-size="9" fill="#059669">status : TEXT (ready/standby)</text>
          <text x="10" y="126" font-family="Consolas, monospace" font-size="9" fill="#334155">note, available_hours : TEXT</text>
          <text x="10" y="146" font-family="Consolas, monospace" font-size="9" fill="#334155">updated_at : DATETIME</text>
        </g>

        <!-- ENTITY: RESOURCES -->
        <g transform="translate(480, 720)" filter="url(#erdShadow)">
          <rect width="210" height="210" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
          <path d="M 0 6 A 6 6 0 0 1 6 0 L 204 0 A 6 6 0 0 1 210 6 L 210 28 L 0 28 Z" fill="url(#erdHeadAid)"/>
          <text x="105" y="19" fill="#ffffff" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="11.5" text-anchor="middle">RESOURCES (RELIEF &amp; TOOLS)</text>
          <text x="10" y="48" font-family="Consolas, monospace" font-size="9" fill="#0f172a"><tspan fill="#d97706" font-weight="bold">PK </tspan>id : TEXT</text>
          <text x="10" y="68" font-family="Consolas, monospace" font-size="9" fill="#2563eb"><tspan font-weight="bold">FK </tspan>provider_id : TEXT</text>
          <text x="10" y="88" font-family="Consolas, monospace" font-size="9" fill="#334155">title, description : TEXT</text>
          <text x="10" y="108" font-family="Consolas, monospace" font-size="9" fill="#334155">category : TEXT</text>
          <text x="10" y="128" font-family="Consolas, monospace" font-size="9" fill="#334155">quantity, unit : TEXT</text>
          <text x="10" y="148" font-family="Consolas, monospace" font-size="9" fill="#334155">availability : TEXT (immediate)</text>
          <text x="10" y="168" font-family="Consolas, monospace" font-size="9" fill="#334155">lat, lng : REAL</text>
          <text x="10" y="188" font-family="Consolas, monospace" font-size="9" fill="#334155">status : TEXT</text>
        </g>

        <!-- JUNCTION: RESOURCE_ASSIGNMENTS (MATCH FULFILLMENT) -->
        <g transform="translate(480, 560)" filter="url(#erdShadow)">
          <rect width="180" height="130" rx="6" fill="#ffffff" stroke="#ea580c" stroke-width="1.5"/>
          <path d="M 0 6 A 6 6 0 0 1 6 0 L 174 0 A 6 6 0 0 1 180 6 L 180 24 L 0 24 Z" fill="#c2410c"/>
          <text x="90" y="16" fill="#ffffff" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="9.5" text-anchor="middle">RESOURCE_ASSIGNMENTS</text>
          <text x="10" y="42" font-family="Consolas, monospace" font-size="8.5" fill="#0f172a"><tspan fill="#d97706" font-weight="bold">PK </tspan>id : TEXT</text>
          <text x="10" y="62" font-family="Consolas, monospace" font-size="8.5" fill="#2563eb"><tspan font-weight="bold">FK </tspan>request_id : TEXT</text>
          <text x="10" y="82" font-family="Consolas, monospace" font-size="8.5" fill="#2563eb"><tspan font-weight="bold">FK </tspan>resource_id : TEXT</text>
          <text x="10" y="102" font-family="Consolas, monospace" font-size="8.5" fill="#2563eb"><tspan font-weight="bold">FK </tspan>assigned_by_id : TEXT</text>
          <text x="10" y="120" font-family="Consolas, monospace" font-size="8.5" fill="#334155">status : TEXT (accepted/transit)</text>
        </g>

        <!-- ================= ROW 4: DELIBERATIVE GOVERNANCE ================= -->
        <!-- ENTITY: PLANS -->
        <g transform="translate(730, 720)" filter="url(#erdShadow)">
          <rect width="210" height="210" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
          <path d="M 0 6 A 6 6 0 0 1 6 0 L 204 0 A 6 6 0 0 1 210 6 L 210 28 L 0 28 Z" fill="url(#erdHeadGov)"/>
          <text x="105" y="19" fill="#ffffff" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="11.5" text-anchor="middle">PLANS (CIVIC GOVERNANCE)</text>
          <text x="10" y="48" font-family="Consolas, monospace" font-size="9" fill="#0f172a"><tspan fill="#d97706" font-weight="bold">PK </tspan>id : TEXT</text>
          <text x="10" y="68" font-family="Consolas, monospace" font-size="9" fill="#2563eb"><tspan font-weight="bold">FK </tspan>proposer_id : TEXT</text>
          <text x="10" y="88" font-family="Consolas, monospace" font-size="9" fill="#334155">title, summary : TEXT</text>
          <text x="10" y="108" font-family="Consolas, monospace" font-size="9" fill="#ea580c">lifecycle_stage : TEXT</text>
          <text x="10" y="128" font-family="Consolas, monospace" font-size="9" fill="#334155">tasks : JSON</text>
          <text x="10" y="148" font-family="Consolas, monospace" font-size="9" fill="#334155">critiques : JSON</text>
          <text x="10" y="168" font-family="Consolas, monospace" font-size="9" fill="#334155">decision_log : JSON</text>
          <text x="10" y="188" font-family="Consolas, monospace" font-size="9" fill="#334155">outcomes_evaluation : TEXT</text>
        </g>

        <!-- ENTITY: PLAN_FEEDBACK -->
        <g transform="translate(970, 720)" filter="url(#erdShadow)">
          <rect width="180" height="170" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
          <path d="M 0 6 A 6 6 0 0 1 6 0 L 174 0 A 6 6 0 0 1 180 6 L 180 26 L 0 26 Z" fill="url(#erdHeadGov)"/>
          <text x="90" y="18" fill="#ffffff" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="10" text-anchor="middle">PLAN_FEEDBACK (CRITIQUES)</text>
          <text x="10" y="46" font-family="Consolas, monospace" font-size="9" fill="#0f172a"><tspan fill="#d97706" font-weight="bold">PK </tspan>id : TEXT</text>
          <text x="10" y="66" font-family="Consolas, monospace" font-size="9" fill="#2563eb"><tspan font-weight="bold">FK </tspan>plan_id : TEXT</text>
          <text x="10" y="86" font-family="Consolas, monospace" font-size="9" fill="#2563eb"><tspan font-weight="bold">FK </tspan>author_id : TEXT</text>
          <text x="10" y="106" font-family="Consolas, monospace" font-size="9" fill="#334155">type : TEXT (feasibility/safety)</text>
          <text x="10" y="126" font-family="Consolas, monospace" font-size="9" fill="#334155">text, suggested_change : TEXT</text>
          <text x="10" y="146" font-family="Consolas, monospace" font-size="9" fill="#334155">status : TEXT (open/adopted)</text>
        </g>

        <!-- ================= CARDINALITY CONNECTORS ================= -->
        <!-- Communities to Community_Members (1:N) -->
        <path d="M 240 100 L 280 100" stroke="#0284c7" stroke-width="2" fill="none"/>
        <text x="260" y="93" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#0369a1" text-anchor="middle">1:N</text>

        <!-- Users to Community_Members (1:N) -->
        <path d="M 370 240 L 370 180" stroke="#0284c7" stroke-width="2" fill="none"/>
        <text x="382" y="210" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#0369a1">1:N</text>

        <!-- Communities to Posts (1:N) -->
        <path d="M 135 240 L 135 260 L 610 260 L 610 260" stroke="#0ea5e9" stroke-width="1.8" stroke-dasharray="4,2" fill="none"/>

        <!-- Posts to Post_Comments (1:N) -->
        <path d="M 720 110 L 760 110" stroke="#0284c7" stroke-width="2" fill="none"/>
        <text x="740" y="103" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#0369a1" text-anchor="middle">1:N</text>

        <!-- Users to Posts (1:N) -->
        <path d="M 470 270 L 500 270 L 500 130" stroke="#2563eb" stroke-width="2" fill="none"/>
        <text x="485" y="200" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#1e3a8a">1:N</text>

        <!-- Users to Observations (1:N) -->
        <path d="M 470 370 L 520 370" stroke="#2563eb" stroke-width="2" fill="none"/>
        <text x="495" y="362" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#1e3a8a" text-anchor="middle">1:N</text>

        <!-- Observations to Obs_Evidence (1:N) -->
        <path d="M 625 520 L 625 590 L 680 590" stroke="#059669" stroke-width="2" fill="none"/>
        <text x="650" y="583" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#065f46" text-anchor="middle">1:N</text>

        <!-- Evidence to Obs_Evidence (1:N) -->
        <path d="M 875 500 L 875 590 L 860 590" stroke="#059669" stroke-width="2" fill="none"/>
        <text x="868" y="583" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#065f46" text-anchor="middle">1:N</text>

        <!-- Observations to Claims/Disputes (1:N) -->
        <path d="M 730 400 L 980 400 L 980 530" stroke="#991b1b" stroke-width="1.8" fill="none"/>
        <text x="965" y="470" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#991b1b">1:N (Claims)</text>

        <!-- Users to Requests (1:N) -->
        <path d="M 280 350 L 240 350" stroke="#2563eb" stroke-width="2" fill="none"/>
        <text x="260" y="342" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#1e3a8a" text-anchor="middle">1:N</text>

        <!-- Requests to Request_Responses (1:N) -->
        <path d="M 120 500 L 120 530" stroke="#c026d3" stroke-width="2" fill="none"/>
        <text x="132" y="518" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#701a75">1:N (Team)</text>

        <!-- Requests to Readiness_Checks (1:N - Request Group Roll-Call) -->
        <path d="M 240 430 L 345 430 L 345 520" stroke="#10b981" stroke-width="2" fill="none"/>
        <text x="330" y="475" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#065f46" text-anchor="middle">1:N (Roll Call)</text>

        <!-- Readiness_Checks to Readiness_Responses (1:N) -->
        <path d="M 345 710 L 345 740" stroke="#10b981" stroke-width="2" fill="none"/>
        <text x="357" y="728" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#065f46">1:N</text>

        <!-- Requests & Resources to Resource_Assignments -->
        <path d="M 240 490 L 480 490 L 480 560" stroke="#ea580c" stroke-width="2" stroke-dasharray="4,2" fill="none"/>
        <path d="M 570 720 L 570 690" stroke="#ea580c" stroke-width="2" stroke-dasharray="4,2" fill="none"/>
        <text x="525" y="535" font-family="'Segoe UI', sans-serif" font-size="8" fill="#9a3412" text-anchor="middle">Matches &amp; Assigns</text>

        <!-- Users to Resources (1:N) -->
        <path d="M 440 480 L 440 820 L 480 820" stroke="#2563eb" stroke-width="1.8" fill="none"/>
        <text x="455" y="780" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#1e3a8a">1:N</text>

        <!-- Users to Plans (1:N) -->
        <path d="M 410 480 L 410 880 L 730 880" stroke="#2563eb" stroke-width="1.8" fill="none"/>
        <text x="600" y="873" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#1e3a8a">1:N (Proposes)</text>

        <!-- Plans to Plan_Feedback (1:N) -->
        <path d="M 940 810 L 970 810" stroke="#ea580c" stroke-width="2" fill="none"/>
        <text x="955" y="802" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#9a3412" text-anchor="middle">1:N</text>
      </svg>
      <div class="diagram-caption">Figure 4.1: Complete Relational Entity-Relationship Diagram (ERD) Incorporating Communities, Neighborhood Feed, Request-Group Readiness, and Epistemic Verification Subsystems</div>
    </div>

    <h3>4.2.1 Relational Architecture &amp; Cardinality Data Dictionary</h3>
    <p>
      The complete relational architecture enforces strict relational referential integrity, foreign key cascades, and cardinality semantics across all operational domains:
    </p>
    <table>
      <thead>
        <tr>
          <th style="width: 18%;">Entity Name</th>
          <th style="width: 14%;">Primary Key</th>
          <th style="width: 22%;">Foreign Key Constraints</th>
          <th style="width: 16%;">Cardinality</th>
          <th style="width: 30%;">Operational Business Purpose</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>users</code></td>
          <td><code>id (TEXT)</code></td>
          <td>None</td>
          <td>Parent of all modules</td>
          <td>Central civic identity, salted password hash, location coordinates, skills, and moderation role.</td>
        </tr>
        <tr>
          <td><code>communities</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>creator_id &rarr; users(id)</code></td>
          <td>1 : N with members &amp; posts</td>
          <td>Neighborhood mutual aid collectives, spatial boundaries, category rules, and governance policies.</td>
        </tr>
        <tr>
          <td><code>community_members</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>community_id &rarr; communities(id)<br/>user_id &rarr; users(id)</code></td>
          <td>N : M junction</td>
          <td>Tracks neighborhood affiliations, leadership roles (admin, moderator, member), and join dates.</td>
        </tr>
        <tr>
          <td><code>posts</code> (Neighborhood Feed)</td>
          <td><code>id (TEXT)</code></td>
          <td><code>community_id &rarr; communities(id)<br/>author_id &rarr; users(id)</code></td>
          <td>1 : N with comments</td>
          <td>Local neighborhood broadcast feed, emergency alerts, discussion threads, poll voting, and media.</td>
        </tr>
        <tr>
          <td><code>post_comments</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>post_id &rarr; posts(id)<br/>author_id &rarr; users(id)</code></td>
          <td>N : 1 with posts</td>
          <td>Granular threaded replies and neighborhood discussion attached to feed broadcasts.</td>
        </tr>
        <tr>
          <td><code>observations</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>author_id &rarr; users(id)</code></td>
          <td>1 : N with evidence &amp; claims</td>
          <td>Empirical field incident telemetry (hazards, outages, medical shortages) with coordinates and status.</td>
        </tr>
        <tr>
          <td><code>evidence</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>author_id &rarr; users(id)</code></td>
          <td>N : M with observations</td>
          <td>Verifiable proof artifacts (photos, sensor readings, official dispatches) with cryptographic provenance.</td>
        </tr>
        <tr>
          <td><code>observation_evidence</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>observation_id &rarr; observations(id)<br/>evidence_id &rarr; evidence(id)</code></td>
          <td>N : M junction</td>
          <td>Enforces empirical grounding by linking observations to tangible verification artifacts.</td>
        </tr>
        <tr>
          <td><code>claims &amp; disputes</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>observation_id &rarr; observations(id)<br/>author_id &rarr; users(id)</code></td>
          <td>N : 1 with observations</td>
          <td>Formal dispute resolution queue when conflicting field reports challenge observation accuracy.</td>
        </tr>
        <tr>
          <td><code>requests</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>requester_id &rarr; users(id)<br/>community_id &rarr; communities(id)</code></td>
          <td>1 : N with responses &amp; checks</td>
          <td>Urgent mutual aid needs specifying category, urgency level, people needed, and required skills.</td>
        </tr>
        <tr>
          <td><code>request_responses</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>request_id &rarr; requests(id)<br/>user_id &rarr; users(id)</code></td>
          <td>N : M junction</td>
          <td>Assembles volunteers from any neighborhood into the committed Request Group for an incident.</td>
        </tr>
        <tr>
          <td><code>readiness_checks</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>request_id &rarr; requests(id)<br/>creator_id &rarr; users(id)</code></td>
          <td>1 : N with responses</td>
          <td>Roll-call trigger establishing target headcount and required skills for a request group or event.</td>
        </tr>
        <tr>
          <td><code>readiness_responses</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>readiness_check_id &rarr; readiness_checks(id)<br/>user_id &rarr; users(id)</code></td>
          <td>N : 1 with checks</td>
          <td>Committed volunteer live operational status ('ready', 'standby', 'unavailable'), hours, and gear held.</td>
        </tr>
        <tr>
          <td><code>resources</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>provider_id &rarr; users(id)</code></td>
          <td>1 : N with assignments</td>
          <td>Available physical supplies, tools, medical caches, and specialized skills offered by neighbors.</td>
        </tr>
        <tr>
          <td><code>resource_assignments</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>request_id &rarr; requests(id)<br/>resource_id &rarr; resources(id)</code></td>
          <td>N : M coordination</td>
          <td>Formal match execution pairing an approved resource with a fulfilled community request.</td>
        </tr>
        <tr>
          <td><code>plans</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>proposer_id &rarr; users(id)</code></td>
          <td>1 : N with feedback</td>
          <td>5-stage deliberative collective action proposal governing community crisis mitigation.</td>
        </tr>
        <tr>
          <td><code>plan_feedback</code></td>
          <td><code>id (TEXT)</code></td>
          <td><code>plan_id &rarr; plans(id)<br/>author_id &rarr; users(id)</code></td>
          <td>N : 1 with plans</td>
          <td>Categorized critiques (feasibility, safety, budget) with required resolution notes before stage advancement.</td>
        </tr>
      </tbody>
    </table>

    <h2>4.3 Complete Data Flow Diagrams (DFD)</h2>
    <p>
      The Data Flow Diagrams depict the comprehensive transformational journey of data through <strong>A Social Coordination Network</strong>. The models delineate the exact boundary interfaces, internal processes, algorithmic evaluations, and datastore interactions.
    </p>

    <!-- 4.3.1 DFD LEVEL 0 -->
    <h3>4.3.1 Context Level DFD (Level 0)</h3>
    <p>
      The Level 0 Context Diagram treats the entire system as an integrated coordination hub (Process 0.0), modeling all external entity interactions, operational data streams, and external GIS services.
    </p>

    <div class="diagram-container">
      <svg viewBox="0 0 1060 480" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
        <rect width="1060" height="480" fill="#f8fafc" rx="8"/>

        <!-- EXTERNAL ENTITY 1: CIVIC PARTICIPANT / RESIDENT -->
        <rect x="30" y="40" width="200" height="110" rx="8" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
        <text x="130" y="70" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="12" fill="#1e3a8a" text-anchor="middle">CIVIC PARTICIPANT /</text>
        <text x="130" y="88" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="12" fill="#1e3a8a" text-anchor="middle">NEIGHBORHOOD RESIDENT</text>
        <text x="130" y="112" font-family="'Segoe UI', sans-serif" font-size="9" fill="#475569" text-anchor="middle">&bull; Posts Feed Bulletins &amp; Comments</text>
        <text x="130" y="126" font-family="'Segoe UI', sans-serif" font-size="9" fill="#475569" text-anchor="middle">&bull; Submits Observations &amp; Requests</text>
        <text x="130" y="140" font-family="'Segoe UI', sans-serif" font-size="9" fill="#475569" text-anchor="middle">&bull; Submits Roll-Call Readiness</text>

        <!-- EXTERNAL ENTITY 2: COMMUNITY COORDINATOR -->
        <rect x="30" y="320" width="200" height="110" rx="8" fill="#fdf4ff" stroke="#c026d3" stroke-width="2"/>
        <text x="130" y="350" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="12" fill="#701a75" text-anchor="middle">COMMUNITY COORDINATOR /</text>
        <text x="130" y="368" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="12" fill="#701a75" text-anchor="middle">TEAM LEADER</text>
        <text x="130" y="392" font-family="'Segoe UI', sans-serif" font-size="9" fill="#475569" text-anchor="middle">&bull; Authors Action Plans &amp; Tasks</text>
        <text x="130" y="406" font-family="'Segoe UI', sans-serif" font-size="9" fill="#475569" text-anchor="middle">&bull; Triggers Roll-Call Quotas</text>
        <text x="130" y="420" font-family="'Segoe UI', sans-serif" font-size="9" fill="#475569" text-anchor="middle">&bull; Dispatches Match Assignments</text>

        <!-- CENTRAL PROCESS 0.0 -->
        <circle cx="530" cy="240" r="115" fill="#ffffff" stroke="#0f172a" stroke-width="3"/>
        <text x="530" y="210" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="15" fill="#0f172a" text-anchor="middle">0.0</text>
        <text x="530" y="235" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="14" fill="#1e40af" text-anchor="middle">A SOCIAL</text>
        <text x="530" y="255" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="14" fill="#1e40af" text-anchor="middle">COORDINATION</text>
        <text x="530" y="275" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="14" fill="#1e40af" text-anchor="middle">NETWORK</text>

        <!-- EXTERNAL ENTITY 3: PUBLIC MODERATOR / VERIFIER -->
        <rect x="830" y="40" width="200" height="110" rx="8" fill="#fef2f2" stroke="#ef4444" stroke-width="2"/>
        <text x="930" y="70" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="12" fill="#991b1b" text-anchor="middle">PUBLIC MODERATOR /</text>
        <text x="930" y="88" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="12" fill="#991b1b" text-anchor="middle">VERIFIER</text>
        <text x="930" y="112" font-family="'Segoe UI', sans-serif" font-size="9" fill="#475569" text-anchor="middle">&bull; Epistemic Contradiction Audits</text>
        <text x="930" y="126" font-family="'Segoe UI', sans-serif" font-size="9" fill="#475569" text-anchor="middle">&bull; Content Quarantine Directives</text>
        <text x="930" y="140" font-family="'Segoe UI', sans-serif" font-size="9" fill="#475569" text-anchor="middle">&bull; Dispute Arbitration Decisions</text>

        <!-- EXTERNAL ENTITY 4: MUNICIPAL / EMERGENCY LIAISON -->
        <rect x="830" y="320" width="200" height="110" rx="8" fill="#f0fdf4" stroke="#10b981" stroke-width="2"/>
        <text x="930" y="350" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="12" fill="#065f46" text-anchor="middle">EMERGENCY SERVICES &amp;</text>
        <text x="930" y="368" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="12" fill="#065f46" text-anchor="middle">MUNICIPAL LIAISONS</text>
        <text x="930" y="392" font-family="'Segoe UI', sans-serif" font-size="9" fill="#475569" text-anchor="middle">&bull; Aggregated Readiness Telemetry</text>
        <text x="930" y="406" font-family="'Segoe UI', sans-serif" font-size="9" fill="#475569" text-anchor="middle">&bull; Official Hazard Bulletins</text>
        <text x="930" y="420" font-family="'Segoe UI', sans-serif" font-size="9" fill="#475569" text-anchor="middle">&bull; High-Priority Supply Requests</text>

        <!-- FLOWS TO/FROM RESIDENT -->
        <path d="M 230 75 L 425 180" stroke="#2563eb" stroke-width="1.8" fill="none"/>
        <text x="320" y="105" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#1e3a8a">Observations, Feed Posts, Requests, Readiness</text>

        <path d="M 425 200 L 230 115" stroke="#2563eb" stroke-width="1.8" stroke-dasharray="3,3" fill="none"/>
        <text x="315" y="175" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#1e3a8a">Verified Map, Feed Alerts, Roll-Call Prompts</text>

        <!-- FLOWS TO/FROM COORDINATOR -->
        <path d="M 230 350 L 430 290" stroke="#c026d3" stroke-width="1.8" fill="none"/>
        <text x="310" y="340" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#701a75">Action Plans, Roll-Call Triggers, Assignments</text>

        <path d="M 430 310 L 230 385" stroke="#c026d3" stroke-width="1.8" stroke-dasharray="3,3" fill="none"/>
        <text x="300" y="380" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#701a75">Group Readiness %, Match Evaluations</text>

        <!-- FLOWS TO/FROM MODERATOR -->
        <path d="M 830 75 L 635 180" stroke="#ef4444" stroke-width="1.8" fill="none"/>
        <text x="740" y="105" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#991b1b">Quarantine Actions, Dispute Verdicts</text>

        <path d="M 635 200 L 830 115" stroke="#ef4444" stroke-width="1.8" stroke-dasharray="3,3" fill="none"/>
        <text x="735" y="175" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#991b1b">Audit Telemetry, Contradiction Flags</text>

        <!-- FLOWS TO/FROM EMERGENCY LIAISON -->
        <path d="M 830 350 L 630 290" stroke="#10b981" stroke-width="1.8" fill="none"/>
        <text x="730" y="340" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#065f46">Priority Needs, Official Verification Proof</text>

        <path d="M 630 310 L 830 385" stroke="#10b981" stroke-width="1.8" stroke-dasharray="3,3" fill="none"/>
        <text x="725" y="380" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#065f46">Incident Map Layers, Readiness Telemetry</text>
      </svg>
      <div class="diagram-caption">Figure 4.2: DFD Level 0 &ndash; Context Level System Boundary Diagram with Complete External Entity Data Exchanges</div>
    </div>

    <!-- 4.3.2 DFD LEVEL 1 -->
    <h3>4.3.2 Level 1 DFD (Complete Functional Decomposition)</h3>
    <p>
      The Level 1 DFD fully decomposes the platform into seven core processes, illustrating the precise inputs, outputs, and read/write interactions with the normalized SQLite datastores:
    </p>

    <div class="diagram-container">
      <svg viewBox="0 0 1120 780" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
        <rect width="1120" height="780" fill="#f8fafc" rx="8"/>

        <!-- PROCESS 1.0 -->
        <rect x="50" y="40" width="190" height="70" rx="8" fill="#ffffff" stroke="#2563eb" stroke-width="2"/>
        <text x="145" y="65" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="11" fill="#1e3a8a" text-anchor="middle">1.0 IDENTITY &amp; ACCESS</text>
        <text x="145" y="82" font-family="'Segoe UI', sans-serif" font-size="9.5" fill="#475569" text-anchor="middle">Auth, JWT, Bcrypt &amp;</text>
        <text x="145" y="96" font-family="'Segoe UI', sans-serif" font-size="9" fill="#475569" text-anchor="middle">Role-Based Access Control</text>

        <!-- PROCESS 2.0: NEIGHBORHOOD SOCIAL FEED -->
        <rect x="320" y="40" width="210" height="70" rx="8" fill="#ffffff" stroke="#0284c7" stroke-width="2"/>
        <text x="425" y="65" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="11" fill="#0369a1" text-anchor="middle">2.0 NEIGHBORHOOD FEED</text>
        <text x="425" y="82" font-family="'Segoe UI', sans-serif" font-size="9.5" fill="#475569" text-anchor="middle">Community Hubs, Posts,</text>
        <text x="425" y="96" font-family="'Segoe UI', sans-serif" font-size="9" fill="#475569" text-anchor="middle">Threaded Comments &amp; Polls</text>

        <!-- PROCESS 3.0: EPISTEMIC VERIFICATION -->
        <rect x="600" y="40" width="210" height="70" rx="8" fill="#ffffff" stroke="#059669" stroke-width="2"/>
        <text x="705" y="65" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="11" fill="#065f46" text-anchor="middle">3.0 EPISTEMIC INGESTION</text>
        <text x="705" y="82" font-family="'Segoe UI', sans-serif" font-size="9.5" fill="#475569" text-anchor="middle">Observations, Evidence Chains,</text>
        <text x="705" y="96" font-family="'Segoe UI', sans-serif" font-size="9" fill="#475569" text-anchor="middle">&amp; Contradiction Detection</text>

        <!-- PROCESS 4.0: REQUEST GROUPS & READINESS -->
        <rect x="880" y="40" width="190" height="70" rx="8" fill="#ffffff" stroke="#10b981" stroke-width="2"/>
        <text x="975" y="65" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="11" fill="#047857" text-anchor="middle">4.0 GROUP READINESS</text>
        <text x="975" y="82" font-family="'Segoe UI', sans-serif" font-size="9.5" fill="#475569" text-anchor="middle">Roll-Call Quotas, Status</text>
        <text x="975" y="96" font-family="'Segoe UI', sans-serif" font-size="9" fill="#475569" text-anchor="middle">&amp; Group Readiness Score</text>

        <!-- DATA STORES LAYER 1 -->
        <!-- D1: Users -->
        <g transform="translate(60, 220)">
          <path d="M 0 0 L 170 0 M 0 45 L 170 45" stroke="#334155" stroke-width="2"/ fill="none"/>
          <text x="10" y="22" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="10.5" fill="#0f172a">D1 | Users &amp; Profiles</text>
          <text x="10" y="37" font-family="'Segoe UI', sans-serif" font-size="8" fill="#64748b">Credentials, Skills, Geo</text>
        </g>
        <!-- D2: Communities & Feed -->
        <g transform="translate(340, 220)">
          <path d="M 0 0 L 180 0 M 0 45 L 180 45" stroke="#334155" stroke-width="2"/ fill="none"/>
          <text x="10" y="22" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="10.5" fill="#0f172a">D2 | Communities &amp; Feed</text>
          <text x="10" y="37" font-family="'Segoe UI', sans-serif" font-size="8" fill="#64748b">Hubs, Posts, Comments, Polls</text>
        </g>
        <!-- D3: Observations & Evidence -->
        <g transform="translate(615, 220)">
          <path d="M 0 0 L 180 0 M 0 45 L 180 45" stroke="#334155" stroke-width="2"/ fill="none"/>
          <text x="10" y="22" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="10.5" fill="#0f172a">D3 | Observations &amp; Evidence</text>
          <text x="10" y="37" font-family="'Segoe UI', sans-serif" font-size="8" fill="#64748b">Geotagged Telemetry, Proof</text>
        </g>
        <!-- D5: Readiness Telemetry -->
        <g transform="translate(890, 220)">
          <path d="M 0 0 L 170 0 M 0 45 L 170 45" stroke="#334155" stroke-width="2"/ fill="none"/>
          <text x="10" y="22" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="10.5" fill="#0f172a">D5 | Readiness &amp; Roll-Call</text>
          <text x="10" y="37" font-family="'Segoe UI', sans-serif" font-size="8" fill="#64748b">Check Quotas, Ready/Standby</text>
        </g>

        <!-- PROCESS 5.0: 5-FACTOR MATCHING ENGINE -->
        <rect x="180" y="420" width="220" height="75" rx="8" fill="#ffffff" stroke="#c026d3" stroke-width="2"/>
        <text x="290" y="445" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="11" fill="#701a75" text-anchor="middle">5.0 DETERMINISTIC MATCHER</text>
        <text x="290" y="462" font-family="'Segoe UI', sans-serif" font-size="9.5" fill="#475569" text-anchor="middle">5-Factor Scoring (Urgency,</text>
        <text x="290" y="476" font-family="'Segoe UI', sans-serif" font-size="9" fill="#475569" text-anchor="middle">Proximity, Fit, Ready Deficit)</text>

        <!-- PROCESS 6.0: DELIBERATIVE PLANNING -->
        <rect x="520" y="420" width="220" height="75" rx="8" fill="#ffffff" stroke="#ea580c" stroke-width="2"/>
        <text x="630" y="445" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="11" fill="#9a3412" text-anchor="middle">6.0 DELIBERATIVE PLANNING</text>
        <text x="630" y="462" font-family="'Segoe UI', sans-serif" font-size="9.5" fill="#475569" text-anchor="middle">5-Stage Proposal Lifecycle,</text>
        <text x="630" y="476" font-family="'Segoe UI', sans-serif" font-size="9" fill="#475569" text-anchor="middle">Critiques &amp; Living Memory</text>

        <!-- PROCESS 7.0: AUDIT & MODERATION -->
        <rect x="850" y="420" width="210" height="75" rx="8" fill="#ffffff" stroke="#ef4444" stroke-width="2"/>
        <text x="955" y="445" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="11" fill="#991b1b" text-anchor="middle">7.0 AUDIT &amp; GOVERNANCE</text>
        <text x="955" y="462" font-family="'Segoe UI', sans-serif" font-size="9.5" fill="#475569" text-anchor="middle">Dispute Arbitration, Quarantine</text>
        <text x="955" y="476" font-family="'Segoe UI', sans-serif" font-size="9" fill="#475569" text-anchor="middle">Queue &amp; Integrity Logs</text>

        <!-- DATA STORES LAYER 2 -->
        <!-- D4: Requests & Resources -->
        <g transform="translate(190, 600)">
          <path d="M 0 0 L 200 0 M 0 45 L 200 45" stroke="#334155" stroke-width="2"/ fill="none"/>
          <text x="10" y="22" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="10.5" fill="#0f172a">D4 | Requests &amp; Resources</text>
          <text x="10" y="37" font-family="'Segoe UI', sans-serif" font-size="8" fill="#64748b">Open Needs, Supplies, Tools, Assignments</text>
        </g>
        <!-- D6: Plans & Decision Logs -->
        <g transform="translate(530, 600)">
          <path d="M 0 0 L 200 0 M 0 45 L 200 45" stroke="#334155" stroke-width="2"/ fill="none"/>
          <text x="10" y="22" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="10.5" fill="#0f172a">D6 | Plans &amp; Decision Logs</text>
          <text x="10" y="37" font-family="'Segoe UI', sans-serif" font-size="8" fill="#64748b">Stages, Critiques, Out-comes, Lessons</text>
        </g>
        <!-- D7: Moderation Logs -->
        <g transform="translate(860, 600)">
          <path d="M 0 0 L 190 0 M 0 45 L 190 45" stroke="#334155" stroke-width="2"/ fill="none"/>
          <text x="10" y="22" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="10.5" fill="#0f172a">D7 | Moderation &amp; Disputes</text>
          <text x="10" y="37" font-family="'Segoe UI', sans-serif" font-size="8" fill="#64748b">Quarantine Logs, Claims, Evidence Audits</text>
        </g>

        <!-- CONNECTING FLOW LINES -->
        <!-- 1.0 to D1 -->
        <path d="M 145 110 L 145 220" stroke="#334155" stroke-width="1.5"/ fill="none"/>
        <!-- 2.0 to D2 -->
        <path d="M 425 110 L 425 220" stroke="#334155" stroke-width="1.5"/ fill="none"/>
        <!-- 3.0 to D3 -->
        <path d="M 705 110 L 705 220" stroke="#334155" stroke-width="1.5"/ fill="none"/>
        <!-- 4.0 to D5 -->
        <path d="M 975 110 L 975 220" stroke="#334155" stroke-width="1.5"/ fill="none"/>
        <!-- D1 to 5.0 -->
        <path d="M 145 265 L 145 450 L 180 450" stroke="#334155" stroke-width="1.5"/ fill="none"/>
        <!-- D5 (Readiness) to 5.0 (Matcher Deficit) -->
        <path d="M 975 265 L 975 360 L 330 360 L 330 420" stroke="#10b981" stroke-width="1.8" fill="none"/>
        <text x="580" y="352" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#047857" text-anchor="middle">Group Readiness % (Fills Impact Deficit Signal)</text>
        <!-- 5.0 to D4 -->
        <path d="M 290 495 L 290 600" stroke="#334155" stroke-width="1.5"/ fill="none"/>
        <!-- 6.0 to D6 -->
        <path d="M 630 495 L 630 600" stroke="#334155" stroke-width="1.5"/ fill="none"/>
        <!-- 7.0 to D7 -->
        <path d="M 955 495 L 955 600" stroke="#334155" stroke-width="1.5"/ fill="none"/>
        <!-- D3 to 7.0 (Contradictions) -->
        <path d="M 705 265 L 705 385 L 890 385 L 890 420" stroke="#ef4444" stroke-width="1.5" fill="none"/>
      </svg>
      <div class="diagram-caption">Figure 4.3: DFD Level 1 &ndash; Comprehensive System Functional Decomposition Across 7 Sub-Processes and 7 Normalized Datastores</div>
    </div>

    <!-- 4.3.3 LEVEL 2 DFDs -->
    <h3>4.3.3 Level 2 Detailed Process Flow Diagrams</h3>
    <p>
      To provide an exhaustive view of the core algorithms and operational workflows, two detailed Level 2 Data Flow Diagrams illustrate the <strong>Neighborhood Social Feed Pipeline</strong> and the <strong>Request-Group Roll-Call Readiness &amp; 5-Factor Matching Pipeline</strong>:
    </p>

    <!-- FIGURE 4.4: DFD LEVEL 2.0 NEIGHBORHOOD FEED -->
    <div class="diagram-container">
      <svg viewBox="0 0 1020 380" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
        <rect width="1020" height="380" fill="#f8fafc" rx="8"/>

        <!-- External: User -->
        <rect x="20" y="60" width="130" height="80" rx="6" fill="#eff6ff" stroke="#2563eb" stroke-width="1.8"/>
        <text x="85" y="95" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="11" fill="#1e3a8a" text-anchor="middle">NEIGHBORHOOD</text>
        <text x="85" y="112" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="11" fill="#1e3a8a" text-anchor="middle">RESIDENT</text>

        <!-- 2.1 Composition -->
        <circle cx="260" cy="100" r="45" fill="#ffffff" stroke="#0284c7" stroke-width="2"/>
        <text x="260" y="95" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="10.5" fill="#0369a1" text-anchor="middle">2.1 Post</text>
        <text x="260" y="112" font-family="'Segoe UI', sans-serif" font-size="9" fill="#0f172a" text-anchor="middle">Composition</text>

        <!-- 2.2 Content Sanitization & Filter -->
        <circle cx="450" cy="100" r="45" fill="#ffffff" stroke="#0284c7" stroke-width="2"/>
        <text x="450" y="95" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="10.5" fill="#0369a1" text-anchor="middle">2.2 Sanitize &amp;</text>
        <text x="450" y="112" font-family="'Segoe UI', sans-serif" font-size="9" fill="#0f172a" text-anchor="middle">Spam/Policy</text>

        <!-- 2.3 Community Indexing & Pinning -->
        <circle cx="640" cy="100" r="45" fill="#ffffff" stroke="#0284c7" stroke-width="2"/>
        <text x="640" y="95" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="10.5" fill="#0369a1" text-anchor="middle">2.3 Hub Index</text>
        <text x="640" y="112" font-family="'Segoe UI', sans-serif" font-size="9" fill="#0f172a" text-anchor="middle">&amp; Pinning</text>

        <!-- 2.4 Threaded Comments -->
        <circle cx="450" cy="270" r="45" fill="#ffffff" stroke="#0284c7" stroke-width="2"/>
        <text x="450" y="265" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="10.5" fill="#0369a1" text-anchor="middle">2.4 Comment</text>
        <text x="450" y="282" font-family="'Segoe UI', sans-serif" font-size="9" fill="#0f172a" text-anchor="middle">Threading</text>

        <!-- 2.5 Polls & Endorsements -->
        <circle cx="640" cy="270" r="45" fill="#ffffff" stroke="#0284c7" stroke-width="2"/>
        <text x="640" y="265" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="10.5" fill="#0369a1" text-anchor="middle">2.5 Poll Votes</text>
        <text x="640" y="282" font-family="'Segoe UI', sans-serif" font-size="9" fill="#0f172a" text-anchor="middle">&amp; Reactions</text>

        <!-- Data Store: D2 -->
        <g transform="translate(800, 150)">
          <path d="M 0 0 L 190 0 M 0 50 L 190 50" stroke="#334155" stroke-width="2"/ fill="none"/>
          <text x="10" y="25" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="11" fill="#0f172a">D2 | Posts &amp; Comments</text>
          <text x="10" y="42" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#64748b">posts, post_comments, polls</text>
        </g>

        <!-- Flows -->
        <path d="M 150 100 L 215 100" stroke="#334155" stroke-width="1.5"/ fill="none"/>
        <text x="180" y="92" font-family="'Segoe UI', sans-serif" font-size="8" fill="#1e3a8a">Draft Text</text>

        <path d="M 305 100 L 405 100" stroke="#334155" stroke-width="1.5"/ fill="none"/>
        <text x="355" y="92" font-family="'Segoe UI', sans-serif" font-size="8" fill="#1e3a8a">Raw Payload</text>

        <path d="M 495 100 L 595 100" stroke="#334155" stroke-width="1.5"/ fill="none"/>
        <text x="545" y="92" font-family="'Segoe UI', sans-serif" font-size="8" fill="#1e3a8a">Sanitized Post</text>

        <path d="M 685 100 L 800 160" stroke="#334155" stroke-width="1.5"/ fill="none"/>
        <text x="735" y="125" font-family="'Segoe UI', sans-serif" font-size="8" fill="#1e3a8a">Indexed Post</text>

        <path d="M 85 140 L 85 270 L 405 270" stroke="#334155" stroke-width="1.5" fill="none"/>
        <text x="210" y="262" font-family="'Segoe UI', sans-serif" font-size="8" fill="#1e3a8a">Comment Submission / Poll Vote</text>

        <path d="M 495 270 L 640 270" stroke="#334155" stroke-width="1.5"/ fill="none"/>
        <path d="M 685 270 L 800 190" stroke="#334155" stroke-width="1.5"/ fill="none"/>
      </svg>
      <div class="diagram-caption">Figure 4.4: DFD Level 2.0 &ndash; Detailed Subsystem Flow for the Neighborhood Social Feed, Comments Threading, and Poll Voting Engine</div>
    </div>

    <!-- FIGURE 4.5: DFD LEVEL 4.0 & 5.0 REQUEST GROUPS & 5-FACTOR MATCHER -->
    <div class="diagram-container">
      <svg viewBox="0 0 1080 430" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
        <rect width="1080" height="430" fill="#f8fafc" rx="8"/>

        <!-- External Entity: Requester -->
        <rect x="20" y="40" width="130" height="60" rx="6" fill="#fdf4ff" stroke="#c026d3" stroke-width="1.5"/>
        <text x="85" y="75" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="10.5" fill="#701a75" text-anchor="middle">REQUESTER</text>

        <!-- 4.1 Help Request Registration -->
        <circle cx="230" cy="70" r="40" fill="#ffffff" stroke="#c026d3" stroke-width="2"/>
        <text x="230" y="65" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="10" fill="#701a75" text-anchor="middle">4.1 Request</text>
        <text x="230" y="80" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#0f172a" text-anchor="middle">Registration</text>

        <!-- 4.2 Group Assembly -->
        <circle cx="410" cy="70" r="40" fill="#ffffff" stroke="#10b981" stroke-width="2"/>
        <text x="410" y="65" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="10" fill="#065f46" text-anchor="middle">4.2 Group</text>
        <text x="410" y="80" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#0f172a" text-anchor="middle">Assembly</text>

        <!-- 4.3 Roll-Call -->
        <circle cx="600" cy="70" r="40" fill="#ffffff" stroke="#10b981" stroke-width="2"/>
        <text x="600" y="65" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="10" fill="#065f46" text-anchor="middle">4.3 Roll-Call</text>
        <text x="600" y="80" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#0f172a" text-anchor="middle">Readiness</text>

        <!-- 4.4 Deficit Score -->
        <circle cx="790" cy="70" r="40" fill="#ffffff" stroke="#10b981" stroke-width="2"/>
        <text x="790" y="65" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="10" fill="#065f46" text-anchor="middle">4.4 Readiness</text>
        <text x="790" y="80" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#0f172a" text-anchor="middle">% Deficit</text>

        <!-- 5.1 Parallel 5-Factor Evaluators -->
        <rect x="520" y="200" width="360" height="90" rx="8" fill="#ffffff" stroke="#c026d3" stroke-width="2"/>
        <text x="700" y="225" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="11" fill="#701a75" text-anchor="middle">5.1 PARALLEL 5-FACTOR EVALUATORS</text>
        <text x="700" y="248" font-family="Consolas, monospace" font-size="9" fill="#0f172a" text-anchor="middle">&bull; Urgency (0.30) &bull; Haversine Distance (0.25)</text>
        <text x="700" y="266" font-family="Consolas, monospace" font-size="9" fill="#0f172a" text-anchor="middle">&bull; Skill Match (0.20) &bull; Availability (0.15)</text>
        <text x="700" y="284" font-family="Consolas, monospace" font-size="9" fill="#047857" font-weight="bold" text-anchor="middle">&bull; Impact Potential w/ Group Readiness Deficit (0.10)</text>

        <!-- 5.2 Match Synthesis & Assignment -->
        <circle cx="980" cy="245" r="45" fill="#ffffff" stroke="#ea580c" stroke-width="2"/>
        <text x="980" y="240" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="10.5" fill="#9a3412" text-anchor="middle">5.2 Match</text>
        <text x="980" y="258" font-family="'Segoe UI', sans-serif" font-size="9" fill="#0f172a" text-anchor="middle">Assignment</text>

        <!-- Resource Store D4 -->
        <g transform="translate(180, 230)">
          <path d="M 0 0 L 190 0 M 0 45 L 190 45" stroke="#334155" stroke-width="2"/ fill="none"/>
          <text x="10" y="22" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="10.5" fill="#0f172a">D4 | Resources Registry</text>
          <text x="10" y="38" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#64748b">Supplies, Tools, Medical, Volunteers</text>
        </g>

        <!-- Flows -->
        <path d="M 150 70 L 190 70" stroke="#334155" stroke-width="1.5"/ fill="none"/>
        <path d="M 270 70 L 370 70" stroke="#334155" stroke-width="1.5"/ fill="none"/>
        <text x="320" y="62" font-family="'Segoe UI', sans-serif" font-size="8" fill="#1e3a8a">Headcount Quota</text>

        <path d="M 450 70 L 560 70" stroke="#334155" stroke-width="1.5"/ fill="none"/>
        <text x="505" y="62" font-family="'Segoe UI', sans-serif" font-size="8" fill="#1e3a8a">Committed Responders</text>

        <path d="M 640 70 L 750 70" stroke="#334155" stroke-width="1.5"/ fill="none"/>
        <text x="695" y="62" font-family="'Segoe UI', sans-serif" font-size="8" fill="#1e3a8a">Ready/Standby/Gear</text>

        <path d="M 790 110 L 790 200" stroke="#10b981" stroke-width="2"/ fill="none"/>
        <text x="800" y="160" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#065f46">Unmet Group Deficit Signal</text>

        <path d="M 370 250 L 520 250" stroke="#334155" stroke-width="1.8"/ fill="none"/>
        <text x="445" y="242" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#1e3a8a">Candidate Resources</text>

        <path d="M 880 245 L 935 245" stroke="#334155" stroke-width="2"/ fill="none"/>
        <text x="905" y="238" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#1e3a8a">Score &gt; 0.85</text>
      </svg>
      <div class="diagram-caption">Figure 4.5: DFD Level 4.0 &amp; 5.0 &ndash; Detailed Subsystem Flow for Request Group Roll-Call Telemetry Ingestion and Deterministic 5-Factor Resource Allocation</div>
    </div>

    <h3>4.3.4 Data Flow Dictionary (Exhaustive Stream Specifications)</h3>
    <p>
      The data dictionary details the attributes and schema specifications of every primary data stream traversing the architecture:
    </p>
    <table>
      <thead>
        <tr>
          <th style="width: 10%;">Stream ID</th>
          <th style="width: 22%;">Data Stream Name</th>
          <th style="width: 18%;">Source</th>
          <th style="width: 18%;">Destination</th>
          <th style="width: 32%;">Payload Attributes &amp; Data Types</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>DF-01</code></td>
          <td>User Credential Payload</td>
          <td>Resident / User</td>
          <td>1.0 Auth Subsystem</td>
          <td><code>email/handle: TEXT, password_plaintext: TEXT</code></td>
        </tr>
        <tr>
          <td><code>DF-02</code></td>
          <td>Authenticated Session</td>
          <td>1.0 Auth Subsystem</td>
          <td>Client Browser</td>
          <td><code>token: JWT (HMAC-SHA256), userProfile: Object, permissions: Array</code></td>
        </tr>
        <tr>
          <td><code>DF-03</code></td>
          <td>Neighborhood Feed Post</td>
          <td>Resident / Coordinator</td>
          <td>2.0 Social Feed Engine</td>
          <td><code>community_id: TEXT, content: TEXT, category: TEXT, media_urls: Array, poll: Object</code></td>
        </tr>
        <tr>
          <td><code>DF-04</code></td>
          <td>Threaded Feed Comment</td>
          <td>Resident</td>
          <td>2.0 Social Feed Engine</td>
          <td><code>post_id: TEXT, author_id: TEXT, text: TEXT, timestamp: DATETIME</code></td>
        </tr>
        <tr>
          <td><code>DF-05</code></td>
          <td>Empirical Observation</td>
          <td>Civic Responder</td>
          <td>3.0 Epistemic Subsystem</td>
          <td><code>title: TEXT, category: TEXT, description: TEXT, lat: REAL, lng: REAL, evidence_id: TEXT</code></td>
        </tr>
        <tr>
          <td><code>DF-06</code></td>
          <td>Evidence Provenance Artifact</td>
          <td>Civic Responder</td>
          <td>3.0 Epistemic Subsystem</td>
          <td><code>type: TEXT, url: TEXT, provenance_chain: Array, sha256_hash: TEXT</code></td>
        </tr>
        <tr>
          <td><code>DF-07</code></td>
          <td>Contradiction &amp; Dispute Alert</td>
          <td>3.0 Epistemic Subsystem</td>
          <td>7.0 Governance Console</td>
          <td><code>source_obs_id: TEXT, target_obs_id: TEXT, reason: TEXT, counter_evidence_ids: Array</code></td>
        </tr>
        <tr>
          <td><code>DF-08</code></td>
          <td>Mutual Aid Request</td>
          <td>Requester</td>
          <td>4.0 Request Subsystem</td>
          <td><code>title: TEXT, urgency: TEXT, people_needed: INT, required_skills: Array, lat: REAL, lng: REAL</code></td>
        </tr>
        <tr>
          <td><code>DF-09</code></td>
          <td>Volunteer Commitment</td>
          <td>Volunteer Responder</td>
          <td>4.0 Request Subsystem</td>
          <td><code>request_id: TEXT, user_id: TEXT, commitment_role: TEXT, timestamp: DATETIME</code></td>
        </tr>
        <tr>
          <td><code>DF-10</code></td>
          <td>Roll-Call Trigger</td>
          <td>Coordinator</td>
          <td>4.0 Readiness Subsystem</td>
          <td><code>request_id: TEXT, target_headcount: INT, shift_date: TEXT, required_skills: Array</code></td>
        </tr>
        <tr>
          <td><code>DF-11</code></td>
          <td>Readiness Telemetry</td>
          <td>Committed Volunteer</td>
          <td>4.0 Readiness Subsystem</td>
          <td><code>check_id: TEXT, user_id: TEXT, status: 'ready'|'standby', gear_held: TEXT, hours: TEXT</code></td>
        </tr>
        <tr>
          <td><code>DF-12</code></td>
          <td>Group Readiness Deficit</td>
          <td>4.0 Readiness Subsystem</td>
          <td>5.0 Matching Engine</td>
          <td><code>request_id: TEXT, ready_count: INT, target_headcount: INT, readiness_pct: INT (0-100)</code></td>
        </tr>
        <tr>
          <td><code>DF-13</code></td>
          <td>5-Factor Match Evaluation</td>
          <td>5.0 Matching Engine</td>
          <td>Coordinator / Requester</td>
          <td><code>request_id: TEXT, resource_id: TEXT, composite_score: REAL, factor_breakdown: Array</code></td>
        </tr>
        <tr>
          <td><code>DF-14</code></td>
          <td>Deliberative Plan Critique</td>
          <td>Community Member</td>
          <td>6.0 Planning Engine</td>
          <td><code>plan_id: TEXT, type: 'feasibility'|'safety', text: TEXT, suggested_change: TEXT</code></td>
        </tr>
      </tbody>
    </table>
  </div>
`;
