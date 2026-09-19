/**
 * CareMesh Comprehensive Mock Data
 * Demonstrating interconnected real-world situations:
 * People + Places + Observations + Claims + Evidence + Disputes + Requests + Quick Actions + Resources + Plans + Communities
 */

export const currentUser = {
  id: 'usr_me',
  name: 'Maya Lin',
  handle: '@mayalin',
  role: 'Community Coordinator & CERT Responder',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  bio: 'Passionate about ecological resilience, neighborhood mutual aid, and transparent community coordination. Active in Willow Creek Watershed & Eastside Aid.',
  location: {
    address: 'Eastside District, Maplewood',
    neighborhood: 'Maplewood North',
    lat: 37.7749,
    lng: -122.4194,
  },
  skills: ['Disaster First Aid (CERT)', 'Chainsaw Certified', '4WD Transportation', 'GIS Mapping', 'Food Safety'],
  badges: ['Community Member', 'CERT Trained', 'Active Coordinator'],
  privacySettings: {
    showExactLocation: true,
    allowDirectMessages: true,
    publicContributionHistory: true
  },
  socialLinks: {
    twitter: 'https://x.com/mayalin_eco',
    linkedin: 'https://linkedin.com/in/mayalin-civic',
    github: 'https://github.com/mayalin',
    facebook: 'https://facebook.com/mayalin.resilience',
    whatsapp: '+1 (555) 234-5678',
    website: 'https://mayalin.eco'
  },
  stats: {
    contributions: 42,
    resourcesShared: 6,
    plansJoined: 4,
    requestsFulfilled: 19
  }
};

export const mockUsers = [
  currentUser,
  {
    id: 'usr_dave',
    name: 'Dave Martinez',
    handle: '@dave_m',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'Civil contractor & volunteer flood response lead. Have heavy pump equipment and sandbag trailers.',
    skills: ['Heavy Equipment', 'Pump Operation', 'Flood Mitigation', 'Carpentry'],
    badges: ['Equipment Provider', 'Civil Contractor'],
    location: { address: 'Willow Valley Rd, Maplewood', lat: 37.7833, lng: -122.4167 },
    socialLinks: {
      twitter: 'https://x.com/dave_m_contracting',
      linkedin: 'https://linkedin.com/in/dave-martinez-civil',
      whatsapp: '+1 (555) 432-8765',
      website: 'https://martinez-civil.org'
    }
  },
  {
    id: 'usr_elena',
    name: 'Elena Rostova',
    handle: '@elena_care',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    bio: 'Registered nurse & senior care advocate. Helping isolated elderly neighbors stay warm and nourished.',
    skills: ['Nursing Care', 'Elderly Mobility', 'Medication Logistics', 'Russian Translation'],
    badges: ['Medical Volunteer', 'Registered Nurse'],
    location: { address: 'Pine Crest Ave, Maplewood', lat: 37.7689, lng: -122.4285 },
    socialLinks: {
      linkedin: 'https://linkedin.com/in/elena-rostova-rn',
      twitter: 'https://x.com/elena_caremesh',
      instagram: 'https://instagram.com/elena_communitycare'
    }
  },
  {
    id: 'usr_marcus',
    name: 'Marcus Thorne',
    handle: '@marcus_t',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    bio: 'Urban farmer and educator. Managing the Highland Ridge Orchard and mutual food hub.',
    skills: ['Permaculture', 'Gleaning Logistics', 'Tool Sharpening', 'Solar Installation'],
    badges: ['Food Hub Lead', 'Urban Grower'],
    location: { address: 'Highland Ridge Way, Maplewood', lat: 37.7912, lng: -122.4044 },
    socialLinks: {
      twitter: 'https://x.com/marcus_grower',
      instagram: 'https://instagram.com/highland_ridge_orchard',
      github: 'https://github.com/marcus-thorne',
      website: 'https://highlandridgefoodhub.org'
    }
  },
  {
    id: 'usr_priya',
    name: 'Priya Sharma',
    handle: '@priya_eco',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    bio: 'Environmental scientist specializing in urban stormwater management and water quality testing.',
    skills: ['Hydrology', 'Water Quality Testing', 'Environmental Impact Analysis', 'Drone Mapping'],
    badges: ['Science Contributor', 'Trained Hydrologist'],
    location: { address: 'Elm St Creek Path, Maplewood', lat: 37.7815, lng: -122.4250 },
    socialLinks: {
      twitter: 'https://x.com/priya_ecowatch',
      linkedin: 'https://linkedin.com/in/priya-sharma-hydrology',
      github: 'https://github.com/priya-sharma-eco',
      website: 'https://willowcreek-watershed.org'
    }
  },
  {
    id: 'usr_caleb',
    name: 'Caleb Zothansanga',
    handle: '@caleb_admin',
    email: 'caleb.zothansanga@gmail.com',
    role: 'System Administrator',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Primary System Administrator for CareMesh Civic Resilience Network. Managing mutual aid infrastructure, dispatch pipelines, and platform integrity.',
    skills: ['System Administration', 'Platform Security', 'Mutual Aid Governance', 'Emergency Dispatch', 'Field Radio'],
    badges: ['System Administrator', 'Verified Administrator', 'Community Leader'],
    location: { address: 'Maplewood Central Station, CA', neighborhood: 'Central Corridor', lat: 37.7749, lng: -122.4194 },
    socialLinks: {
      twitter: 'https://x.com/caleb_zothan',
      linkedin: 'https://linkedin.com/in/caleb-zothansanga',
      github: 'https://github.com/caleb-zothansanga',
      facebook: 'https://facebook.com/caleb.civicops',
      whatsapp: '+1 (555) 987-6543',
      website: 'https://caremesh.org'
    },
    privacySettings: { showExactLocation: true, allowDirectMessages: true, publicContributionHistory: true },
    stats: { contributions: 50, resourcesShared: 10, plansJoined: 5, requestsFulfilled: 12 }
  }
];

export const mockEvidence = [
  {
    id: 'ev_01',
    title: 'Culvert Water Level & Silt Depth Measurement',
    type: 'measurement',
    author: 'Priya Sharma',
    authorId: 'usr_priya',
    timestamp: '2 hours ago',
    url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
    description: 'Measured 42 inches of silt buildup at the inlet grid. Flow capacity reduced by ~65%. Water height currently 3 inches below top of retaining wall.',
    provenanceChain: [
      { step: 'Measured in situ with calibrated water gauge', time: '10:15 AM' },
      { step: 'Calibrated photo uploaded with EXIF geolocation', time: '10:20 AM' },
      { step: 'Cross-checked with regional hydrology gauge #WC-04', time: '10:45 AM' }
    ]
  },
  {
    id: 'ev_02',
    title: 'Water Turbidity Lab Kit Report (NTU 280)',
    type: 'document',
    author: 'Priya Sharma',
    authorId: 'usr_priya',
    timestamp: '1 hour ago',
    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80',
    description: 'Portable photometer test result shows 280 NTU (safe threshold < 25 NTU). Extreme sediment runoff observed upstream from construction lot.',
    provenanceChain: [
      { step: 'Sample collected at Elm St bridge inlet', time: '11:00 AM' },
      { step: 'Optical turbidity sensor test recorded', time: '11:15 AM' }
    ]
  },
  {
    id: 'ev_03',
    title: 'Pine Crest Manor Boiler Room Outage Notice',
    type: 'document',
    author: 'Elena Rostova',
    authorId: 'usr_elena',
    timestamp: '3 hours ago',
    url: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80',
    description: 'Official notice from building maintenance confirming main boiler loop heating pump failed at 6:30 AM. Parts expected in 48 hours.',
    provenanceChain: [
      { step: 'Notice posted in lobby and sent to resident council', time: '7:00 AM' },
      { step: 'Elena confirmed with on-site technician', time: '8:30 AM' }
    ]
  },
  {
    id: 'ev_04',
    title: 'Indoor Temperature Log across 12 Units',
    type: 'measurement',
    author: 'Elena Rostova',
    authorId: 'usr_elena',
    timestamp: '2 hours ago',
    url: 'https://images.unsplash.com/photo-1584267385494-9fdd9a71ad75?w=600&auto=format&fit=crop&q=80',
    description: 'Digital thermometer readings ranged between 52°F and 56°F in north-facing senior apartments during morning freeze.',
    provenanceChain: [
      { step: 'Elena visited 12 units on 2nd and 3rd floors', time: '9:00 AM - 10:00 AM' }
    ]
  },
  {
    id: 'ev_05',
    title: 'Highland Orchard Pear Harvest Yield Assessment',
    type: 'photo',
    author: 'Marcus Thorne',
    authorId: 'usr_marcus',
    timestamp: '5 hours ago',
    url: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&auto=format&fit=crop&q=80',
    description: 'Over 40 heritage Bartlett pear trees with branches heavily weighted. Estimated 800-1000 lbs ready for harvest before storm rain.',
    provenanceChain: [
      { step: 'Visual survey and density sample count', time: '7:30 AM' }
    ]
  },
  {
    id: 'ev_06',
    title: 'City Hazmat Incident Report #HZ-8821 (Lab Spectrometry Analysis)',
    type: 'document',
    author: 'City Fire & Hazmat Bureau',
    authorId: 'usr_priya',
    timestamp: '4 hours ago',
    url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
    description: 'Official spectrometry test of foaming liquid in drainage ditch near railway: Biodegradable citrus detergent from adjacent transit bus wash bay. pH 7.2 neutral. Non-toxic. Not an industrial chemical solvent.',
    provenanceChain: [
      { step: 'Passerby reported suspicious white foam', time: '6:15 AM' },
      { step: 'Fire Engine 4 and Hazmat unit dispatched for sample collection', time: '6:45 AM' },
      { step: 'Spectrometry analysis completed on site', time: '7:30 AM' },
      { step: 'Report cleared and published', time: '8:00 AM' }
    ]
  },
  {
    id: 'ev_01_sub',
    title: 'Willow Creek Upstream Hydrology Telemetry Corroboration',
    type: 'sensor',
    author: 'Dave Martinez',
    authorId: 'usr_dave',
    timestamp: '1 hour ago',
    url: '',
    description: 'Acoustic Doppler Velocity meter #WC-04 corroborates 42-inch sediment bed deposition and 62% volumetric discharge throttling.',
    provenanceChain: [
      { step: 'Hydrology sensor WC-04 telemetry synchronized', time: '11:15 AM' },
      { step: 'Verified by Dave Martinez', time: '11:30 AM' }
    ],
    parentEvidenceId: 'ev_01',
    parentObservationId: 'obs_01'
  }
];

export const mockDisputes = [
  {
    id: 'disp_01',
    claimId: 'clm_04',
    author: {
      id: 'usr_priya',
      name: 'Priya Sharma',
      role: 'Environmental Scientist'
    },
    timestamp: '3 hours ago',
    reason: 'I have contradictory evidence',
    explanation: 'Conducted field spectrometry and cross-referenced municipal report #HZ-8821. The foaming substance is confirmed to be non-toxic biodegradable citrus bus wash soap (pH 7.2 neutral) rather than hazardous industrial chemical solvent.',
    counterEvidenceIds: ['ev_06'],
    relatedObservationId: 'obs_04_contra',
    status: 'reviewed' // 'active_challenge' | 'reviewed' | 'resolved'
  },
  {
    id: 'disp_02',
    claimId: 'clm_01',
    author: {
      id: 'usr_dave',
      name: 'Dave Martinez',
      role: 'Civil Contractor'
    },
    timestamp: '1 hour ago',
    reason: 'The interpretation is incorrect',
    explanation: 'The silt blockage is severe, but the claim that 14 homes are in immediate danger does not account for the newly installed south berm constructed last month. The realistic immediate risk is to the 6 lowest elevation properties.',
    counterEvidenceIds: [],
    relatedObservationId: 'obs_01_sup',
    status: 'active_challenge',
    responses: [
      {
        id: 'dresp_01',
        disputeId: 'disp_02',
        type: 'support',
        author: {
          id: 'usr_elena',
          name: 'Elena Rostova',
          role: 'Hydrology Engineer'
        },
        timestamp: '45 mins ago',
        reason: 'Additional sensor/field data confirms this challenge',
        explanation: 'Confirmed with municipal GIS survey #GIS-302. The south berm elevation is 4.2m, which successfully shields parcels #101 through #108 from flood crests below 4.0m.',
        evidenceIds: ['ev_01']
      },
      {
        id: 'dresp_02',
        disputeId: 'disp_02',
        type: 'challenge',
        author: {
          id: 'usr_marcus',
          name: 'Marcus Vance',
          role: 'Emergency Coordinator'
        },
        timestamp: '25 mins ago',
        reason: 'The situation has evolved or been resolved',
        explanation: 'Counter-rebuttal: National weather radar indicates severe storm surge expected tonight will reach 4.6m, which will overtop the south berm. The original 14-home evacuation recommendation must stand.',
        evidenceIds: []
      }
    ]
  }
];

