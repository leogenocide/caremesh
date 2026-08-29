import { useState } from 'react';
import { Modal } from '../common/Modal';
import { useCareMesh } from '../../context/useCareMesh';
import { AlertCircle, ShieldAlert, Send } from 'lucide-react';

const DISPUTE_REASONS = [
  { id: 'I have contradictory evidence', label: 'I have contradictory evidence', desc: 'You have photos, sensor data, or official reports that directly conflict with this claim.' },
  { id: 'The information is outdated', label: 'The information is outdated', desc: 'The situation has since evolved, cleared, or changed significantly.' },
  { id: 'The location/context is incorrect', label: 'The location/context is incorrect', desc: 'The geographic coordinates, address, or surrounding boundary are wrong.' },
  { id: 'The interpretation is incorrect', label: 'The interpretation is incorrect', desc: 'The observations are real, but the inferred severity or risk level is overstated or misunderstood.' },
  { id: 'Other', label: 'Other', desc: 'Other substantive challenge to the claim.' }
];

export const DisputeModal = () => {
  const { disputeModalTarget, closeDisputeModal, disputeClaim } = useCareMesh();

  const [reason, setReason] = useState('I have contradictory evidence');
  const [explanation, setExplanation] = useState('');
  const [hasEvidence, setHasEvidence] = useState(false);
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceType, setEvidenceType] = useState('document');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceDesc, setEvidenceDesc] = useState('');

  if (!disputeModalTarget) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!explanation.trim()) {
      alert('Please provide an explanation for your dispute.');
      return;
    }

    const evidenceData = hasEvidence && evidenceTitle.trim() ? {
      title: evidenceTitle.trim(),
      type: evidenceType,
      url: evidenceUrl.trim(),
      description: evidenceDesc.trim() || explanation.trim()
    } : null;

    disputeClaim({
      claimId: disputeModalTarget.id,
      reason,
      explanation: explanation.trim(),
      evidenceData
    });

    // Reset
    setReason('I have contradictory evidence');
    setExplanation('');
    setHasEvidence(false);
    setEvidenceTitle('');
    setEvidenceUrl('');
    setEvidenceDesc('');
  };

  return (
    <Modal
      isOpen={Boolean(disputeModalTarget)}
      onClose={closeDisputeModal}
      title="Dispute / Challenge Claim"
      subtitle="CareMesh treats disputes as transparent, structured objects. Substantive challenges help the community arrive at shared truth."
      maxWidth="680px"
    >
      <form onSubmit={handleSubmit} className="d-flex flex-column gap-4">
        {/* Disputed Claim Banner */}
        <div className="card p-3" style={{ background: 'var(--rose-50)', border: '1px solid var(--rose-200)' }}>
          <div className="d-flex align-center gap-2 mb-1">
            <ShieldAlert size={16} className="text-rose" />
            <span className="text-xs font-bold text-rose text-uppercase">Challenging Claim</span>
          </div>
          <p className="text-sm font-semibold text-primary" style={{ lineHeight: '1.45' }}>
            "{disputeModalTarget.assertionText}"
          </p>
        </div>

        {/* Reason Selection */}
        <div>
          <label className="form-label font-bold text-sm text-primary mb-2">
            Why are you disputing this claim?
          </label>
          <div className="d-flex flex-column gap-2">
            {DISPUTE_REASONS.map(r => (
              <label
                key={r.id}
                className="d-flex align-start gap-3 p-3 rounded cursor-pointer"
                style={{
                  background: reason === r.id ? 'var(--primary-50)' : 'var(--bg-subtle)',
                  border: reason === r.id ? '1.5px solid var(--primary-500)' : '1px solid var(--border-light)',
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  type="radio"
                  name="disputeReason"
                  value={r.id}
                  checked={reason === r.id}
                  onChange={(e) => setReason(e.target.value)}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <span className="text-xs font-bold text-primary d-block">{r.label}</span>
                  <span className="text-xs text-muted">{r.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Explanation */}
        <div>
          <label className="form-label font-bold text-sm text-primary">
            Explain the basis of your dispute <span className="text-rose">*</span>
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={4}
            placeholder="Describe specifically what is inaccurate, what you observed, or why this claim does not represent current reality..."
            className="form-textarea"
            required
          />
        </div>

        {/* Counter Evidence Toggle & Section */}
        <div className="card p-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}>
          <div className="d-flex align-center justify-between">
            <div>
              <span className="font-bold text-xs text-primary d-block">Attach Counter-Evidence</span>
              <span className="text-xs text-muted">Photos, sensor measurements, or official records supporting your dispute</span>
            </div>
            <button
              type="button"
              className={`btn btn-xs ${hasEvidence ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setHasEvidence(!hasEvidence)}
            >
              {hasEvidence ? 'Attached' : '+ Add Counter-Evidence'}
            </button>
          </div>

          {hasEvidence && (
            <div className="d-flex flex-column gap-3 mt-3 pt-3 border-top">
              <div className="grid-2">
                <div>
                  <label className="form-label">Evidence Title / Document Name</label>
                  <input
                    type="text"
                    value={evidenceTitle}
                    onChange={(e) => setEvidenceTitle(e.target.value)}
                    placeholder="e.g. On-site water test result"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Evidence Type</label>
                  <select
                    value={evidenceType}
                    onChange={(e) => setEvidenceType(e.target.value)}
                    className="form-select"
                  >
                    <option value="document">Official Document / Notice</option>
                    <option value="photo">Photograph / Video</option>
                    <option value="measurement">Physical Sensor Measurement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Photo / Document URL (Optional)</label>
                <input
                  type="text"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Methodology / Context</label>
                <textarea
                  value={evidenceDesc}
                  onChange={(e) => setEvidenceDesc(e.target.value)}
                  rows={2}
                  placeholder="e.g. Tested using calibrated optical turbidity meter..."
                  className="form-textarea"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="d-flex align-center justify-between pt-3 border-top">
          <span className="text-xs text-muted d-flex align-center gap-1">
            <AlertCircle size={13} className="text-amber" />
            <span>Disputes are recorded on the public provenance trail.</span>
          </span>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={closeDisputeModal}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{ background: 'var(--rose-600)', borderColor: 'var(--rose-700)' }}
            >
              <Send size={14} />
              <span>Submit Dispute</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
