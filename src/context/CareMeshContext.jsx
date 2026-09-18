import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CareMeshContext } from './careMeshContextInstance';
import api from '../api/client';
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
  const navigate = useNavigate();

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

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'

  const openAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Dispute & Observation Relation Modals State
  const [disputeModalTarget, setDisputeModalTarget] = useState(null); // claim object
  const [observationRelationTarget, setObservationRelationTarget] = useState(null); // { targetObservation, relationType: 'contradictory' | 'supporting' }
  const [shareSocialTarget, setShareSocialTarget] = useState(null); // { entity, type }

  // Inspector & Detail Modal State
  const [inspectedEntity, setInspectedEntity] = useState(null); // { entity, type }
  const [selectedEvidenceDetail, setSelectedEvidenceDetail] = useState(null); // { evidence, parentObservation }
  const [selectedPlanDetail, setSelectedPlanDetail] = useState(null);
  const [selectedRequestDetail, setSelectedRequestDetail] = useState(null);
  const [selectedResourceDetail, setSelectedResourceDetail] = useState(null);
  const [selectedSafetyDetail, setSelectedSafetyDetail] = useState(null);
  const [selectedEventChat, setSelectedEventChat] = useState(null);
  const [selectedCommunityId, setSelectedCommunityId] = useState('com_01');
  const [activeConversationId, setActiveConversationId] = useState('conv_01');

  // Accessible Toast Notifications
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', title = null, duration = 4000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast = { id, message, type, title, duration };
    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
    return id;
  }, [dismissToast]);

  // Data version migration to ensure updated geographic distribution replaces stale localStorage cache
  try {
    const DATA_SCHEMA_VERSION = 'v2.2_geo_distributed';
    if (typeof window !== 'undefined' && localStorage.getItem('caremesh_geo_version') !== DATA_SCHEMA_VERSION) {
      localStorage.removeItem('caremesh_observations');
      localStorage.removeItem('caremesh_safety');
      localStorage.removeItem('caremesh_requests');
      localStorage.removeItem('caremesh_resources');
      localStorage.setItem('caremesh_geo_version', DATA_SCHEMA_VERSION);
    }
  } catch {
    // Ignore storage restrictions
  }

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
    try {
      localStorage.removeItem('caremesh_events');
    } catch {
      // Ignore local storage errors
    }
    return [];
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
    const activeId = initialCurrentUser?.id || 'usr_me';
    const saved = localStorage.getItem(`caremesh_notifs_${activeId}`);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return initialNotifications.filter(n => !n.userId || n.userId === activeId);
  });

  const [conversations, setConversations] = useState(() => {
    const activeId = initialCurrentUser?.id || 'usr_me';
    const saved = localStorage.getItem(`caremesh_convos_${activeId}`);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return initialConversations.filter(c => !c.user1Id || c.user1Id === activeId || c.user2Id === activeId);
  });

  const [reports, setReports] = useState(() => {
    const saved = localStorage.getItem('caremesh_reports');
    return saved ? JSON.parse(saved) : [];
  });

  const [readinessChecks, setReadinessChecks] = useState(() => {
    const saved = localStorage.getItem('caremesh_readiness');
    return saved ? JSON.parse(saved) : [];
  });

  const [moderatorElections, setModeratorElections] = useState([]);

  // Modals for Report, Readiness, and Public Records Moderation
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState(null); // { targetType, targetId, title, reportedUser, communityId, scope }

  const [isReadinessModalOpen, setIsReadinessModalOpen] = useState(false);
  const [readinessModalCommunity, setReadinessModalCommunity] = useState(null);
  const [readinessModalCheckId, setReadinessModalCheckId] = useState(null);

  const [isPublicRecordsModModalOpen, setIsPublicRecordsModModalOpen] = useState(false);

  // Request Resource Use / Loan Modal State
  const [isRequestResourceModalOpen, setIsRequestResourceModalOpen] = useState(false);
  const [requestResourceTarget, setRequestResourceTarget] = useState(null); // { resource, prefill }

  // Load latest state from backend SQLite database with account isolation
  const refreshUserData = useCallback(async (newUser = null) => {
    try {
      const data = await api.bootstrap();
      if (!data) return null;
      if (data.currentUser) setCurrentUser(data.currentUser);
      else if (newUser) setCurrentUser(newUser);

      if (data.observations?.length) setObservations(data.observations);
      if (data.claims?.length) setClaims(data.claims);
      if (data.disputes?.length) setDisputes(data.disputes);
      if (data.evidence?.length) setEvidence(data.evidence);
      if (data.safetyReports?.length) setSafetyReports(data.safetyReports);
      if (data.requests) setRequests(data.requests);
      if (data.resources?.length) setResources(data.resources);
      if (data.quickActions?.length) setQuickActions(data.quickActions);
      if (data.matchingFactors?.length) setMatchingFactors(data.matchingFactors);
      if (data.plans?.length) setPlans(data.plans);
      if (data.events?.length) setEvents(data.events);
      if (data.communities?.length) setCommunities(data.communities);
      if (data.posts) setPosts(data.posts);
      setNotifications(data.notifications || []);
      setConversations(data.conversations || []);
      if (data.reports) setReports(data.reports);
      if (data.readinessChecks) setReadinessChecks(data.readinessChecks);
      return data;
    } catch (err) {
      console.warn('Backend API bootstrap unavailable, running in local fallback mode:', err.message);
      const targetId = newUser?.id || currentUser?.id || 'usr_me';
      const savedNotifs = localStorage.getItem(`caremesh_notifs_${targetId}`);
      if (savedNotifs) {
        try { setNotifications(JSON.parse(savedNotifs)); } catch { /* ignore */ }
      } else {
        setNotifications(initialNotifications.filter(n => !n.userId || n.userId === targetId));
      }
      const savedConvos = localStorage.getItem(`caremesh_convos_${targetId}`);
      if (savedConvos) {
        try { setConversations(JSON.parse(savedConvos)); } catch { /* ignore */ }
      }
      return null;
    }
  }, [currentUser?.id]);

  useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      try {
        const data = await api.bootstrap();
        if (!isMounted || !data) return;
        if (data.currentUser) setCurrentUser(data.currentUser);
        if (data.observations?.length) setObservations(data.observations);
        if (data.claims?.length) setClaims(data.claims);
        if (data.disputes?.length) setDisputes(data.disputes);
        if (data.evidence?.length) setEvidence(data.evidence);
        if (data.safetyReports?.length) setSafetyReports(data.safetyReports);
        if (data.requests) setRequests(data.requests);
        if (data.resources?.length) setResources(data.resources);
        if (data.quickActions?.length) setQuickActions(data.quickActions);
        if (data.matchingFactors?.length) setMatchingFactors(data.matchingFactors);
        if (data.plans?.length) setPlans(data.plans);
        if (data.events?.length) setEvents(data.events);
        if (data.communities?.length) setCommunities(data.communities);
        if (data.posts) setPosts(data.posts);
        setNotifications(data.notifications || []);
        setConversations(data.conversations || []);
        if (data.reports) setReports(data.reports);
        if (data.readinessChecks) setReadinessChecks(data.readinessChecks);
      } catch (err) {
        console.warn('Backend API bootstrap unavailable, running in local fallback mode:', err.message);
      }
    }
    loadInitialData();
    return () => { isMounted = false; };
  }, []);

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
      localStorage.setItem('caremesh_safety', JSON.stringify(safetyReports));
      localStorage.setItem('caremesh_posts', JSON.stringify(posts));
      localStorage.setItem('caremesh_communities', JSON.stringify(communities));
      if (currentUser?.id) {
        localStorage.setItem(`caremesh_convos_${currentUser.id}`, JSON.stringify(conversations));
        localStorage.setItem(`caremesh_notifs_${currentUser.id}`, JSON.stringify(notifications));
      }
      localStorage.setItem('caremesh_reports', JSON.stringify(reports));
      localStorage.setItem('caremesh_readiness', JSON.stringify(readinessChecks));
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
    notifications,
    reports,
    readinessChecks
  ]);

  // Navigation Helper
  const navigateTo = useCallback((view, subTab = null, entityId = null, extraState = null) => {
    setCurrentView(view);
    if (subTab) setCurrentSubTab(subTab);
    if (entityId) setHighlightedEntityId(entityId);

    const routeMap = {
      home: '/',
      explore: '/explore',
      collaborate: '/collaborate',
      plans: '/plans',
      social: '/social',
      profile: '/profile',
      inbox: '/social'
    };

    let targetPath = routeMap[view] || (view?.startsWith('/') ? view : `/${view || ''}`);
    if (view === 'explore' && extraState?.initialWorldView) {
      targetPath = '/explore?view=world';
    }

    const navState = {
      ...(extraState || {}),
      subTab,
      highlightedEntityId: entityId
    };

    navigate(targetPath, { state: navState });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [navigate]);

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

  // Evidence Detail Modal Handlers
  const viewEvidenceDetail = useCallback((evidence, parentObservation = null) => {
    if (!evidence) return;
    setSelectedEvidenceDetail({ evidence, parentObservation });
  }, []);

  const closeEvidenceDetailModal = useCallback(() => {
    setSelectedEvidenceDetail(null);
  }, []);

  const closeInspector = () => {
    setInspectedEntity(null);
  };

  // Sub-post query helpers
  const getSubEvidenceForEvidence = useCallback((evidenceId) => {
    if (!evidenceId) return [];
    return evidence.filter(e => 
      (e.parentEvidenceId === evidenceId || e.referencedEvidenceId === evidenceId) && e.id !== evidenceId
    );
  }, [evidence]);

  const getSubContradictionsForEvidence = useCallback((evidenceId) => {
    if (!evidenceId) return [];
    return observations.filter(o => 
      o.referencedEvidenceId === evidenceId && (o.isContradiction || o.category === 'contradiction')
    );
  }, [observations]);

  const getSubCorroborationsForEvidence = useCallback((evidenceId) => {
    if (!evidenceId) return [];
    return observations.filter(o => 
      o.referencedEvidenceId === evidenceId && (o.isSupporting || o.is_supporting)
    );
  }, [observations]);

  // Dispute & Observation Challenge Modal Handlers
  const openDisputeModal = useCallback((target, initialMode = 'claim_dispute') => {
    setDisputeModalTarget({ 
      target: target?.target || target, 
      initialMode: target?.initialMode || initialMode 
    });
  }, []);

  const closeDisputeModal = () => {
    setDisputeModalTarget(null);
  };

  const openObservationRelationModal = (targetObservation, relationType = 'contradictory', options = {}) => {
    setObservationRelationTarget({ targetObservation, relationType, ...options });
  };

  const closeObservationRelationModal = () => {
    setObservationRelationTarget(null);
  };

  // Dispute & Challenge Response (Support or Rebuttal) Modal Handlers
  const [disputeResponseTarget, setDisputeResponseTarget] = useState(null);
  const openDisputeResponseModal = useCallback((dispute, initialType = 'support') => {
    setDisputeResponseTarget({ dispute, initialType });
  }, []);
  const closeDisputeResponseModal = () => {
    setDisputeResponseTarget(null);
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
  const viewPlanDetail = useCallback((plan) => {
    setSelectedPlanDetail(plan);
  }, []);

  const closePlanDetail = () => {
    setSelectedPlanDetail(null);
  };

  // Request detail handlers
  const viewRequestDetail = useCallback((request) => {
    setSelectedRequestDetail(request);
  }, []);

  const closeRequestDetail = () => {
    setSelectedRequestDetail(null);
  };

  // Resource detail handlers
  const viewResourceDetail = useCallback((resource) => {
    setSelectedResourceDetail(resource);
  }, []);

  const closeResourceDetail = () => {
    setSelectedResourceDetail(null);
  };

  // Safety detail handlers
  const viewSafetyDetail = useCallback((report) => {
    setSelectedSafetyDetail(report);
  }, []);

  const closeSafetyDetail = () => {
    setSelectedSafetyDetail(null);
  };

  const [revisePlanTarget, setRevisePlanTarget] = useState(null);
  const openRevisePlanModal = (plan) => setRevisePlanTarget(plan);
  const closeRevisePlanModal = () => setRevisePlanTarget(null);

  const [logOutcomeModalTarget, setLogOutcomeModalTarget] = useState(null);
  const openLogOutcomeModal = (plan) => setLogOutcomeModalTarget(plan);
  const closeLogOutcomeModal = () => setLogOutcomeModalTarget(null);

  // User Profile Modal Handlers
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);

  const viewUserProfile = useCallback((userOrId) => {
    if (!userOrId) return;
    let target;
    const targetId = typeof userOrId === 'string' ? userOrId : (userOrId.id || userOrId.userId || userOrId.authorId || userOrId.author_id);

    if (targetId && targetId === currentUser?.id) {
      target = { ...currentUser };
    } else {
      const foundInMock = mockUsers.find(u => u.id === targetId || (u.name && u.name === userOrId?.name));
      if (foundInMock) {
        target = { ...foundInMock, ...(typeof userOrId === 'object' ? userOrId : {}) };
      } else if (typeof userOrId === 'object') {
        target = { ...userOrId, id: targetId || `usr_${Date.now()}` };
      } else {
        target = { id: targetId, name: 'Community Neighbor' };
      }
    }

    setSelectedUserProfile(target);

    // Asynchronously enrich from backend if id is available
    if (target?.id && api.users?.getById) {
      api.users.getById(target.id).then(backendUser => {
        if (backendUser && backendUser.id) {
          setSelectedUserProfile(prev => (prev?.id === backendUser.id ? { ...prev, ...backendUser } : prev));
        }
      }).catch(() => {});
    }
  }, [currentUser]);

  const closeUserProfile = useCallback(() => {
    setSelectedUserProfile(null);
  }, []);

  // Universal Inspector & Detail Handler
  const inspectEntity = useCallback((entity, type) => {
    if (!entity) return;
    const resolvedType = (type || entity.entityType || '').toLowerCase();
    
    if (resolvedType === 'evidence') {
      viewEvidenceDetail(entity);
      return;
    }
    if (resolvedType === 'request') {
      viewRequestDetail(entity);
      return;
    }
    if (resolvedType === 'resource') {
      viewResourceDetail(entity);
      return;
    }
    if (resolvedType === 'safety') {
      viewSafetyDetail(entity);
      return;
    }
    if (resolvedType === 'plan') {
      viewPlanDetail(entity);
      return;
    }
    if (resolvedType === 'user') {
      viewUserProfile(entity);
      return;
    }
    setInspectedEntity({ entity, type: resolvedType || 'observation' });
  }, [viewEvidenceDetail, viewRequestDetail, viewResourceDetail, viewSafetyDetail, viewPlanDetail, viewUserProfile]);

  const startDirectMessage = useCallback((targetUser) => {
    if (!targetUser) return;
    if (currentUser?.id === 'usr_guest') {
      openAuthModal('login');
      showToast('Please sign in or create an account to send direct messages.', 'info');
      return;
    }
    const targetId = targetUser.id || targetUser.userId;
    if (targetId === currentUser?.id) return;

    let existing = conversations.find(c => c.participant?.id === targetId || c.participantId === targetId);
    if (!existing) {
      const newConv = {
        id: `conv_${Date.now()}`,
        participant: targetUser,
        participantId: targetId,
        title: targetUser.name || 'Community Member',
        subtitle: `Direct conversation with ${targetUser.name || 'Neighbor'}`,
        lastMessage: 'Conversation started.',
        lastTime: 'Just now',
        unreadCount: 0,
        messages: []
      };
      setConversations(prev => [newConv, ...prev]);
      existing = newConv;
    }
    setActiveConversationId(existing.id);
    setSelectedUserProfile(null);
    navigateTo('social', 'messages');
  }, [conversations, currentUser, navigateTo, showToast]);

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

    // Process attached device files into evidence records
    const createdEvidenceIds = [];
    if (Array.isArray(data.files)) {
      data.files.forEach((file, idx) => {
        const evId = `ev_${Date.now()}_${idx}`;
        createdEvidenceIds.push(evId);
        const isImg = file.isImage || file.type?.startsWith('image/');
        const explicitType = file.evidenceType || data.evidenceType;
        const newEv = {
          id: evId,
          title: file.name || `${data.title.trim()} Evidence ${idx + 1}`,
          type: explicitType || (isImg ? 'photo' : (file.name?.endsWith('.csv') ? 'measurement' : 'document')),
          author: currentUser?.name || 'Community Member',
          authorId: currentUser?.id || 'usr_me',
          timestamp: 'Just now',
          url: file.dataUrl || '',
          description: file.description || `Attached to observation: ${data.title.trim()}`,
          provenanceChain: [
            { step: `Uploaded from device by ${currentUser?.name || 'Community Member'}`, time: 'Just now' }
          ],
          metadata: {
            fileName: file.name,
            fileSize: file.formattedSize || file.size
          }
        };
        setEvidence(prev => [newEv, ...prev]);
        api.evidence.create(newEv).catch(err => console.warn('Backend createEvidence error:', err));
      });
    }

    // If an assertion is provided, create a linked Claim
    if (data.claimText && data.claimText.trim()) {
      newClaimId = `clm_${Date.now()}`;
      const newClaim = {
        id: newClaimId,
        observationId: newId,
        assertionText: data.claimText.trim(),
        status: 'reported',
        supportingEvidenceIds: createdEvidenceIds,
        contradictingEvidenceIds: [],
        disputeIds: [],
        assessmentNotes: 'Initial claim logged with observation. Open for community peer-context, corroborating evidence, or substantive disputes.',
        lastUpdated: 'Just now'
      };
      setClaims(prev => [newClaim, ...prev]);
    }

    const mediaUrls = Array.isArray(data.mediaUrls) && data.mediaUrls.length > 0
      ? data.mediaUrls
      : (data.imageUrl ? [data.imageUrl] : ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80']);

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
      mediaUrls,
      status: 'action_underway',
      claimIds: newClaimId ? [newClaimId] : [],
      evidenceIds: createdEvidenceIds,
      supportingObservationIds: [],
      contradictoryObservationIds: [],
      relatedRequestIds: [],
      relatedResourceIds: [],
      relatedEventIds: [],
      relatedPlanIds: []
    };

    setObservations(prev => [newObs, ...prev]);
    closeCreateModal();
    api.observations.create({
      title: data.title.trim(),
      category: data.category || 'environmental',
      description: data.description,
      location: newObs.location,
      mediaUrls: newObs.mediaUrls,
      status: newObs.status,
      claimText: data.claimText
    }).catch(err => console.warn('Backend createObservation error:', err));
    return newObs;
  };

  const createRequest = (data) => {
    const newId = `req_${Date.now()}`;
    const coords = resolveCoordinates(data);
    const peopleNeeded = parseInt(data.peopleNeeded, 10) || 2;
    const communityId = data.communityId || null;
    const visibility = data.visibility || (communityId ? 'group_only' : 'public');
    const scheduledDate = data.scheduledDate || data.date || null;
    const scheduledTime = data.scheduledTime || data.time || null;

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
      requiredSkills: data.requiredSkills ? (Array.isArray(data.requiredSkills) ? data.requiredSkills : data.requiredSkills.split(',').map(s => s.trim())) : ['Community Volunteer'],
      requiredResources: data.requiredResources ? (Array.isArray(data.requiredResources) ? data.requiredResources : data.requiredResources.split(',').map(s => s.trim())) : [],
      peopleNeeded,
      peopleJoined: 0,
      progressPercentage: 0,
      status: 'open',
      communityId,
      visibility,
      scheduledDate,
      scheduledTime,
      requester: currentUser,
      createdAt: 'Just now',
      expiresAt: data.expiresAt || 'In 48 hours',
      evidenceIds: [],
      matchedResourceIds: [],
      quickActions: quickActionsForRequest,
      responses: []
    };

    setRequests(prev => [newReq, ...prev]);

    // If request belongs to a community, ensure community linkedRequestIds is updated
    if (communityId) {
      setCommunities(prev => prev.map(c => {
        if (c.id === communityId) {
          const existing = c.linkedRequestIds || [];
          if (!existing.includes(newId)) {
            return { ...c, linkedRequestIds: [newId, ...existing] };
          }
        }
        return c;
      }));
    }

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
    api.requests.create({
      title: data.title.trim(),
      description: data.description,
      category: data.category || 'labor',
      location: newReq.location,
      urgency: data.urgency || 'medium',
      requiredSkills: newReq.requiredSkills,
      requiredResources: newReq.requiredResources,
      peopleNeeded,
      quickActions: quickActionsForRequest,
      communityId,
      visibility,
      scheduledDate,
      scheduledTime
    }).catch(err => console.warn('Backend createRequest error:', err));
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
    api.resources.create({
      title: data.title.trim(),
      description: data.description,
      category: data.category || 'supplies',
      contributionType: data.contributionType || 'lend',
      location: newRes.location,
      availability: data.availability || 'immediate',
      quantity: data.quantity || '1 Available',
      condition: data.condition || 'Community-provided / Good working condition',
      conditionsTerms: data.conditionsTerms || 'Available for community coordination.',
      validUntil: data.validUntil || 'Ongoing'
    }).catch(err => console.warn('Backend createResource error:', err));
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
    api.projects.create({
      title: data.title.trim(),
      eventType: data.eventType || 'community_activity',
      description: data.description,
      location: newEvt.location,
      date: newEvt.date,
      time: newEvt.time,
      maxParticipants: newEvt.maxParticipants
    }).catch(err => console.warn('Backend createEvent error:', err));
    return newEvt;
  };

  const createPlan = (data) => {
    const newId = `plan_${Date.now()}`;
    const coords = resolveCoordinates(data);
    const locAddress = typeof data.location === 'object'
      ? (data.location?.address || 'Maplewood Community District')
      : (data.locationAddress || data.location || 'Maplewood Community District');

    const newPlan = {
      id: newId,
      title: data.title.trim(),
      problemStatement: data.problemStatement || '',
      desiredOutcome: data.desiredOutcome || '',
      proposedApproach: data.proposedApproach || '',
      resourcesNeeded: data.resourcesNeeded || '',
      location: {
        address: locAddress,
        lat: coords.lat,
        lng: coords.lng
      },
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
    api.plans.create({
      title: data.title.trim(),
      problemStatement: data.problemStatement,
      desiredOutcome: data.desiredOutcome,
      proposedApproach: data.proposedApproach,
      resourcesNeeded: data.resourcesNeeded,
      location: data.location,
      affectedParties: data.affectedParties,
      goals: newPlan.goals
    }).catch(err => console.warn('Backend createPlan error:', err));
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
    api.safety.create({
      title: data.title.trim(),
      description: data.description,
      severity: data.severity || 'high',
      location: newReport.location,
      mitigationActions: newReport.mitigationActions
    }).catch(err => console.warn('Backend createSafetyReport error:', err));
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
      targetView: 'explore',
      targetSubTab: null,
      targetEntityId: obs.id
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
      category: extraData.category || null,
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
    let resolvedClaimId = claimId;
    let targetClaim = claims.find(c => c.id === resolvedClaimId);
    if (!targetClaim && relatedObservationId) {
      const relObs = observations.find(o => o.id === relatedObservationId);
      if (relObs) {
        resolvedClaimId = `clm_${Date.now()}_disp`;
        targetClaim = {
          id: resolvedClaimId,
          observationId: relatedObservationId,
          assertionText: relObs.title,
          status: 'disputed',
          supportingEvidenceIds: relObs.evidenceIds || [],
          contradictingEvidenceIds: [],
          disputeIds: [],
          assessmentNotes: 'Claim created during community dispute review.',
          lastUpdated: 'Just now'
        };
        setClaims(prev => [targetClaim, ...prev]);
        setObservations(prev => prev.map(o => o.id === relatedObservationId ? { ...o, claimIds: [...(o.claimIds || []), resolvedClaimId] } : o));
      }
    }
    if (!targetClaim) return null;

    const createdEvidenceIds = [];
    const filesToProcess = Array.isArray(evidenceData)
      ? evidenceData
      : (evidenceData?.files || (evidenceData?.title ? [evidenceData] : []));

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      const evId = `ev_${Date.now()}_${i}`;
      createdEvidenceIds.push(evId);

      const isImg = file.isImage || file.type?.startsWith('image/');
      const explicitType = file.evidenceType || evidenceData?.evidenceType || evidenceData?.type;
      const newEv = {
        id: evId,
        title: file.name || file.title || `Counter-Evidence ${i + 1}`,
        type: explicitType || (isImg ? 'photo' : (file.name?.endsWith('.csv') ? 'measurement' : (file.type || 'document'))),
        author: currentUser?.name || 'Community Member',
        authorId: currentUser?.id || 'usr_me',
        timestamp: 'Just now',
        url: file.dataUrl || file.url || '',
        description: file.description || explanation.trim() || 'Counter-evidence attached to dispute.',
        provenanceChain: [
          { step: `Uploaded from device by ${currentUser?.name || 'Community Member'} as counter-evidence`, time: 'Just now' }
        ],
        metadata: {
          fileName: file.name || file.title,
          fileSize: file.formattedSize || file.size
        }
      };

      setEvidence(prev => [newEv, ...prev]);
      api.evidence.create(newEv).catch(err => console.warn('Backend createEvidence error:', err));
    }

    const newDisputeId = `disp_${Date.now()}`;
    const newDispute = {
      id: newDisputeId,
      claimId: resolvedClaimId,
      author: {
        id: currentUser?.id || 'usr_me',
        name: currentUser?.name || 'Community Member',
        role: currentUser?.role || 'Member'
      },
      timestamp: 'Just now',
      reason,
      explanation: explanation.trim(),
      counterEvidenceIds: [
        ...createdEvidenceIds,
        ...(evidenceData?.counterEvidenceIds || [])
      ],
      relatedObservationId: relatedObservationId || null,
      status: 'active_challenge' // 'active_challenge' | 'reviewed' | 'resolved'
    };

    setDisputes(prev => [newDispute, ...prev]);

    // Update the Claim status and dispute IDs
    setClaims(prev => prev.map(c => {
      if (c.id === resolvedClaimId) {
        const nextDisputes = [...(c.disputeIds || []), newDisputeId];
        const nextContradicting = [
          ...(c.contradictingEvidenceIds || []),
          ...createdEvidenceIds
        ];

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

    api.disputes.create({
      claimId,
      reason,
      explanation: explanation.trim(),
      counterEvidenceIds: newDispute.counterEvidenceIds,
      relatedObservationId
    }).catch(err => console.warn('Backend disputeClaim error:', err));

    return newDispute;
  };

  // Support or Challenge an Existing Dispute (Deliberation Thread)
  const addDisputeResponse = ({ disputeId, type = 'support', reason, explanation, files, evidenceType, evidenceData }) => {
    if (!explanation?.trim() || !disputeId) return null;

    const createdEvidenceIds = [];
    const filesToProcess = Array.isArray(files) && files.length > 0
      ? files
      : (evidenceData?.files || (evidenceData?.title ? [evidenceData] : []));

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      const evId = `ev_${Date.now()}_${i}`;
      createdEvidenceIds.push(evId);

      const isImg = file.isImage || file.type?.startsWith('image/');
      const explicitType = file.evidenceType || evidenceType || evidenceData?.evidenceType || evidenceData?.type;
      const newEv = {
        id: evId,
        title: file.name || file.title || `${type === 'support' ? 'Supporting Proof' : 'Rebuttal Evidence'} ${i + 1}`,
        type: explicitType || (isImg ? 'photo' : (file.name?.endsWith('.csv') ? 'measurement' : 'document')),
        author: currentUser?.name || 'Community Member',
        authorId: currentUser?.id || 'usr_me',
        timestamp: 'Just now',
        url: file.dataUrl || file.url || '',
        description: file.description || explanation.trim() || 'Evidence attached to dispute deliberation.',
        provenanceChain: [
          { step: `${type === 'support' ? 'Dispute corroboration proof' : 'Dispute rebuttal proof'} recorded from device by ${currentUser?.name || 'Community Member'}`, time: 'Just now' }
        ],
        metadata: {
          fileName: file.name,
          fileSize: file.formattedSize || file.size
        }
      };
      setEvidence(prev => [newEv, ...prev]);
      api.evidence.create(newEv).catch(err => console.warn('Backend createEvidence error:', err));
    }

    const newRespId = `dresp_${Date.now()}`;
    const newResp = {
      id: newRespId,
      disputeId,
      type, // 'support' | 'challenge'
      author: {
        id: currentUser?.id || 'usr_me',
        name: currentUser?.name || 'Community Member',
        role: currentUser?.role || 'Member'
      },
      timestamp: 'Just now',
      reason: reason?.trim() || (type === 'support' ? 'Supporting Corroboration' : 'Counter-Challenge / Rebuttal'),
      explanation: explanation.trim(),
      evidenceIds: createdEvidenceIds
    };

    setDisputes(prev => prev.map(d => {
      if (d.id === disputeId) {
        const existing = d.responses || [];
        return {
          ...d,
          responses: [...existing, newResp]
        };
      }
      return d;
    }));

    api.disputes.addResponse(disputeId, {
      type,
      reason: newResp.reason,
      explanation: newResp.explanation,
      evidenceIds: createdEvidenceIds,
      author: currentUser
    }).catch(err => console.warn('Backend addDisputeResponse error:', err));

    closeDisputeResponseModal();
    return newResp;
  };

  const supportClaim = ({ claimId, evidenceData, note }) => {
    let createdEvidenceId = null;
    if (evidenceData && evidenceData.title && evidenceData.title.trim()) {
      createdEvidenceId = `ev_${Date.now()}`;
      const newEv = {
        id: createdEvidenceId,
        title: evidenceData.title.trim(),
        type: evidenceData.type || 'photo',
        author: currentUser?.name || 'Community Member',
        authorId: currentUser?.id || 'usr_me',
        timestamp: 'Just now',
        url: evidenceData.url || '',
        description: evidenceData.description || 'Supporting corroborating evidence.',
        provenanceChain: [
          { step: `Corroborated by ${currentUser?.name || 'Community Member'}`, time: 'Just now' }
        ]
      };
      setEvidence(prev => [newEv, ...prev]);
      api.evidence.create(newEv).catch(err => console.warn('Backend createEvidence error:', err));
    }

    setClaims(prev => prev.map(c => {
      if (c.id === claimId) {
        const nextSupporting = createdEvidenceId 
          ? [...(c.supportingEvidenceIds || []), createdEvidenceId]
          : (c.supportingEvidenceIds || []);
        
        const updatedNotes = note ? `${note} (Added by ${currentUser.name})` : c.assessmentNotes;
        api.claims.updateStatus(claimId, c.status, updatedNotes).catch(err => console.warn('Backend updateClaim error:', err));

        return {
          ...c,
          supportingEvidenceIds: nextSupporting,
          assessmentNotes: updatedNotes,
          lastUpdated: 'Just now'
        };
      }
      return c;
    }));
  };

  const addContradictoryObservation = ({ targetObservationId, title, description, locationAddress, lat, lng, imageUrl, files, evidenceData, evidenceType }) => {
    const targetObs = observations.find(o => o.id === targetObservationId);
    const newId = `obs_${Date.now()}_contra`;
    const coords = resolveCoordinates({ lat, lng });

    const createdEvidenceIds = [];
    const filesToProcess = Array.isArray(files) && files.length > 0
      ? files 
      : (evidenceData?.files || (evidenceData?.title ? [evidenceData] : []));

    // If no device files attached, but explicit type or title/description given, generate a structured record
    if (filesToProcess.length === 0 && (evidenceType || evidenceData?.type || description?.trim())) {
      filesToProcess.push({
        title: `${title.trim()} ${evidenceType === 'measurement' ? 'Measurement' : 'Counter-Record'}`,
        description: description?.trim() || 'Documented counter-evidence.',
        evidenceType: evidenceType || evidenceData?.type || 'document'
      });
    }

    const referencedEvidenceId = evidenceData?.referencedEvidenceId || null;
    const referencedEvidenceTitle = evidenceData?.referencedEvidenceTitle || null;

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      const evId = `ev_${Date.now()}_${i}`;
      createdEvidenceIds.push(evId);

      const isImg = file.isImage || file.type?.startsWith('image/');
      const explicitType = file.evidenceType || evidenceType || evidenceData?.evidenceType || evidenceData?.type;
      const newEv = {
        id: evId,
        title: file.name || file.title || `${title.trim()} Evidence ${i + 1}`,
        type: explicitType || (isImg ? 'photo' : (file.name?.endsWith('.csv') ? 'measurement' : 'document')),
        author: currentUser?.name || 'Community Member',
        authorId: currentUser?.id || 'usr_me',
        timestamp: 'Just now',
        url: file.dataUrl || file.url || imageUrl || '',
        description: file.description || description || 'Documented counter-evidence.',
        provenanceChain: [
          { step: `Documented from device by ${currentUser?.name || 'Community Member'}`, time: 'Just now' }
        ],
        metadata: {
          fileName: file.name,
          fileSize: file.formattedSize || file.size
        },
        parentEvidenceId: referencedEvidenceId,
        parentObservationId: targetObservationId
      };
      setEvidence(prev => [newEv, ...prev]);
      api.evidence.create(newEv).catch(err => console.warn('Backend createEvidence error:', err));
    }

    const imageFiles = filesToProcess.filter(f => f.isImage && f.dataUrl).map(f => f.dataUrl);
    const mediaUrls = imageFiles.length > 0 ? imageFiles : (imageUrl ? [imageUrl] : []);

    const newClaimId = `clm_${Date.now()}_contra`;
    const newClaim = {
      id: newClaimId,
      observationId: newId,
      assertionText: title.trim(),
      status: 'reported',
      supportingEvidenceIds: createdEvidenceIds,
      contradictingEvidenceIds: [],
      disputeIds: [],
      assessmentNotes: 'Contradictory counter-observation logged. Open for community peer-review, corroborating measurements, or challenges.',
      lastUpdated: 'Just now'
    };
    setClaims(prev => [newClaim, ...prev]);

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
      mediaUrls,
      status: 'resolved_disputed',
      isContradiction: true,
      contradictionTargetId: targetObservationId,
      referencedEvidenceId,
      referencedEvidenceTitle,
      claimIds: [newClaimId],
      parentClaimIds: targetObs?.claimIds || [],
      evidenceIds: createdEvidenceIds,
      supportingObservationIds: [],
      contradictoryObservationIds: [],
      relatedRequestIds: [],
      relatedResourceIds: [],
      relatedEventIds: [],
      relatedPlanIds: []
    };

    // Update parent claims to reference new contradicting evidence
    if (targetObs?.claimIds?.length > 0 && createdEvidenceIds.length > 0) {
      setClaims(prev => prev.map(c => {
        if (targetObs.claimIds.includes(c.id)) {
          return {
            ...c,
            status: 'disputed',
            contradictingEvidenceIds: [...(c.contradictingEvidenceIds || []), ...createdEvidenceIds],
            lastUpdated: 'Just now'
          };
        }
        return c;
      }));
    }

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

    api.observations.create({
      title: title.trim(),
      category: targetObs?.category || 'environmental',
      description: description.trim(),
      location: newObs.location,
      mediaUrls: newObs.mediaUrls,
      status: 'resolved_disputed',
      isContradiction: true,
      contradictionTargetId: targetObservationId,
      referencedEvidenceId,
      referencedEvidenceTitle,
      evidenceIds: newObs.evidenceIds,
      claimText: title.trim()
    }).then(created => {
      if (created?.id) {
        api.observations.addRelation(created.id, targetObservationId, 'contradictory').catch(err => console.warn('Backend addRelation error:', err));
      }
    }).catch(err => console.warn('Backend createObservation error:', err));

    closeObservationRelationModal();
    return newObs;
  };

  const addSupportingObservation = ({ targetObservationId, title, description, locationAddress, lat, lng, imageUrl, files, evidenceData, evidenceType }) => {
    const targetObs = observations.find(o => o.id === targetObservationId);
    const newId = `obs_${Date.now()}_sup`;
    const coords = resolveCoordinates({ lat, lng });

    const createdEvidenceIds = [];
    const filesToProcess = Array.isArray(files) && files.length > 0
      ? files 
      : (evidenceData?.files || (evidenceData?.title ? [evidenceData] : []));

    // If no device files attached, but explicit type or title/description given, generate a structured record
    if (filesToProcess.length === 0 && (evidenceType || evidenceData?.type || description?.trim())) {
      filesToProcess.push({
        title: `${title.trim()} ${evidenceType === 'measurement' ? 'Measurement' : 'Observation Record'}`,
        description: description?.trim() || 'Supporting corroborating record.',
        evidenceType: evidenceType || evidenceData?.type || 'measurement'
      });
    }

    const referencedEvidenceId = evidenceData?.referencedEvidenceId || null;
    const referencedEvidenceTitle = evidenceData?.referencedEvidenceTitle || null;

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      const evId = `ev_${Date.now()}_${i}`;
      createdEvidenceIds.push(evId);

      const isImg = file.isImage || file.type?.startsWith('image/');
      const explicitType = file.evidenceType || evidenceType || evidenceData?.evidenceType || evidenceData?.type;
      const newEv = {
        id: evId,
        title: file.name || file.title || `${title.trim()} Corroboration ${i + 1}`,
        type: explicitType || (isImg ? 'photo' : (file.name?.endsWith('.csv') ? 'measurement' : 'document')),
        author: currentUser?.name || 'Community Member',
        authorId: currentUser?.id || 'usr_me',
        timestamp: 'Just now',
        url: file.dataUrl || file.url || imageUrl || '',
        description: file.description || description || 'Supporting corroborating evidence.',
        provenanceChain: [
          { step: `Supporting survey recorded from device by ${currentUser?.name || 'Community Member'}`, time: 'Just now' }
        ],
        metadata: {
          fileName: file.name,
          fileSize: file.formattedSize || file.size
        },
        parentEvidenceId: referencedEvidenceId,
        parentObservationId: targetObservationId
      };
      setEvidence(prev => [newEv, ...prev]);
      api.evidence.create(newEv).catch(err => console.warn('Backend createEvidence error:', err));
    }

    const imageFiles = filesToProcess.filter(f => f.isImage && f.dataUrl).map(f => f.dataUrl);
    const mediaUrls = imageFiles.length > 0 ? imageFiles : (imageUrl ? [imageUrl] : []);

    const newClaimId = `clm_${Date.now()}_sup`;
    const newClaim = {
      id: newClaimId,
      observationId: newId,
      assertionText: title.trim(),
      status: 'corroborated',
      supportingEvidenceIds: createdEvidenceIds,
      contradictingEvidenceIds: [],
      disputeIds: [],
      assessmentNotes: 'Supporting corroborating record logged. Open for peer context, additional measurements, or counter-evidence.',
      lastUpdated: 'Just now'
    };
    setClaims(prev => [newClaim, ...prev]);

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
      mediaUrls,
      status: 'action_underway',
      isSupporting: true,
      supportingTargetId: targetObservationId,
      referencedEvidenceId,
      referencedEvidenceTitle,
      claimIds: [newClaimId],
      parentClaimIds: targetObs?.claimIds || [],
      evidenceIds: createdEvidenceIds,
      supportingObservationIds: [],
      contradictoryObservationIds: [],
      relatedRequestIds: [],
      relatedResourceIds: [],
      relatedEventIds: [],
      relatedPlanIds: []
    };

    // Update parent claims to reference new supporting evidence
    if (targetObs?.claimIds?.length > 0 && createdEvidenceIds.length > 0) {
      setClaims(prev => prev.map(c => {
        if (targetObs.claimIds.includes(c.id)) {
          return {
            ...c,
            supportingEvidenceIds: [...(c.supportingEvidenceIds || []), ...createdEvidenceIds],
            lastUpdated: 'Just now'
          };
        }
        return c;
      }));
    }

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

    api.observations.create({
      title: title.trim(),
      category: targetObs?.category || 'environmental',
      description: description.trim(),
      location: newObs.location,
      mediaUrls: newObs.mediaUrls,
      status: 'action_underway',
      isSupporting: true,
      supportingTargetId: targetObservationId,
      referencedEvidenceId,
      referencedEvidenceTitle,
      evidenceIds: newObs.evidenceIds,
      claimText: title.trim()
    }).then(created => {
      if (created?.id) {
        api.observations.addRelation(created.id, targetObservationId, 'supporting').catch(err => console.warn('Backend addRelation error:', err));
      }
    }).catch(err => console.warn('Backend createObservation error:', err));

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
      author: currentUser?.name || 'Community Member',
      authorId: currentUser?.id || 'usr_me',
      timestamp: 'Just now',
      url: evidenceData.url || '',
      description: evidenceData.description || '',
      provenanceChain: [
        { step: `Added by ${currentUser?.name || 'Community Member'}`, time: 'Just now' }
      ]
    };

    setEvidence(prev => [newEv, ...prev]);
    api.evidence.create(newEv).catch(err => console.warn('Backend createEvidence error:', err));

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
    if (currentUser?.id === 'usr_guest') {
      openAuthModal('login');
      showToast('Please sign in or create an account to volunteer.', 'info');
      return;
    }

    const targetReq = requests.find(r => r.id === requestId);
    if (targetReq) {
      const isOwner = targetReq.requester?.id === currentUser?.id || targetReq.requester_id === currentUser?.id;
      if (isOwner) {
        showToast('As the requester, you cannot volunteer for your own help request.', 'warning');
        return;
      }
      const alreadyJoined = targetReq.responses?.some(r => r.user?.id === currentUser?.id);
      if (alreadyJoined) {
        showToast('You have already volunteered for this request.', 'info');
        return;
      }
    }

    setRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        const alreadyJoined = req.responses?.some(r => r.user?.id === currentUser?.id);
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

    if (currentUser?.id) {
      api.requests.respond(requestId, role, currentUser.id).catch(err => console.warn('Backend respondToRequest error:', err));
    }

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
    if (currentUser?.id === 'usr_guest') {
      openAuthModal('login');
      showToast('Please sign in or create an account to join activities.', 'info');
      return;
    }

    const targetEvt = events.find(e => e.id === eventId);
    if (targetEvt) {
      const isOrganizer = targetEvt.organizer?.id === currentUser?.id || targetEvt.organizerId === currentUser?.id;
      if (isOrganizer) {
        showToast('You are the organizer of this activity.', 'info');
        return;
      }
      const alreadyJoined = targetEvt.participants?.some(p => p.id === currentUser?.id);
      if (alreadyJoined) {
        showToast('You are already registered for this activity.', 'info');
        return;
      }
    }

    setEvents(prev => prev.map(evt => {
      if (evt.id === eventId) {
        const isJoined = evt.participants.some(p => p.id === currentUser?.id);
        if (isJoined) return evt;
        return {
          ...evt,
          participants: [...evt.participants, currentUser]
        };
      }
      return evt;
    }));

    if (currentUser?.id) {
      api.projects.join(eventId, currentUser.id).catch(err => console.warn('Backend joinEvent error:', err));
    }
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

    api.projects.sendMessage(eventId, text.trim(), currentUser.id).catch(err => console.warn('Backend sendEventChatMessage error:', err));
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

    api.plans.toggleMilestone(planId, milestoneId).catch(err => console.warn('Backend toggleMilestone error:', err));
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

    api.plans.logDecision(planId, decisionData).catch(err => console.warn('Backend logDecision error:', err));
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

    api.plans.addFeedback(planId, feedbackData).catch(err => console.warn('Backend addFeedback error:', err));
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

    api.plans.createRevision(planId, {
      version: revisionData.version || 'v1.1',
      summaryOfChanges: revisionData.summaryOfChanges,
      reasoningForChanges: revisionData.reasoningForChanges,
      incorporatedFeedbackIds: revisionData.incorporatedFeedbackIds || [],
      updatedProblemStatement: revisionData.problemStatement,
      updatedDesiredOutcome: revisionData.desiredOutcome,
      updatedProposedApproach: revisionData.proposedApproach,
      updatedResourcesNeeded: revisionData.resourcesNeeded
    }).catch(err => console.warn('Backend createRevision error:', err));
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

    api.plans.updateStage(planId, newStage).catch(err => console.warn('Backend updateStage error:', err));
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

    api.plans.logOutcome(planId, reportData).catch(err => console.warn('Backend logOutcome error:', err));
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

  const matchResourceToRequest = (arg1, arg2) => {
    const isArg1Req = (typeof arg1 === 'string' && (arg1.startsWith('req_') || arg1.startsWith('request_'))) || requests.some(r => r.id === arg1);
    const requestId = isArg1Req ? arg1 : arg2;
    const resourceId = isArg1Req ? arg2 : arg1;

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

    api.matcher.createAssignment({ requestId, resourceId }).catch(err => console.warn('Backend matchResource error:', err));
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

    api.communities.join(communityId).catch(err => console.warn('Backend joinCommunity error:', err));
  };

  const createCommunity = (data) => {
    const newId = `com_${Date.now()}`;
    const coords = resolveCoordinates(data);
    const locAddress = typeof data.location === 'object'
      ? (data.location?.address || 'Maplewood District')
      : (data.location ? String(data.location).trim() : `${currentUser.location?.neighborhood || 'Maplewood'}, Maplewood`);

    const newCommunity = {
      id: newId,
      name: data.name.trim(),
      handle: data.handle?.trim() || `@${data.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      category: data.category || 'mutual_aid',
      privacy: data.privacy || 'public',
      privacyLabel: `${data.privacy === 'private' ? 'Private Group' : 'Public Group'} · 1 neighbor`,
      description: data.description?.trim() || '',
      location: locAddress,
      lat: coords.lat,
      lng: coords.lng,
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
    api.communities.create(data).catch(err => console.warn('Backend createCommunity error:', err));
    return newCommunity;
  };

  const updateCommunity = (communityId, updatedData) => {
    setCommunities(prev => prev.map(c => {
      if (c.id === communityId) {
        return { ...c, ...updatedData };
      }
      return c;
    }));
    api.communities.update(communityId, updatedData).catch(err => console.warn('Backend updateCommunity error:', err));
    showToast('Community details updated successfully.', 'success');
  };

  const uploadCommunityMedia = (communityId, mediaItem) => {
    const newMedia = {
      id: `media_${Date.now()}`,
      url: mediaItem.url,
      title: mediaItem.title || 'Field Photo',
      date: 'Today',
      uploader: currentUser.name,
      ...mediaItem
    };
    setCommunities(prev => prev.map(c => {
      if (c.id === communityId) {
        const currentGallery = c.mediaGallery || [];
        return {
          ...c,
          mediaGallery: [newMedia, ...currentGallery]
        };
      }
      return c;
    }));
    api.communities.addMedia(communityId, newMedia).catch(err => console.warn('Backend uploadCommunityMedia error:', err));
    showToast('Field photo added to community gallery!', 'success');
    return newMedia;
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

    if (currentUser?.id) {
      api.communities.votePoll(postId, optionId, currentUser.id).catch(err => console.warn('Backend votePoll error:', err));
    }
  };

  const addCommentToPost = (postId, text) => {
    if (!text || !text.trim()) return;
    if (currentUser?.id === 'usr_guest') {
      openAuthModal('login');
      showToast('Please sign in or create an account to comment.', 'info');
      return;
    }

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

    if (currentUser?.id) {
      api.communities.addComment(postId, text, currentUser.id).catch(err => console.warn('Backend addComment error:', err));
    }
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
    if (currentUser?.id === 'usr_guest') {
      openAuthModal('login');
      showToast('Please sign in or create an account to corroborate posts.', 'info');
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (post && (post.author?.id === currentUser?.id || post.author_id === currentUser?.id)) {
      showToast('Authors cannot corroborate their own posts.', 'info');
      return;
    }

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          endorsedCount: (p.endorsedCount || 0) + 1
        };
      }
      return p;
    }));

    if (currentUser?.id) {
      api.communities.endorsePost(postId, currentUser.id).catch(err => console.warn('Backend endorsePost error:', err));
    }
  };

  // Post Edit & Delete
  const editPost = (postId, updatedData) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          ...updatedData,
          content: updatedData.content !== undefined ? updatedData.content : p.content,
          mediaUrls: updatedData.mediaUrls !== undefined ? updatedData.mediaUrls : p.mediaUrls
        };
      }
      return p;
    }));
    api.communities.editPost(postId, updatedData).catch(err => console.warn('Backend editPost error:', err));
  };

  const deletePost = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    api.communities.deletePost(postId).catch(err => console.warn('Backend deletePost error:', err));
  };

  const editPostComment = (postId, commentId, newText) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: (p.comments || []).map(c => c.id === commentId ? { ...c, text: newText } : c)
        };
      }
      return p;
    }));
    api.communities.editComment(postId, commentId, newText).catch(err => console.warn('Backend editComment error:', err));
  };

  const deletePostComment = (postId, commentId) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: (p.comments || []).filter(c => c.id !== commentId)
        };
      }
      return p;
    }));
    api.communities.deleteComment(postId, commentId).catch(err => console.warn('Backend deleteComment error:', err));
  };

  // Help Request Edit & Delete
  const updateRequest = (requestId, updatedData) => {
    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return { ...r, ...updatedData };
      }
      return r;
    }));
    setSelectedRequestDetail(prev => (prev && prev.id === requestId ? { ...prev, ...updatedData } : prev));
    api.requests.update(requestId, updatedData).catch(err => console.warn('Backend updateRequest error:', err));
  };

  const deleteRequest = (requestId) => {
    setRequests(prev => prev.filter(r => r.id !== requestId));
    setSelectedRequestDetail(prev => (prev && prev.id === requestId ? null : prev));
    api.requests.delete(requestId).catch(err => console.warn('Backend deleteRequest error:', err));
  };

  const linkRequestToCommunity = (requestId, communityId) => {
    setRequests(prev => prev.map(r => (r.id === requestId ? { ...r, communityId } : r)));
    setSelectedRequestDetail(prev => (prev && prev.id === requestId ? { ...prev, communityId } : prev));
    setCommunities(prev => prev.map(c => {
      if (c.id === communityId) {
        const existing = c.linkedRequestIds || [];
        if (!existing.includes(requestId)) {
          return { ...c, linkedRequestIds: [requestId, ...existing] };
        }
      }
      return c;
    }));
    api.requests.update(requestId, { communityId }).catch(err => console.warn('Backend linkRequest error:', err));
  };

  const unlinkRequestFromCommunity = (requestId, communityId) => {
    setRequests(prev => prev.map(r => (r.id === requestId ? { ...r, communityId: null, visibility: 'public' } : r)));
    setSelectedRequestDetail(prev => (prev && prev.id === requestId ? { ...prev, communityId: null, visibility: 'public' } : prev));
    setCommunities(prev => prev.map(c => {
      if (c.id === communityId) {
        return { ...c, linkedRequestIds: (c.linkedRequestIds || []).filter(id => id !== requestId) };
      }
      return c;
    }));
    api.requests.update(requestId, { communityId: null, visibility: 'public' }).catch(err => console.warn('Backend unlinkRequest error:', err));
  };

  const isRequestVisibleToUser = (req, user = currentUser) => {
    if (!req) return false;
    if (!req.visibility || req.visibility === 'public') return true;
    if (req.visibility === 'group_only') {
      if (req.requester?.id === user?.id || req.requester_id === user?.id || user?.isAdmin) return true;
      if (req.communityId) {
        const comm = communities.find(c => c.id === req.communityId);
        if (comm && (comm.isJoined || comm.memberIds?.includes(user?.id) || comm.adminIds?.includes(user?.id))) {
          return true;
        }
      }
      return false;
    }
    return true;
  };

  // Shared Resource Edit & Delete
  const updateResource = (resourceId, updatedData) => {
    setResources(prev => prev.map(res => {
      if (res.id === resourceId) {
        return { ...res, ...updatedData };
      }
      return res;
    }));
    setSelectedResourceDetail(prev => (prev && prev.id === resourceId ? { ...prev, ...updatedData } : prev));
    api.resources.update(resourceId, updatedData).catch(err => console.warn('Backend updateResource error:', err));
  };

  const deleteResource = (resourceId) => {
    setResources(prev => prev.filter(res => res.id !== resourceId));
    setSelectedResourceDetail(prev => (prev && prev.id === resourceId ? null : prev));
    api.resources.delete(resourceId).catch(err => console.warn('Backend deleteResource error:', err));
  };

  // Resource Loan & Custody Actions
  const openRequestResourceModal = (resource, prefill = {}) => {
    if (currentUser?.id === 'usr_guest') {
      openAuthModal('login');
      showToast('Please sign in or create an account to borrow equipment.', 'info');
      return;
    }
    if (resource.provider?.id === currentUser?.id || resource.provider_id === currentUser?.id) {
      showToast('You are the provider of this resource.', 'info');
      return;
    }
    setRequestResourceTarget({ resource, prefill });
    setIsRequestResourceModalOpen(true);
  };

  const closeRequestResourceModal = () => {
    setIsRequestResourceModalOpen(false);
    setRequestResourceTarget(null);
  };

  const submitResourceLoanRequest = async (resourceId, loanData) => {
    try {
      const res = await api.resources.requestUse(resourceId, {
        ...loanData,
        borrowerId: currentUser?.id
      });
      if (res.resource) {
        setResources(prev => prev.map(r => r.id === resourceId ? res.resource : r));
        setSelectedResourceDetail(prev => (prev && prev.id === resourceId ? res.resource : prev));
      }
      return res;
    } catch (err) {
      console.warn('Backend submitResourceLoanRequest error, applying local fallback:', err);
      const fallbackAssignment = {
        id: `asgn_${Date.now()}`,
        resourceId,
        borrowerId: currentUser?.id,
        borrower: currentUser,
        purpose: loanData.purpose || 'Direct Equipment Loan',
        startDate: loanData.startDate || '',
        dueDate: loanData.dueDate || '',
        requestedQuantity: loanData.requestedQuantity || '1',
        status: 'proposed',
        notes: loanData.notes || '',
        assignedAt: new Date().toISOString()
      };

      setResources(prev => prev.map(r => {
        if (r.id === resourceId) {
          const currentAsgns = r.assignments || [];
          const updatedAsgns = [fallbackAssignment, ...currentAsgns];
          return {
            ...r,
            assignments: updatedAsgns,
            pendingRequests: [fallbackAssignment, ...(r.pendingRequests || [])],
            loanStatus: r.activeLoan ? 'on_loan' : 'pending_approval'
          };
        }
        return r;
      }));

      setSelectedResourceDetail(prev => {
        if (prev && prev.id === resourceId) {
          const currentAsgns = prev.assignments || [];
          const updatedAsgns = [fallbackAssignment, ...currentAsgns];
          return {
            ...prev,
            assignments: updatedAsgns,
            pendingRequests: [fallbackAssignment, ...(prev.pendingRequests || [])],
            loanStatus: prev.activeLoan ? 'on_loan' : 'pending_approval'
          };
        }
        return prev;
      });

      return { success: true, assignment: fallbackAssignment };
    }
  };

  const updateLoanAssignmentStatus = async (resourceId, assignmentId, status, details = {}) => {
    try {
      const res = await api.resources.updateLoanStatus(assignmentId, status, {
        ...details,
        userId: currentUser?.id
      });
      if (res.resource) {
        setResources(prev => prev.map(r => r.id === resourceId ? res.resource : r));
        setSelectedResourceDetail(prev => (prev && prev.id === resourceId ? res.resource : prev));
      }
      return res;
    } catch (err) {
      console.warn('Backend updateLoanAssignmentStatus error, applying local fallback:', err);
      setResources(prev => prev.map(r => {
        if (r.id === resourceId) {
          const updatedAssignments = (r.assignments || []).map(a => {
            if (a.id === assignmentId) {
              return {
                ...a,
                status,
                returnCondition: details.returnCondition || a.returnCondition,
                returnDate: status === 'completed' ? new Date().toISOString() : a.returnDate
              };
            }
            return a;
          });
          const activeLoan = updatedAssignments.find(a => a.status === 'accepted' || a.status === 'in_transit') || null;
          const pendingRequests = updatedAssignments.filter(a => a.status === 'proposed');
          const loanHistory = updatedAssignments.filter(a => a.status === 'completed' || a.status === 'cancelled');
          const loanStatus = activeLoan ? 'on_loan' : (pendingRequests.length > 0 ? 'pending_approval' : 'available');

          return {
            ...r,
            assignments: updatedAssignments,
            activeLoan,
            pendingRequests,
            loanHistory,
            loanStatus
          };
        }
        return r;
      }));

      setSelectedResourceDetail(prev => {
        if (prev && prev.id === resourceId) {
          const updatedAssignments = (prev.assignments || []).map(a => {
            if (a.id === assignmentId) {
              return {
                ...a,
                status,
                returnCondition: details.returnCondition || a.returnCondition,
                returnDate: status === 'completed' ? new Date().toISOString() : a.returnDate
              };
            }
            return a;
          });
          const activeLoan = updatedAssignments.find(a => a.status === 'accepted' || a.status === 'in_transit') || null;
          const pendingRequests = updatedAssignments.filter(a => a.status === 'proposed');
          const loanHistory = updatedAssignments.filter(a => a.status === 'completed' || a.status === 'cancelled');
          const loanStatus = activeLoan ? 'on_loan' : (pendingRequests.length > 0 ? 'pending_approval' : 'available');

          return {
            ...prev,
            assignments: updatedAssignments,
            activeLoan,
            pendingRequests,
            loanHistory,
            loanStatus
          };
        }
        return prev;
      });
    }
  };


  // Observation Edit & Delete
  const updateObservation = (observationId, updatedData) => {
    setObservations(prev => prev.map(obs => {
      if (obs.id === observationId) {
        return { ...obs, ...updatedData };
      }
      return obs;
    }));
    api.observations.update(observationId, updatedData).catch(err => console.warn('Backend updateObservation error:', err));
  };

  // Universal Poster or Admin Permission Check
  const canUserManage = useCallback((item, entityCommunity = null) => {
    if (!currentUser || !item) return false;
    const isPlatformAdmin = Boolean(
      currentUser.role === 'admin' || 
      currentUser.role === 'Admin' || 
      currentUser.role === 'coordinator' || 
      currentUser.role === 'Emergency Coordinator' || 
      currentUser.role === 'System Administrator' || 
      currentUser.isPublicRecordsModerator ||
      currentUser.isAdmin
    );
    const isGroupAdmin = entityCommunity && (
      entityCommunity.adminIds?.includes(currentUser?.id) || 
      entityCommunity.moderatorIds?.includes(currentUser?.id)
    );
    const isAuthor = Boolean(
      item.author?.id === currentUser?.id ||
      item.authorId === currentUser?.id ||
      item.author_id === currentUser?.id ||
      item.author === currentUser?.name ||
      item.proposer?.id === currentUser?.id ||
      item.proposerId === currentUser?.id ||
      item.proposer_id === currentUser?.id ||
      item.requester?.id === currentUser?.id ||
      item.requesterId === currentUser?.id ||
      item.requester_id === currentUser?.id ||
      item.provider?.id === currentUser?.id ||
      item.providerId === currentUser?.id ||
      item.provider_id === currentUser?.id ||
      item.reporter?.id === currentUser?.id ||
      item.reporterId === currentUser?.id ||
      item.reporter_id === currentUser?.id ||
      item.organizer?.id === currentUser?.id ||
      item.organizerId === currentUser?.id ||
      item.organizer_id === currentUser?.id ||
      item.userId === currentUser?.id ||
      item.user_id === currentUser?.id
    );
    return isAuthor || isPlatformAdmin || Boolean(isGroupAdmin);
  }, [currentUser]);

  const deleteObservation = (observationId) => {
    setObservations(prev => prev
      .filter(obs => obs.id !== observationId)
      .map(obs => ({
        ...obs,
        contradictoryObservationIds: (obs.contradictoryObservationIds || []).filter(id => id !== observationId),
        supportingObservationIds: (obs.supportingObservationIds || []).filter(id => id !== observationId),
        subObservationIds: (obs.subObservationIds || []).filter(id => id !== observationId)
      }))
    );
    if (inspectedEntity?.entity?.id === observationId) {
      setInspectedEntity(null);
    }
    api.observations.delete(observationId).catch(err => console.warn('Backend deleteObservation error:', err));
  };

  // Evidence Delete with Parent Reference Cascade
  const deleteEvidence = (evidenceId) => {
    setEvidence(prev => prev.filter(e => e.id !== evidenceId));
    setObservations(prev => prev.map(obs => ({
      ...obs,
      evidenceIds: (obs.evidenceIds || []).filter(id => id !== evidenceId)
    })));
    setClaims(prev => prev.map(c => ({
      ...c,
      supportingEvidenceIds: (c.supportingEvidenceIds || []).filter(id => id !== evidenceId),
      contradictingEvidenceIds: (c.contradictingEvidenceIds || []).filter(id => id !== evidenceId),
      evidenceIds: (c.evidenceIds || []).filter(id => id !== evidenceId)
    })));
    setDisputes(prev => prev.map(d => ({
      ...d,
      counterEvidenceIds: (d.counterEvidenceIds || []).filter(id => id !== evidenceId),
      evidenceIds: (d.evidenceIds || []).filter(id => id !== evidenceId)
    })));
    setSelectedEvidenceDetail(prev => (prev && (prev.evidence?.id === evidenceId || prev.id === evidenceId) ? null : prev));
    if (inspectedEntity?.entity?.id === evidenceId) {
      setInspectedEntity(null);
    }
    api.evidence.delete(evidenceId).catch(err => console.warn('Backend deleteEvidence error:', err));
  };

  // Dispute & Dispute Response Delete
  const deleteDispute = (disputeId) => {
    setDisputes(prev => prev.filter(d => d.id !== disputeId));
    setClaims(prev => prev.map(c => ({
      ...c,
      disputeIds: (c.disputeIds || []).filter(id => id !== disputeId)
    })));
    api.disputes.delete(disputeId).catch(err => console.warn('Backend deleteDispute error:', err));
  };

  const deleteDisputeResponse = (disputeId, responseId) => {
    setDisputes(prev => prev.map(d => {
      if (d.id === disputeId) {
        return {
          ...d,
          responses: (d.responses || []).filter(r => r.id !== responseId)
        };
      }
      return d;
    }));
    api.disputes.deleteResponse(disputeId, responseId).catch(err => console.warn('Backend deleteDisputeResponse error:', err));
  };

  // Plan Milestone & Decision Delete
  const deletePlanDecision = (planId, decisionId) => {
    setPlans(prev => prev.map(p => {
      if (p.id === planId) {
        return {
          ...p,
          decisions: (p.decisions || []).filter(d => d.id !== decisionId)
        };
      }
      return p;
    }));
    setSelectedPlanDetail(prev => {
      if (prev && prev.id === planId) {
        return {
          ...prev,
          decisions: (prev.decisions || []).filter(d => d.id !== decisionId)
        };
      }
      return prev;
    });
    api.plans.deleteDecision(planId, decisionId).catch(err => console.warn('Backend deletePlanDecision error:', err));
  };

  const deletePlanMilestone = (planId, milestoneId) => {
    setPlans(prev => prev.map(p => {
      if (p.id === planId) {
        return {
          ...p,
          milestones: (p.milestones || []).filter(m => m.id !== milestoneId)
        };
      }
      return p;
    }));
    setSelectedPlanDetail(prev => {
      if (prev && prev.id === planId) {
        return {
          ...prev,
          milestones: (prev.milestones || []).filter(m => m.id !== milestoneId)
        };
      }
      return prev;
    });
    api.plans.deleteMilestone(planId, milestoneId).catch(err => console.warn('Backend deletePlanMilestone error:', err));
  };

  // Safety Report Delete
  const deleteSafetyReport = (reportId) => {
    setSafetyReports(prev => prev.filter(s => s.id !== reportId));
    setSelectedSafetyDetail(prev => (prev && prev.id === reportId ? null : prev));
    if (inspectedEntity?.entity?.id === reportId) {
      setInspectedEntity(null);
    }
    api.safety.delete(reportId).catch(err => console.warn('Backend deleteSafetyReport error:', err));
  };

  // Event Edit & Delete
  const updateEvent = (eventId, updatedData) => {
    setEvents(prev => prev.map(evt => {
      if (evt.id === eventId) {
        return { ...evt, ...updatedData };
      }
      return evt;
    }));
    api.projects.update(eventId, updatedData).catch(err => console.warn('Backend updateEvent error:', err));
  };

  const deleteEvent = (eventId) => {
    setEvents(prev => prev.filter(evt => evt.id !== eventId));
    api.projects.delete(eventId).catch(err => console.warn('Backend deleteEvent error:', err));
  };

  const deletePlan = (planId) => {
    setPlans(prev => prev.filter(p => p.id !== planId));
    if (selectedPlanDetail?.id === planId) {
      setSelectedPlanDetail(null);
    }
    api.plans.delete(planId).catch(err => console.warn('Backend deletePlan error:', err));
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
    if (currentUser?.id === 'usr_guest') {
      openAuthModal('login');
      showToast('Please sign in or create an account to send direct messages.', 'info');
      return;
    }

    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          lastMessage: text.trim(),
          lastTime: 'Just now',
          messages: [
            ...conv.messages,
            { id: `m_${Date.now()}`, senderId: currentUser?.id, text: text.trim(), timestamp: 'Just now' }
          ]
        };
      }
      return conv;
    }));

    if (currentUser?.id) {
      api.conversations.sendMessage(conversationId, text, currentUser.id).catch(err => console.warn('Backend sendMessage error:', err));
    }
  };

  const markNotificationRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    api.notifications.markRead(id).catch(err => console.warn('Backend markRead error:', err));
  }, []);

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    api.notifications.markAllRead().catch(err => console.warn('Backend markAllRead error:', err));
  };

  const loginUser = async (credentials) => {
    const res = await api.auth.login(credentials);
    if (res?.user) {
      setCurrentUser(res.user);
      localStorage.setItem('caremesh_user', JSON.stringify(res.user));
      const bootstrapData = await refreshUserData(res.user);
      const notif = {
        id: `notif_${Date.now()}`,
        userId: res.user.id,
        type: 'auth_success',
        title: 'Signed In Successfully',
        body: `Welcome back, ${res.user.name} (${res.user.handle})!`,
        timestamp: 'Just now',
        isRead: false,
        targetView: 'profile',
        targetEntityId: res.user.id
      };
      setNotifications(prev => [notif, ...(bootstrapData?.notifications || prev.filter(n => n.userId === res.user.id))]);
    }
    return res;
  };

  const registerUser = async (userData) => {
    const res = await api.auth.register(userData);
    if (res?.user) {
      setCurrentUser(res.user);
      localStorage.setItem('caremesh_user', JSON.stringify(res.user));
      const bootstrapData = await refreshUserData(res.user);
      const notif = {
        id: `notif_${Date.now()}`,
        userId: res.user.id,
        type: 'auth_success',
        title: 'Account Created',
        body: `Welcome to CareMesh, ${res.user.name}! Your profile is ready for mutual coordination.`,
        timestamp: 'Just now',
        isRead: false,
        targetView: 'profile',
        targetEntityId: res.user.id
      };
      setNotifications(prev => [notif, ...(bootstrapData?.notifications || prev.filter(n => n.userId === res.user.id))]);
    }
    return res;
  };

  const loginWithGoogle = async (googleData) => {
    const res = await api.auth.googleLogin(googleData);
    if (res?.user) {
      setCurrentUser(res.user);
      localStorage.setItem('caremesh_user', JSON.stringify(res.user));
      const bootstrapData = await refreshUserData(res.user);
      const notif = {
        id: `notif_${Date.now()}`,
        userId: res.user.id,
        type: 'auth_success',
        title: res.isNewUser ? 'Welcome to CareMesh!' : 'Signed In with Google',
        body: res.isNewUser
          ? `Account created via Gmail (${res.user.email}). Welcome, ${res.user.name}!`
          : `Welcome back, ${res.user.name} (${res.user.email})!`,
        timestamp: 'Just now',
        isRead: false,
        targetView: 'profile',
        targetEntityId: res.user.id
      };
      setNotifications(prev => [notif, ...(bootstrapData?.notifications || prev.filter(n => n.userId === res.user.id))]);
    }
    return res;
  };

  const logoutUser = async () => {
    api.setToken(null);
    localStorage.removeItem('caremesh_token');
    const guestUser = {
      id: 'usr_guest',
      name: 'Guest Neighbor',
      handle: '@guest',
      role: 'Community Observer',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      bio: 'Exploring CareMesh community coordination.',
      location: { address: 'Maplewood, CA', neighborhood: 'Maplewood', lat: 37.7749, lng: -122.4194 },
      skills: [],
      badges: [],
      privacySettings: { showExactLocation: false, allowDirectMessages: false, publicContributionHistory: false },
      stats: { contributions: 0, resourcesShared: 0, plansJoined: 0, requestsFulfilled: 0 }
    };
    setCurrentUser(guestUser);
    localStorage.setItem('caremesh_user', JSON.stringify(guestUser));
    setNotifications([]);
    setConversations([]);
    await refreshUserData(guestUser);
    const notif = {
      id: `notif_${Date.now()}`,
      userId: 'usr_guest',
      type: 'auth_logout',
      title: 'Signed Out',
      body: 'You have been safely signed out. Sign in anytime to coordinate.',
      timestamp: 'Just now',
      isRead: false,
      targetView: 'home',
      targetEntityId: 'usr_guest'
    };
    setNotifications([notif]);
  };

  const switchUser = async () => {
    openAuthModal('login');
    showToast?.('Please sign in with your account credentials.', 'info');
  };

  const switchUserAccount = switchUser;

  const updateUserProfile = async (updates) => {
    try {
      const updated = {
        ...currentUser,
        ...updates
      };
      setCurrentUser(updated);
      localStorage.setItem('caremesh_user', JSON.stringify(updated));

      // Persist to backend if not a temporary guest
      if (currentUser.id && currentUser.id !== 'usr_guest') {
        api.users.update(currentUser.id, updates).catch(err => {
          console.warn('Backend user profile update error:', err);
        });
      }

      const notif = {
        id: `notif_${Date.now()}`,
        type: 'profile_update',
        title: 'Profile Updated',
        body: updates.avatar ? 'Your profile picture has been updated.' : 'Your profile details have been saved.',
        timestamp: 'Just now',
        isRead: false,
        targetView: 'profile',
        targetEntityId: currentUser.id
      };
      setNotifications(prev => [notif, ...prev]);
      return updated;
    } catch (err) {
      console.warn('updateUserProfile error:', err);
      throw err;
    }
  };

  // Modal handlers for Report, Readiness, and Public Records Moderation
  const openReportModal = (target) => {
    if (
      target?.reportedUser?.id === currentUser?.id ||
      target?.reportedUserId === currentUser?.id ||
      (target?.targetType === 'profile_picture' && target?.targetId === currentUser?.id)
    ) {
      showToast('You cannot report your own profile or content.', 'info');
      return;
    }
    setReportTarget(target);
    setIsReportModalOpen(true);
  };

  const closeReportModal = () => {
    setReportTarget(null);
    setIsReportModalOpen(false);
  };

  const openReadinessModal = useCallback((communityOrOptions = null, targetCheckId = null) => {
    if (communityOrOptions && typeof communityOrOptions === 'object' && !communityOrOptions.membersCount && !communityOrOptions.slug) {
      if (communityOrOptions.requestId || communityOrOptions.request || communityOrOptions.checkId) {
        setReadinessModalCommunity(null);
        setReadinessModalCheckId(communityOrOptions.checkId || targetCheckId || null);
        setIsReadinessModalOpen(true);
        return;
      }
    }
    setReadinessModalCommunity(communityOrOptions);
    setReadinessModalCheckId(targetCheckId || null);
    setIsReadinessModalOpen(true);
  }, []);

  const closeReadinessModal = () => {
    setReadinessModalCommunity(null);
    setReadinessModalCheckId(null);
    setIsReadinessModalOpen(false);
  };

  const openPublicRecordsModModal = useCallback(() => {
    setIsPublicRecordsModModalOpen(true);
  }, []);
  const closePublicRecordsModModal = () => setIsPublicRecordsModModalOpen(false);

  // Content & Avatar Reporting Action
  const reportContent = async ({ targetType, targetId, reason, details = '', communityId = null, scope = 'community', reportedUserId = null }) => {
    if (reportedUserId === currentUser.id || (targetType === 'profile_picture' && targetId === currentUser.id)) {
      showToast('You cannot report your own profile or content.', 'warning');
      throw new Error('You cannot report your own profile or content.');
    }

    const reportData = {
      targetType,
      targetId,
      reason,
      details,
      communityId,
      scope,
      reportedUserId,
      reporterId: currentUser.id
    };

    try {
      const created = await api.reports.create(reportData);
      setReports(prev => [created, ...prev]);
      const notif = {
        id: `notif_${Date.now()}`,
        type: 'report_submitted',
        title: 'Report Submitted',
        body: `Thank you. Your report regarding this ${targetType.replace('_', ' ')} was submitted for ${scope === 'community' ? 'community' : 'public records'} moderation review.`,
        timestamp: 'Just now',
        isRead: false,
        targetView: 'social',
        targetSubTab: 'moderation',
        targetEntityId: created.id
      };
      setNotifications(prev => [notif, ...prev]);
      return created;
    } catch (err) {
      console.warn('Backend report error, storing locally:', err);
      const fallback = {
        id: `rep_${Date.now()}`,
        targetType,
        targetId,
        reason,
        details,
        communityId,
        scope,
        reportedUserId,
        reporterId: currentUser.id,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      setReports(prev => [fallback, ...prev]);
      return fallback;
    }
  };

  // Resolve Report Action (by Community Moderator or Public Records Moderator)
  const resolveReport = async (reportId, action, resolutionNotes = '') => {
    try {
      await api.reports.resolve(reportId, action, resolutionNotes);
    } catch (err) {
      console.warn('Backend resolveReport error:', err);
    }

    const targetReport = reports.find(r => r.id === reportId);
    setReports(prev => prev.map(r => r.id === reportId ? {
      ...r,
      status: 'resolved',
      resolutionAction: action,
      resolutionNotes,
      resolvedBy: currentUser.id
    } : r));

    // Execute corresponding side-effects in client state
    if (action === 'remove_post' && targetReport?.targetId) {
      setPosts(prev => prev.filter(p => p.id !== targetReport.targetId));
    } else if (action === 'reset_avatar' && (targetReport?.reportedUserId || targetReport?.targetId)) {
      const targetUserId = targetReport.reportedUserId || targetReport.targetId;
      const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
      if (currentUser.id === targetUserId) {
        setCurrentUser(prev => ({ ...prev, avatar: defaultAvatar }));
      }
      setPosts(prev => prev.map(p => {
        if (p.author?.id === targetUserId || p.author_id === targetUserId) {
          return { ...p, author: { ...p.author, avatar: defaultAvatar } };
        }
        return p;
      }));
    } else if (action === 'remove_observation' && targetReport?.targetId) {
      setObservations(prev => prev.filter(o => o.id !== targetReport.targetId));
    } else if (action === 'remove_request' && targetReport?.targetId) {
      setRequests(prev => prev.filter(r => r.id !== targetReport.targetId));
    } else if (action === 'remove_resource' && targetReport?.targetId) {
      setResources(prev => prev.filter(res => res.id !== targetReport.targetId));
    } else if (action === 'kick_member' && targetReport?.communityId && targetReport?.reportedUserId) {
      setCommunities(prev => prev.map(c => {
        if (c.id === targetReport.communityId) {
          return {
            ...c,
            memberIds: (c.memberIds || []).filter(id => id !== targetReport.reportedUserId),
            memberCount: Math.max(1, (c.memberCount || 1) - 1)
          };
        }
        return c;
      }));
    }
  };

  // Post-level kick / restrict (used by Post Creators to moderate their own posts)
  const kickPostMember = async (communityId, postId, targetUserId) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const restricted = p.restrictedUserIds || [];
        return {
          ...p,
          restrictedUserIds: restricted.includes(targetUserId) ? restricted : [...restricted, targetUserId],
          comments: (p.comments || []).filter(c => c.author?.id !== targetUserId && c.author_id !== targetUserId)
        };
      }
      return p;
    }));

    try {
      await api.communities.restrictPostUser(postId, targetUserId);
    } catch (err) {
      console.warn('Backend restrictPostUser error:', err);
    }
  };

  // Restrict User Account (System Administrator Governance)
  const restrictUser = async (userId, reason = 'Violation of safety standards', notes = '') => {
    try {
      const res = await api.users.restrict(userId, { reason, notes });
      showToast('Account restricted. Write access disabled.', 'warning', 'Account Restricted');
      return res;
    } catch (err) {
      showToast(err.message || 'Failed to restrict account', 'error');
      throw err;
    }
  };

  // Reinstate User Account
  const unrestrictUser = async (userId, reason = 'Reinstated by Admin', notes = '') => {
    try {
      const res = await api.users.unrestrict(userId, { reason, notes });
      showToast('Account reinstated to active status.', 'success', 'Account Reinstated');
      return res;
    } catch (err) {
      showToast(err.message || 'Failed to reinstate account', 'error');
      throw err;
    }
  };

  // Restore Quarantined Post from Evidence Vault
  const restoreVaultPost = async (postId, reason = 'Cleared after review', notes = '') => {
    try {
      const res = await api.admin.restoreVaultPost(postId, { reason, notes });
      if (res?.post) {
        setPosts(prev => [res.post, ...prev]);
      }
      showToast('Post restored from Evidence Vault to community feed.', 'success', 'Post Restored');
      return res;
    } catch (err) {
      showToast(err.message || 'Failed to restore post', 'error');
      throw err;
    }
  };

  // Community-level kick (used by circle admins & community moderators)
  const kickCommunityMember = async (communityId, userId) => {
    setCommunities(prev => prev.map(c => {
      if (c.id === communityId) {
        return {
          ...c,
          memberIds: (c.memberIds || []).filter(id => id !== userId),
          memberCount: Math.max(1, (c.memberCount || 1) - 1)
        };
      }
      return c;
    }));

    try {
      await api.communities.kickMember(communityId, userId);
    } catch (err) {
      console.warn('Backend kickMember error:', err);
    }
  };

  // Community Moderator Elections
  const loadCommunityElections = async (communityId) => {
    try {
      const data = await api.communities.getElections(communityId);
      if (Array.isArray(data)) {
        setModeratorElections(prev => {
          const filtered = prev.filter(e => e.communityId !== communityId);
          return [...filtered, ...data];
        });
      }
      return data;
    } catch (err) {
      console.warn('Backend loadCommunityElections error:', err);
      return [];
    }
  };

  const nominateModerator = async (communityId, candidateId) => {
    try {
      const election = await api.communities.nominateModerator(communityId, candidateId);
      setModeratorElections(prev => [election, ...prev]);
      return election;
    } catch (err) {
      console.warn('Backend nominateModerator error:', err);
      throw err;
    }
  };

  const voteForModerator = async (communityId, electionId, vote = 'yes') => {
    try {
      const updated = await api.communities.voteModerator(communityId, electionId, vote);
      setModeratorElections(prev => prev.map(e => e.id === electionId ? updated : e));
      if (updated.status === 'passed') {
        setCommunities(prev => prev.map(c => {
          if (c.id === communityId) {
            const modIds = c.moderatorIds || [];
            return {
              ...c,
              moderatorIds: modIds.includes(updated.candidateId) ? modIds : [...modIds, updated.candidateId]
            };
          }
          return c;
        }));
      }
      return updated;
    } catch (err) {
      console.warn('Backend voteForModerator error:', err);
      throw err;
    }
  };

  const appointModerator = async (communityId, electionId) => {
    try {
      const updated = await api.communities.appointModerator(communityId, electionId);
      setModeratorElections(prev => prev.map(e => e.id === electionId ? updated : e));
      setCommunities(prev => prev.map(c => {
        if (c.id === communityId) {
          const modIds = c.moderatorIds || [];
          return {
            ...c,
            moderatorIds: modIds.includes(updated.candidateId) ? modIds : [...modIds, updated.candidateId]
          };
        }
        return c;
      }));
      return updated;
    } catch (err) {
      console.warn('Backend appointModerator error:', err);
      throw err;
    }
  };

  // Public Records Moderator Toggle
  const togglePublicModerator = async (userId) => {
    try {
      const res = await api.users.togglePublicModerator(userId);
      if (currentUser.id === userId) {
        setCurrentUser(prev => ({ ...prev, isPublicModerator: res.isPublicModerator }));
      }
      return res;
    } catch (err) {
      console.warn('Backend togglePublicModerator error:', err);
      if (currentUser.id === userId) {
        setCurrentUser(prev => ({ ...prev, isPublicModerator: !prev.isPublicModerator }));
      }
    }
  };

  // Member Readiness Checker Actions
  const createReadinessCheck = async (data) => {
    if (!currentUser || currentUser.id === 'usr_guest') {
      setIsAuthModalOpen(true);
      showToast?.('Please sign in to initiate a readiness check', 'info');
      return null;
    }
    try {
      const created = await api.readiness.create({
        ...data,
        creatorId: currentUser?.id
      });
      setReadinessChecks(prev => [created, ...prev]);
      return created;
    } catch (err) {
      console.warn('Backend createReadinessCheck error, storing fallback:', err);
      const fallback = {
        id: `rc_${Date.now()}`,
        ...data,
        creatorId: currentUser?.id,
        status: 'active',
        responses: [],
        readyCount: 0,
        totalResponses: 0,
        readyPercentage: 0,
        createdAt: new Date().toISOString()
      };
      setReadinessChecks(prev => [fallback, ...prev]);
      return fallback;
    }
  };

  const submitReadinessResponse = async (checkId, responseData) => {
    if (!currentUser || currentUser.id === 'usr_guest') {
      setIsAuthModalOpen(true);
      showToast?.('Please sign in to respond to readiness checks', 'info');
      return null;
    }
    try {
      const updated = await api.readiness.respond(checkId, {
        ...responseData,
        userId: currentUser?.id
      });
      setReadinessChecks(prev => prev.map(rc => rc.id === checkId ? updated : rc));
      return updated;
    } catch (err) {
      console.warn('Backend submitReadinessResponse error:', err);
      setReadinessChecks(prev => prev.map(rc => {
        if (rc.id === checkId) {
          const filtered = (rc.responses || []).filter(r => r.userId !== currentUser?.id);
          const newResp = {
            id: `rr_${Date.now()}`,
            userId: currentUser?.id,
            status: responseData.status,
            hoursAvailable: responseData.hoursAvailable || 0,
            gearNotes: responseData.gearNotes || '',
            user: currentUser
          };
          const newResponses = [...filtered, newResp];
          const readyCount = newResponses.filter(r => r.status === 'ready').length;
          return {
            ...rc,
            responses: newResponses,
            readyCount,
            totalResponses: newResponses.length,
            readyPercentage: Math.round((readyCount / Math.max(1, rc.targetHeadcount || newResponses.length)) * 100)
          };
        }
        return rc;
      }));
    }
  };

  const closeReadinessCheck = async (checkId) => {
    try {
      const updated = await api.readiness.close(checkId);
      setReadinessChecks(prev => prev.map(rc => rc.id === checkId ? updated : rc));
    } catch (err) {
      console.warn('Backend closeReadinessCheck error:', err);
      setReadinessChecks(prev => prev.map(rc => rc.id === checkId ? { ...rc, status: 'closed' } : rc));
    }
  };

  // Close all open modals across all tiers unconditionally so target document opens cleanly
  const closeAllModals = useCallback(() => {
    setInspectedEntity(null);
    setSelectedPlanDetail(null);
    setSelectedRequestDetail(null);
    setSelectedResourceDetail(null);
    setSelectedSafetyDetail(null);
    setRevisePlanTarget(null);
    setLogOutcomeModalTarget(null);
    setSelectedUserProfile(null);
    setDisputeModalTarget(null);
    setObservationRelationTarget(null);
    setShareSocialTarget(null);
    setIsCreateModalOpen(false);
    setCreateModalPrefill(null);
    setIsCreateGroupModalOpen(false);
    setInviteModalCommunity(null);
    setReportTarget(null);
    setIsReportModalOpen(false);
    setReadinessModalCommunity(null);
    setIsReadinessModalOpen(false);
    setIsPublicRecordsModModalOpen(false);
    setIsRequestResourceModalOpen(false);
    setRequestResourceTarget(null);
    setSelectedEventChat(null);
  }, []);

  const handleNotificationClick = useCallback((notif, navigate) => {
    if (!notif) return;

    // 1. Mark notification as read
    markNotificationRead(notif.id);

    // 2. Unconditionally close all open modals so target document is never obscured
    closeAllModals();

    // 3. Resolve target entity identifier across possible property names
    const targetId = notif.targetEntityId 
      || notif.entityId 
      || notif.targetId 
      || notif.documentId 
      || notif.target_entity_id 
      || notif.entity_id 
      || notif.relatedObservationId 
      || notif.observationId 
      || notif.requestId 
      || notif.resourceId 
      || notif.planId 
      || notif.eventId 
      || notif.communityId 
      || notif.postId 
      || notif.checkId;

    // Collect quoted text or phrases from title and body for fuzzy matching fallback
    const extractCandidates = (text) => {
      if (!text || typeof text !== 'string') return [];
      const list = [];
      const quoteRegex = /["'“‘]([^"'“”]+)["'”’]/g;
      let m;
      while ((m = quoteRegex.exec(text)) !== null) {
        if (m[1] && m[1].trim()) list.push(m[1].trim());
      }
      return list;
    };

    const textCandidates = [
      ...extractCandidates(notif.title),
      ...extractCandidates(notif.body)
    ];

    const stringMatches = (sourceText, candidate) => {
      if (!sourceText || !candidate) return false;
      const s = sourceText.toLowerCase().trim();
      const c = candidate.toLowerCase().trim();
      return s.includes(c) || c.includes(s);
    };

    let targetView = notif.targetView;
    let targetSubTab = notif.targetSubTab;
    let documentResolved = false;

    // Helper to match entity by ID or title candidates
    const matchEntity = (list, textProp = 'title') => {
      if (!list || !list.length) return null;
      if (targetId) {
        const byId = list.find(item => item.id === targetId);
        if (byId) return byId;
      }
      for (const cand of textCandidates) {
        const byCand = list.find(item => item[textProp] && stringMatches(item[textProp], cand));
        if (byCand) return byCand;
      }
      return null;
    };

    // A. Check Help Requests
    const req = matchEntity(requests, 'title');
    if (req) {
      viewRequestDetail(req);
      setHighlightedEntityId(req.id);
      targetView = 'collaborate';
      targetSubTab = 'requests';
      documentResolved = true;
    }

    // B. Check Resources & Loans
    if (!documentResolved) {
      const res = matchEntity(resources, 'title');
      if (res) {
        viewResourceDetail(res);
        setHighlightedEntityId(res.id);
        targetView = 'collaborate';
        targetSubTab = 'resources';
        documentResolved = true;
      }
    }

    // C. Check Long-Term Plans
    if (!documentResolved) {
      const pln = matchEntity(plans, 'title');
      if (pln) {
        viewPlanDetail(pln);
        setHighlightedEntityId(pln.id);
        targetView = 'plans';
        targetSubTab = null;
        documentResolved = true;
      }
    }

    // D. Check Safety Reports & Hazards
    if (!documentResolved) {
      const safe = matchEntity(safetyReports, 'title');
      if (safe) {
        viewSafetyDetail(safe);
        setHighlightedEntityId(safe.id);
        targetView = 'explore';
        targetSubTab = null;
        documentResolved = true;
      }
    }

    // E. Check Field Observations
    if (!documentResolved) {
      const obs = matchEntity(observations, 'title');
      if (obs) {
        inspectEntity(obs, 'observation');
        setHighlightedEntityId(obs.id);
        targetView = 'explore';
        targetSubTab = null;
        documentResolved = true;
      }
    }

    // F. Check Verified Claims & Assertions
    if (!documentResolved) {
      const clm = claims.find(c => {
        if (targetId && c.id === targetId) return true;
        for (const cand of textCandidates) {
          if (c.assertionText && stringMatches(c.assertionText, cand)) return true;
        }
        return false;
      });
      if (clm) {
        inspectEntity(clm, 'claim');
        setHighlightedEntityId(clm.id);
        targetView = 'explore';
        targetSubTab = null;
        documentResolved = true;
      }
    }

    // G. Check Volunteer Events & Projects
    if (!documentResolved) {
      const evt = matchEntity(events, 'title');
      if (evt) {
        setSelectedEventChat(evt);
        setHighlightedEntityId(evt.id);
        targetView = 'social';
        targetSubTab = 'events';
        documentResolved = true;
      }
    }

    // H. Check Community Posts
    if (!documentResolved) {
      const post = targetId ? posts.find(p => p.id === targetId) : null;
      if (post) {
        if (post.communityId) setSelectedCommunityId(post.communityId);
        // If post links directly to an entity, open that document
        if (post.linkedEntityType === 'observation' && post.linkedEntityId) {
          const linkedObs = observations.find(o => o.id === post.linkedEntityId);
          if (linkedObs) inspectEntity(linkedObs, 'observation');
        } else if (post.linkedEntityType === 'request' && post.linkedEntityId) {
          const linkedReq = requests.find(r => r.id === post.linkedEntityId);
          if (linkedReq) viewRequestDetail(linkedReq);
        } else if (post.linkedEntityType === 'resource' && post.linkedEntityId) {
          const linkedRes = resources.find(r => r.id === post.linkedEntityId);
          if (linkedRes) viewResourceDetail(linkedRes);
        } else if (post.linkedEntityType === 'plan' && post.linkedEntityId) {
          const linkedPlan = plans.find(p => p.id === post.linkedEntityId);
          if (linkedPlan) viewPlanDetail(linkedPlan);
        }
        setHighlightedEntityId(post.id);
        targetView = 'social';
        targetSubTab = 'feed';
        documentResolved = true;
      }
    }

    // I. Check Community Circles
    if (!documentResolved) {
      const comm = matchEntity(communities, 'name');
      if (comm) {
        setSelectedCommunityId(comm.id);
        setHighlightedEntityId(comm.id);
        targetView = 'social';
        targetSubTab = 'communities';
        documentResolved = true;
      }
    }

    // J. Check Readiness Checks
    if (!documentResolved) {
      const rc = targetId ? readinessChecks.find(c => c.id === targetId) : null;
      if (rc || notif.type === 'readiness_check') {
        const commId = rc?.communityId || (targetId?.startsWith('com_') ? targetId : null);
        const comm = commId ? communities.find(c => c.id === commId) : null;
        openReadinessModal(comm || null);
        if (rc?.id) setHighlightedEntityId(rc.id);
        targetView = 'social';
        targetSubTab = 'feed';
        documentResolved = true;
      }
    }

    // K. Check Moderation Reports
    if (!documentResolved) {
      const rep = targetId ? reports.find(r => r.id === targetId) : null;
      if (rep || notif.type === 'report_submitted') {
        openPublicRecordsModModal();
        if (rep?.id) setHighlightedEntityId(rep.id);
        targetView = 'social';
        targetSubTab = 'moderation';
        documentResolved = true;
      }
    }

    // L. Check User Profile
    if (!documentResolved && (targetId?.startsWith('usr_') || notif.type?.startsWith('auth_') || notif.type === 'profile_update')) {
      const targetUser = (targetId && targetId !== 'usr_me') ? targetId : currentUser;
      viewUserProfile(targetUser);
      setHighlightedEntityId(typeof targetUser === 'object' ? targetUser.id : targetUser);
      targetView = 'profile';
      targetSubTab = null;
      documentResolved = true;
    }

    // M. Fallback by notif.type if entity wasn't resolved by ID or text candidates:
    // Guarantees clicking ANY notification opens its corresponding document modal!
    if (!documentResolved) {
      if ((notif.type === 'safety_alert' || notif.type === 'hazard') && safetyReports.length > 0) {
        viewSafetyDetail(safetyReports[0]);
        setHighlightedEntityId(safetyReports[0].id);
        targetView = 'explore';
      } else if ((notif.type === 'resource_match' || notif.type === 'loan_request' || notif.type === 'resource_loan_request' || notif.type === 'resource_loan_update' || notif.type === 'resource') && resources.length > 0) {
        viewResourceDetail(resources[0]);
        setHighlightedEntityId(resources[0].id);
        targetView = 'collaborate';
        targetSubTab = 'resources';
      } else if ((notif.type === 'request_response' || notif.type === 'request') && requests.length > 0) {
        viewRequestDetail(requests[0]);
        setHighlightedEntityId(requests[0].id);
        targetView = 'collaborate';
        targetSubTab = 'requests';
      } else if ((notif.type === 'plan_update' || notif.type === 'plan') && plans.length > 0) {
        viewPlanDetail(plans[0]);
        setHighlightedEntityId(plans[0].id);
        targetView = 'plans';
      } else if ((notif.type === 'event_reminder' || notif.type === 'event') && events.length > 0) {
        setSelectedEventChat(events[0]);
        setHighlightedEntityId(events[0].id);
        targetView = 'social';
        targetSubTab = 'events';
      } else if ((notif.type === 'observation_logged' || notif.type === 'social_share') && observations.length > 0) {
        inspectEntity(observations[0], 'observation');
        setHighlightedEntityId(observations[0].id);
        targetView = 'explore';
      } else if (notif.type === 'claim_dispute' && claims.length > 0) {
        inspectEntity(claims[0], 'claim');
        setHighlightedEntityId(claims[0].id);
        targetView = 'explore';
      }
    }

    // Default view fallback if still undefined
    if (!targetView) {
      targetView = 'explore';
    }

    // 4. Synchronize router navigation
    if (navigate) {
      if (targetView === 'collaborate') navigate('/collaborate');
      else if (targetView === 'plans') navigate('/plans');
      else if (targetView === 'social') navigate('/social');
      else if (targetView === 'profile') navigate('/profile');
      else if (targetView === 'home') navigate('/');
      else navigate('/explore');
    }

    // 5. Synchronize context state navigation
    navigateTo(targetView, targetSubTab, targetId);
  }, [
    markNotificationRead,
    closeAllModals,
    requests,
    resources,
    plans,
    safetyReports,
    observations,
    claims,
    events,
    posts,
    communities,
    readinessChecks,
    reports,
    currentUser,
    viewRequestDetail,
    viewResourceDetail,
    viewPlanDetail,
    viewSafetyDetail,
    inspectEntity,
    viewUserProfile,
    openReadinessModal,
    openPublicRecordsModModal,
    navigateTo
  ]);

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
      disputeResponseTarget,
      openDisputeResponseModal,
      closeDisputeResponseModal,
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
      selectedRequestDetail,
      viewRequestDetail,
      closeRequestDetail,
      selectedResourceDetail,
      viewResourceDetail,
      closeResourceDetail,
      selectedSafetyDetail,
      viewSafetyDetail,
      closeSafetyDetail,
      selectedEvidenceDetail,
      viewEvidenceDetail,
      closeEvidenceDetailModal,
      getSubEvidenceForEvidence,
      getSubContradictionsForEvidence,
      getSubCorroborationsForEvidence,
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
      reports,
      readinessChecks,
      moderatorElections,

      // Modals for Report, Readiness, and Public Records Moderation
      isReportModalOpen,
      reportTarget,
      openReportModal,
      closeReportModal,
      isReadinessModalOpen,
      readinessModalCommunity,
      readinessModalCheckId,
      openReadinessModal,
      closeReadinessModal,
      isPublicRecordsModModalOpen,
      openPublicRecordsModModal,
      closePublicRecordsModModal,

      // Request Resource Use & Loan Actions
      isRequestResourceModalOpen,
      requestResourceTarget,
      openRequestResourceModal,
      closeRequestResourceModal,
      submitResourceLoanRequest,
      updateLoanAssignmentStatus,

      // Moderation & Kicking Actions
      reportContent,
      resolveReport,
      kickPostMember,
      kickCommunityMember,

      // Elections Actions
      loadCommunityElections,
      nominateModerator,
      voteForModerator,
      appointModerator,

      // Public Records Moderator Toggle
      togglePublicModerator,

      // Readiness Actions
      createReadinessCheck,
      submitReadinessResponse,
      closeReadinessCheck,

      // Actions
      createObservation,
      createRequest,
      createResource,
      createEvent,
      createPlan,
      createSafetyReport,
      shareObservationToSocial,
      createPost,
      editPost,
      deletePost,
      editPostComment,
      deletePostComment,
      createCommunity,
      voteOnPoll,
      addCommentToPost,
      togglePinPost,
      endorsePost,
      inviteMembersToCommunity,
      disputeClaim,
      addDisputeResponse,
      supportClaim,
      addContradictoryObservation,
      addSupportingObservation,
      addEvidenceToClaim,
      updateObservation,
      deleteObservation,
      deleteEvidence,
      deleteDispute,
      deleteDisputeResponse,
      deletePlanDecision,
      deletePlanMilestone,
      deleteSafetyReport,
      canUserManage,
      updateEvent,
      deleteEvent,
      deletePlan,
      updateRequest,
      deleteRequest,
      linkRequestToCommunity,
      unlinkRequestFromCommunity,
      isRequestVisibleToUser,
      updateResource,
      deleteResource,
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
      updateCommunity,
      uploadCommunityMedia,

      // Auth Modals & Actions
      isAuthModalOpen,
      authModalMode,
      openAuthModal,
      closeAuthModal,
      loginUser,
      registerUser,
      loginWithGoogle,
      logoutUser,
      switchUserAccount,
      updateUserProfile,

      sendDirectMessage,
      startDirectMessage,
      selectedUserProfile,
      viewUserProfile,
      closeUserProfile,
      markNotificationRead,
      markAllNotificationsRead,
      closeAllModals,
      handleNotificationClick,
      selectedCommunityId,
      setSelectedCommunityId,
      switchUser,
      resetToSeedData,

      // Admin Governance & Moderation Vault
      restrictUser,
      unrestrictUser,
      restoreVaultPost,

      // Toast Notifications
      toasts,
      showToast,
      dismissToast
    }}>
      {children}
    </CareMeshContext.Provider>
  );
};
