import { useCareMesh } from '../../context/useCareMesh';
import { 
  ShieldCheck, 
  AlertCircle, 
  MapPin, 
  Clock, 
  Eye, 
  ChevronRight,
  Trash2
} from 'lucide-react';

export const SubPostCard = ({ 
  subPost, 
  relationType = null 
}) => {
  const { 
    viewUserProfile, 
    inspectEntity, 
    openObservationRelationModal,
    deleteObservation,
    canUserManage,
    closeEvidenceDetailModal
  } = useCareMesh();

  if (!subPost) return null;

  const isContradiction = relationType 
    ? relationType === 'contradictory'
    : Boolean(subPost.isContradiction || subPost.category === 'contradiction');

  const evidenceCount = subPost.evidenceIds?.length || 0;
  const contraCount = subPost.contradictoryObservationIds?.length || 0;
  const supCount = subPost.supportingObservationIds?.length || 0;

  const handleInspect = (e) => {
    if (e) e.stopPropagation();
    if (closeEvidenceDetailModal) {
      closeEvidenceDetailModal();
    }
    if (inspectEntity) {
      inspectEntity(subPost, 'observation');
    }
  };

  const handleCorroborate = (e) => {
    e.stopPropagation();
    if (openObservationRelationModal) {
      openObservationRelationModal(subPost, 'supporting');
    }
  };

  const handleContradict = (e) => {
    e.stopPropagation();
    if (openObservationRelationModal) {
      openObservationRelationModal(subPost, 'contradictory');
    }
  };

  return (
    <div 
      className="card p-3 card-interactive cursor-pointer"
      style={{ 
        borderLeft: `4px solid ${isContradiction ? 'var(--rose-600)' : 'var(--primary-600)'}`,
        background: isContradiction ? '#fff9f9' : 'var(--primary-50, #f0fdf4)',
        boxShadow: 'var(--shadow-xs)',
        borderRadius: 'var(--radius-md)'
      }}
      onClick={handleInspect}
    >
      {/* Header: Title, Relation Badge, Category */}
      <div className="d-flex align-center justify-between gap-2 mb-1.5 flex-wrap">
        <div className="d-flex align-center gap-1.5 flex-wrap flex-1 min-w-0">
          <span 
            className={`badge ${isContradiction ? 'badge-rose' : 'badge-primary'} text-xs font-bold d-inline-flex align-center gap-1 flex-shrink-0`}
            style={{ fontSize: '0.68rem', padding: '0.12rem 0.45rem' }}
          >
            {isContradiction ? <AlertCircle size={10} /> : <ShieldCheck size={10} />}
            <span>{isContradiction ? 'Contradictory Sub-Post' : 'Supporting Sub-Post'}</span>
          </span>
          {subPost.category && (
            <span className="badge badge-gray text-xs text-uppercase font-semibold flex-shrink-0" style={{ fontSize: '0.65rem' }}>
              {subPost.category.replace(/_/g, ' ')}
            </span>
          )}
          <h6 className="font-bold text-sm text-primary m-0 flex-1 min-w-0 hover:text-brand" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            {subPost.title}
          </h6>
        </div>

        <span className="text-xs text-muted d-flex align-center gap-1 flex-shrink-0">
          <Clock size={11} />
          <span>{subPost.timestamp || 'Recent'}</span>
        </span>
      </div>

      {/* Description Snippet */}
      <p className="text-xs text-secondary mb-2" style={{ lineHeight: '1.45' }}>
        {subPost.description}
      </p>

      {/* Media Thumbnail Preview if present */}
      {subPost.mediaUrls && subPost.mediaUrls.length > 0 && (
        <div 
          className="mb-2" 
          style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', maxHeight: '140px', maxWidth: '320px' }}
        >
          <img 
            src={subPost.mediaUrls[0]} 
            alt={subPost.title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} 
          />
        </div>
      )}

      {/* Sub-Item Counters & Provenance */}
      <div className="d-flex align-center justify-between text-xs text-muted mb-2 flex-wrap gap-2">
        <div className="d-flex align-center gap-2 flex-wrap">
          <span 
            className="user-profile-trigger"
            onClick={(e) => {
              e.stopPropagation();
              if (subPost.author) viewUserProfile(subPost.author);
            }}
            title={`View ${subPost.author?.name || 'Author'}'s profile`}
          >
            By: <strong className="user-profile-name">{subPost.author?.name || 'Community Member'}</strong>
          </span>
          {subPost.location?.address && (
            <span className="d-flex align-center gap-1">
              • <MapPin size={11} /> {subPost.location.address}
            </span>
          )}
        </div>

        <div className="d-flex align-center gap-1.5 flex-wrap">
          {evidenceCount > 0 && (
            <span className="badge badge-primary text-xs font-semibold" style={{ fontSize: '0.65rem' }}>
              {evidenceCount} Evidence {evidenceCount === 1 ? 'Proof' : 'Proofs'}
            </span>
          )}
          {contraCount > 0 && (
            <span className="badge badge-rose text-xs font-semibold" style={{ fontSize: '0.65rem' }}>
              {contraCount} {contraCount === 1 ? 'Contradiction' : 'Contradictions'}
            </span>
          )}
          {supCount > 0 && (
            <span className="badge badge-secondary text-xs" style={{ fontSize: '0.65rem' }}>
              {supCount} {supCount === 1 ? 'Corroboration' : 'Corroborations'}
            </span>
          )}
        </div>
      </div>

      {/* Action Toolbar on Sub-Post */}
      <div className="d-flex align-center justify-between pt-2 border-top mt-1 flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-primary btn-xs font-semibold d-flex align-center justify-center gap-1 w-100-mobile flex-1"
          onClick={handleInspect}
        >
          <Eye size={12} />
          <span>Inspect Sub-Post & Details</span>
          <ChevronRight size={12} />
        </button>

        <div className="d-flex align-center gap-1.5 flex-wrap w-100-mobile">
          <button
            type="button"
            className="btn btn-secondary btn-xs d-flex align-center justify-center gap-1 flex-1"
            onClick={handleCorroborate}
            title={`Add corroborating sub-post to "${subPost.title}"`}
          >
            <ShieldCheck size={11} className="text-brand" />
            <span>+ Corroborate</span>
          </button>
          <button
            type="button"
            className="btn btn-xs text-rose d-flex align-center justify-center gap-1 flex-1"
            style={{ background: 'var(--rose-50)', border: '1px solid var(--rose-200)' }}
            onClick={handleContradict}
            title={`File counter-contradiction challenging "${subPost.title}"`}
          >
            <AlertCircle size={11} />
            <span>+ Contradict</span>
          </button>
          {canUserManage(subPost) && (
            <button
              type="button"
              className="btn btn-ghost btn-xs text-rose d-flex align-center justify-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Are you sure you want to permanently delete this sub-post "${subPost.title}"? This action cannot be undone.`)) {
                  deleteObservation(subPost.id);
                }
              }}
              title={`Delete sub-post "${subPost.title}"`}
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

export default SubPostCard;
