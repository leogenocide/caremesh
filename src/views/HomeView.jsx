import { useState, useMemo, useEffect } from 'react';
import { useCareMesh } from '../context/useCareMesh';
import { UrgencyBadge, SeverityBadge, LifecycleBadge, RequestStatusBadge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { usePagination } from '../hooks/usePagination';
import { 
  HandHeart, 
  Package, 
  Target, 
  ShieldAlert, 
  ArrowRight, 
  MapPin, 
  Eye, 
  Share2, 
  Sparkles, 
  Check,
  Globe,
  Users,
  ShieldCheck,
  Plus,
  Lock
} from 'lucide-react';

export const HomeView = () => {
  const {
    currentUser,
    observations,
    safetyReports,
    requests,
    plans,
    communities,
    navigateTo,
    openCreateModal,
    openShareSocialModal,
    inspectEntity,
    viewPlanDetail,
    viewRequestDetail,
    viewSafetyDetail,
    respondToRequest,
    viewUserProfile,
    showToast
  } = useCareMesh();

  const userJoinedCommunityIds = useMemo(() => {
    return (communities || [])
      .filter(c => c.isJoined || c.memberIds?.includes(currentUser?.id) || c.adminIds?.includes(currentUser?.id))
      .map(c => c.id);
  }, [communities, currentUser]);

  // Highlight urgent / active items (filter out group_only requests for non-members)
  const activeSafetyAlerts = safetyReports.filter(s => s.status === 'active');
  const openRequests = useMemo(() => {
    return requests.filter(r => {
      if (r.status === 'fulfilled') return false;
      if (r.visibility === 'group_only') {
        const isOwner = r.requester?.id === currentUser?.id || r.requester_id === currentUser?.id;
        const isMember = r.communityId && userJoinedCommunityIds.includes(r.communityId);
        if (!isOwner && !isMember) return false;
      }
      return true;
    });
  }, [requests, currentUser, userJoinedCommunityIds]);

  const activePlans = plans.filter(p => p.lifecycleStage !== 'outcome_evaluated');
  const recentObservations = observations.filter(o => !o.isContradiction && !o.isSupporting).slice(0, 4);

  // Filter state for community needs
  const [needsFilter, setNeedsFilter] = useState('all'); // 'all' | 'labor' | 'supplies' | 'equipment' | 'transport'

  // User skills for relevance calculation
  const userSkills = useMemo(() => (currentUser?.skills || []).map(s => s.toLowerCase()), [currentUser?.skills]);

  // Relevance scoring: skill matches (+30/match), neighborhood proximity (+20), urgency (+15/10/5)
  const calculateRelevanceScore = (req) => {
    let score = 0;
    const reqSkills = (req.requiredSkills || []).map(s => s.toLowerCase());
    const matchingSkills = userSkills.filter(usk => 
      reqSkills.some(rsk => rsk.includes(usk) || usk.includes(rsk))
    );
    score += matchingSkills.length * 30;

    const userNeighborhood = (currentUser?.location?.neighborhood || 'Maplewood').toLowerCase();
    const address = ((req.location?.address || '') + ' ' + (req.location?.neighborhood || '')).toLowerCase();
    if (address.includes(userNeighborhood)) {
      score += 20;
    } else if (address.includes('maplewood')) {
      score += 10;
    }

    if (req.urgency === 'critical') score += 15;
    else if (req.urgency === 'high') score += 10;
    else if (req.urgency === 'medium') score += 5;

    return score;
  };

  const sortedNeeds = useMemo(() => {
    const list = openRequests.filter(req => {
      if (needsFilter !== 'all') return req.category === needsFilter;
      return true;
    });

    return [...list].sort((a, b) => {
      const scoreA = calculateRelevanceScore(a);
      const scoreB = calculateRelevanceScore(b);
      return scoreB - scoreA;
    });
  }, [openRequests, needsFilter, currentUser, userSkills]); // eslint-disable-line react-hooks/exhaustive-deps

  const needsPagination = usePagination(sortedNeeds, 4);

  // Reset page when filter changes
  useEffect(() => {
    needsPagination.resetPage();
  }, [needsFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Matched requests based on current resident's skills
  const matchedRequests = openRequests.filter(req => 
    (req.requiredSkills || []).some(sk => userSkills.some(usk => usk.includes(sk.toLowerCase()) || sk.toLowerCase().includes(usk)))
  ).slice(0, 2);

  return (
    <div className="d-flex flex-column gap-5">
      {/* 1. Hero & Community Readiness Pulse */}
      <div 
        className="card p-4 p-md-5"
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 45%, #047857 100%)',
          color: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Top Status & Location Badges */}
          <div className="d-flex align-center justify-between gap-2 flex-wrap mb-3">
            <div className="d-flex align-center gap-2 flex-wrap">
              <span className="badge d-inline-flex align-center gap-1.5" style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 8px #4ade80' }} />
                <span>Active Coordination District</span>
              </span>
              <span className="badge d-inline-flex align-center gap-1" style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}>
                <MapPin size={12} />
                <span>{currentUser?.location?.neighborhood || 'Maplewood North'} Hub</span>
              </span>
            </div>

            {currentUser?.badges && currentUser.badges.length > 0 && (
              <span className="badge d-none d-sm-inline-flex align-center gap-1" style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', fontSize: '0.75rem' }}>
                <ShieldCheck size={12} />
                <span>{currentUser.badges[0]}</span>
              </span>
            )}
          </div>

          {/* Greeting & Mission */}
          <h1 className="text-2xl font-bold mb-2 text-white" style={{ letterSpacing: '-0.02em' }}>
            {currentUser?.name ? `Welcome back, ${currentUser.name}` : 'Welcome to CareMesh'}
          </h1>
          <p className="text-sm opacity-90 mb-4" style={{ maxWidth: '680px', lineHeight: '1.6' }}>
            CareMesh connects real-world observations, challengeable field evidence, and transparent mutual resources to turn community challenges into verified collective action.
          </p>


          {/* Quick Action Button Ribbon */}
          <div className="home-hero-actions">
            <button 
              type="button"
              className="btn btn-sm shadow-sm" 
              style={{ background: '#ffffff', color: '#065f46', fontWeight: 600 }}
              onClick={() => openCreateModal('observation')}
            >
              <Eye size={14} />
              <span>Log Field Observation</span>
            </button>
            <button 
              type="button"
              className="btn btn-sm" 
              style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.4)', fontWeight: 500 }}
              onClick={() => openCreateModal('request')}
            >
              <HandHeart size={14} />
              <span>Request Help</span>
            </button>
            <button 
              type="button"
              className="btn btn-sm" 
              style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.4)', fontWeight: 500 }}
              onClick={() => openCreateModal('resource')}
            >
              <Package size={14} />
              <span>Offer Resource</span>
            </button>
            <button 
              type="button"
              className="btn btn-sm" 
              style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.4)', fontWeight: 500 }}
              onClick={() => navigateTo('explore', null, null, { initialWorldView: true })}
              title="Launch full-screen World Situation Map with Supercluster"
            >
              <Globe size={14} />
              <span>Explore World Map →</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Active Safety Alerts Banner (Only when active notices exist) */}
      {activeSafetyAlerts.length > 0 && (
        <div className="card p-3 p-md-4" style={{ borderLeft: '4px solid var(--rose-600)', background: 'linear-gradient(to right, #fff1f2, #ffffff)' }}>
          <div className="d-flex align-center justify-between mb-3 flex-wrap gap-2">
            <div className="d-flex align-center gap-2">
              <span className="badge badge-danger text-xs font-bold d-flex align-center gap-1">
                <ShieldAlert size={13} />
                <span>URGENT SAFETY NOTICES ({activeSafetyAlerts.length})</span>
              </span>
              <span className="text-xs text-muted">Field conditions requiring active precautions and welfare checks</span>
            </div>
            <button 
              type="button"
              className="btn btn-ghost btn-xs text-rose font-bold d-flex align-center gap-1"
              onClick={() => navigateTo('explore')}
            >
              <span>View All on Map</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="grid-2 gap-3">
            {activeSafetyAlerts.map(alert => (
              <div 
                key={alert.id} 
                className="card p-3 card-interactive cursor-pointer bg-white"
                onClick={() => viewSafetyDetail(alert)}
                style={{ border: '1px solid var(--rose-200)', boxShadow: 'var(--shadow-xs)' }}
              >
                <div className="d-flex align-center justify-between mb-1.5">
                  <SeverityBadge severity={alert.severity} />
                  <span className="text-xs text-muted">{alert.timestamp}</span>
                </div>
                <h4 className="font-bold text-sm text-primary mb-1">{alert.title}</h4>
                <p className="text-xs text-secondary mb-2" style={{ lineHeight: '1.4' }}>{alert.description}</p>
                <div className="d-flex align-center justify-between text-xs text-muted pt-2 border-top">
                  <span className="d-flex align-center gap-1 truncate" style={{ maxWidth: '70%' }}>
                    <MapPin size={11} /> {alert.location?.address}
                  </span>
                  <span className="text-rose font-semibold">Inspect Precautions →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Main Operations Grid (65% Primary Workflows / 35% Community Digest) */}
      <div className="home-operations-grid">
        {/* Left Column: Operations & Active Response */}
        <div className="d-flex flex-column gap-5">
          {/* Section A: Priority Needs & Immediate Ways to Help */}
          <div className="d-flex flex-column gap-3">
            <div className="d-flex align-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-md font-bold text-primary d-flex align-center gap-2 mb-0.5">
                  <HandHeart size={18} className="text-brand" />
                  <span>Priority Community Needs</span>
                </h3>
                <p className="text-xs text-muted mb-0">Relevant mutual aid tasks prioritized for you with direct volunteer actions</p>
              </div>

              {/* Filter Pills and Relevance Indicator */}
              <div className="d-flex align-center gap-2 flex-wrap">
                <span className="text-xs text-muted d-none d-sm-inline-flex align-center gap-1 font-medium" style={{ fontSize: '0.72rem' }}>
                  <Sparkles size={12} className="text-brand" /> Relevant First
                </span>
                <div className="d-flex align-center gap-1 flex-wrap">
                  {[
                    { id: 'all', label: 'All Needs' },
                    { id: 'labor', label: 'Labor' },
                    { id: 'supplies', label: 'Supplies' },
                    { id: 'equipment', label: 'Equipment' },
                    { id: 'transport', label: 'Transport' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`btn btn-xs ${needsFilter === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.72rem', borderRadius: 'var(--radius-full)' }}
                      onClick={() => setNeedsFilter(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="d-flex flex-column gap-3">
              {needsPagination.paginatedItems.map(req => {
                const isOwner = req.requester?.id === currentUser?.id || req.requester_id === currentUser?.id;
                const isUserJoined = req.responses?.some(resp => resp.user?.id === currentUser?.id);
                const hasSkillMatch = (req.requiredSkills || []).some(sk => userSkills.some(usk => usk.includes(sk.toLowerCase()) || sk.toLowerCase().includes(usk)));
                const affiliatedCommunity = communities?.find(c => c.id === req.communityId);

                return (
                  <div key={req.id} className="card p-4 card-interactive d-flex flex-column justify-between">
                    <div>
                      <div className="d-flex align-center justify-between mb-2">
                        <div className="d-flex align-center gap-2 flex-wrap">
                          <UrgencyBadge urgency={req.urgency} />
                          <RequestStatusBadge status={req.status} />
                          {hasSkillMatch && (
                            <span className="badge badge-primary text-xs font-semibold d-inline-flex align-center gap-1" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
                              <Sparkles size={10} /> Matched Skills
                            </span>
                          )}
                          <span className="badge badge-gray text-xs text-uppercase font-semibold">{req.category}</span>
                          {affiliatedCommunity && (
                            req.visibility === 'group_only' ? (
                              <span 
                                className="badge text-xs font-bold d-inline-flex align-center gap-1" 
                                style={{ background: '#f3e8ff', color: '#7e22ce', border: '1px solid #d8b4fe', fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}
                                title="Visible only to group members"
                              >
                                <Lock size={10} /> {affiliatedCommunity.name}
                              </span>
                            ) : (
                              <span 
                                className="badge badge-secondary text-xs d-inline-flex align-center gap-1" 
                                style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}
                              >
                                <Globe size={10} /> {affiliatedCommunity.name}
                              </span>
                            )
                          )}
                        </div>
                        <span className="text-xs text-muted">{req.createdAt}</span>
                      </div>

                      <h4 
                        className="font-bold text-sm text-primary mb-1 cursor-pointer hover:text-brand"
                        onClick={() => viewRequestDetail(req)}
                      >
                        {req.title}
                      </h4>
                      <p className="text-xs text-secondary mb-3" style={{ lineHeight: '1.45' }}>{req.description}</p>

                      {/* Volunteer Progress Bar */}
                      <div className="mb-3">
                        <div className="d-flex justify-between text-xs text-muted mb-1">
                          <span>Volunteers: <strong>{req.peopleJoined}</strong> / {req.peopleNeeded} needed</span>
                          <span className="font-semibold text-primary">{req.progressPercentage}%</span>
                        </div>
                        <div className="progress-bar-bg">
                          <div className="progress-bar-fill" style={{ width: `${req.progressPercentage}%` }} />
                        </div>
                      </div>

                      {/* Required Skills Tags */}
                      {req.requiredSkills && req.requiredSkills.length > 0 && (
                        <div className="d-flex align-center gap-1.5 flex-wrap mb-3">
                          <span className="text-xs text-muted" style={{ fontSize: '0.7rem' }}>Skills needed:</span>
                          {req.requiredSkills.map(sk => {
                            const isMatched = userSkills.some(usk => usk.includes(sk.toLowerCase()) || sk.toLowerCase().includes(usk));
                            return (
                              <span 
                                key={sk} 
                                className={`badge ${isMatched ? 'badge-primary font-semibold' : 'badge-gray'} text-xs d-inline-flex align-center gap-1`}
                                style={{ fontSize: '0.68rem', padding: '0.12rem 0.45rem' }}
                              >
                                {isMatched && <Sparkles size={9} />}
                                <span>{sk}</span>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      <div className="d-flex align-center gap-3 text-xs text-muted mb-2 flex-wrap">
                        <span className="d-flex align-center gap-1"><MapPin size={11} /> {req.location?.address}</span>
                        {req.requester && (
                          <div 
                            className="d-inline-flex align-center gap-1.5 cursor-pointer text-primary hover:text-brand"
                            onClick={(e) => {
                              e.stopPropagation();
                              viewUserProfile(req.requester);
                            }}
                            title={`View ${req.requester.name}'s Profile`}
                          >
                            {req.requester.avatar && (
                              <img 
                                src={req.requester.avatar} 
                                alt={req.requester.name} 
                                style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }} 
                              />
                            )}
                            <span>Requester: <strong style={{ textDecoration: 'underline', textDecorationColor: 'var(--border-medium)' }}>{req.requester.name}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="home-card-actions pt-2.5 border-top d-flex align-center justify-between gap-2 flex-wrap">
                      {isOwner ? (
                        <button
                          type="button"
                          className="btn btn-xs btn-secondary flex-1 d-flex align-center justify-center gap-1.5 home-action-primary"
                          onClick={() => viewRequestDetail(req)}
                          title="Manage your help request"
                        >
                          <Users size={13} className="text-brand" />
                          <span>Your Request (Manage)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`btn btn-xs ${isUserJoined ? 'btn-secondary' : 'btn-primary'} flex-1 d-flex align-center justify-center gap-1.5 home-action-primary`}
                          onClick={() => {
                            if (!isUserJoined) {
                              respondToRequest(req.id, 'Volunteer');
                              showToast(`Thank you! You signed up for: "${req.title}".`, 'success');
                            } else {
                              showToast('You are already participating in this request.', 'info');
                            }
                          }}
                        >
                          {isUserJoined ? (
                            <>
                              <Check size={13} className="text-brand" />
                              <span>Joined (Participating)</span>
                            </>
                          ) : (
                            <>
                              <HandHeart size={13} />
                              <span>Volunteer / Respond</span>
                            </>
                          )}
                        </button>
                      )}

                      <div className="d-flex align-center gap-1 home-action-secondary">
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs text-muted d-inline-flex align-center gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            openShareSocialModal(req, 'request');
                          }}
                          title="Share this request"
                        >
                          <Share2 size={13} />
                          <span>Share</span>
                        </button>

                        <button
                          type="button"
                          className="btn btn-ghost btn-xs text-brand font-semibold"
                          onClick={() => viewRequestDetail(req)}
                        >
                          Details →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {needsPagination.totalPages > 1 && (
              <Pagination
                currentPage={needsPagination.currentPage}
                totalPages={needsPagination.totalPages}
                totalItems={needsPagination.totalItems}
                startIndex={needsPagination.startIndex}
                endIndex={needsPagination.endIndex}
                onPageChange={needsPagination.setPage}
                pageSize={needsPagination.pageSize}
                onPageSizeChange={needsPagination.setPageSize}
                pageSizeOptions={[2, 4, 6]}
              />
            )}

            <button
              type="button"
              className="btn btn-ghost btn-sm text-brand font-semibold align-self-start"
              onClick={() => navigateTo('collaborate', 'requests')}
            >
              <span>Browse All {openRequests.length} Community Needs</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Section B: Field Observations & Challengeable Evidence */}
          <div className="d-flex flex-column gap-3">
            <div className="d-flex align-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-md font-bold text-primary d-flex align-center gap-2 mb-0.5">
                  <Eye size={18} className="text-brand" />
                  <span>Recent Observations & Field Reports</span>
                </h3>
                <p className="text-xs text-muted mb-0">Empirical community field reports with challengeable evidence trails</p>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-xs d-flex align-center gap-1"
                onClick={() => openCreateModal('observation')}
              >
                <Plus size={12} />
                <span>Log Observation</span>
              </button>
            </div>

            <div className="grid-2 gap-3">
              {recentObservations.map(obs => {
                const hasDisputes = obs.claimIds?.length > 0;
                const contraCount = obs.contradictoryObservationIds?.length || 0;

                return (
                  <div key={obs.id} className="card p-3.5 d-flex flex-column justify-between card-interactive">
                    <div>
                      <div className="d-flex align-center justify-between mb-2">
                        <span className="badge badge-gray text-xs text-uppercase font-semibold" style={{ fontSize: '0.68rem' }}>
                          {obs.category.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-muted">{obs.timestamp}</span>
                      </div>

                      <h4 className="font-bold text-sm text-primary mb-1">{obs.title}</h4>
                      <p className="text-xs text-secondary mb-2.5 line-clamp-2" style={{ lineHeight: '1.4' }}>{obs.description}</p>

                      {contraCount > 0 && (
                        <div className="mb-2">
                          <span className="badge badge-rose text-xs font-bold" style={{ fontSize: '0.68rem' }}>
                            {contraCount} Contradictory {contraCount === 1 ? 'Report' : 'Reports'} on Record
                          </span>
                        </div>
                      )}

                      <div className="d-flex align-center gap-1.5 text-xs text-muted mb-2 truncate">
                        <MapPin size={11} className="flex-shrink-0" />
                        <span className="truncate">{obs.location?.address}</span>
                      </div>
                    </div>

                    <div className="d-flex align-center justify-between pt-2 border-top gap-2">
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-muted"
                        onClick={() => openShareSocialModal(obs, 'observation')}
                        title="Share Observation to Feed"
                      >
                        <Share2 size={13} />
                        <span>Share</span>
                      </button>

                      <button
                        type="button"
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

            <button
              type="button"
              className="btn btn-ghost btn-sm text-brand font-semibold align-self-start"
              onClick={() => navigateTo('explore')}
            >
              <span>Explore All Field Reports on Map</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Right Column: Community Digest & Personal Radar */}
        <div className="d-flex flex-column gap-4">
          {/* Card 1: Matched For You (Based on Verified Skills) */}
          {currentUser && matchedRequests.length > 0 && (
            <div className="card p-3.5 matched-need-highlight" style={{ borderRadius: 'var(--radius-lg)' }}>
              <div className="d-flex align-center justify-between mb-2">
                <span className="badge badge-primary text-xs font-bold d-flex align-center gap-1" style={{ fontSize: '0.7rem' }}>
                  <Sparkles size={11} />
                  <span>MATCHED FOR YOU</span>
                </span>
                <span className="text-xs text-muted">Skills match</span>
              </div>
              <h4 className="font-bold text-sm text-primary mb-1">Needs Fitting Your Skills</h4>
              <p className="text-xs text-secondary mb-3" style={{ fontSize: '0.78rem', lineHeight: '1.4' }}>
                Based on your profile skills ({currentUser.skills?.slice(0, 3).join(', ')}):
              </p>

              <div className="d-flex flex-column gap-2">
                {matchedRequests.map(match => (
                  <div 
                    key={match.id} 
                    className="card p-2.5 bg-white card-interactive cursor-pointer"
                    onClick={() => viewRequestDetail(match)}
                    style={{ border: '1px solid var(--border-light)' }}
                  >
                    <div className="d-flex align-center justify-between mb-1">
                      <UrgencyBadge urgency={match.urgency} />
                      <span className="text-xs text-muted">{match.location?.neighborhood || 'Maplewood'}</span>
                    </div>
                    <h5 className="font-semibold text-xs text-primary mb-1">{match.title}</h5>
                    <span className="text-brand font-semibold text-xs">Help Now →</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card 2: Sustained Action Plans in Progress */}
          <div className="card p-4">
            <div className="d-flex align-center justify-between mb-3">
              <h4 className="text-sm font-bold text-primary d-flex align-center gap-1.5 mb-0">
                <Target size={16} className="text-purple" />
                <span>Sustained Action Plans</span>
              </h4>
              <button 
                type="button"
                className="btn btn-ghost btn-xs text-brand font-semibold p-0"
                onClick={() => navigateTo('plans')}
              >
                All Plans →
              </button>
            </div>

            <div className="d-flex flex-column gap-3">
              {activePlans.slice(0, 2).map(plan => {
                const completedCount = plan.milestones?.filter(m => m.status === 'completed').length || 0;
                const totalCount = plan.milestones?.length || 0;

                return (
                  <div 
                    key={plan.id}
                    className="p-2.5 rounded border border-light bg-subtle card-interactive cursor-pointer"
                    onClick={() => viewPlanDetail(plan)}
                  >
                    <div className="d-flex align-center justify-between mb-1.5 flex-wrap gap-1">
                      <LifecycleBadge stage={plan.lifecycleStage} />
                      <span className="text-xs text-muted">{completedCount}/{totalCount} Milestones</span>
                    </div>
                    <h5 className="font-bold text-xs text-primary mb-1">{plan.title}</h5>
                    <p className="text-xs text-secondary mb-2 line-clamp-2" style={{ fontSize: '0.75rem', lineHeight: '1.35' }}>
                      {plan.problemStatement}
                    </p>
                    <div className="d-flex align-center justify-between pt-1 border-top text-xs text-muted">
                      <span>{plan.participants?.length || 0} Collaborators</span>
                      <div className="d-flex align-center gap-2">
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs text-muted p-0 d-inline-flex align-center gap-0.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            openShareSocialModal(plan, 'plan');
                          }}
                          title="Share plan"
                        >
                          <Share2 size={12} />
                          <span>Share</span>
                        </button>
                        <span className="text-brand font-semibold">Inspect →</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 4: Community Circles & Readiness */}
          <div className="card p-3.5 bg-subtle" style={{ border: '1px dashed var(--border-default)' }}>
            <div className="d-flex align-center gap-2 mb-2">
              <Users size={16} className="text-purple-600" />
              <h4 className="text-xs font-bold text-primary text-uppercase mb-0" style={{ letterSpacing: '0.04em' }}>
                Community Circles & Governance
              </h4>
            </div>
            <p className="text-xs text-secondary mb-2.5" style={{ lineHeight: '1.4' }}>
              Participate in democratic neighborhood polls, member readiness checks, and moderator elections.
            </p>
            <button 
              type="button"
              className="btn btn-secondary btn-xs w-100 d-flex align-center justify-center gap-1"
              onClick={() => navigateTo('social', 'communities')}
            >
              <span>Explore Circles & Governance</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomeView;
