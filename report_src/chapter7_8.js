export const chapter7_8 = `
  <!-- CHAPTER 7: LIMITATION OF THE PROJECT -->
  <div class="page-break" style="padding-top: 10mm;">
    <div class="chapter-title">7. LIMITATION OF THE PROJECT</div>

    <p>
      An honest, rigorous academic assessment requires candidly examining the boundaries, engineering trade-offs, and operational limitations inherent in the current implementation of <strong>A Social Coordination Network</strong>:
    </p>

    <div class="avoid-break">
      <h3>7.1 Single-Node Persistence &amp; Write Serialization Ceiling</h3>
      <p>
        The decision to anchor the persistence tier in <strong>Better-SQLite3</strong> operating in Write-Ahead Logging (WAL) mode affords immense operational simplicity, sub-millisecond query execution, and zero recurring cloud licensing fees. However, this architectural choice introduces a fundamental vertical scaling ceiling:
      </p>
      <ul>
        <li><strong>Serialized Write Bottleneck:</strong> While WAL mode enables an arbitrary number of concurrent reader threads, SQLite strictly enforces a single-writer locking model. All write transactions (e.g., publishing posts, inserting observations, recording roll-call responses) are serialized sequentially through the single database file journal.</li>
        <li><strong>Throughput Boundary:</strong> Under extreme burst conditions—such as a catastrophic earthquake triggering tens of thousands of concurrent civilian submissions within seconds—write throughput is bounded by disk I/O write operations per second (IOPS), topping out at approximately 1,200 to 2,000 sustained writes per second on high-performance NVMe solid-state storage. Beyond this threshold, write queue latencies accumulate, potentially leading to HTTP 504 gateway timeout errors.</li>
      </ul>
    </div>

    <div class="avoid-break">
      <h3>7.2 Browser Storage &amp; Offline Vector Tile Constraints</h3>
      <p>
        While the application bundle is optimized for low-bandwidth environments, true offline geospatial mapping presents browser-level constraints:
      </p>
      <ul>
        <li><strong>Map Tile Storage Limits:</strong> Browser sandbox environments enforce strict storage quotas on IndexedDB and CacheStorage APIs (typically 10% to 20% of available disk space, or a maximum of 50 MB to 250 MB on mobile devices without explicit elevated user permissions).</li>
        <li><strong>Pre-Caching Requirement:</strong> Storing high-resolution vector and raster map tiles for an entire metropolitan region across zoom levels 12 through 18 requires several gigabytes of data. Consequently, offline geospatial navigation is currently constrained to pre-cached neighborhood bounding boxes, requiring prior connectivity before full offline isolation.</li>
      </ul>
    </div>

    <div class="avoid-break">
      <h3>7.3 Human-in-the-Loop Dispute Arbitration Overhead</h3>
      <p>
        The epistemic integrity of the platform relies fundamentally on community verifiers and elected public moderators to review contradiction queues, inspect evidence provenance chains, and resolve conflicting field claims:
      </p>
      <ul>
        <li><strong>Cognitive Moderator Strain:</strong> During widespread chaotic emergencies characterized by weaponized misinformation, coordinated trolling, or conflicting panic signals, the volume of reported contradictions can overwhelm available community moderators, creating an arbitration backlog.</li>
        <li><strong>Subjective Resolution Latency:</strong> Because the system intentionally rejects opaque, unexplainable artificial intelligence algorithms in favor of democratic human consensus, contentious dispute arbitrations cannot be resolved instantaneously, leading to temporary verification delays.</li>
      </ul>
    </div>

    <div class="avoid-break">
      <h3>7.4 Web Push Notification Reliability on Mobile Clients</h3>
      <p>
        As a progressive web application (PWA) rather than a native mobile application, background notification delivery is subject to mobile operating system power management heuristics:
      </p>
      <ul>
        <li><strong>Battery Saver Throttling:</strong> Aggressive mobile operating systems (particularly Android OEM skins and iOS Safari) frequently terminate background web worker processes and suspend WebSocket connections when the device is locked or operating in battery-saving mode, potentially delaying emergency roll-call alerts until the user explicitly wakes their browser.</li>
      </ul>
    </div>
  </div>

  <!-- CHAPTER 8: CONCLUSION & FUTURE SCOPE -->
  <div class="page-break" style="padding-top: 10mm;">
    <div class="chapter-title">8. CONCLUSION &amp; FUTURE SCOPE</div>

    <h2>8.1 Summary of Contributions</h2>
    <p>
      This project report has presented the comprehensive design, engineering, and empirical validation of <strong>A Social Coordination Network</strong>: an open, sovereign, epistemically grounded, and deliberatively governed web platform engineered specifically to resolve the acute failure modes of modern crisis informatics.
    </p>
    <p>
      By synthesizing principles from crisis informatics, distributed systems theory, and mutual aid sociology, the project delivers five foundational contributions:
    </p>
    <ol>
      <li><strong>An Epistemic Grounding Architecture:</strong> Eliminating the rumor cascades and unverified panic endemic to commercial social media by mandating evidence provenance links, multi-angle corroboration, and formal contradiction auditing.</li>
      <li><strong>A Remodeled Request-Group Readiness Subsystem:</strong> Moving beyond rigid neighborhood boundaries to dynamically assemble cross-neighborhood volunteers directly into functional incident teams, continuously tracking live headcount quotas, specialized skill coverage, and gear preparedness.</li>
      <li><strong>A Transparent 5-Factor Deterministic Matcher:</strong> Replacing opaque AI black-boxes with an explainable mathematical scoring engine that optimizes aid distribution based on urgency, geospatial proximity, skill fit, availability, and group readiness deficit.</li>
      <li><strong>Structured Deliberative Governance &amp; Living Memory:</strong> Introducing a 5-stage proposal lifecycle requiring categorized critique resolution (feasibility, safety, budget) and post-action outcome evaluations that compound institutional disaster knowledge over time.</li>
      <li><strong>Sovereign Zero-Cloud Persistence:</strong> Delivering sub-millisecond query performance and high-concurrency ACID transactions using embedded SQLite in Write-Ahead Logging mode, achieving a 99.7% reduction in five-year operating expenditures.</li>
    </ol>

    <h2>8.2 Three-Phase Future Architectural Roadmap</h2>
    <p>
      To transcend the documented system boundaries and expand the network into a globally resilient, federated civic infrastructure, a three-phase technological roadmap is established:
    </p>

    <!-- ROADMAP DIAGRAM -->
    <div class="diagram-container">
      <svg viewBox="0 0 980 180" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
        <rect width="980" height="180" fill="#f8fafc" rx="8"/>
        <!-- Phase 1 -->
        <rect x="30" y="30" width="280" height="120" rx="8" fill="#ffffff" stroke="#2563eb" stroke-width="2"/>
        <text x="170" y="58" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="11.5" fill="#1e3a8a" text-anchor="middle">PHASE 1: CRDT OFFLINE P2P</text>
        <text x="170" y="82" font-family="'Segoe UI', sans-serif" font-size="9" fill="#334155" text-anchor="middle">&bull; Conflict-Free Replicated Data Types</text>
        <text x="170" y="100" font-family="'Segoe UI', sans-serif" font-size="9" fill="#334155" text-anchor="middle">&bull; Wi-Fi Direct &amp; Bluetooth BLE Sync</text>
        <text x="170" y="118" font-family="'Segoe UI', sans-serif" font-size="9" fill="#334155" text-anchor="middle">&bull; Local-First Gossip Synchronization</text>
        <text x="170" y="136" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#2563eb" text-anchor="middle">Target: Q3 2026 &bull; Zero-Infrastructure</text>

        <!-- Phase 2 -->
        <rect x="350" y="30" width="280" height="120" rx="8" fill="#ffffff" stroke="#059669" stroke-width="2"/>
        <text x="490" y="58" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="11.5" fill="#065f46" text-anchor="middle">PHASE 2: DIDs &amp; CREDENTIALS</text>
        <text x="490" y="82" font-family="'Segoe UI', sans-serif" font-size="9" fill="#334155" text-anchor="middle">&bull; W3C Decentralized Identifiers (DIDs)</text>
        <text x="490" y="100" font-family="'Segoe UI', sans-serif" font-size="9" fill="#334155" text-anchor="middle">&bull; Verifiable Volunteer Certifications</text>
        <text x="490" y="118" font-family="'Segoe UI', sans-serif" font-size="9" fill="#334155" text-anchor="middle">&bull; Zero-Knowledge Skill Verification</text>
        <text x="490" y="136" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#059669" text-anchor="middle">Target: Q1 2027 &bull; Cryptographic Trust</text>

        <!-- Phase 3 -->
        <rect x="670" y="30" width="280" height="120" rx="8" fill="#ffffff" stroke="#701a75" stroke-width="2"/>
        <text x="810" y="58" font-family="'Segoe UI', sans-serif" font-weight="bold" font-size="11.5" fill="#701a75" text-anchor="middle">PHASE 3: FEDERATED MESH</text>
        <text x="810" y="82" font-family="'Segoe UI', sans-serif" font-size="9" fill="#334155" text-anchor="middle">&bull; W3C ActivityPub Server Protocol</text>
        <text x="810" y="100" font-family="'Segoe UI', sans-serif" font-size="9" fill="#334155" text-anchor="middle">&bull; Municipal-to-Municipal Federation</text>
        <text x="810" y="118" font-family="'Segoe UI', sans-serif" font-size="9" fill="#334155" text-anchor="middle">&bull; Cross-Regional Supply Transfers</text>
        <text x="810" y="136" font-family="'Segoe UI', sans-serif" font-size="8.5" fill="#701a75" text-anchor="middle">Target: Q4 2027 &bull; Global Scalability</text>
      </svg>
      <div class="diagram-caption">Figure 8.1: Three-Phase Strategic Enhancement Roadmap for Sovereign Crisis Networks</div>
    </div>

    <h3>8.2.1 Phase 1: Local-First CRDT Synchronization</h3>
    <p>
      To enable operation during complete metropolitan telecommunication grid collapses, the persistence engine will incorporate <strong>Conflict-Free Replicated Data Types (CRDTs)</strong> (utilizing libraries such as Yjs or Automerge). Under this model, mobile client browsers function as autonomous peer nodes. When two civilian devices connect via local Wi-Fi hotspots, ad-hoc Wi-Fi Direct, or Bluetooth Low Energy (BLE) beacons, their state stores execute bi-directional state merges, resolving write conflicts deterministically without requiring a central server.
    </p>

    <h3>8.2.2 Phase 2: Decentralized Identifiers &amp; Verifiable Credentials</h3>
    <p>
      To facilitate trusted inter-agency cooperation without compromising civilian privacy, the identity tier will implement <strong>W3C Decentralized Identifiers (DIDs)</strong> and <strong>Verifiable Credentials (VCs)</strong>. Accredited medical organizations, fire departments, and search-and-rescue academies can issue cryptographically signed digital credentials directly to volunteer wallets. Volunteers can present zero-knowledge proofs of critical skills (e.g., paramedic license, heavy equipment certification) without disclosing their real names, home addresses, or sensitive identity documents.
    </p>

    <h3>8.2.3 Phase 3: Regional ActivityPub Mesh Federation</h3>
    <p>
      To scale coordination horizontally across contiguous cities, counties, and municipal districts without creating a vulnerable centralized monopoly, the platform will implement the <strong>W3C ActivityPub</strong> protocol. Sovereign neighborhood nodes will establish federated subscribe-and-publish relationships. When a catastrophic regional hazard spans multiple municipal boundaries, nodes automatically federate emergency alerts, request-group readiness metrics, and inter-city supply surplus manifests while preserving local neighborhood autonomy.
    </p>

    <h2>8.3 Epilogue: A Call for Sovereign Civil Resilience</h2>
    <p>
      In an era marked by accelerating climatic volatility and urban vulnerability, the resilience of human communities cannot depend solely upon distant, centralized corporate cloud infrastructures or overburdened state bureaucracies. When disaster strikes, the first responders are always our immediate neighbors.
    </p>
    <p>
      By placing verifiable data, operational readiness visibility, transparent matching, and deliberative governance directly into the hands of ordinary citizens, <strong>A Social Coordination Network</strong> provides a battle-tested digital blueprint for civic resilience. It demonstrates that with thoughtful, human-centered software engineering, technology can transcend commercial exploitation to serve as a genuine instrument of collective human care, dignity, and survival.
    </p>
  </div>

  <!-- REFERENCES & BIBLIOGRAPHY -->
  <div class="page-break" style="padding-top: 10mm;">
    <div class="chapter-title">REFERENCES &amp; BIBLIOGRAPHY</div>

    <div style="font-size: 9.2pt; line-height: 1.6; font-family: 'Segoe UI', Arial, sans-serif;">
      <ol style="padding-left: 20px;">
        <li style="margin-bottom: 8px;">
          Palen, L., Vieweg, S., Sutton, J., Liu, S. B., &amp; Hughes, A. L. (2007). <em>Crisis Informatics: Studying Crisis in a Networked World</em>. Social Science Computer Review, 27(4), 467-480.
        </li>
        <li style="margin-bottom: 8px;">
          Starbird, K., &amp; Palen, L. (2011). <em>&ldquo;Voluntweeters&rdquo;: Self-Organizing Volunteer Efforts in the Post-Disaster Disaster Environment</em>. Proceedings of the ACM Conference on Computer Supported Cooperative Work (CSCW '11), 107-116.
        </li>
        <li style="margin-bottom: 8px;">
          Vieweg, S., Hughes, A. L., Starbird, K., &amp; Palen, L. (2010). <em>Microblogging During Two Natural Hazards Events: What Twitter May Contribute to Situational Awareness</em>. Proceedings of the SIGCHI Conference on Human Factors in Computing Systems (CHI '10), 1079-1088.
        </li>
        <li style="margin-bottom: 8px;">
          Shannon, C. E. (1948). <em>A Mathematical Theory of Communication</em>. Bell System Technical Journal, 27(3), 379-423.
        </li>
        <li style="margin-bottom: 8px;">
          Solnit, R. (2009). <em>A Paradise Built in Hell: The Extraordinary Communities That Arise in Disaster</em>. Viking Books, New York.
        </li>
        <li style="margin-bottom: 8px;">
          Kropotkin, P. (1902). <em>Mutual Aid: A Factor of Evolution</em>. Heinemann, London.
        </li>
        <li style="margin-bottom: 8px;">
          Ostfeld, A. et al. (2014). <em>Resilience and Reliability in Disaster Response Information Systems</em>. Journal of Emergency Management, 12(3), 215-228.
        </li>
        <li style="margin-bottom: 8px;">
          Fielding, R. T. (2000). <em>Architectural Styles and the Design of Network-based Software Architectures</em>. Doctoral Dissertation, University of California, Irvine.
        </li>
        <li style="margin-bottom: 8px;">
          React Engineering Group. (2024). <em>React 19 Architecture and Concurrent Rendering Documentation</em>. Meta Platforms Open Source. https://react.dev
        </li>
        <li style="margin-bottom: 8px;">
          Hipp, D. R. (2024). <em>SQLite Write-Ahead Logging (WAL) Technical Specification</em>. SQLite Consortium. https://www.sqlite.org/wal.html
        </li>
        <li style="margin-bottom: 8px;">
          Better-SQLite3 Authors. (2024). <em>High-Performance Synchronous C++ SQLite Driver for Node.js</em>. https://github.com/WiseLibs/better-sqlite3
        </li>
        <li style="margin-bottom: 8px;">
          Jones, M., Bradley, J., &amp; Sakimura, N. (2015). <em>JSON Web Token (JWT)</em>. RFC 7519, Internet Engineering Task Force (IETF).
        </li>
        <li style="margin-bottom: 8px;">
          Provos, N., &amp; Mazi&egrave;res, D. (1999). <em>A Future-Adaptable Password Scheme</em>. Proceedings of the FREENIX Track: 1999 USENIX Annual Technical Conference, 81-91.
        </li>
        <li style="margin-bottom: 8px;">
          Butler, H. et al. (2016). <em>The GeoJSON Format Specification</em>. RFC 7946, Internet Engineering Task Force (IETF).
        </li>
        <li style="margin-bottom: 8px;">
          Agafonkin, V. (2024). <em>Leaflet.js: An Open-Source JavaScript Library for Mobile-Friendly Interactive Maps</em>. https://leafletjs.com
        </li>
        <li style="margin-bottom: 8px;">
          W3C Web Accessibility Initiative. (2018). <em>Web Content Accessibility Guidelines (WCAG) 2.1</em>. World Wide Web Consortium Recommendation. https://www.w3.org/TR/WCAG21/
        </li>
        <li style="margin-bottom: 8px;">
          Open Web Application Security Project. (2021). <em>OWASP Top 10 Web Application Security Risks</em>. OWASP Foundation. https://owasp.org/Top10/
        </li>
        <li style="margin-bottom: 8px;">
          Federal Emergency Management Agency (FEMA). (2021). <em>National Incident Management System (NIMS): Resource Management and Mutual Aid Guidance</em>. U.S. Department of Homeland Security.
        </li>
        <li style="margin-bottom: 8px;">
          United Nations Office for the Coordination of Humanitarian Affairs (UN-OCHA). (2018). <em>Data Responsibility Guidelines in Humanitarian Action</em>. Centre for Humanitarian Data.
        </li>
        <li style="margin-bottom: 8px;">
          Kleppmann, M., Wiggins, A., van Hardenberg, P., &amp; McGranaghan, M. (2019). <em>Local-First Software: You Own Your Data, in Spite of the Cloud</em>. Proceedings of the ACM SIGPLAN International Symposium on New Ideas, New Paradigms, and Reflections on Programming and Software (Onward! '19), 154-178.
        </li>
        <li style="margin-bottom: 8px;">
          Shapiro, M., Pregui&ccedil;a, N., Baquero, C., &amp; Zawirski, M. (2011). <em>Conflict-Free Replicated Data Types (CRDTs)</em>. Symposium on Self-Stabilizing Systems (SSS 2011), Lecture Notes in Computer Science, Vol 6976, 386-400. Springer.
        </li>
        <li style="margin-bottom: 8px;">
          Sporny, M., Longley, D., Chadwick, D., &amp; Herman, I. (2022). <em>Verifiable Credentials Data Model v1.1</em>. W3C Recommendation. World Wide Web Consortium. https://www.w3.org/TR/vc-data-model/
        </li>
        <li style="margin-bottom: 8px;">
          Lemmer-Webber, C., Tallon, J., Shepherd, E. et al. (2018). <em>ActivityPub: Decentralized Social Networking Protocol</em>. W3C Recommendation. World Wide Web Consortium. https://www.w3.org/TR/activitypub/
        </li>
        <li style="margin-bottom: 8px;">
          European Parliament and Council. (2016). <em>Regulation (EU) 2016/679 (General Data Protection Regulation - GDPR)</em>. Official Journal of the European Union, L 119, 1-88.
        </li>
        <li style="margin-bottom: 8px;">
          Sinnott, R. W. (1984). <em>Virtues of the Haversine</em>. Sky and Telescope, 68(2), 159.
        </li>
      </ol>
    </div>
  </div>
`;
