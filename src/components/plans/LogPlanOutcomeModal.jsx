import { useState } from 'react';
import { Modal } from '../common/Modal';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Plus, 
  Trash2, 
  FileCheck, 
  Lightbulb, 
  Compass, 
  AlertCircle,
  Eye,
  Check
} from 'lucide-react';

const LogPlanOutcomeForm = ({ plan, onClose }) => {
  const { logPlanOutcomeReport, observations, currentUser } = useCareMesh();

  const existing = plan.outcomeReport;
  const [goal, setGoal] = useState(
    () => existing?.goal || plan.desiredOutcome || plan.problemStatement || ''
  );
  const [actualResults, setActualResults] = useState(() => {
    if (existing?.actualResults && existing.actualResults.length > 0) {
      return existing.actualResults;
    }
    const completedCount = plan.milestones?.filter(m => m.status === 'completed').length || 0;
    return [
      completedCount > 0
        ? `${completedCount} implementation milestones completed and verified`
        : 'Project implementation deliverables completed and verified by working group'
    ];
  });
  const [outcomeStatus, setOutcomeStatus] = useState(
    () => existing?.outcomeStatus || 'achieved'
  );
  const [selectedEvidenceTypes, setSelectedEvidenceTypes] = useState(
    () => existing?.evidenceTypes || ['Field observation', 'Measurements']
  );
  const [linkedObservationIds, setLinkedObservationIds] = useState(
    () => existing?.linkedObservationIds || plan.linkedObservationIds || []
  );
  const [unexpectedEffects, setUnexpectedEffects] = useState(
    () => existing?.unexpectedEffects || ''
  );
  const [lessons, setLessons] = useState(
    () => existing?.lessons || ''
  );
  const [guidanceForFuture, setGuidanceForFuture] = useState(
    () => existing?.guidanceForFuture || ''
  );

  const handleAddResultItem = () => {
    setActualResults(prev => [...prev, '']);
  };

  const handleUpdateResultItem = (index, value) => {
    setActualResults(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleRemoveResultItem = (index) => {
    if (actualResults.length <= 1) {
      setActualResults(['']);
      return;
    }
    setActualResults(prev => prev.filter((_, i) => i !== index));
  };

  const toggleEvidenceType = (type) => {
    setSelectedEvidenceTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleLinkedObservation = (obsId) => {
    setLinkedObservationIds(prev =>
      prev.includes(obsId) ? prev.filter(id => id !== obsId) : [...prev, obsId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const filteredResults = actualResults
      .map(r => r.trim())
      .filter(r => r.length > 0);

    const reportData = {
      evaluatedAt: 'Today',
      evaluator: `${currentUser.name} (${currentUser.role || 'Project Coordinator'})`,
      goal: goal.trim() || plan.desiredOutcome || plan.problemStatement,
      actualResults: filteredResults.length > 0 ? filteredResults : ['Project completed as planned.'],
      outcomeStatus,
      evidenceTypes: selectedEvidenceTypes,
      linkedEvidenceIds: plan.evidenceIds || [],
      linkedObservationIds,
      unexpectedEffects: unexpectedEffects.trim(),
      lessons: lessons.trim(),
      guidanceForFuture: guidanceForFuture.trim()
    };

    logPlanOutcomeReport(plan.id, reportData);
    onClose();
  };

  const availableEvidenceOptions = [
    { label: 'Field observation', icon: '🔍' },
    { label: 'Community feedback', icon: '💬' },
    { label: 'Measurements', icon: '📊' },
    { label: 'Photos/documents', icon: '📎' }
  ];

  return (
    <form onSubmit={handleSubmit} className="d-flex flex-column gap-4">
        {/* 1. Goal being evaluated */}
        <div className="card p-3" style={{ background: '#ffffff', border: '1px solid var(--border-default)' }}>
          <label className="form-label font-bold text-xs text-primary text-uppercase d-flex align-center gap-1.5 mb-1.5">
            <Target size={14} className="text-brand" />
            <span>Target Goal Being Evaluated</span>
          </label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="form-textarea text-xs"
            rows={2}
            placeholder="What target outcome or problem resolution is being evaluated?"
            required
          />
        </div>

        {/* 2. Actual Results Itemized List */}
        <div className="card p-3" style={{ background: '#ffffff', border: '1px solid var(--border-default)' }}>
          <div className="d-flex align-center justify-between mb-2">
            <label className="form-label font-bold text-xs text-primary text-uppercase d-flex align-center gap-1.5 mb-0">
              <CheckCircle2 size={14} className="text-brand" />
              <span>Actual Results Achieved</span>
            </label>
            <button
              type="button"
              className="btn btn-ghost btn-xs text-brand font-semibold d-flex align-center gap-1"
              onClick={handleAddResultItem}
            >
              <Plus size={13} />
              <span>Add Result Line</span>
            </button>
          </div>
          <p className="text-xs text-muted mb-2">
            Itemize specific quantitative and qualitative results (e.g. <em>1 water system completed</em>, <em>120 households gained access</em>, <em>Average collection time reduced from 45 → 15 min</em>).
          </p>

          <div className="d-flex flex-column gap-2">
            {actualResults.map((result, idx) => (
              <div key={idx} className="d-flex align-center gap-2">
                <span className="text-xs font-bold text-muted" style={{ width: '20px', flexShrink: 0 }}>
                  {idx + 1}.
                </span>
                <input
                  type="text"
                  value={result}
                  onChange={(e) => handleUpdateResultItem(idx, e.target.value)}
                  placeholder={`Result #${idx + 1} (e.g. 120 households gained reliable spring water access)`}
                  className="form-input text-xs flex-1"
                  required
                />
                <button
                  type="button"
                  className="btn-icon btn-xs text-muted"
                  onClick={() => handleRemoveResultItem(idx)}
                  title="Remove result line"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Outcome Status (🟢 / 🟡 / 🔴) */}
        <div className="card p-3" style={{ background: '#ffffff', border: '1px solid var(--border-default)' }}>
          <label className="form-label font-bold text-xs text-primary text-uppercase d-block mb-2">
            Outcome Status
          </label>
          <div className="grid-3 gap-2">
            {/* Achieved */}
            <div
              className={`p-3 rounded cursor-pointer card-interactive d-flex flex-column gap-1 text-center ${outcomeStatus === 'achieved' ? 'border-brand' : ''}`}
              style={{
                background: outcomeStatus === 'achieved' ? 'rgba(220, 252, 231, 0.65)' : 'var(--bg-subtle)',
                border: outcomeStatus === 'achieved' ? '2px solid var(--emerald-600, #16a34a)' : '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)'
              }}
              onClick={() => setOutcomeStatus('achieved')}
            >
              <div className="d-flex align-center justify-center gap-1 font-bold text-xs" style={{ color: '#166534' }}>
                <CheckCircle2 size={15} />
                <span>🟢 Achieved</span>
              </div>
              <span className="text-muted" style={{ fontSize: '0.68rem' }}>
                Target goals and core metrics fully met.
              </span>
            </div>

            {/* Partially Achieved */}
            <div
              className={`p-3 rounded cursor-pointer card-interactive d-flex flex-column gap-1 text-center ${outcomeStatus === 'partially_achieved' ? 'border-brand' : ''}`}
              style={{
                background: outcomeStatus === 'partially_achieved' ? 'rgba(254, 249, 195, 0.65)' : 'var(--bg-subtle)',
                border: outcomeStatus === 'partially_achieved' ? '2px solid var(--amber-500, #d97706)' : '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)'
              }}
              onClick={() => setOutcomeStatus('partially_achieved')}
            >
              <div className="d-flex align-center justify-center gap-1 font-bold text-xs" style={{ color: '#854d0e' }}>
                <AlertTriangle size={15} />
                <span>🟡 Partially Achieved</span>
              </div>
              <span className="text-muted" style={{ fontSize: '0.68rem' }}>
                Key deliverables in place, but some targets pending.
              </span>
            </div>

            {/* Not Achieved */}
            <div
              className={`p-3 rounded cursor-pointer card-interactive d-flex flex-column gap-1 text-center ${outcomeStatus === 'not_achieved' ? 'border-brand' : ''}`}
              style={{
                background: outcomeStatus === 'not_achieved' ? 'rgba(254, 226, 226, 0.65)' : 'var(--bg-subtle)',
                border: outcomeStatus === 'not_achieved' ? '2px solid var(--rose-600, #e11d48)' : '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)'
              }}
              onClick={() => setOutcomeStatus('not_achieved')}
            >
              <div className="d-flex align-center justify-center gap-1 font-bold text-xs" style={{ color: '#991b1b' }}>
                <XCircle size={15} />
                <span>🔴 Not Achieved</span>
              </div>
              <span className="text-muted" style={{ fontSize: '0.68rem' }}>
                Substantial roadblocks prevented planned outcomes.
              </span>
            </div>
          </div>
        </div>

        {/* 4. Evidence Types & Connected Observations */}
        <div className="card p-3" style={{ background: '#ffffff', border: '1px solid var(--border-default)' }}>
          <label className="form-label font-bold text-xs text-primary text-uppercase d-flex align-center gap-1.5 mb-2">
            <FileCheck size={14} className="text-blue-600" />
            <span>Supporting Verification Evidence</span>
          </label>

          {/* Evidence Category Tags */}
          <div className="d-flex align-center gap-2 flex-wrap mb-3">
            {availableEvidenceOptions.map(opt => {
              const isSelected = selectedEvidenceTypes.includes(opt.label);
              return (
                <button
                  key={opt.label}
                  type="button"
                  className={`btn btn-xs ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ borderRadius: 'var(--radius-full)', fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                  onClick={() => toggleEvidenceType(opt.label)}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                  {isSelected && <Check size={12} />}
                </button>
              );
            })}
          </div>

          {/* Connected Observations */}
          {observations.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-secondary d-block mb-1.5">
                Link Supporting Field Observations:
              </span>
              <div className="d-flex flex-column gap-1" style={{ maxHeight: '140px', overflowY: 'auto' }}>
                {observations.slice(0, 6).map(obs => {
                  const isChecked = linkedObservationIds.includes(obs.id);
                  return (
                    <div
                      key={obs.id}
                      className="d-flex align-center gap-2 p-1.5 rounded cursor-pointer text-xs"
                      style={{
                        background: isChecked ? 'var(--primary-50)' : 'var(--bg-subtle)',
                        border: isChecked ? '1px solid var(--primary-200)' : '1px solid transparent'
                      }}
                      onClick={() => toggleLinkedObservation(obs.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                      />
                      <Eye size={13} className="text-muted flex-shrink-0" />
                      <span className="font-medium text-primary text-truncate flex-1">{obs.title}</span>
                      <span className="text-muted" style={{ fontSize: '0.68rem' }}>{obs.category}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 5. Unexpected Effects */}
        <div className="card p-3" style={{ background: '#ffffff', border: '1px solid var(--border-default)' }}>
          <label className="form-label font-bold text-xs text-primary text-uppercase d-flex align-center gap-1.5 mb-1">
            <AlertCircle size={14} className="text-amber" />
            <span>Unexpected Effects</span>
          </label>
          <p className="text-xs text-muted mb-2">
            Record unanticipated downstream impacts, maintenance burdens, or unexpected community behavior (e.g. <em>Maintenance requirements were higher than expected.</em>).
          </p>
          <textarea
            value={unexpectedEffects}
            onChange={(e) => setUnexpectedEffects(e.target.value)}
            className="form-textarea text-xs"
            rows={2}
            placeholder="Describe any unanticipated side-effects, positive or negative..."
          />
        </div>

        {/* 6. Lessons Learned */}
        <div className="card p-3" style={{ background: '#ffffff', border: '1px solid var(--border-default)' }}>
          <label className="form-label font-bold text-xs text-primary text-uppercase d-flex align-center gap-1.5 mb-1">
            <Lightbulb size={14} className="text-purple" />
            <span>Operational Lessons Learned</span>
          </label>
          <p className="text-xs text-muted mb-2">
            What operational lessons were learned during implementation? (e.g. <em>Future systems should include a local maintenance team before installation.</em>).
          </p>
          <textarea
            value={lessons}
            onChange={(e) => setLessons(e.target.value)}
            className="form-textarea text-xs"
            rows={2}
            placeholder="Key operational learnings for the team and community..."
          />
        </div>

        {/* 7. Guidance for Future Projects */}
        <div className="card p-3" style={{ background: '#ffffff', border: '1px solid var(--border-default)' }}>
          <label className="form-label font-bold text-xs text-primary text-uppercase d-flex align-center gap-1.5 mb-1">
            <Compass size={14} className="text-blue-600" />
            <span>Guidance for Future Projects</span>
          </label>
          <p className="text-xs text-muted mb-2">
            Actionable planning advice and policy recommendations for subsequent projects (e.g. <em>Include maintenance training and assign responsible people during project planning.</em>).
          </p>
          <textarea
            value={guidanceForFuture}
            onChange={(e) => setGuidanceForFuture(e.target.value)}
            className="form-textarea text-xs"
            rows={2}
            placeholder="Recommendations and checklist items for future initiatives..."
          />
        </div>

        {/* Modal Actions */}
        <div className="d-flex align-center justify-end gap-2 pt-2 border-top">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-sm d-flex align-center gap-1.5">
            <Check size={14} />
            <span>Publish Outcome Evaluation & Complete Plan</span>
          </button>
        </div>
      </form>
  );
};

export const LogPlanOutcomeModal = ({ isOpen, onClose, plan }) => {
  if (!plan) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Real-World Outcome & Results Evaluation"
      subtitle={`Evaluate verified achievements, evidence, and lessons for: ${plan.title}`}
      maxWidth="780px"
    >
      <LogPlanOutcomeForm key={plan.id} plan={plan} onClose={onClose} />
    </Modal>
  );
};