export const mockClaims = [
  {
    id: 'clm_01',
    observationId: 'obs_01',
    assertionText: 'Culvert inlet is heavily blocked by sediment runoff and fallen timber, creating immediate flood hazard for 14 downstream homes.',
    status: 'supported', // 'reported' | 'under_assessment' | 'supported' | 'disputed' | 'resolved' | 'outdated'
    supportingEvidenceIds: ['ev_01', 'ev_02'],
    contradictingEvidenceIds: [],
    disputeIds: ['disp_02'],
    assessmentNotes: 'Supported by physical water gauge depth (42" silt) and turbidity analysis (280 NTU). Active challenge logged regarding exact number of at-risk homes.',
    lastUpdated: '1 hour ago'
  },
  {
    id: 'clm_01_sup',
    observationId: 'obs_01_sup',
    assertionText: 'Active clay bank slumping and fallen timber 150m upstream is continuously depositing silt into the culvert channel.',
    status: 'supported',
    supportingEvidenceIds: ['ev_01'],
    contradictingEvidenceIds: [],
    disputeIds: [],
    assessmentNotes: 'Corroborating field measurement of stream bank erosion rate and sediment transport.',
    lastUpdated: '1.5 hours ago'
  },
  {
    id: 'clm_01_contra_sub',
    observationId: 'obs_01_contra_sub',
    assertionText: 'Staff gauge mounting bracket slipped 5.5 inches upward on retaining wall pier, overstating manual silt depth measurement.',
    status: 'reported',
    supportingEvidenceIds: [],
    contradictingEvidenceIds: [],
    disputeIds: [],
    assessmentNotes: 'Gauge zero-point elevation dispute referencing evidence ev_01.',
    lastUpdated: '45 mins ago'
  },
  {
    id: 'clm_01_contra',
    observationId: 'obs_01_contra',
    assertionText: 'Drainage invert was mechanically cleared with a relief trench by city maintenance.',
    status: 'disputed',
    supportingEvidenceIds: ['ev_06'],
    contradictingEvidenceIds: [],
    disputeIds: [],
    assessmentNotes: 'Trench relief logged but subsequently disputed due to rapid clay re-slumping.',
    lastUpdated: '1 hour ago'
  },
  {
    id: 'clm_01_contra_contra',
    observationId: 'obs_01_contra_contra',
    assertionText: 'Secondary silt slump refilled the excavated relief trench within 2 hours.',
    status: 'reported',
    supportingEvidenceIds: [],
    contradictingEvidenceIds: [],
    disputeIds: [],
    assessmentNotes: 'Sub-contradiction counter-challenging the maintenance clearance report.',
    lastUpdated: '25 mins ago'
  },
  {
    id: 'clm_02',
    observationId: 'obs_02',
    assertionText: 'Pine Crest Manor senior residents are without building heat with indoor temperatures dropping below 55°F during freezing conditions.',
    status: 'supported',
    supportingEvidenceIds: ['ev_03', 'ev_04'],
    contradictingEvidenceIds: [],
    disputeIds: [],
    assessmentNotes: 'Supported via maintenance outage bulletin and direct room temperature logging across 12 resident units.',
    lastUpdated: '2 hours ago'
  },
  {
    id: 'clm_03',
    observationId: 'obs_03',
    assertionText: 'Surplus fruit at Highland Orchard will spoil on branch if not harvested and distributed to local pantries within 48 hours.',
    status: 'supported',
    supportingEvidenceIds: ['ev_05'],
    contradictingEvidenceIds: [],
    disputeIds: [],
    assessmentNotes: 'Supported by orchard manager survey. Picking permits and food bank recipient logistics arranged.',
    lastUpdated: '4 hours ago'
  },
  {
    id: 'clm_04',
    observationId: 'obs_04',
    assertionText: 'Hazardous industrial chemical solvent is leaking into the public storm ditch at the rail crossing.',
    status: 'disputed',
    supportingEvidenceIds: [],
    contradictingEvidenceIds: ['ev_06'],
    disputeIds: ['disp_01'],
    assessmentNotes: 'Disputed by official municipal Hazmat testing: liquid was confirmed to be non-toxic biodegradable bus wash soap. Substantive challenge on record with spectrometry analysis.',
    lastUpdated: '3 hours ago'
  },
  {
    id: 'clm_05',
    observationId: 'obs_05',
    assertionText: 'Overgrown acacia hedges completely obstruct pedestrian sightline at the 4th & Oakland school crosswalk.',
    status: 'under_assessment',
    supportingEvidenceIds: [],
    contradictingEvidenceIds: [],
    disputeIds: [],
    assessmentNotes: 'Community traffic safety group is documenting morning visibility photos and vehicle approach speeds.',
    lastUpdated: '5 hours ago'
  }
];

export const mockObservations = [
  {
    id: 'obs_01',
    title: 'Severe Silt & Debris Jam at Elm Street Creek Culvert',
    category: 'environmental',
    description: 'Water backing up behind the primary storm grate. Upstream runoff from the steep slope has deposited over 3 feet of gravel and silt. If heavy rains continue, water will crest Elm Street.',
    location: {
      address: 'Elm Street Creek Culvert Inlet, Maplewood',
      neighborhood: 'Maplewood North',
      lat: 37.7818,
      lng: -122.4255
    },
    author: mockUsers[4], // Priya
    timestamp: '2 hours ago',
    mediaUrls: [
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80'
    ],
    status: 'action_underway',
    claimIds: ['clm_01'],
    evidenceIds: ['ev_01', 'ev_02'],
    supportingObservationIds: ['obs_01_sup'],
    contradictoryObservationIds: ['obs_01_contra_sub', 'obs_01_contra'],
    relatedRequestIds: ['req_01', 'req_02'],
    relatedResourceIds: ['res_01', 'res_04'],
    relatedPlanIds: ['plan_01']
  },
  {
    id: 'obs_01_sup',
    title: 'Supporting Observation: Active Clay Bank Slumping 150m Upstream',
    category: 'environmental',
    description: 'Walked the stream path 150m north of Elm St bridge. Fresh bank slumping and fallen willow branch debris is feeding silt directly into the culvert channel.',
    location: {
      address: '150m Upstream Elm St Creek, Maplewood',
      neighborhood: 'Maplewood North',
      lat: 37.7830,
      lng: -122.4240
    },
    author: mockUsers[1], // Dave Martinez
    timestamp: '1.5 hours ago',
    mediaUrls: [
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80'
    ],
    status: 'action_underway',
    isSupporting: true,
    supportingTargetId: 'obs_01',
    claimIds: ['clm_01_sup'],
    parentClaimIds: ['clm_01'],
    evidenceIds: ['ev_01'],
    supportingObservationIds: [],
    contradictoryObservationIds: [],
    relatedRequestIds: ['req_01'],
    relatedResourceIds: ['res_01'],
    relatedPlanIds: ['plan_01']
  },
  {
    id: 'obs_01_contra_sub',
    title: 'Sub-Contradiction: Staff Gauge Zero-Point Shifted 5.5 Inches Upward',
    category: 'infrastructure',
    description: 'Manual inspection reveals staff gauge mounting bracket slipped 5.5 inches upward on the retaining wall pier during the winter freeze, causing the 42" silt reading to overstate actual bed siltation.',
    location: {
      address: 'Upstream Staff Gauge Pier #WC-04, Maplewood',
      neighborhood: 'Maplewood North',
      lat: 37.7821,
      lng: -122.4246
    },
    author: mockUsers[3], // Marcus Thorne
    timestamp: '45 mins ago',
    mediaUrls: [],
    status: 'resolved_disputed',
    isContradiction: true,
    contradictionTargetId: 'obs_01',
    referencedEvidenceId: 'ev_01',
    referencedEvidenceTitle: 'Culvert Water Level & Silt Depth Measurement',
    claimIds: ['clm_01_contra_sub'],
    parentClaimIds: ['clm_01'],
    evidenceIds: [],
    supportingObservationIds: [],
    contradictoryObservationIds: [],
    relatedRequestIds: [],
    relatedResourceIds: [],
    relatedPlanIds: []
  },
  {
    id: 'obs_01_contra',
    title: 'Contradiction: Relief Trench Cleared by City Maintenance at 09:30',
    category: 'infrastructure',
    description: 'City public works backhoe excavated a 2-foot relief channel bypass around the culvert headwall, mitigating immediate overtopping risk.',
    location: {
      address: 'West Overflow Relief Channel, Maplewood',
      neighborhood: 'Maplewood North',
      lat: 37.7825,
      lng: -122.4268
    },
    author: mockUsers[0], // Sarah Chen
    timestamp: '1 hour ago',
    mediaUrls: [
      'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f8?w=600&auto=format&fit=crop&q=80'
    ],
    status: 'under_review',
    isContradiction: true,
    contradictionTargetId: 'obs_01',
    claimIds: ['clm_01_contra'],
    parentClaimIds: ['clm_01'],
    evidenceIds: ['ev_06'],
    supportingObservationIds: [],
    contradictoryObservationIds: ['obs_01_contra_contra'],
    relatedRequestIds: [],
    relatedResourceIds: [],
    relatedPlanIds: []
  },
  {
    id: 'obs_01_contra_contra',
    title: 'Sub-Contradiction: Bank Slump Refilled Excavated Trench by 11:15',
    category: 'environmental',
    description: 'Rapid clay sloughing downstream from the excavation filled the temporary relief trench within 105 minutes. Water level has returned to +38 inches gauge depth.',
    location: {
      address: 'South Creek Embankment Slump, Maplewood',
      neighborhood: 'Maplewood North',
      lat: 37.7812,
      lng: -122.4257
    },
    author: mockUsers[4], // Priya Patel
    timestamp: '25 mins ago',
    mediaUrls: [],
    status: 'action_underway',
    isContradiction: true,
    contradictionTargetId: 'obs_01_contra',
    claimIds: ['clm_01_contra_contra'],
    parentClaimIds: ['clm_01_contra'],
    evidenceIds: [],
    supportingObservationIds: [],
    contradictoryObservationIds: [],
    relatedRequestIds: [],
    relatedResourceIds: [],
    relatedPlanIds: []
  },
  {
    id: 'obs_02',
    title: 'Heating System Failure at Pine Crest Senior Apartments',
    category: 'community_need',
    description: 'Central boiler circulation pump failed during overnight temperature drop to 34°F. 48 residents (many with limited mobility) are experiencing sub-55°F indoor temperatures.',
    location: {
      address: '740 Pine Crest Ave (Boiler Room), Maplewood',
      neighborhood: 'Southside',
      lat: 37.7693,
      lng: -122.4289
    },
    author: mockUsers[2], // Elena
    timestamp: '3 hours ago',
    mediaUrls: [
      'https://images.unsplash.com/photo-1584267385494-9fdd9a71ad75?w=600&auto=format&fit=crop&q=80'
    ],
    status: 'active_need',
    claimIds: ['clm_02'],
    evidenceIds: ['ev_03', 'ev_04'],
    supportingObservationIds: [],
    contradictoryObservationIds: [],
    relatedRequestIds: ['req_03', 'req_04'],
    relatedResourceIds: ['res_02', 'res_05'],
    relatedPlanIds: ['plan_02']
  },
  {
    id: 'obs_03',
    title: 'Ripe Pear & Apple Surplus at Highland Orchard Ready for Gleaning',
    category: 'resource',
    description: 'Orchard trees have produced an exceptional harvest. The owner has donated gleaning access to the mutual aid network to harvest and deliver fruit to 3 local food pantries.',
    location: {
      address: '1200 Highland Ridge Way (Upper Orchard), Maplewood',
      neighborhood: 'East Hills',
      lat: 37.7916,
      lng: -122.4049
    },
    author: mockUsers[3], // Marcus
    timestamp: '5 hours ago',
    mediaUrls: [
      'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&auto=format&fit=crop&q=80'
    ],
    status: 'coordinating',
    claimIds: ['clm_03'],
    evidenceIds: ['ev_05'],
    supportingObservationIds: [],
    contradictoryObservationIds: [],
    relatedRequestIds: ['req_05'],
    relatedResourceIds: ['res_03'],
    relatedPlanIds: ['plan_03']
  },
  {
    id: 'obs_04',
    title: 'Initial Report of Suspicious White Foam at Rail Siding Ditch',
    category: 'safety_concern',
    description: 'Passerby reported dense white bubbling liquid in roadside culvert near the industrial crossing, suspecting possible chemical solvent dump.',
    location: {
      address: 'Industrial Rail Crossing & 8th St (Canal Outfall Gate)',
      neighborhood: 'West Industrial',
      lat: 37.7654,
      lng: -122.4116
    },
    author: mockUsers[1],
    timestamp: '5 hours ago',
    mediaUrls: [
      'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80'
    ],
    status: 'disputed',
    claimIds: ['clm_04'],
    evidenceIds: [],
    supportingObservationIds: [],
    contradictoryObservationIds: ['obs_04_contra'],
    relatedRequestIds: [],
    relatedResourceIds: [],
    relatedPlanIds: []
  },
  {
    id: 'obs_04_contra',
    title: 'Contradictory Observation: Chemical Test Confirms Citrus Bus Soap',
    category: 'environmental',
    description: 'Field inspection and Hazmat analysis confirmed the white liquid is biodegradable citrus vehicle wash detergent draining from the municipal bus depot bay. pH measured 7.2 neutral with zero toxic solvent traces.',
    location: {
      address: 'Industrial Rail Crossing & 8th St (Bus Depot Wash Bay)',
      neighborhood: 'West Industrial',
      lat: 37.7646,
      lng: -122.4104
    },
    author: mockUsers[4], // Priya
    timestamp: '3 hours ago',
    mediaUrls: [
      'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80'
    ],
    status: 'resolved_disputed',
    isContradiction: true,
    contradictionTargetId: 'obs_04',
    claimIds: ['clm_04'],
    evidenceIds: ['ev_06'],
    supportingObservationIds: [],
    contradictoryObservationIds: [],
    relatedRequestIds: [],
    relatedResourceIds: [],
    relatedPlanIds: []
  },
  {
    id: 'obs_05',
    title: 'Crosswalk Sightline Blindspot at 4th & Oakland School Zone',
    category: 'safety_concern',
    description: 'Dense overgrown privacy hedge extends past the curb line, blocking driver vision of children waiting to cross from the north sidewalk.',
    location: {
      address: '4th Ave & Oakland St (NW Crosswalk Corner), Maplewood',
      neighborhood: 'Oakland District',
      lat: 37.7774,
      lng: -122.4354
    },
    author: currentUser,
    timestamp: '6 hours ago',
    mediaUrls: [
      'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=600&auto=format&fit=crop&q=80'
    ],
    status: 'assessing',
    claimIds: ['clm_05'],
    evidenceIds: [],
    supportingObservationIds: [],
    contradictoryObservationIds: [],
    relatedRequestIds: ['req_06'],
    relatedResourceIds: [],
    relatedPlanIds: []
  },
  {
    id: 'obs_06',
    title: 'Turia River Basin High Sediment Accumulation & Embankment Runoff',
    category: 'environmental',
    description: 'Field inspection along Turia dry riverbed section confirms accelerated sediment buildup following torrential Mediterranean rains.',
    location: {
      address: 'Paseo de la Alameda (Turia Basin Silt Checkpoint), Valencia',
      neighborhood: 'Turia Basin',
      lat: 39.4695,
      lng: -0.3770
    },
    author: mockUsers[4],
    timestamp: '4 hours ago',
    mediaUrls: [
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80'
    ],
    status: 'action_underway',
    claimIds: [],
    evidenceIds: [],
    supportingObservationIds: [],
    contradictoryObservationIds: [],
    relatedRequestIds: ['req_07'],
    relatedResourceIds: ['res_06'],
    relatedPlanIds: []
  },
  {
    id: 'obs_07',
    title: 'Puget Sound Coastal High Tide Driftwood Jam at Harbor Pier',
    category: 'environmental',
    description: 'Heavy westerly gusts have pushed floating storm debris and timber against shoreline pilings near the south marina entrance.',
    location: {
      address: 'Harbor Island South Marina Shoreline, Seattle',
      neighborhood: 'Elliott Bay Coast',
      lat: 47.6055,
      lng: -122.3330
    },
    author: mockUsers[1],
    timestamp: '2 hours ago',
    mediaUrls: [
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80'
    ],
    status: 'active_need',
    claimIds: [],
    evidenceIds: [],
    supportingObservationIds: [],
    contradictoryObservationIds: [],
    relatedRequestIds: ['req_08'],
    relatedResourceIds: ['res_07'],
    relatedPlanIds: []
  },
  {
    id: 'obs_08',
    title: 'Tokyo Waterfront Flood Defense & Gate Deployment Check',
    category: 'safety_concern',
    description: 'Volunteer ward monitors inspected tidal surge barriers and automated pump drains across Koto waterfront; all functioning at peak capacity.',
    location: {
      address: 'Koto City Waterfront Automated Surge Gate #4, Tokyo',
      neighborhood: 'Koto Ward',
      lat: 35.6755,
      lng: 139.6490
    },
    author: mockUsers[3],
    timestamp: '5 hours ago',
    mediaUrls: [
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80'
    ],
    status: 'coordinating',
    claimIds: [],
    evidenceIds: [],
    supportingObservationIds: [],
    contradictoryObservationIds: [],
    relatedRequestIds: ['req_09'],
    relatedResourceIds: ['res_08'],
    relatedPlanIds: []
  }
];

