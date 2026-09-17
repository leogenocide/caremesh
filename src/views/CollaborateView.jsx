import { useState, useEffect, useMemo } from 'react';
import { useCareMesh } from '../context/useCareMesh';
import { Tabs } from '../components/common/Tabs';
import { UrgencyBadge, ResourceTypeBadge, RequestStatusBadge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { usePagination } from '../hooks/usePagination';
import { EmptyState } from '../components/common/EmptyState';
import { 
  HandHeart, 
  Package, 
  GitMerge, 
  MapPin, 
  CheckCircle2, 
  User, 
  Check,
  Calendar,
  AlertCircle,
  Filter,
  Lock,
  Globe,
  Plus,
  Users
} from 'lucide-react';

const STANDARD_REQUEST_CATEGORIES = [
  { value: 'labor', label: 'Volunteer Labor' },
  { value: 'supplies', label: 'Supplies & Material' },
  { value: 'transport', label: 'Transportation' },
  { value: 'equipment', label: 'Tools & Equipment' },
  { value: 'skills', label: 'Specialized Skills' }
];

export const CollaborateView = () => {
  const {
    currentSubTab,
    setCurrentSubTab,
    highlightedEntityId,
    requests,
    resources,
    communities,
    matchingFactors,
    currentUser,
    openCreateModal,
    respondToRequest,
    matchResourceToRequest,
    viewRequestDetail,
    viewResourceDetail,
    openRequestResourceModal,
    isRequestVisibleToUser,
    showToast
  } = useCareMesh();

  const [activeTabState, setActiveTabState] = useState('requests');
  const activeTab = currentSubTab || activeTabState;


  const handleTabChange = (tabId) => {
    setActiveTabState(tabId);
    if (setCurrentSubTab) setCurrentSubTab(tabId);
  };

  const [statusFilter, setStatusFilter] = useState('active'); // 'all' | 'active' | 'open' | 'partially_fulfilled' | 'fulfilled'
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const visibleRequests = requests.filter(r => 
    isRequestVisibleToUser ? isRequestVisibleToUser(r, currentUser) : (r.visibility !== 'group_only')
  );

  const customCategories = useMemo(() => {
    const stdValues = new Set(STANDARD_REQUEST_CATEGORIES.map(c => c.value));
    const customSet = new Set();
    visibleRequests.forEach(r => {
      if (r.category && !stdValues.has(r.category)) {
        customSet.add(r.category);
      }
    });
    return Array.from(customSet).sort();
  }, [visibleRequests]);

  const activeNeedsCount = visibleRequests.filter(r => r.status !== 'fulfilled').length;

  const tabs = [
    { id: 'requests', label: 'Help Requests & Needs', icon: <HandHeart size={16} />, count: activeNeedsCount },
    { id: 'resources', label: 'Resource Directory', icon: <Package size={16} />, count: resources.length },
    { id: 'matcher', label: 'Transparent Resource Matcher', icon: <GitMerge size={16} /> }
  ];

  const filteredRequests = visibleRequests.filter(r => {
    if (statusFilter === 'active' && r.status === 'fulfilled') return false;
    if (statusFilter !== 'all' && statusFilter !== 'active' && r.status !== statusFilter) return false;
    if (urgencyFilter !== 'all' && r.urgency !== urgencyFilter) return false;
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
    return true;
  });

  const requestsPagination = usePagination(filteredRequests, 6);
  const resourcesPagination = usePagination(resources, 6);

  // Reset page when any filter changes
  useEffect(() => {
    requestsPagination.resetPage();
  }, [statusFilter, urgencyFilter, categoryFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header & Main Call to Actions */}
      <div className="d-flex align-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-primary">Collaborate & Mutual Aid Hub</h2>
          <p className="text-xs text-muted">
            Connecting real-world community needs with direct volunteer responses, community-provided resources, and transparent matching.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => openCreateModal('resource')}
          >
            <Package size={15} />
            <span>Offer Resource / Skill</span>
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => openCreateModal('request')}
          >
            <HandHeart size={15} />
            <span>Request Assistance</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleTabChange}
      />

      {/* TAB 1: HELP REQUESTS & DIRECT CONTRIBUTIONS */}
      {activeTab === 'requests' && (
        <div className="d-flex flex-column gap-3">
          {/* Controls & Filter Bar */}
          <div className="d-flex align-center justify-between gap-2 flex-wrap">
            <span className="text-xs text-muted">
              Showing {filteredRequests.length} of {requests.length} community help requests
              {statusFilter === 'active' && ` (${activeNeedsCount} active needs)`}
            </span>

            <div className="d-flex gap-2 align-center flex-wrap">
              <div className="d-flex align-center gap-1">
                <span className="text-xs text-muted">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-select"
                  style={{ width: 'auto', padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                >
                  <option value="active">Active Needs Only ({activeNeedsCount})</option>
                  <option value="all">All Requests ({requests.length})</option>
                  <option value="open">Open</option>
                  <option value="partially_fulfilled">In Progress</option>
                  <option value="fulfilled">Fulfilled</option>
                </select>
              </div>

              <div className="d-flex align-center gap-1">
                <Filter size={13} className="text-muted" />
                <span className="text-xs text-muted">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="form-select"
                  style={{ width: 'auto', padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                >
                  <option value="all">All Categories</option>
                  <optgroup label="Standard Categories">
                    {STANDARD_REQUEST_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </optgroup>
                  {customCategories.length > 0 && (
                    <optgroup label="Custom Categories">
                      {customCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div className="d-flex align-center gap-1">
                <span className="text-xs text-muted">Urgency:</span>
                <select
                  value={urgencyFilter}
                  onChange={(e) => setUrgencyFilter(e.target.value)}
                  className="form-select"
                  style={{ width: 'auto', padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                >
                  <option value="all">All Urgencies</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {requestsPagination.paginatedItems.length === 0 ? (
            <EmptyState
              icon={<HandHeart size={36} className="text-muted" />}
              title="No Help Requests Found"
              description={categoryFilter !== 'all' || urgencyFilter !== 'all' ? "No requests match your current filters. Try changing or clearing your category or urgency filter." : "There are currently no active help requests in this community area."}
              action={(
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm" 
                  onClick={() => openCreateModal('request')}
                >
                  <Plus size={14} />
                  <span>Post a Help Request</span>
                </button>
              )}
            />
          ) : (
            <div className="grid-2 gap-3">
              {requestsPagination.paginatedItems.map(req => {
                const isOwner = req.requester?.id === currentUser?.id || req.requester_id === currentUser?.id;
                const isUserJoined = req.responses?.some(resp => resp.user?.id === currentUser?.id);
                const hasQuickActions = req.quickActions && req.quickActions.length > 0;

                return (
                  <div 
                    key={req.id} 
                    className="card p-4 card-interactive d-flex flex-column justify-between"
                    style={{
                      border: req.id === highlightedEntityId ? '2px solid var(--primary-500)' : '1px solid var(--border-light)'
                    }}
                  >
                    <div>
                      {/* Header with Urgency, Status and Date */}
                      <div className="d-flex align-center justify-between mb-2">
                        <div className="d-flex align-center gap-2 flex-wrap">
                          <UrgencyBadge urgency={req.urgency} />
                          <RequestStatusBadge status={req.status} />
                          <span className="badge badge-gray text-xs text-uppercase font-semibold">
                            {req.category}
                          </span>
                          {req.communityId && (() => {
                            const comm = communities?.find(c => c.id === req.communityId);
                            return (
                              <span 
                                className={`badge text-xs d-inline-flex align-center gap-1 ${req.visibility === 'group_only' ? 'badge-primary' : 'badge-gray'}`}
                                style={req.visibility === 'group_only' ? { backgroundColor: 'var(--primary-50)', color: 'var(--primary-700)', borderColor: 'var(--primary-200)' } : {}}
                                title={req.visibility === 'group_only' ? `Visible only to members of ${comm?.name || 'Group'}` : `Linked to ${comm?.name || 'Group'}`}
                              >
                                {req.visibility === 'group_only' ? <Lock size={10} /> : <Globe size={10} />}
                                {comm ? comm.name : 'Community'}
                              </span>
                            );
                          })()}
                        </div>
                        <span className="text-xs text-muted">{req.createdAt}</span>
                      </div>

                      <h4 
                        className="font-bold text-md text-primary mb-2 cursor-pointer hover:text-brand" 
                        onClick={() => viewRequestDetail(req)}
                        title="Click to view full request details"
                      >
                        {req.title}
                      </h4>
                      <p className="text-xs text-secondary mb-3" style={{ lineHeight: '1.45' }}>{req.description}</p>

                      {/* Micro-Contributions & Quick Roles */}
                      {hasQuickActions && (
                        <div className="card p-2.5 mb-3" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-light)' }}>
                          <span className="text-xs font-bold text-muted text-uppercase d-block mb-1.5">
                            Micro-Contributions & Sub-Tasks ({req.quickActions.length})
                          </span>
                          <div className="d-flex flex-column gap-1.5">
                            {req.quickActions.map(qa => (
                              <div key={qa.id} className="d-flex align-center justify-between gap-2 p-1.5 rounded" style={{ background: '#ffffff' }}>
                                <div>
                                  <span className="font-semibold text-xs text-primary">{qa.title}</span>
                                  <p className="text-xs text-muted mb-0" style={{ fontSize: '0.725rem' }}>
                                    {qa.timeCommitment} • {qa.slotsRemaining} of {qa.slots} spots remaining
                                  </p>
                                </div>

                                {!isOwner && (
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-xs flex-shrink-0"
                                    onClick={() => {
                                      respondToRequest(req.id, `Quick Task: ${qa.title}`);
                                      showToast(`Thank you! You signed up for: "${qa.title}". Coordination notice dispatched.`, 'success');
                                    }}
                                  >
                                    <CheckCircle2 size={12} />
                                    <span>Commit</span>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Metadata footer */}
                      <div className="d-flex align-center gap-3 text-xs text-muted mb-2 flex-wrap">
                        <span className="d-flex align-center gap-1"><MapPin size={12} /> {req.location?.address}</span>
                        <span className="d-flex align-center gap-1"><Calendar size={12} /> {req.expiresAt}</span>
                        <span className="d-flex align-center gap-1"><User size={12} /> By {req.requester?.name}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex gap-2 pt-3 border-top">
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
                          className={`btn btn-sm flex-1 ${isUserJoined ? 'btn-secondary' : 'btn-primary'}`}
                          onClick={() => {
                            if (!isUserJoined) {
                              respondToRequest(req.id, 'General Volunteer');
                              showToast(`You volunteered for: "${req.title}". Thank you!`, 'success');
                            } else {
                              showToast('You are already participating in this coordination task.', 'info');
                            }
                          }}
                        >
                          {isUserJoined ? (
                            <>
                              <Check size={14} className="text-brand" />
                              <span>You are Participating</span>
                            </>
                          ) : (
                            <>
                              <HandHeart size={14} />
                              <span>Volunteer / Respond</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => viewRequestDetail(req)}
                      >
                        Request Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Requests Pagination */}
          {requestsPagination.totalPages > 1 && (
            <Pagination
              currentPage={requestsPagination.currentPage}
              totalPages={requestsPagination.totalPages}
              totalItems={requestsPagination.totalItems}
              startIndex={requestsPagination.startIndex}
              endIndex={requestsPagination.endIndex}
              onPageChange={requestsPagination.setPage}
              pageSize={requestsPagination.pageSize}
              onPageSizeChange={requestsPagination.setPageSize}
              pageSizeOptions={[4, 6, 12, 24]}
              itemName="requests"
            />
          )}
        </div>
      )}

      {/* TAB 2: RESOURCES DIRECTORY */}
      {activeTab === 'resources' && (
        <div className="d-flex flex-column gap-3">
          <div className="d-flex align-center justify-between gap-2 flex-wrap">
            <span className="text-xs text-muted">
              Showing <b>{resourcesPagination.totalItems > 0 ? `${resourcesPagination.startIndex}–${resourcesPagination.endIndex}` : '0'}</b> of <b>{resourcesPagination.totalItems}</b> community resources & offers
            </span>
          </div>

          {resourcesPagination.paginatedItems.length === 0 ? (
            <EmptyState
              icon={<Package size={36} className="text-muted" />}
              title="No Resources Listed"
              description="There are currently no community tools, supplies, or mutual aid offers listed in this area."
              action={(
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm" 
                  onClick={() => openCreateModal('resource')}
                >
                  <Plus size={14} />
                  <span>Offer a Resource</span>
                </button>
              )}
            />
          ) : (
            <div className="grid-2 gap-3">
              {resourcesPagination.paginatedItems.map(res => {
                const isProvider = res.provider?.id === currentUser?.id || res.provider_id === currentUser?.id;

                return (
                  <div key={res.id} className="card p-4 card-interactive d-flex flex-column justify-between">
                    <div>
                      <div className="d-flex align-center justify-between mb-2">
                        <ResourceTypeBadge type={res.contributionType} />
                        {res.loanStatus === 'on_loan' ? (
                          <span className="badge badge-amber text-xs font-semibold">
                            On Loan (Due {res.activeLoan?.dueDate || 'Soon'})
                          </span>
                        ) : res.loanStatus === 'pending_approval' ? (
                          <span className="badge badge-purple text-xs font-semibold">
                            Pending Request
                          </span>
                        ) : (
                          <span className="badge badge-emerald text-xs font-semibold">
                            Available
                          </span>
                        )}
                      </div>

                      <h4 
                        className="font-bold text-md text-primary mb-2 cursor-pointer hover:text-brand"
                        onClick={() => viewResourceDetail(res)}
                        title="Click to view full resource details"
                      >
                        {res.title}
                      </h4>
                      <p className="text-xs text-secondary mb-3" style={{ lineHeight: '1.45' }}>{res.description}</p>

                      <div className="card p-2 mb-3 text-xs" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-light)' }}>
                        <div className="d-flex justify-between mb-1">
                          <span className="text-muted">Quantity / Capacity:</span>
                          <span className="font-semibold text-primary">{res.quantity}</span>
                        </div>
                        <div className="d-flex justify-between mb-1">
                          <span className="text-muted">Condition:</span>
                          <span className="font-semibold text-primary">{res.condition}</span>
                        </div>
                        <div className="d-flex justify-between">
                          <span className="text-muted">Terms / Access:</span>
                          <span className="text-primary">{res.conditionsTerms}</span>
                        </div>
                      </div>

                      <div className="d-flex align-center gap-3 text-xs text-muted mb-2">
                        <span className="d-flex align-center gap-1"><MapPin size={12} /> {res.location?.address}</span>
                        <span className="d-flex align-center gap-1"><User size={12} /> Provider: {res.provider?.name}</span>
                      </div>
                    </div>

                    <div className="d-flex gap-2 pt-3 border-top">
                      {isProvider ? (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm flex-1 d-flex align-center justify-center gap-1.5"
                          onClick={() => viewResourceDetail(res)}
                          title="Manage your offered resource"
                        >
                          <Package size={14} className="text-brand" />
                          <span>Your Resource (Manage)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm flex-1"
                          onClick={() => openRequestResourceModal(res)}
                        >
                          <span>Request Resource Use</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => viewResourceDetail(res)}
                      >
                        Resource Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Resources Pagination */}
          {resourcesPagination.totalPages > 1 && (
            <Pagination
              currentPage={resourcesPagination.currentPage}
              totalPages={resourcesPagination.totalPages}
              totalItems={resourcesPagination.totalItems}
              startIndex={resourcesPagination.startIndex}
              endIndex={resourcesPagination.endIndex}
              onPageChange={resourcesPagination.setPage}
              pageSize={resourcesPagination.pageSize}
              onPageSizeChange={resourcesPagination.setPageSize}
              pageSizeOptions={[4, 6, 12, 24]}
              itemName="resources"
            />
          )}
        </div>
      )}

      {/* TAB 3: TRANSPARENT RESOURCE MATCHER */}
      {activeTab === 'matcher' && (
        <div className="d-flex flex-column gap-3">
          <div className="card p-3" style={{ background: 'var(--blue-50)', border: '1px solid var(--blue-100)' }}>
            <div className="d-flex align-center gap-2">
              <GitMerge size={20} className="text-blue-600" />
              <div>
                <h4 className="font-bold text-sm text-primary">Transparent Need ↔ Resource Compatibility</h4>
                <p className="text-xs text-secondary mb-0">
                  CareMesh uses understandable, factor-by-factor compatibility checks (proximity, capacity, mode, schedule) rather than unexplained scores.
                </p>
              </div>
            </div>
          </div>

          <div className="d-flex flex-column gap-4">
            {matchingFactors
              .filter(match => {
                const req = requests.find(r => r.id === match.requestId);
                if (!req) return true;
                return isRequestVisibleToUser ? isRequestVisibleToUser(req, currentUser) : (req.visibility !== 'group_only');
              })
              .map((match) => {
                const req = requests.find(r => r.id === match.requestId);
                const res = resources.find(r => r.id === match.resourceId);

              return (
                <div key={match.id} className="card p-4" style={{ background: '#ffffff', border: '1px solid var(--border-default)' }}>
                  <div className="d-flex align-center justify-between mb-3 pb-2 border-bottom flex-wrap gap-2">
                    <div className="d-flex align-center gap-2">
                      <span className="badge badge-primary text-xs font-bold">{match.status}</span>
                      <span className="text-xs text-muted">Transparent Compatibility Factors</span>
                    </div>
                    <span className="text-xs text-muted">Direct Neighbor Peer Match</span>
                  </div>

                  <div className="grid-2 gap-4 align-center mb-3">
                    {/* Left: Need / Request */}
                    <div className="card p-3" style={{ background: 'var(--amber-50)', border: '1px solid var(--amber-200)' }}>
                      <span className="text-xs font-bold text-amber text-uppercase d-block mb-1">
                        COMMUNITY NEED (REQUEST)
                      </span>
                      <h5 className="font-bold text-sm text-primary mb-1">{req?.title || match.requestTitle}</h5>
                      <p className="text-xs text-secondary mb-2">{req?.description}</p>
                      <span className="text-xs text-muted d-flex align-center gap-1">
                        <MapPin size={11} /> {req?.location?.address}
                      </span>
                    </div>

                    {/* Right: Available Offer */}
                    <div className="card p-3" style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-200)' }}>
                      <span className="text-xs font-bold text-brand text-uppercase d-block mb-1">
                        OFFERED RESOURCE / SKILL
                      </span>
                      <h5 className="font-bold text-sm text-primary mb-1">{res?.title || match.resourceTitle}</h5>
                      <p className="text-xs text-secondary mb-2">{res?.description}</p>
                      <span className="text-xs text-muted d-flex align-center gap-1">
                        <User size={11} /> {res?.provider?.name}
                      </span>
                    </div>
                  </div>

                  {/* Compatibility Factors List */}
                  <div className="card p-3 rounded" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
                    <span className="text-xs font-bold text-secondary text-uppercase d-block mb-2">
                      Matching Factor Breakdown:
                    </span>
                    <div className="d-flex flex-column gap-2">
                      {match.factors?.map((f, fIdx) => (
                        <div key={fIdx} className="d-flex align-center gap-2 text-xs">
                          {f.status === 'pass' ? (
                            <Check size={14} className="text-brand font-bold" />
                          ) : (
                            <AlertCircle size={14} className="text-amber font-bold" />
                          )}
                          <span className="font-semibold text-primary">{f.label}:</span>
                          <span className="text-secondary">{f.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="d-flex align-center justify-end gap-2 mt-3 pt-2 border-top">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        if (match.resourceId && match.requestId) {
                          matchResourceToRequest(match.resourceId, match.requestId);
                          showToast(`Match coordination opened between "${match.resourceTitle}" and "${match.requestTitle}".`, 'success');
                        }
                      }}
                    >
                      <GitMerge size={14} />
                      <span>Initiate Match Coordination</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
