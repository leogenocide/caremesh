import { useState, useEffect } from 'react';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  Package, 
  MapPin, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  HandHeart, 
  Send 
} from 'lucide-react';
import { ResourceTypeBadge } from '../common/Badge';

const RequestResourceUseContent = ({ 
  resource, 
  prefill = {}, 
  onClose, 
  currentUser, 
  requests, 
  onSubmitLoan 
}) => {
  // Target type: 'direct' | 'request'
  const [targetType, setTargetType] = useState(prefill.requestId ? 'request' : 'direct');
  const [selectedRequestId, setSelectedRequestId] = useState(prefill.requestId || '');
  const [purpose, setPurpose] = useState(prefill.purpose || '');
  
  const [startDate, setStartDate] = useState(() => prefill.startDate || new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => prefill.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [requestedQuantity, setRequestedQuantity] = useState(prefill.quantity || '1');
  const [logisticsMode, setLogisticsMode] = useState('pickup'); // 'pickup' | 'delivery'
  const [notes, setNotes] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onClose]);

  // Filter requests that the user has or needs
  const myRequests = requests.filter(r => r.requester?.id === currentUser?.id || r.authorId === currentUser?.id);
  const otherActiveRequests = requests.filter(r => r.requester?.id !== currentUser?.id && r.status !== 'fulfilled');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreeTerms || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let finalPurpose = purpose.trim();
      if (targetType === 'request' && selectedRequestId) {
        const reqObj = requests.find(r => r.id === selectedRequestId);
        if (reqObj) finalPurpose = `Fulfilling Request: ${reqObj.title}`;
      }

      await onSubmitLoan(resource.id, {
        requestId: targetType === 'request' ? selectedRequestId : null,
        projectId: null,
        purpose: finalPurpose || `Use of ${resource.title}`,
        startDate,
        dueDate,
        requestedQuantity,
        notes: `[${logisticsMode === 'pickup' ? 'Will Pick Up' : 'Requested Drop-off'}] ${notes.trim()}`,
        termsAccepted: agreeTerms
      });

      setIsSuccess(true);
    } catch (err) {
      console.error('Failed to submit resource loan request:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="modal-overlay animate-fade-in" 
      onClick={onClose}
    >
      <div 
        className="modal-content card p-0 animate-scale-in" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '620px',
          border: '1px solid var(--border-light)'
        }}
      >
        {/* Header */}
        <div 
          className="modal-header border-bottom flex-shrink-0"
          style={{ 
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
            color: '#ffffff'
          }}
        >
          <div className="d-flex align-center gap-3">
            <div 
              style={{ 
                width: '38px', 
                height: '38px', 
                borderRadius: 'var(--radius-lg)', 
                background: 'rgba(59, 130, 246, 0.2)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#60a5fa',
                flexShrink: 0
              }}
            >
              <Package size={20} />
            </div>
            <div>
              <div className="d-flex align-center gap-2">
                <h3 className="font-bold text-md text-white mb-0">Request Resource Use</h3>
                <span className="badge d-none d-sm-inline-flex" style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', fontSize: '0.68rem' }}>
                  Equipment & Capability Loan
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-0 d-none d-sm-block" style={{ opacity: 0.9, fontSize: '0.78rem' }}>
                Coordinate borrowing and shared custody with resource provider
              </p>
            </div>
          </div>

          <button 
            type="button" 
            className="btn btn-ghost btn-sm btn-icon text-white" 
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Resource Summary Banner */}
        <div className="p-3 border-bottom d-flex align-center justify-between gap-3 flex-wrap flex-shrink-0" style={{ background: 'var(--bg-subtle)' }}>
          <div className="d-flex align-center gap-2.5 min-w-0">
            <div className="min-w-0">
              <div className="d-flex align-center gap-1.5 mb-1 flex-wrap">
                <ResourceTypeBadge type={resource.contributionType} />
                <span className="badge badge-gray text-xs">{resource.category}</span>
                <span className="text-xs text-muted d-flex align-center gap-1">
                  <MapPin size={11} /> {resource.location?.address || 'Maplewood Local Area'}
                </span>
              </div>
              <span className="font-bold text-sm text-primary d-block text-truncate">
                {resource.title}
              </span>
            </div>
          </div>

          {resource.provider && (
            <div className="d-flex align-center gap-2 p-1.5 rounded bg-white border flex-shrink-0">
              <img
                src={resource.provider.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'}
                alt={resource.provider.name}
                style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div className="text-xs">
                <span className="font-bold text-primary d-block">{resource.provider.name}</span>
                <span className="text-muted" style={{ fontSize: '0.68rem' }}>Provider</span>
              </div>
            </div>
          )}
        </div>

        {/* Body Form or Success Screen */}
        <div className="modal-body overflow-y-auto" style={{ flex: 1, minHeight: 0 }}>
          {isSuccess ? (
            <div className="text-center py-4 d-flex flex-column align-center gap-3">
              <div 
                style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '50%', 
                  background: 'var(--emerald-50, #ecfdf5)', 
                  color: 'var(--emerald-600, #059669)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h4 className="font-bold text-md text-primary mb-1">Loan Request Dispatched!</h4>
                <p className="text-xs text-secondary mb-0" style={{ maxWidth: '420px', margin: '0 auto', lineHeight: '1.5' }}>
                  Your request to borrow <strong>{resource.title}</strong> has been logged with status <strong>Pending Approval</strong>.
                  A notification and direct message have been sent to <strong>{resource.provider?.name}</strong>.
                </p>
              </div>

              <div className="card p-3 w-100 text-left text-xs d-flex flex-column gap-1.5 mt-2" style={{ background: 'var(--bg-subtle)' }}>
                <div className="d-flex justify-between">
                  <span className="text-muted">Requested Timeframe:</span>
                  <span className="font-bold text-primary">{startDate} to {dueDate}</span>
                </div>
                <div className="d-flex justify-between">
                  <span className="text-muted">Quantity:</span>
                  <span className="font-bold text-primary">{requestedQuantity}</span>
                </div>
                <div className="d-flex justify-between">
                  <span className="text-muted">Logistics Mode:</span>
                  <span className="font-bold text-primary">{logisticsMode === 'pickup' ? 'Borrower Pickup' : 'Requested Delivery'}</span>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-sm mt-2"
                onClick={onClose}
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="d-flex flex-column gap-3.5">
              {/* Step 1: Purpose & Linking */}
              <div>
                <label className="form-label text-xs font-bold text-secondary mb-1 d-block">
                  Intended Purpose & Association
                </label>
                <div className="d-flex gap-2 mb-2">
                  <button
                    type="button"
                    className={`btn btn-xs flex-1 ${targetType === 'direct' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setTargetType('direct')}
                  >
                    Direct Borrow
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs flex-1 ${targetType === 'request' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setTargetType('request')}
                  >
                    <HandHeart size={12} className="mr-1" />
                    Link Help Request / Action
                  </button>
                </div>

                {targetType === 'direct' && (
                  <input
                    type="text"
                    className="form-input text-xs"
                    placeholder="e.g. Clearing storm debris and trimming high branches along 4th Ave"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    required
                  />
                )}

                {targetType === 'request' && (
                  <div className="d-flex flex-column gap-1.5">
                    <select
                      className="form-select text-xs"
                      value={selectedRequestId}
                      onChange={(e) => setSelectedRequestId(e.target.value)}
                      required
                    >
                      <option value="">-- Select an active community help request or action --</option>
                      {myRequests.length > 0 && (
                        <optgroup label="Your Help Requests">
                          {myRequests.map(r => (
                            <option key={r.id} value={r.id}>
                              {r.title} ({r.category}){r.scheduledDate ? ` [${r.scheduledDate}]` : ''}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="Other Community Needs & Actions">
                        {otherActiveRequests.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.title} ({r.category}){r.scheduledDate ? ` [${r.scheduledDate}]` : ''}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    <span className="text-muted" style={{ fontSize: '0.68rem' }}>
                      Linking this loan will cross-reference the request in the transparent matcher and coordinator updates.
                    </span>
                  </div>
                )}
              </div>

              {/* Step 2: Timeframe & Quantity */}
              <div className="grid-3 gap-2.5">
                <div>
                  <label className="form-label text-xs font-bold text-secondary mb-1 d-block">
                    Start Date <span className="text-rose">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-input text-xs"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="form-label text-xs font-bold text-secondary mb-1 d-block">
                    Expected Return <span className="text-rose">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-input text-xs"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="form-label text-xs font-bold text-secondary mb-1 d-block">
                    Quantity Needed
                  </label>
                  <input
                    type="text"
                    className="form-input text-xs"
                    placeholder="e.g. 1 unit"
                    value={requestedQuantity}
                    onChange={(e) => setRequestedQuantity(e.target.value)}
                  />
                </div>
              </div>

              {/* Step 3: Logistics & Notes */}
              <div>
                <label className="form-label text-xs font-bold text-secondary mb-1 d-block">
                  Handoff & Logistics Preference
                </label>
                <div className="d-flex gap-3 mb-2">
                  <label className="d-flex align-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="logistics"
                      value="pickup"
                      checked={logisticsMode === 'pickup'}
                      onChange={() => setLogisticsMode('pickup')}
                    />
                    <span>I will pick up ({resource.location?.address || 'Provider location'})</span>
                  </label>
                  <label className="d-flex align-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="logistics"
                      value="delivery"
                      checked={logisticsMode === 'delivery'}
                      onChange={() => setLogisticsMode('delivery')}
                    />
                    <span>Request on-site drop-off</span>
                  </label>
                </div>

                <textarea
                  className="form-input text-xs"
                  rows={2}
                  placeholder="Any coordination notes, preferred pickup times, or equipment accessories needed..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Step 4: Terms & Care Acknowledgment */}
              <div className="card p-3 text-xs" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
                <div className="d-flex align-start gap-2">
                  <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-primary d-block mb-0.5">
                      Lender Terms & Condition Agreement
                    </span>
                    <p className="text-secondary mb-2" style={{ lineHeight: '1.4' }}>
                      {resource.conditionsTerms || 'Return equipment clean, fueled/charged, and in the same working condition as received.'}
                    </p>
                    <label className="d-flex align-center gap-2 cursor-pointer font-semibold text-primary">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        required
                      />
                      <span>I agree to these loan terms and will return the item by the due date.</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="d-flex align-center justify-end gap-2 pt-2 border-top">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm d-flex align-center gap-1.5"
                  disabled={!agreeTerms || isSubmitting}
                >
                  <Send size={13} />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Loan Request'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export const RequestResourceUseModal = () => {
  const {
    isRequestResourceModalOpen,
    requestResourceTarget,
    closeRequestResourceModal,
    currentUser,
    requests,
    submitResourceLoanRequest
  } = useCareMesh();

  if (!isRequestResourceModalOpen || !requestResourceTarget?.resource) {
    return null;
  }

  return (
    <RequestResourceUseContent
      key={requestResourceTarget.resource.id}
      resource={requestResourceTarget.resource}
      prefill={requestResourceTarget.prefill || {}}
      onClose={closeRequestResourceModal}
      currentUser={currentUser}
      requests={requests}
      onSubmitLoan={submitResourceLoanRequest}
    />
  );
};

export default RequestResourceUseModal;