export const mockSafetyReports = [
  {
    id: 'safe_01',
    title: 'Flash Flood Risk at Low-Lying River Road & Elm St Crossing',
    description: 'Culvert blockage and continued rainfall could result in 1-2 feet of fast-moving water over Elm Street bridge between 4 PM and 9 PM today.',
    severity: 'high', // 'low' | 'moderate' | 'high' | 'critical'
    status: 'active', // 'reported' | 'being_assessed' | 'active' | 'resolved' | 'disputed' | 'outdated'
    location: {
      address: 'Willow Creek Lower Floodplain & River Rd, Maplewood',
      lat: 37.7810,
      lng: -122.4262
    },
    timestamp: '2 hours ago',
    reporter: mockUsers[4],
    evidenceIds: ['ev_01', 'ev_02'],
    relatedObservationIds: ['obs_01'],
    mitigationActions: [
      'Avoid driving through standing water on Elm St',
      'Volunteers placing sandbag barrier along south bank',
      'High-capacity pump being staged at 1:00 PM'
    ],
    updatesLog: [
      { time: '10:30 AM', note: 'Initial creek height alert posted by Priya.' },
      { time: '11:45 AM', note: 'Emergency sandbagging request created; 120 bags already filled.' }
    ]
  },
  {
    id: 'safe_02',
    title: 'Hypothermia Vulnerability Alert for Pine Crest Seniors',
    description: 'Unheated multi-unit complex during sub-freezing night. Immediate warming shelter supplies and welfare checks in progress.',
    severity: 'critical',
    status: 'active',
    location: {
      address: '740 Pine Crest Ave (Senior Living Tower A), Maplewood',
      lat: 37.7686,
      lng: -122.4282
    },
    timestamp: '3 hours ago',
    reporter: mockUsers[2],
    evidenceIds: ['ev_03', 'ev_04'],
    relatedObservationIds: ['obs_02'],
    mitigationActions: [
      'Distribute portable oil-filled radiator heaters (safe for indoor use)',
      'Deliver insulated fleece blankets and hot thermos meals',
      'Welfare checks on ground floor and north-facing units'
    ],
    updatesLog: [
      { time: '8:45 AM', note: 'Facility manager alerted; Elena coordinating volunteer heater dispatch.' }
    ]
  },
  {
    id: 'safe_03',
    title: 'Flash Flood Runoff & Mudflow Warning - Turia River Basin',
    description: 'Rapid stormwater surge in low-lying river tributaries. Volunteer emergency sandbagging and welfare checks deployed.',
    severity: 'high',
    status: 'active',
    location: {
      address: 'Paseo de la Alameda (Turia Underpass Crossing), Valencia',
      lat: 39.4688,
      lng: -0.3760
    },
    timestamp: '4 hours ago',
    reporter: mockUsers[1],
    evidenceIds: [],
    relatedObservationIds: ['obs_06'],
    mitigationActions: [
      'Stage submersible drainage pumps near underpass tunnels',
      'Distribute battery emergency lighting and drinking water'
    ],
    updatesLog: [
      { time: '08:30 AM', note: 'Regional civil alert received; volunteer coordinator mobilized.' }
    ]
  },
  {
    id: 'safe_04',
    title: 'Coastal Windstorm & Power Grid Outage Precaution',
    description: 'Sustained 60mph gusts causing downed branches and localized power outages across Puget Sound communities.',
    severity: 'moderate',
    status: 'active',
    location: {
      address: 'Harbor Island North Access Bridge, Seattle',
      lat: 47.6050,
      lng: -122.3310
    },
    timestamp: '1 hour ago',
    reporter: mockUsers[3],
    evidenceIds: [],
    relatedObservationIds: ['obs_07'],
    mitigationActions: [
      'Deploy chainsaw volunteer crews for cleared access roads',
      'Open backup battery charging stations for medical devices'
    ],
    updatesLog: [
      { time: '11:15 AM', note: 'Neighborhood watch verifying senior care facility power generators.' }
    ]
  },
  {
    id: 'safe_05',
    title: 'Tokyo Waterfront Tidal Surge & Barrier Deployment Alert',
    description: 'Offshore earthquake alert triggered precautionary flood gate protocols along Tokyo coastal districts.',
    severity: 'moderate',
    status: 'active',
    location: {
      address: 'Koto City Waterfront Surge Embankment Wall, Tokyo',
      lat: 35.6750,
      lng: 139.6520
    },
    timestamp: '3 hours ago',
    reporter: mockUsers[4],
    evidenceIds: [],
    relatedObservationIds: ['obs_08'],
    mitigationActions: [
      'High-ground assembly signs illuminated at community centers',
      'Emergency satellite communication kits activated'
    ],
    updatesLog: [
      { time: '02:00 PM', note: 'All coastal monitoring water sensors transmitting normal levels.' }
    ]
  }
];

export const mockRequests = [
  {
    id: 'req_01',
    title: 'Need 6 Volunteers & 200 Sandbags at Elm St Culvert',
    description: 'Urgent assistance needed to build a 3-foot retaining diversion wall and manually clear tree branches from the culvert intake before evening downpour.',
    category: 'labor',
    location: {
      address: 'Elm St Park Trailhead & Sandbag Staging Depot, Maplewood',
      lat: 37.7816,
      lng: -122.4239
    },
    urgency: 'high', // 'low' | 'medium' | 'high' | 'critical'
    requiredSkills: ['Heavy Lifting', 'Shoveling', 'Safety Awareness'],
    requiredResources: ['Sandbags', 'Shovels', 'High-Vis Vests', 'Work Gloves'],
    peopleNeeded: 6,
    peopleJoined: 4,
    progressPercentage: 66,
    status: 'open', // 'open' | 'partially_fulfilled' | 'fulfilled' | 'cancelled' | 'expired'
    communityId: 'com_01',
    visibility: 'public',
    requester: mockUsers[1], // Dave Martinez
    createdAt: '2 hours ago',
    scheduledDate: 'Today, Oct 24',
    scheduledTime: '1:00 PM – 4:00 PM',
    expiresAt: 'Today at 6:00 PM',
    evidenceIds: ['ev_01'],
    matchedResourceIds: ['res_01'],
    quickActions: [
      {
        id: 'qa_02',
        title: 'Stack 25 Sandbags along Elm Street South Bank',
        actionType: 'volunteer',
        timeEstimate: '30 mins',
        neededContribution: 'Help Dave and Priya reinforce the 2nd layer of the diversion wall'
      }
    ],
    responses: [
      { user: currentUser, role: 'Volunteer - Sandbag stacking', time: '1 hour ago' },
      { user: mockUsers[4], role: 'Water level monitoring', time: '1.5 hours ago' }
    ]
  },
  {
    id: 'req_02',
    title: 'Need High-Capacity Trash Pump (3"+) & 50ft Discharge Hose',
    description: 'To bypass blocked intake and pump water directly into the lower basin pond to relieve pressure on the road embankment.',
    category: 'equipment',
    location: {
      address: 'Elm St Creek Bridge & Bypass Pump Sump, Maplewood',
      lat: 37.7814,
      lng: -122.4251
    },
    urgency: 'critical',
    requiredSkills: ['Small Engine Operation'],
    requiredResources: ['3-inch Gas Water Pump', 'Rigid Suction Hose'],
    peopleNeeded: 1,
    peopleJoined: 1,
    progressPercentage: 100,
    status: 'fulfilled',
    communityId: 'com_01',
    visibility: 'public',
    requester: mockUsers[4], // Priya
    createdAt: '3 hours ago',
    matchedResourceIds: ['res_01'],
    quickActions: [],
    responses: [
      { user: mockUsers[1], role: 'Supplying Honda WT30X 3" Trash Pump + fuel', time: '2 hours ago' }
    ]
  },
  {
    id: 'req_03',
    title: 'Urgent: 12 Safe Space Heaters & Heated Blankets for Seniors',
    description: 'Radiant oil-filled heaters (tip-over auto shutoff certified) and heavy thermal blankets for Pine Crest Manor residents.',
    category: 'supplies',
    location: {
      address: '740 Pine Crest Ave (Main Lobby Distribution), Maplewood',
      lat: 37.7696,
      lng: -122.4280
    },
    urgency: 'high',
    requiredSkills: ['Safe Electrical Inspection'],
    requiredResources: ['Radiator Heaters', 'Heavy Blankets', 'Thermos Flasks'],
    peopleNeeded: 4,
    peopleJoined: 3,
    progressPercentage: 75,
    status: 'partially_fulfilled',
    communityId: 'com_02',
    visibility: 'public',
    requester: mockUsers[2], // Elena
    createdAt: '3 hours ago',
    scheduledDate: 'Today, Oct 24',
    scheduledTime: '11:00 AM – 2:00 PM',
    matchedResourceIds: ['res_02'],
    quickActions: [
      {
        id: 'qa_01',
        title: 'Deliver 3 Heated Blankets to Unit 204 at Pine Crest Manor',
        actionType: 'deliver',
        timeEstimate: '20 mins',
        neededContribution: 'Drop off pre-packed blankets at lobby desk with attendant'
      }
    ],
    responses: [
      { user: currentUser, role: 'Delivering 4 electric heaters and 6 blankets', time: '1 hour ago' }
    ]
  },
  {
    id: 'req_04',
    title: 'Need AWD / 4WD Vehicle to Transport 4 Seniors to Community Center',
    description: 'Four residents with mobility walkers need gentle transport to the heated Eastside Community Center for daytime warming and hot lunch.',
    category: 'transport',
    location: {
      address: '740 Pine Crest Ave (West Loading Bay), Maplewood',
      lat: 37.7682,
      lng: -122.4293
    },
    urgency: 'medium',
    requiredSkills: ['Gentle Mobility Assistance', 'Safe Winter Driving'],
    requiredResources: ['AWD/4WD Vehicle with low threshold step'],
    peopleNeeded: 2,
    peopleJoined: 1,
    progressPercentage: 50,
    status: 'open',
    communityId: 'com_02',
    visibility: 'group_only',
    requester: mockUsers[2],
    createdAt: '2 hours ago',
    matchedResourceIds: ['res_05'],
    quickActions: [
      {
        id: 'qa_03',
        title: 'Drive Mrs. Clara (Age 84) to Eastside Warming Center',
        actionType: 'transport',
        timeEstimate: '25 mins',
        neededContribution: 'Warm car ride with space for lightweight folding walker'
      }
    ],
    responses: []
  },
  {
    id: 'req_05',
    title: 'Volunteers Needed: Pick & Crate 800 lbs of Pears at Highland Ridge',
    description: 'Join a gleaning crew! Bring reusable gloves. Harvest will be packed directly into crates for the Maplewood Food Bank and Senior Pantry.',
    category: 'skills',
    location: {
      address: '1200 Highland Ridge Way (Harvest Sorting Station), Maplewood',
      lat: 37.7911,
      lng: -122.4040
    },
    urgency: 'low',
    requiredSkills: ['Fruit Picking', 'Gentle Handling'],
    requiredResources: ['Harvest Crates', 'Fruit Picking Poles'],
    peopleNeeded: 10,
    peopleJoined: 8,
    progressPercentage: 80,
    status: 'open',
    communityId: 'com_03',
    visibility: 'public',
    requester: mockUsers[3],
    createdAt: '4 hours ago',
    scheduledDate: 'Saturday, Oct 26',
    scheduledTime: '9:30 AM – 1:30 PM',
    matchedResourceIds: ['res_03'],
    quickActions: [
      {
        id: 'qa_04',
        title: 'Collect & Wash 2 Crates of Fresh Pears for Senior Lunch',
        actionType: 'volunteer',
        timeEstimate: '45 mins',
        neededContribution: 'Pick ripe pears from lower branches and crate for kitchen dropoff'
      }
    ],
    responses: []
  },
  {
    id: 'req_06',
    title: 'Hedge Trimming & Sightline Clearing at 4th & Oakland School Walk',
    description: 'Property owner gave permission to trim the 20ft hedge back to 3ft height. Need 2 people with electric hedge trimmers and branch shears.',
    category: 'labor',
    location: {
      address: '4th Ave & Oakland St (Sidewalk Staging Area), Maplewood',
      lat: 37.7768,
      lng: -122.4346
    },
    urgency: 'medium',
    requiredSkills: ['Hedge Trimmer Operation', 'Debris Bagging'],
    requiredResources: ['Pole Trimmer', 'Yard Waste Bags'],
    peopleNeeded: 2,
    peopleJoined: 1,
    progressPercentage: 50,
    status: 'open',
    communityId: 'com_04',
    visibility: 'public',
    requester: currentUser,
    createdAt: '5 hours ago',
    scheduledDate: 'Sunday, Oct 27',
    scheduledTime: '10:00 AM – 12:00 PM',
    matchedResourceIds: [],
    quickActions: [],
    responses: []
  },
  {
    id: 'req_07',
    title: 'Urgent: 4 Volunteers for High-Capacity Water Pump Deployment',
    description: 'Need volunteers to stage drainage pumps and position discharge lines along flooded community alleyways near Turia basin.',
    category: 'labor',
    location: {
      address: 'Paseo de la Alameda (Alleyway Drainage Staging), Valencia',
      lat: 39.4712,
      lng: -0.3755
    },
    urgency: 'high',
    requiredSkills: ['Pump Handling', 'Flood Water Safety'],
    requiredResources: ['Rubber Boots', 'Work Gloves', 'High-Vis Vests'],
    peopleNeeded: 4,
    peopleJoined: 2,
    progressPercentage: 50,
    status: 'open',
    communityId: 'com_01',
    visibility: 'group_only',
    requester: mockUsers[1],
    createdAt: '3 hours ago',
    scheduledDate: 'Today, Oct 24',
    scheduledTime: '2:00 PM – 5:00 PM',
    matchedResourceIds: ['res_06'],
    quickActions: [],
    responses: []
  },
  {
    id: 'req_08',
    title: 'Emergency Power & Battery Charging for Home Medical Equipment',
    description: 'Power grid down across harbor neighborhood. Seeking portable power stations to keep continuous oxygen concentrators powered.',
    category: 'equipment',
    location: {
      address: 'Harbor Island Community First Aid Shelter, Seattle',
      lat: 47.6070,
      lng: -122.3315
    },
    urgency: 'critical',
    requiredSkills: ['Electrical Safety', 'Equipment Handling'],
    requiredResources: ['Portable Battery Stations', 'Extension Cords'],
    peopleNeeded: 3,
    peopleJoined: 2,
    progressPercentage: 66,
    status: 'open',
    communityId: null,
    visibility: 'public',
    requester: mockUsers[3],
    createdAt: '1 hour ago',
    matchedResourceIds: ['res_07'],
    quickActions: [],
    responses: []
  },
  {
    id: 'req_09',
    title: 'Volunteer Evacuation Guides for Multilingual Community Members',
    description: 'Volunteers fluent in English, Japanese, and Portuguese to assist waterfront residents with flood evacuation maps and bus shuttles.',
    category: 'skills',
    location: {
      address: 'Koto City Waterfront Multilingual Evacuation Hub, Tokyo',
      lat: 35.6770,
      lng: 139.6515
    },
    urgency: 'medium',
    requiredSkills: ['Language Translation', 'Emergency Wayfinding'],
    requiredResources: ['Megaphones', 'Directional Signs'],
    peopleNeeded: 5,
    peopleJoined: 4,
    progressPercentage: 80,
    status: 'open',
    communityId: null,
    visibility: 'public',
    requester: mockUsers[4],
    createdAt: '4 hours ago',
    matchedResourceIds: ['res_08'],
    quickActions: [],
    responses: []
  },
  {
    id: 'req_10',
    title: 'Planning Circle: Willow Creek Watershed Phase 2 Restoration',
    description: 'Open community coordination session discussing Phase 2 riparian willow planting, culvert restructuring, and water quality telemetry grant applications.',
    category: 'skills',
    location: {
      address: 'Willow Creek Watershed Action Pavilion, Maplewood',
      lat: 37.7827,
      lng: -122.4258
    },
    urgency: 'medium',
    requiredSkills: ['Hydrology Planning', 'Grant Coordination', 'Community Outreach'],
    requiredResources: ['Presentation Slides', 'Hydrology Maps'],
    peopleNeeded: 8,
    peopleJoined: 4,
    progressPercentage: 50,
    status: 'open',
    communityId: 'com_01',
    visibility: 'public',
    requester: mockUsers[4], // Priya
    createdAt: '6 hours ago',
    scheduledDate: 'Monday, Oct 28',
    scheduledTime: '7:00 PM – 8:30 PM',
    evidenceIds: ['ev_01'],
    matchedResourceIds: ['res_04'],
    quickActions: [],
    responses: [
      { user: currentUser, role: 'Reviewing hydraulic models', time: '2 hours ago' },
      { user: mockUsers[1], role: 'Site access survey', time: '3 hours ago' }
    ]
  },
  {
    id: 'req_11',
    title: 'Equipment Calibration & Cache Readiness Session',
    description: 'Hands-on session to test, clean, and inventory shared trash pumps, suction lines, and water turbidity probes ahead of expected winter storm cycles.',
    category: 'equipment',
    location: {
      address: 'Elm Street Creek Action Shed, Maplewood',
      lat: 37.7820,
      lng: -122.4245
    },
    urgency: 'low',
    requiredSkills: ['Small Engine Maintenance', 'Tool Inventory'],
    requiredResources: ['Spark Plug Wrenches', 'Engine Oil', 'Replacement Air Filters'],
    peopleNeeded: 4,
    peopleJoined: 3,
    progressPercentage: 75,
    status: 'open',
    communityId: 'com_01',
    visibility: 'group_only',
    requester: mockUsers[1], // Dave
    createdAt: '1 day ago',
    scheduledDate: 'Wednesday, Oct 30',
    scheduledTime: '5:30 PM – 7:30 PM',
    evidenceIds: [],
    matchedResourceIds: ['res_01'],
    quickActions: [],
    responses: []
  },
  {
    id: 'req_12',
    title: 'CERT Neighborhood Radio Check & Medical Cache Inventory',
    description: 'Regular neighborhood communication check over GMRS/FRS radios and audit of emergency first aid and heating supplies at Southside warming center.',
    category: 'skills',
    location: {
      address: '740 Pine Crest Ave (Southside Warming Center Radio Room), Maplewood',
      lat: 37.7690,
      lng: -122.4273
    },
    urgency: 'medium',
    requiredSkills: ['Radio Operation', 'First Aid Inventory'],
    requiredResources: ['GMRS Handheld Radios', 'First Aid Stock Checklists'],
    peopleNeeded: 6,
    peopleJoined: 5,
    progressPercentage: 83,
    status: 'open',
    communityId: 'com_02',
    visibility: 'public',
    requester: mockUsers[2], // Elena
    createdAt: '1 day ago',
    scheduledDate: 'Friday, Nov 1',
    scheduledTime: '6:00 PM – 7:30 PM',
    evidenceIds: [],
    matchedResourceIds: ['res_02'],
    quickActions: [],
    responses: []
  },
  {
    id: 'req_caleb_01',
    title: 'Emergency Mesh Radio Relay Installation at Highland Ridge',
    description: 'Deploying a permanent solar-powered LoRa mesh radio repeater tower to ensure neighborhood communications survive regional grid outages.',
    category: 'equipment',
    location: {
      address: 'Highland Ridge Lookout Tower, Maplewood',
      lat: 37.7925,
      lng: -122.4035
    },
    urgency: 'high',
    requiredSkills: ['Radio Electronics', 'Tower Rigging', 'Solar Wiring'],
    requiredResources: ['LoRa Repeater Kit', '100W Solar Panel', 'Mast Mounts'],
    peopleNeeded: 3,
    peopleJoined: 3,
    progressPercentage: 100,
    status: 'fulfilled',
    communityId: 'com_01',
    visibility: 'public',
    requester: mockUsers[5], // Caleb Zothansanga
    createdAt: '2 days ago',
    scheduledDate: 'Sunday, Oct 20',
    scheduledTime: '9:00 AM – 2:00 PM',
    evidenceIds: [],
    matchedResourceIds: [],
    quickActions: [],
    responses: [
      { user: mockUsers[1], role: 'Tower rigging & bracket installation', time: '2 days ago' },
      { user: mockUsers[3], role: 'Highland site access & power staging', time: '2 days ago' },
      { user: currentUser, role: 'Frequency calibration & packet testing', time: '2 days ago' }
    ]
  },
  {
    id: 'req_caleb_02',
    title: 'Backup Solar Battery Bank Deployment at Eastside Center',
    description: 'Installing lithium iron phosphate battery backup arrays to keep medical refrigeration and community phone charging active during outages.',
    category: 'labor',
    location: {
      address: 'Eastside Aid Center & Resilience Hub, Maplewood',
      lat: 37.7750,
      lng: -122.4190
    },
    urgency: 'medium',
    requiredSkills: ['Electrical Wiring', 'Battery Inverter Setup'],
    requiredResources: ['LiFePO4 Battery Unit', 'Pure Sine Inverter', 'Heavy Gauged Cables'],
    peopleNeeded: 4,
    peopleJoined: 3,
    progressPercentage: 75,
    status: 'open',
    communityId: 'com_01',
    visibility: 'public',
    requester: mockUsers[5], // Caleb Zothansanga
    createdAt: '1 day ago',
    scheduledDate: 'Saturday, Nov 2',
    scheduledTime: '10:00 AM – 3:00 PM',
    evidenceIds: [],
    matchedResourceIds: [],
    quickActions: [],
    responses: [
      { user: mockUsers[4], role: 'Inverter safety and grounding inspection', time: '18 hours ago' },
      { user: mockUsers[2], role: 'Cold-chain vaccine fridge power circuit check', time: '12 hours ago' }
    ]
  },
  {
    id: 'req_caleb_03',
    title: 'Elderly Transit & Warming Shuttle Route Coordination',
    description: 'Coordinating AWD vehicles to safely transport vulnerable elderly neighbors from unheated homes to the Southside Warming Shelter.',
    category: 'transportation',
    location: {
      address: 'Pine Crest Manor to Central Shelter Corridor, Maplewood',
      lat: 37.7695,
      lng: -122.4280
    },
    urgency: 'critical',
    requiredSkills: ['4WD Driving', 'Senior Assistance', 'First Aid'],
    requiredResources: ['AWD Vehicles', 'Wheelchair Transfer Belts', 'Fleece Blankets'],
    peopleNeeded: 2,
    peopleJoined: 2,
    progressPercentage: 100,
    status: 'fulfilled',
    communityId: 'com_02',
    visibility: 'public',
    requester: mockUsers[2], // Elena Rostova
    createdAt: '3 days ago',
    scheduledDate: 'Friday, Oct 18',
    scheduledTime: '1:00 PM – 5:00 PM',
    evidenceIds: [],
    matchedResourceIds: [],
    quickActions: [],
    responses: [
      { user: mockUsers[5], role: 'Route logistics coordinator & AWD vehicle driver', time: '3 days ago' },
      { user: mockUsers[1], role: 'Wheelchair transfer support', time: '3 days ago' }
    ]
  }
];

