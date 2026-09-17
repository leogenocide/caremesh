import { useState } from 'react';
import { Modal } from '../common/Modal';
import { ResourceTypeBadge } from '../common/Badge';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  MapPin, 
  Clock, 
  CheckCircle2, 
  GitMerge, 
  MessageSquare,
  Pencil,
  Trash2,
  X,
  Check,
  Package,
  RotateCcw
} from 'lucide-react';

export const ResourceDetailModal = ({ isOpen, onClose, resource }) => {
  const { 
    currentUser,
    matchingFactors, 
    matchResourceToRequest,
    sendDirectMessage,
    navigateTo,
    updateResource,
    deleteResource,
    canUserManage,
    openRequestResourceModal,
    updateLoanAssignmentStatus
  } = useCareMesh();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'loans' | 'matching' | 'contact'
  const [inquiryText, setInquiryText] = useState('');
  const [inquirySent, setInquirySent] = useState(false);

  // Return Confirmation State
  const [returnCondition, setReturnCondition] = useState('Good / Returned Clean');
  const [returnNotes, setReturnNotes] = useState('');
  const [isConfirmingReturn, setIsConfirmingReturn] = useState(false);

  // Owner Edit State
  const PRESET_RESOURCE_CATEGORIES = ['equipment', 'transport', 'supplies', 'skills', 'space', 'tools', 'vehicle'];
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(resource?.title || '');
  const [editDesc, setEditDesc] = useState(resource?.description || '');
  const [editCategory, setEditCategory] = useState(resource?.category || 'equipment');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [editType, setEditType] = useState(resource?.contributionType || 'loan');
  const [editAvailability, setEditAvailability] = useState(resource?.availability || 'immediate');
  const [editQuantity, setEditQuantity] = useState(resource?.quantity || '');
  const [editCondition, setEditCondition] = useState(resource?.condition || '');
  const [editTerms, setEditTerms] = useState(resource?.conditionsTerms || '');

  if (!resource) return null;

  const isOwner = resource.provider?.id === currentUser?.id || resource.providerId === currentUser?.id;
  const canDelete = isOwner || canUserManage(resource);
  const activeLoan = resource.activeLoan || null;
  const pendingRequests = resource.pendingRequests || [];
  const loanHistory = resource.loanHistory || [];

  const handleStartEditing = () => {
    const isCustom = resource.category && !PRESET_RESOURCE_CATEGORIES.includes(resource.category);
    setEditTitle(resource.title || '');
    setEditDesc(resource.description || '');
    setIsCustomCategory(Boolean(isCustom));
    setCustomCategory(isCustom ? resource.category : '');
    setEditCategory(isCustom ? '__custom__' : (resource.category || 'equipment'));
    setEditType(resource.contributionType || 'loan');
    setEditAvailability(resource.availability || 'immediate');
    setEditQuantity(resource.quantity || '');
    setEditCondition(resource.condition || '');
    setEditTerms(resource.conditionsTerms || '');
    setIsEditing(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editDesc.trim()) return;

    const finalCategory = isCustomCategory ? (customCategory.trim() || 'equipment') : editCategory;

    updateResource(resource.id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
      category: finalCategory,
      contributionType: editType,
      availability: editAvailability,
      quantity: editQuantity.trim(),
      condition: editCondition.trim(),
      conditionsTerms: editTerms.trim()
    });

    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to remove and delete "${resource.title}"?`)) {
      deleteResource(resource.id);
      onClose();
    }
  };

  // Find matches involving this resource from matching factors
  const relevantMatches = (matchingFactors || []).filter(mf => 
    mf.resourceId === resource.id || 
    mf.resourceTitle === resource.title
  );

  const handleSendInquiry = (e) => {
    e.preventDefault();
    if (!inquiryText.trim()) return;

    if (sendDirectMessage && resource.provider?.id) {
      sendDirectMessage(`Inquiry regarding "${resource.title}": ${inquiryText.trim()}`);
    }
    setInquirySent(true);
    setInquiryText('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Shared Resource & Capability Details"
      maxWidth="680px"
    >
      <div className="d-flex flex-column gap-3.5">
        {/* Header Ribbon */}
        <div className="d-flex align-start justify-between flex-wrap gap-2 p-3 rounded" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
          <div className="d-flex flex-column gap-1.5 min-w-0">
            <div className="d-flex align-center gap-2 flex-wrap">
              <ResourceTypeBadge type={resource.contributionType} />
              
              {/* Dynamic Loan Status Badge */}
              {resource.loanStatus === 'on_loan' ? (
                <span className="badge badge-amber text-xs font-semibold">
                  On Loan (Due {activeLoan?.dueDate || 'Soon'})
                </span>
              ) : resource.loanStatus === 'pending_approval' ? (
                <span className="badge badge-purple text-xs font-semibold">
                  Pending Request ({pendingRequests.length})
                </span>
              ) : (
                <span className="badge badge-emerald text-xs font-semibold">
                  Available for Loan
                </span>
              )}

              <span className="badge badge-gray text-xs">{resource.category}</span>
            </div>

            <div className="d-flex align-center gap-2 flex-wrap">
              <h3 className="font-bold text-lg text-primary mb-0">{resource.title}</h3>
              {!isOwner && (
                <button
                  type="button"
                  className="btn btn-primary btn-xs d-inline-flex align-center gap-1"
                  onClick={() => {
                    onClose();
                    openRequestResourceModal(resource);
                  }}
                  title="Submit a borrow request for this item"
                >
                  <Package size={12} />
                  <span>Request to Borrow</span>
                </button>
              )}
            </div>

            <div className="d-flex align-center gap-3 text-xs text-muted flex-wrap">
              <span className="d-flex align-center gap-1">
                <MapPin size={12} className="text-primary" /> {resource.location?.address || 'Maplewood Local Area'}
              </span>
              <span className="d-flex align-center gap-1">
                <Clock size={12} className="text-muted" /> Available: {resource.availability || 'On Demand'}
              </span>
            </div>
          </div>

          {/* Provider Card */}
          {resource.provider && (
            <div className="d-flex align-center gap-2 p-2 rounded bg-white border flex-shrink-0">
              <img
                src={resource.provider.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'}
                alt={resource.provider.name}
                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div className="min-w-0">
                <span className="text-xs font-bold text-primary d-block text-truncate" style={{ maxWidth: '120px' }}>{resource.provider.name}</span>
                <span className="text-xs text-brand font-semibold d-block">{resource.provider.handle || '@provider'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="d-flex border-bottom pb-1 gap-2 flex-wrap">
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'overview' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview & Specifications
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'loans' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('loans')}
          >
            <Package size={14} className="mr-1" />
            <span>Loan & Custody</span>
            {pendingRequests.length > 0 && (
              <span className="badge badge-rose ml-1 text-xs" style={{ padding: '0.1rem 0.35rem', fontSize: '0.65rem' }}>
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'matching' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('matching')}
          >
            Compatible Needs ({relevantMatches.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'contact' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('contact')}
          >
            Coordinate / Inquire
          </button>
        </div>

        {/* TAB 1: OVERVIEW & SPECIFICATIONS */}
        {activeTab === 'overview' && (
          <div className="d-flex flex-column gap-3">
            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="p-3 rounded border d-flex flex-column gap-2.5" style={{ background: 'var(--bg-subtle)' }}>
                <span className="font-bold text-xs text-primary d-flex align-center gap-1">
                  <Pencil size={13} className="text-brand" /> Edit Shared Resource Offer
                </span>

                <div className="form-group">
                  <label className="form-label text-xs mb-1 font-semibold">Title</label>
                  <input
                    type="text"
                    className="form-input text-xs"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label text-xs mb-1 font-semibold">Description</label>
                  <textarea
                    className="form-input text-xs"
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    required
                  />
                </div>

                <div className="grid-3 gap-2">
                  <div className="form-group">
                    <div className="d-flex align-center justify-between mb-1">
                      <label className="form-label text-xs mb-0 font-semibold">Category</label>
                      {isCustomCategory && (
                        <span className="badge badge-primary text-xs" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                          Custom
                        </span>
                      )}
                    </div>
                    <select
                      className="form-select text-xs"
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
                      <option value="equipment">Equipment & Tools</option>
                      <option value="transport">Transportation</option>
                      <option value="supplies">Supplies</option>
                      <option value="skills">Specialized Skills</option>
                      <option value="space">Venue & Space</option>
                      <option value="tools">Tools & Hand Implements</option>
                      <option value="vehicle">Vehicles & Transport</option>
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
                            setEditCategory('equipment');
                          }}
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label text-xs mb-1 font-semibold">Contribution Type</label>
                    <select
                      className="form-select text-xs"
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                    >
                      <option value="loan">Community Loan</option>
                      <option value="donation">Donation</option>
                      <option value="volunteer_labor">Volunteer Labor</option>
                      <option value="shared_use">Shared Use</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label text-xs mb-1 font-semibold">Availability</label>
                    <select
                      className="form-select text-xs"
                      value={editAvailability}
                      onChange={(e) => setEditAvailability(e.target.value)}
                    >
                      <option value="immediate">Immediate / On Demand</option>
                      <option value="weekends">Weekends Only</option>
                      <option value="scheduled">Scheduled in Advance</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>
                </div>

                <div className="grid-3 gap-2">
                  <div className="form-group">
                    <label className="form-label text-xs mb-1 font-semibold">Quantity / Capacity</label>
                    <input
                      type="text"
                      className="form-input text-xs"
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(e.target.value)}
                      placeholder="e.g. 1 unit, 4 passenger seats"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label text-xs mb-1 font-semibold">Condition</label>
                    <input
                      type="text"
                      className="form-input text-xs"
                      value={editCondition}
                      onChange={(e) => setEditCondition(e.target.value)}
                      placeholder="e.g. Good, Certified, Heavy duty"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label text-xs mb-1 font-semibold">Terms / Access</label>
                    <input
                      type="text"
                      className="form-input text-xs"
                      value={editTerms}
                      onChange={(e) => setEditTerms(e.target.value)}
                      placeholder="e.g. Return cleaned, Pickup required"
                    />
                  </div>
                </div>

                <div className="d-flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs d-flex align-center gap-1"
                    onClick={() => setIsEditing(false)}
                  >
                    <X size={12} />
                    <span>Cancel</span>
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-xs d-flex align-center gap-1"
                    disabled={!editTitle.trim() || !editDesc.trim()}
                  >
                    <Check size={12} />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <label className="form-label text-xs font-bold text-secondary mb-1">
                  Resource Description & Usage Scope
                </label>
                <p className="text-xs text-primary p-3 rounded" style={{ background: 'var(--bg-subtle)', lineHeight: '1.6', border: '1px solid var(--border-light)' }}>
                  {resource.description}
                </p>
              </div>
            )}

            {/* Specifications Grid */}
            <div className="grid-3 gap-2 text-xs">
              <div className="p-2.5 rounded border bg-white">
                <span className="text-muted d-block mb-0.5">Quantity / Capacity</span>
                <span className="font-bold text-primary d-block">{resource.quantity || '1 unit'}</span>
              </div>
              <div className="p-2.5 rounded border bg-white">
                <span className="text-muted d-block mb-0.5">Condition & Status</span>
                <span className="font-bold text-primary d-block">{resource.condition || 'Good / Tested'}</span>
              </div>
              <div className="p-2.5 rounded border bg-white">
                <span className="text-muted d-block mb-0.5">Terms / Access Mode</span>
                <span className="font-bold text-primary d-block">{resource.conditionsTerms || 'Community Loan'}</span>
              </div>
            </div>

            {/* Location & Access Instructions */}
            <div className="p-3 rounded border" style={{ background: '#ffffff' }}>
              <span className="font-bold text-xs text-primary d-flex align-center gap-1.5 mb-1.5">
                <MapPin size={13} className="text-primary" />
                <span>Staging & Pickup Location</span>
              </span>
              <p className="text-xs text-secondary mb-0">
                {resource.location?.address || 'Maplewood Local Distribution Center'}. Contact provider for direct coordination instructions.
              </p>
            </div>
          </div>
        )}

        {/* TAB: LOAN & CUSTODY MANAGEMENT */}
        {activeTab === 'loans' && (
          <div className="d-flex flex-column gap-3">
            {/* Non-owner Quick Borrow CTA */}
            {!isOwner && (
              <div className="p-3 rounded border bg-primary-50 border-primary-200 d-flex align-center justify-between gap-3 flex-wrap">
                <div>
                  <span className="font-bold text-xs text-primary d-block">Need to borrow this equipment?</span>
                  <span className="text-xs text-secondary">Submit dates, quantity, and purpose to the lender.</span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    onClose();
                    openRequestResourceModal(resource);
                  }}
                >
                  <Package size={14} className="mr-1" />
                  <span>Request Resource Use</span>
                </button>
              </div>
            )}

            {/* Active Custody Status */}
            {activeLoan ? (
              <div className="card p-3 border" style={{ background: 'var(--amber-50, #fffbeb)', borderColor: 'var(--amber-200, #fde68a)' }}>
                <div className="d-flex align-center justify-between mb-2">
                  <div className="d-flex align-center gap-2">
                    <span className="badge badge-amber text-xs font-bold text-uppercase">
                      {activeLoan.status === 'in_transit' ? 'Item In Transit / Returning' : 'Currently On Loan'}
                    </span>
                    <span className="text-xs text-muted">
                      Loaned to <strong>{activeLoan.borrower?.name}</strong>
                    </span>
                  </div>
                  <span className="text-xs font-bold text-amber-900">
                    Due: {activeLoan.dueDate || 'Flexible'}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-white border text-xs d-flex flex-column gap-1.5 mb-2.5">
                  <div className="d-flex justify-between">
                    <span className="text-muted">Purpose:</span>
                    <span className="font-semibold text-primary">{activeLoan.purpose}</span>
                  </div>
                  <div className="d-flex justify-between">
                    <span className="text-muted">Timeframe:</span>
                    <span className="text-primary">{activeLoan.startDate || 'Started'} to {activeLoan.dueDate || 'Open'}</span>
                  </div>
                  <div className="d-flex justify-between">
                    <span className="text-muted">Quantity Held:</span>
                    <span className="text-primary">{activeLoan.requestedQuantity}</span>
                  </div>
                  {activeLoan.notes && (
                    <div className="d-flex justify-between">
                      <span className="text-muted">Logistics Notes:</span>
                      <span className="text-secondary">{activeLoan.notes}</span>
                    </div>
                  )}
                </div>

                {/* Return Handshake Controls */}
                {isOwner ? (
                  <div className="d-flex flex-column gap-2 pt-1 border-top">
                    {isConfirmingReturn ? (
                      <div className="p-2.5 rounded bg-white border d-flex flex-column gap-2">
                        <span className="font-bold text-xs text-primary">Confirm Return & Equipment Condition:</span>
                        <div className="grid-2 gap-2">
                          <div>
                            <label className="form-label text-xs mb-1">Returned Condition</label>
                            <select
                              className="form-select text-xs"
                              value={returnCondition}
                              onChange={(e) => setReturnCondition(e.target.value)}
                            >
                              <option value="Good / Returned Clean">Good / Returned Clean</option>
                              <option value="Minor Wear / Acceptable">Minor Wear / Acceptable</option>
                              <option value="Needs Cleaning / Maintenance">Needs Cleaning / Maintenance</option>
                              <option value="Damaged / Follow-up Needed">Damaged / Follow-up Needed</option>
                            </select>
                          </div>
                          <div>
                            <label className="form-label text-xs mb-1">Check-in Notes</label>
                            <input
                              type="text"
                              className="form-input text-xs"
                              placeholder="e.g. Returned clean with accessories"
                              value={returnNotes}
                              onChange={(e) => setReturnNotes(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="d-flex justify-end gap-2">
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => setIsConfirmingReturn(false)}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-xs"
                            onClick={async () => {
                              await updateLoanAssignmentStatus(resource.id, activeLoan.id, 'completed', {
                                returnCondition,
                                notes: returnNotes
                              });
                              setIsConfirmingReturn(false);
                            }}
                          >
                            <Check size={12} />
                            <span>Confirm & Restore to Available</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="d-flex justify-end gap-2">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => setIsConfirmingReturn(true)}
                        >
                          <RotateCcw size={13} />
                          <span>Confirm Return & Restore Available</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  currentUser?.id === activeLoan.borrowerId && activeLoan.status !== 'in_transit' && (
                    <div className="d-flex justify-end pt-1">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={async () => {
                          await updateLoanAssignmentStatus(resource.id, activeLoan.id, 'in_transit');
                        }}
                      >
                        <RotateCcw size={13} />
                        <span>Mark Item as Returned</span>
                      </button>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="p-3 rounded border bg-white d-flex align-center justify-between text-xs">
                <div className="d-flex align-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <div>
                    <span className="font-bold text-primary d-block">Item is in Storage & Available for Loan</span>
                    <span className="text-muted">No active custody. Ready for community borrow requests.</span>
                  </div>
                </div>
                <span className="badge badge-emerald text-xs font-semibold">Available</span>
              </div>
            )}

            {/* Pending Requests Section */}
            {isOwner && (
              <div className="d-flex flex-column gap-2">
                <div className="d-flex align-center justify-between">
                  <h4 className="font-bold text-xs text-primary mb-0 text-uppercase">
                    Pending Borrow Requests ({pendingRequests.length})
                  </h4>
                </div>

                {pendingRequests.length > 0 ? (
                  pendingRequests.map(req => (
                    <div key={req.id} className="p-3 rounded border bg-white d-flex flex-column gap-2">
                      <div className="d-flex align-start justify-between gap-2">
                        <div className="d-flex align-center gap-2">
                          <img
                            src={req.borrower?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'}
                            alt={req.borrower?.name}
                            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <span className="font-bold text-xs text-primary d-block">{req.borrower?.name}</span>
                            <span className="text-xs text-muted">{req.borrower?.handle || '@neighbor'}</span>
                          </div>
                        </div>

                        <span className="badge badge-purple text-xs font-semibold">
                          Requested: {req.startDate} to {req.dueDate}
                        </span>
                      </div>

                      <p className="text-xs text-secondary mb-0 p-2 rounded" style={{ background: 'var(--bg-subtle)' }}>
                        <strong>Purpose:</strong> {req.purpose}
                        {req.notes && <span className="d-block mt-0.5 text-muted"><strong>Logistics:</strong> {req.notes}</span>}
                      </p>

                      <div className="d-flex justify-end gap-2 pt-1 border-top">
                        <button
                          type="button"
                          className="btn btn-secondary btn-xs"
                          onClick={() => updateLoanAssignmentStatus(resource.id, req.id, 'cancelled')}
                        >
                          <X size={12} />
                          <span>Decline</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-xs"
                          onClick={() => updateLoanAssignmentStatus(resource.id, req.id, 'accepted')}
                        >
                          <Check size={12} />
                          <span>Approve Loan Request</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded border text-center text-muted text-xs" style={{ background: 'var(--bg-subtle)' }}>
                    No pending borrow requests right now.
                  </div>
                )}
              </div>
            )}

            {/* Loan History Section */}
            <div className="d-flex flex-column gap-2">
              <h4 className="font-bold text-xs text-primary mb-0 text-uppercase">
                Past Loans & Check-in History ({loanHistory.length})
              </h4>
              {loanHistory.length > 0 ? (
                <div className="d-flex flex-column gap-1.5">
                  {loanHistory.map(hist => (
                    <div key={hist.id} className="p-2.5 rounded border bg-white d-flex align-center justify-between text-xs gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-primary d-block text-truncate">
                          {hist.borrower?.name}: {hist.purpose}
                        </span>
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {hist.startDate} &rarr; {hist.returnDate ? hist.returnDate.split('T')[0] : hist.dueDate}
                          {hist.returnCondition && ` • Condition: ${hist.returnCondition}`}
                        </span>
                      </div>
                      <span className={`badge ${hist.status === 'completed' ? 'badge-emerald' : 'badge-gray'} text-xs font-semibold flex-shrink-0`}>
                        {hist.status === 'completed' ? 'Returned / Closed' : 'Declined'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2.5 rounded border text-center text-muted text-xs" style={{ background: 'var(--bg-subtle)' }}>
                  No past loan history recorded yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: COMPATIBLE COMMUNITY NEEDS */}
        {activeTab === 'matching' && (
          <div className="d-flex flex-column gap-3">
            <div className="p-2.5 rounded bg-primary-50 border border-primary-200 text-brand text-xs d-flex align-center gap-2">
              <GitMerge size={15} className="flex-shrink-0" />
              <span>
                These community requests match this resource's category, technical specifications, and location proximity.
              </span>
            </div>

            {relevantMatches.length > 0 ? (
              <div className="d-flex flex-column gap-2.5">
                {relevantMatches.map(match => (
                  <div key={match.id} className="p-3 rounded border bg-white">
                    <div className="d-flex align-start justify-between gap-2 mb-2">
                      <div>
                        <span className="font-bold text-xs text-primary d-block">{match.requestTitle}</span>
                        <span className="text-xs text-muted">Requested in <strong>{match.requester?.location || 'Maplewood'}</strong></span>
                      </div>
                      <span className={`badge ${match.status === 'Ready to Coordinate' ? 'badge-emerald' : 'badge-amber'} text-xs font-semibold flex-shrink-0`}>
                        {match.status}
                      </span>
                    </div>

                    <p className="text-xs text-secondary mb-2" style={{ lineHeight: '1.45', background: 'var(--bg-subtle)', padding: '6px 10px', borderRadius: '4px' }}>
                      💡 {match.summaryExplanation}
                    </p>

                    <div className="d-flex gap-1 flex-wrap mb-2.5">
                      {(match.factors || []).map((f, fIdx) => (
                        <span 
                          key={fIdx}
                          className={`badge ${f.status === 'pass' ? 'badge-emerald' : f.status === 'warn' ? 'badge-amber' : 'badge-rose'} text-xs`}
                          style={{ fontSize: '0.68rem' }}
                        >
                          {f.status === 'pass' ? '✓' : f.status === 'warn' ? '⚠' : '✗'} {f.label}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary btn-xs w-100 d-flex align-center justify-center gap-1.5"
                      onClick={() => {
                        matchResourceToRequest(match.requestId, resource.id);
                        alert(`Assigned "${resource.title}" to request "${match.requestTitle}".`);
                      }}
                    >
                      <GitMerge size={13} />
                      <span>Confirm & Assign to this Request</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded text-center border text-muted text-xs" style={{ background: 'var(--bg-subtle)' }}>
                No active requests currently matched to this resource.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COORDINATE & INQUIRE */}
        {activeTab === 'contact' && (
          <div className="d-flex flex-column gap-3">
            {inquirySent ? (
              <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald d-flex align-center justify-between">
                <div className="d-flex align-center gap-2">
                  <CheckCircle2 size={16} />
                  <span className="text-xs font-semibold">Your message has been sent to {resource.provider?.name}!</span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => {
                    onClose();
                    navigateTo('inbox');
                  }}
                >
                  View in Inbox
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendInquiry} className="p-3 rounded border d-flex flex-column gap-2.5" style={{ background: 'var(--bg-subtle)' }}>
                <span className="font-bold text-xs text-primary d-flex align-center gap-1.5">
                  <MessageSquare size={14} className="text-brand" />
                  <span>Send Direct Message to Provider ({resource.provider?.name})</span>
                </span>
                <textarea
                  className="form-input text-xs"
                  rows={3}
                  placeholder={`Hi ${resource.provider?.name || 'Neighbor'}, I would like to coordinate using "${resource.title}" for an upcoming neighborhood project...`}
                  value={inquiryText}
                  onChange={(e) => setInquiryText(e.target.value)}
                  required
                />
                <div className="d-flex justify-end gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm d-flex align-center gap-1.5"
                  >
                    <MessageSquare size={14} />
                    <span>Send Inquiry Message</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="d-flex align-center justify-between gap-2 pt-2 border-top">
          <div>
            {canDelete && (
              <button
                type="button"
                className="btn btn-ghost btn-xs text-rose d-flex align-center gap-1"
                onClick={handleDelete}
              >
                <Trash2 size={13} />
                <span>Delete Resource</span>
              </button>
            )}
          </div>
          <div className="d-flex gap-2">
            {isOwner && !isEditing && (
              <button
                type="button"
                className="btn btn-secondary btn-sm d-flex align-center gap-1"
                onClick={handleStartEditing}
              >
                <Pencil size={13} />
                <span>Edit Resource</span>
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
export default ResourceDetailModal;
