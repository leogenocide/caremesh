import { useState } from 'react';
import { Modal } from '../common/Modal';
import { FileAttachmentPicker } from '../common/FileAttachmentPicker';
import { useCareMesh } from '../../context/useCareMesh';
import { ShieldCheck, AlertCircle, Send, MessageSquare } from 'lucide-react';

const SUPPORT_GROUNDS = [
  'I observed the same discrepancy in the field',
  'Additional sensor/field data confirms this challenge',
  'Official agency records align with this dispute',
  'Ground reality differs from original assertion',
  'Other corroborating grounds'
];

const REBUTTAL_GROUNDS = [
  'The dispute relies on outdated information',
  'Protective measures or berms mitigate this concern',
  'Dispute counter-evidence was misread or invalid',
  'Methodology or field measurements were flawed',
  'The situation has evolved or been resolved',
  'Other rebuttal'
];

const DisputeResponseModalContent = ({ disputeResponseTarget, onClose }) => {
  const { addDisputeResponse } = useCareMesh();
  const dispute = disputeResponseTarget.dispute;
  const initialType = disputeResponseTarget.initialType || 'support';

  const [responseType, setResponseType] = useState(initialType);
  const [reason, setReason] = useState(initialType === 'support' ? SUPPORT_GROUNDS[0] : REBUTTAL_GROUNDS[0]);
  const [customReason, setCustomReason] = useState('');
  const [explanation, setExplanation] = useState('');
  const [evidenceType, setEvidenceType] = useState(initialType === 'support' ? 'measurement' : 'document');
  const [customEvidenceType, setCustomEvidenceType] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);

  const currentGroundsList = responseType === 'support' ? SUPPORT_GROUNDS : REBUTTAL_GROUNDS;

  const handleTypeChange = (newType) => {
    setResponseType(newType);
    setReason(newType === 'support' ? SUPPORT_GROUNDS[0] : REBUTTAL_GROUNDS[0]);
    setEvidenceType(newType === 'support' ? 'measurement' : 'document');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!explanation.trim()) {
      alert('Please provide an explanation for your response.');
      return;
    }

    const finalReason = reason.startsWith('Other')
      ? (customReason.trim() || reason)
      : reason;

    const finalEvidenceType = evidenceType === '__custom__'
      ? (customEvidenceType.trim().toLowerCase() || 'document')
      : evidenceType;

    addDisputeResponse({
      disputeId: dispute.id,
      type: responseType,
      reason: finalReason,
      explanation: explanation.trim(),
      files: attachedFiles.map(f => ({ ...f, evidenceType: finalEvidenceType })),
      evidenceType: finalEvidenceType,
      evidenceData: {
        title: attachedFiles[0]?.name || `${dispute.reason} ${responseType === 'support' ? 'Corroboration' : 'Rebuttal'}`,
        description: explanation.trim(),
        files: attachedFiles.map(f => ({ ...f, evidenceType: finalEvidenceType })),
        type: finalEvidenceType,
        evidenceType: finalEvidenceType
      }
    });

    // Reset and close
    onClose();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={responseType === 'support' ? 'Support & Corroborate Challenge' : 'Counter-Challenge / Rebut Dispute'}
      subtitle="CareMesh supports transparent, peer-driven dispute deliberation with empirical proof."
      maxWidth="700px"
      zIndex={1100}
    >
      <form onSubmit={handleSubmit} className="d-flex flex-column gap-4">
        {/* Response Type Selector */}
        <div className="d-flex gap-2 p-1 card" style={{ background: 'var(--bg-subtle)' }}>
          <button
            type="button"
            className={`btn btn-sm flex-1 ${responseType === 'support' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ 
              background: responseType === 'support' ? 'var(--primary-600)' : 'transparent',
              color: responseType === 'support' ? '#ffffff' : undefined 
            }}
            onClick={() => handleTypeChange('support')}
          >
            <ShieldCheck size={14} />
            <span>Support Challenge (Corroborate)</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm flex-1 ${responseType === 'challenge' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ 
              background: responseType === 'challenge' ? 'var(--rose-600)' : 'transparent',
              color: responseType === 'challenge' ? '#ffffff' : undefined 
            }}
            onClick={() => handleTypeChange('challenge')}
          >
            <AlertCircle size={14} />
            <span>Counter-Challenge (Rebut)</span>
          </button>
        </div>

        {/* Target Dispute Context Banner */}
        <div 
          className="card p-3" 
          style={{ 
            background: responseType === 'support' ? 'var(--primary-50)' : 'var(--rose-50)', 
            border: `1px solid ${responseType === 'support' ? 'var(--primary-200)' : 'var(--rose-200)'}` 
          }}
        >
          <div className="d-flex align-center justify-between mb-1 flex-wrap gap-2">
            <span className="text-xs font-bold text-muted text-uppercase">
              Responding to Dispute Record:
            </span>
            <span className="badge badge-rose text-xs font-bold">
              Reason: {dispute.reason}
            </span>
          </div>

          <p className="text-xs text-secondary mb-2" style={{ lineHeight: '1.45' }}>
            <strong>Original Challenge:</strong> "{dispute.explanation}"
          </p>

          <span className="text-xs text-muted">
            Submitted by <strong>{dispute.author?.name}</strong> ({dispute.author?.role}) • {dispute.timestamp}
          </span>
        </div>

        {/* Structured Grounds / Reason Selection */}
        <div>
          <label className="form-label font-bold text-sm text-primary mb-1">
            {responseType === 'support' ? 'Corroborating Grounds' : 'Rebuttal Grounds'}
          </label>
          <select
            className="form-input text-xs mb-2"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            {currentGroundsList.map((g, idx) => (
              <option key={idx} value={g}>{g}</option>
            ))}
          </select>

          {reason.startsWith('Other') && (
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Specify custom response grounds..."
              className="form-input text-xs"
              required
            />
          )}
        </div>

        {/* Detailed Explanation */}
        <div>
          <label className="form-label font-bold text-sm text-primary mb-1">
            {responseType === 'support' ? 'Supporting Explanation & Notes' : 'Rebuttal Arguments & Evidence Details'} <span className="text-rose">*</span>
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={4}
            placeholder={
              responseType === 'support'
                ? 'Provide observations, additional field notes, or references confirming why this dispute is valid...'
                : 'Explain why the dispute is incorrect, defend the original claim, or detail mitigation measures in place...'
            }
            className="form-textarea text-xs"
            required
          />
        </div>

        {/* Evidence Record Type Selector */}
        <div>
          <label className="form-label font-bold text-sm text-primary d-flex align-center justify-between mb-1.5">
            <span>Attached Proof Type</span>
            <span className="text-xs text-muted font-normal">Classifies evidence supporting this deliberation</span>
          </label>
          <div className="d-flex gap-2 flex-wrap mb-2">
            {[
              { id: 'measurement', label: '📏 Measurement', desc: 'Readings, gauge depths, sensor logs' },
              { id: 'document', label: '📄 Document', desc: 'Official notices, permits, GIS surveys' },
              { id: 'photo', label: '📷 Photo', desc: 'Geotagged site conditions, field verification' },
              { id: 'sensor', label: '📡 Sensor Telemetry', desc: 'Automated telemetry' },
              { id: 'lab_test', label: '🧪 Lab Test', desc: 'Spectrometry, water testing kits' },
              { id: '__custom__', label: '✨ Custom...', desc: 'Specify custom type' }
            ].map(t => (
              <button
                key={t.id}
                type="button"
                className={`btn btn-xs ${evidenceType === t.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  background: evidenceType === t.id 
                    ? (responseType === 'support' ? 'var(--primary-600)' : 'var(--rose-600)') 
                    : undefined,
                  color: evidenceType === t.id ? '#ffffff' : undefined,
                  fontWeight: evidenceType === t.id ? '700' : '500'
                }}
                onClick={() => setEvidenceType(t.id)}
                title={t.desc}
              >
                {t.label}
              </button>
            ))}
          </div>
          {evidenceType === '__custom__' && (
            <input
              type="text"
              value={customEvidenceType}
              onChange={(e) => setCustomEvidenceType(e.target.value)}
              placeholder="Enter custom evidence type..."
              className="form-input text-xs"
              required
            />
          )}
        </div>

        {/* Attached Photos & Documents from Device */}
        <div className="card p-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}>
          <FileAttachmentPicker
            files={attachedFiles}
            onChange={setAttachedFiles}
            label={responseType === 'support' ? 'Attach Corroborating Evidence' : 'Attach Rebuttal Counter-Evidence'}
            helpText="Upload inspection photos, lab reports, or agency records validating your stance."
          />
        </div>

        {/* Footer */}
        <div className="d-flex align-center justify-between pt-3 border-top">
          <span className="text-xs text-muted d-flex align-center gap-1">
            <MessageSquare size={13} className="text-brand" />
            <span>Recorded as peer deliberation on public ledger.</span>
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
              style={{
                background: responseType === 'support' ? 'var(--primary-600)' : 'var(--rose-600)'
              }}
            >
              <Send size={14} />
              <span>{responseType === 'support' ? 'Publish Dispute Support' : 'Publish Dispute Rebuttal'}</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export const DisputeResponseModal = () => {
  const { disputeResponseTarget, closeDisputeResponseModal } = useCareMesh();

  if (!disputeResponseTarget || !disputeResponseTarget.dispute) return null;

  return (
    <DisputeResponseModalContent
      key={`${disputeResponseTarget.dispute.id}-${disputeResponseTarget.initialType}`}
      disputeResponseTarget={disputeResponseTarget}
      onClose={closeDisputeResponseModal}
    />
  );
};
