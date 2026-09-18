import { useState, useEffect } from 'react';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  X, 
  Flag, 
  AlertTriangle, 
  UserX, 
  CheckCircle2, 
  Building, 
  Globe 
} from 'lucide-react';

const ReportModalContent = ({ reportTarget, closeReportModal, reportContent }) => {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [scope, setScope] = useState(() => reportTarget.scope || (reportTarget.communityId ? 'community' : 'public_records'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        closeReportModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [closeReportModal]);

  const targetType = reportTarget.targetType || 'post';
  const isAvatar = targetType === 'profile_picture';
  const isPost = targetType === 'post';

  const getReasonOptions = () => {
    if (isAvatar) {
      return [
        'Inappropriate or offensive profile picture',
        'Impersonation or misleading user photo',
        'Hate speech, graphic imagery, or harassment in avatar',
        'Privacy or likeness violation',
        'Other profile picture concern'
      ];
    }
    if (isPost) {
      return [
        'Hostility, harassment or abusive language',
        'Misinformation or misleading statement',
        'Spam, advertising or commercial promotion',
        'Breach of community circle safety guidelines',
        'Disruptive trolling or bad-faith coordination',
        'Other post violation'
      ];
    }
    return [
      'Fabricated or fraudulent public record',
      'Endangers public safety or neighborhood health',
      'Defamatory, abusive or discriminatory claim',
      'Inaccurate or obsolete public data',
      'Other public records violation'
    ];
  };

  const reasons = getReasonOptions();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return;

    setIsSubmitting(true);
    try {
      await reportContent({
        targetType: reportTarget.targetType,
        targetId: reportTarget.targetId,
        reason,
        details: details.trim(),
        communityId: scope === 'community' ? reportTarget.communityId : null,
        scope,
        reportedUserId: reportTarget.reportedUser?.id || reportTarget.reportedUserId || null
      });
      setIsSubmitted(true);
      setTimeout(() => {
        closeReportModal();
      }, 1600);
    } catch (err) {
      console.error('Report submission failed:', err);
      setIsSubmitting(false);
      alert(err.message || 'Report submission failed.');
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={closeReportModal}
      style={{ zIndex: 9999 }}
    >
      <div 
        className="modal-content card p-0 animate-scale-in" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: 'min(90vh, 90dvh)',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-light)'
        }}
      >
        {/* Modal Header */}
        <div 
          className="p-4 d-flex align-center justify-between border-bottom flex-shrink-0"
          style={{ background: isAvatar ? '#fff1f2' : 'var(--bg-subtle)' }}
        >
          <div className="d-flex align-center gap-2.5">
            <div 
              style={{ 
                width: '38px', 
                height: '38px', 
                borderRadius: '50%', 
                background: isAvatar ? '#ffe4e6' : 'rgba(239, 68, 68, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--rose-600)'
              }}
            >
              {isAvatar ? <UserX size={20} /> : <Flag size={20} />}
            </div>
            <div>
              <h3 className="font-bold text-sm text-primary mb-0">
                {isAvatar ? 'Report Profile Picture' : `Report ${targetType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
              </h3>
              <p className="text-xs text-muted mb-0">
                Submit for human moderator review and enforcement
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="btn btn-ghost btn-sm btn-icon" 
            onClick={closeReportModal}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        {isSubmitted ? (
          <div className="p-5 text-center d-flex flex-column align-center gap-2 flex-1 overflow-y-auto">
            <CheckCircle2 size={46} className="text-brand animate-scale-in" />
            <h4 className="font-bold text-md text-primary mt-2 mb-0">Report Submitted</h4>
            <p className="text-xs text-secondary mb-0" style={{ maxWidth: '360px' }}>
              Our {scope === 'community' ? 'community moderators' : 'public records moderators'} have been notified. Thank you for keeping CareMesh trustworthy and safe.
            </p>
          </div>
        ) : (
          <form 
            onSubmit={handleSubmit} 
            className="p-4 overflow-y-auto d-flex flex-column gap-3 flex-1"
            style={{ overflowY: 'auto', flex: 1, minHeight: 0, maxHeight: 'calc(90vh - 80px)', WebkitOverflowScrolling: 'touch' }}
          >
            {/* Target Preview */}
            <div 
              className="p-3 rounded d-flex align-center gap-3"
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}
            >
              {reportTarget.reportedUser?.avatar && (
                <img 
                  src={reportTarget.reportedUser.avatar} 
                  alt="" 
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--rose-500)' }} 
                />
              )}
              <div className="min-w-0 flex-1">
                <span className="font-bold text-xs text-primary d-block text-truncate">
                  {reportTarget.title || reportTarget.reportedUser?.name || 'Reported Item'}
                </span>
                {reportTarget.reportedUser?.handle && (
                  <span className="text-xs text-muted d-block">{reportTarget.reportedUser.handle}</span>
                )}
              </div>
            </div>

            {/* Scope Selection */}
            <div>
              <label className="form-label text-xs font-bold text-secondary mb-1 d-block">
                Moderation Scope
              </label>
              <div className="grid-2 gap-2">
                <button
                  type="button"
                  className={`btn btn-sm text-left p-2.5 d-flex align-start gap-2 ${scope === 'community' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ borderRadius: 'var(--radius-md)', height: 'auto' }}
                  onClick={() => setScope('community')}
                >
                  <Building size={16} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-xs d-block">Community Circle</span>
                    <span className="text-xs opacity-80" style={{ fontSize: '0.68rem', lineHeight: '1.2', display: 'block' }}>
                      Elected moderators of this circle
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`btn btn-sm text-left p-2.5 d-flex align-start gap-2 ${scope === 'public_records' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ borderRadius: 'var(--radius-md)', height: 'auto' }}
                  onClick={() => setScope('public_records')}
                >
                  <Globe size={16} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-xs d-block">Public Records</span>
                    <span className="text-xs opacity-80" style={{ fontSize: '0.68rem', lineHeight: '1.2', display: 'block' }}>
                      Platform-wide public moderator team
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Reason Selection */}
            <div>
              <label className="form-label text-xs font-bold text-secondary mb-1 d-block">
                Reason for Reporting <span className="text-rose">*</span>
              </label>
              <div className="d-flex flex-column gap-1.5">
                {reasons.map((r) => (
                  <label 
                    key={r}
                    className="d-flex align-center gap-2 p-2 rounded cursor-pointer card-interactive"
                    style={{ 
                      background: reason === r ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
                      border: `1px solid ${reason === r ? 'var(--rose-500)' : 'var(--border-light)'}`,
                      fontSize: '0.78rem'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="reportReason" 
                      value={r} 
                      checked={reason === r} 
                      onChange={() => setReason(r)}
                      required
                    />
                    <span className={reason === r ? 'font-bold text-primary' : 'text-secondary'}>{r}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Detailed Context */}
            <div>
              <label className="form-label text-xs font-bold text-secondary mb-1 d-block">
                Additional Details (Optional)
              </label>
              <textarea
                className="form-input text-xs"
                rows={3}
                placeholder="Provide helpful context for the moderator (e.g. specific rule broken, timestamps, or patterns)..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>

            {/* Notice */}
            <div className="p-2.5 rounded d-flex align-start gap-2 text-xs" style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b' }}>
              <AlertTriangle size={15} className="flex-shrink-0 mt-0.5 text-rose" />
              <span style={{ fontSize: '0.72rem', lineHeight: '1.35' }}>
                False reports or bad-faith harassment reports violate CareMesh code of conduct. Moderators review each case with care and log actions publicly.
              </span>
            </div>

            {/* Footer Buttons */}
            <div className="d-flex align-center justify-end gap-2 pt-2 border-top">
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={closeReportModal}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary btn-sm"
                style={{ background: 'var(--rose-600)', borderColor: 'var(--rose-600)' }}
                disabled={!reason || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export const ReportModal = () => {
  const {
    isReportModalOpen,
    reportTarget,
    closeReportModal,
    reportContent
  } = useCareMesh();

  if (!isReportModalOpen || !reportTarget) return null;

  return (
    <ReportModalContent
      key={`${reportTarget.targetType}_${reportTarget.targetId || reportTarget.id || 'target'}`}
      reportTarget={reportTarget}
      closeReportModal={closeReportModal}
      reportContent={reportContent}
    />
  );
};

