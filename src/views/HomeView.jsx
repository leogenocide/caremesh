import { useCareMesh } from '../context/useCareMesh';
import { UrgencyBadge, SeverityBadge, LifecycleBadge, PlanStatusBadge } from '../components/common/Badge';
import { 
  HandHeart, 
  Package, 
  Calendar, 
  Target, 
  ShieldAlert, 
  ArrowRight, 
  MapPin, 
  Clock, 
  CheckCircle2,
  ChevronRight,
  Eye,
  Share2,
  Sparkles,
  Check
} from 'lucide-react';

export const HomeView = () => {
  const {
    currentUser,
    observations,
    safetyReports,
    requests,
    events,
    plans,
    navigateTo,
    openCreateModal,
    openShareSocialModal,
    inspectEntity,
    viewPlanDetail,
    respondToRequest,
    setSelectedEventChat
  } = useCareMesh();

  // Highlight urgent / active items
  const activeSafetyAlerts = safetyReports.filter(s => s.status === 'active');
  const openRequests = requests.filter(r => r.status !== 'fulfilled').slice(0, 4);
  const activePlans = plans.slice(0, 2);
  const upcomingEvents = events.slice(0, 2);
  const recentObservations = observations.filter(o => !o.isContradiction && !o.isSupporting).slice(0, 3);

  return (
    <div className="d-flex flex-column gap-5">
      {/* Welcome & Context Banner */}
      <div 
        className="card p-4"
        style={{
          background: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #064e3b 100%)',
          color: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div className="d-flex align-center gap-2 mb-2">
            <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff' }}>
              <MapPin size={12} />
              <span>{currentUser.location.neighborhood} Area Coordination</span>
            </span>
          </div>

          <h2 className="text-2xl font-bold mb-2">Welcome back, {currentUser.name}</h2>
          <p className="text-sm opacity-90 mb-4" style={{ maxWidth: '650px', lineHeight: '1.5' }}>
            CareMesh coordinates real-world observations, challengeable evidence, and mutual resources to turn problems into transparent, verifiable collective action.
          </p>

          <div className="d-flex gap-2 flex-wrap">
            <button 
              className="btn btn-sm" 
              style={{ background: '#ffffff', color: '#065f46' }}
              onClick={() => openCreateModal('observation')}
            >
              <Eye size={14} />
              <span>Log Observation</span>
            </button>
            <button 
              className="btn btn-sm" 
              style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.4)' }}
              onClick={() => openCreateModal('request')}
            >
              <HandHeart size={14} />
              <span>Request Help</span>
            </button>
            <button 
              className="btn btn-sm" 
              style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.4)' }}
              onClick={() => openCreateModal('resource')}
            >
              <Package size={14} />
              <span>Offer Resource</span>
            </button>
            <button 
              className="btn btn-sm" 
              style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.4)' }}
              onClick={() => navigateTo('explore')}
            >
              <MapPin size={14} />
              <span>Explore World Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. Active Safety Alerts Banner (If Any) */}
      {activeSafetyAlerts.length > 0 && (
        <div className="d-flex flex-column gap-3">
          <div className="d-flex align-center justify-between">
            <h3 className="text-md font-bold text-rose d-flex align-center gap-2">
              <ShieldAlert size={18} />
              <span>Active Safety Notices ({activeSafetyAlerts.length})</span>
            </h3>
            <button 
              className="btn btn-ghost btn-sm text-xs text-rose font-medium"
              onClick={() => navigateTo('explore')}
            >
              View on Map <ArrowRight size={13} />
            </button>
          </div>

          <div className="grid-2">
            {activeSafetyAlerts.map(alert => (
              <div 
                key={alert.id} 
                className="card p-4 card-interactive" 
                style={{ borderLeft: '4px solid var(--rose-600)', cursor: 'pointer' }}
                onClick={() => inspectEntity(alert, 'safety')}
              >
                <div className="d-flex align-center justify-between mb-2">
                  <SeverityBadge severity={alert.severity} />
                  <span className="text-xs text-muted">{alert.timestamp}</span>
                </div>
                <h4 className="font-bold text-sm text-primary mb-1">{alert.title}</h4>
                <p className="text-xs text-secondary mb-2">{alert.description}</p>
                <div className="d-flex align-center justify-between text-xs text-muted pt-2 border-top">
                  <span className="d-flex align-center gap-1">
                    <MapPin size={12} /> {alert.location.address}
                  </span>
                  <span className="text-brand font-semibold">Inspect Precautions →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Priority Help Requests & Volunteer Needs (With Inline Quick Contribution Options) */}
      <div className="d-flex flex-column gap-3">
        <div className="d-flex align-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-primary d-flex align-center gap-2">
              <HandHeart size={18} className="text-brand" />
              <span>Community Help Requests</span>
            </h3>
            <p className="text-xs text-muted">Open mutual aid needs with volunteer tasks and immediate contribution pathways</p>
          </div>
          <button 
            className="btn btn-ghost btn-sm text-brand"
            onClick={() => navigateTo('collaborate', 'requests')}
          >
            <span>Browse All Requests</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid-2 gap-3">
          {openRequests.map(req => {
            const isUserJoined = req.responses?.some(resp => resp.user?.id === currentUser.id);
            const firstQuickAction = req.quickActions && req.quickActions.length > 0 ? req.quickActions[0] : null;

            return (
              <div 
                key={req.id} 
                className="card p-4 d-flex flex-column justify-between card-interactive"
              >
                <div>
                  <div className="d-flex align-center justify-between mb-2">
                    <div className="d-flex align-center gap-2">
                      <UrgencyBadge urgency={req.urgency} />
                      <span className="badge badge-gray text-xs text-uppercase font-semibold">{req.category}</span>
                    </div>
                    <span className="text-xs text-muted">{req.createdAt}</span>
                  </div>

                  <h4 className="font-bold text-sm text-primary mb-1">{req.title}</h4>
                  <p className="text-xs text-secondary mb-3" style={{ lineHeight: '1.4' }}>{req.description}</p>
                  
                  {/* Volunteer progress */}
                  <div className="mb-3">
                    <div className="d-flex justify-between text-xs text-muted mb-1">
                      <span>Volunteers: <strong>{req.peopleJoined}</strong> / {req.peopleNeeded} needed</span>
                      <span>{req.progressPercentage}%</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${req.progressPercentage}%` }} />
                    </div>
                  </div>

                  {/* Inline Quick Action Badge/Task if available */}
                  {firstQuickAction && (
                    <div className="card p-2 mb-3 text-xs" style={{ background: 'var(--amber-50)', border: '1px dashed var(--amber-300)' }}>
                      <div className="d-flex align-center justify-between mb-1">
                        <span className="font-bold text-amber d-flex align-center gap-1">
                          <Sparkles size={12} /> Quick Way to Help:
                        </span>
                        <span className="badge badge-amber text-xs font-semibold" style={{ fontSize: '0.65rem' }}>
                          <Clock size={10} /> {firstQuickAction.timeEstimate}
                        </span>
                      </div>
                      <p className="text-primary font-medium mb-0" style={{ fontSize: '0.78rem' }}>
                        {firstQuickAction.title}
                      </p>
                    </div>
                  )}

                  <div className="d-flex align-center gap-3 text-xs text-muted mb-2 flex-wrap">
                    <span className="d-flex align-center gap-1"><MapPin size={11} /> {req.location?.address}</span>
                    <span>By {req.requester?.name}</span>
                  </div>
                </div>

                <div className="d-flex align-center justify-between pt-2 border-top gap-2">
                  <button
                    className={`btn btn-xs ${isUserJoined ? 'btn-secondary' : 'btn-primary'} flex-1`}
                    onClick={() => {
                      if (!isUserJoined) {
                        respondToRequest(req.id, firstQuickAction ? `Quick Action: ${firstQuickAction.title}` : 'Volunteer');
                        alert(`Thank you! You signed up for: "${req.title}".`);
                      } else {
                        alert('You are already participating in this request.');
                      }
                    }}
                  >
                    {isUserJoined ? (
                      <>
                        <Check size={13} className="text-brand" />
                        <span>Participating</span>
                      </>
                    ) : firstQuickAction ? (
                      <>
                        <CheckCircle2 size={13} />
                        <span>Quick Respond ({firstQuickAction.timeEstimate})</span>
                      </>
                    ) : (
                      <>
                        <HandHeart size={13} />
                        <span>Volunteer / Respond</span>
                      </>
                    )}
                  </button>

                  <button
                    className="btn btn-ghost btn-xs text-brand font-semibold"
                    onClick={() => navigateTo('collaborate', 'requests', req.id)}
                  >
                    Details →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Active Long-Term Plans */}
      <div className="d-flex flex-column gap-3">
        <div className="d-flex align-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-primary d-flex align-center gap-2">
              <Target size={18} className="text-purple" />
              <span>Sustained Action Plans</span>
            </h3>
            <p className="text-xs text-muted">Long-term projects tracing problems through evidence, milestones, and measured outcomes</p>
          </div>
          <button 
            className="btn btn-ghost btn-sm text-brand"
            onClick={() => navigateTo('plans')}
          >
            <span>View All Plans</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid-2 gap-3">
          {activePlans.map(plan => {
            const completedCount = plan.milestones?.filter(m => m.status === 'completed').length || 0;
            const totalCount = plan.milestones?.length || 0;

            return (
              <div 
                key={plan.id}
                className="card p-4 card-interactive cursor-pointer"
                onClick={() => viewPlanDetail(plan)}
              >
                <div className="d-flex align-center justify-between mb-2">
                  <PlanStatusBadge status={plan.overallStatus || 'in_progress'} />
                  <LifecycleBadge stage={plan.lifecycleStage} />
                </div>
                <h4 className="font-bold text-md text-primary mb-1">{plan.title}</h4>
                <p className="text-xs text-secondary mb-3">{plan.problemStatement}</p>

                <div className="text-xs text-muted mb-3">
                  <strong>Milestones:</strong> {completedCount} of {totalCount} Completed
                </div>

                <div className="d-flex align-center justify-between pt-2 border-top text-xs text-muted">
                  <span>{plan.participants?.length || 0} Collaborators • {plan.decisions?.length || 0} Decisions</span>
                  <span className="text-brand font-semibold">Inspect Plan Details →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Today's Events & Activities */}
      <div className="d-flex flex-column gap-3">
        <div className="d-flex align-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-primary d-flex align-center gap-2">
              <Calendar size={18} className="text-blue-600" />
              <span>Today's Coordination Workdays & Events</span>
            </h3>
          </div>
        </div>

        <div className="grid-2 gap-3">
          {upcomingEvents.map(evt => (
            <div 
              key={evt.id} 
              className="card p-4 d-flex flex-column justify-between card-interactive"
            >
              <div>
                <div className="d-flex align-center justify-between mb-2">
                  <span className="badge badge-primary text-xs font-semibold text-uppercase">{evt.eventType.replace('_', ' ')}</span>
                  <span className="text-xs font-bold text-primary">{evt.date} • {evt.time}</span>
                </div>
                <h4 className="font-bold text-md text-primary mb-1">{evt.title}</h4>
                <p className="text-xs text-secondary mb-3">{evt.description}</p>
                <div className="d-flex align-center gap-2 text-xs text-muted mb-2">
                  <MapPin size={12} /> {evt.location?.address}
                </div>
              </div>

              <div className="d-flex align-center justify-between pt-3 border-top">
                <span className="text-xs text-muted">{evt.participants?.length || 0} Attendees</span>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedEventChat(evt)}
                >
                  <span>Open Coordination Chat</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Recent Real-World Observations */}
      <div className="d-flex flex-column gap-3">
        <div className="d-flex align-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-primary d-flex align-center gap-2">
              <Eye size={18} className="text-brand" />
              <span>Recent Observations & Field Reports</span>
            </h3>
            <p className="text-xs text-muted">Observations logged by community members. Challengeable with evidence or corroborating reports.</p>
          </div>
          <button 
            className="btn btn-ghost btn-sm text-brand"
            onClick={() => navigateTo('explore')}
          >
            <span>Explore Map</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid-3 gap-3">
          {recentObservations.map(obs => {
            const hasDisputes = obs.claimIds?.length > 0;
            const contraCount = obs.contradictoryObservationIds?.length || 0;

            return (
              <div 
                key={obs.id} 
                className="card p-4 d-flex flex-column justify-between card-interactive"
              >
                <div>
                  <div className="d-flex align-center justify-between mb-2">
                    <span className="badge badge-gray text-xs text-uppercase font-semibold">
                      {obs.category.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-muted">{obs.timestamp}</span>
                  </div>

                  <h4 className="font-bold text-sm text-primary mb-1">{obs.title}</h4>
                  <p className="text-xs text-secondary mb-3" style={{ lineHeight: '1.4' }}>{obs.description}</p>
                  
                  {contraCount > 0 && (
                    <div className="mb-2">
                      <span className="badge badge-rose text-xs font-bold">
                        {contraCount} Contradictory {contraCount === 1 ? 'Report' : 'Reports'} on Record
                      </span>
                    </div>
                  )}

                  <div className="d-flex align-center gap-2 text-xs text-muted mb-2">
                    <MapPin size={11} /> {obs.location?.address}
                  </div>
                </div>

                <div className="d-flex align-center justify-between pt-2 border-top gap-2">
                  <button
                    className="btn btn-ghost btn-xs text-muted"
                    onClick={() => openShareSocialModal(obs, 'observation')}
                    title="Share Observation to Feed"
                  >
                    <Share2 size={13} />
                    <span>Share</span>
                  </button>

                  <button
                    className="btn btn-ghost btn-xs text-brand font-semibold p-0"
                    onClick={() => inspectEntity(obs, 'observation')}
                  >
                    <span>{hasDisputes ? 'Inspect / Dispute →' : 'Inspect Evidence →'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
