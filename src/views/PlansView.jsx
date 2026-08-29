import { useState } from 'react';
import { useCareMesh } from '../context/useCareMesh';
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
        <div className="touch-scroll-x gap-1 p-1 card w-100-mobile" style={{ borderRadius: 'var(--radius-full)', background: 'var(--bg-muted)', padding: '4px' }}>
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
          <Search size={15} className="text-muted" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input
            type="text"
            placeholder="Search problem, approach, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '34px', fontSize: '0.82rem', height: '34px' }}
          />
        </div>
      </div>

      {/* Plans & Proposals List */}
      <div className="d-flex flex-column gap-4">
        {filteredPlans.map(plan => {
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

              {/* Proposal Critique & Collaboration Signals Ribbon */}
              <div 
                className="d-flex align-center justify-between p-2 px-3 mb-3 rounded flex-wrap gap-2"
                style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}
              >
                <div className="d-flex align-center gap-3 flex-wrap text-xs">
                  <span className="d-flex align-center gap-1 text-secondary font-medium">
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
              <div className="d-flex align-center justify-between pt-2 border-top text-xs text-muted">
                <div className="d-flex align-center gap-4">
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
    </div>
  );
};
