import { useState } from 'react';
import { Modal } from '../common/Modal';
import { useCareMesh } from '../../context/useCareMesh';
import { EvidenceItemCard } from './EvidenceItemCard';
import { getEvidenceBadgeConfig } from './evidenceHelpers';
import { SubPostCard } from './SubPostCard';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../common/Pagination';
import { 
  ShieldCheck, 
  AlertCircle, 
  ArrowLeft, 
  Clock, 
  Share2, 
  Flag, 
  Plus, 
  ExternalLink,
  Layers,
  GitBranch,
  Trash2
} from 'lucide-react';

export const EvidenceDetailModal = () => {
  const { 
    selectedEvidenceDetail, 
    closeEvidenceDetailModal, 
    viewEvidenceDetail,
    inspectEntity, 
    viewUserProfile, 
    openObservationRelationModal, 
    openShareSocialModal, 
    openReportModal, 
    deleteEvidence,
    canUserManage,
    evidence: allEvidence = [], 
    observations = [] 
  } = useCareMesh();

  const [activeTab, setActiveTab] = useState('sub_evidence'); // 'sub_evidence' | 'sub_contradictions' | 'provenance'

  const evidence = selectedEvidenceDetail?.evidence || selectedEvidenceDetail;
  const passedParentObs = selectedEvidenceDetail?.parentObservation || null;

  const evidenceAuthor = (typeof evidence?.author === 'object' && evidence?.author !== null)
    ? evidence.author
    : (evidence?.author || evidence?.authorId || evidence?.author_id ? {
        id: evidence?.authorId || evidence?.author_id || evidence?.author,
        name: typeof evidence?.author === 'string' ? evidence.author : 'Evidence Author',
        avatar: evidence?.authorAvatar,
        handle: evidence?.authorHandle || '@author'
      } : null);

  // Resolve parent observation
  const parentObservation = passedParentObs || observations.find(o => 
    o.id === evidence?.parentObservationId || (o.evidenceIds && o.evidenceIds.includes(evidence?.id))
  ) || null;

  // Resolve parent evidence (if this is a sub-evidence)
  const parentEvidence = evidence?.parentEvidenceId 
    ? allEvidence.find(e => e.id === evidence.parentEvidenceId) 
    : null;

  // Resolve child sub-evidence
  const childSubEvidence = evidence ? allEvidence.filter(e => 
    (e.parentEvidenceId === evidence.id || e.referencedEvidenceId === evidence.id) && e.id !== evidence.id
  ) : [];

  // Resolve child sub-contradictions
  const childSubContradictions = evidence ? observations.filter(o => 
    o.referencedEvidenceId === evidence.id && (o.isContradiction || o.category === 'contradiction')
  ) : [];

  const subEvPagination = usePagination(childSubEvidence, 4);
  const subContraPagination = usePagination(childSubContradictions, 4);

  if (!selectedEvidenceDetail) return null;

  const badgeConfig = getEvidenceBadgeConfig(evidence.type);
  const BadgeIcon = badgeConfig.icon;

  const handleBackToParent = () => {
    closeEvidenceDetailModal();
    if (parentObservation) {
      inspectEntity(parentObservation, 'observation');
    }
  };

  const handleAddSubEvidence = () => {
    if (openObservationRelationModal) {
      openObservationRelationModal(parentObservation || { id: evidence.parentObservationId || 'obs_01', title: evidence.title }, 'supporting', { 
        referencingEvidence: evidence 
      });
    }
  };

  const handleAddSubContradiction = () => {
    if (openObservationRelationModal) {
      openObservationRelationModal(parentObservation || { id: evidence.parentObservationId || 'obs_01', title: evidence.title }, 'contradictory', { 
        referencingEvidence: evidence 
      });
    }
  };

  return (
    <Modal
      isOpen={Boolean(selectedEvidenceDetail)}
      onClose={closeEvidenceDetailModal}
      title={evidence.title}
      subtitle="CareMesh Empirical Evidence Proof • Public Ledger Record"
      maxWidth="850px"
      zIndex={1080}
    >
      <div className="d-flex flex-column gap-4">
        {/* 1. Lineage Breadcrumb Banner */}
        <div 
          className="card p-2.5 d-flex align-center justify-between flex-wrap gap-2"
          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}
        >
          <div className="d-flex align-center gap-1.5 flex-wrap text-xs text-muted min-w-0 flex-1">
            <span className="font-semibold text-secondary d-flex align-center gap-1 flex-shrink-0">
              <Layers size={13} className="text-brand" />
              <span>Lineage:</span>
            </span>

            {parentObservation && (
              <>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs text-brand font-semibold p-0 text-truncate"
                  style={{ maxWidth: '140px' }}
                  onClick={handleBackToParent}
                  title="Inspect root observation post"
                >
                  {parentObservation.title}
                </button>
                <span>›</span>
              </>
            )}

            {parentEvidence && (
              <>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs text-brand font-semibold p-0 text-truncate"
                  style={{ maxWidth: '140px' }}
                  onClick={() => {
                    if (viewEvidenceDetail) {
                      viewEvidenceDetail(parentEvidence, parentObservation);
                    }
                  }}
                  title="Inspect parent evidence record"
                >
                  {parentEvidence.title}
                </button>
                <span>›</span>
              </>
            )}

            <span className="font-bold text-primary text-truncate" style={{ maxWidth: '160px' }}>
              {evidence.title}
            </span>
          </div>

          {parentObservation && (
            <button
              type="button"
              className="btn btn-secondary btn-xs d-flex align-center justify-center gap-1 font-semibold flex-shrink-0 w-100-mobile"
              onClick={handleBackToParent}
            >
              <ArrowLeft size={12} />
              <span>Back to Parent Post</span>
            </button>
          )}
        </div>

        {/* 2. Metadata Banner & Proof Type */}
        <div className="d-flex align-center justify-between flex-wrap gap-3 pb-2 border-bottom">
          <div className="d-flex align-center gap-2 flex-wrap">
            <span 
              className={`badge ${badgeConfig.className} text-xs text-uppercase font-bold d-inline-flex align-center gap-1.5`}
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
            >
              <BadgeIcon size={14} />
              <span>{badgeConfig.label}</span>
            </span>

            {evidence.parentEvidenceId && (
              <span className="badge badge-primary text-xs font-bold d-inline-flex align-center gap-1">
                <GitBranch size={11} />
                <span>Sub-Evidence Record</span>
              </span>
            )}
          </div>

          <div className="d-flex align-center gap-3 text-xs text-muted flex-wrap">
            {evidenceAuthor && (
              <span 
                className="d-flex align-center gap-1.5 user-profile-trigger cursor-pointer"
                onClick={() => {
                  viewUserProfile(evidenceAuthor);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    viewUserProfile(evidenceAuthor);
                  }
                }}
                title={`View ${evidenceAuthor.name}'s profile`}
              >
                <img
                  src={evidenceAuthor.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={evidenceAuthor.name}
                  style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <span>Author: <strong className="user-profile-name">{evidenceAuthor.name}</strong></span>
              </span>
            )}
            {evidenceAuthor && <span>•</span>}
            <span className="d-flex align-center gap-1">
              <Clock size={12} />
              <span>{evidence.timestamp || 'Recorded'}</span>
            </span>
          </div>
        </div>

        {/* 3. Media Viewer / High-Fidelity Display */}
        {evidence.url ? (
          <div 
            className="card p-2" 
            style={{ background: '#000000', borderRadius: 'var(--radius-md)', overflow: 'hidden', textAlign: 'center' }}
          >
            <img 
              src={evidence.url} 
              alt={evidence.title} 
              style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain', margin: '0 auto', display: 'block' }} 
            />
            <div className="pt-2 text-xs text-muted d-flex align-center justify-between px-2" style={{ color: '#d1d5db' }}>
              <span>High-Resolution Ground Proof Attachment</span>
              <a 
                href={evidence.url} 
                target="_blank" 
                rel="noreferrer" 
                className="d-flex align-center gap-1 text-xs" 
                style={{ color: 'var(--primary-400)' }}
              >
                <span>Open Original</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        ) : (
          <div className="card p-3 d-flex align-center gap-3" style={{ background: 'var(--bg-subtle)' }}>
            <div 
              style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: 'var(--radius-md)', 
                background: 'var(--primary-100)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--primary-700)'
              }}
            >
              <BadgeIcon size={20} />
            </div>
            <div className="flex-1">
              <span className="font-bold text-xs text-primary d-block">Structured Telemetry & Field Measurement Proof</span>
              <span className="text-xs text-muted">Direct digital sensor log recorded to the CareMesh public verification ledger.</span>
            </div>
          </div>
        )}

        {/* 4. Description & Empirical Findings */}
        <div>
          <h5 className="font-bold text-xs text-secondary text-uppercase mb-1.5">Empirical Findings & Record Description</h5>
          <p className="text-sm text-primary p-3 bg-white rounded border" style={{ lineHeight: '1.55', whiteSpace: 'pre-line' }}>
            {evidence.description}
          </p>
        </div>

        {/* 5. Provenance Audit Trail */}
        {evidence.provenanceChain && evidence.provenanceChain.length > 0 && (
          <div>
            <h5 className="font-bold text-xs text-secondary text-uppercase mb-2 d-flex align-center gap-1.5">
              <ShieldCheck size={14} className="text-brand" />
              <span>Full Provenance Audit Trail ({evidence.provenanceChain.length} steps)</span>
            </h5>
            <div className="p-3 bg-subtle rounded border d-flex flex-column gap-2">
              {evidence.provenanceChain.map((step, idx) => (
                <div key={idx} className="d-flex align-start gap-2.5 text-xs">
                  <span 
                    className="badge badge-primary font-mono text-xs flex-shrink-0"
                    style={{ width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <span className="text-primary font-medium">{typeof step === 'string' ? step : step.step}</span>
                  </div>
                  {typeof step === 'object' && step.time && (
                    <span className="text-muted flex-shrink-0 font-medium">{step.time}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Recursive Child Sub-Posts Suite (Sub-Evidence & Sub-Contradictions) */}
        <div className="pt-2 border-top">
          <div className="d-flex align-center justify-between mb-3 flex-wrap gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-primary mb-0.5">Sub-Posts Created on this Evidence</h4>
              <p className="text-xs text-muted mb-0">
                Community members can attach secondary corroborating proof (sub-evidence) or challenge this proof (sub-contradictions).
              </p>
            </div>

            <div className="d-flex align-center gap-2 flex-wrap w-100-mobile">
              <button
                type="button"
                className="btn btn-secondary btn-xs d-flex align-center justify-center gap-1 font-semibold flex-1"
                onClick={handleAddSubEvidence}
              >
                <Plus size={12} className="text-brand" />
                <span>+ Add Sub-Evidence</span>
              </button>
              <button
                type="button"
                className="btn btn-xs text-rose d-flex align-center justify-center gap-1 font-semibold flex-1"
                style={{ background: 'var(--rose-50)', border: '1px solid var(--rose-200)' }}
                onClick={handleAddSubContradiction}
              >
                <AlertCircle size={12} />
                <span>+ Add Sub-Contradiction</span>
              </button>
            </div>
          </div>

          {/* Sub-Post Tabs */}
          <div className="touch-tab-nav border-bottom pb-2 mb-3">
            <button
              type="button"
              className={`btn btn-xs ${activeTab === 'sub_evidence' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ whiteSpace: 'nowrap' }}
              onClick={() => setActiveTab('sub_evidence')}
            >
              <ShieldCheck size={13} />
              <span>Corroborating Sub-Evidence ({childSubEvidence.length})</span>
            </button>
            <button
              type="button"
              className={`btn btn-xs ${activeTab === 'sub_contradictions' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ whiteSpace: 'nowrap' }}
              onClick={() => setActiveTab('sub_contradictions')}
            >
              <AlertCircle size={13} className="text-rose" />
              <span>Sub-Contradictions & Challenges ({childSubContradictions.length})</span>
            </button>
          </div>

          {/* TAB: SUB-EVIDENCE */}
          {activeTab === 'sub_evidence' && (
            <div className="d-flex flex-column gap-2.5">
              {childSubEvidence.length > 0 ? (
                <>
                  {subEvPagination.paginatedItems.map(subEv => (
                    <EvidenceItemCard
                      key={subEv.id}
                      evidence={subEv}
                      parentObservation={parentObservation}
                      isSubPost={true}
                    />
                  ))}
                  <Pagination
                    compact={true}
                    currentPage={subEvPagination.currentPage}
                    totalPages={subEvPagination.totalPages}
                    totalItems={subEvPagination.totalItems}
                    startIndex={subEvPagination.startIndex}
                    endIndex={subEvPagination.endIndex}
                    onPageChange={subEvPagination.setPage}
                    pageSize={subEvPagination.pageSize}
                    onPageSizeChange={subEvPagination.handlePageSizeChange}
                    itemName="sub-evidence"
                  />
                </>
              ) : (
                <div className="card p-4 text-center text-muted">
                  <ShieldCheck size={28} className="mx-auto mb-1.5 text-brand opacity-60" />
                  <p className="text-xs font-bold text-primary mb-1">No Secondary Sub-Evidence Attached Yet</p>
                  <p className="text-xs mb-2">Have complementary sensor readings, photography, or field metrics? Corroborate this proof.</p>
                  <button
                    type="button"
                    className="btn btn-primary btn-xs mx-auto d-inline-flex align-center gap-1"
                    onClick={handleAddSubEvidence}
                  >
                    <Plus size={12} />
                    <span>+ Add First Sub-Evidence Proof</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: SUB-CONTRADICTIONS */}
          {activeTab === 'sub_contradictions' && (
            <div className="d-flex flex-column gap-2.5">
              {childSubContradictions.length > 0 ? (
                <>
                  {subContraPagination.paginatedItems.map(subContra => (
                    <SubPostCard
                      key={subContra.id}
                      subPost={subContra}
                      relationType="contradictory"
                    />
                  ))}
                  <Pagination
                    compact={true}
                    currentPage={subContraPagination.currentPage}
                    totalPages={subContraPagination.totalPages}
                    totalItems={subContraPagination.totalItems}
                    startIndex={subContraPagination.startIndex}
                    endIndex={subContraPagination.endIndex}
                    onPageChange={subContraPagination.setPage}
                    pageSize={subContraPagination.pageSize}
                    onPageSizeChange={subContraPagination.handlePageSizeChange}
                    itemName="sub-contradictions"
                  />
                </>
              ) : (
                <div className="card p-4 text-center text-muted">
                  <ShieldCheck size={28} className="mx-auto mb-1.5 text-brand opacity-60" />
                  <p className="text-xs font-bold text-primary mb-1">No Sub-Contradictions Filed</p>
                  <p className="text-xs mb-2">This evidence proof has not been disputed or challenged by any community peer.</p>
                  <button
                    type="button"
                    className="btn btn-xs text-rose mx-auto d-inline-flex align-center gap-1"
                    style={{ background: 'var(--rose-50)', border: '1px solid var(--rose-200)' }}
                    onClick={handleAddSubContradiction}
                  >
                    <AlertCircle size={12} />
                    <span>+ File Sub-Contradiction</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 7. Footer Actions */}
        <div className="d-flex align-center justify-between pt-3 border-top flex-wrap gap-2">
          <div className="d-flex align-center gap-2 flex-wrap w-100-mobile">
            <button
              type="button"
              className="btn btn-secondary btn-sm d-flex align-center justify-center gap-1.5 flex-1"
              onClick={() => openShareSocialModal(evidence, 'observation')}
            >
              <Share2 size={13} />
              <span>Share Evidence</span>
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm text-muted d-flex align-center justify-center gap-1 flex-1"
              onClick={() => {
                openReportModal({
                  targetType: 'evidence',
                  targetId: evidence.id,
                  title: evidence.title,
                  reportedUser: { name: evidence.author },
                  scope: 'public_records'
                });
              }}
            >
              <Flag size={13} />
              <span>Report Proof</span>
            </button>
          </div>

          <div className="d-flex align-center gap-2 flex-wrap w-100-mobile justify-end">
            {canUserManage(evidence) && (
              <button
                type="button"
                className="btn btn-sm text-rose d-flex align-center justify-center gap-1.5 flex-1"
                style={{ background: 'var(--rose-50)', border: '1px solid var(--rose-200)' }}
                onClick={() => {
                  if (window.confirm(`Are you sure you want to permanently delete evidence record "${evidence.title}"? This action cannot be undone.`)) {
                    deleteEvidence(evidence.id);
                    closeEvidenceDetailModal();
                  }
                }}
                title="Delete this evidence record"
              >
                <Trash2 size={13} />
                <span>Delete Evidence</span>
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary btn-sm flex-1"
              onClick={closeEvidenceDetailModal}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EvidenceDetailModal;
