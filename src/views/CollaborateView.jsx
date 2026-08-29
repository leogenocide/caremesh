import { useState } from 'react';
import { useCareMesh } from '../context/useCareMesh';
import { Tabs } from '../components/common/Tabs';
import { UrgencyBadge, ResourceTypeBadge } from '../components/common/Badge';
import { 
  HandHeart, 
  Package, 
  Sparkles, 
  GitMerge, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  User, 
  Check,
  Calendar,
  AlertCircle,
  Filter
} from 'lucide-react';

export const CollaborateView = () => {
  const {
    currentSubTab,
    setCurrentSubTab,
    highlightedEntityId,
    requests,
    resources,
    matchingFactors,
    currentUser,
    openCreateModal,
    respondToRequest,
    matchResourceToRequest,
    inspectEntity
  } = useCareMesh();

  const [activeTabState, setActiveTabState] = useState('requests');
  const activeTab = currentSubTab || activeTabState;

  const handleTabChange = (tabId) => {
    setActiveTabState(tabId);
    if (setCurrentSubTab) setCurrentSubTab(tabId);
  };

  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const tabs = [
    { id: 'requests', label: 'Help Requests & Needs', icon: <HandHeart size={16} />, count: requests.filter(r => r.status !== 'fulfilled').length },
    { id: 'resources', label: 'Resource Directory', icon: <Package size={16} />, count: resources.length },
    { id: 'matcher', label: 'Transparent Resource Matcher', icon: <GitMerge size={16} /> }
  ];

  const filteredRequests = requests.filter(r => {
    if (urgencyFilter !== 'all' && r.urgency !== urgencyFilter) return false;
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
    return true;
  });

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
              Showing {filteredRequests.length} community help requests
            </span>

            <div className="d-flex gap-2 align-center flex-wrap">
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
                  <option value="labor">Volunteer Labor</option>
                  <option value="supplies">Supplies & Material</option>
                  <option value="transport">Transportation</option>
                  <option value="equipment">Tools & Equipment</option>
                  <option value="skills">Specialized Skills</option>
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

          <div className="grid-2 gap-3">
            {filteredRequests.map(req => {
              const isUserJoined = req.responses?.some(resp => resp.user?.id === currentUser.id);
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
                    {/* Header with Urgency and Date */}
                    <div className="d-flex align-center justify-between mb-2">
                      <div className="d-flex align-center gap-2">
                        <UrgencyBadge urgency={req.urgency} />
                        <span className="badge badge-gray text-xs text-uppercase font-semibold">
                          {req.category}
                        </span>
                      </div>
                      <span className="text-xs text-muted">{req.createdAt}</span>
                    </div>

                    <h4 className="font-bold text-md text-primary mb-2">{req.title}</h4>
                    <p className="text-xs text-secondary mb-3" style={{ lineHeight: '1.45' }}>{req.description}</p>

                    {/* Volunteer Progress Bar */}
                    <div className="mb-3">
                      <div className="d-flex justify-between text-xs text-muted mb-1">
                        <span>Volunteers: <strong>{req.peopleJoined}</strong> of {req.peopleNeeded} needed</span>
                        <span>{req.progressPercentage}%</span>
                      </div>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${req.progressPercentage}%` }} />
                      </div>
                    </div>

                    {/* Required Skills & Resources */}
                    {req.requiredSkills && req.requiredSkills.length > 0 && (
                      <div className="d-flex gap-1 flex-wrap mb-2">
                        <span className="text-xs text-muted">Needed Skills:</span>
                        {req.requiredSkills.map((s, idx) => (
                          <span key={idx} className="badge badge-gray text-xs">{s}</span>
                        ))}
                      </div>
                    )}

                    {/* Inline Quick Contribution Options if Available */}
                    {hasQuickActions && (
                      <div className="card p-3 mb-3" style={{ background: 'var(--amber-50)', border: '1px dashed var(--amber-300)' }}>
                        <span className="font-bold text-xs text-amber d-flex align-center gap-1 mb-2 text-uppercase">
                          <Sparkles size={13} /> Quick Ways to Contribute:
                        </span>
                        <div className="d-flex flex-column gap-2">
                          {req.quickActions.map(qa => (
                            <div 
                              key={qa.id}
                              className="d-flex align-center justify-between gap-2 p-2 rounded"
                              style={{ background: '#ffffff', border: '1px solid var(--amber-200)' }}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="d-flex align-center gap-2 mb-1">
                                  <span className="badge badge-amber text-xs font-semibold d-inline-flex align-center gap-1" style={{ padding: '0.1rem 0.35rem' }}>
                                    <Clock size={11} /> {qa.timeEstimate}
                                  </span>
                                  <span className="text-xs font-bold text-primary text-truncate">{qa.title}</span>
                                </div>
                                <p className="text-xs text-secondary mb-0 text-truncate" style={{ fontSize: '0.75rem' }}>
                                  {qa.neededContribution}
                                </p>
                              </div>

                              <button
                                type="button"
                                className="btn btn-primary btn-xs flex-shrink-0"
                                onClick={() => {
                                  respondToRequest(req.id, `Quick Task: ${qa.title}`);
                                  alert(`Thank you! You signed up for: "${qa.title}". Coordination notice dispatched.`);
                                }}
                              >
                                <CheckCircle2 size={12} />
                                <span>Commit</span>
                              </button>
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
                    <button
                      className={`btn btn-sm flex-1 ${isUserJoined ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => {
                        if (!isUserJoined) {
                          respondToRequest(req.id, 'General Volunteer');
                          alert(`You volunteered for: "${req.title}". Thank you!`);
                        } else {
                          alert('You are already participating in this coordination task.');
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

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => inspectEntity(req, 'request')}
                    >
                      Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: RESOURCES DIRECTORY */}
      {activeTab === 'resources' && (
        <div className="d-flex flex-column gap-3">
          <div className="d-flex align-center justify-between gap-2 flex-wrap">
            <span className="text-xs text-muted">
              Showing {resources.length} community resources & offers
            </span>
          </div>

          <div className="grid-2 gap-3">
            {resources.map(res => (
              <div key={res.id} className="card p-4 card-interactive d-flex flex-column justify-between">
                <div>
                  <div className="d-flex align-center justify-between mb-2">
                    <ResourceTypeBadge type={res.contributionType} />
                    <span className="badge badge-primary text-xs text-uppercase">{res.availability}</span>
                  </div>

                  <h4 className="font-bold text-md text-primary mb-2">{res.title}</h4>
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
                  <button
                    className="btn btn-primary btn-sm flex-1"
                    onClick={() => {
                      alert(`Coordination inquiry dispatched to ${res.provider?.name} for "${res.title}".`);
                    }}
                  >
                    <span>Request Resource Use</span>
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => inspectEntity(res, 'resource')}
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
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
            {matchingFactors.map((match) => {
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
                          alert(`Match coordination opened between "${match.resourceTitle}" and "${match.requestTitle}".`);
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
