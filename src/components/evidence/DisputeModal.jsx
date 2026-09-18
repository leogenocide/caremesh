import { useState } from 'react';
import { Modal } from '../common/Modal';
import { LocationPicker } from '../common/LocationPicker';
import { FileAttachmentPicker } from '../common/FileAttachmentPicker';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  ShieldAlert, 
  AlertCircle, 
  Send, 
  MapPin 
} from 'lucide-react';

const DISPUTE_REASONS = [
  { id: 'The interpretation is incorrect', label: 'The interpretation is incorrect', desc: 'The observations are real, but the inferred severity, cause, or risk level is misunderstood.' },
  { id: 'The information is outdated', label: 'The information is outdated', desc: 'The situation has since evolved, cleared, or been addressed by authorities or residents.' },
  { id: 'I have contradictory evidence', label: 'I have contradictory evidence', desc: 'You have photos, sensor data, or official reports that conflict with this claim.' },
  { id: 'The location/context is incorrect', label: 'The location/context is incorrect', desc: 'The geographic coordinates, address, or surrounding boundary are inaccurate.' },
  { id: 'Other', label: 'Other', desc: 'Other substantive challenge to the public record.' }
];

export const DisputeModal = () => {
  const { 
    disputeModalTarget, 
    closeDisputeModal, 
    disputeClaim, 
    addContradictoryObservation, 
    claims, 
    observations 
  } = useCareMesh();

  // Mode: 'claim_dispute' (Quick Dispute) | 'field_observation' (Contradictory Observation)
  const initialMode = disputeModalTarget?.initialMode || 'claim_dispute';
  const [challengeMode, setChallengeMode] = useState(initialMode);

  // Mode 1: Claim Dispute State
  const [reason, setReason] = useState('The interpretation is incorrect');
  const [explanation, setExplanation] = useState('');
  const [disputeFiles, setDisputeFiles] = useState([]);
  const [disputeEvidenceType, setDisputeEvidenceType] = useState('document');
  const [customDisputeEvidenceType, setCustomDisputeEvidenceType] = useState('');

  // Mode 2: Field Counter-Observation State
  const [contraTitle, setContraTitle] = useState('');
  const [contraDescription, setContraDescription] = useState('');
  const [contraLocation, setContraLocation] = useState({ address: '', lat: null, lng: null });
  const [contraFiles, setContraFiles] = useState([]);
  const [contraEvidenceType, setContraEvidenceType] = useState('measurement');
  const [customContraEvidenceType, setCustomContraEvidenceType] = useState('');
  const [alsoFlagClaim, setAlsoFlagClaim] = useState(true);

  if (!disputeModalTarget) return null;

  // Resolve target claim and target observation
  const rawTarget = disputeModalTarget?.target || disputeModalTarget;
  
  let targetClaim = null;
  let targetObservation = null;

  if (rawTarget?.assertionText) {
    targetClaim = rawTarget;
    targetObservation = observations.find(o => o.id === targetClaim.observationId) || null;
  } else if (rawTarget?.title && (rawTarget?.category || rawTarget?.location)) {
    targetObservation = rawTarget;
    targetClaim = claims.find(c => c.observationId === targetObservation.id) || claims.find(c => targetObservation.claimIds?.includes(c.id)) || null;
  } else if (rawTarget?.claim || rawTarget?.observation) {
    targetClaim = rawTarget.claim || null;
    targetObservation = rawTarget.observation || null;
    if (!targetClaim && targetObservation) {
      targetClaim = claims.find(c => c.observationId === targetObservation.id) || claims.find(c => targetObservation.claimIds?.includes(c.id)) || null;
    }
  }

  // Handle Mode 1: Submit Claim Dispute
  const handleSubmitDispute = (e) => {
    e.preventDefault();
    if (!explanation.trim()) {
      alert('Please provide an explanation for your dispute.');
      return;
    }

    if (!targetClaim && !targetObservation) {
      alert('No record found to dispute.');
      return;
    }

    const finalDisputeEvidenceType = disputeEvidenceType === '__custom__'
      ? (customDisputeEvidenceType.trim().toLowerCase() || 'document')
      : disputeEvidenceType;

    disputeClaim({
      claimId: targetClaim?.id || null,
      reason,
      explanation: explanation.trim(),
      evidenceType: finalDisputeEvidenceType,
      evidenceData: {
        files: disputeFiles.map(f => ({ ...f, evidenceType: finalDisputeEvidenceType })),
        type: finalDisputeEvidenceType,
        evidenceType: finalDisputeEvidenceType
      },
      relatedObservationId: targetObservation?.id || null
    });

    // Reset & close
    setExplanation('');
    setDisputeFiles([]);
    setDisputeEvidenceType('document');
    setCustomDisputeEvidenceType('');
    closeDisputeModal();
  };

  // Handle Mode 2: Submit Contradictory Observation
  const handleSubmitObservation = (e) => {
    e.preventDefault();
    if (!contraTitle.trim() || !contraDescription.trim()) {
      alert('Please enter a title and description for your field observation.');
      return;
    }

    const finalContraEvidenceType = contraEvidenceType === '__custom__'
      ? (customContraEvidenceType.trim().toLowerCase() || 'measurement')
      : contraEvidenceType;

    // Extract image URLs from attached device files
    const imageFiles = contraFiles.filter(f => f.isImage && f.dataUrl);
    const primaryImage = imageFiles.length > 0 ? imageFiles[0].dataUrl : '';

    const payload = {
      targetObservationId: targetObservation?.id || 'obs_01',
      title: contraTitle.trim(),
      description: contraDescription.trim(),
      locationAddress: contraLocation.address.trim() || targetObservation?.location?.address || 'Maplewood Local Area',
      lat: contraLocation.lat ?? targetObservation?.location?.lat ?? 37.7749,
      lng: contraLocation.lng ?? targetObservation?.location?.lng ?? -122.4194,
      imageUrl: primaryImage,
      files: contraFiles.map(f => ({ ...f, evidenceType: finalContraEvidenceType })),
      evidenceType: finalContraEvidenceType,
      evidenceData: {
        title: contraFiles[0]?.name || `${contraTitle.trim()} ${finalContraEvidenceType === 'measurement' ? 'Measurement' : 'Counter-Record'}`,
        description: contraDescription.trim(),
        files: contraFiles.map(f => ({ ...f, evidenceType: finalContraEvidenceType })),
        type: finalContraEvidenceType,
        evidenceType: finalContraEvidenceType
      }
    };

    const newObs = addContradictoryObservation(payload);

    // Also register structured dispute on claim if enabled
    if (alsoFlagClaim && targetClaim && newObs?.id) {
      disputeClaim({
        claimId: targetClaim.id,
        reason: 'I have contradictory evidence',
        explanation: `Field counter-observation documented: "${contraTitle.trim()}". ${contraDescription.trim()}`,
        evidenceData: contraFiles.length > 0 ? { files: contraFiles } : null,
        relatedObservationId: newObs.id
      });
    }

    // Reset & close
    setContraTitle('');
    setContraDescription('');
    setContraLocation({ address: '', lat: null, lng: null });
    setContraFiles([]);
    closeDisputeModal();
  };

  return (
    <Modal
      isOpen={Boolean(disputeModalTarget)}
      onClose={closeDisputeModal}
      title="Challenge Record / Provide Counter-Evidence"
      subtitle="Transparent context trail: Substantive challenges help the community arrive at shared ground truth."
      maxWidth="720px"
      zIndex={1100}
    >
      <div className="d-flex flex-column gap-4">
        {/* Target Context Banner */}
        <div className="card p-3" style={{ background: 'var(--rose-50)', border: '1px solid var(--rose-200)' }}>
          <div className="d-flex align-center justify-between mb-1.5 flex-wrap gap-2">
            <div className="d-flex align-center gap-2">
              <ShieldAlert size={16} className="text-rose" />
              <span className="text-xs font-bold text-rose text-uppercase">Challenging Record</span>
              {(targetObservation?.isSupporting || targetObservation?.isContradiction) && (
                <span className={`badge ${targetObservation.isContradiction ? 'badge-rose' : 'badge-primary'} text-xs font-bold`}>
                  {targetObservation.isContradiction ? 'Contradictory Sub-Post' : 'Supporting Sub-Post'}
                </span>
              )}
            </div>
            {targetObservation?.location && (
              <span className="text-xs text-muted d-flex align-center gap-1">
                <MapPin size={12} />
                <span>{targetObservation.location.address}</span>
              </span>
            )}
          </div>

          {targetClaim && (
            <div className="mb-2">
              <span className="text-xs font-bold text-secondary d-block mb-0.5">Asserted Claim:</span>
              <p className="text-sm font-semibold text-primary mb-0" style={{ lineHeight: '1.45' }}>
                "{targetClaim.assertionText}"
              </p>
            </div>
          )}

          {targetObservation && !targetClaim && (
            <div>
              <span className="text-xs font-bold text-secondary d-block mb-0.5">Observation:</span>
              <p className="text-sm font-semibold text-primary mb-0">
                "{targetObservation.title}"
              </p>
            </div>
          )}
        </div>

        {/* Challenge Mode Segmented Switcher */}
        <div>
          <label className="form-label font-bold text-xs text-secondary mb-1.5 d-block">
            Choose Challenge Approach
          </label>
          <div className="d-flex gap-2 p-1 card dispute-mode-switcher" style={{ background: 'var(--bg-subtle)' }}>
            <button
              type="button"
              className={`btn btn-sm flex-1 d-flex align-center justify-center gap-2 ${challengeMode === 'claim_dispute' ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                background: challengeMode === 'claim_dispute' ? 'var(--rose-600)' : 'transparent',
                borderColor: challengeMode === 'claim_dispute' ? 'var(--rose-600)' : 'transparent'
              }}
              onClick={() => setChallengeMode('claim_dispute')}
            >
              <ShieldAlert size={15} />
              <span>1. Quick Dispute (Interpretation / Outdated)</span>
            </button>

            <button
              type="button"
              className={`btn btn-sm flex-1 d-flex align-center justify-center gap-2 ${challengeMode === 'field_observation' ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                background: challengeMode === 'field_observation' ? 'var(--rose-600)' : 'transparent',
                borderColor: challengeMode === 'field_observation' ? 'var(--rose-600)' : 'transparent'
              }}
              onClick={() => setChallengeMode('field_observation')}
            >
              <AlertCircle size={15} />
              <span>2. Log Field Counter-Observation (New Pin)</span>
            </button>
          </div>
          <span className="text-xs text-muted d-block mt-1">
            {challengeMode === 'claim_dispute' 
              ? 'Flag the interpretation as inaccurate or outdated without creating a new map pin.'
              : 'Conduct your own field survey and place an independent counter-observation pin on the Explore map.'}
          </span>
        </div>

        {/* ----------------- MODE 1: QUICK CLAIM DISPUTE ----------------- */}
        {challengeMode === 'claim_dispute' && (
          <form onSubmit={handleSubmitDispute} className="d-flex flex-column gap-4">
            {/* Reason Selection */}
            <div>
              <label className="form-label font-bold text-sm text-primary mb-2">
                Why are you disputing this claim?
              </label>
              <div className="d-flex flex-column gap-2">
                {DISPUTE_REASONS.map(r => (
                  <label
                    key={r.id}
                    className="d-flex align-start gap-3 p-2.5 rounded cursor-pointer"
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
                      <span className="text-xs text-muted" style={{ fontSize: '11px' }}>{r.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div>
              <label className="form-label font-bold text-sm text-primary">
                Explain the basis of your challenge <span className="text-rose">*</span>
              </label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={3}
                placeholder="Describe specifically what is inaccurate, what changed, or why this claim does not represent current reality..."
                className="form-textarea"
                required
              />
            </div>

            {/* Evidence Record Type Selector */}
            <div>
              <label className="form-label font-bold text-sm text-primary d-flex align-center justify-between mb-1.5">
                <span>Counter-Evidence Record Type</span>
                <span className="text-xs text-muted font-normal">Classifies the proof document</span>
              </label>
              <div className="d-flex gap-2 flex-wrap mb-2">
                {[
                  { id: 'document', label: '📄 Document / Report' },
                  { id: 'measurement', label: '📏 Measurement' },
                  { id: 'photo', label: '📷 Photo' },
                  { id: 'sensor', label: '📡 Sensor Reading' },
                  { id: 'lab_test', label: '🧪 Lab Test' },
                  { id: '__custom__', label: '✨ Custom...' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    className={`btn btn-xs ${disputeEvidenceType === t.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      background: disputeEvidenceType === t.id ? 'var(--rose-600)' : undefined,
                      color: disputeEvidenceType === t.id ? '#ffffff' : undefined,
                      fontWeight: disputeEvidenceType === t.id ? '700' : '500'
                    }}
                    onClick={() => setDisputeEvidenceType(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {disputeEvidenceType === '__custom__' && (
                <input
                  type="text"
                  value={customDisputeEvidenceType}
                  onChange={(e) => setCustomDisputeEvidenceType(e.target.value)}
                  placeholder="Enter custom evidence type (e.g. municipal audit, satellite analysis)..."
                  className="form-input text-xs"
                  required
                />
              )}
            </div>

            {/* Device File Attachments */}
            <div className="card p-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}>
              <FileAttachmentPicker
                files={disputeFiles}
                onChange={setDisputeFiles}
                label="Attach Counter-Evidence from Device"
                helpText="Attach photos, lab reports, sensor logs, or official agency bulletins from your computer or phone"
              />
            </div>

            {/* Actions */}
            <div className="d-flex align-center justify-end gap-2 pt-2 border-top flex-wrap">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={closeDisputeModal}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm d-flex align-center gap-1.5"
                style={{ background: 'var(--rose-600)', borderColor: 'var(--rose-600)' }}
              >
                <Send size={14} />
                <span>Submit Dispute Challenge</span>
              </button>
            </div>
          </form>
        )}

        {/* ----------------- MODE 2: FIELD COUNTER-OBSERVATION ----------------- */}
        {challengeMode === 'field_observation' && (
          <form onSubmit={handleSubmitObservation} className="d-flex flex-column gap-4">
            <div>
              <label className="form-label font-bold text-sm text-primary">
                Observation Title <span className="text-rose">*</span>
              </label>
              <input
                type="text"
                className="input text-sm"
                placeholder="e.g., Upstream Clear Water Confirmation (pH 7.4)"
                value={contraTitle}
                onChange={(e) => setContraTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label font-bold text-sm text-primary">
                Field Observation Description <span className="text-rose">*</span>
              </label>
              <textarea
                value={contraDescription}
                onChange={(e) => setContraDescription(e.target.value)}
                rows={3}
                placeholder="Provide empirical details of your observation: what tools were used, exact time of inspection, and physical measurements..."
                className="form-textarea"
                required
              />
            </div>

            {/* Location Picker */}
            <div>
              <LocationPicker
                value={contraLocation}
                onChange={setContraLocation}
                label="Observation Location & Coordinates"
              />
            </div>

            {/* Counter-Observation Evidence Record Type */}
            <div>
              <label className="form-label font-bold text-sm text-primary d-flex align-center justify-between mb-1.5">
                <span>Evidence Record Type</span>
                <span className="text-xs text-muted font-normal">Sets the structured badge category</span>
              </label>
              <div className="d-flex gap-2 flex-wrap mb-2">
                {[
                  { id: 'measurement', label: '📏 Measurement' },
                  { id: 'document', label: '📄 Document' },
                  { id: 'photo', label: '📷 Photo' },
                  { id: 'sensor', label: '📡 Sensor Telemetry' },
                  { id: 'lab_test', label: '🧪 Lab Test' },
                  { id: '__custom__', label: '✨ Custom...' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    className={`btn btn-xs ${contraEvidenceType === t.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      background: contraEvidenceType === t.id ? 'var(--rose-600)' : undefined,
                      color: contraEvidenceType === t.id ? '#ffffff' : undefined,
                      fontWeight: contraEvidenceType === t.id ? '700' : '500'
                    }}
                    onClick={() => setContraEvidenceType(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {contraEvidenceType === '__custom__' && (
                <input
                  type="text"
                  value={customContraEvidenceType}
                  onChange={(e) => setCustomContraEvidenceType(e.target.value)}
                  placeholder="Enter custom evidence type (e.g. thermal inspection, acoustic test)..."
                  className="form-input text-xs"
                  required
                />
              )}
            </div>

            {/* Device File Attachments */}
            <div className="card p-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}>
              <FileAttachmentPicker
                files={contraFiles}
                onChange={setContraFiles}
                label="Attach Field Photos & Sensor Telemetry from Device"
                helpText="Choose photos taken on site, sensor CSV files, or test kit photos"
              />
            </div>

            {/* Auto-link to claim checkbox */}
            {targetClaim && (
              <label className="d-flex align-start gap-2 p-2 rounded cursor-pointer" style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-200)' }}>
                <input
                  type="checkbox"
                  checked={alsoFlagClaim}
                  onChange={(e) => setAlsoFlagClaim(e.target.checked)}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <span className="text-xs font-bold text-primary d-block">
                    Automatically link as a dispute challenge on the original claim
                  </span>
                  <span className="text-xs text-muted" style={{ fontSize: '11px' }}>
                    Flips the original claim badge to "Disputed" and cites this counter-observation as physical evidence.
                  </span>
                </div>
              </label>
            )}

            {/* Actions */}
            <div className="d-flex align-center justify-end gap-2 pt-2 border-top flex-wrap">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={closeDisputeModal}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm d-flex align-center gap-1.5"
                style={{ background: 'var(--rose-600)', borderColor: 'var(--rose-600)' }}
              >
                <AlertCircle size={14} />
                <span>Publish Contradictory Observation</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
