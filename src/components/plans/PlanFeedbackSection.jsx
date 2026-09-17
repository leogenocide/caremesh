import { useState, useEffect } from 'react';
import { useCareMesh } from '../../context/useCareMesh';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../common/Pagination';
import { FeedbackTypeBadge, FeedbackStatusBadge } from '../common/Badge';
import { 
  ThumbsUp, 
  Search, 
  Lightbulb, 
  AlertTriangle, 
  Paperclip, 
  Edit, 
  MessageSquare, 
  Send, 
  CornerDownRight 
} from 'lucide-react';

export const PlanFeedbackSection = ({ plan }) => {
  const { currentUser, addPlanFeedback, markFeedbackStatus, viewUserProfile } = useCareMesh();

  const [activeFilter, setActiveFilter] = useState('all');
  const [feedbackType, setFeedbackType] = useState('critique');
  const [feedbackText, setFeedbackText] = useState('');
  const [suggestedChange, setSuggestedChange] = useState('');
  const [isFormExpanded, setIsFormExpanded] = useState(false);

  const isProposer = Boolean(
    plan.proposer?.id === currentUser?.id || 
    plan.participants?.some(p => p.user?.id === currentUser?.id) ||
    currentUser?.isAdmin
  );

  const feedbackList = plan.feedback || [];

  const typeCounts = {
    all: feedbackList.length,
    risk: feedbackList.filter(f => f.type === 'risk').length,
    alternative: feedbackList.filter(f => f.type === 'alternative').length,
    critique: feedbackList.filter(f => f.type === 'critique').length,
    modification: feedbackList.filter(f => f.type === 'modification').length,
    evidence: feedbackList.filter(f => f.type === 'evidence').length,
    support: feedbackList.filter(f => f.type === 'support').length
  };

  const filteredFeedback = feedbackList.filter(f => {
    if (activeFilter === 'all') return true;
    return f.type === activeFilter;
  });

  const feedbackPagination = usePagination(filteredFeedback, 5);

  useEffect(() => {
    feedbackPagination.resetPage();
  }, [activeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const feedbackTypeOptions = [
    { id: 'critique', label: 'Critique', icon: <Search size={13} />, desc: 'Analytical feedback on assumptions or feasibility' },
    { id: 'alternative', label: 'Alternative', icon: <Lightbulb size={13} />, desc: 'Suggest an alternative method, timing, or design' },
    { id: 'risk', label: 'Point out Risk', icon: <AlertTriangle size={13} />, desc: 'Ecological, safety, legal, or logistical concern' },
    { id: 'modification', label: 'Modification', icon: <Edit size={13} />, desc: 'Specific amendment to goals or approach' },
    { id: 'evidence', label: 'Add Evidence', icon: <Paperclip size={13} />, desc: 'Attach data, field test, or documentation' },
    { id: 'support', label: 'Support', icon: <ThumbsUp size={13} />, desc: 'Endorse the proposal with specific reasons' },
    { id: 'comment', label: 'Comment', icon: <MessageSquare size={13} />, desc: 'General question or clarifying perspective' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    addPlanFeedback(plan.id, {
      type: feedbackType,
      text: feedbackText.trim(),
      suggestedChange: suggestedChange.trim()
    });

    setFeedbackText('');
    setSuggestedChange('');
    setIsFormExpanded(false);
  };

  return (
    <div className="card p-4" style={{ background: '#ffffff', border: '1px solid var(--border-light)' }}>
      {/* Header & Guiding Principle */}
      <div className="d-flex align-center justify-between pb-2 mb-3 border-bottom flex-wrap gap-2">
        <div>
          <h4 className="font-bold text-sm text-primary d-flex align-center gap-2">
            <Search size={16} className="text-purple" />
            <span>Collaborative Proposal Critique & Discussion ({feedbackList.length})</span>
          </h4>
          <p className="text-xs text-muted mb-0" style={{ fontSize: '0.75rem' }}>
            Criticism is treated as constructive feedback on the plan, not opposition to the person.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={() => setIsFormExpanded(true)}
        >
          <span>+ Contribute Feedback / Alternative</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="d-flex gap-1 flex-wrap mb-3 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All', count: typeCounts.all },
          { id: 'risk', label: '⚠️ Risks & Concerns', count: typeCounts.risk },
          { id: 'alternative', label: '💡 Alternatives', count: typeCounts.alternative },
          { id: 'critique', label: '🔍 Critiques', count: typeCounts.critique },
          { id: 'modification', label: '✏️ Modifications', count: typeCounts.modification },
          { id: 'evidence', label: '📎 Evidence', count: typeCounts.evidence },
          { id: 'support', label: '👍 Support', count: typeCounts.support }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            className={`btn btn-xs ${activeFilter === tab.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
            onClick={() => setActiveFilter(tab.id)}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className="badge" style={{ background: activeFilter === tab.id ? 'rgba(255,255,255,0.25)' : 'var(--bg-muted)', color: activeFilter === tab.id ? '#ffffff' : 'var(--text-secondary)', fontSize: '0.65rem', padding: '0.05rem 0.35rem' }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Interactive Feedback Creation Drawer */}
      {isFormExpanded && (
        <form onSubmit={handleSubmit} className="card p-3 mb-4 animate-fade-in" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}>
          <div className="d-flex align-center justify-between mb-2">
            <span className="font-bold text-xs text-primary">Contribute Structured Feedback on this Proposal</span>
            <button type="button" className="btn btn-ghost btn-xs text-muted" onClick={() => setIsFormExpanded(false)}>
              Cancel
            </button>
          </div>

          {/* Type Selector Pills */}
          <div className="d-flex gap-1 flex-wrap mb-3">
            {feedbackTypeOptions.map(opt => (
              <button
                key={opt.id}
                type="button"
                className={`btn btn-xs ${feedbackType === opt.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.72rem' }}
                onClick={() => setFeedbackType(opt.id)}
                title={opt.desc}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>

          {/* Feedback Body */}
          <div className="d-flex flex-column gap-2 mb-3">
            <textarea
              placeholder={
                feedbackType === 'risk' ? '⚠️ Point out a specific concern (e.g. This may disturb downstream nesting habitat...)' :
                feedbackType === 'alternative' ? '💡 Suggest an alternative approach (e.g. Could we use method Y during the dry season?)' :
                feedbackType === 'modification' ? '✏️ Suggest a specific modification to the goals, scope, or timeline...' :
                feedbackType === 'evidence' ? '📎 Cite or describe supporting evidence, observation test results, or baseline data...' :
                'Provide constructive critique, questions, or analysis on this proposal...'
              }
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={3}
              className="form-textarea"
              required
            />

            {(feedbackType === 'alternative' || feedbackType === 'modification' || feedbackType === 'risk') && (
              <div>
                <label className="form-label font-bold text-xs text-muted">Specific Proposed Amendment / Actionable Suggestion (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Add geotextile silt curtain and schedule hand-trenching for early November"
                  value={suggestedChange}
                  onChange={(e) => setSuggestedChange(e.target.value)}
                  className="form-input"
                />
              </div>
            )}
          </div>

          <div className="d-flex justify-end gap-2">
            <button type="button" className="btn btn-ghost btn-xs" onClick={() => setIsFormExpanded(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-xs d-flex align-center gap-1">
              <Send size={12} />
              <span>Publish Feedback</span>
            </button>
          </div>
        </form>
      )}

      {/* Feedback Items List */}
      <div className="d-flex flex-column gap-3">
        {filteredFeedback.length > 0 ? (
          <>
            {feedbackPagination.paginatedItems.map(item => (
              <div
                key={item.id}
                className="p-3 rounded"
                style={{
                  background: item.type === 'risk' ? 'var(--rose-50)' : item.type === 'alternative' ? 'var(--blue-50)' : 'var(--bg-subtle)',
                  border: item.type === 'risk' ? '1px solid var(--rose-200)' : item.type === 'alternative' ? '1px solid var(--blue-200)' : '1px solid var(--border-light)'
                }}
              >
                {/* Item Header */}
                <div className="d-flex align-center justify-between flex-wrap gap-2 mb-2">
                  <div 
                    className="d-flex align-center gap-2 user-profile-trigger"
                    onClick={() => viewUserProfile(item.author || currentUser)}
                    title={`View ${item.author?.name || currentUser?.name || 'Member'}'s profile & contributions`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        viewUserProfile(item.author || currentUser);
                      }
                    }}
                  >
                    <img
                      src={item.author?.avatar || currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60'}
                      alt=""
                      style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div className="d-flex align-center gap-2">
                        <span className="font-bold text-xs text-primary user-profile-name">{item.author?.name || currentUser?.name || 'Member'}</span>
                        {item.author?.role && (
                          <span className="text-muted" style={{ fontSize: '0.68rem' }}>• {item.author.role}</span>
                        )}
                      </div>
                      <span className="text-muted" style={{ fontSize: '0.68rem' }}>{item.date}</span>
                    </div>
                  </div>

                  <div className="d-flex align-center gap-2">
                    <FeedbackTypeBadge type={item.type} />
                    <FeedbackStatusBadge status={item.status} />
                  </div>
                </div>

                {/* Feedback Content */}
                <p className="text-xs text-secondary mb-2" style={{ lineHeight: '1.5' }}>
                  {item.text}
                </p>

                {/* Suggested Concrete Change */}
                {item.suggestedChange && (
                  <div 
                    className="p-2 rounded mb-2 text-xs" 
                    style={{ background: '#ffffff', border: '1px dashed var(--border-default)' }}
                  >
                    <strong className="text-primary d-block mb-1">Proposed Concrete Amendment:</strong>
                    <span className="text-secondary">{item.suggestedChange}</span>
                  </div>
                )}

                {/* Proposer Resolution Note */}
                {item.resolutionNote && (
                  <div 
                    className="d-flex align-start gap-2 p-2 rounded text-xs mt-2" 
                    style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-200)' }}
                  >
                    <CornerDownRight size={14} className="text-brand mt-1 flex-shrink-0" />
                    <div>
                      <strong className="text-primary">Author Response & Resolution:</strong>
                      <p className="text-secondary mb-0">{item.resolutionNote}</p>
                    </div>
                  </div>
                )}

                {/* Proposer Feedback Triage Actions */}
                {isProposer && item.status !== 'adopted' && (
                  <div className="d-flex align-center justify-end gap-2 pt-2 mt-2 border-top text-xs">
                    <span className="text-muted" style={{ fontSize: '0.7rem' }}>Triage:</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs text-brand p-1"
                      style={{ fontSize: '0.7rem' }}
                      onClick={() => markFeedbackStatus(plan.id, item.id, 'adopted', 'Adopted by author.')}
                    >
                      ✓ Mark Adopted
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs text-secondary p-1"
                      style={{ fontSize: '0.7rem' }}
                      onClick={() => markFeedbackStatus(plan.id, item.id, 'addressed', 'Addressed in design notes.')}
                    >
                      Mark Addressed
                    </button>
                  </div>
                )}
              </div>
            ))}
            <Pagination
              compact={true}
              currentPage={feedbackPagination.currentPage}
              totalPages={feedbackPagination.totalPages}
              totalItems={feedbackPagination.totalItems}
              startIndex={feedbackPagination.startIndex}
              endIndex={feedbackPagination.endIndex}
              onPageChange={feedbackPagination.setPage}
              pageSize={feedbackPagination.pageSize}
              onPageSizeChange={feedbackPagination.handlePageSizeChange}
              itemName="feedback submissions"
            />
          </>
        ) : (
          <div className="p-4 text-center text-xs text-muted">
            No feedback found for this filter. Be the first to contribute an assessment or alternative idea!
          </div>
        )}
      </div>
    </div>
  );
};
