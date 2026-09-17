import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCareMesh } from '../context/useCareMesh';
import { PlanStatusBadge } from '../components/common/Badge';
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
  ShieldAlert
} from 'lucide-react';
import { ChangeAvatarModal } from '../components/profile/ChangeAvatarModal';
import { EditBioModal } from '../components/profile/EditBioModal';
import { usePagination } from '../hooks/usePagination';
import { Pagination } from '../components/common/Pagination';

export const ProfileView = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const { 
    currentUser, 
    setCurrentUser, 
    resources, 
    requests, 
    plans, 
    resetToSeedData, 
    viewPlanDetail, 
    viewRequestDetail, 
    viewResourceDetail, 
    openAuthModal, 
    logoutUser,
    mockUsers,
    startDirectMessage,
    openReportModal,
    showToast,
    restrictUser,
    unrestrictUser
  } = useCareMesh();

  const [activeSubTab, setActiveSubTab] = useState('contributions'); // 'contributions' | 'resources' | 'privacy'
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

  // Target user's linked items
  const userResources = resources.filter(res => res.provider?.id === targetUser?.id || res.providerId === targetUser?.id);
  const userRequests = requests.filter(r => r.requester?.id === targetUser?.id || r.authorId === targetUser?.id || r.responses?.some(resp => resp.user?.id === targetUser?.id));
  const userPlans = Array.from(new Map(
    plans.filter(p => p.participants?.some(part => part.user?.id === targetUser?.id) || p.proposer?.id === targetUser?.id)
      .map(p => [p.id, p])
  ).values());

  const plansPagination = usePagination(userPlans, 4);
  const requestsPagination = usePagination(userRequests, 4);
  const resourcesPagination = usePagination(userResources, 4);

  const totalContributions = targetUser.stats?.contributions || (userResources.length + userRequests.length + userPlans.length);
  const requestsFulfilled = targetUser.stats?.requestsFulfilled || 0;

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
              <span className="d-flex align-center gap-1 text-xs text-muted">
                <MapPin size={13} /> {
                  (!isSelf && targetUser.privacySettings?.showExactLocation === false)
                    ? (typeof targetUser.location === 'object' ? (targetUser.location?.neighborhood || 'Maplewood District, CA') : 'Maplewood District, CA')
                    : (typeof targetUser.location === 'object' ? (targetUser.location?.address || targetUser.location?.neighborhood || 'Maplewood, CA') : (targetUser.location || 'Maplewood, CA'))
                }
              </span>
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
          <div className="stats-grid gap-2 p-3 card" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
            <div className="text-center">
              <span className="font-bold text-lg text-primary d-block">{totalContributions}</span>
              <span className="text-xs text-muted">Total Contributions</span>
            </div>
            <div className="text-center">
              <span className="font-bold text-lg text-brand d-block">{requestsFulfilled}</span>
              <span className="text-xs text-muted">Requests Fulfilled</span>
            </div>
            <div className="text-center">
              <span className="font-bold text-lg text-amber d-block">{userResources.length}</span>
              <span className="text-xs text-muted">Resources Shared</span>
            </div>
            <div className="text-center">
              <span className="font-bold text-lg text-purple d-block">{userPlans.length}</span>
              <span className="text-xs text-muted">Plans Joined</span>
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
          {/* Sub-tab Switcher */}
          <div className="touch-scroll-x gap-2.5 border-bottom pb-3 mb-2">
        <button
          className={`btn btn-sm ${activeSubTab === 'contributions' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ whiteSpace: 'nowrap' }}
          onClick={() => setActiveSubTab('contributions')}
        >
          <HandHeart size={14} />
          <span>Active Plans & Needs ({userPlans.length + userRequests.length})</span>
        </button>
        <button
          className={`btn btn-sm ${activeSubTab === 'resources' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ whiteSpace: 'nowrap' }}
          onClick={() => setActiveSubTab('resources')}
        >
          <Package size={14} />
          <span>Shared Resources ({userResources.length})</span>
        </button>
        {isSelf && (
          <button
            className={`btn btn-sm ${activeSubTab === 'privacy' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => setActiveSubTab('privacy')}
          >
            <Lock size={14} />
            <span>Privacy & Prototype Settings</span>
          </button>
        )}
      </div>

      {/* TAB 1: CONTRIBUTIONS & PLANS */}
      {activeSubTab === 'contributions' && (
        <div className="d-flex flex-column gap-3">
          <h4 className="font-bold text-sm text-primary">Participating Long-term Plans</h4>
          <div className="d-flex flex-column gap-2">
            {userPlans.length === 0 ? (
              <div className="card p-3 text-center text-xs text-muted" style={{ background: 'var(--bg-subtle)' }}>
                {isSelf 
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
                      className="card p-3 card-interactive cursor-pointer d-flex align-center justify-between"
                      onClick={() => viewPlanDetail(plan)}
                    >
                      <div>
                        <h5 className="font-bold text-sm text-primary mb-1">{plan.title}</h5>
                        <span className="text-xs text-muted">
                          {completedCount} of {totalCount} Milestones Completed · {plan.problemStatement}
                        </span>
                      </div>
                      <PlanStatusBadge status={plan.overallStatus || 'in_progress'} />
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

          <h4 className="font-bold text-sm text-primary mt-3">Help Requests & Volunteer Needs</h4>
          <div className="d-flex flex-column gap-2">
            {userRequests.length === 0 ? (
              <div className="card p-3 text-center text-xs text-muted" style={{ background: 'var(--bg-subtle)' }}>
                {isSelf 
                  ? 'No active help requests posted.' 
                  : `${targetUser.name} has no open help requests.`}
              </div>
            ) : (
              <>
                {requestsPagination.paginatedItems.map(req => (
                  <div 
                    key={req.id} 
                    className="card p-3 card-interactive cursor-pointer d-flex align-center justify-between"
                    onClick={() => viewRequestDetail(req)}
                  >
                    <div>
                      <h5 className="font-bold text-sm text-primary mb-1">{req.title}</h5>
                      <span className="text-xs text-muted">{req.location?.address} • {req.status} • {req.peopleJoined || 0}/{req.peopleNeeded || 1} volunteers</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        viewRequestDetail(req);
                      }}
                    >
                      View Details
                    </button>
                  </div>
                ))}
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
        </div>
      )}

      {/* TAB 2: MY RESOURCES */}
      {activeSubTab === 'resources' && (
        <div className="d-flex flex-column gap-3">
          {userResources.length === 0 ? (
            <div className="card p-3 text-center text-xs text-muted" style={{ background: 'var(--bg-subtle)' }}>
              {isSelf 
                ? 'You have not shared any resources yet.' 
                : `${targetUser.name} has not listed any shared equipment or resources yet.`}
            </div>
          ) : (
            <>
              {resourcesPagination.paginatedItems.map(res => (
                <div 
                  key={res.id} 
                  className="card p-4 card-interactive cursor-pointer d-flex flex-column justify-between"
                  onClick={() => viewResourceDetail(res)}
                >
                  <div>
                    <div className="d-flex align-center justify-between mb-2">
                      <span className="badge badge-primary text-xs">{res.contributionType}</span>
                      <span className="text-xs text-muted">{res.availability}</span>
                    </div>
                    <h4 className="font-bold text-sm text-primary mb-1">{res.title}</h4>
                    <p className="text-xs text-secondary mb-2">{res.description}</p>
                    <div className="text-xs text-muted mb-3">
                      <strong>Capacity:</strong> {res.quantity} • <strong>Terms:</strong> {res.conditionsTerms}
                    </div>
                  </div>
                  <div className="d-flex justify-end pt-2 border-top">
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
