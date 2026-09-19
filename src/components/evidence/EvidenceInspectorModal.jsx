import { useState } from 'react';
import { Modal } from '../common/Modal';
import { LocationPicker } from '../common/LocationPicker';
import { ClaimStatusBadge } from '../common/Badge';
import { EvidenceItemCard } from './EvidenceItemCard';
import { SubPostCard } from './SubPostCard';
import { useCareMesh } from '../../context/useCareMesh';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../common/Pagination';
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
  GitBranch,
  Edit2,
  Trash2,
  Check,
  X,
  Flag,
  MessageSquare
} from 'lucide-react';

const DisputeResponseThread = ({ responses = [], disp, canUserManage, deleteDisputeResponse, viewUserProfile }) => {
  const pagination = usePagination(responses, 3);
  return (
    <div className="mt-2 pt-2 border-top d-flex flex-column gap-2">
      <span className="text-xs font-bold text-secondary text-uppercase d-flex align-center gap-1.5 mb-0.5">
        <MessageSquare size={13} className="text-brand" />
        <span>Deliberation & Rebuttal Thread ({responses.length})</span>
      </span>

      {pagination.paginatedItems.map(resp => {
        const isSupport = resp.type === 'support';
        return (
          <div 
            key={resp.id}
            className="p-2.5 rounded"
            style={{ 
              background: isSupport ? 'var(--primary-50)' : '#fff8f8', 
              borderLeft: `3px solid ${isSupport ? 'var(--primary-600)' : 'var(--rose-600)'}`,
              borderTop: '1px solid var(--border-light)',
              borderRight: '1px solid var(--border-light)',
              borderBottom: '1px solid var(--border-light)'
            }}
          >
            <div className="d-flex align-center justify-between mb-1 flex-wrap gap-1">
              <div className="d-flex align-center gap-1.5">
                <span className={`badge ${isSupport ? 'badge-primary' : 'badge-rose'} text-xs font-bold`} style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                  {isSupport ? '✓ Supporting Corroboration' : '⚠ Rebuttal / Counter-Challenge'}
                </span>
                {resp.reason && (
                  <span className="text-xs text-muted font-semibold truncate" style={{ maxWidth: '280px' }}>
                    {resp.reason}
                  </span>
                )}
              </div>
              <div className="d-flex align-center gap-1.5">
                <span className="text-xs text-muted">{resp.timestamp}</span>
                {(canUserManage(resp) || canUserManage(disp)) && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs text-rose p-0 d-flex align-center"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this response? This action cannot be undone.')) {
                        deleteDisputeResponse(disp.id, resp.id);
                      }
                    }}
                    title="Delete response"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-primary mb-1.5" style={{ lineHeight: '1.45' }}>
              {resp.explanation}
            </p>

            <div className="d-flex align-center justify-between text-xs text-muted">
              <span 
                className="user-profile-trigger cursor-pointer"
                onClick={() => resp.author && viewUserProfile(resp.author)}
                title={`View ${resp.author?.name || 'Author'}'s profile`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    resp.author && viewUserProfile(resp.author);
                  }
                }}
              >
                By: <strong className="user-profile-name">{resp.author?.name}</strong> ({resp.author?.role || 'Contributor'})
              </span>
              {resp.evidenceIds?.length > 0 && (
                <span className="badge badge-primary text-xs" style={{ fontSize: '0.65rem' }}>
                  {resp.evidenceIds.length} Proof Attached
                </span>
              )}
            </div>
          </div>
        );
      })}

      <Pagination
        compact={true}
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        startIndex={pagination.startIndex}
        endIndex={pagination.endIndex}
        onPageChange={pagination.setPage}
        pageSize={pagination.pageSize}
        onPageSizeChange={pagination.handlePageSizeChange}
        itemName="rebuttals"
      />
    </div>
  );
};

