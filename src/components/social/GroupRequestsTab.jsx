import { useState } from 'react';
import { useCareMesh } from '../../context/useCareMesh';
import { Modal } from '../common/Modal';
import { UrgencyBadge } from '../common/Badge';
import { 
  HandHeart, 
  Plus, 
  Link2, 
  Lock, 
  Globe, 
  MapPin, 
  Users, 
  Check, 
  Unlink, 
  Search,
  Filter
} from 'lucide-react';

export const GroupRequestsTab = ({ community }) => {
  const { 
    requests, 
    currentUser, 
    respondToRequest, 
    viewRequestDetail, 
    openCreateModal,
    linkRequestToCommunity,
    unlinkRequestFromCommunity 
  } = useCareMesh();

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'open' | 'group_only'
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [searchLinkQuery, setSearchLinkQuery] = useState('');

  if (!community) return null;

  const isJoined = Boolean(community.isJoined || community.memberIds?.includes(currentUser?.id));
  const isAdmin = Boolean(community.adminIds?.includes(currentUser?.id) || community.moderatorIds?.includes(currentUser?.id) || currentUser?.isAdmin);
  const canManage = isJoined || isAdmin;

  // Requests associated with this community
  const groupRequests = requests.filter(r => 
    community.linkedRequestIds?.includes(r.id) || r.communityId === community.id
  );

  // Filter based on visibility permissions
  const visibleRequests = groupRequests.filter(r => {
    if (r.visibility === 'group_only' && !isJoined && !isAdmin && r.requester?.id !== currentUser?.id) {
      return false;
    }
    return true;
  });

  // Filtered by sub-tab pill
  const filteredRequests = visibleRequests.filter(r => {
    if (activeFilter === 'open') return r.status !== 'fulfilled';
    if (activeFilter === 'group_only') return r.visibility === 'group_only';
    return true;
  });

  // Candidates for linking (unlinked requests)
  const unlinkedRequests = requests.filter(r => 
    !community.linkedRequestIds?.includes(r.id) && r.communityId !== community.id
  ).filter(r => {
    if (!searchLinkQuery.trim()) return true;
    const q = searchLinkQuery.toLowerCase();
    return r.title.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q) || r.category?.toLowerCase().includes(q);
  });

  const groupOnlyCount = visibleRequests.filter(r => r.visibility === 'group_only').length;
  const openCount = visibleRequests.filter(r => r.status !== 'fulfilled').length;

  return (
    <div className="d-flex flex-column gap-4">
      {/* 1. Header & Actions */}
      <div className="d-flex align-center justify-between gap-3 flex-wrap">
        <div>
          <div className="d-flex align-center gap-2">
            <h3 className="text-md font-bold text-primary mb-0">Community Help Requests & Mutual Aid</h3>
            <span className="badge badge-primary text-xs font-bold">{visibleRequests.length}</span>
          </div>
          <p className="text-xs text-muted mb-0">
            Mutual aid tasks, volunteer coordination, and emergency requests linked to {community.name}.
          </p>
        </div>

        <div className="d-flex align-center gap-2 flex-wrap">
          {canManage && (
            <button
              type="button"
              className="btn btn-secondary btn-sm d-flex align-center gap-1.5"
              onClick={() => setIsLinkModalOpen(true)}
              title="Associate an existing community request with this group"
            >
              <Link2 size={14} />
              <span>Link Existing Request</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-center gap-1.5"
            onClick={() => openCreateModal('request', { communityId: community.id, visibility: 'group_only' })}
          >
            <Plus size={15} />
            <span>Request Help for Group</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Pills Bar */}
      {visibleRequests.length > 0 && (
        <div className="d-flex align-center justify-between gap-2 flex-wrap pb-1 border-bottom">
          <div className="d-flex align-center gap-2">
            <Filter size={13} className="text-muted" />
            <div className="d-flex gap-1.5">
              <button
                type="button"
                className={`btn btn-xs ${activeFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveFilter('all')}
              >
                All Requests ({visibleRequests.length})
              </button>
              <button
                type="button"
                className={`btn btn-xs ${activeFilter === 'open' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveFilter('open')}
              >
                Open Needs ({openCount})
              </button>
              {isJoined && groupOnlyCount > 0 && (
                <button
                  type="button"
                  className={`btn btn-xs ${activeFilter === 'group_only' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setActiveFilter('group_only')}
                >
                  <Lock size={11} className="mr-1" />
                  Group Only ({groupOnlyCount})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Requests Grid */}
      {filteredRequests.length > 0 ? (
        <div className="grid-2 gap-3">
          {filteredRequests.map(req => {
            const isOwner = req.requester?.id === currentUser?.id || req.requester_id === currentUser?.id;
            const isUserJoined = req.responses?.some(resp => resp.user?.id === currentUser?.id);
            const isGroupOnly = req.visibility === 'group_only';

            return (
              <div 
                key={req.id} 
                className="card p-4 d-flex flex-column justify-between card-interactive"
                style={{
                  border: isGroupOnly ? '1px solid var(--purple-200, #e9d5ff)' : '1px solid var(--border-default)',
                  background: isGroupOnly ? 'linear-gradient(180deg, #faf5ff 0%, #ffffff 100%)' : '#ffffff'
                }}
              >
                <div>
                  {/* Card Header Ribbons */}
                  <div className="d-flex align-center justify-between mb-2 flex-wrap gap-1.5">
                    <div className="d-flex align-center gap-1.5 flex-wrap">
                      <UrgencyBadge urgency={req.urgency} />
                      <span className="badge badge-gray text-xs text-uppercase font-semibold">
                        {req.category}
                      </span>
                    </div>

                    {isGroupOnly ? (
                      <span 
                        className="badge text-xs font-bold d-inline-flex align-center gap-1"
                        style={{ background: '#f3e8ff', color: '#7e22ce', border: '1px solid #d8b4fe' }}
                        title="This request is strictly visible only to members of this group"
                      >
                        <Lock size={11} />
                        <span>Visible Only to Group</span>
                      </span>
                    ) : (
                      <span 
                        className="badge badge-secondary text-xs d-inline-flex align-center gap-1"
                        title="This request is public across all Maplewood feeds"
                      >
                        <Globe size={11} />
                        <span>Public Request</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h4 
                    className="font-bold text-md text-primary mb-1 cursor-pointer hover:text-brand"
                    onClick={() => viewRequestDetail(req)}
                  >
                    {req.title}
                  </h4>
                  <p className="text-xs text-secondary mb-3" style={{ lineHeight: '1.45' }}>
                    {req.description}
                  </p>

                  {/* Location & Time */}
                  <div className="d-flex align-center gap-2 text-xs text-muted mb-3 flex-wrap">
                    <span className="d-flex align-center gap-1">
                      <MapPin size={13} className="text-primary" /> {req.location?.address || 'Maplewood Corridor'}
                    </span>
                    {req.expiresAt && (
                      <span>• Due {req.expiresAt}</span>
                    )}
                  </div>

                  {/* Volunteer Headcount & Progress */}
                  <div className="mb-3">
                    <div className="d-flex justify-between text-xs text-muted mb-1">
                      <span className="d-flex align-center gap-1">
                        <Users size={12} />
                        <span>Volunteers: <strong>{req.peopleJoined || 0}</strong> / {req.peopleNeeded || 1} needed</span>
                      </span>
                      <span className="font-semibold text-primary">{req.progressPercentage || 0}%</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${req.progressPercentage || 0}%` }} />
                    </div>
                  </div>

                  {/* Skills required tags */}
                  {req.requiredSkills && req.requiredSkills.length > 0 && (
                    <div className="d-flex align-center gap-1 flex-wrap mb-3">
                      {req.requiredSkills.slice(0, 3).map((skill, sIdx) => (
                        <span key={sIdx} className="badge badge-gray text-xs" style={{ fontSize: '0.68rem' }}>
                          {skill}
                        </span>
                      ))}
                      {req.requiredSkills.length > 3 && (
                        <span className="text-xs text-muted">+{req.requiredSkills.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="d-flex align-center justify-between pt-3 border-top gap-2">
                  <div className="d-flex align-center gap-2 flex-1">
                    {isOwner ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary flex-1 d-flex align-center justify-center gap-1.5"
                        onClick={() => viewRequestDetail(req)}
                        title="Manage your help request"
                      >
                        <Users size={14} className="text-brand" />
                        <span>Your Request (Manage)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={`btn btn-sm flex-1 ${isUserJoined ? 'btn-secondary' : 'btn-primary'} d-flex align-center justify-center gap-1.5`}
                        onClick={() => {
                          if (!isUserJoined) {
                            respondToRequest(req.id, 'Group Volunteer Support');
                            alert(`Thank you! You signed up to help with: "${req.title}".`);
                          }
                        }}
                      >
                        {isUserJoined ? (
                          <>
                            <Check size={14} className="text-brand font-bold" />
                            <span>Joined / Helping</span>
                          </>
                        ) : (
                          <>
                            <HandHeart size={14} />
                            <span>Volunteer / Help</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => viewRequestDetail(req)}
                    >
                      <span>Details</span>
                    </button>
                  </div>

                  {canManage && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs text-muted hover:text-danger p-1"
                      onClick={() => {
                        if (window.confirm(`Unlink "${req.title}" from ${community.name}? The request itself will remain intact.`)) {
                          unlinkRequestFromCommunity(req.id, community.id);
                        }
                      }}
                      title="Unlink request from this community group"
                    >
                      <Unlink size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="card p-5 text-center text-muted" style={{ background: 'var(--bg-subtle)' }}>
          <HandHeart size={38} className="mx-auto mb-2 text-brand opacity-60" />
          <h4 className="font-bold text-sm text-primary mb-1">No Help Requests Linked to this Group Yet</h4>
          <p className="text-xs text-secondary mb-3" style={{ maxWidth: '440px', margin: '0 auto 1rem auto' }}>
            Coordinate volunteer labor, supplies, or emergency assistance. You can create a request visible only to group members or link existing community requests.
          </p>
          <div className="d-flex align-center justify-center gap-2 flex-wrap">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => openCreateModal('request', { communityId: community.id, visibility: 'group_only' })}
            >
              <Plus size={14} />
              <span>Create Group-Only Request</span>
            </button>
            {canManage && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsLinkModalOpen(true)}
              >
                <Link2 size={14} />
                <span>Link Existing Request</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. Link Existing Request Modal */}
      {isLinkModalOpen && (
        <Modal
          isOpen={isLinkModalOpen}
          onClose={() => {
            setIsLinkModalOpen(false);
            setSearchLinkQuery('');
          }}
          title={`Link Existing Request to ${community.name}`}
          subtitle="Select any open or community mutual aid request to associate it with this group's coordination hub."
          maxWidth="600px"
        >
          <div className="d-flex flex-column gap-3">
            <div className="d-flex align-center gap-2 px-3 py-2 border rounded" style={{ background: '#ffffff' }}>
              <Search size={15} className="text-muted" />
              <input
                type="text"
                className="w-100 border-0 outline-none text-sm"
                placeholder="Search open requests by title, category, or skills..."
                value={searchLinkQuery}
                onChange={(e) => setSearchLinkQuery(e.target.value)}
                style={{ background: 'transparent' }}
              />
            </div>

            <div className="d-flex flex-column gap-2" style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {unlinkedRequests.length > 0 ? (
                unlinkedRequests.map(cand => (
                  <div 
                    key={cand.id}
                    className="p-3 border rounded d-flex align-center justify-between gap-3 bg-white hover:bg-subtle transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="d-flex align-center gap-2 mb-1 flex-wrap">
                        <UrgencyBadge urgency={cand.urgency} />
                        <span className="badge badge-gray text-xs text-uppercase font-semibold">
                          {cand.category}
                        </span>
                        {cand.location?.address && (
                          <span className="text-xs text-muted d-flex align-center gap-1">
                            <MapPin size={11} /> {cand.location.address}
                          </span>
                        )}
                      </div>
                      <h5 className="font-bold text-sm text-primary mb-0.5 truncate">{cand.title}</h5>
                      <p className="text-xs text-secondary mb-0 line-clamp-1">{cand.description}</p>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary btn-sm flex-shrink-0 d-flex align-center gap-1"
                      onClick={() => {
                        linkRequestToCommunity(cand.id, community.id);
                        setIsLinkModalOpen(false);
                        setSearchLinkQuery('');
                      }}
                    >
                      <Link2 size={13} />
                      <span>Link</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted">
                  <p className="text-xs mb-0">No unlinked requests found matching your search.</p>
                </div>
              )}
            </div>

            <div className="d-flex justify-end pt-2 border-top">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setIsLinkModalOpen(false);
                  setSearchLinkQuery('');
                }}
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
