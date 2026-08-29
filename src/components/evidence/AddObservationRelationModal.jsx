import { useState } from 'react';
import { Modal } from '../common/Modal';
import { useCareMesh } from '../../context/useCareMesh';
import { Eye, AlertCircle, ShieldCheck, Send } from 'lucide-react';

export const AddObservationRelationModal = () => {
  const { 
    observationRelationTarget, 
    closeObservationRelationModal, 
    addContradictoryObservation, 
    addSupportingObservation 
  } = useCareMesh();

  const [relationType, setRelationType] = useState('contradictory'); // 'contradictory' | 'supporting'
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [evidenceTitle, setEvidenceTitle] = useState('');

  if (!observationRelationTarget) return null;
  const targetObs = observationRelationTarget.targetObservation;
  const initialRelation = observationRelationTarget.relationType || 'contradictory';

  // Sync relation type if target changed
  const currentRelation = relationType || initialRelation;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Please enter a title and description for your observation.');
      return;
    }

    const payload = {
      targetObservationId: targetObs.id,
      title: title.trim(),
      description: description.trim(),
      locationAddress: locationAddress.trim() || targetObs?.location?.address || '',
      imageUrl: imageUrl.trim(),
      evidenceData: evidenceTitle.trim() ? {
        title: evidenceTitle.trim(),
        description: description.trim()
      } : null
    };

    if (currentRelation === 'contradictory') {
      addContradictoryObservation(payload);
    } else {
      addSupportingObservation(payload);
    }

    // Reset
    setTitle('');
    setDescription('');
    setLocationAddress('');
    setImageUrl('');
    setEvidenceTitle('');
  };

  return (
    <Modal
      isOpen={Boolean(observationRelationTarget)}
      onClose={closeObservationRelationModal}
      title={currentRelation === 'contradictory' ? 'Add Contradictory Observation' : 'Add Supporting Observation'}
      subtitle="CareMesh preserves all observations as distinct records. Contradictory observations become their own independent reports with author and evidence."
      maxWidth="680px"
    >
      <form onSubmit={handleSubmit} className="d-flex flex-column gap-4">
        {/* Relation Type Selector */}
        <div className="d-flex gap-2 p-1 card" style={{ background: 'var(--bg-subtle)' }}>
          <button
            type="button"
            className={`btn btn-sm flex-1 ${currentRelation === 'contradictory' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ background: currentRelation === 'contradictory' ? 'var(--rose-600)' : 'transparent' }}
            onClick={() => setRelationType('contradictory')}
          >
            <AlertCircle size={14} />
            <span>Contradictory Observation</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm flex-1 ${currentRelation === 'supporting' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setRelationType('supporting')}
          >
            <ShieldCheck size={14} />
            <span>Supporting Observation</span>
          </button>
        </div>

        {/* Target Context Banner */}
        <div className="card p-3" style={{ background: currentRelation === 'contradictory' ? 'var(--rose-50)' : 'var(--primary-50)', border: '1px solid var(--border-light)' }}>
          <span className="text-xs font-bold text-muted text-uppercase d-block mb-1">
            Referencing Target Observation:
          </span>
          <h5 className="font-bold text-sm text-primary mb-1">{targetObs?.title}</h5>
          <p className="text-xs text-secondary mb-0">{targetObs?.description}</p>
        </div>

        {/* Title */}
        <div>
          <label className="form-label font-bold text-sm text-primary">
            {currentRelation === 'contradictory' ? 'Contradictory Observation Title' : 'Supporting Observation Title'}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              currentRelation === 'contradictory'
                ? 'e.g. Silt buildup cleared by municipal maintenance crew at 11:30 AM'
                : 'e.g. Observed additional bank erosion 100m upstream'
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

        {/* Location & Photo */}
        <div className="grid-2">
          <div>
            <label className="form-label">Observation Location / Address</label>
            <input
              type="text"
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
              placeholder={targetObs?.location?.address || 'e.g. Elm St Creek Bridge'}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Attached Photo / Test URL (Optional)</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="form-input"
            />
          </div>
        </div>

        {/* Attached Evidence label */}
        <div>
          <label className="form-label">Optional Evidence Document / Sensor Name</label>
          <input
            type="text"
            value={evidenceTitle}
            onChange={(e) => setEvidenceTitle(e.target.value)}
            placeholder="e.g. Municipal Work Order #4421 / Calibrated depth gauge"
            className="form-input"
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
              onClick={closeObservationRelationModal}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{
                background: currentRelation === 'contradictory' ? 'var(--rose-600)' : 'var(--primary-600)'
              }}
            >
              <Send size={14} />
              <span>Publish Independent Observation</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