export const EvidenceInspectorModal = ({ isOpen, onClose, targetClaim, targetObservation }) => {
  const { 
    evidence, 
    observations, 
    claims, 
    disputes, 
    openDisputeModal,
    openDisputeResponseModal,
    openObservationRelationModal,
    openShareSocialModal,
    inspectEntity,
    updateObservation,
    deleteObservation,
    deleteDispute,
    deleteDisputeResponse,
    canUserManage,
    openReportModal,
    viewUserProfile
  } = useCareMesh();

  const [activeTab, setActiveTab] = useState('evidence'); // 'evidence' | 'disputes' | 'observations' | 'assessment'
  const PRESET_OBS_CATEGORIES = ['environmental', 'infrastructure', 'hazard', 'health', 'safety', 'resource', 'social', 'food_security', 'human_services', 'safety_hazard'];
  const [isEditingObs, setIsEditingObs] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('environmental');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState({ address: '', lat: null, lng: null });
  const [editStatus, setEditStatus] = useState('action_underway');

  // Resolve active observation and claim
  const observation = targetObservation || (targetClaim ? observations.find(o => o.id === targetClaim.observationId) : null);
  const claim = targetClaim || (observation ? (
    claims.find(c => c.observationId === observation.id) ||
    (observation.claimIds?.length > 0 ? claims.find(c => observation.claimIds.includes(c.id)) : null)
  ) : null);

  // Synthesize resilient claim for sub-posts or legacy observations if no claim row exists
  const resolvedClaim = claim || (observation ? {
    id: `clm_synth_${observation.id}`,
    observationId: observation.id,
    assertionText: observation.title,
    status: observation.status || 'action_underway',
    supportingEvidenceIds: observation.evidenceIds || [],
    contradictingEvidenceIds: [],
    disputeIds: [],
    assessmentNotes: 'Community observation record. Open for peer context, additional measurements, or challenges.',
    lastUpdated: observation.timestamp || 'Recently'
  } : null);

  const observationAuthor = (typeof observation?.author === 'object' && observation?.author !== null)
    ? observation.author
    : (observation?.author || observation?.authorId || observation?.author_id ? {
        id: observation?.authorId || observation?.author_id || observation?.author,
        name: typeof observation?.author === 'string' ? observation.author : (observation?.authorName || 'Field Observer'),
        avatar: observation?.authorAvatar,
        handle: observation?.authorHandle || '@observer'
      } : null);

  // Evidence isolation for this specific observation/sub-post
  const supportingEvidence = observation?.evidenceIds?.length > 0
    ? evidence.filter(e => observation.evidenceIds.includes(e.id))
    : (resolvedClaim ? evidence.filter(e => resolvedClaim.supportingEvidenceIds?.includes(e.id)) : []);
  const contradictingEvidence = resolvedClaim ? evidence.filter(e => resolvedClaim.contradictingEvidenceIds?.includes(e.id)) : [];

  // Related disputes for this claim/sub-post
  const claimDisputes = resolvedClaim ? disputes.filter(d => d.claimId === resolvedClaim.id || resolvedClaim.disputeIds?.includes(d.id) || d.relatedObservationId === observation?.id) : [];

  // Supporting & Contradictory observations targeting this specific post
  const supportingObsList = observation?.supportingObservationIds?.length > 0
    ? observations.filter(o => observation.supportingObservationIds.includes(o.id))
    : observations.filter(o => o.isSupporting && o.supportingTargetId === observation?.id);

  const contradictoryObsList = observation?.contradictoryObservationIds?.length > 0
    ? observations.filter(o => observation.contradictoryObservationIds.includes(o.id))
    : observations.filter(o => o.isContradiction && o.contradictionTargetId === observation?.id);

  // Pagination for sub-items that add up over time
  const suppEvPagination = usePagination(supportingEvidence, 4);
  const contraEvPagination = usePagination(contradictingEvidence, 4);
  const disputesPagination = usePagination(claimDisputes, 3);
  const contraObsPagination = usePagination(contradictoryObsList, 3);
  const suppObsPagination = usePagination(supportingObsList, 3);

  if (!targetClaim && !targetObservation) return null;

  // Compute full ancestor lineage trail for sub-posts (e.g. Root > Parent > Current)
  const getAncestors = (obs) => {
    if (!obs) return [];
    const trail = [];
    let curr = obs;
    const visited = new Set([curr.id]);
    while (curr && (curr.supportingTargetId || curr.contradictionTargetId)) {
      const parentId = curr.supportingTargetId || curr.contradictionTargetId;
      if (!parentId || visited.has(parentId)) break;
      visited.add(parentId);
      const parent = observations.find(o => o.id === parentId);
      if (!parent) break;
      trail.unshift({
        observation: parent,
        relationType: (curr.isSupporting || curr.supportingTargetId === parent.id) ? 'supporting' : 'contradictory'
      });
      curr = parent;
    }
    return trail;
  };

  const ancestors = getAncestors(observation);
  const immediateParent = ancestors.length > 0 ? ancestors[ancestors.length - 1].observation : null;
  const isSubPost = Boolean(observation?.isSupporting || observation?.isContradiction || observation?.supportingTargetId || observation?.contradictionTargetId);


  const handleStartEdit = () => {
    const isCustom = observation.category && !PRESET_OBS_CATEGORIES.includes(observation.category);
    setEditTitle(observation.title || '');
    setIsCustomCategory(Boolean(isCustom));
    setCustomCategory(isCustom ? observation.category : '');
    setEditCategory(isCustom ? '__custom__' : (observation.category || 'environmental'));
    setEditDescription(observation.description || '');
    setEditLocation({
      address: observation.location?.address || '',
      lat: observation.location?.lat ?? null,
      lng: observation.location?.lng ?? null
    });
    setEditStatus(observation.status || 'action_underway');
    setIsEditingObs(true);
  };

  const handleSaveEdit = (e) => {
    if (e) e.preventDefault();
    if (!editTitle.trim()) {
      alert('Please provide a title for the observation.');
      return;
    }
    const finalCategory = isCustomCategory ? (customCategory.trim() || 'environmental') : editCategory;
    updateObservation(observation.id, {
      title: editTitle.trim(),
      category: finalCategory,
      description: editDescription.trim(),
      location: {
        ...(observation.location || {}),
        address: editLocation.address.trim(),
        lat: editLocation.lat,
        lng: editLocation.lng
      },
      address: editLocation.address.trim(),
      lat: editLocation.lat,
      lng: editLocation.lng,
      status: editStatus
    });
    setIsEditingObs(false);
  };

  const handleDeleteObs = () => {
    if (window.confirm('Are you sure you want to permanently delete this observation? This action cannot be undone.')) {
      deleteObservation(observation.id);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Evidence, Disputes & Provenance Inspector"
      subtitle="Transparent context trail: Observations ↔ Claims ↔ Evidence ↔ Active Challenges ↔ Assessment"
      maxWidth="840px"
      zIndex={1050}
    >
      <div className="d-flex flex-column gap-4">
        {/* Sub-Post Parent Lineage Breadcrumb Banner */}
        {isSubPost && (
          <div 
            className="card p-3 mb-1 d-flex flex-column gap-2" 
            style={{ 
              background: observation?.isContradiction ? 'var(--rose-50)' : 'var(--primary-50)', 
              border: `1px solid ${observation?.isContradiction ? 'var(--rose-200)' : 'var(--primary-200)'}`,
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div className="d-flex align-center justify-between flex-wrap gap-2">
              <div className="d-flex align-center gap-1.5 text-xs flex-wrap">
                <GitBranch size={14} className={observation?.isContradiction ? 'text-rose' : 'text-brand'} />
                <span className="font-bold text-secondary text-uppercase" style={{ letterSpacing: '0.04em' }}>Lineage Trail:</span>
                {ancestors.map((anc) => (
                  <span key={anc.observation.id} className="d-flex align-center gap-1.5">
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs p-0 font-bold"
                      style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}
                      onClick={() => inspectEntity(anc.observation, 'observation')}
                      title={`Jump to post: "${anc.observation.title}"`}
                    >
                      {anc.observation.title}
                    </button>
                    <span className="text-muted font-bold">›</span>
                  </span>
                ))}
                <span className="font-bold text-primary">{observation?.title}</span>
                <span className={`badge ${observation?.isContradiction ? 'badge-rose' : 'badge-primary'} text-xs font-bold`}>
                  {observation?.isContradiction ? 'Contradictory Sub-Post' : 'Corroborating Sub-Post'}
                </span>
              </div>

              {immediateParent && (
                <button
                  type="button"
                  className="btn btn-secondary btn-xs d-flex align-center gap-1"
                  onClick={() => inspectEntity(immediateParent, 'observation')}
                  title={`Jump directly back to parent post: "${immediateParent.title}"`}
                >
                  <span>← Back to Parent Post</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Claim / Observation Header */}
        {isEditingObs ? (
          <div className="card p-4" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}>
            <div className="d-flex align-center justify-between mb-3">
              <h4 className="font-bold text-md text-primary d-flex align-center gap-2 mb-0">
                <Edit2 size={16} className="text-brand" /> Edit Observation
              </h4>
              <button
                type="button"
                className="btn btn-ghost btn-xs text-muted"
                onClick={() => setIsEditingObs(false)}
              >
                <X size={14} /> Cancel
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label text-xs font-semibold text-secondary mb-1">Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Observation title..."
                  required
                />
              </div>

              <div className="grid-2 gap-2">
                <div>
                  <div className="d-flex align-center justify-between mb-1">
                    <label className="form-label text-xs font-semibold text-secondary mb-0">Category</label>
                    {isCustomCategory && (
                      <span className="badge badge-primary text-xs" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                        Custom
                      </span>
                    )}
                  </div>
                  <select
                    className="form-input"
                    value={isCustomCategory ? '__custom__' : editCategory}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomCategory(true);
                      } else {
                        setIsCustomCategory(false);
                        setEditCategory(e.target.value);
                      }
                    }}
                  >
                    <option value="environmental">Environmental</option>
                    <option value="infrastructure">Infrastructure</option>
                    <option value="hazard">Hazard</option>
                    <option value="health">Health & Medical</option>
                    <option value="safety">Safety</option>
                    <option value="resource">Resource</option>
                    <option value="social">Social & Community</option>
                    <option value="food_security">Food Security</option>
                    <option value="__custom__">✨ + Custom Category...</option>
                  </select>

                  {isCustomCategory && (
                    <div className="mt-1.5 d-flex align-center gap-1">
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Type custom category..."
                        className="form-input text-xs"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-muted"
                        onClick={() => {
                          setIsCustomCategory(false);
                          setCustomCategory('');
                          setEditCategory('environmental');
                        }}
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="form-label text-xs font-semibold text-secondary mb-1">Status</label>
                  <select
                    className="form-input"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    <option value="action_underway">Action Underway</option>
                    <option value="verified">Verified</option>
                    <option value="under_review">Under Review</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <LocationPicker
                value={editLocation}
                onChange={setEditLocation}
                label="Location & Coordinates"
                placeholder="Street address or location name..."
              />

              <div>
                <label className="form-label text-xs font-semibold text-secondary mb-1">Description / Observations</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Detailed notes, observations, or field reports..."
                />
              </div>

              <div className="d-flex align-center justify-end gap-2 mt-1">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsEditingObs(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                >
                  <Check size={14} /> Save Observation
                </button>
              </div>
            </form>
          </div>
        ) : (
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
              {resolvedClaim && <ClaimStatusBadge status={resolvedClaim.status} />}
            </div>

            <h3 className="font-bold text-lg text-primary mb-2">
              {observation?.title || 'Assertion Statement'}
            </h3>

            <p className="text-xs text-secondary mb-3" style={{ lineHeight: '1.5' }}>
              {observation?.description}
            </p>

            {resolvedClaim && (
              <div className="p-3 mb-2" style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div className="d-flex align-center justify-between mb-1">
                  <span className="text-xs font-bold text-secondary">
                    {isSubPost ? 'Sub-Post Assertion Statement:' : 'Asserted Claim:'}
                  </span>
                  {claimDisputes.length > 0 && (
                    <span className="text-xs text-rose font-bold d-flex align-center gap-1">
                      <ShieldAlert size={12} /> {claimDisputes.length} Active {claimDisputes.length === 1 ? 'Dispute' : 'Disputes'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-primary font-medium mb-0">"{resolvedClaim.assertionText}"</p>
              </div>
            )}

            <div className="d-flex align-center gap-4 text-xs text-muted mt-2 flex-wrap">
              {observation?.location?.address && (
                <span className="d-flex align-center gap-1">
                  <MapPin size={13} />
                  <span>{observation.location.address}</span>
                </span>
              )}
              {observationAuthor && (
                <span 
                  className="d-flex align-center gap-1.5 user-profile-trigger cursor-pointer"
                  onClick={() => {
                    if (viewUserProfile) {
                      viewUserProfile(observationAuthor);
                    }
                  }}
                  title={`View ${observationAuthor.name}'s profile & contributions`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (viewUserProfile) {
                        viewUserProfile(observationAuthor);
                      }
                    }
                  }}
                >
                  {observationAuthor.avatar ? (
                    <img
                      src={observationAuthor.avatar}
                      alt={observationAuthor.name}
                      style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <User size={14} className="text-muted" />
                  )}
                  <span>Logged by <strong className="user-profile-name">{observationAuthor.name}</strong></span>
                </span>
              )}
              {observation?.timestamp && (
                <span className="d-flex align-center gap-1">
                  <Calendar size={13} />
                  <span>{observation.timestamp}</span>
                </span>
              )}
            </div>

            {/* Action Ribbon: Challenge, Corroborate, Share, Edit, Delete */}
            <div className="d-flex align-center gap-2 mt-3 pt-3 border-top flex-wrap">
              {canUserManage(observation) && (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleStartEdit}
                  >
                    <Edit2 size={14} />
                    <span>Edit Observation</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm text-rose"
                    style={{ background: 'var(--rose-50)', border: '1px solid var(--rose-200)' }}
                    onClick={handleDeleteObs}
                  >
                    <Trash2 size={14} />
                    <span>Delete Observation</span>
                  </button>
                </>
              )}

              {(resolvedClaim || observation) && (
                <button
                  type="button"
                  className="btn btn-sm text-rose font-semibold d-flex align-center gap-1.5"
                  style={{ background: 'var(--rose-50)', border: '1px solid var(--rose-300)' }}
                  onClick={() => openDisputeModal({ claim: resolvedClaim, observation })}
                >
                  <ShieldAlert size={14} />
                  <span>Challenge / Counter-Evidence</span>
                </button>
              )}

              {observation && (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => openObservationRelationModal(observation, 'supporting')}
                  >
                    <Plus size={14} className="text-brand" />
                    <span>Add Supporting Corroboration</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => openShareSocialModal(observation, 'observation')}
                    title="Share this observation to other platforms or community feed"
                  >
                    <Share2 size={14} />
                    <span>Share Record</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-muted d-flex align-center gap-1"
                    onClick={() => {
                      openReportModal({
                        targetType: 'observation',
                        targetId: observation?.id || claim?.id,
                        title: observation?.title || claim?.assertionText || 'Public Record',
                        reportedUser: observation?.author,
                        scope: 'public_records'
                      });
                    }}
                    title="Report public record for moderator audit"
                  >
                    <Flag size={14} />
                    <span>Report Record</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="touch-tab-nav border-bottom pb-2">
          <button
            className={`btn btn-sm ${activeTab === 'evidence' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => setActiveTab('evidence')}
          >
            <ShieldCheck size={14} />
            <span>Evidence Records ({supportingEvidence.length + contradictingEvidence.length})</span>
          </button>

          <button
            className={`btn btn-sm ${activeTab === 'disputes' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => setActiveTab('disputes')}
          >
            <ShieldAlert size={14} className="text-rose" />
            <span>Disputes & Challenges ({claimDisputes.length})</span>
          </button>

          <button
            className={`btn btn-sm ${activeTab === 'observations' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => setActiveTab('observations')}
          >
            <GitBranch size={14} />
            <span>Related Observations ({supportingObsList.length + contradictoryObsList.length})</span>
          </button>

          <button
            className={`btn btn-sm ${activeTab === 'assessment' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => setActiveTab('assessment')}
          >
            <FileText size={14} />
            <span>Assessment Log</span>
          </button>
        </div>

        {/* TAB 1: EVIDENCE RECORDS */}
        {activeTab === 'evidence' && (
          <div className="d-flex flex-column gap-3">
            <div className="d-flex align-center justify-between flex-wrap gap-2 pb-2 border-bottom">
              <div>
                <h4 className="font-bold text-sm text-primary">Corroborating & Supporting Records</h4>
                <p className="text-xs text-muted">
                  Empirical measurements, sensor telemetry, photos, and documentation validating this record.
                </p>
              </div>
              {observation && (
                <button
                  type="button"
                  className="btn btn-sm btn-primary d-flex align-center gap-1.5"
                  onClick={() => openObservationRelationModal(observation, 'supporting')}
                >
                  <ShieldCheck size={14} />
                  <span>+ Add Supporting Evidence</span>
                </button>
              )}
            </div>

            {supportingEvidence.length > 0 && (
              <div>
                <h5 className="text-xs font-bold text-secondary text-uppercase mb-2 d-flex align-center gap-2">
                  <ShieldCheck size={15} className="text-brand" />
                  <span>Supporting Evidence ({supportingEvidence.length})</span>
                </h5>
                <div className="d-flex flex-column gap-3">
                  {suppEvPagination.paginatedItems.map(ev => (
                    <EvidenceItemCard
                      key={ev.id}
                      evidence={ev}
                      parentObservation={observation}
                    />
                  ))}
                </div>
                <Pagination
                  compact={true}
                  currentPage={suppEvPagination.currentPage}
                  totalPages={suppEvPagination.totalPages}
                  totalItems={suppEvPagination.totalItems}
                  startIndex={suppEvPagination.startIndex}
                  endIndex={suppEvPagination.endIndex}
                  onPageChange={suppEvPagination.setPage}
                  pageSize={suppEvPagination.pageSize}
                  onPageSizeChange={suppEvPagination.handlePageSizeChange}
                  itemName="supporting records"
                />
              </div>
            )}

            {contradictingEvidence.length > 0 && (
              <div className="mt-3">
                <h5 className="text-xs font-bold text-rose text-uppercase mb-2 d-flex align-center gap-2">
                  <AlertCircle size={15} className="text-rose" />
                  <span>Contradicting Records & Dispute Evidence ({contradictingEvidence.length})</span>
                </h5>
                <div className="d-flex flex-column gap-3">
                  {contraEvPagination.paginatedItems.map(ev => (
                    <EvidenceItemCard
                      key={ev.id}
                      evidence={ev}
                      parentObservation={observation}
                      isContradicting={true}
                    />
                  ))}
                </div>
                <Pagination
                  compact={true}
                  currentPage={contraEvPagination.currentPage}
                  totalPages={contraEvPagination.totalPages}
                  totalItems={contraEvPagination.totalItems}
                  startIndex={contraEvPagination.startIndex}
                  endIndex={contraEvPagination.endIndex}
                  onPageChange={contraEvPagination.setPage}
                  pageSize={contraEvPagination.pageSize}
                  onPageSizeChange={contraEvPagination.handlePageSizeChange}
                  itemName="contradicting records"
                />
              </div>
            )}

            {supportingEvidence.length === 0 && contradictingEvidence.length === 0 && (
              <div className="card p-4 text-center text-muted">
                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-primary">No structured evidence files attached yet.</p>
                <p className="text-xs mt-1 mb-3">CareMesh treats this as an unverified observation until community members attach corroborating measurements, photos, tests, or documentation.</p>
                {observation && (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary mx-auto d-inline-flex align-center gap-1.5"
                    onClick={() => openObservationRelationModal(observation, 'supporting')}
                  >
                    <ShieldCheck size={14} />
                    <span>+ Add Supporting Evidence</span>
                  </button>
                )}
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
              {(resolvedClaim || observation) && (
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  style={{ background: 'var(--rose-600)', borderColor: 'var(--rose-700)' }}
                  onClick={() => openDisputeModal({ claim: resolvedClaim, observation }, 'claim_dispute')}
                >
                  <ShieldAlert size={14} />
                  <span>File New Dispute</span>
                </button>
              )}
            </div>

            {claimDisputes.length > 0 ? (
              <div className="d-flex flex-column gap-3">
                {disputesPagination.paginatedItems.map(disp => (
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
                      <span 
                        className="user-profile-trigger"
                        onClick={() => disp.author && viewUserProfile(disp.author)}
                        title={`View ${disp.author?.name || 'Author'}'s profile`}
                      >
                        Submitted by: <strong className="user-profile-name">{disp.author?.name}</strong> ({disp.author?.role})
                      </span>
                      {disp.counterEvidenceIds?.length > 0 && (
                        <span className="badge badge-primary text-xs">
                          {disp.counterEvidenceIds.length} Counter-Evidence Attached
                        </span>
                      )}
                    </div>

                    {/* Dispute Deliberation Actions & Counters */}
                    {(() => {
                      const supportingResponses = (disp.responses || []).filter(r => r.type === 'support');
                      const rebuttalResponses = (disp.responses || []).filter(r => r.type === 'challenge');
                      return (
                        <>
                          <div className="d-flex align-center justify-between pt-2 border-top mt-2 flex-wrap gap-2">
                            <div className="d-flex align-center gap-2 flex-wrap">
                              {supportingResponses.length > 0 && (
                                <span className="badge badge-primary text-xs d-flex align-center gap-1 font-bold">
                                  <ShieldCheck size={11} />
                                  <span>{supportingResponses.length} {supportingResponses.length === 1 ? 'Support' : 'Supports'}</span>
                                </span>
                              )}
                              {rebuttalResponses.length > 0 && (
                                <span className="badge badge-rose text-xs d-flex align-center gap-1 font-bold">
                                  <AlertCircle size={11} />
                                  <span>{rebuttalResponses.length} {rebuttalResponses.length === 1 ? 'Rebuttal' : 'Rebuttals'}</span>
                                </span>
                              )}
                              {supportingResponses.length === 0 && rebuttalResponses.length === 0 && (
                                <span className="text-xs text-muted italic">Open for peer support or counter-challenge</span>
                              )}
                            </div>

                            <div className="d-flex align-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                className="btn btn-secondary btn-xs d-flex align-center gap-1"
                                onClick={() => openDisputeResponseModal(disp, 'support')}
                                title="Support and corroborate this challenge with additional proof"
                              >
                                <ShieldCheck size={12} className="text-brand" />
                                <span>+ Support Challenge</span>
                              </button>
                              <button
                                type="button"
                                className="btn btn-xs text-rose d-flex align-center gap-1"
                                style={{ background: 'var(--rose-50)', border: '1px solid var(--rose-200)' }}
                                onClick={() => openDisputeResponseModal(disp, 'challenge')}
                                title="Rebut or counter-challenge this dispute"
                              >
                                <AlertCircle size={12} />
                                <span>+ Rebut Challenge</span>
                              </button>
                              {canUserManage(disp) && (
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-xs text-rose d-flex align-center gap-1"
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this dispute record? This action cannot be undone.')) {
                                      deleteDispute(disp.id);
                                    }
                                  }}
                                  title="Delete dispute record"
                                >
                                  <Trash2 size={11} />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Deliberation Thread (Supporting & Rebuttal Responses) */}
                          {disp.responses && disp.responses.length > 0 && (
                            <DisputeResponseThread
                              responses={disp.responses}
                              disp={disp}
                              canUserManage={canUserManage}
                              deleteDisputeResponse={deleteDisputeResponse}
                              viewUserProfile={viewUserProfile}
                            />
                          )}
                        </>
                      );
                    })()}
                  </div>
                ))}
                <Pagination
                  compact={true}
                  currentPage={disputesPagination.currentPage}
                  totalPages={disputesPagination.totalPages}
                  totalItems={disputesPagination.totalItems}
                  startIndex={disputesPagination.startIndex}
                  endIndex={disputesPagination.endIndex}
                  onPageChange={disputesPagination.setPage}
                  pageSize={disputesPagination.pageSize}
                  onPageSizeChange={disputesPagination.handlePageSizeChange}
                  itemName="disputes"
                />
              </div>
            ) : (
              <div className="card p-4 text-center text-muted">
                <ShieldCheck size={32} className="mx-auto mb-2 text-brand opacity-60" />
                <p className="text-sm font-semibold text-primary">No Active Disputes Filed</p>
                <p className="text-xs">This record currently has no formal challenges recorded on the public ledger.</p>
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
                  onClick={() => openDisputeModal({ claim: resolvedClaim, observation }, 'field_observation')}
                >
                  + Add Contradiction
                </button>
              </div>

              {contradictoryObsList.length > 0 ? (
                <div className="d-flex flex-column gap-2.5">
                  {contraObsPagination.paginatedItems.map(cObs => (
                    <SubPostCard
                      key={cObs.id}
                      subPost={cObs}
                      relationType="contradictory"
                    />
                  ))}
                  <Pagination
                    compact={true}
                    currentPage={contraObsPagination.currentPage}
                    totalPages={contraObsPagination.totalPages}
                    totalItems={contraObsPagination.totalItems}
                    startIndex={contraObsPagination.startIndex}
                    endIndex={contraObsPagination.endIndex}
                    onPageChange={contraObsPagination.setPage}
                    pageSize={contraObsPagination.pageSize}
                    onPageSizeChange={contraObsPagination.handlePageSizeChange}
                    itemName="contradictions"
                  />
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
                <div className="d-flex flex-column gap-2.5">
                  {suppObsPagination.paginatedItems.map(sObs => (
                    <SubPostCard
                      key={sObs.id}
                      subPost={sObs}
                      relationType="supporting"
                    />
                  ))}
                  <Pagination
                    compact={true}
                    currentPage={suppObsPagination.currentPage}
                    totalPages={suppObsPagination.totalPages}
                    totalItems={suppObsPagination.totalItems}
                    startIndex={suppObsPagination.startIndex}
                    endIndex={suppObsPagination.endIndex}
                    onPageChange={suppObsPagination.setPage}
                    pageSize={suppObsPagination.pageSize}
                    onPageSizeChange={suppObsPagination.handlePageSizeChange}
                    itemName="supporting reports"
                  />
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
                <span className="font-semibold text-xs text-primary">
                  {isSubPost ? 'Sub-Post Status Assessment' : 'Current Status Assessment'}
                </span>
                {resolvedClaim && <ClaimStatusBadge status={resolvedClaim.status} />}
              </div>
              <p className="text-xs text-secondary mb-2">
                {resolvedClaim?.assessmentNotes || 'Awaiting community peer verification.'}
              </p>
              <div className="text-xs text-muted">
                Last assessment check: {resolvedClaim?.lastUpdated || 'Recently'}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
