import { useState, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { useCareMesh } from '../../context/useCareMesh';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../common/Pagination';
import { 
  MapPin, 
  MessageSquare, 
  Package, 
  HandHeart, 
  Eye, 
  Target, 
  ShieldCheck, 
  Flag, 
  ExternalLink,
  Award,
  Sparkles,
  Share2,
  Calendar
} from 'lucide-react';
import { PlanStatusBadge, UrgencyBadge } from '../common/Badge';
import { useNavigate } from 'react-router-dom';
import { SocialMediaLinks } from './SocialMediaLinks';

export const UserProfileModal = ({ isOpen, onClose, user }) => {
  const navigate = useNavigate();
  const { 
    currentUser, 
    resources, 
    requests, 
    observations, 
    plans, 
    posts, 
    events = [],
    setSelectedEventChat,
    startDirectMessage,
    openReportModal,
    viewPlanDetail,
    viewRequestDetail,
    viewResourceDetail,
    inspectEntity,
    mockUsers
  } = useCareMesh();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'resources' | 'requests' | 'events' | 'observations' | 'plans' | 'posts'

  // Merge provided user with full user record from mockUsers/currentUser
  const profileUser = useMemo(() => {
    if (!user) return null;
    const targetId = user.id || user.userId || user.authorId;
    if (targetId === currentUser?.id) return currentUser;
    const full = mockUsers.find(u => u.id === targetId || u.name === user.name) || {};
    return { ...full, ...user };
  }, [user, currentUser, mockUsers]);

  const isSelf = profileUser?.id === currentUser?.id;

  // Linked items
  const userResources = profileUser ? resources.filter(r => r.provider?.id === profileUser.id || r.providerId === profileUser.id) : [];
  const userRequests = profileUser ? requests.filter(r => 
    r.requester?.id === profileUser.id || 
    r.requesterId === profileUser.id ||
    r.authorId === profileUser.id ||
    (profileUser.email && r.requester?.email === profileUser.email) ||
    (profileUser.handle && r.requester?.handle === profileUser.handle) ||
    r.responses?.some(resp => 
      resp.user?.id === profileUser.id || 
      resp.userId === profileUser.id ||
      (profileUser.email && resp.user?.email === profileUser.email) ||
      (profileUser.handle && resp.user?.handle === profileUser.handle)
    )
  ) : [];
  const userEvents = profileUser ? (events || []).filter(e => e.organizer?.id === profileUser.id || e.organizerId === profileUser.id || e.participants?.some(p => p.id === profileUser.id)) : [];
  const userObservations = profileUser ? observations.filter(o => o.author?.id === profileUser.id || o.authorId === profileUser.id || o.author_id === profileUser.id) : [];
  const userPlans = profileUser ? plans.filter(p => p.proposer?.id === profileUser.id || p.participants?.some(part => part.user?.id === profileUser.id)) : [];
  const userPosts = profileUser ? posts.filter(p => p.author?.id === profileUser.id || p.authorId === profileUser.id || p.author_id === profileUser.id) : [];

  const resourcesPagination = usePagination(userResources, 4);
  const requestsPagination = usePagination(userRequests, 4);
  const eventsPagination = usePagination(userEvents, 4);
  const observationsPagination = usePagination(userObservations, 4);
  const plansPagination = usePagination(userPlans, 4);
  const postsPagination = usePagination(userPosts, 4);

  if (!profileUser) return null;

  const locationStr = typeof profileUser.location === 'object'
    ? (profileUser.location?.neighborhood || profileUser.location?.address || 'Maplewood Local Area')
    : (profileUser.location || 'Maplewood Local Area');

  const handleMessageUser = () => {
    onClose();
    if (startDirectMessage) {
      startDirectMessage(profileUser);
    }
  };

  const handleReportUser = () => {
    openReportModal({
      targetType: 'profile_picture',
      targetId: profileUser.id,
      title: `${profileUser.name}'s Profile`,
      reportedUser: profileUser,
      scope: 'community'
    });
  };

  const handleViewFullProfilePage = () => {
    onClose();
    navigate(`/profile/${profileUser.id}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Neighbor Profile & Mutual Aid Activity"
      subtitle="Transparent community reputation, verified capabilities, and contributions."
      maxWidth="760px"
      zIndex={1100}
      footer={
        <div className="d-flex align-center justify-between w-100 gap-2 flex-wrap">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Close
          </button>

          <div className="d-flex align-center gap-2">
            {!isSelf && (
              <>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-muted d-flex align-center gap-1"
                  onClick={handleReportUser}
                  title="Report profile for moderation audit"
                >
                  <Flag size={13} />
                  <span>Report</span>
                </button>

                <button
                  type="button"
                  className="btn btn-primary btn-sm d-flex align-center gap-1.5"
                  onClick={handleMessageUser}
                >
                  <MessageSquare size={14} />
                  <span>Message {profileUser.name.split(' ')[0]}</span>
                </button>
              </>
            )}

            <button
              type="button"
              className="btn btn-secondary btn-sm d-flex align-center gap-1"
              onClick={handleViewFullProfilePage}
              title="Open full dedicated profile page"
            >
              <ExternalLink size={13} />
              <span>Full Page</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="d-flex flex-column gap-4">
        {/* Profile Banner & Identity Header */}
        <div 
          className="card p-0 overflow-hidden" 
          style={{ border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-xs)' }}
        >
          {/* Cover Header Bar */}
          <div 
            style={{ 
              height: '84px', 
              background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)',
              position: 'relative'
            }}
          />

          <div className="p-4 pt-0" style={{ position: 'relative' }}>
            {/* Avatar & Action Row */}
            <div className="d-flex align-end justify-between flex-wrap gap-3" style={{ marginTop: '-42px' }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={profileUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={profileUser.name}
                  style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '4px solid #ffffff',
                    boxShadow: 'var(--shadow-md)',
                    background: '#ffffff',
                    display: 'block'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="d-flex align-center gap-2 pt-2">
                {!isSelf ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm d-flex align-center gap-1.5"
                    onClick={handleMessageUser}
                  >
                    <MessageSquare size={14} />
                    <span>Send Message</span>
                  </button>
                ) : (
                  <span className="badge badge-primary text-xs font-bold">
                    This is your account
                  </span>
                )}
              </div>
            </div>

            {/* User Name, Handle, Role */}
            <div className="mt-3">
              <div className="d-flex align-center gap-2 flex-wrap mb-1">
                <h3 className="font-bold text-lg text-primary mb-0">{profileUser.name}</h3>
                <span className="text-xs text-muted font-medium">
                  {profileUser.handle || `@user_${profileUser.id}`}
                </span>
                {profileUser.isPublicModerator && (
                  <span className="badge badge-primary text-xs d-flex align-center gap-1" style={{ fontSize: '0.68rem' }}>
                    <ShieldCheck size={11} /> Public Records Moderator
                  </span>
                )}
              </div>

              {profileUser.role && (
                <p className="text-xs text-secondary font-semibold mb-2 d-flex align-center gap-1">
                  <Award size={13} className="text-brand" />
                  <span>{profileUser.role}</span>
                </p>
              )}

              {/* Location */}
              <div className="d-flex align-center gap-2 text-xs text-muted mb-2">
                <MapPin size={13} className="text-muted flex-shrink-0" />
                <span>{locationStr}</span>
              </div>

              {/* Social Media Platform Links */}
              <div className="mt-2">
                <SocialMediaLinks 
                  user={profileUser} 
                  isSelf={isSelf}
                  size="sm"
                />
              </div>
            </div>

            {/* Bio */}
            {profileUser.bio && (
              <p className="text-xs text-secondary mt-3 mb-0 p-3 rounded" style={{ background: 'var(--bg-subtle)', lineHeight: '1.55', border: '1px solid var(--border-light)' }}>
                {profileUser.bio}
              </p>
            )}

            {/* Skills & Badges */}
            <div className="d-flex flex-column gap-2 mt-3 pt-3 border-top">
              {profileUser.skills && profileUser.skills.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-muted text-uppercase d-block mb-1.5" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                    Registered Skills & Capabilities
                  </span>
                  <div className="d-flex align-center gap-1.5 flex-wrap">
                    {profileUser.skills.map((skill, idx) => (
                      <span 
                        key={idx} 
                        className="badge badge-gray text-xs font-medium"
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profileUser.badges && profileUser.badges.length > 0 && (
                <div className="mt-1">
                  <div className="d-flex align-center gap-1.5 flex-wrap">
                    {profileUser.badges.map((badge, idx) => (
                      <span 
                        key={idx} 
                        className="badge badge-primary text-xs font-semibold d-flex align-center gap-1"
                        style={{ fontSize: '0.7rem' }}
                      >
                        <Sparkles size={11} />
                        <span>{badge}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div 
          className="mb-2" 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(95px, 1fr))', 
            gap: '0.5rem' 
          }}
        >
          <div className="card p-2 text-center" style={{ background: 'var(--bg-subtle)' }}>
            <span className="font-bold text-md text-primary d-block">{userResources.length}</span>
            <span className="text-xs text-muted" style={{ fontSize: '0.68rem' }}>Shared Resources</span>
          </div>
          <div className="card p-2 text-center" style={{ background: 'var(--bg-subtle)' }}>
            <span className="font-bold text-md text-primary d-block">{userRequests.length}</span>
            <span className="text-xs text-muted" style={{ fontSize: '0.68rem' }}>Help Requests</span>
          </div>
          <div className="card p-2 text-center" style={{ background: 'var(--bg-subtle)' }}>
            <span className="font-bold text-md text-purple d-block">{userEvents.length}</span>
            <span className="text-xs text-muted" style={{ fontSize: '0.68rem' }}>Civic Events</span>
          </div>
          <div className="card p-2 text-center" style={{ background: 'var(--bg-subtle)' }}>
            <span className="font-bold text-md text-primary d-block">{userObservations.length}</span>
            <span className="text-xs text-muted" style={{ fontSize: '0.68rem' }}>Observations</span>
          </div>
          <div className="card p-2 text-center" style={{ background: 'var(--bg-subtle)' }}>
            <span className="font-bold text-md text-primary d-block">{userPlans.length}</span>
            <span className="text-xs text-muted" style={{ fontSize: '0.68rem' }}>Plans Joined</span>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="touch-tab-nav border-bottom pb-2 d-flex gap-1 flex-wrap">
          <button
            type="button"
            className={`btn btn-xs ${activeTab === 'overview' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            type="button"
            className={`btn btn-xs ${activeTab === 'resources' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('resources')}
          >
            <Package size={12} />
            <span>Resources ({userResources.length})</span>
          </button>
          <button
            type="button"
            className={`btn btn-xs ${activeTab === 'requests' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('requests')}
          >
            <HandHeart size={12} />
            <span>Requests ({userRequests.length})</span>
          </button>
          <button
            type="button"
            className={`btn btn-xs ${activeTab === 'events' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('events')}
          >
            <Calendar size={12} />
            <span>Events ({userEvents.length})</span>
          </button>
          <button
            type="button"
            className={`btn btn-xs ${activeTab === 'observations' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('observations')}
          >
            <Eye size={12} />
            <span>Observations ({userObservations.length})</span>
          </button>
          <button
            type="button"
            className={`btn btn-xs ${activeTab === 'plans' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('plans')}
          >
            <Target size={12} />
            <span>Plans ({userPlans.length})</span>
          </button>
          <button
            type="button"
            className={`btn btn-xs ${activeTab === 'posts' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('posts')}
          >
            <Share2 size={12} />
            <span>Posts ({userPosts.length})</span>
          </button>
        </div>

        {/* TAB CONTENT */}
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="d-flex flex-column gap-3">
            <div className="p-3 rounded" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
              <span className="font-bold text-xs text-primary d-block mb-1">Community Participation</span>
              <p className="text-xs text-secondary mb-0" style={{ lineHeight: '1.5' }}>
                {profileUser.name} is an active neighbor coordinating mutual aid in the {locationStr} area.
                All shared tools, emergency requests, observations, and plan contributions are traceable on the CareMesh public ledger.
              </p>
            </div>

            {/* Highlights */}
            {userResources.length > 0 && (
              <div>
                <span className="text-xs font-bold text-secondary text-uppercase d-block mb-1.5" style={{ fontSize: '0.68rem' }}>
                  Available Equipment / Resources
                </span>
                <div className="d-flex flex-column gap-1.5">
                  {userResources.slice(0, 2).map(r => (
                    <div 
                      key={r.id} 
                      className="p-2.5 rounded border bg-white card-interactive cursor-pointer d-flex align-center justify-between"
                      onClick={() => { onClose(); viewResourceDetail(r); }}
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-primary d-block text-truncate">{r.title}</span>
                        <span className="text-xs text-muted">{r.contributionType} • {r.availability}</span>
                      </div>
                      <span className="badge badge-primary text-xs">View</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Shared Resources */}
        {activeTab === 'resources' && (
          <div className="d-flex flex-column gap-2">
            {userResources.length > 0 ? (
              <>
                {resourcesPagination.paginatedItems.map(r => (
                  <div
                    key={r.id}
                    className="card p-3 card-interactive cursor-pointer"
                    onClick={() => { onClose(); viewResourceDetail(r); }}
                  >
                    <div className="d-flex align-center justify-between mb-1">
                      <span className="font-bold text-sm text-primary">{r.title}</span>
                      <span className="badge badge-primary text-xs text-uppercase">{r.contributionType}</span>
                    </div>
                    <p className="text-xs text-secondary mb-2">{r.description}</p>
                    <div className="d-flex align-center gap-3 text-xs text-muted">
                      <span>Quantity: {r.quantity || '1 Unit'}</span>
                      <span>Status: {r.availability}</span>
                    </div>
                  </div>
                ))}
                <Pagination
                  compact={true}
                  currentPage={resourcesPagination.currentPage}
                  totalPages={resourcesPagination.totalPages}
                  totalItems={resourcesPagination.totalItems}
                  startIndex={resourcesPagination.startIndex}
                  endIndex={resourcesPagination.endIndex}
                  onPageChange={resourcesPagination.setPage}
                  pageSize={resourcesPagination.pageSize}
                  onPageSizeChange={resourcesPagination.handlePageSizeChange}
                  itemName="resources"
                />
              </>
            ) : (
              <div className="card p-4 text-center text-muted">
                <Package size={28} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs mb-0">No resources or equipment currently shared by {profileUser.name}.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Help Requests */}
        {activeTab === 'requests' && (
          <div className="d-flex flex-column gap-2">
            {userRequests.length > 0 ? (
              <>
                {requestsPagination.paginatedItems.map(r => (
                  <div
                    key={r.id}
                    className="card p-3 card-interactive cursor-pointer"
                    onClick={() => { onClose(); viewRequestDetail(r); }}
                  >
                    <div className="d-flex align-center justify-between mb-1 gap-2 flex-wrap">
                      <span className="font-bold text-sm text-primary">{r.title}</span>
                      <div className="d-flex align-center gap-1.5 flex-shrink-0">
                        {r.status === 'fulfilled' ? (
                          <span className="badge badge-emerald text-xs">🟢 Fulfilled</span>
                        ) : (
                          <UrgencyBadge urgency={r.urgency} />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-secondary mb-2">{r.description}</p>
                    <span className="text-xs text-muted">{r.location?.address} • {r.timestamp || 'Recent'}</span>
                  </div>
                ))}
                <Pagination
                  compact={true}
                  currentPage={requestsPagination.currentPage}
                  totalPages={requestsPagination.totalPages}
                  totalItems={requestsPagination.totalItems}
                  startIndex={requestsPagination.startIndex}
                  endIndex={requestsPagination.endIndex}
                  onPageChange={requestsPagination.setPage}
                  pageSize={requestsPagination.pageSize}
                  onPageSizeChange={requestsPagination.handlePageSizeChange}
                  itemName="requests"
                />
              </>
            ) : (
              <div className="card p-4 text-center text-muted">
                <HandHeart size={28} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs mb-0">No active help requests posted by {profileUser.name}.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Events */}
        {activeTab === 'events' && (
          <div className="d-flex flex-column gap-2">
            {userEvents.length > 0 ? (
              <>
                {eventsPagination.paginatedItems.map(evt => {
                  const isOrganizer = evt.organizer?.id === profileUser.id || evt.organizerId === profileUser.id;
                  return (
                    <div 
                      key={evt.id} 
                      className="card p-3 card-interactive cursor-pointer d-flex align-center justify-between gap-2"
                      onClick={() => {
                        onClose();
                        if (setSelectedEventChat) setSelectedEventChat(evt);
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="d-flex align-center gap-1.5 mb-1 flex-wrap">
                          <span className="badge badge-purple text-xs text-uppercase font-semibold">
                            {evt.eventType?.replace('_', ' ') || 'Event'}
                          </span>
                          <span className={`badge ${isOrganizer ? 'badge-primary' : 'badge-emerald'} text-xs`}>
                            {isOrganizer ? 'Host' : 'Attending'}
                          </span>
                          <span className="badge badge-secondary text-xs">
                            {evt.participants?.length || 0} / {evt.maxParticipants || 20}
                          </span>
                        </div>
                        <h5 className="font-bold text-xs text-primary mb-0.5">{evt.title}</h5>
                        <span className="text-xs text-muted d-block line-clamp-1">
                          {evt.date} • {evt.time} • {evt.location?.address}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose();
                          if (setSelectedEventChat) setSelectedEventChat(evt);
                        }}
                      >
                        Details
                      </button>
                    </div>
                  );
                })}
                <Pagination
                  compact={true}
                  currentPage={eventsPagination.currentPage}
                  totalPages={eventsPagination.totalPages}
                  totalItems={eventsPagination.totalItems}
                  startIndex={eventsPagination.startIndex}
                  endIndex={eventsPagination.endIndex}
                  onPageChange={eventsPagination.setPage}
                  pageSize={eventsPagination.pageSize}
                  onPageSizeChange={eventsPagination.handlePageSizeChange}
                  itemName="events"
                />
              </>
            ) : (
              <div className="card p-4 text-center text-muted">
                <Calendar size={28} className="mx-auto mb-2 opacity-50 text-purple" />
                <p className="text-xs mb-0">No civic events or work parties organized or joined by {profileUser.name}.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Observations */}
        {activeTab === 'observations' && (
          <div className="d-flex flex-column gap-2">
            {userObservations.length > 0 ? (
              <>
                {observationsPagination.paginatedItems.map(o => (
                  <div
                    key={o.id}
                    className="card p-3 card-interactive cursor-pointer"
                    onClick={() => { onClose(); inspectEntity(o, 'observation'); }}
                  >
                    <div className="d-flex align-center justify-between mb-1">
                      <span className="font-bold text-sm text-primary">{o.title}</span>
                      <span className="badge badge-gray text-xs text-uppercase">{o.category}</span>
                    </div>
                    <p className="text-xs text-secondary mb-2">{o.description}</p>
                    <span className="text-xs text-muted">{o.location?.address} • {o.timestamp || 'Recent'}</span>
                  </div>
                ))}
                <Pagination
                  compact={true}
                  currentPage={observationsPagination.currentPage}
                  totalPages={observationsPagination.totalPages}
                  totalItems={observationsPagination.totalItems}
                  startIndex={observationsPagination.startIndex}
                  endIndex={observationsPagination.endIndex}
                  onPageChange={observationsPagination.setPage}
                  pageSize={observationsPagination.pageSize}
                  onPageSizeChange={observationsPagination.handlePageSizeChange}
                  itemName="observations"
                />
              </>
            ) : (
              <div className="card p-4 text-center text-muted">
                <Eye size={28} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs mb-0">No field observations recorded by {profileUser.name}.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Plans */}
        {activeTab === 'plans' && (
          <div className="d-flex flex-column gap-2">
            {userPlans.length > 0 ? (
              <>
                {plansPagination.paginatedItems.map(p => (
                  <div
                    key={p.id}
                    className="card p-3 card-interactive cursor-pointer"
                    onClick={() => { onClose(); viewPlanDetail(p); }}
                  >
                    <div className="d-flex align-center justify-between mb-1">
                      <span className="font-bold text-sm text-primary">{p.title}</span>
                      <PlanStatusBadge status={p.status} />
                    </div>
                    <p className="text-xs text-secondary mb-2">{p.problemStatement || p.desiredOutcome}</p>
                    <span className="text-xs text-muted">Role: {p.proposer?.id === profileUser.id ? 'Organizer / Proposer' : 'Collaborator'}</span>
                  </div>
                ))}
                <Pagination
                  compact={true}
                  currentPage={plansPagination.currentPage}
                  totalPages={plansPagination.totalPages}
                  totalItems={plansPagination.totalItems}
                  startIndex={plansPagination.startIndex}
                  endIndex={plansPagination.endIndex}
                  onPageChange={plansPagination.setPage}
                  pageSize={plansPagination.pageSize}
                  onPageSizeChange={plansPagination.handlePageSizeChange}
                  itemName="plans"
                />
              </>
            ) : (
              <div className="card p-4 text-center text-muted">
                <Target size={28} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs mb-0">No long-term initiatives or plans linked to {profileUser.name}.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Feed Posts */}
        {activeTab === 'posts' && (
          <div className="d-flex flex-column gap-2">
            {userPosts.length > 0 ? (
              <>
                {postsPagination.paginatedItems.map(p => (
                  <div key={p.id} className="card p-3">
                    <div className="d-flex align-center justify-between mb-1">
                      <span className="text-xs text-muted">{p.timestamp || 'Recent update'}</span>
                      {p.isPinned && <span className="badge badge-amber text-xs">Pinned</span>}
                    </div>
                    <p className="text-xs text-primary mb-1" style={{ lineHeight: '1.5' }}>{p.content}</p>
                  </div>
                ))}
                <Pagination
                  compact={true}
                  currentPage={postsPagination.currentPage}
                  totalPages={postsPagination.totalPages}
                  totalItems={postsPagination.totalItems}
                  startIndex={postsPagination.startIndex}
                  endIndex={postsPagination.endIndex}
                  onPageChange={postsPagination.setPage}
                  pageSize={postsPagination.pageSize}
                  onPageSizeChange={postsPagination.handlePageSizeChange}
                  itemName="posts"
                />
              </>
            ) : (
              <div className="card p-4 text-center text-muted">
                <Share2 size={28} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs mb-0">No community updates posted yet by {profileUser.name}.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
