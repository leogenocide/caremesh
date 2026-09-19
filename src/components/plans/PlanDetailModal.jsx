import { useState } from 'react';
import { Modal } from '../common/Modal';
import { PlanStatusBadge, MilestoneStatusBadge, LifecycleBadge } from '../common/Badge';
import { PlanFeedbackSection } from './PlanFeedbackSection';
import { useCareMesh } from '../../context/useCareMesh';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../common/Pagination';
import { 
  Target, 
  CheckCircle2, 
  FileText, 
  Plus, 
  Link2, 
  Sparkles, 
  Check, 
  MapPin, 
  Users, 
  Layers, 
  History, 
  Edit3, 
  ArrowRight,
  Package,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Compass,
  Lightbulb,
  FileCheck,
  Eye,
  Trash2,
  Share2
} from 'lucide-react';

export const PlanDetailModal = ({ isOpen, onClose, plan }) => {
  const { 
    togglePlanMilestone, 
    addPlanDecision, 
    deletePlanDecision,
    deletePlanMilestone,
    updatePlanStage, 
    openRevisePlanModal,
    openLogOutcomeModal,
    deletePlan,
    canUserManage,
    inspectEntity,
    viewRequestDetail,
    requests, 
    observations,
    currentUser,
    openShareSocialModal 
  } = useCareMesh();

  const [activeTab, setActiveTab] = useState('proposal'); // 'proposal' | 'critique' | 'revisions' | 'milestones' | 'decisions' | 'outcomes'
  const [newDecisionTitle, setNewDecisionTitle] = useState('');
  const [newDecisionRationale, setNewDecisionRationale] = useState('');
  const [isAddingDecision, setIsAddingDecision] = useState(false);

  const handleAddDecision = (e) => {
    e.preventDefault();
    if (!newDecisionTitle.trim() || !plan) return;

    addPlanDecision(plan.id, {
      title: newDecisionTitle.trim(),
      rationale: newDecisionRationale.trim()
    });

    setNewDecisionTitle('');
    setNewDecisionRationale('');
    setIsAddingDecision(false);
  };

  const isAuthorOrCoordinator = plan?.proposer?.id === currentUser?.id || plan?.participants?.some(p => p.user?.id === currentUser?.id);

  const linkedRequests = plan ? requests.filter(r => plan.linkedRequestIds?.includes(r.id)) : [];
  const linkedObs = plan ? observations.filter(o => plan.linkedObservationIds?.includes(o.id)) : [];

  const totalMilestones = plan?.milestones?.length || 0;
  const completedMilestones = plan?.milestones?.filter(m => m.status === 'completed').length || 0;

  const revisionsPagination = usePagination(plan?.revisionHistory || [], 4);
  const milestonesPagination = usePagination(plan?.milestones || [], 4);
  const decisionsPagination = usePagination(plan?.decisions || [], 4);

  if (!plan) return null;

  const lifecycleStages = [
    { key: 'draft', label: '1. Draft' },
    { key: 'community_review', label: '2. Community Review' },
    { key: 'revised', label: '3. Revised' },
    { key: 'accepted', label: '4. Accepted' },
    { key: 'active', label: '5. Active' },
    { key: 'completed', label: '6. Completed' }
  ];

  const currentStageIndex = lifecycleStages.findIndex(s => s.key === plan.lifecycleStage || (s.key === 'community_review' && plan.lifecycleStage === 'coordinating') || (s.key === 'accepted' && plan.lifecycleStage === 'plan_active') || (s.key === 'active' && plan.lifecycleStage === 'actions_underway'));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={plan.title}
      subtitle="Proposal, Critique, Revision & Long-Term Execution Lifecycle"
      maxWidth="900px"
    >
      <div className="d-flex flex-column gap-4">
        {/* 1. Proposal Lifecycle Progression Header */}
        <div className="card p-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
          <div className="d-flex align-center justify-between flex-wrap gap-2 mb-2">
            <div className="d-flex align-center gap-2">
              <span className="badge badge-primary font-bold text-xs">Version {plan.currentVersion || 'v1.0'}</span>
              <LifecycleBadge stage={plan.lifecycleStage} />
              <PlanStatusBadge status={plan.overallStatus || 'planning'} />
              <button
                type="button"
                className="btn btn-secondary btn-xs d-inline-flex align-center gap-1"
                onClick={() => openShareSocialModal(plan, 'plan')}
                title="Share this resilience plan"
              >
                <Share2 size={12} />
                <span>Share</span>
              </button>
            </div>

            {/* Stage Progression CTAs for Author / Coordinators */}
            {isAuthorOrCoordinator && (
              <div className="d-flex align-center gap-2 flex-wrap">
                {plan.lifecycleStage === 'draft' && (
                  <button
                    type="button"
                    className="btn btn-primary btn-xs d-flex align-center gap-1"
                    onClick={() => updatePlanStage(plan.id, 'community_review')}
                  >
                    <span>Submit for Community Review</span>
                    <ArrowRight size={13} />
                  </button>
                )}

                {(plan.lifecycleStage === 'community_review' || plan.lifecycleStage === 'revised' || plan.lifecycleStage === 'coordinating') && (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs d-flex align-center gap-1"
                      onClick={() => openRevisePlanModal(plan)}
                    >
                      <Edit3 size={13} />
                      <span>Revise Proposal</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-xs d-flex align-center gap-1"
                      onClick={() => updatePlanStage(plan.id, 'accepted')}
                    >
                      <span>Accept Plan</span>
                      <ArrowRight size={13} />
                    </button>
                  </>
                )}

                {(plan.lifecycleStage === 'accepted' || plan.lifecycleStage === 'plan_active') && (
                  <button
                    type="button"
                    className="btn btn-primary btn-xs d-flex align-center gap-1"
                    onClick={() => updatePlanStage(plan.id, 'active')}
                  >
                    <span>Activate Implementation</span>
                    <ArrowRight size={13} />
                  </button>
                )}

                {(plan.lifecycleStage === 'active' || plan.lifecycleStage === 'actions_underway') && (
                  <button
                    type="button"
                    className="btn btn-primary btn-xs d-flex align-center gap-1"
                    onClick={() => openLogOutcomeModal(plan)}
                  >
                    <Check size={13} />
                    <span>Complete & Evaluate Outcome</span>
                  </button>
                )}

                {plan.lifecycleStage === 'completed' && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs d-flex align-center gap-1"
                    onClick={() => openLogOutcomeModal(plan)}
                  >
                    <Edit3 size={13} />
                    <span>Update Outcome Evaluation</span>
                  </button>
                )}

                {canUserManage(plan) && (
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-xs d-flex align-center gap-1"
                    style={{ color: '#dc2626', borderColor: '#fca5a5', background: '#fef2f2' }}
                    title="Delete Plan"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete the plan "${plan.title}"? This action cannot be undone.`)) {
                        deletePlan(plan.id);
                        onClose();
                      }
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Delete Plan</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 6-Stage Progress Indicator (Purely Textual Stepper) */}
          <div className="touch-tab-nav gap-1 pt-2 border-top">
            {lifecycleStages.map((stg, idx) => {
              const isCurrent = idx === currentStageIndex || (currentStageIndex === -1 && idx === 1);
              const isPast = idx < currentStageIndex;

              return (
                <div
                  key={stg.key}
                  className="p-1 px-2 text-xs rounded text-center flex-1"
                  style={{
                    background: isCurrent ? 'var(--primary-600)' : isPast ? 'var(--primary-100)' : 'var(--bg-muted)',
                    color: isCurrent ? '#ffffff' : isPast ? 'var(--primary-900)' : 'var(--text-secondary)',
                    fontWeight: isCurrent ? 700 : 500,
                    minWidth: '96px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isPast && '✓ '}{stg.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Top Sub-Navigation Tabs */}
        <div className="touch-tab-nav border-bottom pb-2">
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'proposal' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => setActiveTab('proposal')}
          >
            <FileText size={15} />
            <span>Structured Proposal</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'critique' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => setActiveTab('critique')}
          >
            <Sparkles size={15} />
            <span>Critique & Feedback ({plan.feedback?.length || 0})</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'revisions' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('revisions')}
          >
            <History size={14} />
            <span>Revision History ({plan.revisionHistory?.length || 1})</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'milestones' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('milestones')}
          >
            <CheckCircle2 size={14} />
            <span>Milestones ({completedMilestones}/{totalMilestones})</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'decisions' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('decisions')}
          >
            <Layers size={14} />
            <span>Decisions Log ({plan.decisions?.length || 0})</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'outcomes' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => setActiveTab('outcomes')}
          >
            <Compass size={14} />
            <span>Outcome & Results {plan.outcomeReport ? '✓' : ''}</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: STRUCTURED PROPOSAL SPECIFICATIONS                 */}
        {/* ========================================================= */}
        {activeTab === 'proposal' && (
          <div className="d-flex flex-column gap-3">
            {/* Problem & Desired Outcome */}
            <div className="grid-2 gap-3">
              <div className="card p-3" style={{ background: '#ffffff', border: '1px solid var(--border-light)' }}>
                <h5 className="font-bold text-xs text-primary text-uppercase mb-2 d-flex align-center gap-1">
                  <AlertCircle size={14} className="text-rose" /> What problem are we trying to solve?
                </h5>
                <p className="text-xs text-secondary mb-0" style={{ lineHeight: '1.55' }}>
                  {plan.problemStatement || 'Problem statement under definition.'}
                </p>
              </div>

              <div className="card p-3" style={{ background: '#ffffff', border: '1px solid var(--border-light)' }}>
                <h5 className="font-bold text-xs text-primary text-uppercase mb-2 d-flex align-center gap-1">
                  <Target size={14} className="text-brand" /> Desired Outcome & Impact
                </h5>
                <p className="text-xs text-secondary mb-0" style={{ lineHeight: '1.55' }}>
                  {plan.desiredOutcome || (plan.goals && plan.goals.join('. ')) || 'Outcome metrics under definition.'}
                </p>
              </div>
            </div>

            {/* Proposed Approach */}
            <div className="card p-3" style={{ background: '#ffffff', border: '1px solid var(--border-light)' }}>
              <h5 className="font-bold text-xs text-primary text-uppercase mb-2 d-flex align-center gap-1">
                <Sparkles size={14} className="text-amber" /> Proposed Approach & Methodology
              </h5>
              <p className="text-xs text-secondary mb-0" style={{ lineHeight: '1.55' }}>
                {plan.proposedApproach || 'Community collaborative approach formulated by working group.'}
              </p>
            </div>

            {/* Resources, Location & Affected Parties */}
            <div className="grid-3 gap-3">
              <div className="card p-3" style={{ background: '#ffffff', border: '1px solid var(--border-light)' }}>
                <h5 className="font-bold text-xs text-primary text-uppercase mb-2 d-flex align-center gap-1">
                  <Package size={14} className="text-blue-600" /> Resources Needed
                </h5>
                <p className="text-xs text-secondary mb-0" style={{ lineHeight: '1.45' }}>
                  {plan.resourcesNeeded || 'Equipment and volunteer materials under assessment.'}
                </p>
              </div>

              <div className="card p-3" style={{ background: '#ffffff', border: '1px solid var(--border-light)' }}>
                <h5 className="font-bold text-xs text-primary text-uppercase mb-2 d-flex align-center gap-1">
                  <MapPin size={14} className="text-rose" /> Location & Scope
                </h5>
                <p className="text-xs text-secondary mb-0" style={{ lineHeight: '1.45' }}>
                  {plan.location || 'Maplewood District'}
                </p>
              </div>

              <div className="card p-3" style={{ background: '#ffffff', border: '1px solid var(--border-light)' }}>
                <h5 className="font-bold text-xs text-primary text-uppercase mb-2 d-flex align-center gap-1">
                  <Users size={14} className="text-purple" /> Who Might Be Affected?
                </h5>
                <p className="text-xs text-secondary mb-0" style={{ lineHeight: '1.45' }}>
                  {plan.affectedParties || 'Local residents, downstream neighbors, and community.'}
                </p>
              </div>
            </div>

            {/* Relevant Evidence & Observations */}
            {linkedObs.length > 0 && (
              <div className="card p-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
                <h5 className="font-bold text-xs text-primary text-uppercase mb-2 d-flex align-center gap-1">
                  <Link2 size={14} className="text-brand" /> Relevant Field Evidence & Baseline Observations
                </h5>
                <div className="d-flex flex-column gap-2">
                  {linkedObs.map(o => (
                    <div 
                      key={o.id} 
                      className="p-2.5 rounded text-xs bg-white border card-interactive cursor-pointer d-flex align-center justify-between"
                      onClick={() => inspectEntity(o, 'observation')}
                      title={`Inspect observation: ${o.title}`}
                    >
                      <div className="min-w-0">
                        <strong className="text-primary d-block">Observation: {o.title}</strong>
                        <span className="text-muted">{o.description} {o.location?.address ? `(${o.location.address})` : ''}</span>
                      </div>
                      <span className="badge badge-primary text-xs d-flex align-center gap-1 flex-shrink-0 ml-2">
                        <Eye size={11} /> View
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="d-flex justify-between align-center pt-2 border-top">
              <span className="text-xs text-muted">
                Proposed by {plan.proposer?.name || 'Community Member'} • Current Draft: {plan.currentVersion || 'v1.0'}
              </span>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => openRevisePlanModal(plan)}
                >
                  <Edit3 size={13} />
                  <span>Propose Revision</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setActiveTab('critique')}
                >
                  <span>Critique & Suggest Alternatives →</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: COLLABORATIVE CRITIQUE & DISCUSSION               */}
        {/* ========================================================= */}
        {activeTab === 'critique' && (
          <PlanFeedbackSection plan={plan} />
        )}

        {/* ========================================================= */}
        {/* TAB 3: VISIBLE REVISION HISTORY & REASONING               */}
        {/* ========================================================= */}
        {activeTab === 'revisions' && (
          <div className="d-flex flex-column gap-3">
            <div className="d-flex align-center justify-between pb-2 border-bottom flex-wrap gap-2">
              <div>
                <h4 className="font-bold text-sm text-primary d-flex align-center gap-2">
                  <History size={16} className="text-brand" />
                  <span>Transparent Revision History & Reasoning</span>
                </h4>
                <p className="text-xs text-muted mb-0">
                  Every change to the proposal and the underlying rationale remain permanently visible.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => openRevisePlanModal(plan)}
              >
                <Edit3 size={13} />
                <span>+ Publish New Revision</span>
              </button>
            </div>

            <div className="d-flex flex-column gap-3">
              {plan.revisionHistory && plan.revisionHistory.length > 0 ? (
                <>
                  {revisionsPagination.paginatedItems.map((rev, idx) => (
                    <div 
                      key={idx} 
                      className="card p-3" 
                      style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}
                    >
                      <div className="d-flex align-center justify-between mb-2">
                        <div className="d-flex align-center gap-2">
                          <span className="badge badge-primary font-bold text-xs">{rev.version}</span>
                          <span className="font-bold text-xs text-primary">{rev.summaryOfChanges}</span>
                        </div>
                        <span className="text-xs text-muted">{rev.date} • by {rev.revisedBy}</span>
                      </div>

                      <div className="p-2 rounded text-xs mb-2" style={{ background: 'var(--bg-subtle)' }}>
                        <strong className="text-primary d-block mb-1">Reasoning for Changes & Community Feedback Addressed:</strong>
                        <p className="text-secondary mb-0" style={{ lineHeight: '1.45' }}>{rev.reasoningForChanges}</p>
                      </div>

                      {rev.incorporatedFeedbackIds && rev.incorporatedFeedbackIds.length > 0 && (
                        <div className="d-flex align-center gap-2 text-xs text-muted pt-1">
                          <CheckCircle2 size={12} className="text-brand" />
                          <span>Incorporated {rev.incorporatedFeedbackIds.length} community feedback items</span>
                        </div>
                      )}
                    </div>
                  ))}
                  <Pagination
                    compact={true}
                    currentPage={revisionsPagination.currentPage}
                    totalPages={revisionsPagination.totalPages}
                    totalItems={revisionsPagination.totalItems}
                    startIndex={revisionsPagination.startIndex}
                    endIndex={revisionsPagination.endIndex}
                    onPageChange={revisionsPagination.setPage}
                    pageSize={revisionsPagination.pageSize}
                    onPageSizeChange={revisionsPagination.handlePageSizeChange}
                    itemName="revisions"
                  />
                </>
              ) : (
                <div className="p-4 text-center text-xs text-muted">
                  Initial version (v1.0) active. No revisions published yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: MILESTONES CHECKLIST                               */}
        {/* ========================================================= */}
        {activeTab === 'milestones' && (
          <div className="card p-4" style={{ background: '#ffffff', border: '1px solid var(--border-light)' }}>
            <div className="d-flex align-center justify-between mb-3 pb-2 border-bottom">
              <div>
                <h4 className="font-bold text-sm text-primary d-flex align-center gap-2">
                  <CheckCircle2 size={16} className="text-brand" />
                  <span>Milestones & Action Steps ({completedMilestones}/{totalMilestones} Completed)</span>
                </h4>
                <p className="text-xs text-muted mb-0">Track real-world implementation progress without fake percentages</p>
              </div>
              <span className="text-xs text-muted">Click milestone to toggle status</span>
            </div>

            <div className="d-flex flex-column gap-2">
              {milestonesPagination.paginatedItems.map((m) => {
                const isCompleted = m.status === 'completed';
                return (
                  <div 
                    key={m.id} 
                    className="d-flex align-start gap-3 p-2 rounded card-interactive cursor-pointer"
                    style={{
                      background: isCompleted ? 'var(--primary-50)' : 'var(--bg-subtle)',
                      border: '1px solid var(--border-light)'
                    }}
                    onClick={() => togglePlanMilestone(plan.id, m.id)}
                  >
                    <div 
                      className="d-flex align-center justify-center mt-1" 
                      style={{
                        width: '20px', 
                        height: '20px', 
                        borderRadius: '4px', 
                        background: isCompleted ? 'var(--primary-600)' : '#ffffff',
                        border: isCompleted ? 'none' : '2px solid var(--border-default)',
                        color: '#ffffff',
                        flexShrink: 0
                      }}
                    >
                      {isCompleted && <Check size={14} />}
                    </div>

                    <div className="flex-1">
                      <div className="d-flex align-center justify-between flex-wrap gap-1">
                        <span className={`text-xs font-semibold ${isCompleted ? 'text-primary' : 'text-secondary'}`} style={{ textDecoration: isCompleted ? 'line-through' : 'none' }}>
                          {m.title}
                        </span>
                        <div className="d-flex align-center gap-2">
                          <MilestoneStatusBadge status={m.status} />
                          <span className="text-xs text-muted">Due: {m.dueDate}</span>
                          {canUserManage(plan) && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs text-rose p-0 d-flex align-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Are you sure you want to delete milestone "${m.title}"?`)) {
                                  deletePlanMilestone(plan.id, m.id);
                                }
                              }}
                              title="Delete milestone"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="d-flex align-center gap-3 text-xs text-muted mt-1 flex-wrap">
                        <span>Assigned to: {m.assignedTo || 'Community'}</span>
                        {m.completedDate && <span className="text-brand font-medium">Completed on {m.completedDate}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              <Pagination
                compact={true}
                currentPage={milestonesPagination.currentPage}
                totalPages={milestonesPagination.totalPages}
                totalItems={milestonesPagination.totalItems}
                startIndex={milestonesPagination.startIndex}
                endIndex={milestonesPagination.endIndex}
                onPageChange={milestonesPagination.setPage}
                pageSize={milestonesPagination.pageSize}
                onPageSizeChange={milestonesPagination.handlePageSizeChange}
                itemName="milestones"
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: TRANSPARENT DECISION LOG                           */}
        {/* ========================================================= */}
        {activeTab === 'decisions' && (
          <div className="card p-4" style={{ background: '#ffffff', border: '1px solid var(--border-light)' }}>
            <div className="d-flex align-center justify-between mb-3 pb-2 border-bottom flex-wrap gap-2">
              <div>
                <h4 className="font-bold text-sm text-primary d-flex align-center gap-2">
                  <FileText size={16} className="text-purple" />
                  <span>Transparent Decision Log ({plan.decisions?.length || 0})</span>
                </h4>
                <p className="text-xs text-muted mb-0">
                  Permanent record of choices made, trade-offs weighed, and rationale (automatically updated with every revision).
                </p>
              </div>
              <button
                className="btn btn-primary btn-xs font-semibold d-flex align-center gap-1"
                onClick={() => setIsAddingDecision(!isAddingDecision)}
              >
                <Plus size={13} />
                <span>+ Log Operational Decision</span>
              </button>
            </div>

            {/* Explanatory Info Alert */}
            <div className="card p-2 px-3 mb-3 d-flex align-center justify-between flex-wrap gap-2 text-xs" style={{ background: 'var(--purple-50)', border: '1px solid var(--purple-200)', color: 'var(--purple-900)' }}>
              <span className="d-flex align-center gap-1">
                <Sparkles size={14} className="text-purple-600" />
                <span><strong>Auto-Linked Governance:</strong> Revisions automatically log their rationale here. Fieldwork choices can also be recorded manually.</span>
              </span>
            </div>

            {/* Add decision inline form */}
            {isAddingDecision && (
              <form onSubmit={handleAddDecision} className="card p-3 mb-3 animate-fade-in" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}>
                <span className="font-bold text-xs text-primary d-block mb-2">Record Fieldwork / Strategic Decision</span>
                <div className="d-flex flex-column gap-2">
                  <input
                    type="text"
                    placeholder="Decision title (e.g. Selected biological willow fascines over concrete channelization)"
                    value={newDecisionTitle}
                    onChange={(e) => setNewDecisionTitle(e.target.value)}
                    className="form-input"
                    required
                  />
                  <textarea
                    placeholder="Transparent Rationale: Why was this option chosen? What alternatives or trade-offs were weighed?"
                    value={newDecisionRationale}
                    onChange={(e) => setNewDecisionRationale(e.target.value)}
                    rows={2}
                    className="form-textarea"
                    required
                  />
                  <div className="d-flex justify-end gap-2">
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => setIsAddingDecision(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary btn-xs">Save to Permanent Log</button>
                  </div>
                </div>
              </form>
            )}

            <div className="d-flex flex-column gap-2">
              {plan.decisions && plan.decisions.length > 0 ? (
                <>
                  {decisionsPagination.paginatedItems.map((dec) => {
                    const isRevision = Boolean(dec.versionTag || dec.isRevisionDecision);
                    return (
                      <div 
                        key={dec.id} 
                        className="p-3 rounded text-xs" 
                        style={{ 
                          background: isRevision ? '#ffffff' : 'var(--bg-subtle)', 
                          border: isRevision ? '1px solid var(--purple-200)' : '1px solid var(--border-light)' 
                        }}
                      >
                        <div className="d-flex align-center justify-between mb-1 flex-wrap gap-1">
                          <div className="d-flex align-center gap-2">
                            {isRevision ? (
                              <button
                                type="button"
                                className="badge badge-purple font-bold text-xs cursor-pointer border-0"
                                onClick={() => setActiveTab('revisions')}
                                title="Click to view full revision changelog"
                              >
                                🔗 Revision {dec.versionTag || 'Update'} Decision
                              </button>
                            ) : (
                              <span className="badge badge-secondary font-bold text-xs">
                                ⚙️ Operational Decision
                              </span>
                            )}
                            <span className="font-bold text-primary">{dec.title}</span>
                          </div>
                          <div className="d-flex align-center gap-2">
                            <span className="text-muted">{dec.date} • {dec.decidedBy}</span>
                            {canUserManage(plan) && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs text-rose p-0 d-flex align-center"
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete decision "${dec.title}"?`)) {
                                    deletePlanDecision(plan.id, dec.id);
                                  }
                                }}
                                title="Delete decision"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-secondary mb-1" style={{ lineHeight: '1.45' }}>
                          <strong className="text-primary">Rationale: </strong>{dec.rationale}
                        </p>

                        {dec.incorporatedFeedbackIds && dec.incorporatedFeedbackIds.length > 0 && (
                          <div className="d-flex align-center gap-1 text-muted pt-1 border-top mt-1" style={{ fontSize: '0.7rem' }}>
                            <CheckCircle2 size={11} className="text-brand" />
                            <span>Directly resolved {dec.incorporatedFeedbackIds.length} community feedback item(s)</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <Pagination
                    compact={true}
                    currentPage={decisionsPagination.currentPage}
                    totalPages={decisionsPagination.totalPages}
                    totalItems={decisionsPagination.totalItems}
                    startIndex={decisionsPagination.startIndex}
                    endIndex={decisionsPagination.endIndex}
                    onPageChange={decisionsPagination.setPage}
                    pageSize={decisionsPagination.pageSize}
                    onPageSizeChange={decisionsPagination.handlePageSizeChange}
                    itemName="decisions"
                  />
                </>
              ) : (
                <div className="p-4 text-center text-xs text-muted">
                  No decisions recorded yet. Decisions are automatically logged when revisions are published.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: OUTCOME & REAL-WORLD RESULTS EVALUATION            */}
        {/* ========================================================= */}
        {activeTab === 'outcomes' && (
          <div className="d-flex flex-column gap-3">
            {plan.outcomeReport ? (
              <>
                {/* 1. Header & Outcome Status Banner */}
                <div className="card p-3" style={{ background: '#ffffff', border: '1px solid var(--border-light)' }}>
                  <div className="d-flex align-center justify-between flex-wrap gap-2 mb-2 pb-2 border-bottom">
                    <div className="d-flex align-center gap-2">
                      {plan.outcomeReport.outcomeStatus === 'achieved' && (
                        <span className="badge font-bold text-xs d-flex align-center gap-1" style={{ background: 'rgba(220, 252, 231, 0.9)', color: '#166534', border: '1px solid #86efac' }}>
                          <CheckCircle2 size={13} />
                          <span>🟢 Goal Achieved</span>
                        </span>
                      )}
                      {plan.outcomeReport.outcomeStatus === 'partially_achieved' && (
                        <span className="badge font-bold text-xs d-flex align-center gap-1" style={{ background: 'rgba(254, 249, 195, 0.9)', color: '#854d0e', border: '1px solid #fde047' }}>
                          <AlertTriangle size={13} />
                          <span>🟡 Partially Achieved</span>
                        </span>
                      )}
                      {plan.outcomeReport.outcomeStatus === 'not_achieved' && (
                        <span className="badge font-bold text-xs d-flex align-center gap-1" style={{ background: 'rgba(254, 226, 226, 0.9)', color: '#991b1b', border: '1px solid #fca5a5' }}>
                          <XCircle size={13} />
                          <span>🔴 Not Achieved</span>
                        </span>
                      )}
                      <span className="text-xs text-muted">
                        Evaluated {plan.outcomeReport.evaluatedAt} by {plan.outcomeReport.evaluator || 'Coordinators'}
                      </span>
                    </div>

                    {isAuthorOrCoordinator && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs d-flex align-center gap-1 font-semibold"
                        onClick={() => openLogOutcomeModal(plan)}
                      >
                        <Edit3 size={13} />
                        <span>Edit Evaluation Report</span>
                      </button>
                    )}
                  </div>

                  {/* Target Goal */}
                  <div className="mb-3">
                    <span className="text-xs font-bold text-muted text-uppercase d-flex align-center gap-1 mb-1">
                      <Target size={13} className="text-brand" /> Goal Evaluated
                    </span>
                    <p className="text-xs font-medium text-primary mb-0" style={{ lineHeight: '1.5' }}>
                      {plan.outcomeReport.goal}
                    </p>
                  </div>

                  {/* Actual Results Itemized List */}
                  <div>
                    <span className="text-xs font-bold text-muted text-uppercase d-flex align-center gap-1 mb-2">
                      <CheckCircle2 size={13} className="text-brand" /> Actual Results Achieved
                    </span>
                    <div className="d-flex flex-column gap-1.5">
                      {plan.outcomeReport.actualResults?.map((res, i) => (
                        <div key={i} className="d-flex align-start gap-2 p-2 rounded" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--primary-100)', color: 'var(--primary-800)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.65rem', fontWeight: 700, marginTop: '1px' }}>
                            {i + 1}
                          </div>
                          <span className="text-xs text-primary font-medium flex-1">{res}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Supporting Evidence */}
                <div className="card p-3" style={{ background: '#ffffff', border: '1px solid var(--border-light)' }}>
                  <span className="text-xs font-bold text-muted text-uppercase d-flex align-center gap-1 mb-2">
                    <FileCheck size={13} className="text-blue-600" /> Supporting Evidence & Field Verification
                  </span>
                  <div className="d-flex align-center gap-1.5 flex-wrap mb-2">
                    {plan.outcomeReport.evidenceTypes?.map((et, idx) => (
                      <span key={idx} className="badge badge-secondary text-xs" style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}>
                        ✓ {et}
                      </span>
                    ))}
                  </div>

                  {linkedObs.length > 0 && (
                    <div className="pt-2 border-top">
                      <span className="text-xs text-muted d-block mb-1 font-semibold">Attached Field Observations:</span>
                      <div className="d-flex flex-column gap-1">
                        {linkedObs.map(o => (
                          <div key={o.id} className="d-flex align-center gap-1.5 text-xs text-primary">
                            <Eye size={12} className="text-brand" />
                            <span className="font-medium">{o.title}</span>
                            <span className="text-muted" style={{ fontSize: '0.68rem' }}>({o.category})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Unexpected Effects */}
                {plan.outcomeReport.unexpectedEffects && (
                  <div className="card p-3" style={{ background: 'rgba(254, 243, 199, 0.4)', border: '1px solid #fde68a' }}>
                    <h5 className="font-bold text-xs text-amber-900 text-uppercase mb-1 d-flex align-center gap-1.5">
                      <AlertCircle size={14} className="text-amber" /> Unexpected Effects & Side Impacts
                    </h5>
                    <p className="text-xs text-secondary mb-0" style={{ lineHeight: '1.5' }}>
                      {plan.outcomeReport.unexpectedEffects}
                    </p>
                  </div>
                )}

                {/* 4. Lessons & Guidance for Future Projects */}
                <div className="grid-2 gap-3">
                  {plan.outcomeReport.lessons && (
                    <div className="card p-3" style={{ background: '#ffffff', border: '1px solid var(--border-light)' }}>
                      <h5 className="font-bold text-xs text-purple text-uppercase mb-1.5 d-flex align-center gap-1.5">
                        <Lightbulb size={14} className="text-purple-600" /> Operational Lessons Learned
                      </h5>
                      <p className="text-xs text-secondary mb-0" style={{ lineHeight: '1.5' }}>
                        {plan.outcomeReport.lessons}
                      </p>
                    </div>
                  )}

                  {plan.outcomeReport.guidanceForFuture && (
                    <div className="card p-3" style={{ background: '#ffffff', border: '1px solid var(--border-light)' }}>
                      <h5 className="font-bold text-xs text-primary text-uppercase mb-1.5 d-flex align-center gap-1.5">
                        <Compass size={14} className="text-blue-600" /> Guidance for Future Projects
                      </h5>
                      <p className="text-xs text-secondary mb-0" style={{ lineHeight: '1.5' }}>
                        {plan.outcomeReport.guidanceForFuture}
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="card p-4 text-center" style={{ background: 'var(--bg-subtle)', border: '1px dashed var(--border-default)' }}>
                <Compass size={32} className="text-brand mb-2 mx-auto d-block opacity-75" />
                <h4 className="font-bold text-sm text-primary mb-1">Outcome Evaluation Pending</h4>
                <p className="text-xs text-muted mb-3 mx-auto" style={{ maxWidth: '460px', lineHeight: '1.5' }}>
                  This long-term proposal is currently in <strong>{plan.lifecycleStage?.replace('_', ' ')}</strong> stage. Once implementation milestones are delivered, coordinators log real-world verified results, unexpected effects, lessons, and future guidance.
                </p>
                {isAuthorOrCoordinator && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm mx-auto d-inline-flex align-center gap-1.5"
                    onClick={() => openLogOutcomeModal(plan)}
                  >
                    <CheckCircle2 size={15} />
                    <span>Log Outcome & Results Evaluation</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Linked CareMesh Entity Mesh */}
        {(linkedRequests.length > 0 || linkedObs.length > 0) && (
          <div className="card p-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
            <h5 className="font-bold text-xs text-primary mb-2 d-flex align-center gap-1">
              <Link2 size={14} className="text-brand" /> Connected CareMesh Network Entities
            </h5>
            <div className="grid-2 gap-2 text-xs">
              {linkedRequests.length > 0 && (
                <div>
                  <strong className="text-muted d-block mb-1">Linked Help Requests & Actions:</strong>
                  {linkedRequests.map(r => (
                    <div 
                      key={r.id} 
                      className="p-1.5 mb-1 rounded bg-white border card-interactive cursor-pointer d-flex align-center justify-between"
                      onClick={() => viewRequestDetail(r)}
                      title={`Inspect request: ${r.title}`}
                    >
                      <span className="text-primary truncate">
                        • <strong>{r.title}</strong> {r.scheduledDate ? `(${r.scheduledDate}${r.scheduledTime ? ` · ${r.scheduledTime}` : ''})` : ''}
                      </span>
                      <span className="badge badge-secondary text-xs flex-shrink-0 ml-1">View</span>
                    </div>
                  ))}
                </div>
              )}
              {linkedObs.length > 0 && (
                <div>
                  <strong className="text-muted d-block mb-1">Linked Field Observations:</strong>
                  {linkedObs.map(o => (
                    <div 
                      key={o.id} 
                      className="p-1.5 mb-1 rounded bg-white border card-interactive cursor-pointer d-flex align-center justify-between"
                      onClick={() => inspectEntity(o, 'observation')}
                      title={`Inspect observation: ${o.title}`}
                    >
                      <span className="text-primary truncate">• <strong>{o.title}</strong></span>
                      <span className="badge badge-primary text-xs flex-shrink-0 ml-1">View</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Real-World Evaluated Outcome Banner (Visible on all tabs when report exists) */}
        {plan.outcomeReport && activeTab !== 'outcomes' && (
          <div 
            className="card p-3 cursor-pointer card-interactive" 
            style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-200)' }}
            onClick={() => setActiveTab('outcomes')}
            title="Click to view full outcome evaluation report"
          >
            <div className="d-flex align-center justify-between gap-2 mb-1">
              <div className="d-flex align-center gap-2">
                <span className="text-xs font-bold text-brand text-uppercase d-flex align-center gap-1">
                  <Compass size={13} /> Real-World Evaluated Outcome
                </span>
                {plan.outcomeReport.outcomeStatus === 'achieved' && (
                  <span className="badge font-bold text-xs" style={{ background: '#dcfce7', color: '#166534', fontSize: '0.65rem' }}>
                    🟢 Achieved
                  </span>
                )}
                {plan.outcomeReport.outcomeStatus === 'partially_achieved' && (
                  <span className="badge font-bold text-xs" style={{ background: '#fef9c3', color: '#854d0e', fontSize: '0.65rem' }}>
                    🟡 Partially Achieved
                  </span>
                )}
                {plan.outcomeReport.outcomeStatus === 'not_achieved' && (
                  <span className="badge font-bold text-xs" style={{ background: '#fee2e2', color: '#991b1b', fontSize: '0.65rem' }}>
                    🔴 Not Achieved
                  </span>
                )}
              </div>
              <span className="text-xs text-brand font-semibold d-flex align-center gap-0.5">
                <span>View Full Report</span>
                <ArrowRight size={12} />
              </span>
            </div>
            <p className="text-xs text-secondary mb-0 text-truncate">
              {plan.outcomeReport.actualResults?.[0] || plan.outcomesEvaluation}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="d-flex align-center justify-between gap-2 pt-2 border-top">
          <button
            type="button"
            className="btn btn-secondary btn-sm d-flex align-center gap-1"
            onClick={() => openShareSocialModal(plan, 'plan')}
            title="Share this resilience plan"
          >
            <Share2 size={13} />
            <span>Share Plan</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
