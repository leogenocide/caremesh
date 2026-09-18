import { useState, useEffect } from 'react';
import { useCareMesh } from '../context/useCareMesh';
import { usePagination } from '../hooks/usePagination';
import { Pagination } from '../components/common/Pagination';
import { EmptyState } from '../components/common/EmptyState';
import { PlanStatusBadge, LifecycleBadge } from '../components/common/Badge';
import { 
  Users, 
  FileText, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Lightbulb, 
  MessageSquare, 
  History 
} from 'lucide-react';

export const PlansView = () => {
  const { plans, viewPlanDetail, openCreateModal } = useCareMesh();
  const [searchQuery, setSearchQuery] = useState('');
  const [stageTab, setStageTab] = useState('all'); // 'all' | 'review' | 'active' | 'completed'

  const filteredPlans = plans.filter(p => {
    if (stageTab === 'review') {
      if (p.lifecycleStage !== 'community_review' && p.lifecycleStage !== 'draft' && p.lifecycleStage !== 'revised') return false;
    } else if (stageTab === 'active') {
      if (p.lifecycleStage !== 'accepted' && p.lifecycleStage !== 'active' && p.lifecycleStage !== 'actions_underway') return false;
    } else if (stageTab === 'completed') {
      if (p.lifecycleStage !== 'completed') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || 
             p.problemStatement?.toLowerCase().includes(q) ||
             p.proposedApproach?.toLowerCase().includes(q) ||
             p.desiredOutcome?.toLowerCase().includes(q);
    }
    return true;
  });

  const plansPagination = usePagination(filteredPlans, 6);

  useEffect(() => {
    plansPagination.resetPage();
  }, [stageTab, searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const reviewCount = plans.filter(p => p.lifecycleStage === 'community_review' || p.lifecycleStage === 'draft' || p.lifecycleStage === 'revised').length;
  const activeCount = plans.filter(p => p.lifecycleStage === 'accepted' || p.lifecycleStage === 'active' || p.lifecycleStage === 'actions_underway').length;
  const completedCount = plans.filter(p => p.lifecycleStage === 'completed').length;

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header */}
      <div className="d-flex align-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-primary">Long-Term Plans, Proposals & Decision Architecture</h2>
          <p className="text-xs text-muted">
            Propose solutions, evaluate risks, suggest alternatives, and transparently revise community initiatives before and during implementation.
          </p>
        </div>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => openCreateModal('plan')}
        >
          <Plus size={15} />
          <span>Propose Long-Term Plan</span>
        </button>
      </div>

      {/* Stage Tabs & Search Filter */}
      <div className="d-flex align-center justify-between gap-3 flex-wrap">
        <div className="touch-tab-nav gap-1.5 p-1.5 card w-100-mobile" style={{ borderRadius: 'var(--radius-full)', background: 'var(--bg-muted)' }}>
          <button
            type="button"
            className={`btn btn-sm ${stageTab === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 'var(--radius-full)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            onClick={() => setStageTab('all')}
          >
            <span>All Proposals ({plans.length})</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${stageTab === 'review' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 'var(--radius-full)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            onClick={() => setStageTab('review')}
          >
            <span>🔍 In Review ({reviewCount})</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${stageTab === 'active' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 'var(--radius-full)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            onClick={() => setStageTab('active')}
          >
            <span>⚡ Active ({activeCount})</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${stageTab === 'completed' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 'var(--radius-full)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            onClick={() => setStageTab('completed')}
          >
            <span>✓ Completed ({completedCount})</span>
          </button>
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
          <Search size={15} className="text-muted" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search problem, approach, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '34px', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Plans & Proposals List */}
      {plansPagination.paginatedItems.length === 0 ? (
        <EmptyState
          icon={<FileText size={36} className="text-muted" />}
          title="No Long-Term Plans Found"
          description={searchQuery || stageTab !== 'all' ? "No proposals match your search or stage filter. Try adjusting your search query or selecting 'All Proposals'." : "There are currently no long-term proposals or civic initiatives registered."}
          action={(
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => openCreateModal('plan')}
            >
              <Plus size={14} />
              <span>Propose Long-Term Plan</span>
            </button>
          )}
        />
      ) : (
        <div className="d-flex flex-column gap-4">
          {plansPagination.paginatedItems.map(plan => {
          const feedbackList = plan.feedback || [];
          const riskCount = feedbackList.filter(f => f.type === 'risk').length;
          const altCount = feedbackList.filter(f => f.type === 'alternative').length;
          const adoptedCount = feedbackList.filter(f => f.status === 'adopted').length;
          const revisionCount = plan.revisionHistory?.length || 1;

          const totalMilestones = plan.milestones?.length || 0;
          const doneMilestones = plan.milestones?.filter(m => m.status === 'completed').length || 0;

          return (
            <div
              key={plan.id}
              className="card p-4 card-interactive cursor-pointer"
              onClick={() => viewPlanDetail(plan)}
            >
              {/* Card Header */}
              <div className="d-flex align-center justify-between mb-2 flex-wrap gap-2">
                <div className="d-flex align-center gap-2">
                  <span className="badge badge-primary font-bold text-xs">
                    {plan.currentVersion || 'v1.0'}
                  </span>
                  <LifecycleBadge stage={plan.lifecycleStage} />
                  <PlanStatusBadge status={plan.overallStatus || 'planning'} />
                  {plan.outcomeReport?.outcomeStatus === 'achieved' && (
                    <span className="badge font-bold text-xs" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }}>
                      🟢 Achieved
                    </span>
                  )}
                  {plan.outcomeReport?.outcomeStatus === 'partially_achieved' && (
                    <span className="badge font-bold text-xs" style={{ background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047' }}>
                      🟡 Partial
                    </span>
                  )}
                  {plan.outcomeReport?.outcomeStatus === 'not_achieved' && (
                    <span className="badge font-bold text-xs" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>
                      🔴 Not Met
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted">
                  Proposed by {plan.proposer?.name || 'Community Member'} • Updated {plan.updates?.[0]?.date || 'Recently'}
                </span>
              </div>

              <h3 className="font-bold text-lg text-primary mb-2">{plan.title}</h3>
              
              {/* Problem Statement */}
              <p className="text-xs text-secondary mb-2" style={{ lineHeight: '1.5' }}>
                <strong className="text-primary">Problem:</strong> {plan.problemStatement}
              </p>

              {/* Proposed Approach Preview */}
              {plan.proposedApproach && (
                <p className="text-xs text-muted mb-3" style={{ lineHeight: '1.45' }}>
                  <strong>Proposed Approach:</strong> {plan.proposedApproach}
                </p>
              )}

              {/* Evaluated Outcome Snapshot (if completed/evaluated) */}
              {plan.outcomeReport && (
                <div 
                  className="d-flex align-center justify-between p-2.5 px-3.5 mb-3 rounded gap-2"
                  style={{ 
                    background: plan.outcomeReport.outcomeStatus === 'achieved' ? 'rgba(220, 252, 231, 0.45)' : plan.outcomeReport.outcomeStatus === 'partially_achieved' ? 'rgba(254, 249, 195, 0.45)' : 'rgba(254, 226, 226, 0.45)', 
                    border: '1px solid var(--border-light)' 
                  }}
                >
                  <div className="d-flex align-center gap-2 text-xs text-primary min-w-0">
                    <span className="font-bold text-xs flex-shrink-0" style={{ color: plan.outcomeReport.outcomeStatus === 'achieved' ? '#166534' : plan.outcomeReport.outcomeStatus === 'partially_achieved' ? '#854d0e' : '#991b1b' }}>
                      {plan.outcomeReport.outcomeStatus === 'achieved' ? '🟢 Verified Result:' : plan.outcomeReport.outcomeStatus === 'partially_achieved' ? '🟡 Partial Result:' : '🔴 Outcome:'}
                    </span>
                    <span className="text-secondary text-truncate font-medium">{plan.outcomeReport.actualResults?.[0] || plan.outcomesEvaluation}</span>
                  </div>
                  <span className="text-xs text-brand font-semibold flex-shrink-0 d-none d-sm-inline">Full Evaluation →</span>
                </div>
              )}

              {/* Proposal Critique & Collaboration Signals Ribbon */}
              <div 
                className="d-flex align-center justify-between p-2.5 px-3.5 mb-3 rounded flex-wrap gap-2.5"
                style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}
              >
                <div className="d-flex align-center gap-3 flex-wrap text-xs">
                  <span className="d-flex align-center gap-1.5 text-secondary font-medium">
                    <MessageSquare size={13} className="text-purple" />
                    <strong>{feedbackList.length}</strong> Community Critiques
                  </span>

                  {riskCount > 0 && (
                    <span className="d-flex align-center gap-1 text-rose font-bold">
                      <AlertTriangle size={13} />
                      {riskCount} {riskCount === 1 ? 'Risk Alert' : 'Risk Alerts'}
                    </span>
                  )}

                  {altCount > 0 && (
                    <span className="d-flex align-center gap-1 text-blue-700 font-bold">
                      <Lightbulb size={13} />
                      {altCount} {altCount === 1 ? 'Alternative' : 'Alternatives'}
                    </span>
                  )}

                  {adoptedCount > 0 && (
                    <span className="d-flex align-center gap-1 text-brand font-bold">
                      <CheckCircle2 size={13} />
                      {adoptedCount} Feedback Adopted
                    </span>
                  )}
                </div>

                <div className="d-flex align-center gap-2 text-xs text-muted">
                  <History size={13} />
                  <span>{revisionCount} {revisionCount === 1 ? 'Revision' : 'Revisions'}</span>
                  <span>•</span>
                  <span>Milestones: {doneMilestones}/{totalMilestones}</span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="d-flex align-center justify-between pt-3 border-top text-xs text-muted flex-wrap gap-2">
                <div className="d-flex align-center gap-3 flex-wrap">
                  <span className="d-flex align-center gap-1">
                    <Users size={13} /> {plan.participants?.length || 1} Working Group Members
                  </span>
                  <span className="d-flex align-center gap-1">
                    <FileText size={13} /> {plan.decisions?.length || 0} Decisions Logged
                  </span>
                </div>

                <button
                  className="btn btn-ghost btn-sm text-brand font-semibold p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    viewPlanDetail(plan);
                  }}
                >
                  Inspect Proposal, Critique & History →
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Pagination Controls */}
      {plansPagination.totalPages > 1 && (
        <Pagination
        currentPage={plansPagination.currentPage}
        totalPages={plansPagination.totalPages}
        totalItems={plansPagination.totalItems}
        startIndex={plansPagination.startIndex}
        endIndex={plansPagination.endIndex}
        onPageChange={plansPagination.setPage}
        pageSize={plansPagination.pageSize}
        onPageSizeChange={plansPagination.handlePageSizeChange}
        pageSizeOptions={[3, 6, 12]}
        itemName="community plans"
      />
      )}
    </div>
  );
};
