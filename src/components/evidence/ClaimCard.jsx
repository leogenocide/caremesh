import { ClaimStatusBadge } from '../common/Badge';
import { useCareMesh } from '../../context/useCareMesh';
import { ShieldCheck, AlertCircle, ChevronRight, ShieldAlert, ThumbsUp } from 'lucide-react';

export const ClaimCard = ({ claim, onInspect }) => {
  const { openDisputeModal, supportClaim } = useCareMesh();
  const supportingCount = claim.supportingEvidenceIds?.length || 0;
  const contradictingCount = claim.contradictingEvidenceIds?.length || 0;
  const disputeCount = claim.disputeIds?.length || 0;

  return (
    <div className="card p-3" style={{ padding: '1rem', background: '#fafbfc', border: '1px solid #e2e8f0' }}>
      <div className="d-flex align-center justify-between gap-2 mb-2 flex-wrap">
        <div className="d-flex align-center gap-2">
          <span className="text-xs font-semibold text-muted text-uppercase" style={{ letterSpacing: '0.05em' }}>
            Asserted Claim
          </span>
          {disputeCount > 0 && (
            <span className="badge badge-rose text-xs d-flex align-center gap-1 font-bold">
              <ShieldAlert size={12} />
              <span>{disputeCount} Active {disputeCount === 1 ? 'Dispute' : 'Disputes'}</span>
            </span>
          )}
        </div>
        <ClaimStatusBadge status={claim.status} />
      </div>

      <p className="text-sm font-semibold text-primary mb-2" style={{ lineHeight: '1.45' }}>
        "{claim.assertionText}"
      </p>

      {claim.assessmentNotes && (
        <p className="text-xs text-secondary mb-3" style={{ fontStyle: 'italic', background: '#ffffff', padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid #f1f5f9' }}>
          <strong>Context Assessment:</strong> {claim.assessmentNotes}
        </p>
      )}

      {/* Counts Ribbon */}
      <div className="d-flex align-center gap-3 mb-3 text-xs text-secondary">
        <span className="d-flex align-center gap-1" title="Supporting Evidence">
          <ShieldCheck size={14} className="text-brand" />
          <span>{supportingCount} Supporting Evidence</span>
        </span>
        {contradictingCount > 0 && (
          <span className="d-flex align-center gap-1 text-rose" title="Contradicting Records">
            <AlertCircle size={14} className="text-rose" />
            <span>{contradictingCount} Contradicting Records</span>
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="d-flex align-center justify-between pt-2 border-top gap-2 flex-wrap">
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-ghost btn-xs text-brand font-medium"
            onClick={() => {
              const note = prompt('Add corroborating context note for this claim:');
              if (note) supportClaim({ claimId: claim.id, note });
            }}
          >
            <ThumbsUp size={12} />
            <span>Support</span>
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-xs text-rose font-medium"
            onClick={() => openDisputeModal(claim)}
          >
            <ShieldAlert size={12} />
            <span>Dispute Claim</span>
          </button>
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-xs text-brand font-semibold p-0"
          onClick={() => onInspect ? onInspect(claim) : null}
        >
          <span>Inspect Provenance</span>
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
};
