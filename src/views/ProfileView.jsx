import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCareMesh } from '../context/useCareMesh';
import { PlanStatusBadge, UrgencyBadge } from '../components/common/Badge';
import { 
  MapPin, 
  Package, 
  HandHeart, 
  Lock, 
  RefreshCw, 
  CheckCircle2, 
  Edit3, 
  LogIn, 
  LogOut, 
  Camera, 
  ArrowLeft, 
  MessageSquare, 
  Flag,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Radio,
  Search,
  X,
  Eye
} from 'lucide-react';
import { ChangeAvatarModal } from '../components/profile/ChangeAvatarModal';
import { EditBioModal } from '../components/profile/EditBioModal';
import { SocialMediaLinks } from '../components/profile/SocialMediaLinks';
import { usePagination } from '../hooks/usePagination';
import { Pagination } from '../components/common/Pagination';

export const ProfileView = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const { 
    currentUser, 
    setCurrentUser, 
    resources = [], 
    requests = [], 
    plans = [], 
    events = [],
    observations = [],
    resetToSeedData, 
    viewPlanDetail, 
    viewRequestDetail, 
    viewResourceDetail, 
    setSelectedEventChat,
    inspectEntity,
    openAuthModal, 
    logoutUser,
    mockUsers,
    startDirectMessage,
    openReportModal,
    showToast,
    restrictUser,
    unrestrictUser
  } = useCareMesh();

  const [activeSubTab, setActiveSubTab] = useState('requests'); // 'requests' | 'events' | 'plans' | 'resources' | 'observations' | 'privacy'
  const [profileSearch, setProfileSearch] = useState('');
  const [requestFilter, setRequestFilter] = useState('all'); // 'all' | 'my_requests' | 'volunteering' | 'open' | 'fulfilled'
  const [eventFilter, setEventFilter] = useState('all'); // 'all' | 'organizing' | 'attending'
  const [planFilter, setPlanFilter] = useState('all'); // 'all' | 'proposer' | 'participant'
  const [resourceFilter, setResourceFilter] = useState('all'); // 'all' | 'available' | 'allocated'

  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState(null);

  const isSelf = !userId || userId === currentUser?.id;

  const targetUser = useMemo(() => {
    if (isSelf) return currentUser;
    const found = mockUsers.find(u => u.id === userId);
    if (found) return found;
    return {
      id: userId,
      name: 'Community Neighbor',
      handle: `@neighbor_${userId?.slice(-4) || 'user'}`,
      role: 'Community Member',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      bio: 'Active participant in local mutual aid network and emergency preparedness.',
      location: { address: 'Maplewood, CA' },
      skills: ['Mutual Aid', 'Community Logistics'],
      stats: { contributions: 1, requestsFulfilled: 0 }
    };
  }, [userId, isSelf, currentUser, mockUsers]);

  // Target user's linked items across all entity domains
  const userRequests = useMemo(() => {
    if (!targetUser) return [];
    const uid = targetUser.id;
    const uemail = targetUser.email;
    const uhandle = targetUser.handle;

    return (requests || []).filter(r => {
      const isOwner = (
        r.requester?.id === uid || 
        r.requesterId === uid ||
        r.authorId === uid ||
        (uemail && r.requester?.email === uemail) ||
        (uhandle && r.requester?.handle === uhandle)
      );
      const isVolunteer = r.responses?.some(resp => 
        resp.user?.id === uid || 
        resp.userId === uid ||
        (uemail && resp.user?.email === uemail) ||
        (uhandle && resp.user?.handle === uhandle)
      );
      return isOwner || isVolunteer;
    });
  }, [requests, targetUser]);

  const userEvents = useMemo(() => {
    return (events || []).filter(e => 
      e.organizer?.id === targetUser?.id || 
      e.organizerId === targetUser?.id || 
      e.participants?.some(p => p.id === targetUser?.id)
    );
  }, [events, targetUser]);

  const userPlans = useMemo(() => {
    return Array.from(new Map(
      (plans || []).filter(p => 
        p.proposer?.id === targetUser?.id || 
        p.participants?.some(part => part.user?.id === targetUser?.id || part.id === targetUser?.id)
      ).map(p => [p.id, p])
    ).values());
  }, [plans, targetUser]);

  const userResources = useMemo(() => {
    return (resources || []).filter(res => 
      res.provider?.id === targetUser?.id || 
      res.providerId === targetUser?.id
    );
  }, [resources, targetUser]);

  const userObservations = useMemo(() => {
    return (observations || []).filter(o => 
      o.observer?.id === targetUser?.id || 
      o.observerId === targetUser?.id || 
      o.author?.id === targetUser?.id
    );
  }, [observations, targetUser]);

  // Search & Filtered Sub-collections
  const filteredRequests = useMemo(() => {
    const q = profileSearch.toLowerCase().trim();
    const uid = targetUser?.id;
    const uemail = targetUser?.email;
    const uhandle = targetUser?.handle;

    return userRequests.filter(r => {
      const isOwner = (
        r.requester?.id === uid || 
        r.requesterId === uid || 
        r.authorId === uid ||
        (uemail && r.requester?.email === uemail) ||
        (uhandle && r.requester?.handle === uhandle)
      );
      const isVolunteer = r.responses?.some(resp => 
        resp.user?.id === uid || 
        resp.userId === uid ||
        (uemail && resp.user?.email === uemail) ||
        (uhandle && resp.user?.handle === uhandle)
      );
      
      if (requestFilter === 'my_requests' && !isOwner) return false;
      if (requestFilter === 'volunteering' && !isVolunteer) return false;
      if (requestFilter === 'open' && r.status === 'fulfilled') return false;
      if (requestFilter === 'fulfilled' && r.status !== 'fulfilled') return false;

      if (!q) return true;
      return (
        r.title?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        r.location?.address?.toLowerCase().includes(q)
      );
    });
  }, [userRequests, profileSearch, requestFilter, targetUser]);

  const filteredEvents = useMemo(() => {
    const q = profileSearch.toLowerCase().trim();
    return userEvents.filter(e => {
      const isOrganizer = e.organizer?.id === targetUser?.id || e.organizerId === targetUser?.id;
      const isAttendee = e.participants?.some(p => p.id === targetUser?.id);

      if (eventFilter === 'organizing' && !isOrganizer) return false;
      if (eventFilter === 'attending' && !isAttendee) return false;

      if (!q) return true;
      return (
        e.title?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.eventType?.toLowerCase().includes(q) ||
        e.location?.address?.toLowerCase().includes(q)
      );
    });
  }, [userEvents, profileSearch, eventFilter, targetUser]);

  const filteredPlans = useMemo(() => {
    const q = profileSearch.toLowerCase().trim();
    return userPlans.filter(p => {
      const isProposer = p.proposer?.id === targetUser?.id;
      const isParticipant = p.participants?.some(part => part.user?.id === targetUser?.id || part.id === targetUser?.id);

      if (planFilter === 'proposer' && !isProposer) return false;
      if (planFilter === 'participant' && !isParticipant) return false;

      if (!q) return true;
      return (
        p.title?.toLowerCase().includes(q) ||
        p.problemStatement?.toLowerCase().includes(q) ||
        p.targetCommunity?.toLowerCase().includes(q)
      );
    });
  }, [userPlans, profileSearch, planFilter, targetUser]);

  const filteredResources = useMemo(() => {
    const q = profileSearch.toLowerCase().trim();
    return userResources.filter(res => {
      if (resourceFilter === 'available' && res.availability !== 'available') return false;
      if (resourceFilter === 'allocated' && res.availability === 'available') return false;

      if (!q) return true;
      return (
        res.title?.toLowerCase().includes(q) ||
        res.description?.toLowerCase().includes(q) ||
        res.contributionType?.toLowerCase().includes(q) ||
        res.conditionsTerms?.toLowerCase().includes(q)
      );
    });
  }, [userResources, profileSearch, resourceFilter]);

  const filteredObservations = useMemo(() => {
    const q = profileSearch.toLowerCase().trim();
    return userObservations.filter(o => {
      if (!q) return true;
      return (
        o.title?.toLowerCase().includes(q) ||
        o.description?.toLowerCase().includes(q) ||
        o.location?.address?.toLowerCase().includes(q) ||
        o.category?.toLowerCase().includes(q)
      );
    });
  }, [userObservations, profileSearch]);

  const requestsPagination = usePagination(filteredRequests, 5);
  const eventsPagination = usePagination(filteredEvents, 5);
  const plansPagination = usePagination(filteredPlans, 5);
  const resourcesPagination = usePagination(filteredResources, 5);
  const observationsPagination = usePagination(filteredObservations, 5);

  const totalContributions = targetUser.stats?.contributions || (
    userResources.length + userRequests.length + userPlans.length + userEvents.length + userObservations.length
  );
  const requestsFulfilledCount = userRequests.filter(r => r.status === 'fulfilled').length;
  const requestsOpenCount = userRequests.filter(r => r.status !== 'fulfilled').length;
  const requestsAuthoredCount = userRequests.filter(r => 
    r.requester?.id === targetUser?.id || 
    r.requesterId === targetUser?.id || 
    r.authorId === targetUser?.id || 
    (targetUser?.email && r.requester?.email === targetUser.email) ||
    (targetUser?.handle && r.requester?.handle === targetUser.handle)
  ).length;
  const requestsVolunteeringCount = userRequests.filter(r => 
    r.responses?.some(resp => 
      resp.user?.id === targetUser?.id || 
      resp.userId === targetUser?.id || 
      (targetUser?.email && resp.user?.email === targetUser.email) ||
      (targetUser?.handle && resp.user?.handle === targetUser.handle)
    )
  ).length;

  const togglePrivacy = (key) => {
    if (!isSelf) return;
    setCurrentUser(prev => ({
      ...prev,
      privacySettings: {
        ...prev.privacySettings,
        [key]: !prev.privacySettings?.[key]
      }
    }));
  };

  const handleReportUser = () => {
    openReportModal({
      targetType: 'profile_picture',
      targetId: targetUser.id,
      title: `${targetUser.name}'s Profile`,
      reportedUser: targetUser,
      scope: 'community'
    });
  };

  return (
    <div className="d-flex flex-column gap-4" style={{ maxWidth: '920px', margin: '0 auto', width: '100%' }}>
      {/* Profile Header Card */}
      <div className="card p-4">
        <div className="d-flex align-start justify-between flex-wrap gap-3 mb-4">
          <div className="d-flex align-start gap-4">
            <div 
              style={{ position: 'relative', cursor: isSelf ? 'pointer' : 'default', flexShrink: 0 }}
              onClick={() => {
                if (isSelf) setIsAvatarModalOpen(true);
              }}
              title={isSelf ? 'Click to change profile picture' : `${targetUser.name}'s Avatar`}
              className={isSelf ? 'tap-active' : ''}
            >
              <img
                src={targetUser.avatar}
                alt={targetUser.name}
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--primary-500)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'block'
                }}
              />
              {isSelf && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '0',
                    right: '0',
                    background: 'var(--primary-600)',
                    color: '#ffffff',
                    borderRadius: '50%',
                    width: '26px',
                    height: '26px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)',
                    border: '2px solid #ffffff'
                  }}
                  title="Change Photo"
                >
                  <Camera size={13} />
                </div>
              )}
            </div>
            <div>
              <div className="d-flex align-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-primary mb-0.5">{targetUser.name}</h2>
                {targetUser.role && (
                  <span className="badge badge-gray text-xs font-semibold">
                    <ShieldCheck size={12} className="text-brand mr-1" />
                    {targetUser.role}
                  </span>
                )}
                {isSelf && (
                  <span className="badge badge-primary text-xs">You</span>
                )}
                {(targetUser.authProvider === 'google' || targetUser.googleId) && (
                  <span 
                    className="badge text-xs d-inline-flex align-center gap-1 font-semibold"
                    style={{ background: '#ffffff', border: '1px solid #dadce0', color: '#3c4043' }}
                    title="Connected and verified with Google"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Google Verified</span>
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold text-brand d-block mb-1">{targetUser.handle || `@${targetUser.name?.toLowerCase().replace(/\s+/g, '_')}`}</span>
              {targetUser.email && (
                <span className="text-xs text-secondary d-block mb-1" style={{ fontSize: '0.72rem' }}>
                  {targetUser.email}
                </span>
              )}
              <span className="d-flex align-center gap-1 text-xs text-muted mb-2">
                <MapPin size={13} /> {
                  (!isSelf && targetUser.privacySettings?.showExactLocation === false)
                    ? (typeof targetUser.location === 'object' ? (targetUser.location?.neighborhood || 'Maplewood District, CA') : 'Maplewood District, CA')
                    : (typeof targetUser.location === 'object' ? (targetUser.location?.address || targetUser.location?.neighborhood || 'Maplewood, CA') : (targetUser.location || 'Maplewood, CA'))
                }
              </span>

              {/* Social Media Platforms Links */}
              <div className="mt-1">
                <SocialMediaLinks 
                  user={targetUser} 
                  isSelf={isSelf} 
                  onEdit={() => setIsBioModalOpen(true)}
                  size="md"
                />
              </div>
            </div>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            {isSelf ? (
              currentUser?.id === 'usr_guest' ? (
                <>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm d-flex align-center gap-1.5"
                    onClick={() => openAuthModal('register')}
                  >
                    <LogIn size={14} />
                    <span>Create Account</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm d-flex align-center gap-1.5"
                    onClick={() => openAuthModal('login')}
                  >
                    <LogIn size={14} />
                    <span>Sign In</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm d-flex align-center gap-1.5"
                    onClick={() => setIsAvatarModalOpen(true)}
                  >
                    <Camera size={14} />
                    <span>Change Photo</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm d-flex align-center gap-1.5"
                    onClick={() => openAuthModal('login')}
                  >
                    <LogIn size={14} />
                    <span>Sign In / Switch</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm d-flex align-center gap-1.5"
                    onClick={() => setIsBioModalOpen(true)}
                  >
                    <Edit3 size={14} />
                    <span>Edit Bio</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-rose d-flex align-center gap-1.5"
                    onClick={() => {
                      if (confirm(`Are you sure you want to log out of ${currentUser?.name || 'this account'}?`)) {
                        logoutUser();
                      }
                    }}
                    title="Log out of current account"
                  >
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </button>
                </>
              )
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm d-flex align-center gap-1.5"
                  onClick={() => navigate(-1)}
                  title="Return to previous screen"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                {targetUser.privacySettings?.allowDirectMessages !== false && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm d-flex align-center gap-1.5"
                    onClick={() => startDirectMessage(targetUser)}
                    title={`Start direct chat with ${targetUser.name}`}
                  >
                    <MessageSquare size={14} />
                    <span>Send Message</span>
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-muted d-flex align-center gap-1.5"
                  onClick={handleReportUser}
                  title="Report user or profile picture"
                >
                  <Flag size={14} />
                  <span>Report</span>
                </button>

                {/* Admin Restrict / Unrestrict Control */}
                {(currentUser?.isAdmin || currentUser?.role === 'admin' || currentUser?.id === 'usr_me') && !isSelf && (
                  (overrideStatus ? overrideStatus === 'restricted' : targetUser.status === 'restricted') ? (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm text-brand font-bold d-flex align-center gap-1"
                      onClick={async () => {
                        try {
                          await unrestrictUser(targetUser.id);
                          setOverrideStatus('active');
                        } catch {
                          // Error handled in context
                        }
                      }}
                    >
                      <ShieldCheck size={14} />
                      <span>Reinstate Account</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm text-rose d-flex align-center gap-1"
                      onClick={async () => {
                        const reason = prompt(`Enter audit justification reason to restrict ${targetUser.name}:`, 'Community safety standard violation');
                        if (!reason) return;
                        try {
                          await restrictUser(targetUser.id, reason);
                          setOverrideStatus('restricted');
                        } catch {
                          // Error handled in context
                        }
                      }}
                    >
                      <ShieldAlert size={14} />
                      <span>Restrict Account</span>
                    </button>
                  )
                )}
              </>
            )}
          </div>
        </div>

        {(overrideStatus ? overrideStatus === 'restricted' : targetUser.status === 'restricted') && (
          <div className="p-3 rounded border mb-3 d-flex align-center gap-2.5" style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}>
            <ShieldAlert size={22} className="flex-shrink-0 text-rose" />
            <div>
              <span className="font-bold text-xs d-block">Account Restricted by Administrator</span>
              <span className="text-xs" style={{ opacity: 0.9 }}>
                {targetUser.restrictionReason || 'This account is currently restricted due to community standard violations. Write privileges are disabled while preserving historical audit trails.'}
              </span>
            </div>
          </div>
        )}

        <div className="d-flex align-start justify-between gap-2 mb-4 p-2.5 rounded" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
          <p className="text-xs text-secondary mb-0" style={{ lineHeight: '1.5', maxWidth: '720px' }}>
            {targetUser.bio || (isSelf ? 'No community bio provided yet. Click "Edit Bio" to share your mutual aid focus.' : 'No bio provided.')}
          </p>
          {isSelf && (
            <button
              type="button"
              className="btn btn-ghost btn-xs text-muted d-flex align-center gap-1 flex-shrink-0"
              onClick={() => setIsBioModalOpen(true)}
              title="Edit community bio"
            >
              <Edit3 size={12} />
              <span>Edit</span>
            </button>
          )}
        </div>

        {/* Impact & Contribution Stats Ribbon */}
        {(!isSelf && targetUser.privacySettings?.publicContributionHistory === false) ? null : (
          <div 
            className="gap-2 p-3 card" 
            style={{ 
              background: 'var(--bg-subtle)', 
              border: '1px solid var(--border-light)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))'
            }}
          >
            <div className="text-center p-1.5">
              <span className="font-bold text-lg text-primary d-block">{totalContributions}</span>
              <span className="text-xs text-muted">Total Contributions</span>
            </div>
            <div className="text-center p-1.5">
              <span className="font-bold text-lg text-brand d-block">{userRequests.length}</span>
              <span className="text-xs text-muted">Help Requests</span>
            </div>
            <div className="text-center p-1.5">
              <span className="font-bold text-lg text-purple d-block">{userEvents.length}</span>
              <span className="text-xs text-muted">Civic Events</span>
            </div>
            <div className="text-center p-1.5">
              <span className="font-bold text-lg text-emerald d-block">{userPlans.length}</span>
              <span className="text-xs text-muted">Plans Joined</span>
            </div>
            <div className="text-center p-1.5">
              <span className="font-bold text-lg text-amber d-block">{userResources.length}</span>
              <span className="text-xs text-muted">Shared Resources</span>
            </div>
          </div>
        )}

        {/* Skills & Badges */}
        <div className="mt-4 pt-3 border-top">
          <span className="text-xs font-bold text-secondary text-uppercase d-block mb-2">
            Community Skills & Capabilities
          </span>
          <div className="d-flex gap-2 flex-wrap">
            {(targetUser.skills || ['Mutual Aid', 'Community Coordination']).map((skill, idx) => (
              <span key={idx} className="badge badge-gray text-xs">
                <CheckCircle2 size={12} className="text-brand" />
                <span>{skill}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Privacy Shield if publicContributionHistory is disabled */}
      {(!isSelf && targetUser.privacySettings?.publicContributionHistory === false) ? (
        <div className="card p-4 text-center d-flex flex-column align-center justify-center gap-2" style={{ background: 'var(--bg-subtle)' }}>
          <div 
            style={{ 
              width: '44px', 
              height: '44px', 
              borderRadius: '50%', 
              background: 'rgba(59, 130, 246, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--brand-primary, #3b82f6)'
            }}
          >
            <Lock size={22} />
          </div>
          <h4 className="font-bold text-sm text-primary mb-0">Contribution History is Private</h4>
          <p className="text-xs text-muted mb-0" style={{ maxWidth: '420px', lineHeight: '1.5' }}>
            {targetUser.name} has configured their mutual aid activity and participation history to private.
          </p>
        </div>
      ) : (
        <>
          {/* Sub-tab Switcher with Live Entity Counts */}
          <div className="touch-tab-nav border-bottom pb-2 mb-2 d-flex gap-1.5 flex-wrap">
            <button
              type="button"
              className={`btn btn-sm ${activeSubTab === 'requests' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ whiteSpace: 'nowrap' }}
              onClick={() => setActiveSubTab('requests')}
            >
              <HandHeart size={14} />
              <span>Help Requests ({userRequests.length})</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeSubTab === 'events' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ whiteSpace: 'nowrap' }}
              onClick={() => setActiveSubTab('events')}
            >
              <Calendar size={14} />
              <span>Civic Events ({userEvents.length})</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeSubTab === 'plans' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ whiteSpace: 'nowrap' }}
              onClick={() => setActiveSubTab('plans')}
            >
              <Radio size={14} />
              <span>Plans ({userPlans.length})</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeSubTab === 'resources' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ whiteSpace: 'nowrap' }}
              onClick={() => setActiveSubTab('resources')}
            >
              <Package size={14} />
              <span>Shared Resources ({userResources.length})</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeSubTab === 'observations' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ whiteSpace: 'nowrap' }}
              onClick={() => setActiveSubTab('observations')}
            >
              <Eye size={14} />
              <span>Observations ({userObservations.length})</span>
            </button>
            {isSelf && (
              <button
                type="button"
                className={`btn btn-sm ${activeSubTab === 'privacy' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ whiteSpace: 'nowrap' }}
                onClick={() => setActiveSubTab('privacy')}
              >
                <Lock size={14} />
                <span>Privacy & Settings</span>
              </button>
            )}
          </div>

          {/* Real-Time Search & Scalable Filter Controls */}
          {activeSubTab !== 'privacy' && (
            <div className="card p-2.5 mb-2 d-flex flex-column gap-2" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
              <div className="d-flex align-center gap-2">
                <div className="position-relative flex-1 d-flex align-center">
                  <Search size={14} className="position-absolute text-muted" style={{ left: '10px' }} />
                  <input
                    type="text"
                    className="form-input text-xs w-100"
                    style={{ paddingLeft: '30px', paddingRight: profileSearch ? '28px' : '10px', height: '32px' }}
                    placeholder={`Search within ${targetUser.name}'s ${activeSubTab}...`}
                    value={profileSearch}
                    onChange={(e) => setProfileSearch(e.target.value)}
                  />
                  {profileSearch && (
                    <button
                      type="button"
                      onClick={() => setProfileSearch('')}
                      className="btn-icon position-absolute"
                      style={{ right: '6px', width: '20px', height: '20px', padding: 0 }}
                      title="Clear search"
                    >
                      <X size={12} className="text-muted" />
                    </button>
                  )}
                </div>
              </div>

              {/* Subtab Drill-Down Filter Pills */}
              {activeSubTab === 'requests' && (
                <div className="d-flex align-center gap-1.5 flex-wrap">
                  <span className="text-xs text-muted font-semibold mr-1">Filter:</span>
                  <button
                    type="button"
                    className={`btn btn-xs ${requestFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px' }}
                    onClick={() => setRequestFilter('all')}
                  >
                    All ({userRequests.length})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs ${requestFilter === 'my_requests' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px' }}
                    onClick={() => setRequestFilter('my_requests')}
                  >
                    Authored Requests ({requestsAuthoredCount})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs ${requestFilter === 'volunteering' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px' }}
                    onClick={() => setRequestFilter('volunteering')}
                  >
                    Volunteering ({requestsVolunteeringCount})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs ${requestFilter === 'open' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px' }}
                    onClick={() => setRequestFilter('open')}
                  >
                    Open Needs ({requestsOpenCount})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs ${requestFilter === 'fulfilled' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px' }}
                    onClick={() => setRequestFilter('fulfilled')}
                  >
                    Fulfilled ({requestsFulfilledCount})
                  </button>
                </div>
              )}

              {activeSubTab === 'events' && (
                <div className="d-flex align-center gap-1.5 flex-wrap">
                  <span className="text-xs text-muted font-semibold mr-1">Filter:</span>
                  <button
                    type="button"
                    className={`btn btn-xs ${eventFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px' }}
                    onClick={() => setEventFilter('all')}
                  >
                    All ({userEvents.length})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs ${eventFilter === 'organizing' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px' }}
                    onClick={() => setEventFilter('organizing')}
                  >
                    Organizing / Host ({userEvents.filter(e => e.organizer?.id === targetUser?.id || e.organizerId === targetUser?.id).length})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs ${eventFilter === 'attending' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px' }}
                    onClick={() => setEventFilter('attending')}
                  >
                    Attending ({userEvents.filter(e => e.participants?.some(p => p.id === targetUser?.id)).length})
                  </button>
                </div>
              )}

              {activeSubTab === 'plans' && (
                <div className="d-flex align-center gap-1.5 flex-wrap">
                  <span className="text-xs text-muted font-semibold mr-1">Filter:</span>
                  <button
                    type="button"
                    className={`btn btn-xs ${planFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px' }}
                    onClick={() => setPlanFilter('all')}
                  >
                    All ({userPlans.length})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs ${planFilter === 'proposer' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px' }}
                    onClick={() => setPlanFilter('proposer')}
                  >
                    Proposer ({userPlans.filter(p => p.proposer?.id === targetUser?.id).length})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs ${planFilter === 'participant' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px' }}
                    onClick={() => setPlanFilter('participant')}
                  >
                    Participant ({userPlans.filter(p => p.participants?.some(part => part.user?.id === targetUser?.id || part.id === targetUser?.id)).length})
                  </button>
                </div>
              )}

              {activeSubTab === 'resources' && (
                <div className="d-flex align-center gap-1.5 flex-wrap">
                  <span className="text-xs text-muted font-semibold mr-1">Filter:</span>
                  <button
                    type="button"
                    className={`btn btn-xs ${resourceFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px' }}
                    onClick={() => setResourceFilter('all')}
                  >
                    All ({userResources.length})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs ${resourceFilter === 'available' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px' }}
                    onClick={() => setResourceFilter('available')}
                  >
                    Available
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs ${resourceFilter === 'allocated' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px' }}
                    onClick={() => setResourceFilter('allocated')}
                  >
                    In Use / Allocated
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: HELP REQUESTS */}
          {activeSubTab === 'requests' && (
            <div className="d-flex flex-column gap-2.5">
              {filteredRequests.length === 0 ? (
                <div className="card p-4 text-center text-xs text-muted" style={{ background: 'var(--bg-subtle)' }}>
                  {profileSearch 
                    ? `No help requests match "${profileSearch}".`
                    : isSelf 
                      ? 'You have not authored or volunteered for any help requests yet.' 
                      : `${targetUser.name} has no matching help requests.`}
                </div>
              ) : (
                <>
                  {requestsPagination.paginatedItems.map(req => {
                    const isOwner = req.requester?.id === targetUser?.id || req.requesterId === targetUser?.id || req.authorId === targetUser?.id;
                    return (
                      <div 
                        key={req.id} 
                        className="card p-3 card-interactive cursor-pointer d-flex flex-column gap-2"
                        onClick={() => viewRequestDetail(req)}
                      >
                        <div className="d-flex align-start justify-between gap-2 flex-wrap">
                          <div className="min-w-0 flex-1">
                            <div className="d-flex align-center gap-1.5 mb-1 flex-wrap">
                              <UrgencyBadge urgency={req.urgency} />
                              <span className="badge badge-secondary text-xs">{req.category}</span>
                              <span className={`badge ${isOwner ? 'badge-primary' : 'badge-emerald'} text-xs`}>
                                {isOwner ? 'Requester (Author)' : 'Committed Volunteer'}
                              </span>
                              {req.status === 'fulfilled' && (
                                <span className="badge badge-emerald text-xs">Fulfilled</span>
                              )}
                            </div>
                            <h5 className="font-bold text-sm text-primary mb-1">{req.title}</h5>
                            <p className="text-xs text-secondary mb-1 line-clamp-2" style={{ lineHeight: '1.4' }}>
                              {req.description}
                            </p>
                            <div className="d-flex align-center gap-2 text-xs text-muted flex-wrap">
                              <span><MapPin size={11} className="d-inline mr-0.5" /> {req.location?.address || 'Community Area'}</span>
                              <span>•</span>
                              <span>{req.peopleJoined || 0} of {req.peopleNeeded || 1} volunteers</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              viewRequestDetail(req);
                            }}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <Pagination
                    currentPage={requestsPagination.currentPage}
                    totalPages={requestsPagination.totalPages}
                    totalItems={requestsPagination.totalItems}
                    pageSize={requestsPagination.pageSize}
                    onPageChange={requestsPagination.setCurrentPage}
                    compact={true}
                    itemLabel="requests"
                  />
                </>
              )}
            </div>
          )}

          {/* TAB 2: CIVIC EVENTS & WORK PARTIES */}
          {activeSubTab === 'events' && (
            <div className="d-flex flex-column gap-2.5">
              {filteredEvents.length === 0 ? (
                <div className="card p-4 text-center text-xs text-muted" style={{ background: 'var(--bg-subtle)' }}>
                  {profileSearch 
                    ? `No civic events match "${profileSearch}".`
                    : isSelf 
                      ? 'You have not organized or joined any civic events yet.' 
                      : `${targetUser.name} has no matching civic events.`}
                </div>
              ) : (
                <>
                  {eventsPagination.paginatedItems.map(evt => {
                    const isOrganizer = evt.organizer?.id === targetUser?.id || evt.organizerId === targetUser?.id;
                    return (
                      <div 
                        key={evt.id} 
                        className="card p-3 card-interactive cursor-pointer d-flex flex-column gap-2"
                        onClick={() => setSelectedEventChat && setSelectedEventChat(evt)}
                      >
                        <div className="d-flex align-start justify-between gap-2 flex-wrap">
                          <div className="min-w-0 flex-1">
                            <div className="d-flex align-center gap-1.5 mb-1 flex-wrap">
                              <span className="badge badge-purple text-xs text-uppercase font-semibold">
                                {evt.eventType?.replace('_', ' ') || 'Event'}
                              </span>
                              <span className={`badge ${isOrganizer ? 'badge-primary' : 'badge-emerald'} text-xs`}>
                                {isOrganizer ? 'Host & Organizer' : 'Registered Attendee'}
                              </span>
                              <span className="badge badge-secondary text-xs">
                                {evt.participants?.length || 0} / {evt.maxParticipants || 20} Attendees
                              </span>
                            </div>
                            <h5 className="font-bold text-sm text-primary mb-1">{evt.title}</h5>
                            <p className="text-xs text-secondary mb-1 line-clamp-2" style={{ lineHeight: '1.4' }}>
                              {evt.description}
                            </p>
                            <div className="d-flex align-center gap-2 text-xs text-muted flex-wrap">
                              <span><Calendar size={11} className="d-inline mr-0.5" /> {evt.date} • {evt.time}</span>
                              <span>•</span>
                              <span><MapPin size={11} className="d-inline mr-0.5" /> {evt.location?.address || 'Community Venue'}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (setSelectedEventChat) setSelectedEventChat(evt);
                            }}
                          >
                            View & Coordinate
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <Pagination
                    currentPage={eventsPagination.currentPage}
                    totalPages={eventsPagination.totalPages}
                    totalItems={eventsPagination.totalItems}
                    pageSize={eventsPagination.pageSize}
                    onPageChange={eventsPagination.setCurrentPage}
                    compact={true}
                    itemLabel="events"
                  />
                </>
              )}
            </div>
          )}

          {/* TAB 3: LONG-TERM PLANS */}
          {activeSubTab === 'plans' && (
            <div className="d-flex flex-column gap-2.5">
              {filteredPlans.length === 0 ? (
                <div className="card p-4 text-center text-xs text-muted" style={{ background: 'var(--bg-subtle)' }}>
                  {profileSearch 
                    ? `No plans match "${profileSearch}".`
                    : isSelf 
                      ? 'No active participating plans at this time. Explore community proposals to get involved!' 
                      : `${targetUser.name} has not joined any public community plans yet.`}
                </div>
              ) : (
                <>
                  {plansPagination.paginatedItems.map(plan => {
                    const completedCount = plan.milestones?.filter(m => m.status === 'completed').length || 0;
                    const totalCount = plan.milestones?.length || 0;

                    return (
                      <div 
                        key={plan.id} 
                        className="card p-3 card-interactive cursor-pointer d-flex align-center justify-between gap-2"
                        onClick={() => viewPlanDetail(plan)}
                      >
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-sm text-primary mb-1">{plan.title}</h5>
                          <span className="text-xs text-muted d-block line-clamp-2">
                            {completedCount} of {totalCount} Milestones Completed · {plan.problemStatement}
                          </span>
                        </div>
                        <div className="d-flex align-center gap-2 flex-shrink-0">
                          <PlanStatusBadge status={plan.overallStatus || 'in_progress'} />
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              viewPlanDetail(plan);
                            }}
                          >
                            Plan Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <Pagination
                    currentPage={plansPagination.currentPage}
                    totalPages={plansPagination.totalPages}
                    totalItems={plansPagination.totalItems}
                    pageSize={plansPagination.pageSize}
                    onPageChange={plansPagination.setCurrentPage}
                    compact={true}
                    itemLabel="plans"
                  />
                </>
              )}
            </div>
          )}

          {/* TAB 4: SHARED RESOURCES */}
          {activeSubTab === 'resources' && (
            <div className="d-flex flex-column gap-2.5">
              {filteredResources.length === 0 ? (
                <div className="card p-4 text-center text-xs text-muted" style={{ background: 'var(--bg-subtle)' }}>
                  {profileSearch 
                    ? `No resources match "${profileSearch}".`
                    : isSelf 
                      ? 'You have not shared any resources yet.' 
                      : `${targetUser.name} has not listed any shared equipment or resources yet.`}
                </div>
              ) : (
                <>
                  {resourcesPagination.paginatedItems.map(res => (
                    <div 
                      key={res.id} 
                      className="card p-3 card-interactive cursor-pointer d-flex flex-column justify-between gap-2"
                      onClick={() => viewResourceDetail(res)}
                    >
                      <div>
                        <div className="d-flex align-center justify-between mb-1.5 flex-wrap gap-1">
                          <span className="badge badge-primary text-xs">{res.contributionType}</span>
                          <span className={`badge ${res.availability === 'available' ? 'badge-emerald' : 'badge-secondary'} text-xs`}>
                            {res.availability}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-primary mb-1">{res.title}</h4>
                        <p className="text-xs text-secondary mb-1 line-clamp-2">{res.description}</p>
                        <div className="text-xs text-muted">
                          <strong>Capacity:</strong> {res.quantity} • <strong>Terms:</strong> {res.conditionsTerms}
                        </div>
                      </div>
                      <div className="d-flex justify-end pt-1.5 border-top">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            viewResourceDetail(res);
                          }}
                        >
                          Resource Details
                        </button>
                      </div>
                    </div>
                  ))}
                  <Pagination
                    currentPage={resourcesPagination.currentPage}
                    totalPages={resourcesPagination.totalPages}
                    totalItems={resourcesPagination.totalItems}
                    pageSize={resourcesPagination.pageSize}
                    onPageChange={resourcesPagination.setCurrentPage}
                    compact={true}
                    itemLabel="resources"
                  />
                </>
              )}
            </div>
          )}

          {/* TAB 5: FIELD OBSERVATIONS */}
          {activeSubTab === 'observations' && (
            <div className="d-flex flex-column gap-2.5">
              {filteredObservations.length === 0 ? (
                <div className="card p-4 text-center text-xs text-muted" style={{ background: 'var(--bg-subtle)' }}>
                  {profileSearch 
                    ? `No observations match "${profileSearch}".`
                    : isSelf 
                      ? 'You have not published any field observations yet.' 
                      : `${targetUser.name} has no field observations recorded.`}
                </div>
              ) : (
                <>
                  {observationsPagination.paginatedItems.map(obs => (
                    <div 
                      key={obs.id} 
                      className="card p-3 card-interactive cursor-pointer d-flex align-center justify-between gap-2"
                      onClick={() => inspectEntity && inspectEntity(obs)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="d-flex align-center gap-1.5 mb-1 flex-wrap">
                          <span className="badge badge-secondary text-xs">{obs.category || 'Observation'}</span>
                          <span className="badge badge-emerald text-xs font-semibold">
                            {obs.evidenceCount || (obs.evidenceFiles?.length) || 1} Evidence Records
                          </span>
                        </div>
                        <h5 className="font-bold text-sm text-primary mb-1">{obs.title}</h5>
                        <p className="text-xs text-secondary mb-1 line-clamp-2" style={{ lineHeight: '1.4' }}>
                          {obs.description}
                        </p>
                        <span className="text-xs text-muted">
                          <MapPin size={11} className="d-inline mr-0.5" /> {obs.location?.address || 'Field Location'}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (inspectEntity) inspectEntity(obs);
                        }}
                      >
                        Inspect Record
                      </button>
                    </div>
                  ))}
                  <Pagination
                    currentPage={observationsPagination.currentPage}
                    totalPages={observationsPagination.totalPages}
                    totalItems={observationsPagination.totalItems}
                    pageSize={observationsPagination.pageSize}
                    onPageChange={observationsPagination.setCurrentPage}
                    compact={true}
                    itemLabel="observations"
                  />
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* TAB 3: PRIVACY & PROTOTYPE CONTROLS (Self only) */}
      {isSelf && activeSubTab === 'privacy' && (
        <div className="card p-4 d-flex flex-column gap-4">
          <div>
            <h4 className="font-bold text-sm text-primary mb-1">Privacy & Real-World Safety Controls</h4>
            <p className="text-xs text-secondary">
              CareMesh is built for physical safety. Choose what information neighbors and public viewers can see.
            </p>
          </div>

          <div className="d-flex flex-column gap-3">
            <div className="d-flex align-center justify-between p-3 rounded" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
              <div>
                <span className="font-bold text-xs text-primary d-block">Display Exact Pinned Coordinates</span>
                <span className="text-xs text-muted">When off, only your general district/neighborhood is displayed.</span>
              </div>
              <button
                className={`btn btn-sm ${currentUser.privacySettings?.showExactLocation ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => togglePrivacy('showExactLocation')}
              >
                {currentUser.privacySettings?.showExactLocation ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="d-flex align-center justify-between p-3 rounded" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
              <div>
                <span className="font-bold text-xs text-primary d-block">Allow Direct Peer Coordination Messages</span>
                <span className="text-xs text-muted">Allows coordinators to message you about matched resources.</span>
              </div>
              <button
                className={`btn btn-sm ${currentUser.privacySettings?.allowDirectMessages ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => togglePrivacy('allowDirectMessages')}
              >
                {currentUser.privacySettings?.allowDirectMessages ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="d-flex align-center justify-between p-3 rounded" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
              <div>
                <span className="font-bold text-xs text-primary d-block">Public Contribution History & Provenance Trail</span>
                <span className="text-xs text-muted">Displays your completed help requests and evidence submissions.</span>
              </div>
              <button
                className={`btn btn-sm ${currentUser.privacySettings?.publicContributionHistory ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => togglePrivacy('publicContributionHistory')}
              >
                {currentUser.privacySettings?.publicContributionHistory ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          {/* Account Authentication & Session Controls */}
          <div className="mt-3 pt-3 border-top">
            <h5 className="font-bold text-xs text-primary mb-2 d-flex align-center gap-1.5">
              <Lock size={14} className="text-brand" />
              <span>Account Authentication & Session</span>
            </h5>
            <div className="p-3 rounded mb-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
              <div className="d-flex align-center justify-between flex-wrap gap-2 mb-2">
                <div>
                  <span className="font-bold text-xs text-primary d-block">Active Account: {currentUser.name}</span>
                  <span className="text-xs text-muted">Signed in as <strong>{currentUser.handle}</strong> ({currentUser.email || 'caremesh persona'})</span>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs d-flex align-center gap-1"
                    onClick={() => setIsAvatarModalOpen(true)}
                  >
                    <Camera size={12} />
                    <span>Change Picture</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs d-flex align-center gap-1"
                    onClick={() => openAuthModal('login')}
                  >
                    <LogIn size={12} />
                    <span>Switch / Sign In</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs text-rose d-flex align-center gap-1"
                    onClick={() => {
                      if (confirm(`Log out of ${currentUser.name}?`)) {
                        logoutUser();
                      }
                    }}
                  >
                    <LogOut size={12} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Reset Prototype Data Button */}
          <div className="mt-1 pt-3 border-top d-flex align-center justify-between">
            <div>
              <span className="font-bold text-xs text-primary d-block">Reset Prototype Demo State</span>
              <span className="text-xs text-muted">Restore all original mock observations, plans, evidence, and requests.</span>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                if (confirm('Reset prototype to original seed state? All newly created items will be restored to defaults.')) {
                  resetToSeedData();
                  showToast('Prototype state reset successfully.', 'success');
                }
              }}
            >
              <RefreshCw size={14} />
              <span>Reset to Seed Data</span>
            </button>
          </div>
        </div>
      )}

      {/* Change Avatar / Profile Picture Modal */}
      {isSelf && (
        <ChangeAvatarModal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
        />
      )}

      {/* Edit Bio & Community Focus Modal */}
      {isSelf && (
        <EditBioModal
          isOpen={isBioModalOpen}
          onClose={() => setIsBioModalOpen(false)}
        />
      )}
    </div>
  );
};