export const mockResources = [
  {
    id: 'res_01',
    title: 'Honda 3-Inch Commercial Trash Pump (380 GPM) + 100ft Hoses',
    description: 'Heavy duty dewatering pump on wheeled cart with intake strainer, 20ft suction hose and 100ft lay-flat discharge hose. Runs on standard gas.',
    category: 'equipment',
    contributionType: 'lend', // 'donate' | 'lend' | 'make_available' | 'offer_skill' | 'offer_time' | 'offer_transportation'
    provider: mockUsers[1], // Dave
    location: {
      address: 'Willow Valley Rd, Maplewood',
      lat: 37.7833,
      lng: -122.4167
    },
    availability: 'immediate', // 'immediate' | 'scheduled' | 'on_call'
    quantity: '1 Unit + Full Gas Tank',
    condition: 'Community equipment / Tested this morning',
    conditionsTerms: 'Will deliver to site and demonstrate operation if needed.',
    validUntil: 'Available through weekend',
    linkedRequestIds: ['req_02']
  },
  {
    id: 'res_02',
    title: '6 Oil-Filled Safe Radiator Heaters & 10 Fleece Blankets',
    description: 'Quiet, sealed electric radiator heaters with tip-over auto-cutoffs and digital thermostats. Safe for senior living apartments.',
    category: 'supplies',
    contributionType: 'lend',
    provider: currentUser,
    location: {
      address: 'Eastside District Equipment Cache, Maplewood',
      lat: 37.7753,
      lng: -122.4190
    },
    availability: 'immediate',
    quantity: '6 Heaters + 10 Blankets',
    condition: 'Inspected and cleaned',
    conditionsTerms: 'Can drop off at Pine Crest Manor lobby immediately.',
    validUntil: 'Until boiler is repaired',
    linkedRequestIds: ['req_03']
  },
  {
    id: 'res_03',
    title: '15 Harvest Crates, 4 Telescoping Fruit Pickers & Food Dehydrator',
    description: 'Food-grade stacking harvest bins, extendable 12ft pole pickers with foam baskets, plus 10-tray stainless food dehydrator for surplus preservation.',
    category: 'equipment',
    contributionType: 'make_available',
    provider: mockUsers[3], // Marcus
    location: {
      address: '1200 Highland Ridge Way (Equipment Tool Shed), Maplewood',
      lat: 37.7907,
      lng: -122.4046
    },
    availability: 'immediate',
    quantity: 'Full Set',
    condition: 'Sanitized & Ready',
    conditionsTerms: 'Available at orchard shed for all community gleaners.',
    validUntil: 'Open access',
    linkedRequestIds: ['req_05']
  },
  {
    id: 'res_04',
    title: 'Certified Water Quality Lab Testing & Hydrology Assessment',
    description: 'Offering portable photometer testing for turbidity, dissolved oxygen, pH, nitrates, and drone orthophoto mapping for runoff patterns.',
    category: 'skills',
    contributionType: 'offer_skill',
    provider: mockUsers[4], // Priya
    location: {
      address: 'Elm St Creek Path (Mobile Testing Station), Maplewood',
      lat: 37.7807,
      lng: -122.4242
    },
    availability: 'on_call',
    quantity: '5-10 tests / day',
    condition: 'Calibrated laboratory sensors',
    conditionsTerms: 'Free for public watershed restoration and flood prevention.',
    validUntil: 'Ongoing',
    linkedRequestIds: ['req_01']
  },
  {
    id: 'res_05',
    title: 'Subaru Outback AWD (7-Seater) with Low-Step Entry for Mobility Transport',
    description: 'Clean, heated AWD vehicle with ample trunk space for folding walkers and wheelchairs. Available for non-emergency medical & warming transport.',
    category: 'transport',
    contributionType: 'offer_transportation',
    provider: currentUser,
    location: {
      address: 'Maplewood Central Transit Staging',
      lat: 37.7745,
      lng: -122.4198
    },
    availability: 'scheduled',
    quantity: '4 Passenger seats + luggage',
    condition: 'Equipped with winter tires',
    conditionsTerms: 'Available today 12:00 PM - 5:00 PM.',
    validUntil: 'Today',
    linkedRequestIds: ['req_04']
  },
  {
    id: 'res_06',
    title: '4 Commercial Submersible Drainage Pumps + 200m Hose',
    description: 'Electric 2-inch submersible pumps capable of discharging 250 liters/min. Equipped with heavy-duty thermal cutoff and camlock hose adapters.',
    category: 'equipment',
    contributionType: 'lend',
    provider: mockUsers[1],
    location: {
      address: 'Paseo de la Alameda (Equipment Logistics Depot), Valencia',
      lat: 39.4705,
      lng: -0.3780
    },
    availability: 'immediate',
    quantity: '4 Pumps + Accessories',
    condition: 'Fully inspected and ready',
    conditionsTerms: 'Will assist with initial installation at community sites.',
    validUntil: 'Until storm passes',
    linkedRequestIds: ['req_07']
  },
  {
    id: 'res_07',
    title: 'EcoFlow 3600Wh Portable Power Station & 400W Solar Array',
    description: 'High-capacity battery station with 3600W AC output (surge 7200W). Clean, fume-free indoor power for medical gear and communication rigs.',
    category: 'equipment',
    contributionType: 'lend',
    provider: mockUsers[3],
    location: {
      address: 'Harbor Island South Staging Pier, Seattle',
      lat: 47.6068,
      lng: -122.3335
    },
    availability: 'immediate',
    quantity: '1 Power Station + 2 Solar Panels',
    condition: '100% charged and tested',
    conditionsTerms: 'Priority for critical medical equipment support.',
    validUntil: 'Through power restoration',
    linkedRequestIds: ['req_08']
  },
  {
    id: 'res_08',
    title: '50 Clean Water Filtration Gravity Cubes & Emergency Rations',
    description: '0.1-micron hollow-fiber membrane filters providing 5,000 liters of potable water per day without electricity or chemicals.',
    category: 'supplies',
    contributionType: 'donate',
    provider: mockUsers[4],
    location: {
      address: 'Koto City Waterfront Emergency Distribution Depot, Tokyo',
      lat: 35.6768,
      lng: 139.6485
    },
    availability: 'immediate',
    quantity: '50 Filter Kits + 200 Meal Packs',
    condition: 'Factory sealed in waterproof crates',
    conditionsTerms: 'Free allocation for waterfront displacement centers.',
    validUntil: 'Ongoing',
    linkedRequestIds: ['req_09']
  }
];

