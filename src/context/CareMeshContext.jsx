import { useState, useEffect, useCallback } from 'react';
import { CareMeshContext } from './careMeshContextInstance';
import {
  currentUser as initialCurrentUser,
  mockUsers,
  mockEvidence as initialEvidence,
  mockClaims as initialClaims,
  mockDisputes as initialDisputes,
  mockObservations as initialObservations,
  mockSafetyReports as initialSafetyReports,
  mockRequests as initialRequests,
  mockResources as initialResources,
  mockQuickActions as initialQuickActions,
  mockMatchingFactors as initialMatchingFactors,
  mockEvents as initialEvents,
  mockPlans as initialPlans,
  mockCommunities as initialCommunities,
  mockPosts as initialPosts,
  mockNotifications as initialNotifications,
  mockConversations as initialConversations
} from '../data/mockData';

export const CareMeshProvider = ({ children }) => {
  // Navigation State
  const [currentView, setCurrentView] = useState('home');
  const [currentSubTab, setCurrentSubTab] = useState(null);
  const [highlightedEntityId, setHighlightedEntityId] = useState(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Creation Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState('observation');
  const [createModalPrefill, setCreateModalPrefill] = useState(null);

  // Dispute & Observation Relation Modals State
  const [disputeModalTarget, setDisputeModalTarget] = useState(null); // claim object
  const [observationRelationTarget, setObservationRelationTarget] = useState(null); // { targetObservation, relationType: 'contradictory' | 'supporting' }
  const [shareSocialTarget, setShareSocialTarget] = useState(null); // { entity, type }

  // Inspector & Detail Modal State
  const [inspectedEntity, setInspectedEntity] = useState(null); // { entity, type }
  const [selectedPlanDetail, setSelectedPlanDetail] = useState(null);
  const [selectedEventChat, setSelectedEventChat] = useState(null);
  const [activeConversationId, setActiveConversationId] = useState('conv_01');

  // Core Data Collections with Local Storage or in-memory fallback
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('caremesh_user');
    return saved ? JSON.parse(saved) : initialCurrentUser;
  });

  const [observations, setObservations] = useState(() => {
    const saved = localStorage.getItem('caremesh_observations');
    return saved ? JSON.parse(saved) : initialObservations;
  });

  const [claims, setClaims] = useState(() => {
    const saved = localStorage.getItem('caremesh_claims');
    return saved ? JSON.parse(saved) : initialClaims;
  });

  const [disputes, setDisputes] = useState(() => {
    const saved = localStorage.getItem('caremesh_disputes');
    return saved ? JSON.parse(saved) : initialDisputes;
  });

  const [evidence, setEvidence] = useState(() => {
    const saved = localStorage.getItem('caremesh_evidence');
    return saved ? JSON.parse(saved) : initialEvidence;
  });

  const [safetyReports, setSafetyReports] = useState(() => {
    const saved = localStorage.getItem('caremesh_safety');
    return saved ? JSON.parse(saved) : initialSafetyReports;
  });

  const [requests, setRequests] = useState(() => {
    const saved = localStorage.getItem('caremesh_requests');
    return saved ? JSON.parse(saved) : initialRequests;
  });

  const [resources, setResources] = useState(() => {
    const saved = localStorage.getItem('caremesh_resources');
    return saved ? JSON.parse(saved) : initialResources;
  });

  const [quickActions, setQuickActions] = useState(() => {
    const saved = localStorage.getItem('caremesh_quick_actions');
    return saved ? JSON.parse(saved) : initialQuickActions;
  });

  const [matchingFactors, setMatchingFactors] = useState(() => {
    const saved = localStorage.getItem('caremesh_matching');
    return saved ? JSON.parse(saved) : initialMatchingFactors;
  });

  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('caremesh_events');
    return saved ? JSON.parse(saved) : initialEvents;
  });

  const [plans, setPlans] = useState(() => {
    const saved = localStorage.getItem('caremesh_plans');
    if (!saved) return initialPlans;
    try {
      const parsed = JSON.parse(saved);
      if (!parsed[0]?.proposedApproach || !parsed[0]?.feedback) {
        return initialPlans;
      }
      return parsed;
    } catch {
      return initialPlans;
    }
  });

  const [communities, setCommunities] = useState(() => {
    const saved = localStorage.getItem('caremesh_communities');
    return saved ? JSON.parse(saved) : initialCommunities;
  });

  const [posts, setPosts] = useState(() => {
    const saved = localStorage.getItem('caremesh_posts');
    return saved ? JSON.parse(saved) : initialPosts;
  });

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('caremesh_notifs');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem('caremesh_convos');
    return saved ? JSON.parse(saved) : initialConversations;
  });

  // Sync back to local storage
  useEffect(() => {
    try {
      localStorage.setItem('caremesh_user', JSON.stringify(currentUser));
      localStorage.setItem('caremesh_observations', JSON.stringify(observations));
      localStorage.setItem('caremesh_claims', JSON.stringify(claims));
      localStorage.setItem('caremesh_disputes', JSON.stringify(disputes));
      localStorage.setItem('caremesh_evidence', JSON.stringify(evidence));
      localStorage.setItem('caremesh_requests', JSON.stringify(requests));
      localStorage.setItem('caremesh_resources', JSON.stringify(resources));
      localStorage.setItem('caremesh_quick_actions', JSON.stringify(quickActions));
      localStorage.setItem('caremesh_matching', JSON.stringify(matchingFactors));
      localStorage.setItem('caremesh_plans', JSON.stringify(plans));
      localStorage.setItem('caremesh_events', JSON.stringify(events));
      localStorage.setItem('caremesh_safety', JSON.stringify(safetyReports));
      localStorage.setItem('caremesh_posts', JSON.stringify(posts));
      localStorage.setItem('caremesh_communities', JSON.stringify(communities));
      localStorage.setItem('caremesh_convos', JSON.stringify(conversations));
      localStorage.setItem('caremesh_notifs', JSON.stringify(notifications));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [
    currentUser,
    observations,
    claims,
    disputes,
    evidence,
    requests,
    resources,
    quickActions,
    matchingFactors,
    plans,
    events,
    safetyReports,
    posts,
    communities,
    conversations,
    notifications
  ]);

  // Navigation Helper
  const navigateTo = useCallback((view, subTab = null, entityId = null) => {
    setCurrentView(view);
    if (subTab) setCurrentSubTab(subTab);
    if (entityId) setHighlightedEntityId(entityId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Creation modal handlers
  const openCreateModal = (type = 'observation', prefill = null) => {
    setCreateModalType(type);
    setCreateModalPrefill(prefill);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateModalPrefill(null);
  };

  // Inspector handlers
  const inspectEntity = (entity, type) => {
    setInspectedEntity({ entity, type });
  };

  const closeInspector = () => {
    setInspectedEntity(null);
  };

  // Dispute & Observation Challenge Modal Handlers
  const openDisputeModal = (claim) => {
    setDisputeModalTarget(claim);
  };

  const closeDisputeModal = () => {
    setDisputeModalTarget(null);
  };

  const openObservationRelationModal = (targetObservation, relationType = 'contradictory') => {
    setObservationRelationTarget({ targetObservation, relationType });
  };

  const closeObservationRelationModal = () => {
    setObservationRelationTarget(null);
  };

  const openShareSocialModal = (entity, type) => {
    setShareSocialTarget({ entity, type });
  };

  const closeShareSocialModal = () => {
    setShareSocialTarget(null);
  };

  // Group creation & invite modals
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const openCreateGroupModal = () => setIsCreateGroupModalOpen(true);
  const closeCreateGroupModal = () => setIsCreateGroupModalOpen(false);

  const [inviteModalCommunity, setInviteModalCommunity] = useState(null);
  const openInviteModal = (community) => setInviteModalCommunity(community);
  const closeInviteModal = () => setInviteModalCommunity(null);

  // Plan detail and revision handlers
  const viewPlanDetail = (plan) => {
    setSelectedPlanDetail(plan);
  };

  const closePlanDetail = () => {
    setSelectedPlanDetail(null);
  };

  const [revisePlanTarget, setRevisePlanTarget] = useState(null);
  const openRevisePlanModal = (plan) => setRevisePlanTarget(plan);
  const closeRevisePlanModal = () => setRevisePlanTarget(null);

  const [logOutcomeModalTarget, setLogOutcomeModalTarget] = useState(null);
  const openLogOutcomeModal = (plan) => setLogOutcomeModalTarget(plan);
  const closeLogOutcomeModal = () => setLogOutcomeModalTarget(null);

  // Helper to ensure precise lat/lng
  const resolveCoordinates = (data) => {
    const lat = data.lat !== undefined && data.lat !== null && !isNaN(Number(data.lat))
      ? Number(data.lat)
      : 37.7749 + (Math.random() - 0.5) * 0.02;
    const lng = data.lng !== undefined && data.lng !== null && !isNaN(Number(data.lng))
      ? Number(data.lng)
      : -122.4194 + (Math.random() - 0.5) * 0.02;
    return {
      lat: parseFloat(lat.toFixed(4)),
      lng: parseFloat(lng.toFixed(4))
    };
  };

  // Entity Creation Actions
  const createObservation = (data) => {
    const newId = `obs_${Date.now()}`;
    let newClaimId = null;
    const coords = resolveCoordinates(data);

    // If an assertion is provided, create a linked Claim
    if (data.claimText && data.claimText.trim()) {
      newClaimId = `clm_${Date.now()}`;
      const newClaim = {
        id: newClaimId,
        observationId: newId,
        assertionText: data.claimText.trim(),
        status: 'reported',
        supportingEvidenceIds: [],
        contradictingEvidenceIds: [],
        disputeIds: [],
        assessmentNotes: 'Initial claim logged with observation. Open for community peer-context, corroborating evidence, or substantive disputes.',
        lastUpdated: 'Just now'
      };
      setClaims(prev => [newClaim, ...prev]);
    }

    const newObs = {
      id: newId,
      title: data.title.trim(),
      category: data.category || 'environmental',
      description: data.description,
      location: {
        address: data.locationAddress || 'Maplewood Local Area',
        lat: coords.lat,
        lng: coords.lng
      },
      author: currentUser,
      timestamp: 'Just now',
      mediaUrls: data.imageUrl ? [data.imageUrl] : ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80'],
      status: 'action_underway',
      claimIds: newClaimId ? [newClaimId] : [],
      evidenceIds: [],
      supportingObservationIds: [],
      contradictoryObservationIds: [],
      relatedRequestIds: [],
      relatedResourceIds: [],
      relatedEventIds: [],
      relatedPlanIds: []
    };

    setObservations(prev => [newObs, ...prev]);
    closeCreateModal();
    return newObs;
  };

  const createRequest = (data) => {
    const newId = `req_${Date.now()}`;
    const coords = resolveCoordinates(data);
    const peopleNeeded = parseInt(data.peopleNeeded, 10) || 2;

    // Build quick action if requested or urgent
    const quickActionsForRequest = [];
    if (data.urgency === 'high' || data.urgency === 'critical' || data.includeQuickAction) {
      quickActionsForRequest.push({
        id: `qa_${Date.now()}`,
        title: `Quick Help: ${data.title}`,
        actionType: data.category === 'transport' ? 'transport' : data.category === 'supplies' ? 'deliver' : 'volunteer',
        timeEstimate: data.timeEstimate || '30 mins',
        neededContribution: data.description
      });
    }

    const newReq = {
      id: newId,
      title: data.title.trim(),
      description: data.description,
      category: data.category || 'labor',
      location: {
        address: data.locationAddress || 'Maplewood Central',
        lat: coords.lat,
        lng: coords.lng
      },
      urgency: data.urgency || 'medium',
      requiredSkills: data.requiredSkills ? data.requiredSkills.split(',').map(s => s.trim()) : ['Community Volunteer'],
      requiredResources: data.requiredResources ? data.requiredResources.split(',').map(s => s.trim()) : [],
      peopleNeeded,
      peopleJoined: 0,
      progressPercentage: 0,
      status: 'open',
      requester: currentUser,
      createdAt: 'Just now',
      expiresAt: data.expiresAt || 'In 48 hours',
      evidenceIds: [],
      matchedResourceIds: [],
      quickActions: quickActionsForRequest,
      responses: []
    };

    setRequests(prev => [newReq, ...prev]);

    // Also update quickActions collection
    if (quickActionsForRequest.length > 0) {
      const flatQAs = quickActionsForRequest.map(qa => ({
        ...qa,
        requestId: newId,
        targetObjectId: newId,
        targetObjectType: 'request',
        requestTitle: newReq.title,
        location: newReq.location.address,
        urgency: newReq.urgency,
        category: newReq.category
      }));
      setQuickActions(prev => [...flatQAs, ...prev]);
    }

    closeCreateModal();
    return newReq;
  };

  const createResource = (data) => {
    const newId = `res_${Date.now()}`;
    const coords = resolveCoordinates(data);

    const newRes = {
      id: newId,
      title: data.title.trim(),
      description: data.description,
      category: data.category || 'supplies',
      contributionType: data.contributionType || 'lend',
      provider: currentUser,
      location: {
        address: data.locationAddress || 'Maplewood Eastside',
        lat: coords.lat,
        lng: coords.lng
      },
      availability: data.availability || 'immediate',
      quantity: data.quantity || '1 Available',
      condition: data.condition || 'Community-provided / Good working condition',
      conditionsTerms: data.conditionsTerms || 'Available for community coordination.',
      validUntil: data.validUntil || 'Ongoing',
      linkedRequestIds: []
    };

    setResources(prev => [newRes, ...prev]);
    closeCreateModal();
    return newRes;
  };

  const createEvent = (data) => {
    const newId = `evt_${Date.now()}`;
    const coords = resolveCoordinates(data);

    const newEvt = {
      id: newId,
      title: data.title.trim(),
      eventType: data.eventType || 'community_activity',
      description: data.description,
      location: {
        address: data.locationAddress || 'Maplewood Community Hub',
        lat: coords.lat,
        lng: coords.lng
      },
      date: data.date || 'Upcoming Weekend',
      time: data.time || '10:00 AM - 1:00 PM',
      organizer: currentUser,
      participants: [currentUser],
      maxParticipants: parseInt(data.maxParticipants, 10) || 12,
      status: 'upcoming',
      relatedRequestIds: [],
      relatedResourceIds: [],
      relatedPlanIds: [],
      chatMessages: [
        { id: `m_${Date.now()}`, sender: currentUser, text: 'Coordination activity scheduled. Welcome all participants.', time: 'Just now' }
      ]
    };

    setEvents(prev => [newEvt, ...prev]);
    closeCreateModal();
    return newEvt;
  };

  const createPlan = (data) => {
    const newId = `plan_${Date.now()}`;
    const newPlan = {
      id: newId,
      title: data.title.trim(),
      problemStatement: data.problemStatement || '',
      desiredOutcome: data.desiredOutcome || '',
      proposedApproach: data.proposedApproach || '',
      resourcesNeeded: data.resourcesNeeded || '',
      location: data.location || 'Maplewood Community District',
      affectedParties: data.affectedParties || 'Local residents and neighborhood stakeholders',
      goals: data.goals ? (Array.isArray(data.goals) ? data.goals : data.goals.split('\n').filter(g => g.trim())) : ['Coordinate community volunteer response', 'Measure real-world outcome'],
      lifecycleStage: data.lifecycleStage || 'community_review',
      overallStatus: data.overallStatus || 'planning',
      currentVersion: 'v1.0',
      proposer: currentUser,
      participants: [
        { user: currentUser, role: 'Proposal Author & Coordinator', joinedAt: 'Just now' }
      ],
      feedback: [],
      revisionHistory: [
        {
          version: 'v1.0',
          date: 'Today',
          revisedBy: currentUser.name,
          summaryOfChanges: 'Initial proposal draft submitted for community review.',
          reasoningForChanges: 'Formulated to solve community challenge.',
          incorporatedFeedbackIds: []
        }
      ],
      milestones: [
        { id: `m_${Date.now()}_1`, title: 'Community review & critique phase', dueDate: 'In 1 Week', status: 'in_progress', completedDate: null, assignedTo: currentUser.name },
        { id: `m_${Date.now()}_2`, title: 'Draft resources, permits, and volunteer requirements', dueDate: 'In 2 Weeks', status: 'pending', completedDate: null, assignedTo: currentUser.name },
        { id: `m_${Date.now()}_3`, title: 'Coordinate action workdays and record outcomes', dueDate: 'In 1 Month', status: 'pending', completedDate: null, assignedTo: 'Volunteer Team' }
      ],
      decisions: [
        { id: `dec_${Date.now()}`, title: 'Submitted proposal for open community critique', rationale: 'Long-term challenges require continuous tracking and collaborative stress-testing before active execution.', date: 'Today', decidedBy: currentUser.name }
      ],
      linkedRequestIds: [],
      linkedResourceIds: [],
      linkedEventIds: [],
      linkedObservationIds: [],
      linkedClaimIds: [],
      evidenceIds: [],
      outcomesEvaluation: 'Proposal initiated. Open for collaborative critique, alternatives, and risk assessments.',
      updates: [
        { date: 'Today', note: 'Proposal published to CareMesh directory for community review.' }
      ]
    };

    setPlans(prev => [newPlan, ...prev]);
    closeCreateModal();
    return newPlan;
  };

  const createSafetyReport = (data) => {
    const newId = `safe_${Date.now()}`;
    const coords = resolveCoordinates(data);

    const newReport = {
      id: newId,
      title: data.title.trim(),
      description: data.description,
      severity: data.severity || 'high',
      status: 'active',
      location: {
        address: data.locationAddress || 'Maplewood Area',
        lat: coords.lat,
        lng: coords.lng
      },
      timestamp: 'Just now',
      reporter: currentUser,
      evidenceIds: [],
      relatedObservationIds: [],
      mitigationActions: data.mitigationActions ? data.mitigationActions.split('\n').filter(a => a.trim()) : ['Exercise caution in affected perimeter', 'Check updates on CareMesh'],
      updatesLog: [
        { time: 'Just now', note: `Safety report submitted by ${currentUser.name}.` }
      ]
    };

    setSafetyReports(prev => [newReport, ...prev]);

    // Push notification to user
    const newNotif = {
      id: `notif_${Date.now()}`,
      type: 'safety_alert',
      title: 'New Safety Alert Posted',
      body: `"${newReport.title}" in ${newReport.location.address}`,
      timestamp: 'Just now',
      isRead: false,
      targetView: 'explore',
      targetEntityId: newId
    };
    setNotifications(prev => [newNotif, ...prev]);

    closeCreateModal();
    return newReport;
  };

  // Explicit Social Sharing Action (Decoupled from creation)
  const shareObservationToSocial = (observationId, userNote = '') => {
    const obs = observations.find(o => o.id === observationId);
    if (!obs) return;

    const contentText = userNote.trim() 
      ? `${userNote.trim()}\n\n[Observation Context]: "${obs.title}" - ${obs.description}`
      : `Sharing observation: "${obs.title}". ${obs.description}`;

    const newPost = {
      id: `post_${Date.now()}`,
      author: currentUser,
      content: contentText,
      timestamp: 'Just now',
      linkedEntityType: 'observation',
      linkedEntityId: obs.id,
      linkedEntityTitle: obs.title,
      endorsedCount: 0,
      comments: []
    };

    setPosts(prev => [newPost, ...prev]);

    const notif = {
      id: `notif_${Date.now()}`,
      type: 'social_share',
      title: 'Shared to Coordination Feed',
      body: `Observation "${obs.title}" was shared to the community coordination feed.`,
      timestamp: 'Just now',
      isRead: false,
      targetView: 'social',
      targetSubTab: 'feed'
    };
    setNotifications(prev => [notif, ...prev]);
    closeShareSocialModal();
  };

  const createPost = (content, linkedEntity = null, communityId = null, extraData = {}) => {
    const newPost = {
      id: `post_${Date.now()}`,
      communityId: communityId || extraData.communityId || null,
      author: currentUser,
      content,
      timestamp: 'Just now',
      isPinned: Boolean(extraData.isPinned),
      linkedEntityType: linkedEntity?.type || null,
      linkedEntityId: linkedEntity?.id || null,
      linkedEntityTitle: linkedEntity?.title || null,
      mediaUrls: extraData.mediaUrls || [],
      poll: extraData.poll || null,
      endorsedCount: 0,
      comments: []
    };
    setPosts(prev => [newPost, ...prev]);
    return newPost;
  };

  // FIRST-CLASS DISPUTE & CLAIM CHALLENGE ACTIONS
  const disputeClaim = ({ claimId, reason, explanation, evidenceData, relatedObservationId }) => {
    const targetClaim = claims.find(c => c.id === claimId);
    if (!targetClaim) return null;

    let createdEvidenceId = null;
    if (evidenceData && evidenceData.title && evidenceData.title.trim()) {
      createdEvidenceId = `ev_${Date.now()}`;
      const newEv = {
        id: createdEvidenceId,
        title: evidenceData.title.trim(),
        type: evidenceData.type || 'document',
        author: currentUser.name,
        authorId: currentUser.id,
        timestamp: 'Just now',
        url: evidenceData.url || '',
        description: evidenceData.description || 'Counter-evidence attached to dispute.',
        provenanceChain: [
          { step: `Uploaded by ${currentUser.name} as counter-evidence`, time: 'Just now' }
        ]
      };
      setEvidence(prev => [newEv, ...prev]);
    }

    const newDisputeId = `disp_${Date.now()}`;
    const newDispute = {
      id: newDisputeId,
      claimId,
      author: {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role
      },
      timestamp: 'Just now',
      reason,
      explanation: explanation.trim(),
      counterEvidenceIds: createdEvidenceId ? [createdEvidenceId] : (evidenceData?.counterEvidenceIds || []),
      relatedObservationId: relatedObservationId || null,
      status: 'active_challenge' // 'active_challenge' | 'reviewed' | 'resolved'
    };

    setDisputes(prev => [newDispute, ...prev]);

    // Update the Claim status and dispute IDs
    setClaims(prev => prev.map(c => {
      if (c.id === claimId) {
        const nextDisputes = [...(c.disputeIds || []), newDisputeId];
        const nextContradicting = createdEvidenceId 
          ? [...(c.contradictingEvidenceIds || []), createdEvidenceId]
          : (c.contradictingEvidenceIds || []);

        return {
          ...c,
          status: 'disputed',
          disputeIds: nextDisputes,
          contradictingEvidenceIds: nextContradicting,
          assessmentNotes: `Substantive dispute submitted by ${currentUser.name}: "${explanation.trim().slice(0, 120)}..."`,
          lastUpdated: 'Just now'
        };
      }
      return c;
    }));

    // Notification
    const notif = {
      id: `notif_${Date.now()}`,
      type: 'claim_dispute',
      title: 'Claim Dispute Registered',
      body: `You logged a challenge for claim: "${targetClaim.assertionText.slice(0, 60)}..."`,
      timestamp: 'Just now',
      isRead: false,
      targetView: 'explore',
      targetEntityId: targetClaim.observationId
    };
    setNotifications(prev => [notif, ...prev]);
    closeDisputeModal();
    return newDispute;
  };

  const supportClaim = ({ claimId, evidenceData, note }) => {
    let createdEvidenceId = null;
    if (evidenceData && evidenceData.title && evidenceData.title.trim()) {
      createdEvidenceId = `ev_${Date.now()}`;
      const newEv = {
        id: createdEvidenceId,
        title: evidenceData.title.trim(),
        type: evidenceData.type || 'photo',
        author: currentUser.name,
        authorId: currentUser.id,
        timestamp: 'Just now',
        url: evidenceData.url || '',
        description: evidenceData.description || 'Supporting corroborating evidence.',
        provenanceChain: [
          { step: `Corroborated by ${currentUser.name}`, time: 'Just now' }
        ]
      };
      setEvidence(prev => [newEv, ...prev]);
    }

    setClaims(prev => prev.map(c => {
      if (c.id === claimId) {
        const nextSupporting = createdEvidenceId 
          ? [...(c.supportingEvidenceIds || []), createdEvidenceId]
          : (c.supportingEvidenceIds || []);
        
        return {
          ...c,
          supportingEvidenceIds: nextSupporting,
          assessmentNotes: note ? `${note} (Added by ${currentUser.name})` : c.assessmentNotes,
          lastUpdated: 'Just now'
        };
      }
      return c;
    }));
  };

  // Add Contradictory Observation (Creates its own distinct observation)
  const addContradictoryObservation = ({ targetObservationId, title, description, locationAddress, lat, lng, imageUrl, evidenceData }) => {
    const targetObs = observations.find(o => o.id === targetObservationId);
    const newId = `obs_${Date.now()}_contra`;
    const coords = resolveCoordinates({ lat, lng });

    let createdEvidenceId = null;
    if (evidenceData && evidenceData.title) {
      createdEvidenceId = `ev_${Date.now()}`;
      const newEv = {
        id: createdEvidenceId,
        title: evidenceData.title,
        type: evidenceData.type || 'measurement',
        author: currentUser.name,
        authorId: currentUser.id,
        timestamp: 'Just now',
        url: imageUrl || '',
        description: evidenceData.description || description,
        provenanceChain: [
          { step: `Documented by ${currentUser.name}`, time: 'Just now' }
        ]
      };
      setEvidence(prev => [newEv, ...prev]);
    }

    const newObs = {
      id: newId,
      title: title.trim(),
      category: targetObs?.category || 'environmental',
      description: description.trim(),
      location: {
        address: locationAddress || targetObs?.location?.address || 'Maplewood Local Area',
        lat: coords.lat || targetObs?.location?.lat || 37.7749,
        lng: coords.lng || targetObs?.location?.lng || -122.4194
      },
      author: currentUser,
      timestamp: 'Just now',
      mediaUrls: imageUrl ? [imageUrl] : [],
      status: 'resolved_disputed',
      isContradiction: true,
      contradictionTargetId: targetObservationId,
      claimIds: targetObs?.claimIds || [],
      evidenceIds: createdEvidenceId ? [createdEvidenceId] : [],
      supportingObservationIds: [],
      contradictoryObservationIds: [],
      relatedRequestIds: [],
      relatedResourceIds: [],
      relatedEventIds: [],
      relatedPlanIds: []
    };

    // Add new contradiction observation
    setObservations(prev => [
      newObs,
      ...prev.map(obs => {
        if (obs.id === targetObservationId) {
          return {
            ...obs,
            contradictoryObservationIds: [...(obs.contradictoryObservationIds || []), newId]
          };
        }
        return obs;
      })
    ]);

    closeObservationRelationModal();
    return newObs;
  };

  // Add Supporting Observation
  const addSupportingObservation = ({ targetObservationId, title, description, locationAddress, lat, lng, imageUrl, evidenceData }) => {
    const targetObs = observations.find(o => o.id === targetObservationId);
    const newId = `obs_${Date.now()}_sup`;
    const coords = resolveCoordinates({ lat, lng });

    let createdEvidenceId = null;
    if (evidenceData && evidenceData.title) {
      createdEvidenceId = `ev_${Date.now()}`;
      const newEv = {
        id: createdEvidenceId,
        title: evidenceData.title,
        type: evidenceData.type || 'photo',
        author: currentUser.name,
        authorId: currentUser.id,
        timestamp: 'Just now',
        url: imageUrl || '',
        description: evidenceData.description || description,
        provenanceChain: [
          { step: `Supporting survey recorded by ${currentUser.name}`, time: 'Just now' }
        ]
      };
      setEvidence(prev => [newEv, ...prev]);
    }

    const newObs = {
      id: newId,
      title: title.trim(),
      category: targetObs?.category || 'environmental',
      description: description.trim(),
      location: {
        address: locationAddress || targetObs?.location?.address || 'Maplewood Local Area',
        lat: coords.lat || targetObs?.location?.lat || 37.7749,
        lng: coords.lng || targetObs?.location?.lng || -122.4194
      },
      author: currentUser,
      timestamp: 'Just now',
      mediaUrls: imageUrl ? [imageUrl] : [],
      status: 'action_underway',
      isSupporting: true,
      supportingTargetId: targetObservationId,
      claimIds: targetObs?.claimIds || [],
      evidenceIds: createdEvidenceId ? [createdEvidenceId] : [],
      supportingObservationIds: [],
      contradictoryObservationIds: [],
      relatedRequestIds: [],
      relatedResourceIds: [],
      relatedEventIds: [],
      relatedPlanIds: []
    };

    setObservations(prev => [
      newObs,
      ...prev.map(obs => {
        if (obs.id === targetObservationId) {
          return {
            ...obs,
            supportingObservationIds: [...(obs.supportingObservationIds || []), newId]
          };
        }
        return obs;
      })
    ]);

    closeObservationRelationModal();
    return newObs;
  };

  // Add Evidence to Claim
  const addEvidenceToClaim = ({ claimId, evidenceData, isSupporting = true }) => {
    if (!evidenceData?.title?.trim()) return;
    const newEvId = `ev_${Date.now()}`;
    const newEv = {
      id: newEvId,
      title: evidenceData.title.trim(),
      type: evidenceData.type || 'document',
      author: currentUser.name,
      authorId: currentUser.id,
      timestamp: 'Just now',
      url: evidenceData.url || '',
      description: evidenceData.description || '',
      provenanceChain: [
        { step: `Added by ${currentUser.name}`, time: 'Just now' }
      ]
    };

    setEvidence(prev => [newEv, ...prev]);

    setClaims(prev => prev.map(c => {
      if (c.id === claimId) {
        return {
          ...c,
          supportingEvidenceIds: isSupporting ? [...(c.supportingEvidenceIds || []), newEvId] : c.supportingEvidenceIds,
          contradictingEvidenceIds: !isSupporting ? [...(c.contradictingEvidenceIds || []), newEvId] : c.contradictingEvidenceIds,
          lastUpdated: 'Just now'
        };
      }
      return c;
    }));
  };

  // Interaction Actions
  const respondToRequest = (requestId, role = 'Volunteer') => {
    setRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        const alreadyJoined = req.responses?.some(r => r.user?.id === currentUser.id);
        if (alreadyJoined) return req;

        const newResponses = [...(req.responses || []), { user: currentUser, role, time: 'Just now' }];
        const newJoined = req.peopleJoined + 1;
        const newProgress = Math.min(100, Math.round((newJoined / (req.peopleNeeded || 1)) * 100));
        const newStatus = newProgress >= 100 ? 'fulfilled' : 'partially_fulfilled';

        return {
          ...req,
          peopleJoined: newJoined,
          progressPercentage: newProgress,
          status: newStatus,
          responses: newResponses
        };
      }
      return req;
    }));

    // Add notification
    const notif = {
      id: `notif_${Date.now()}`,
      type: 'request_response',
      title: 'You Committed to Help',
      body: `You volunteered for request coordination. Coordination pathway established.`,
      timestamp: 'Just now',
      isRead: false,
      targetView: 'collaborate',
      targetSubTab: 'requests',
      targetEntityId: requestId
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const joinEvent = (eventId) => {
    setEvents(prev => prev.map(evt => {
      if (evt.id === eventId) {
        const isJoined = evt.participants.some(p => p.id === currentUser.id);
        if (isJoined) return evt;
        return {
          ...evt,
          participants: [...evt.participants, currentUser]
        };
      }
      return evt;
    }));
  };

  const sendEventChatMessage = (eventId, text) => {
    if (!text || !text.trim()) return;
    setEvents(prev => prev.map(evt => {
      if (evt.id === eventId) {
        return {
          ...evt,
          chatMessages: [
            ...(evt.chatMessages || []),
            { id: `m_${Date.now()}`, sender: currentUser, text: text.trim(), time: 'Just now' }
          ]
        };
      }
      return evt;
    }));
  };

  const togglePlanMilestone = (planId, milestoneId) => {
    setPlans(prev => prev.map(plan => {
      if (plan.id === planId) {
        const updatedMilestones = plan.milestones.map(m => {
          if (m.id === milestoneId) {
            const nextStatus = m.status === 'completed' ? 'in_progress' : 'completed';
            return {
              ...m,
              status: nextStatus,
              completedDate: nextStatus === 'completed' ? 'Today' : null
            };
          }
          return m;
        });

        const completedCount = updatedMilestones.filter(m => m.status === 'completed').length;
        let nextOverallStatus = plan.overallStatus || 'in_progress';
        if (completedCount === updatedMilestones.length && updatedMilestones.length > 0) {
          nextOverallStatus = 'completed';
        } else if (completedCount > 0 && nextOverallStatus === 'planning') {
          nextOverallStatus = 'in_progress';
        }

        return {
          ...plan,
          milestones: updatedMilestones,
          overallStatus: nextOverallStatus
        };
      }
      return plan;
    }));
  };

  const addPlanDecision = (planId, decisionData) => {
    setPlans(prev => prev.map(plan => {
      if (plan.id === planId) {
        const newDecision = {
          id: `dec_${Date.now()}`,
          title: decisionData.title,
          rationale: decisionData.rationale,
          date: 'Today',
          decidedBy: currentUser.name
        };
        const updated = {
          ...plan,
          decisions: [newDecision, ...(plan.decisions || [])]
        };
        if (selectedPlanDetail?.id === planId) {
          setSelectedPlanDetail(updated);
        }
        return updated;
      }
      return plan;
    }));
  };

  const addPlanFeedback = (planId, feedbackData) => {
    const newFeedbackItem = {
      id: `fb_${Date.now()}`,
      type: feedbackData.type || 'comment',
      author: currentUser,
      text: feedbackData.text.trim(),
      suggestedChange: feedbackData.suggestedChange ? feedbackData.suggestedChange.trim() : '',
      status: 'open',
      resolutionNote: '',
      date: 'Today'
    };

    setPlans(prev => prev.map(p => {
      if (p.id === planId) {
        const updated = {
          ...p,
          feedback: [newFeedbackItem, ...(p.feedback || [])]
        };
        if (selectedPlanDetail?.id === planId) {
          setSelectedPlanDetail(updated);
        }
        return updated;
      }
      return p;
    }));

    return newFeedbackItem;
  };

  const revisePlan = (planId, revisionData) => {
    setPlans(prev => prev.map(p => {
      if (p.id === planId) {
        const currentV = p.currentVersion || 'v1.0';
        const parts = currentV.replace('v', '').split('.');
        const major = parseInt(parts[0] || '1', 10);
        const minor = parseInt(parts[1] || '0', 10) + 1;
        const nextVersion = `v${major}.${minor}`;

        const revisionEntry = {
          version: nextVersion,
          date: 'Today',
          revisedBy: currentUser.name,
          summaryOfChanges: revisionData.summaryOfChanges || 'Proposal revised based on community feedback.',
          reasoningForChanges: revisionData.reasoningForChanges || 'Updated approach and scope to reflect critique.',
          incorporatedFeedbackIds: revisionData.incorporatedFeedbackIds || []
        };

        const updatedFeedback = (p.feedback || []).map(fb => {
          if (revisionData.incorporatedFeedbackIds?.includes(fb.id)) {
            return {
              ...fb,
              status: 'adopted',
              resolutionNote: `Adopted in ${nextVersion}: ${revisionData.reasoningForChanges || 'Addressed in revision'}`
            };
          }
          return fb;
        });

        const autoDecision = {
          id: `dec_${Date.now()}`,
          title: `Revision ${nextVersion}: ${revisionData.summaryOfChanges || 'Updated proposal specifications'}`,
          rationale: revisionData.reasoningForChanges || 'Adopted community critique and improved proposal feasibility.',
          date: 'Today',
          decidedBy: currentUser.name,
          versionTag: nextVersion,
          isRevisionDecision: true,
          incorporatedFeedbackIds: revisionData.incorporatedFeedbackIds || []
        };

        const updatedPlan = {
          ...p,
          title: revisionData.title ? revisionData.title.trim() : p.title,
          problemStatement: revisionData.problemStatement !== undefined ? revisionData.problemStatement : p.problemStatement,
          desiredOutcome: revisionData.desiredOutcome !== undefined ? revisionData.desiredOutcome : p.desiredOutcome,
          proposedApproach: revisionData.proposedApproach !== undefined ? revisionData.proposedApproach : p.proposedApproach,
          resourcesNeeded: revisionData.resourcesNeeded !== undefined ? revisionData.resourcesNeeded : p.resourcesNeeded,
          affectedParties: revisionData.affectedParties !== undefined ? revisionData.affectedParties : p.affectedParties,
          goals: revisionData.goals !== undefined ? (Array.isArray(revisionData.goals) ? revisionData.goals : revisionData.goals.split('\n').filter(g => g.trim())) : p.goals,
          milestones: revisionData.milestones !== undefined ? revisionData.milestones : p.milestones,
          currentVersion: nextVersion,
          lifecycleStage: p.lifecycleStage === 'draft' || p.lifecycleStage === 'community_review' ? 'revised' : p.lifecycleStage,
          feedback: updatedFeedback,
          revisionHistory: [revisionEntry, ...(p.revisionHistory || [])],
          decisions: [autoDecision, ...(p.decisions || [])],
          updates: [
            { date: 'Today', note: `Published revision ${nextVersion}: ${revisionData.summaryOfChanges}` },
            ...(p.updates || [])
          ]
        };

        if (selectedPlanDetail?.id === planId) {
          setSelectedPlanDetail(updatedPlan);
        }

        return updatedPlan;
      }
      return p;
    }));

    closeRevisePlanModal();
  };

  const updatePlanStage = (planId, newStage) => {
    setPlans(prev => prev.map(p => {
      if (p.id === planId) {
        let nextOverallStatus = p.overallStatus || 'planning';
        if (newStage === 'active') nextOverallStatus = 'in_progress';
        if (newStage === 'completed') nextOverallStatus = 'completed';
        if (newStage === 'cancelled') nextOverallStatus = 'cancelled';
        if (newStage === 'draft' || newStage === 'community_review' || newStage === 'revised' || newStage === 'accepted') {
          nextOverallStatus = 'planning';
        }

        const updatedPlan = {
          ...p,
          lifecycleStage: newStage,
          overallStatus: nextOverallStatus,
          updates: [
            { date: 'Today', note: `Proposal advanced to stage: ${newStage.replace('_', ' ')}` },
            ...(p.updates || [])
          ]
        };

        if (selectedPlanDetail?.id === planId) {
          setSelectedPlanDetail(updatedPlan);
        }

        return updatedPlan;
      }
      return p;
    }));
  };

  const logPlanOutcomeReport = (planId, reportData) => {
    setPlans(prev => prev.map(p => {
      if (p.id === planId) {
        const newReport = {
          evaluatedAt: reportData.evaluatedAt || 'Today',
          evaluator: reportData.evaluator || currentUser.name,
          goal: reportData.goal || p.desiredOutcome || p.problemStatement,
          actualResults: reportData.actualResults && reportData.actualResults.length > 0 
            ? reportData.actualResults 
            : ['Plan implementation milestones completed and verified by working group.'],
          outcomeStatus: reportData.outcomeStatus || 'achieved',
          evidenceTypes: reportData.evidenceTypes || ['Field observation', 'Measurements'],
          linkedEvidenceIds: reportData.linkedEvidenceIds || [],
          linkedObservationIds: reportData.linkedObservationIds || [],
          unexpectedEffects: reportData.unexpectedEffects?.trim() || '',
          lessons: reportData.lessons?.trim() || '',
          guidanceForFuture: reportData.guidanceForFuture?.trim() || ''
        };

        const updatedPlan = {
          ...p,
          outcomeReport: newReport,
          outcomesEvaluation: newReport.actualResults.join('. ') + (newReport.lessons ? ` Lessons: ${newReport.lessons}` : ''),
          lifecycleStage: 'completed',
          overallStatus: 'completed',
          updates: [
            { date: 'Today', note: `Outcome Evaluation Report logged: Status is ${newReport.outcomeStatus.replace('_', ' ')}` },
            ...(p.updates || [])
          ],
          decisions: [
            {
              id: `dec_eval_${Date.now()}`,
              title: `Formal Outcome Evaluation: ${newReport.outcomeStatus === 'achieved' ? 'Goal Achieved' : newReport.outcomeStatus === 'partially_achieved' ? 'Goal Partially Achieved' : 'Goal Not Achieved'}`,
              rationale: newReport.lessons ? `Lessons Learned: ${newReport.lessons}` : 'Evaluated post-implementation real-world results against original proposal targets.',
              date: 'Today',
              decidedBy: currentUser.name,
              versionTag: null,
              isRevisionDecision: false,
              incorporatedFeedbackIds: []
            },
            ...(p.decisions || [])
          ]
        };

        if (selectedPlanDetail?.id === planId) {
          setSelectedPlanDetail(updatedPlan);
        }

        const notif = {
          id: `notif_eval_${Date.now()}`,
          type: 'plan_update',
          title: `Outcome Report Published: ${p.title}`,
          body: `Outcome evaluation logged as "${newReport.outcomeStatus.replace('_', ' ')}". Check results and guidance for future projects.`,
          timestamp: 'Just now',
          isRead: false,
          targetView: 'plans',
          targetEntityId: planId
        };
        setNotifications(prevNotifs => [notif, ...prevNotifs]);

        return updatedPlan;
      }
      return p;
    }));
  };

  const markFeedbackStatus = (planId, feedbackId, status, resolutionNote = '') => {
    setPlans(prev => prev.map(p => {
      if (p.id === planId) {
        const nextFeedback = (p.feedback || []).map(fb => {
          if (fb.id === feedbackId) {
            return {
              ...fb,
              status,
              resolutionNote: resolutionNote || fb.resolutionNote
            };
          }
          return fb;
        });

        const updatedPlan = { ...p, feedback: nextFeedback };
        if (selectedPlanDetail?.id === planId) {
          setSelectedPlanDetail(updatedPlan);
        }
        return updatedPlan;
      }
      return p;
    }));
  };

  const matchResourceToRequest = (resourceId, requestId) => {
    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        const matched = r.matchedResourceIds || [];
        return {
          ...r,
          matchedResourceIds: matched.includes(resourceId) ? matched : [...matched, resourceId],
          status: 'partially_fulfilled'
        };
      }
      return r;
    }));

    setResources(prev => prev.map(res => {
      if (res.id === resourceId) {
        const linked = res.linkedRequestIds || [];
        return {
          ...res,
          linkedRequestIds: linked.includes(requestId) ? linked : [...linked, requestId]
        };
      }
      return res;
    }));

    const req = requests.find(r => r.id === requestId);
    const res = resources.find(r => r.id === resourceId);
    const newNotif = {
      id: `notif_${Date.now()}`,
      type: 'resource_match',
      title: 'Match Coordination Initiated',
      body: `Resource "${res?.title || 'Resource'}" matched with "${req?.title || 'Request'}". Direct communication channel opened.`,
      timestamp: 'Just now',
      isRead: false,
      targetView: 'collaborate',
      targetSubTab: 'matcher',
      targetEntityId: requestId
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const toggleJoinCommunity = (communityId) => {
    setCommunities(prev => prev.map(c => {
      if (c.id === communityId) {
        const nextState = !c.isJoined;
        const currentMemberIds = c.memberIds || [];
        const nextMemberIds = nextState
          ? [...currentMemberIds, currentUser.id]
          : currentMemberIds.filter(id => id !== currentUser.id);

        return {
          ...c,
          isJoined: nextState,
          memberIds: nextMemberIds,
          memberCount: nextState ? c.memberCount + 1 : Math.max(0, c.memberCount - 1)
        };
      }
      return c;
    }));
  };

  const createCommunity = (data) => {
    const newId = `com_${Date.now()}`;
    const newCommunity = {
      id: newId,
      name: data.name.trim(),
      handle: data.handle?.trim() || `@${data.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      category: data.category || 'mutual_aid',
      privacy: data.privacy || 'public',
      privacyLabel: `${data.privacy === 'private' ? 'Private Group' : 'Public Group'} · 1 neighbor`,
      description: data.description?.trim() || '',
      location: data.location?.trim() || `${currentUser.location.neighborhood}, Maplewood`,
      memberCount: 1,
      avatar: data.avatar || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=200&auto=format&fit=crop&q=80',
      banner: data.banner || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
      createdDate: 'Formed today · New Group',
      adminIds: [currentUser.id],
      moderatorIds: [],
      memberIds: [currentUser.id],
      pinnedPostId: null,
      rules: data.rules && data.rules.length > 0 ? data.rules : [
        { id: 'r_1', title: 'Evidence & Safety First', description: 'Ensure shared field reports, requests, and plans are safe and grounded in evidence.' },
        { id: 'r_2', title: 'Protect Neighbor Privacy', description: 'Do not publicly share private personal numbers or sensitive medical information.' }
      ],
      mediaGallery: [],
      files: [],
      linkedPlanIds: [],
      linkedEventIds: [],
      linkedRequestIds: [],
      isJoined: true
    };
    setCommunities(prev => [newCommunity, ...prev]);
    return newCommunity;
  };

  const voteOnPoll = (postId, optionId) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId && p.poll) {
        const updatedOptions = p.poll.options.map(opt => {
          const hasVoted = opt.voterIds?.includes(currentUser.id);
          if (opt.id === optionId) {
            if (hasVoted) {
              return {
                ...opt,
                votes: Math.max(0, opt.votes - 1),
                voterIds: (opt.voterIds || []).filter(uid => uid !== currentUser.id)
              };
            } else {
              return {
                ...opt,
                votes: opt.votes + 1,
                voterIds: [...(opt.voterIds || []), currentUser.id]
              };
            }
          } else {
            if (hasVoted) {
              return {
                ...opt,
                votes: Math.max(0, opt.votes - 1),
                voterIds: (opt.voterIds || []).filter(uid => uid !== currentUser.id)
              };
            }
            return opt;
          }
        });

        return {
          ...p,
          poll: {
            ...p.poll,
            options: updatedOptions
          }
        };
      }
      return p;
    }));
  };

  const addCommentToPost = (postId, text) => {
    if (!text || !text.trim()) return;
    const newComment = {
      id: `c_${Date.now()}`,
      author: currentUser,
      text: text.trim(),
      time: 'Just now'
    };
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...(p.comments || []), newComment]
        };
      }
      return p;
    }));
  };

  const togglePinPost = (communityId, postId) => {
    setCommunities(prev => prev.map(c => {
      if (c.id === communityId) {
        return {
          ...c,
          pinnedPostId: c.pinnedPostId === postId ? null : postId
        };
      }
      return c;
    }));
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          isPinned: !p.isPinned
        };
      }
      return p;
    }));
  };

  const endorsePost = (postId) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          endorsedCount: (p.endorsedCount || 0) + 1
        };
      }
      return p;
    }));
  };

  const inviteMembersToCommunity = (communityId, userIds) => {
    setCommunities(prev => prev.map(c => {
      if (c.id === communityId) {
        const existing = c.memberIds || [];
        const merged = Array.from(new Set([...existing, ...userIds]));
        return {
          ...c,
          memberIds: merged,
          memberCount: merged.length
        };
      }
      return c;
    }));
  };

  const sendDirectMessage = (conversationId, text) => {
    if (!text || !text.trim()) return;
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          lastMessage: text.trim(),
          lastTime: 'Just now',
          messages: [
            ...conv.messages,
            { id: `m_${Date.now()}`, senderId: currentUser.id, text: text.trim(), timestamp: 'Just now' }
          ]
        };
      }
      return conv;
    }));
  };

  const markNotificationRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Complete reset of ALL prototype state and localStorage keys
  const resetToSeedData = () => {
    localStorage.clear();
    setObservations(initialObservations);
    setClaims(initialClaims);
    setDisputes(initialDisputes);
    setEvidence(initialEvidence);
    setRequests(initialRequests);
    setResources(initialResources);
    setQuickActions(initialQuickActions);
    setMatchingFactors(initialMatchingFactors);
    setPlans(initialPlans);
    setEvents(initialEvents);
    setSafetyReports(initialSafetyReports);
    setPosts(initialPosts);
    setCommunities(initialCommunities);
    setNotifications(initialNotifications);
    setConversations(initialConversations);
    setCurrentUser(initialCurrentUser);
  };

  return (
    <CareMeshContext.Provider value={{
      // Navigation
      currentView,
      setCurrentView,
      currentSubTab,
      setCurrentSubTab,
      highlightedEntityId,
      setHighlightedEntityId,
      navigateTo,

      // Search
      searchQuery,
      setSearchQuery,

      // Creation & Group Modals
      isCreateModalOpen,
      createModalType,
      createModalPrefill,
      openCreateModal,
      closeCreateModal,
      isCreateGroupModalOpen,
      openCreateGroupModal,
      closeCreateGroupModal,
      inviteModalCommunity,
      openInviteModal,
      closeInviteModal,

      // Dispute & Observation Relation Modals
      disputeModalTarget,
      openDisputeModal,
      closeDisputeModal,
      observationRelationTarget,
      openObservationRelationModal,
      closeObservationRelationModal,
      shareSocialTarget,
      openShareSocialModal,
      closeShareSocialModal,

      // Inspectors & Plan Modals
      inspectedEntity,
      inspectEntity,
      closeInspector,

      selectedPlanDetail,
      viewPlanDetail,
      closePlanDetail,
      revisePlanTarget,
      openRevisePlanModal,
      closeRevisePlanModal,
      logOutcomeModalTarget,
      openLogOutcomeModal,
      closeLogOutcomeModal,

      selectedEventChat,
      setSelectedEventChat,

      activeConversationId,
      setActiveConversationId,

      // Data
      currentUser,
      setCurrentUser,
      mockUsers,
      observations,
      claims,
      setClaims,
      disputes,
      setDisputes,
      evidence,
      setEvidence,
      safetyReports,
      requests,
      resources,
      quickActions,
      matchingFactors,
      events,
      plans,
      communities,
      posts,
      notifications,
      conversations,

      // Actions
      createObservation,
      createRequest,
      createResource,
      createEvent,
      createPlan,
      createSafetyReport,
      shareObservationToSocial,
      createPost,
      createCommunity,
      voteOnPoll,
      addCommentToPost,
      togglePinPost,
      endorsePost,
      inviteMembersToCommunity,
      disputeClaim,
      supportClaim,
      addContradictoryObservation,
      addSupportingObservation,
      addEvidenceToClaim,
      respondToRequest,
      joinEvent,
      sendEventChatMessage,
      togglePlanMilestone,
      addPlanDecision,
      addPlanFeedback,
      revisePlan,
      updatePlanStage,
      logPlanOutcomeReport,
      markFeedbackStatus,
      matchResourceToRequest,
      toggleJoinCommunity,
      sendDirectMessage,
      markNotificationRead,
      markAllNotificationsRead,
      resetToSeedData
    }}>
      {children}
    </CareMeshContext.Provider>
  );
};
