import { useState } from 'react';
import { useCareMesh } from '../../context/useCareMesh';
import { getEvidenceBadgeConfig } from './evidenceHelpers';
import { 
  ShieldCheck, 
  AlertCircle, 
  Eye, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  GitBranch,
  Trash2
} from 'lucide-react';

export const EvidenceItemCard = ({ 
  evidence, 
  parentObservation, 
  isContradicting = false,
  isSubPost = false 
}) => {
  const { 
    viewUserProfile, 
    viewEvidenceDetail, 
    inspectEntity,
    openObservationRelationModal, 
    deleteEvidence,
    canUserManage,
    closeEvidenceDetailModal,
    evidence: allEvidence = [], 
    observations = [] 
  } = useCareMesh();

  const [isSubPostsExpanded, setIsSubPostsExpanded] = useState(false);
  const [isProvenanceExpanded, setIsProvenanceExpanded] = useState(false);

  if (!evidence) return null;

  const config = getEvidenceBadgeConfig(evidence.type, isContradicting);
  const BadgeIcon = config.icon;

  // Find child sub-posts on this evidence
  const childSubEvidence = allEvidence.filter(e => 
    (e.parentEvidenceId === evidence.id || e.referencedEvidenceId === evidence.id) && e.id !== evidence.id
  );

  const childSubContradictions = observations.filter(o => 
    o.referencedEvidenceId === evidence.id && (o.isContradiction || o.category === 'contradiction')
  );

  const childSubCorroborations = observations.filter(o => 
    o.referencedEvidenceId === evidence.id && (o.isSupporting || o.is_supporting)
  );

  const totalSubPosts = childSubEvidence.length + childSubContradictions.length + childSubCorroborations.length;

  const handleOpenDetails = (e) => {
    e.stopPropagation();
    if (viewEvidenceDetail) {
      viewEvidenceDetail(evidence, parentObservation);
    }
  };

  const handleCorroborate = (e) => {
    e.stopPropagation();
    if (openObservationRelationModal) {
      openObservationRelationModal(parentObservation || { id: evidence.parentObservationId || 'obs_01', title: evidence.title }, 'supporting', { 
        referencingEvidence: evidence 
      });
    }
  };

  const handleContradict = (e) => {
    e.stopPropagation();
    if (openObservationRelationModal) {
      openObservationRelationModal(parentObservation || { id: evidence.parentObservationId || 'obs_01', title: evidence.title }, 'contradictory', { 
        referencingEvidence: evidence 
      });
    }
  };

  return (
    <div 
      className="card p-3 card-interactive"
      style={{ 
        borderLeft: `4px solid ${config.border}`,
        background: isContradicting ? '#fff9f9' : (isSubPost ? 'var(--bg-subtle)' : '#ffffff'),
        boxShadow: 'var(--shadow-xs)',
        borderRadius: 'var(--radius-md)'
      }}
    >
      {/* Header: Title, Sub-Post Tag, Badge */}
      <div className="d-flex justify-between align-start gap-2 mb-2 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="d-flex align-center gap-1.5 flex-wrap mb-1">
            {isSubPost && (
              <span className="badge badge-primary text-xs font-bold d-inline-flex align-center gap-1" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                <GitBranch size={10} /> Sub-Evidence
              </span>
            )}
            <h6 
              className="font-bold text-sm text-primary cursor-pointer hover:text-brand m-0"
              onClick={handleOpenDetails}
              title="Click to view evidence details"
            >
              {evidence.title}
            </h6>
          </div>
          <div className="d-flex align-center gap-2 text-xs text-muted flex-wrap">
            <span 
              className="user-profile-trigger"
              onClick={(e) => {
                e.stopPropagation();
                if (evidence.authorId) {
                  viewUserProfile({ id: evidence.authorId, name: evidence.author });
                }
              }}
              title={`View ${evidence.author}'s profile`}
            >
              Provided by <strong className="user-profile-name">{evidence.author}</strong>
            </span>
            <span>•</span>
            <span>{evidence.timestamp || 'Recorded on ledger'}</span>
          </div>
        </div>

        <span 
          className={`badge ${config.className} text-xs text-uppercase font-bold d-inline-flex align-center gap-1 flex-shrink-0`}
          style={{ fontSize: '0.7rem' }}
        >
          <BadgeIcon size={12} />
          <span>{config.label}</span>
        </span>
      </div>

      {/* Optional Media Preview Thumbnail */}
      {evidence.url && (
        <div 
          className="mb-2 cursor-pointer" 
          style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: '180px', position: 'relative', cursor: 'pointer' }}
          onClick={handleOpenDetails}
          title="Click to view full size preview"
        >
          <img 
            src={evidence.url} 
            alt={evidence.title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} 
          />
          <span 
            className="badge badge-gray text-xs d-inline-flex align-center gap-1" 
            style={{ 
              position: 'absolute', 
              bottom: '6px', 
              right: '6px', 
              background: 'rgba(0,0,0,0.75)', 
              color: '#ffffff',
              cursor: 'pointer',
              userSelect: 'none',
              pointerEvents: 'none'
            }}
          >
            <Eye size={12} />
            <span>Click to View Full Size</span>
          </span>
        </div>
      )}

      {/* Description */}
      <p className="text-xs text-secondary mb-2" style={{ lineHeight: '1.45' }}>
        {evidence.description}
      </p>

      {/* Provenance Audit Trail Dropdown */}
      {evidence.provenanceChain && evidence.provenanceChain.length > 0 && (
        <div className="mb-2" style={{ background: 'var(--bg-muted)', padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-sm)' }}>
          <div 
            className="d-flex align-center justify-between cursor-pointer"
            onClick={() => setIsProvenanceExpanded(!isProvenanceExpanded)}
          >
            <span className="text-xs font-bold text-secondary d-flex align-center gap-1">
              <ShieldCheck size={12} className="text-brand" />
              <span>Provenance Chain ({evidence.provenanceChain.length} steps)</span>
            </span>
            <button type="button" className="btn-icon btn-xs p-0 text-muted" aria-label="Toggle provenance">
              {isProvenanceExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>

          {isProvenanceExpanded && (
            <div className="mt-2 pt-2 border-top d-flex flex-column gap-1">
              {evidence.provenanceChain.map((step, idx) => (
                <div key={idx} className="d-flex align-center justify-between text-xs text-muted">
                  <span className="truncate">{typeof step === 'string' ? step : step.step}</span>
                  <span className="flex-shrink-0 font-medium ml-2">{typeof step === 'object' ? step.time : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-Post Summary Badges */}
      {totalSubPosts > 0 && (
        <div className="d-flex align-center gap-1.5 mb-2 flex-wrap">
          {childSubEvidence.length > 0 && (
            <span className="badge badge-primary text-xs font-bold" style={{ fontSize: '0.68rem' }}>
              ✓ {childSubEvidence.length} {childSubEvidence.length === 1 ? 'Sub-Evidence' : 'Sub-Evidence Records'}
            </span>
          )}
          {childSubContradictions.length > 0 && (
            <span className="badge badge-rose text-xs font-bold" style={{ fontSize: '0.68rem' }}>
              ⚠ {childSubContradictions.length} {childSubContradictions.length === 1 ? 'Sub-Contradiction' : 'Sub-Contradictions'}
            </span>
          )}
          {childSubCorroborations.length > 0 && (
            <span className="badge badge-secondary text-xs" style={{ fontSize: '0.68rem' }}>
              💬 {childSubCorroborations.length} {childSubCorroborations.length === 1 ? 'Corroborating Report' : 'Corroborating Reports'}
            </span>
          )}
          
          <button 
            type="button" 
            className="btn btn-ghost btn-xs text-brand font-semibold p-0 ml-1"
            onClick={() => setIsSubPostsExpanded(!isSubPostsExpanded)}
          >
            {isSubPostsExpanded ? 'Hide Sub-Posts ▲' : 'Show Sub-Posts ▼'}
          </button>
        </div>
      )}

      {/* Inline Sub-Posts Accordion (if expanded) */}
      {isSubPostsExpanded && totalSubPosts > 0 && (
        <div className="p-2.5 mb-2 rounded border" style={{ background: 'var(--bg-subtle)', borderStyle: 'dashed' }}>
          <div className="d-flex align-center justify-between mb-2">
            <span className="text-xs font-bold text-primary">Sub-Posts on this Evidence:</span>
            <button 
              type="button" 
              className="btn btn-ghost btn-xs text-brand p-0"
              onClick={handleOpenDetails}
            >
              Open Full View →
            </button>
          </div>

          {/* Child Sub-Evidence Items */}
          {childSubEvidence.length > 0 && (
            <div className="mb-2">
              <span className="text-xs font-semibold text-brand d-block mb-1">Sub-Evidence Proof:</span>
              <div className="d-flex flex-column gap-1.5 pl-2 border-left" style={{ borderLeft: '2px solid var(--primary-400)' }}>
                {childSubEvidence.map(subEv => (
                  <div 
                    key={subEv.id} 
                    className="p-1.5 bg-white rounded border card-interactive cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      viewEvidenceDetail(subEv, parentObservation);
                    }}
                  >
                    <div className="d-flex justify-between align-center text-xs">
                      <strong className="text-primary truncate">{subEv.title}</strong>
                      <span className="text-muted ml-2">{subEv.author}</span>
                    </div>
                    <p className="text-xs text-secondary truncate m-0">{subEv.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Child Sub-Contradictions */}
          {childSubContradictions.length > 0 && (
            <div className="mb-2">
              <span className="text-xs font-semibold text-rose d-block mb-1">Sub-Contradictions:</span>
              <div className="d-flex flex-column gap-1.5 pl-2 border-left" style={{ borderLeft: '2px solid var(--rose-400)' }}>
                {childSubContradictions.map(subContra => (
                  <div 
                    key={subContra.id} 
                    className="p-1.5 bg-white rounded border card-interactive cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (closeEvidenceDetailModal) closeEvidenceDetailModal();
                      if (inspectEntity) {
                        inspectEntity(subContra, 'observation');
                      }
                    }}
                    title={`Inspect sub-contradiction: ${subContra.title}`}
                  >
                    <div className="d-flex justify-between align-center text-xs">
                      <strong className="text-rose truncate">{subContra.title}</strong>
                      <span className="text-muted ml-2">{subContra.author?.name}</span>
                    </div>
                    <p className="text-xs text-secondary truncate m-0">{subContra.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Child Sub-Corroborations */}
          {childSubCorroborations.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-brand d-block mb-1">Corroborating Reports:</span>
              <div className="d-flex flex-column gap-1.5 pl-2 border-left" style={{ borderLeft: '2px solid var(--primary-400)' }}>
                {childSubCorroborations.map(subCorrob => (
                  <div 
                    key={subCorrob.id} 
                    className="p-1.5 bg-white rounded border card-interactive cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (closeEvidenceDetailModal) closeEvidenceDetailModal();
                      if (inspectEntity) {
                        inspectEntity(subCorrob, 'observation');
                      }
                    }}
                    title={`Inspect corroborating report: ${subCorrob.title}`}
                  >
                    <div className="d-flex justify-between align-center text-xs">
                      <strong className="text-brand truncate">{subCorrob.title}</strong>
                      <span className="text-muted ml-2">{subCorrob.author?.name}</span>
                    </div>
                    <p className="text-xs text-secondary truncate m-0">{subCorrob.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Action Ribbon: View Details + Corroborate + Contradict + Delete */}
      <div className="d-flex align-center justify-between pt-2 border-top mt-2 flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-primary btn-xs d-flex align-center gap-1 font-semibold"
          onClick={handleOpenDetails}
          title="View this evidence record in full detail"
        >
          <Eye size={12} />
          <span>View Evidence Details →</span>
        </button>

        <div className="d-flex align-center gap-1.5 flex-wrap">
          <button
            type="button"
            className="btn btn-secondary btn-xs d-flex align-center gap-1"
            onClick={handleCorroborate}
            title={`Attach corroborating sub-evidence for "${evidence.title}"`}
          >
            <Plus size={11} className="text-brand" />
            <span>+ Corroborate</span>
          </button>
          <button
            type="button"
            className="btn btn-xs text-rose d-flex align-center gap-1"
            style={{ background: 'var(--rose-50)', border: '1px solid var(--rose-200)' }}
            onClick={handleContradict}
            title={`File sub-contradiction challenging "${evidence.title}"`}
          >
            <AlertCircle size={11} />
            <span>+ Contradict</span>
          </button>
          {canUserManage(evidence) && (
            <button
              type="button"
              className="btn btn-ghost btn-xs text-rose d-flex align-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Are you sure you want to permanently delete evidence "${evidence.title}"? This action cannot be undone.`)) {
                  deleteEvidence(evidence.id);
                }
              }}
              title={`Delete evidence: "${evidence.title}"`}
            >
              <Trash2 size={11} />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvidenceItemCard;
