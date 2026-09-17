import { useState } from 'react';
import { Modal } from '../common/Modal';
import { LocationPicker } from '../common/LocationPicker';
import { FileAttachmentPicker } from '../common/FileAttachmentPicker';
import { useCareMesh } from '../../context/useCareMesh';
import { Eye, AlertCircle, ShieldCheck, Send } from 'lucide-react';

const AddObservationRelationModalInner = ({ observationRelationTarget, onClose }) => {
  const { 
    addContradictoryObservation, 
    addSupportingObservation 
  } = useCareMesh();

  const targetObs = observationRelationTarget.targetObservation;
  const initialRelation = observationRelationTarget.relationType || 'supporting';
  const referencingEvidence = observationRelationTarget.referencingEvidence || null;

  const [relationType, setRelationType] = useState(initialRelation); // 'contradictory' | 'supporting'
  const [evidenceType, setEvidenceType] = useState(referencingEvidence?.type || 'measurement'); // 'measurement' | 'document' | 'photo' | 'sensor' | 'lab_test' | '__custom__'
  const [customEvidenceType, setCustomEvidenceType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState({
    address: '',
    lat: null,
    lng: null
  });
  const [attachedFiles, setAttachedFiles] = useState([]);

  const isContradictory = relationType === 'contradictory';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Please enter a title and description for your observation.');
      return;
    }

    const finalEvidenceType = evidenceType === '__custom__'
      ? (customEvidenceType.trim().toLowerCase() || 'measurement')
      : evidenceType;

    const imageFiles = attachedFiles.filter(f => f.isImage && f.dataUrl);
    const primaryImage = imageFiles.length > 0 ? imageFiles[0].dataUrl : '';

    const payload = {
      targetObservationId: targetObs.id,
      title: title.trim(),
      description: description.trim(),
      locationAddress: location.address.trim() || targetObs?.location?.address || '',
      lat: location.lat,
      lng: location.lng,
      imageUrl: primaryImage,
      files: attachedFiles.map(f => ({ ...f, evidenceType: finalEvidenceType })),
      evidenceType: finalEvidenceType,
      evidenceData: {
        title: attachedFiles[0]?.name || `${title.trim()} ${finalEvidenceType === 'measurement' ? 'Measurement' : 'Evidence'}`,
        description: description.trim(),
        files: attachedFiles.map(f => ({ ...f, evidenceType: finalEvidenceType })),
        type: finalEvidenceType,
        evidenceType: finalEvidenceType,
        referencedEvidenceId: referencingEvidence?.id || null,
        referencedEvidenceTitle: referencingEvidence?.title || null
      }
    };

    if (isContradictory) {
      addContradictoryObservation(payload);
    } else {
      addSupportingObservation(payload);
    }

    onClose();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isContradictory ? 'Add Contradictory Observation' : 'Add Supporting (Corroborating) Observation'}
      subtitle={
        isContradictory
          ? 'CareMesh preserves all observations as distinct records. Contradictory observations become their own independent reports with author and counter-evidence.'
          : 'CareMesh preserves independent corroborating records. Supporting observations confirm findings with empirical field proof, measurements, or documentation.'
      }
      maxWidth="680px"
      zIndex={1100}
    >
      <form onSubmit={handleSubmit} className="d-flex flex-column gap-4">
        {/* Relation Type Selector */}
        <div className="d-flex gap-2 p-1 card" style={{ background: 'var(--bg-subtle)' }}>
          <button
            type="button"
            className={`btn btn-sm flex-1 ${isContradictory ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              background: isContradictory ? 'var(--rose-600)' : 'transparent',
              color: isContradictory ? '#ffffff' : 'var(--text-secondary)'
            }}
            onClick={() => setRelationType('contradictory')}
          >
            <AlertCircle size={14} />
            <span>Contradictory Observation</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm flex-1 ${!isContradictory ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              background: !isContradictory ? 'var(--primary-600)' : 'transparent',
              color: !isContradictory ? '#ffffff' : 'var(--text-secondary)'
            }}
            onClick={() => setRelationType('supporting')}
          >
            <ShieldCheck size={14} />
            <span>Supporting Observation</span>
          </button>
        </div>

        {/* Target Context Banner */}
        <div 
          className="card p-3" 
          style={{ 
            background: isContradictory ? 'var(--rose-50)' : 'var(--primary-50)', 
            border: `1px solid ${isContradictory ? 'var(--rose-200)' : 'var(--primary-200)'}` 
          }}
        >
          <div className="d-flex align-center justify-between mb-1">
            <span className="text-xs font-bold text-muted text-uppercase">
              {targetObs?.isSupporting ? 'Referencing Supporting Sub-Post:' : (targetObs?.isContradiction ? 'Referencing Contradictory Sub-Post:' : 'Referencing Target Observation:')}
            </span>
            {(targetObs?.isSupporting || targetObs?.isContradiction) && (
              <span className={`badge ${targetObs?.isContradiction ? 'badge-rose' : 'badge-primary'} text-xs font-bold`}>
                {targetObs?.isContradiction ? 'Contradictory Report' : 'Corroborating Report'}
              </span>
            )}
          </div>
          <h5 className="font-bold text-sm text-primary mb-1">{targetObs?.title}</h5>
          <p className="text-xs text-secondary mb-0">{targetObs?.description}</p>

          {referencingEvidence && (
            <div className="mt-2 p-2 rounded" style={{ background: '#ffffff', border: '1px solid var(--border-light)' }}>
              <div className="d-flex align-center justify-between mb-1">
                <span className="text-xs font-bold text-secondary">Referenced Evidence Record:</span>
                <span className="badge badge-primary text-xs text-uppercase">{referencingEvidence.type}</span>
              </div>
              <p className="text-xs font-semibold text-primary mb-0">{referencingEvidence.title}</p>
              {referencingEvidence.description && (
                <p className="text-xs text-muted mb-0 mt-0.5">{referencingEvidence.description}</p>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="form-label font-bold text-sm text-primary">
            {isContradictory ? 'Contradictory Observation Title' : 'Supporting Observation Title'}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              referencingEvidence
                ? (isContradictory
                    ? `e.g. Counter-measurement challenging "${referencingEvidence.title}"`
                    : `e.g. Field measurement corroborating "${referencingEvidence.title}"`)
                : (isContradictory
                    ? 'e.g. Silt buildup cleared by municipal maintenance crew at 11:30 AM'
                    : 'e.g. Observed additional bank erosion confirming culvert blockage')
            }
            className="form-input"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="form-label font-bold text-sm text-primary">
            What did you observe? <span className="text-rose">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Provide specific details of what you witnessed, measured, or documented..."
            className="form-textarea"
            required
          />
        </div>

        {/* Observation Location & Coordinates */}
        <LocationPicker
          value={location}
          onChange={setLocation}
          label="Observation Location & Geographic Coordinates"
          placeholder={targetObs?.location?.address || 'e.g. Elm St Creek Bridge'}
        />

        {/* Evidence Record Type Selector */}
        <div>
          <label className="form-label font-bold text-sm text-primary d-flex align-center justify-between mb-1.5">
            <span>Evidence Record Type</span>
            <span className="text-xs text-muted font-normal">Sets the structured badge & proof category</span>
          </label>
          <div className="d-flex gap-2 flex-wrap mb-2">
            {[
              { id: 'measurement', label: '📏 Measurement', desc: 'Silt depth, water levels, temperatures, flow rates' },
              { id: 'document', label: '📄 Document', desc: 'Notices, lab reports, permits, agency logs' },
              { id: 'photo', label: '📷 Photo', desc: 'Visual field photos, geo-tagged condition checks' },
              { id: 'sensor', label: '📡 Sensor Telemetry', desc: 'Automated digital meter readings & telemetry' },
              { id: 'lab_test', label: '🧪 Lab Test', desc: 'Water quality kits, soil tests, spectrometry' },
              { id: '__custom__' , label: '✨ Custom...', desc: 'Specify your own custom record type' }
            ].map(t => (
              <button
                key={t.id}
                type="button"
                className={`btn btn-xs ${evidenceType === t.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  background: evidenceType === t.id ? (isContradictory ? 'var(--rose-600)' : 'var(--primary-600)') : undefined,
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
              placeholder="Enter custom evidence type (e.g. acoustic survey, thermal drone inspection)..."
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
            label={isContradictory ? "Attach Counter-Evidence Photos & Documents from Device" : "Attach Corroborating Photos & Documents from Device"}
            helpText="Upload site inspection photos, sensor logs, or official agency records directly from your device"
          />
        </div>

        {/* Footer */}
        <div className="d-flex align-center justify-between pt-3 border-top">
          <span className="text-xs text-muted d-flex align-center gap-1">
            <Eye size={13} className="text-brand" />
            <span>Recorded as a distinct peer report.</span>
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
                background: isContradictory ? 'var(--rose-600)' : 'var(--primary-600)'
              }}
            >
              <Send size={14} />
              <span>{isContradictory ? 'Publish Contradictory Observation' : 'Publish Supporting Observation'}</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export const AddObservationRelationModal = () => {
  const { observationRelationTarget, closeObservationRelationModal } = useCareMesh();

  if (!observationRelationTarget) return null;

  return (
    <AddObservationRelationModalInner
      key={`${observationRelationTarget.targetObservation?.id || 'target'}_${observationRelationTarget.relationType || 'supporting'}_${observationRelationTarget.referencingEvidence?.id || 'root'}`}
      observationRelationTarget={observationRelationTarget}
      onClose={closeObservationRelationModal}
    />
  );
};

export default AddObservationRelationModal;