// Helper to derive Quick Actions directly from Requests
export const mockQuickActions = mockRequests.flatMap(req => 
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

export const mockMatchingFactors = [
  {
    id: 'match_01',
    requestId: 'req_04',
    resourceId: 'res_05',
    requestTitle: 'Need AWD Vehicle to Transport 4 Seniors to Community Center',
    resourceTitle: 'Subaru Outback AWD (7-Seater) with Low-Step Entry',
    status: 'Ready to Coordinate',
    factors: [
      { label: 'Location Proximity', status: 'pass', text: 'Within 1.8 miles (Eastside to Southside corridor)' },
      { label: 'Category & Mode', status: 'pass', text: 'Passenger transport matching elderly mobility requirements' },
      { label: 'Capacity Available', status: 'pass', text: '4 passenger seats available (exact requirement: 4 seats)' },
      { label: 'Equipment Fit', status: 'pass', text: 'Low-threshold step and trunk space for folding walkers' },
      { label: 'Schedule Alignment', status: 'warn', text: 'Available today 12:00 PM – 5:00 PM (Requires pickup time sync)' }
    ]
  },
  {
    id: 'match_02',
    requestId: 'req_02',
    resourceId: 'res_01',
    requestTitle: 'Need High-Capacity Trash Pump (3"+) & 50ft Discharge Hose',
    resourceTitle: 'Honda 3-Inch Commercial Trash Pump (380 GPM) + 100ft Hoses',
    status: 'Coordinated / Fulfilled',
    factors: [
      { label: 'Location Proximity', status: 'pass', text: 'Under 1.2 miles from Elm St culvert intake' },
      { label: 'Specification Match', status: 'pass', text: 'Exact match: 3-inch high-solids suction & discharge' },
      { label: 'Pumping Capacity', status: 'pass', text: '380 GPM capacity exceeds 200 GPM overflow rate' },
      { label: 'Availability', status: 'pass', text: 'Immediate on-site delivery provided by Dave' }
    ]
  },
  {
    id: 'match_03',
    requestId: 'req_03',
    resourceId: 'res_02',
    requestTitle: 'Urgent: 12 Safe Space Heaters & Heated Blankets for Seniors',
    resourceTitle: '6 Oil-Filled Safe Radiator Heaters & 10 Fleece Blankets',
    status: 'Active Delivery',
    factors: [
      { label: 'Safety Compliance', status: 'pass', text: 'Sealed oil-filled units comply with senior building fire code' },
      { label: 'Quantity Supply', status: 'pass', text: '6 of 12 required heaters supplied + 10 blankets' },
      { label: 'Delivery Proximity', status: 'pass', text: '1.5 miles from Pine Crest Manor lobby' }
    ]
  },
  {
    id: 'match_04',
    requestId: 'req_05',
    resourceId: 'res_03',
    requestTitle: 'Volunteers Needed: Pick & Crate 800 lbs of Pears',
    resourceTitle: '15 Harvest Crates, 4 Telescoping Fruit Pickers',
    status: 'Equipment Staged',
    factors: [
      { label: 'Location Match', status: 'pass', text: 'Direct on-site availability at Highland Ridge Orchard shed' },
      { label: 'Equipment Utility', status: 'pass', text: '15 food-grade stacking bins + 4 pole pickers' },
      { label: 'Open Access Terms', status: 'pass', text: 'Free access for all registered community gleaners' }
    ]
  }
];

export const mockEvents = [
  {
    id: 'evt_01',
    title: 'Willow Creek Riparian Tree Planting & Silt Cleanup Work Party',
    eventType: 'custom',
    customEventType: 'Riparian Watershed Planting',
    isCustomEventType: true,
    attendeePrivacy: 'public',
    chatPrivacy: 'members_only',
    description: 'Community riparian restoration session to plant 80 native willow saplings and clear storm sediment basins before heavy rains.',
    location: {
      address: 'Willow Creek Trailhead, Maplewood',
      lat: 37.7798,
      lng: -122.4285
    },
    date: 'Saturday, Oct 24',
    time: '9:00 AM - 1:00 PM',
    organizer: mockUsers[0],
    participants: [mockUsers[0], mockUsers[1], mockUsers[4]],
    maxParticipants: 25,
    status: 'upcoming',
    relatedRequestIds: ['req_01'],
    relatedResourceIds: ['res_01'],
    relatedPlanIds: ['plan_01'],
    chatMessages: [
      { id: 'm_01', sender: mockUsers[0], text: 'Bring sturdy waterproof boots and work gloves. Shovels and saplings are staged on site!', time: 'Yesterday' },
      { id: 'm_02', sender: mockUsers[1], text: 'I am bringing the wheelbarrow and 4 extra spade shovels.', time: '3 hours ago' }
    ]
  },
  {
    id: 'evt_02',
    title: 'Emergency Sandbagging Operation at Elm Street Crossing',
    eventType: 'assistance_operation',
    customEventType: null,
    isCustomEventType: false,
    attendeePrivacy: 'members_only',
    chatPrivacy: 'members_only',
    description: 'Pre-emptive flood barrier staging along low-lying river bank to protect residential culverts during forecast precipitation.',
    location: {
      address: 'River Road & Elm St Culvert Depository, Maplewood',
      lat: 37.7810,
      lng: -122.4262
    },
    date: 'Today, 2:00 PM',
    time: '2:00 PM - 5:30 PM',
    organizer: mockUsers[1],
    participants: [mockUsers[1], mockUsers[2]],
    maxParticipants: 15,
    status: 'upcoming',
    relatedRequestIds: ['req_02'],
    relatedResourceIds: [],
    relatedPlanIds: [],
    chatMessages: [
      { id: 'm_03', sender: mockUsers[1], text: 'Two pallets of empty burlap bags have arrived. Need volunteer shovel rotations.', time: '1 hour ago' }
    ]
  },
  {
    id: 'evt_03',
    title: 'Community Solar Microgrid & Water Telemetry Workshop',
    eventType: 'workshop',
    customEventType: null,
    isCustomEventType: false,
    attendeePrivacy: 'public',
    chatPrivacy: 'public',
    description: 'Hands-on practical session teaching neighbors how to build and maintain open-source IoT water conductivity sensors and off-grid battery monitors.',
    location: {
      address: 'Maplewood Community Center, Workshop Room B',
      lat: 37.7749,
      lng: -122.4194
    },
    date: 'Sunday, Oct 25',
    time: '11:00 AM - 2:00 PM',
    organizer: mockUsers[4],
    participants: [mockUsers[4], mockUsers[3]],
    maxParticipants: 20,
    status: 'upcoming',
    relatedRequestIds: [],
    relatedResourceIds: ['res_02'],
    relatedPlanIds: ['plan_01'],
    chatMessages: [
      { id: 'm_04', sender: mockUsers[4], text: 'We have 10 breadboard sensor kits ready for assembly. Open to all skill levels!', time: '2 days ago' }
    ]
  }
];

export const mockPlans = [
  {
    id: 'plan_01',
    title: 'Restore the Damaged Community Water Source & Willow Creek Springhead',
    problemStatement: 'The historic gravity-fed natural spring and stone catchment weir on Upper Willow Ridge—which serves as the sole off-grid backup drinking water source for 40 hillside households during power cuts—was heavily contaminated by upstream landslide silt, cracked stone channels, and runoff after recent severe storms.',
    desiredOutcome: 'Restore continuous gravity-fed potable water flow (target: 45 L/min at < 5 NTU turbidity), construct durable bio-engineered gravel pre-filters, prevent downstream sediment intrusion into the yellow-billed cuckoo sanctuary, and establish community water purity telemetry with volunteer maintenance protocols.',
    proposedApproach: 'Deploy volunteer work teams to hand-clear 120ft of clogged stone conduit during the November dry window, install a 3-tier bio-retention rock filter bed, anchor an 80ft geotextile sediment curtain, and install solar-powered IoT water purity sensors.',
    resourcesNeeded: '15 tons washed basalt/river gravel, 80ft geotextile silt curtain, 400 linear feet food-grade poly pipe, 4 certified water coliform testing kits, 1 solar turbidity sensor beacon, 6 scheduled volunteer action sessions.',
    location: 'Willow Creek Springhead & Upper Ridge Trailhead, Maplewood',
    affectedParties: '40 hillside households relying on gravity backup, downstream yellow-billed cuckoo nesting sanctuary (200m south), Ridge Trail hikers and foragers.',
    lifecycleStage: 'community_review', // 'draft' | 'community_review' | 'revised' | 'accepted' | 'active' | 'completed' | 'cancelled'
    overallStatus: 'planning', // 'planning' | 'in_progress' | 'blocked' | 'completed' | 'cancelled'
    currentVersion: 'v1.1',
    proposer: currentUser,
    participants: [
      { user: currentUser, role: 'Proposal Author & Lead Coordinator', joinedAt: '3 weeks ago' },
      { user: mockUsers[4], role: 'Lead Hydrologist & Scientific Advisor', joinedAt: '3 weeks ago' },
      { user: mockUsers[1], role: 'Construction & Equipment Lead', joinedAt: '2 weeks ago' },
      { user: mockUsers[0], role: 'Environmental Science Lead', joinedAt: '1 week ago' },
      { user: mockUsers[2], role: 'Community Health Advisor', joinedAt: '5 days ago' }
    ],
    feedback: [
      {
        id: 'fb_1',
        type: 'risk',
        author: mockUsers[4],
        text: '⚠️ Ecological Risk: Heavy diesel backhoe excavation near the upper weir would destabilize the steep scree slope and pollute the yellow-billed cuckoo nesting sanctuary 200m downstream if conducted before late autumn.',
        suggestedChange: 'Ban motorized equipment within 100m; switch to hand-trenching during the dry window in early November.',
        status: 'adopted',
        resolutionNote: 'Adopted in v1.1: Replaced heavy excavators with volunteer hand-clearing and scheduled for dry season.',
        date: 'Oct 15'
      },
      {
        id: 'fb_2',
        type: 'alternative',
        author: mockUsers[1],
        text: '💡 Method Alternative: Could we stage bulk washed gravel deliveries at the Ridge Trailhead parking pad and transport it via electric wheelbarrows along the fire road instead of trying to drive 10-yard dump trucks up the single-track trail?',
        suggestedChange: 'Stage material depot at Trailhead Lot B with 3 electric wheelbarrows.',
        status: 'adopted',
        resolutionNote: 'Adopted in v1.1: Staging depot established at Lot B to preserve single-track trail integrity.',
        date: 'Oct 16'
      },
      {
        id: 'fb_3',
        type: 'evidence',
        author: mockUsers[0],
        text: '📎 Water Quality Baseline: Lab test from Oct 16 shows turbidity at 420 NTU and elevated coliform counts (180 CFU/100mL) due to organic debris decomposition.',
        suggestedChange: 'Add a 3-stage gravel and sand bio-filter column.',
        status: 'addressed',
        resolutionNote: 'Included in filter specifications to guarantee potable threshold.',
        date: 'Oct 17'
      },
      {
        id: 'fb_4',
        type: 'modification',
        author: mockUsers[3],
        text: '✏️ Governance Amendment: Establish a bi-weekly community water testing schedule so neighbors share monitoring duties rather than relying on a single volunteer.',
        suggestedChange: 'Add milestone for volunteer water quality testing rotation.',
        status: 'adopted',
        resolutionNote: 'Adopted in v1.1: Added milestone m_4 for recurring community testing rota.',
        date: 'Oct 18'
      },
      {
        id: 'fb_5',
        type: 'critique',
        author: mockUsers[2],
        text: '🔍 Health Feasibility: Bio-filters alone will not neutralize viral pathogens during initial recharge. We need a secondary UV purification stage or temporary boil-water advisory protocol until baseline test passes 3 consecutive zero-coliform tests.',
        suggestedChange: 'Add secondary solar UV sterilizer box.',
        status: 'under_discussion',
        resolutionNote: 'Evaluating solar UV sterilizer unit cost with CERT grant funds.',
        date: 'Oct 19'
      },
      {
        id: 'fb_6',
        type: 'support',
        author: mockUsers[2],
        text: '👍 Strong Support: Critical backup water source for 40 elderly households who cannot hike down to city tanker points during winter grid cuts.',
        suggestedChange: '',
        status: 'open',
        resolutionNote: '',
        date: 'Oct 19'
      }
    ],
    revisionHistory: [
      {
        version: 'v1.0',
        date: 'Oct 12',
        revisedBy: currentUser.name,
        summaryOfChanges: 'Initial proposal draft with mechanical excavators and October timeline.',
        reasoningForChanges: 'Initial concept formulated after hillside slippage observation.',
        incorporatedFeedbackIds: []
      },
      {
        version: 'v1.1',
        date: 'Oct 18',
        revisedBy: currentUser.name,
        summaryOfChanges: 'Switched to low-impact dry-season hand-trenching, added geotextile silt curtain, and established Lot B staging depot.',
        reasoningForChanges: 'Adopted Dr. Sharma’s downstream wildlife risk feedback and Dave Martinez’s dry-season staging alternative.',
        incorporatedFeedbackIds: ['fb_1', 'fb_2', 'fb_4']
      }
    ],
    goals: [
      'Install biological stone and gravel pre-filter to restore 45 L/min potable spring flow',
      'Plant 300 native willow and dogwood saplings along 800ft of eroded catchment zone',
      'Establish community real-time water depth and turbidity monitoring network'
    ],
    milestones: [
      { id: 'm_1', title: 'Topographical drone survey & sediment core analysis', dueDate: 'Oct 10', status: 'completed', completedDate: 'Oct 9', assignedTo: 'Priya Sharma' },
      { id: 'm_2', title: 'Geotextile silt curtain staging & dry-season hand clearing', dueDate: 'Nov 8', status: 'in_progress', completedDate: null, assignedTo: 'Dave Martinez' },
      { id: 'm_3', title: 'Layered washed gravel & bio-filter stone placement', dueDate: 'Nov 18', status: 'pending', completedDate: null, assignedTo: 'Maya Lin' },
      { id: 'm_4', title: 'Post-restoration turbidity & bacterial testing protocol', dueDate: 'Dec 2', status: 'pending', completedDate: null, assignedTo: 'Priya Sharma' }
    ],
    decisions: [
      { 
        id: 'dec_1', 
        title: 'Adopted low-impact dry-season hand clearing over mechanical excavators', 
        rationale: 'Protects the yellow-billed cuckoo nesting sanctuary and eliminates heavy vehicle damage to the Upper Ridge Trail.', 
        date: 'Oct 18', 
        decidedBy: 'Community Consensus',
        versionTag: 'v1.1',
        isRevisionDecision: true,
        incorporatedFeedbackIds: ['fb_1', 'fb_2', 'fb_4']
      },
      { 
        id: 'dec_2', 
        title: 'Selected bio-engineered willow fascines over concrete channelization', 
        rationale: 'Fascines provide natural root stabilization, filter 70% of silt, and cost 80% less than concrete while supporting local wildlife.', 
        date: 'Oct 14', 
        decidedBy: 'Team Consensus',
        versionTag: null,
        isRevisionDecision: false
      }
    ],
    linkedRequestIds: ['req_01', 'req_02', 'req_10'],
    linkedResourceIds: ['res_01', 'res_04'],
    linkedObservationIds: ['obs_01', 'obs_01_sup'],
    linkedClaimIds: ['clm_01'],
    evidenceIds: ['ev_01', 'ev_02'],
    outcomesEvaluation: 'Current Phase: Community Review & Critique complete. Geotextile silt barrier staged at Upper Ridge. Baseline water turbidity established at 420 NTU with target reduction to < 10 NTU post-filter.',
    updates: [
      { date: 'Today', note: 'Revision v1.1 published incorporating ecological critique and dry season schedule.' },
      { date: 'Oct 18', note: 'Sediment testing completed; high clay content identified from upstream grading site.' },
      { date: 'Oct 12', note: 'Initial proposal drafted and submitted for community review.' }
    ]
  },
  {
    id: 'plan_02',
    title: 'Southside Senior Winter Cold-Snap Resilience & Micro-Grid Care Network',
    problemStatement: 'Aging masonry multi-family buildings (Pine Crest Manor & Southside Quad) suffer chronic central boiler failures during extreme sub-zero cold snaps, leaving 60+ low-income and mobility-impaired elders at severe risk of hypothermia, frozen pipes, and medical isolation.',
    desiredOutcome: 'Guarantee safe indoor temperatures (minimum 68°F), reliable emergency backup power for vital medical devices (oxygen concentrators, nebulizers), daily nutritional wellness visits, and rapid severe-weather medical transport for all 60 enrolled seniors throughout the winter season.',
    proposedApproach: 'Implement a 3-tier neighborhood safety net: (1) Pre-position tested low-draw ceramic space heaters and thermal blankets; (2) Deploy 4 high-capacity battery power stations for life-support devices; (3) Establish a non-intrusive daily window-magnet check-in protocol; (4) Maintain an on-call 4WD volunteer driver pool.',
    resourcesNeeded: '25 tested 750W energy-efficient ceramic space heaters with auto tip-over shutoff, 60 heavy wool thermal blankets, 4 portable 2000Wh LiFePO4 battery power stations, 12 volunteer 4WD drivers with snow chains.',
    location: 'Pine Crest Manor (440 Elm St) & Southside Quad, Maplewood',
    affectedParties: '60 elderly residents (ages 68–94), visiting nurses, building management, Maplewood emergency response dispatch.',
    lifecycleStage: 'active',
    overallStatus: 'in_progress',
    currentVersion: 'v2.0',
    proposer: mockUsers[2],
    participants: [
      { user: mockUsers[2], role: 'Healthcare & Wellness Coordinator', joinedAt: '1 month ago' },
      { user: currentUser, role: 'Logistics & Transport Dispatch', joinedAt: '3 weeks ago' },
      { user: mockUsers[1], role: 'Electrical Safety & Equipment Lead', joinedAt: '3 weeks ago' }
    ],
    feedback: [
      {
        id: 'fb_201',
        type: 'risk',
        author: mockUsers[1],
        text: '⚠️ Electrical Hazard Alert: Running standard 1500W space heaters on 1960s 15-amp building circuits will trip master breakers and create serious electrical fire hazards.',
        suggestedChange: 'Mandate 750W low-draw ceramic units with auto-shutoff and conduct floor-by-floor circuit load audits.',
        status: 'adopted',
        resolutionNote: 'Adopted in v1.1: Procured only 750W energy-efficient ceramic heaters with thermal fuses.',
        date: 'Oct 6'
      },
      {
        id: 'fb_202',
        type: 'alternative',
        author: mockUsers[2],
        text: '💡 Dignity & Privacy Alternative: Replace intrusive door-knocks with a morning/evening window magnet indicator ("Green = Warm & OK", "Red = Need Assistance") paired with a 2-ring telephone check.',
        suggestedChange: 'Install reversible color-coded window magnets on courtyard-facing windows.',
        status: 'adopted',
        resolutionNote: 'Adopted in v1.2: Magnet system protects senior autonomy and speeds up daily wellness passes.',
        date: 'Oct 8'
      },
      {
        id: 'fb_203',
        type: 'support',
        author: currentUser,
        text: '👍 Strong Endorsement: CERT and volunteer drivers are fully on board. Transport dispatch channel established.',
        suggestedChange: '',
        status: 'open',
        resolutionNote: '',
        date: 'Oct 9'
      }
    ],
    revisionHistory: [
      {
        version: 'v1.0',
        date: 'Oct 4',
        revisedBy: 'Elena Rostova',
        summaryOfChanges: 'Initial winter resilience plan drafted with standard space heater distribution.',
        reasoningForChanges: 'Formulated in response to last winter’s 36-hour boiler failure.',
        incorporatedFeedbackIds: []
      },
      {
        version: 'v1.2',
        date: 'Oct 9',
        revisedBy: 'Elena Rostova',
        summaryOfChanges: 'Updated to 750W low-draw ceramic heaters, added window magnet check-in protocol, and integrated portable battery power stations.',
        reasoningForChanges: 'Incorporated Dave’s electrical safety critique and resident privacy preferences.',
        incorporatedFeedbackIds: ['fb_201', 'fb_202']
      },
      {
        version: 'v2.0',
        date: 'Oct 22',
        revisedBy: 'Elena Rostova',
        summaryOfChanges: 'Formally accepted as active neighborhood winter protocol with building management sign-off.',
        reasoningForChanges: 'Full drill conducted with 100% resident roster verification.',
        incorporatedFeedbackIds: []
      }
    ],
    goals: [
      'Establish neighbor-to-neighbor buddy system for 60 elderly residents across 3 buildings',
      'Maintain emergency cache of 20 tested indoor electric radiators and thermal blankets',
      'Create on-call volunteer transport pool for severe weather medical trips'
    ],
    milestones: [
      { id: 'm_201', title: 'Resident wellness roster and consent intake', dueDate: 'Oct 5', status: 'completed', completedDate: 'Oct 4', assignedTo: 'Elena Rostova' },
      { id: 'm_202', title: 'Deploy emergency auxiliary heaters to Pine Crest Manor', dueDate: 'Oct 24', status: 'completed', completedDate: 'Oct 24', assignedTo: 'Elena & Maya' },
      { id: 'm_203', title: 'Complete building management boiler replacement oversight', dueDate: 'Oct 28', status: 'in_progress', completedDate: null, assignedTo: 'Elena Rostova' },
      { id: 'm_204', title: 'Stock permanent winter preparedness cupboard at Community Center', dueDate: 'Nov 10', status: 'pending', completedDate: null, assignedTo: 'Maya Lin' }
    ],
    decisions: [
      { 
        id: 'dec_202', 
        title: 'Standardized on 750W ceramic heaters with tip-over shutoff', 
        rationale: 'Eliminates breaker trip risk on legacy 15A building wiring while meeting safe heating requirements.', 
        date: 'Oct 9', 
        decidedBy: 'Dave Martinez & Elena Rostova',
        versionTag: 'v1.2',
        isRevisionDecision: true,
        incorporatedFeedbackIds: ['fb_201']
      },
      { 
        id: 'dec_201', 
        title: 'Adopted non-invasive window magnet check-in protocol', 
        rationale: 'Protects resident autonomy and dignity while guaranteeing safety checks twice daily during freeze warnings.', 
        date: 'Oct 8', 
        decidedBy: 'Elena Rostova',
        versionTag: 'v1.2',
        isRevisionDecision: true,
        incorporatedFeedbackIds: ['fb_202']
      }
    ],
    linkedRequestIds: ['req_03', 'req_04', 'req_12'],
    linkedResourceIds: ['res_02', 'res_05'],
    linkedObservationIds: ['obs_02'],
    linkedClaimIds: ['clm_02'],
    evidenceIds: ['ev_03', 'ev_04'],
    outcomesEvaluation: '48 residents visited; 100% of unheated units supplied with blankets or radiators within 3 hours of boiler failure. Battery backup maintained uninterrupted power for 2 oxygen concentrators during morning power blip.',
    updates: [
      { date: 'Today', note: 'Auxiliary heating active in all north-facing apartments.' }
    ]
  },
  {
    id: 'plan_03',
    title: 'Eastside Urban Fruit Gleaning, Food Sovereignty & Community Pantry Network',
    problemStatement: 'An estimated 12,000 lbs of backyard fruit, heirloom apples, and small-orchard produce rots unharvested across Eastside Maplewood every autumn, while 18% of neighborhood families and 3 local food pantries experience severe fresh produce shortages.',
    desiredOutcome: 'Harvest, inspect, preserve, and redistribute at least 6,000 lbs of organic surplus fruit and vegetables annually with zero landfill waste, stock 4 community pantry freeze-drying stations, and train 50 community members in safe food preservation.',
    proposedApproach: 'Maintain a digital donor tree registry, dispatch volunteer weekend harvesting crews equipped with telescoping poles and sanitized crates, dehydrate/can excess yields at the Community Center commercial kitchen, and deliver same-day fresh boxes to partner pantries.',
    resourcesNeeded: '12 telescoping fruit picking poles, 50 food-grade stackable crates, 2 commercial 16-tray food dehydrators, 1 refrigerated mobile transport van, 500 Mason canning jars.',
    location: 'Highland Ridge & Eastside Neighborhood Orchards, Maplewood',
    affectedParties: 'Backyard tree owners, 240 food-insecure families, 4 neighborhood emergency food distribution hubs, local pollinator populations.',
    lifecycleStage: 'active',
    overallStatus: 'in_progress',
    currentVersion: 'v1.3',
    proposer: mockUsers[3],
    participants: [
      { user: mockUsers[3], role: 'Orchard Lead & Gleaning Manager', joinedAt: '2 months ago' },
      { user: currentUser, role: 'Pantry Logistics Lead', joinedAt: '2 months ago' },
      { user: mockUsers[0], role: 'Quality Control & Preservation Trainer', joinedAt: '1 month ago' }
    ],
    feedback: [
      {
        id: 'fb_301',
        type: 'alternative',
        author: mockUsers[0],
        text: '💡 Preservation Alternative: Add solar dehydrators and canning workshops so fruit that cannot be consumed within 48h is shelf-stable for winter distribution.',
        suggestedChange: 'Add commercial dehydrators and canning supplies to budget.',
        status: 'adopted',
        resolutionNote: 'Adopted in v1.2: 2 commercial dehydrators purchased and community storage workshops scheduled.',
        date: 'Sep 5'
      },
      {
        id: 'fb_302',
        type: 'risk',
        author: mockUsers[4],
        text: '⚠️ Food Safety & Pest Risk: Fallen ground fruit can harbor brown rot spores and insect larvae. Harvesting must only distribute tree-picked fruit to prevent spoilage.',
        suggestedChange: 'Ground fruit diverted to municipal compost; only branch-picked fruit enters pantry stream.',
        status: 'adopted',
        resolutionNote: 'Adopted in v1.1: Strict sorting protocol established at harvest site.',
        date: 'Sep 8'
      },
      {
        id: 'fb_303',
        type: 'support',
        author: mockUsers[2],
        text: '👍 Support: Fresh pears and apples distributed last week provided vital fresh nutrition to Pine Crest Manor residents.',
        suggestedChange: '',
        status: 'open',
        resolutionNote: '',
        date: 'Oct 15'
      }
    ],
    revisionHistory: [
      {
        version: 'v1.0',
        date: 'Aug 25',
        revisedBy: 'Marcus Thorne',
        summaryOfChanges: 'Initial gleaning alliance plan approved by board.',
        reasoningForChanges: 'Seasonal fruit waste mitigation.',
        incorporatedFeedbackIds: []
      },
      {
        version: 'v1.2',
        date: 'Sep 10',
        revisedBy: 'Marcus Thorne',
        summaryOfChanges: 'Added tree-only harvest hygiene rules and commercial dehydration processing.',
        reasoningForChanges: 'Adopted Dr. Sharma’s pest critique and Maya’s long-term preservation proposal.',
        incorporatedFeedbackIds: ['fb_301', 'fb_302']
      },
      {
        version: 'v1.3',
        date: 'Oct 1',
        revisedBy: 'Marcus Thorne',
        summaryOfChanges: 'Expanded tree registry to include 25 partner sites on Highland Ridge.',
        reasoningForChanges: 'Doubled harvest capacity following strong community response.',
        incorporatedFeedbackIds: []
      }
    ],
    goals: [
      'Glean and redistribute 5,000 lbs of surplus fruit and vegetables annually',
      'Equip community members with food preservation and dehydration skills',
      'Build digital map of registered surplus trees with owner permission'
    ],
    milestones: [
      { id: 'm_301', title: 'Map 25 registered fruit tree donation sites', dueDate: 'Sep 15', status: 'completed', completedDate: 'Sep 12', assignedTo: 'Marcus Thorne' },
      { id: 'm_302', title: 'Equip mobile gleaning trailer with crates and dehydrators', dueDate: 'Sep 30', status: 'completed', completedDate: 'Sep 28', assignedTo: 'Marcus Thorne' },
      { id: 'm_303', title: 'Highland Ridge 1,000 lb pear harvest & distribution', dueDate: 'Oct 26', status: 'in_progress', completedDate: null, assignedTo: 'Marcus Thorne' },
      { id: 'm_304', title: 'Winter community canning and fruit leather workshop', dueDate: 'Nov 15', status: 'pending', completedDate: null, assignedTo: 'Maya Lin' }
    ],
    decisions: [
      { 
        id: 'dec_302', 
        title: 'Tree-only picking rule and ground-fruit diversion to compost', 
        rationale: 'Eliminates brown rot spore contamination in pantry stock while turning spoiled fruit into community garden compost.', 
        date: 'Sep 10', 
        decidedBy: 'Marcus Thorne',
        versionTag: 'v1.2',
        isRevisionDecision: true,
        incorporatedFeedbackIds: ['fb_302']
      },
      { 
        id: 'dec_301', 
        title: 'All fruit deliveries direct to community pantries within 6 hours of harvest', 
        rationale: 'Ensures zero spoilage and maximum nutritional value for recipients.', 
        date: 'Aug 28', 
        decidedBy: 'Food Alliance Board',
        versionTag: null,
        isRevisionDecision: false
      }
    ],
    linkedRequestIds: ['req_05'],
    linkedResourceIds: ['res_03'],
    linkedObservationIds: ['obs_03'],
    linkedClaimIds: ['clm_03'],
    evidenceIds: ['ev_05'],
    outcomesEvaluation: '3,200 lbs distributed to date across 4 food distribution points. Zero food waste recorded from registered partner sites.',
    updates: [
      { date: 'Yesterday', note: 'Highland Ridge picking permits cleared; 800+ lbs expected this weekend.' }
    ]
  },
  {
    id: 'plan_04',
    title: 'Maplewood Creek Bio-Swale & Stormwater Runoff Buffer Installation',
    problemStatement: 'Flash stormwater runoff from the commercial plaza parking lot was discharging untreated petroleum and road silt directly into the Maplewood Creek tributary, eroding 400ft of riverbank and flooding the Oak St pedestrian underpass during storms > 1.0 inch/hr.',
    desiredOutcome: 'Capture and naturally filter 85% of parking lot runoff, eliminate pedestrian underpass flooding, stabilize 400ft of creek bank with native vegetation, and reduce sediment turbidity to < 15 NTU.',
    proposedApproach: 'Construct a 250ft bio-swale planted with deep-rooted native sedges and rushes, install permeable gravel check dams, anchor coir erosion logs along the bank, and redirect storm discharge through a vegetated infiltration basin.',
    resourcesNeeded: '400 native sedge & rush plugs, 30 tons crushed granite, 8 coir log rolls, 1 municipal curb-cut permit, 12 scheduled volunteer planting sessions.',
    location: 'Oak St Underpass & Commercial Plaza West Boundary, Maplewood',
    affectedParties: 'Oak St commuters, commercial plaza tenants, downstream native trout habitat, municipal stormwater utility.',
    lifecycleStage: 'completed',
    overallStatus: 'completed',
    currentVersion: 'v2.1',
    proposer: mockUsers[4],
    participants: [
      { user: mockUsers[4], role: 'Hydrological Designer & Lead Investigator', joinedAt: '6 months ago' },
      { user: mockUsers[1], role: 'Civil Works & Excavation Lead', joinedAt: '5 months ago' },
      { user: currentUser, role: 'Volunteer Coordinator', joinedAt: '5 months ago' }
    ],
    feedback: [
      {
        id: 'fb_401',
        type: 'risk',
        author: mockUsers[1],
        text: '⚠️ Permitting & Utility Risk: Unmapped buried telecom conduits along the commercial curb edge.',
        suggestedChange: 'Conduct ground-penetrating radar scan before heavy trenching.',
        status: 'adopted',
        resolutionNote: 'Adopted: GPR scan completed and conduit route safely marked.',
        date: 'May 14'
      },
      {
        id: 'fb_402',
        type: 'support',
        author: currentUser,
        text: '👍 Support: Mobilized 24 volunteers across 3 planting weekends.',
        suggestedChange: '',
        status: 'open',
        resolutionNote: '',
        date: 'Jun 2'
      }
    ],
    revisionHistory: [
      {
        version: 'v1.0',
        date: 'May 2',
        revisedBy: 'Dr. Priya Sharma',
        summaryOfChanges: 'Initial bio-swale engineering blueprint.',
        reasoningForChanges: 'Stormwater mitigation following repeat underpass flooding.',
        incorporatedFeedbackIds: []
      },
      {
        version: 'v2.0',
        date: 'Jun 10',
        revisedBy: 'Dr. Priya Sharma',
        summaryOfChanges: 'Full civil construction and planting completed.',
        reasoningForChanges: 'Construction verified against municipal environmental standards.',
        incorporatedFeedbackIds: ['fb_401']
      },
      {
        version: 'v2.1',
        date: 'Aug 20',
        revisedBy: 'Dr. Priya Sharma',
        summaryOfChanges: 'Final outcome evaluation and post-storm water quality telemetry verified.',
        reasoningForChanges: 'Validated 2 seasonal cycles of zero underpass flooding.',
        incorporatedFeedbackIds: []
      }
    ],
    goals: [
      'Construct 250ft bio-swale to filter parking lot runoff',
      'Eliminate Oak St underpass flash flooding',
      'Stabilize 400ft of eroded stream bank with native plugs'
    ],
    milestones: [
      { id: 'm_401', title: 'Topographical drainage survey & GPR utility mapping', dueDate: 'May 10', status: 'completed', completedDate: 'May 9', assignedTo: 'Priya Sharma' },
      { id: 'm_402', title: 'Excavation & crushed granite check dam installation', dueDate: 'May 28', status: 'completed', completedDate: 'May 26', assignedTo: 'Dave Martinez' },
      { id: 'm_403', title: 'Community planting action: 400 native sedge plugs', dueDate: 'Jun 12', status: 'completed', completedDate: 'Jun 12', assignedTo: 'Maya Lin' },
      { id: 'm_404', title: 'Coir erosion log anchoring along 400ft riverbank', dueDate: 'Jun 24', status: 'completed', completedDate: 'Jun 22', assignedTo: 'Dave Martinez' },
      { id: 'm_405', title: 'Post-storm water quality telemetry & infiltration audit', dueDate: 'Aug 15', status: 'completed', completedDate: 'Aug 14', assignedTo: 'Priya Sharma' }
    ],
    decisions: [
      { 
        id: 'dec_401', 
        title: 'Chose bio-retention swale over subsurface concrete detention tank', 
        rationale: 'Natural bio-swale provides 90% better hydrocarbon filtration, supports native pollinators, and saved $45,000 in taxpayer costs.', 
        date: 'May 5', 
        decidedBy: 'Municipal & Community Consensus',
        versionTag: 'v1.0',
        isRevisionDecision: true,
        incorporatedFeedbackIds: []
      },
      { 
        id: 'dec_402', 
        title: 'Conducted GPR utility scan before deep trenching near commercial frontage', 
        rationale: 'Safely identified buried fiber optic telecom conduits without utility strikes.', 
        date: 'May 16', 
        decidedBy: 'Civil Engineering Lead',
        versionTag: 'v2.0',
        isRevisionDecision: true,
        incorporatedFeedbackIds: ['fb_401']
      }
    ],
    linkedRequestIds: ['req_06'],
    linkedResourceIds: ['res_01'],
    linkedObservationIds: ['obs_01'],
    linkedClaimIds: ['clm_01'],
    evidenceIds: ['ev_01'],
    outcomesEvaluation: 'Project successfully completed and monitored across 2 seasonal storm cycles. Zero underpass flooding recorded during the recent 2.2-inch deluge. Water quality telemetry confirms 88% reduction in total suspended solids and hydrocarbon filtration meeting EPA Class II standards. Native vegetation established with 94% survival rate.',
    outcomeReport: {
      evaluatedAt: 'Aug 20, 2026',
      evaluator: 'Dr. Priya Sharma (Hydrological Designer)',
      goal: 'Capture and naturally filter 85% of parking lot runoff, eliminate Oak St pedestrian underpass flooding, and stabilize 400ft of creek bank with native vegetation.',
      actualResults: [
        '250ft bio-retention swale and gravel check dams constructed and fully operational',
        'Zero underpass flash flooding recorded across 2 severe seasonal storm cycles (> 2.2 in/hr)',
        '400ft of creek bank stabilized with 400 native sedge plugs (94% plant survival rate)',
        'Hydrocarbon and road sediment runoff reduced by 88%, meeting EPA Class II water standards'
      ],
      outcomeStatus: 'achieved',
      evidenceTypes: ['Field observation', 'Community feedback', 'Measurements', 'Photos/documents'],
      linkedEvidenceIds: ['ev_01'],
      linkedObservationIds: ['obs_01'],
      unexpectedEffects: 'Heavy gravel sediment accumulated in the first check weir faster than modeled, requiring a bi-annual debris cleanout rota rather than an annual check.',
      lessons: 'Pre-marking buried telecom utilities via GPR before deep trenching prevented costly fiber optic line strikes and project delays.',
      guidanceForFuture: 'All future bio-swales adjacent to commercial parking lots should include an easily accessible sediment trap forebay for rapid volunteer shoveling.'
    },
    updates: [
      { date: 'Aug 20', note: 'Final outcome evaluation report logged and published to community archive.' }
    ]
  },
  {
    id: 'plan_05',
    title: 'North Maplewood Pedestrian Safe Streets & Traffic Calming Initiative',
    problemStatement: 'Excessive vehicle cut-through speeds (averaging 41 mph in a designated 25 mph school zone) on Maple Ave between 4th and 9th Streets create severe collision hazards for 280 children walking to Maplewood Elementary, resulting in 3 near-miss incidents this month.',
    desiredOutcome: 'Reduce 85th-percentile vehicle speeds to under 22 mph, install 4 high-visibility daylighted crosswalks, organize volunteer-led walking school buses, and secure municipal engineering approval for permanent curb extensions.',
    proposedApproach: 'Deploy tactical urbanism high-contrast street art crosswalks, install temporary modular rubber speed tables with fire-engine cutouts, conduct continuous radar speed audits, and operate morning/afternoon volunteer crossing guard shifts.',
    resourcesNeeded: 'Eco-friendly reflective street paint, 4 solar radar speed feedback signs, 2 modular rubber speed cushions with emergency vehicle cutouts, 20 high-visibility safety vests, 15 volunteer crossing coordinators.',
    location: 'Maple Ave Corridor (4th St to 9th St), North Maplewood',
    affectedParties: '280 elementary school students and parents, 450 corridor residents, Maplewood Fire Station 3 (emergency response route), morning commuters.',
    lifecycleStage: 'draft',
    overallStatus: 'planning',
    currentVersion: 'v1.0',
    proposer: mockUsers[0],
    participants: [
      { user: mockUsers[0], role: 'Parent Coordinator & Proposal Author', joinedAt: '1 week ago' },
      { user: currentUser, role: 'Volunteer Logistics Lead', joinedAt: '4 days ago' }
    ],
    feedback: [
      {
        id: 'fb_501',
        type: 'risk',
        author: mockUsers[1],
        text: '⚠️ Emergency Vehicle Access: Full-width asphalt speed bumps delay Fire Station 3 ladder trucks by up to 45 seconds. Any calming measure must have cutouts.',
        suggestedChange: 'Use modular split speed cushions with 6-foot center spacing for fire truck wheelbases.',
        status: 'under_discussion',
        resolutionNote: 'Consulting with Station 3 Battalion Chief.',
        date: 'Oct 23'
      },
      {
        id: 'fb_502',
        type: 'alternative',
        author: mockUsers[4],
        text: '💡 Design Alternative: Combine paint daylighting with curb planter boxes at 6th St intersection to narrow perceived street width naturally.',
        suggestedChange: 'Add 6 self-watering street planters to crosswalk curb bulbs.',
        status: 'open',
        resolutionNote: '',
        date: 'Oct 24'
      }
    ],
    revisionHistory: [
      {
        version: 'v1.0',
        date: 'Oct 21',
        revisedBy: 'Maya Lin',
        summaryOfChanges: 'Initial draft proposal submitted for neighborhood safety review.',
        reasoningForChanges: 'Formulated after 3 near-miss incidents at 6th & Maple Ave.',
        incorporatedFeedbackIds: []
      }
    ],
    goals: [
      'Reduce average corridor speeds below 22 mph',
      'Install 4 high-contrast daylighted crosswalks',
      'Establish volunteer walking school bus for 60 students'
    ],
    milestones: [
      { id: 'm_501', title: 'Conduct 7-day radar speed audit & near-miss heatmapping', dueDate: 'Nov 4', status: 'in_progress', completedDate: null, assignedTo: 'Maya Lin' },
      { id: 'm_502', title: 'Station 3 Fire Chief coordination & speed cushion review', dueDate: 'Nov 12', status: 'pending', completedDate: null, assignedTo: 'Dave Martinez' },
      { id: 'm_503', title: 'Community crosswalk painting & walking school bus launch', dueDate: 'Nov 20', status: 'pending', completedDate: null, assignedTo: 'Volunteer Team' }
    ],
    decisions: [
      { 
        id: 'dec_501', 
        title: 'Prioritized 6th & Maple intersection for initial tactical intervention', 
        rationale: 'Direct route for 70% of elementary walkers with highest recorded vehicle approach speeds.', 
        date: 'Oct 22', 
        decidedBy: 'Parent Safety Working Group',
        versionTag: null,
        isRevisionDecision: false
      }
    ],
    linkedRequestIds: [],
    linkedResourceIds: [],
    linkedObservationIds: [],
    linkedClaimIds: [],
    evidenceIds: [],
    outcomesEvaluation: 'Draft proposal in active community review. 7-day speed audit currently capturing vehicular traffic patterns.',
    updates: [
      { date: 'Today', note: 'Draft proposal open for neighbor comments and emergency route feedback.' }
    ]
  }
];

export const mockCommunities = [
  {
    id: 'com_01',
    name: 'Willow Creek Watershed Alliance',
    handle: '@willow_watershed',
    category: 'environmental',
    privacy: 'public',
    privacyLabel: 'Public Group · 142 neighbors',
    description: 'Neighbors, hydrologists, and community volunteers working together to protect water quality, restore riparian buffers, and prevent flash flood hazards along Willow Creek.',
    location: 'Maplewood North & Watershed Basin',
    memberCount: 142,
    avatar: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=200&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
    createdDate: 'Formed June 2024 · Active Watershed Group',
    adminIds: ['usr_priya', 'usr_me'],
    moderatorIds: ['usr_dave'],
    memberIds: ['usr_me', 'usr_priya', 'usr_dave', 'usr_elena', 'usr_marcus'],
    pinnedPostId: 'post_01',
    rules: [
      {
        id: 'rule_1',
        title: 'Evidence First & Grounded Claims',
        description: 'When logging creek conditions or runoff reports, include field photos, NTU measurements, or depth gauge readings.'
      },
      {
        id: 'rule_2',
        title: 'Prioritize Physical Safety Along Waterways',
        description: 'Do not enter high-velocity storm runoffs without personal flotation gear, spotters, and coordination approval.'
      },
      {
        id: 'rule_3',
        title: 'Action-Oriented Mutual Coordination',
        description: 'Keep discussions focused on volunteer tasks, pump staging, willow plantings, and municipal notifications.'
      },
      {
        id: 'rule_4',
        title: 'No Commercial Advertisements',
        description: 'Commercial services are only permitted if offering free community equipment or emergency assistance.'
      }
    ],
    mediaGallery: [
      {
        id: 'med_01',
        url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
        title: 'Culvert weir inspection with turbidity meter',
        date: 'Today',
        uploader: 'Priya Sharma'
      },
      {
        id: 'med_02',
        url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
        title: 'Willow Creek riparian planting section A',
        date: '3 days ago',
        uploader: 'Dave Martinez'
      },
      {
        id: 'med_03',
        url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
        title: 'Sandbag diversion layout at Elm St bridge',
        date: 'Yesterday',
        uploader: 'Maya Lin'
      }
    ],
    files: [
      {
        id: 'f_01',
        name: 'Willow_Creek_Watershed_Ecological_Assessment_2026.pdf',
        size: '3.4 MB',
        type: 'PDF Document',
        date: 'Aug 14, 2026',
        uploader: 'Priya Sharma'
      },
      {
        id: 'f_02',
        name: 'Emergency_Pump_Deployment_Protocol_v2.pdf',
        size: '1.1 MB',
        type: 'PDF Document',
        date: 'Aug 20, 2026',
        uploader: 'Dave Martinez'
      }
    ],
    linkedPlanIds: ['plan_01'],
    linkedRequestIds: ['req_01', 'req_02', 'req_07', 'req_10', 'req_11'],
    isJoined: true
  },
  {
    id: 'com_02',
    name: 'Maplewood Mutual Aid & Senior Care',
    handle: '@maplewood_aid',
    category: 'mutual_aid',
    privacy: 'public',
    privacyLabel: 'Public Group · 285 neighbors',
    description: 'Grassroots neighborhood care network connecting elders, families in need, and volunteers for groceries, heating support, and mutual aid.',
    location: 'Southside & Downtown Maplewood',
    memberCount: 285,
    avatar: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=200&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=1200&auto=format&fit=crop&q=80',
    createdDate: 'Formed January 2024 · Active Mutual Aid Group',
    adminIds: ['usr_elena', 'usr_me'],
    moderatorIds: ['usr_marcus'],
    memberIds: ['usr_me', 'usr_elena', 'usr_marcus', 'usr_priya'],
    pinnedPostId: 'post_02',
    rules: [
      {
        id: 'rule_1',
        title: 'Protect Neighbor Dignity & Privacy',
        description: 'Do not publicly post private medical conditions or exact residential apartment door numbers without consent.'
      },
      {
        id: 'rule_2',
        title: 'Prompt Follow-Through on Pledges',
        description: 'If committing to grocery dropoff or elderly transport, notify the coordinator if schedule shifts.'
      }
    ],
    mediaGallery: [
      {
        id: 'med_04',
        url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=600&auto=format&fit=crop&q=80',
        title: 'Pine Crest Manor lobby heater staging',
        date: 'Today',
        uploader: 'Elena Rostova'
      }
    ],
    files: [
      {
        id: 'f_03',
        name: 'Senior_Warming_Center_Dispatch_Roster.pdf',
        size: '890 KB',
        type: 'PDF Document',
        date: 'Aug 22, 2026',
        uploader: 'Elena Rostova'
      }
    ],
    linkedPlanIds: ['plan_02'],
    linkedRequestIds: ['req_03', 'req_04', 'req_12'],
    isJoined: true
  },
  {
    id: 'com_03',
    name: 'Highland Ridge Urban Foragers & Gardeners',
    handle: '@highland_harvest',
    category: 'food_security',
    privacy: 'public',
    privacyLabel: 'Public Group · 96 neighbors',
    description: 'Community growers, gleaners, and food lovers harvesting surplus backyard fruit and stocking open free food pantries.',
    location: 'East Hills & Highland Ridge',
    memberCount: 96,
    avatar: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=200&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200&auto=format&fit=crop&q=80',
    createdDate: 'Formed March 2025 · Community Garden Group',
    adminIds: ['usr_marcus'],
    moderatorIds: [],
    memberIds: ['usr_marcus', 'usr_dave'],
    pinnedPostId: null,
    rules: [
      {
        id: 'rule_1',
        title: 'Safe Food Handling & Freshness',
        description: 'Sort and wash fruit before delivery to community pantries.'
      }
    ],
    mediaGallery: [],
    files: [],
    linkedPlanIds: ['plan_03'],
    linkedRequestIds: ['req_05'],
    isJoined: false
  },
  {
    id: 'com_04',
    name: 'Maplewood Safe Streets & Active Mobility',
    handle: '@safe_streets_mw',
    category: 'safety',
    privacy: 'public',
    privacyLabel: 'Public Group · 168 neighbors',
    description: 'Advocating for pedestrian safety, clear school crosswalk sightlines, traffic calming, and safe bike corridors for all ages.',
    location: 'All Maplewood Districts',
    memberCount: 168,
    avatar: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=200&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200&auto=format&fit=crop&q=80',
    createdDate: 'Formed November 2024 · Mobility Advocates',
    adminIds: ['usr_dave'],
    moderatorIds: [],
    memberIds: ['usr_dave', 'usr_elena'],
    pinnedPostId: null,
    rules: [],
    mediaGallery: [],
    files: [],
    linkedPlanIds: [],
    linkedRequestIds: ['req_06'],
    isJoined: false
  }
];

export const mockPosts = [
  {
    id: 'post_01',
    communityId: 'com_01',
    author: mockUsers[4], // Priya
    content: '🚨 URGENT NOTICE: Water turbidity at Elm Street bridge measured 280 NTU due to heavy construction runoff. We’ve set up a sandbag diversion wall and Dave is bringing a 3-inch trash pump. Please check the linked emergency request if you can shovel for 30 minutes!',
    timestamp: '1 hour ago',
    isPinned: true,
    linkedEntityType: 'observation',
    linkedEntityId: 'obs_01',
    linkedEntityTitle: 'Severe Silt & Debris Jam at Elm Street Creek Culvert',
    endorsedCount: 14,
    mediaUrls: [
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80'
    ],
    comments: [
      { id: 'c1', author: currentUser, text: 'I am on my way with 4 extra shovels and work gloves.', time: '45 mins ago' },
      { id: 'c2', author: mockUsers[1], text: 'Pump trailer is 5 minutes out.', time: '30 mins ago' }
    ]
  },
  {
    id: 'post_05',
    communityId: 'com_01',
    author: mockUsers[4], // Priya
    content: '📊 Coordination Poll: When should our team conduct the willow sapling planting session along the north bank to stabilize the eroded soil before the next storm?',
    timestamp: '2 hours ago',
    isPinned: false,
    poll: {
      id: 'poll_01',
      question: 'When should we conduct the willow sapling planting session?',
      options: [
        { id: 'opt_1', text: 'Saturday Morning (9:00 AM - 12:00 PM)', votes: 16, voterIds: ['usr_dave', 'usr_elena'] },
        { id: 'opt_2', text: 'Saturday Afternoon (1:00 PM - 4:00 PM)', votes: 8, voterIds: [] },
        { id: 'opt_3', text: 'Sunday Morning (10:00 AM - 1:00 PM)', votes: 21, voterIds: ['usr_marcus', 'usr_priya', 'usr_me'] }
      ]
    },
    endorsedCount: 19,
    comments: [
      { id: 'c4', author: mockUsers[1], text: 'Sunday morning works best for the municipal nursery delivery truck.', time: '1 hour ago' }
    ]
  },
  {
    id: 'post_02',
    communityId: 'com_02',
    author: mockUsers[2], // Elena
    content: 'Huge thank you to everyone responding to the heating failure at Pine Crest Manor! We already have 6 oil radiator heaters in the lobby and 10 blankets delivered. If anyone with an AWD vehicle has 30 mins to help drive two residents to the warming center, check the linked request.',
    timestamp: '3 hours ago',
    isPinned: true,
    linkedEntityType: 'request',
    linkedEntityId: 'req_04',
    linkedEntityTitle: 'Need AWD / 4WD Vehicle to Transport 4 Seniors',
    endorsedCount: 22,
    mediaUrls: [
      'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&auto=format&fit=crop&q=80'
    ],
    comments: [
      { id: 'c3', author: currentUser, text: 'I can take the 1:30 PM trip with my Subaru Outback.', time: '1 hour ago' }
    ]
  },
  {
    id: 'post_03',
    communityId: 'com_03',
    author: mockUsers[3], // Marcus
    content: 'The Bartlett pears at Highland Orchard are in prime condition! We have crates and fruit-picking poles ready for our Saturday morning gleaning session. All harvested fruit goes directly to local community pantries.',
    timestamp: '4 hours ago',
    isPinned: false,
    linkedEntityType: 'request',
    linkedEntityId: 'req_05',
    linkedEntityTitle: 'Volunteers Needed: Pick & Crate 800 lbs of Pears at Highland Ridge',
    endorsedCount: 18,
    comments: []
  },
  {
    id: 'post_04',
    communityId: 'com_01',
    author: mockUsers[1], // Dave
    content: 'Transparency update on the Willow Creek Flood Mitigation Plan: We have logged Decision #2 to stage high-capacity pumps whenever rain forecasts exceed 1.5 inches. Milestones 1 and 2 are complete. You can inspect the full decision log and hydrology data on the Plan page.',
    timestamp: '5 hours ago',
    isPinned: false,
    linkedEntityType: 'plan',
    linkedEntityId: 'plan_01',
    linkedEntityTitle: 'Willow Creek Ecological Flood Mitigation Project',
    endorsedCount: 31,
    comments: []
  }
];

export const mockNotifications = [
  {
    id: 'notif_01',
    userId: 'usr_me',
    type: 'resource_match',
    title: 'Resource Match Compatible',
    body: 'Your AWD Transport offer matches Request: "Need AWD Vehicle to Transport 4 Seniors to Community Center".',
    timestamp: '45 mins ago',
    isRead: false,
    targetView: 'collaborate',
    targetSubTab: 'matcher',
    targetEntityId: 'req_04'
  },
  {
    id: 'notif_02',
    userId: 'usr_me',
    type: 'safety_alert',
    title: 'Active Safety Alert in your area',
    body: 'Flash Flood Risk at Elm St Creek Bridge. Volunteers actively staging sandbag diversion.',
    timestamp: '2 hours ago',
    isRead: false,
    targetView: 'explore',
    targetEntityId: 'safe_01'
  },
  {
    id: 'notif_03',
    userId: 'usr_dave',
    type: 'plan_update',
    title: 'Milestone Completed in Willow Creek Plan',
    body: 'Dave Martinez completed milestone: "Emergency temporary diversion wall & pump installation".',
    timestamp: '3 hours ago',
    isRead: true,
    targetView: 'plans',
    targetEntityId: 'plan_01'
  },
  {
    id: 'notif_04',
    userId: 'usr_me',
    type: 'request_response',
    title: 'Volunteer Joined Request',
    body: 'Maya Lin joined your volunteer request for Elm St Culvert Sandbagging.',
    timestamp: '1 hour ago',
    isRead: true,
    targetView: 'collaborate',
    targetSubTab: 'requests',
    targetEntityId: 'req_01'
  },
  {
    id: 'notif_05',
    userId: 'usr_priya',
    type: 'observation_logged',
    title: 'New Field Observation Documented',
    body: 'Priya Patel documented: "Severe Silt & Debris Jam at Elm Street Creek Culvert" with photo provenance.',
    timestamp: '2 hours ago',
    isRead: false,
    targetView: 'explore',
    targetEntityId: 'obs_01'
  },
  {
    id: 'notif_06',
    userId: 'usr_marcus',
    type: 'resource_loan_request',
    title: 'Equipment Loan Requested',
    body: 'Request submitted to borrow "Honda 3-Inch Commercial Trash Pump (380 GPM) + 100ft Hoses".',
    timestamp: '3 hours ago',
    isRead: false,
    targetView: 'collaborate',
    targetSubTab: 'resources',
    targetEntityId: 'res_01'
  },
  {
    id: 'notif_07',
    userId: 'usr_me',
    type: 'request_scheduled',
    title: 'Scheduled Help Request Starting Soon',
    body: 'Volunteer coordination starts in 1 hour for "Need 6 Volunteers & 200 Sandbags at Elm St Culvert".',
    timestamp: '4 hours ago',
    isRead: true,
    targetView: 'collaborate',
    targetSubTab: 'requests',
    targetEntityId: 'req_01'
  },
  {
    id: 'notif_08',
    userId: 'usr_dave',
    type: 'claim_dispute',
    title: 'Claim Ground Truth Verified',
    body: 'Culvert inlet sediment blockage claim verified with field sensors and physical water gauge depth.',
    timestamp: '5 hours ago',
    isRead: true,
    targetView: 'explore',
    targetEntityId: 'clm_01'
  },
  {
    id: 'notif_09',
    userId: 'usr_priya',
    type: 'community_post',
    title: 'Community Action Circle Update',
    body: 'New coordination thread posted in "Elm Street Creek Flood Action Circle".',
    timestamp: '6 hours ago',
    isRead: true,
    targetView: 'social',
    targetSubTab: 'communities',
    targetEntityId: 'com_01'
  }
];

export const mockConversations = [
  {
    id: 'conv_01',
    participant: mockUsers[1], // Dave Martinez
    title: 'Dave Martinez',
    subtitle: 'Re: Elm St Culvert Pump Staging',
    lastMessage: 'Pump is running smoothly at 350 GPM. Water level dropped 4 inches.',
    lastTime: '15 mins ago',
    unreadCount: 1,
    messages: [
      { id: 'm1', senderId: 'usr_dave', text: 'Hey Maya, did you bring the 4 extra shovels?', timestamp: '11:45 AM' },
      { id: 'm2', senderId: 'usr_me', text: 'Yes, just left them with Priya at the bridge trailer.', timestamp: '11:48 AM' },
      { id: 'm3', senderId: 'usr_dave', text: 'Pump is running smoothly at 350 GPM. Water level dropped 4 inches.', timestamp: '12:10 PM' }
    ]
  },
  {
    id: 'conv_02',
    participant: mockUsers[2], // Elena Rostova
    title: 'Elena Rostova',
    subtitle: 'Re: Pine Crest Manor Senior Transport',
    lastMessage: 'Thank you Maya! Mrs. Clara is ready in the lobby with her walker.',
    lastTime: '1 hour ago',
    unreadCount: 0,
    messages: [
      { id: 'm4', senderId: 'usr_elena', text: 'Hi Maya, can you take Mrs. Clara at 1:30 PM?', timestamp: '10:45 AM' },
      { id: 'm5', senderId: 'usr_me', text: 'Absolutely. My Subaru Outback has plenty of room.', timestamp: '10:50 AM' },
      { id: 'm6', senderId: 'usr_elena', text: 'Thank you Maya! Mrs. Clara is ready in the lobby with her walker.', timestamp: '11:00 AM' }
    ]
  }
];
