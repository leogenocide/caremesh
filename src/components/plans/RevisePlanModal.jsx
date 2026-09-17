import { useState } from 'react';
import { Modal } from '../common/Modal';
import { useCareMesh } from '../../context/useCareMesh';
import { FeedbackTypeBadge } from '../common/Badge';
import { 
  FileEdit, 
  Send, 
  CheckSquare, 
  Sparkles, 
  AlertCircle
} from 'lucide-react';

const RevisePlanForm = ({ plan, onClose, onRevise }) => {
  const [title, setTitle] = useState(plan.title || '');
  const [problemStatement, setProblemStatement] = useState(plan.problemStatement || '');
  const [desiredOutcome, setDesiredOutcome] = useState(plan.desiredOutcome || '');
  const [proposedApproach, setProposedApproach] = useState(plan.proposedApproach || '');
  const [resourcesNeeded, setResourcesNeeded] = useState(plan.resourcesNeeded || '');
  const [affectedParties, setAffectedParties] = useState(plan.affectedParties || '');
  const [summaryOfChanges, setSummaryOfChanges] = useState('');
  const [reasoningForChanges, setReasoningForChanges] = useState('');
  const [selectedFeedbackIds, setSelectedFeedbackIds] = useState([]);

  const currentV = plan.currentVersion || 'v1.0';
  const parts = currentV.replace('v', '').split('.');
  const major = parseInt(parts[0] || '1', 10);
  const minor = parseInt(parts[1] || '0', 10) + 1;
  const nextVersion = `v${major}.${minor}`;

  const toggleSelectFeedback = (id) => {
    if (selectedFeedbackIds.includes(id)) {
      setSelectedFeedbackIds(selectedFeedbackIds.filter(fid => fid !== id));
    } else {
      setSelectedFeedbackIds([...selectedFeedbackIds, id]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!summaryOfChanges.trim() || !reasoningForChanges.trim()) {
      alert('Please provide a summary and transparent reasoning for this revision.');
      return;
    }

    onRevise(plan.id, {
      title: title.trim(),
      problemStatement: problemStatement.trim(),
      desiredOutcome: desiredOutcome.trim(),
      proposedApproach: proposedApproach.trim(),
      resourcesNeeded: resourcesNeeded.trim(),
      affectedParties: affectedParties.trim(),
      summaryOfChanges: summaryOfChanges.trim(),
      reasoningForChanges: reasoningForChanges.trim(),
      incorporatedFeedbackIds: selectedFeedbackIds
    });
  };

  const openFeedbackItems = plan.feedback || [];

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Publish Revision (${nextVersion})`}
      subtitle={`Revise proposal based on community critique. All reasoning and changes remain permanently visible in the plan history.`}
      maxWidth="780px"
      zIndex={1100}
    >
      <form onSubmit={handleSubmit} className="d-flex flex-column gap-4">
        {/* Revision Context Ribbon */}
        <div className="card p-3" style={{ background: 'var(--purple-50)', border: '1px solid var(--purple-200)' }}>
          <div className="d-flex align-center justify-between">
            <span className="font-bold text-xs text-purple-900 d-flex align-center gap-1">
              <Sparkles size={14} className="text-purple-600" />
              <span>Current Version: {currentV} → New Version: {nextVersion}</span>
            </span>
            <span className="text-xs text-muted">Transparent Proposal Evolution</span>
          </div>
        </div>

        {/* Change Rationale & Changelog (Required) */}
        <div className="card p-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
          <h4 className="font-bold text-xs text-primary mb-2 d-flex align-center gap-1">
            <FileEdit size={14} className="text-brand" />
            <span>Reasoning & Summary of Changes (Visible in Public History)</span>
          </h4>

          <div className="d-flex flex-column gap-3">
            <div>
              <label className="form-label font-bold text-xs text-primary">Summary of What Changed</label>
              <input
                type="text"
                placeholder="e.g. Switched to low-impact dry-season hand-trenching and added geotextile silt curtain."
                value={summaryOfChanges}
                onChange={(e) => setSummaryOfChanges(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div>
              <div className="d-flex align-center justify-between mb-1">
                <label className="form-label font-bold text-xs text-primary mb-0">Transparent Reasoning & Feedback Addressed</label>
                <span className="text-muted" style={{ fontSize: '0.68rem' }}>Auto-logged to Decision Log</span>
              </div>
              <textarea
                placeholder="Explain why these modifications were made. Which community critiques, risks, or alternatives influenced this design?"
                value={reasoningForChanges}
                onChange={(e) => setReasoningForChanges(e.target.value)}
                rows={3}
                className="form-textarea"
                required
              />
              <span className="text-muted d-block mt-1" style={{ fontSize: '0.7rem' }}>
                💡 This rationale is automatically recorded as an official entry in the <strong>Decision Log</strong> so you don't have to duplicate notes.
              </span>
            </div>
          </div>
        </div>

        {/* Incorporate Community Feedback Checklist */}
        {openFeedbackItems.length > 0 && (
          <div className="card p-3" style={{ background: '#ffffff', border: '1px solid var(--border-light)' }}>
            <div className="d-flex align-center justify-between mb-2">
              <span className="font-bold text-xs text-primary d-flex align-center gap-1">
                <CheckSquare size={14} className="text-brand" />
                <span>Mark Community Feedback Adopted / Resolved by this Revision</span>
              </span>
              <span className="text-xs text-muted">{selectedFeedbackIds.length} selected</span>
            </div>

            <div className="d-flex flex-column gap-2" style={{ maxHeight: '180px', overflowY: 'auto' }}>
              {openFeedbackItems.map(fb => {
                const isSelected = selectedFeedbackIds.includes(fb.id);
                return (
                  <div
                    key={fb.id}
                    className="p-2 rounded card-interactive cursor-pointer d-flex align-start gap-2"
                    style={{
                      background: isSelected ? 'var(--primary-50)' : 'var(--bg-subtle)',
                      border: isSelected ? '1px solid var(--primary-400)' : '1px solid var(--border-light)'
                    }}
                    onClick={() => toggleSelectFeedback(fb.id)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      style={{ marginTop: '3px' }}
                    />
                    <div className="flex-1 min-w-0 text-xs">
                      <div className="d-flex align-center gap-2 mb-1">
                        <FeedbackTypeBadge type={fb.type} />
                        <span className="font-bold text-primary">{fb.author?.name}</span>
                        <span className="text-muted">({fb.date})</span>
                      </div>
                      <p className="text-secondary mb-0" style={{ lineHeight: '1.4' }}>{fb.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Core Proposal Fields to Edit */}
        <div className="d-flex flex-column gap-3">
          <h4 className="font-bold text-xs text-muted text-uppercase">Updated Proposal Specifications</h4>

          <div>
            <label className="form-label font-bold text-xs text-primary">Proposal Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div>
            <label className="form-label font-bold text-xs text-primary">What problem are we trying to solve?</label>
            <textarea
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              rows={2}
              className="form-textarea"
              required
            />
          </div>

          <div>
            <label className="form-label font-bold text-xs text-primary">Desired Outcome & Measurable Impact</label>
            <textarea
              value={desiredOutcome}
              onChange={(e) => setDesiredOutcome(e.target.value)}
              rows={2}
              className="form-textarea"
              required
            />
          </div>

          <div>
            <label className="form-label font-bold text-xs text-primary">Proposed Approach & Methodology</label>
            <textarea
              value={proposedApproach}
              onChange={(e) => setProposedApproach(e.target.value)}
              rows={3}
              className="form-textarea"
              required
            />
          </div>

          <div className="grid-2">
            <div>
              <label className="form-label font-bold text-xs text-primary">Resources & Equipment Needed</label>
              <textarea
                value={resourcesNeeded}
                onChange={(e) => setResourcesNeeded(e.target.value)}
                rows={2}
                className="form-textarea"
              />
            </div>

            <div>
              <label className="form-label font-bold text-xs text-primary">Who Might Be Affected?</label>
              <textarea
                value={affectedParties}
                onChange={(e) => setAffectedParties(e.target.value)}
                rows={2}
                className="form-textarea"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="d-flex align-center justify-between pt-3 border-top">
          <span className="text-xs text-muted d-flex align-center gap-1">
            <AlertCircle size={13} className="text-amber" />
            <span>Advancing to stage: Revised Draft</span>
          </span>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
            >
              <Send size={14} />
              <span>Publish Revision ({nextVersion})</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export const RevisePlanModal = () => {
  const { revisePlanTarget, closeRevisePlanModal, revisePlan } = useCareMesh();

  if (!revisePlanTarget) return null;

  return (
    <RevisePlanForm
      key={revisePlanTarget.id + (revisePlanTarget.currentVersion || '')}
      plan={revisePlanTarget}
      onClose={closeRevisePlanModal}
      onRevise={revisePlan}
    />
  );
};
