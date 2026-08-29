import { useState } from 'react';
import { Modal } from '../common/Modal';
import { ClaimStatusBadge } from '../common/Badge';
import { ProvenanceTrail } from './ProvenanceTrail';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  ShieldCheck, 
  AlertCircle, 
  FileText, 
  User, 
  Calendar, 
  MapPin, 
  ShieldAlert, 
  Share2, 
  Plus,
  GitBranch
} from 'lucide-react';

export const EvidenceInspectorModal = ({ isOpen, onClose, targetClaim, targetObservation }) => {
  const { 
    evidence, 
    observations, 
    claims, 
    disputes,
    openDisputeModal,
    openObservationRelationModal,
    openShareSocialModal,
    inspectEntity
  } = useCareMesh();

  const [activeTab, setActiveTab] = useState('evidence'); // 'evidence' | 'disputes' | 'observations' | 'assessment'

  if (!targetClaim && !targetObservation) return null;

  // Resolve active claim and observation
  const claim = targetClaim || (targetObservation?.claimIds?.length > 0 ? claims.find(c => c.id === targetObservation.claimIds[0]) : null);
  const observation = targetObservation || (claim ? observations.find(o => o.id === claim.observationId) : null);

  const supportingEvidence = claim ? evidence.filter(e => claim.supportingEvidenceIds?.includes(e.id)) : [];
  const contradictingEvidence = claim ? evidence.filter(e => claim.contradictingEvidenceIds?.includes(e.id)) : [];

  // Related disputes for this claim
  const claimDisputes = claim ? disputes.filter(d => d.claimId === claim.id || claim.disputeIds?.includes(d.id)) : [];

  // Supporting & Contradictory observations
  const supportingObsList = observation?.supportingObservationIds?.length > 0
    ? observations.filter(o => observation.supportingObservationIds.includes(o.id))
    : observations.filter(o => o.isSupporting && o.supportingTargetId === observation?.id);

  const contradictoryObsList = observation?.contradictoryObservationIds?.length > 0
    ? observations.filter(o => observation.contradictoryObservationIds.includes(o.id))
    : observations.filter(o => o.isContradiction && o.contradictionTargetId === observation?.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Evidence, Disputes & Provenance Inspector"
      subtitle="Transparent context trail: Observations ↔ Claims ↔ Evidence ↔ Active Challenges ↔ Assessment"
      maxWidth="840px"
    >
      <div className="d-flex flex-column gap-4">
        {/* Claim / Observation Header */}
        <div className="card p-4" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}>
          <div className="d-flex align-center justify-between gap-2 mb-2 flex-wrap">
            <div className="d-flex align-center gap-2">
              <span className="text-xs font-bold text-muted text-uppercase">
                {observation?.category ? `${observation.category.replace('_', ' ')} Observation` : 'Claim Context'}
              </span>
              {observation?.isContradiction && (
                <span className="badge badge-rose text-xs font-bold">Contradictory Report</span>
              )}
              {observation?.isSupporting && (
                <span className="badge badge-primary text-xs font-bold">Supporting Corroboration</span>
              )}
            </div>
            {claim && <ClaimStatusBadge status={claim.status} />}
          </div>

          <h3 className="font-bold text-lg text-primary mb-2">
            {observation?.title || 'Assertion Statement'}
          </h3>

          <p className="text-xs text-secondary mb-3" style={{ lineHeight: '1.5' }}>
            {observation?.description}
          </p>

          {claim && (
            <div className="p-3 mb-2" style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div className="d-flex align-center justify-between mb-1">
                <span className="text-xs font-bold text-secondary">Asserted Claim:</span>
                {claimDisputes.length > 0 && (
                  <span className="text-xs text-rose font-bold d-flex align-center gap-1">
                    <ShieldAlert size={12} /> {claimDisputes.length} Active {claimDisputes.length === 1 ? 'Dispute' : 'Disputes'}
                  </span>
                )}
              </div>
              <p className="text-sm text-primary font-medium mb-0">"{claim.assertionText}"</p>
            </div>
          )}

          {observation?.location && (
            <div className="d-flex align-center gap-4 text-xs text-muted mt-2 flex-wrap">
              <span className="d-flex align-center gap-1">
                <MapPin size={13} />
                <span>{observation.location.address}</span>
              </span>
              <span className="d-flex align-center gap-1">
                <User size={13} />
                <span>Logged by {observation.author?.name || 'Community Member'}</span>
              </span>
              <span className="d-flex align-center gap-1">
                <Calendar size={13} />
                <span>{observation.timestamp}</span>
              </span>
            </div>
          )}

          {/* Action Ribbon: Challenge, Corroborate, Share */}
          <div className="d-flex align-center gap-2 mt-3 pt-3 border-top flex-wrap">
            {claim && (
              <button
                type="button"
                className="btn btn-sm text-rose"
                style={{ background: 'var(--rose-50)', border: '1px solid var(--rose-200)' }}
                onClick={() => openDisputeModal(claim)}
              >
                <ShieldAlert size={14} />
                <span>Dispute Claim</span>
              </button>
            )}

            {observation && (
              <>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => openObservationRelationModal(observation, 'contradictory')}
                >
                  <AlertCircle size={14} className="text-rose" />
                  <span>Add Contradictory Observation</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => openObservationRelationModal(observation, 'supporting')}
                >
                  <Plus size={14} className="text-brand" />
                  <span>Add Supporting Observation</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => openShareSocialModal(observation, 'observation')}
                >
                  <Share2 size={14} />
                  <span>Share to Social</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="d-flex gap-2 border-bottom pb-2 flex-wrap" style={{ borderBottom: '1px solid var(--border-light)' }}>
          <button
            className={`btn btn-sm ${activeTab === 'evidence' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('evidence')}
          >
            <ShieldCheck size={14} />
            <span>Evidence Records ({supportingEvidence.length + contradictingEvidence.length})</span>
          </button>

          <button
            className={`btn btn-sm ${activeTab === 'disputes' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('disputes')}
          >
            <ShieldAlert size={14} className="text-rose" />
            <span>Disputes & Challenges ({claimDisputes.length})</span>
          </button>

          <button
            className={`btn btn-sm ${activeTab === 'observations' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('observations')}
          >
            <GitBranch size={14} />
            <span>Related Observations ({supportingObsList.length + contradictoryObsList.length})</span>
          </button>

          <button
            className={`btn btn-sm ${activeTab === 'assessment' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('assessment')}
          >
            <FileText size={14} />
            <span>Assessment Log</span>
          </button>
        </div>

        {/* TAB 1: EVIDENCE RECORDS */}
        {activeTab === 'evidence' && (
          <div className="d-flex flex-column gap-3">
            {supportingEvidence.length > 0 && (
              <div>
                <h5 className="text-xs font-bold text-secondary text-uppercase mb-2 d-flex align-center gap-2">
                  <ShieldCheck size={15} className="text-brand" />
                  <span>Supporting Evidence ({supportingEvidence.length})</span>
                </h5>
                <div className="d-flex flex-column gap-3">
                  {supportingEvidence.map(ev => (
                    <div key={ev.id} className="card p-3" style={{ borderLeft: '4px solid var(--primary-500)' }}>
                      <div className="d-flex justify-between align-start gap-2 mb-2">
                        <div>
                          <h6 className="font-bold text-sm text-primary">{ev.title}</h6>
                          <span className="text-xs text-muted">Provided by {ev.author} • {ev.timestamp}</span>
                        </div>
                        <span className="badge badge-primary text-xs text-uppercase">{ev.type}</span>
                      </div>

                      {ev.url && (
                        <div className="mb-2" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: '180px' }}>
                          <img src={ev.url} alt={ev.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}

                      <p className="text-xs text-secondary mb-2">{ev.description}</p>

                      <div style={{ background: 'var(--bg-muted)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                        <span className="text-xs font-bold text-secondary d-block">Provenance Audit Trail:</span>
                        <ProvenanceTrail chain={ev.provenanceChain} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {contradictingEvidence.length > 0 && (
              <div className="mt-3">
                <h5 className="text-xs font-bold text-rose text-uppercase mb-2 d-flex align-center gap-2">
                  <AlertCircle size={15} className="text-rose" />
                  <span>Contradicting Records & Dispute Evidence ({contradictingEvidence.length})</span>
                </h5>
                <div className="d-flex flex-column gap-3">
                  {contradictingEvidence.map(ev => (
                    <div key={ev.id} className="card p-3" style={{ borderLeft: '4px solid var(--rose-600)', background: '#fff5f5' }}>
                      <div className="d-flex justify-between align-start gap-2 mb-2">
                        <div>
                          <h6 className="font-bold text-sm text-primary">{ev.title}</h6>
                          <span className="text-xs text-muted">Provided by {ev.author} • {ev.timestamp}</span>
                        </div>
                        <span className="badge badge-rose text-xs text-uppercase">{ev.type}</span>
                      </div>

                      <p className="text-xs text-secondary mb-2">{ev.description}</p>

                      <div style={{ background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #fee2e2' }}>
                        <span className="text-xs font-bold text-secondary d-block">Resolution Investigation:</span>
                        <ProvenanceTrail chain={ev.provenanceChain} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {supportingEvidence.length === 0 && contradictingEvidence.length === 0 && (
              <div className="card p-4 text-center text-muted">
                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No structured evidence files attached yet.</p>
                <p className="text-xs mt-1">CareMesh treats this as an unverified observation until community members attach corroborating photos, tests, or documentation.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DISPUTES & CHALLENGES */}
        {activeTab === 'disputes' && (
          <div className="d-flex flex-column gap-3">
            <div className="d-flex align-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-primary">First-Class Dispute Records</h4>
                <p className="text-xs text-muted">
                  Disputes are substantive challenges with transparent grounds and counter-evidence.
                </p>
              </div>
              {claim && (
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  style={{ background: 'var(--rose-600)', borderColor: 'var(--rose-700)' }}
                  onClick={() => openDisputeModal(claim)}
                >
                  <ShieldAlert size={14} />
                  <span>File New Dispute</span>
                </button>
              )}
            </div>

            {claimDisputes.length > 0 ? (
              <div className="d-flex flex-column gap-3">
                {claimDisputes.map(disp => (
                  <div 
                    key={disp.id}
                    className="card p-4"
                    style={{ borderLeft: '4px solid var(--rose-600)', background: '#ffffff' }}
                  >
                    <div className="d-flex align-center justify-between mb-2 flex-wrap gap-2">
                      <div className="d-flex align-center gap-2">
                        <span className="badge badge-rose text-xs font-bold">
                          Reason: {disp.reason}
                        </span>
                        <span className="badge badge-gray text-xs text-uppercase">
                          Status: {disp.status.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-xs text-muted">{disp.timestamp}</span>
                    </div>

                    <p className="text-xs text-secondary mb-3" style={{ lineHeight: '1.5', fontSize: '0.85rem' }}>
                      <strong>Challenge Explanation:</strong> {disp.explanation}
                    </p>

                    <div className="d-flex align-center justify-between text-xs text-muted pt-2 border-top">
                      <span>Submitted by: <strong>{disp.author?.name}</strong> ({disp.author?.role})</span>
                      {disp.counterEvidenceIds?.length > 0 && (
                        <span className="badge badge-primary text-xs">
                          {disp.counterEvidenceIds.length} Counter-Evidence Attached
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-4 text-center text-muted">
                <ShieldCheck size={32} className="mx-auto mb-2 text-brand opacity-60" />
                <p className="text-sm font-semibold text-primary">No Active Disputes Filed</p>
                <p className="text-xs">This claim currently has no formal challenges recorded on the public ledger.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RELATED OBSERVATIONS */}
        {activeTab === 'observations' && (
          <div className="d-flex flex-column gap-4">
            {/* Contradictory Observations */}
            <div>
              <div className="d-flex align-center justify-between mb-2">
                <h5 className="font-bold text-xs text-rose text-uppercase d-flex align-center gap-2">
                  <AlertCircle size={14} className="text-rose" />
                  <span>Contradictory Observations ({contradictoryObsList.length})</span>
                </h5>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs text-rose font-semibold"
                  onClick={() => openObservationRelationModal(observation, 'contradictory')}
                >
                  + Add Contradiction
                </button>
              </div>

              {contradictoryObsList.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {contradictoryObsList.map(cObs => (
                    <div 
                      key={cObs.id} 
                      className="card p-3 card-interactive cursor-pointer"
                      style={{ borderLeft: '4px solid var(--rose-600)', background: '#fff9f9' }}
                      onClick={() => inspectEntity(cObs, 'observation')}
                    >
                      <div className="d-flex align-center justify-between mb-1">
                        <span className="font-bold text-xs text-primary">{cObs.title}</span>
                        <span className="text-xs text-muted">{cObs.timestamp}</span>
                      </div>
                      <p className="text-xs text-secondary mb-2">{cObs.description}</p>
                      <span className="text-xs text-muted">By {cObs.author?.name} • {cObs.location?.address}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted italic">No contradictory observations reported.</p>
              )}
            </div>

            {/* Supporting Observations */}
            <div className="pt-3 border-top">
              <div className="d-flex align-center justify-between mb-2">
                <h5 className="font-bold text-xs text-brand text-uppercase d-flex align-center gap-2">
                  <ShieldCheck size={14} className="text-brand" />
                  <span>Supporting Corroborating Observations ({supportingObsList.length})</span>
                </h5>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs text-brand font-semibold"
                  onClick={() => openObservationRelationModal(observation, 'supporting')}
                >
                  + Add Supporting Report
                </button>
              </div>

              {supportingObsList.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {supportingObsList.map(sObs => (
                    <div 
                      key={sObs.id} 
                      className="card p-3 card-interactive cursor-pointer"
                      style={{ borderLeft: '4px solid var(--primary-600)', background: 'var(--primary-50)' }}
                      onClick={() => inspectEntity(sObs, 'observation')}
                    >
                      <div className="d-flex align-center justify-between mb-1">
                        <span className="font-bold text-xs text-primary">{sObs.title}</span>
                        <span className="text-xs text-muted">{sObs.timestamp}</span>
                      </div>
                      <p className="text-xs text-secondary mb-2">{sObs.description}</p>
                      <span className="text-xs text-muted">By {sObs.author?.name} • {sObs.location?.address}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted italic">No separate supporting observations attached.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: ASSESSMENT LOG */}
        {activeTab === 'assessment' && (
          <div className="card p-4" style={{ background: 'var(--bg-subtle)' }}>
            <h5 className="font-bold text-sm text-primary mb-2">Contextual Assessment Log</h5>
            <p className="text-xs text-secondary mb-3">
              CareMesh avoids black-box truth scoring or popularity voting. Instead, the platform tracks transparent peer and scientific assessment notes grounded in evidence.
            </p>

            <div className="p-3 mb-3" style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div className="d-flex align-center justify-between mb-2">
                <span className="font-semibold text-xs text-primary">Current Status Assessment</span>
                {claim && <ClaimStatusBadge status={claim.status} />}
              </div>
              <p className="text-xs text-secondary mb-2">
                {claim?.assessmentNotes || 'Awaiting community peer verification.'}
              </p>
              <div className="text-xs text-muted">
                Last assessment check: {claim?.lastUpdated || 'Recently'}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
