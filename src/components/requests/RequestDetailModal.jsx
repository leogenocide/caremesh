import { useState } from 'react';
import { Modal } from '../common/Modal';
import { UrgencyBadge } from '../common/Badge';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  HandHeart, 
  MapPin, 
  Clock, 
  Users, 
  Wrench, 
  Package, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  GitMerge,
  Pencil,
  Trash2,
  X,
  Lock,
  Globe
} from 'lucide-react';

export const RequestDetailModal = ({ isOpen, onClose, request }) => {
  const { 
    currentUser, 
    respondToRequest, 
    matchingFactors, 
    matchResourceToRequest,
    openCreateModal,
    updateRequest,
    deleteRequest,
    canUserManage,
    communities
  } = useCareMesh();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'volunteers' | 'matcher'
  const [selectedRole, setSelectedRole] = useState('General Volunteer');
  const [customNote, setCustomNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState('');

  // Owner Edit State
  const PRESET_REQUEST_CATEGORIES = ['labor', 'supplies', 'transport', 'equipment', 'skills', 'general', 'environmental', 'food_security'];
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(request?.title || '');
  const [editDesc, setEditDesc] = useState(request?.description || '');
  const [editCategory, setEditCategory] = useState(request?.category || 'general');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [editUrgency, setEditUrgency] = useState(request?.urgency || 'medium');
  const [editPeopleNeeded, setEditPeopleNeeded] = useState(request?.peopleNeeded || 1);
  const [editSkillsStr, setEditSkillsStr] = useState((request?.requiredSkills || []).join(', '));
  const [editCommunityId, setEditCommunityId] = useState(request?.communityId || '');
  const [editVisibility, setEditVisibility] = useState(request?.visibility || 'public');

  if (!request) return null;

  const affiliatedCommunity = communities?.find(c => c.id === request.communityId);
  const isOwner = request.requester?.id === currentUser?.id || request.requester_id === currentUser?.id;
  const canDelete = isOwner || canUserManage(request, affiliatedCommunity);
  const isUserJoined = Boolean(currentUser?.id && request.responses?.some(resp => resp.user?.id === currentUser.id));
  const hasQuickActions = request.quickActions && request.quickActions.length > 0;

  // Find matches involving this request from matching factors
  const relevantMatches = (matchingFactors || []).filter(mf => 
    mf.requestId === request.id || 
    mf.requestTitle === request.title
  );

  const handleStartEditing = () => {
    const isCustom = request.category && !PRESET_REQUEST_CATEGORIES.includes(request.category);
    setEditTitle(request.title || '');
    setEditDesc(request.description || '');
    setIsCustomCategory(Boolean(isCustom));
    setCustomCategory(isCustom ? request.category : '');
    setEditCategory(isCustom ? '__custom__' : (request.category || 'general'));
    setEditUrgency(request.urgency || 'medium');
    setEditPeopleNeeded(request.peopleNeeded || 1);
    setEditSkillsStr((request.requiredSkills || []).join(', '));
    setEditCommunityId(request.communityId || '');
    setEditVisibility(request.visibility || 'public');
    setIsEditing(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editDesc.trim()) return;

    const skillsArray = editSkillsStr.split(',').map(s => s.trim()).filter(Boolean);
    const finalCategory = isCustomCategory ? (customCategory.trim() || 'general') : editCategory;

    updateRequest(request.id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
      category: finalCategory,
      urgency: editUrgency,
      peopleNeeded: Number(editPeopleNeeded) || 1,
      requiredSkills: skillsArray,
      communityId: editCommunityId || null,
      visibility: editCommunityId ? editVisibility : 'public'
    });

    setFeedbackNotice('Request details updated successfully.');
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to cancel and delete "${request.title}"?`)) {
      deleteRequest(request.id);
      onClose();
    }
  };

  const handleVolunteerSubmit = (e) => {
    e.preventDefault();
    if (isOwner) {
      setFeedbackNotice('As the requester, you cannot volunteer for your own help request.');
      return;
    }
    setIsSubmitting(true);
    const roleText = customNote.trim() ? `${selectedRole} (${customNote.trim()})` : selectedRole;
    respondToRequest(request.id, roleText);
    setFeedbackNotice(`You committed to help as "${roleText}". Coordination notification sent!`);
    setIsSubmitting(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'fulfilled':
        return <span className="badge badge-emerald text-xs">🟢 Fulfilled</span>;
      case 'partially_fulfilled':
        return <span className="badge badge-amber text-xs">🟡 Partially Fulfilled</span>;
      default:
        return <span className="badge badge-primary text-xs">🔵 Open for Help</span>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Help Request Details & Mutual Aid Coordination"
      maxWidth="680px"
    >
      <div className="d-flex flex-column gap-3.5">
        {/* Header Ribbon */}
        <div className="d-flex align-start justify-between flex-wrap gap-2 p-3 rounded" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
          <div className="d-flex flex-column gap-1.5 min-w-0">
            <div className="d-flex align-center gap-2 flex-wrap">
              <UrgencyBadge urgency={request.urgency} />
              <span className="badge badge-gray text-xs text-uppercase font-semibold">{request.category}</span>
              {getStatusBadge(request.status)}
              {affiliatedCommunity && (
                request.visibility === 'group_only' ? (
                  <span 
                    className="badge text-xs font-bold d-inline-flex align-center gap-1"
                    style={{ background: '#f3e8ff', color: '#7e22ce', border: '1px solid #d8b4fe' }}
                    title="Visible only to members of this group"
                  >
                    <Lock size={11} />
                    <span>Group Only: {affiliatedCommunity.name}</span>
                  </span>
                ) : (
                  <span 
                    className="badge badge-secondary text-xs d-inline-flex align-center gap-1"
                    title="Linked community group"
                  >
                    <Globe size={11} />
                    <span>{affiliatedCommunity.name}</span>
                  </span>
                )
              )}
            </div>
            <h3 className="font-bold text-lg text-primary mb-0">{request.title}</h3>
            <div className="d-flex align-center gap-3 text-xs text-muted flex-wrap">
              <span className="d-flex align-center gap-1">
                <MapPin size={12} className="text-primary" /> {request.location?.address || 'Maplewood Corridor'}
              </span>
              <span className="d-flex align-center gap-1">
                <Clock size={12} className="text-muted" /> Requested {request.createdAt || 'Recently'}
              </span>
            </div>
          </div>

          {/* Requester Avatar Card */}
          {request.requester && (
            <div className="d-flex align-center gap-2 p-2 rounded bg-white border flex-shrink-0">
              <img
                src={request.requester.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt={request.requester.name}
                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div className="min-w-0">
                <span className="text-xs font-bold text-primary d-block text-truncate" style={{ maxWidth: '120px' }}>{request.requester.name}</span>
                <span className="text-xs text-brand font-semibold d-block">{request.requester.handle || '@requester'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="d-flex border-bottom pb-1 gap-2">
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'overview' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview & Needs
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'volunteers' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('volunteers')}
          >
            Volunteers ({request.peopleJoined || 0}/{request.peopleNeeded || 1})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'matcher' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('matcher')}
          >
            Compatible Resources ({relevantMatches.length})
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackNotice && (
          <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald d-flex align-center gap-2 text-xs">
            <CheckCircle2 size={16} className="flex-shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
        )}

        {/* TAB 1: OVERVIEW & NEEDS */}
        {activeTab === 'overview' && (
          <div className="d-flex flex-column gap-3">
            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="p-3 rounded border d-flex flex-column gap-2.5" style={{ background: 'var(--bg-subtle)' }}>
                <span className="font-bold text-xs text-primary d-flex align-center gap-1">
                  <Pencil size={13} className="text-brand" /> Edit Help Request
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
                      <option value="labor">Volunteer Labor</option>
                      <option value="supplies">Supplies & Material</option>
                      <option value="transport">Transportation</option>
                      <option value="equipment">Tools & Equipment</option>
                      <option value="skills">Specialized Skills</option>
                      <option value="food_security">Food Security</option>
                      <option value="environmental">Environmental</option>
                      <option value="general">General</option>
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
                            setEditCategory('general');
                          }}
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label text-xs mb-1 font-semibold">Urgency</label>
                    <select
                      className="form-select text-xs"
                      value={editUrgency}
                      onChange={(e) => setEditUrgency(e.target.value)}
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label text-xs mb-1 font-semibold">People Needed</label>
                    <input
                      type="number"
                      min={1}
                      className="form-input text-xs"
                      value={editPeopleNeeded}
                      onChange={(e) => setEditPeopleNeeded(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label text-xs mb-1 font-semibold">Required Skills (comma separated)</label>
                  <input
                    type="text"
                    className="form-input text-xs"
                    value={editSkillsStr}
                    onChange={(e) => setEditSkillsStr(e.target.value)}
                    placeholder="e.g. Carpentry, Heavy Lifting, First Aid"
                  />
                </div>

                <div className="grid-2 gap-2">
                  <div className="form-group">
                    <label className="form-label text-xs mb-1 font-semibold">Community Affiliation</label>
                    <select
                      className="form-select text-xs"
                      value={editCommunityId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditCommunityId(val);
                        if (!val) setEditVisibility('public');
                      }}
                    >
                      <option value="">-- Independent / None --</option>
                      {(communities || []).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {editCommunityId && (
                    <div className="form-group">
                      <label className="form-label text-xs mb-1 font-semibold">Visibility Scope</label>
                      <select
                        className="form-select text-xs"
                        value={editVisibility}
                        onChange={(e) => setEditVisibility(e.target.value)}
                      >
                        <option value="public">🌐 Public (All Neighbors)</option>
                        <option value="group_only">🔒 Visible Only to Group</option>
                      </select>
                    </div>
                  )}
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
                  Problem & Assistance Description
                </label>
                <p className="text-xs text-primary p-3 rounded" style={{ background: 'var(--bg-subtle)', lineHeight: '1.6', border: '1px solid var(--border-light)' }}>
                  {request.description}
                </p>
              </div>
            )}

            {/* Volunteer Capacity Progress */}
            <div className="p-3 rounded border" style={{ background: '#ffffff' }}>
              <div className="d-flex justify-between align-center mb-1.5">
                <span className="font-bold text-xs text-primary d-flex align-center gap-1.5">
                  <Users size={14} className="text-brand" />
                  <span>Volunteer Fulfillment Progress</span>
                </span>
                <span className="text-xs font-semibold text-secondary">
                  {request.peopleJoined || 0} of {request.peopleNeeded || 1} Volunteers Committed ({request.progressPercentage || 0}%)
                </span>
              </div>
              <div className="progress-bar-bg" style={{ height: '8px' }}>
                <div className="progress-bar-fill" style={{ width: `${request.progressPercentage || 0}%` }} />
              </div>
            </div>

            {/* Required Skills & Equipment Grid */}
            <div className="grid-2 gap-3">
              {/* Required Skills */}
              <div className="p-3 rounded border">
                <span className="font-bold text-xs text-secondary d-flex align-center gap-1.5 mb-2">
                  <Wrench size={13} className="text-primary" />
                  <span>Required Skills & Capabilities</span>
                </span>
                {request.requiredSkills && request.requiredSkills.length > 0 ? (
                  <div className="d-flex gap-1.5 flex-wrap">
                    {request.requiredSkills.map((skill, idx) => (
                      <span key={idx} className="badge badge-primary text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted">No specific certifications required. All neighbors welcome.</span>
                )}
              </div>

              {/* Required Tools / Resources */}
              <div className="p-3 rounded border">
                <span className="font-bold text-xs text-secondary d-flex align-center gap-1.5 mb-2">
                  <Package size={13} className="text-amber" />
                  <span>Required Tools & Materials</span>
                </span>
                {request.requiredResources && request.requiredResources.length > 0 ? (
                  <div className="d-flex gap-1.5 flex-wrap">
                    {request.requiredResources.map((res, idx) => (
                      <span key={idx} className="badge badge-amber text-xs font-semibold">
                        {res}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted">No additional heavy equipment specified.</span>
                )}
              </div>
            </div>

            {/* Quick Actions Micro-Contributions */}
            {hasQuickActions && (
              <div className="p-3 rounded" style={{ background: 'var(--amber-50)', border: '1px dashed var(--amber-300)' }}>
                <span className="font-bold text-xs text-amber d-flex align-center gap-1.5 mb-2 text-uppercase">
                  <Sparkles size={13} /> Quick Ways to Contribute Immediately:
                </span>
                <div className="d-flex flex-column gap-2">
                  {request.quickActions.map(qa => (
                    <div 
                      key={qa.id}
                      className="d-flex align-center justify-between gap-2 p-2.5 rounded bg-white border"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="d-flex align-center gap-2 mb-1">
                          <span className="badge badge-amber text-xs font-semibold d-inline-flex align-center gap-1">
                            <Clock size={11} /> {qa.timeEstimate}
                          </span>
                          <span className="text-xs font-bold text-primary">{qa.title}</span>
                        </div>
                        <p className="text-xs text-secondary mb-0">{qa.neededContribution}</p>
                      </div>

                      {!isOwner && (
                        <button
                          type="button"
                          className="btn btn-primary btn-xs flex-shrink-0"
                          onClick={() => {
                            respondToRequest(request.id, `Micro-Task: ${qa.title}`);
                            setFeedbackNotice(`Thank you! You signed up for "${qa.title}".`);
                          }}
                        >
                          Sign Up ({qa.timeEstimate})
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: VOLUNTEERS & RESPONDERS ROSTER */}
        {activeTab === 'volunteers' && (
          <div className="d-flex flex-column gap-3">
            {/* Direct Volunteer Action Form */}
            {isOwner ? (
              <div className="p-3 rounded border" style={{ background: '#f8fafc' }}>
                <span className="font-bold text-xs text-primary d-flex align-center gap-1.5">
                  <CheckCircle2 size={14} className="text-brand" />
                  <span>You Created This Help Request</span>
                </span>
                <p className="text-xs text-muted mb-0 mt-1">
                  As the requester, you coordinate and manage incoming volunteer responses for this request.
                </p>
              </div>
            ) : !isUserJoined ? (
              <form onSubmit={handleVolunteerSubmit} className="p-3 rounded border d-flex flex-column gap-2.5" style={{ background: 'var(--bg-subtle)' }}>
                <span className="font-bold text-xs text-primary d-flex align-center gap-1.5">
                  <HandHeart size={14} className="text-brand" />
                  <span>Join as Volunteer / Coordinator</span>
                </span>
                <div className="d-flex gap-2 flex-wrap">
                  <div className="form-group flex-1" style={{ minWidth: '160px' }}>
                    <label className="form-label text-xs text-secondary mb-1">How You Can Help:</label>
                    <select
                      className="form-select text-xs"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      <option value="General Volunteer">General Volunteer Labor</option>
                      <option value="Logistics & Packing">Logistics & Packing</option>
                      <option value="Vehicle & Transport">Vehicle & Transportation</option>
                      <option value="Specialist / Lead">Specialist / Technical Lead</option>
                      <option value="Supply Donor">Supply & Tool Donor</option>
                    </select>
                  </div>
                  <div className="form-group flex-1" style={{ minWidth: '180px' }}>
                    <label className="form-label text-xs text-secondary mb-1">Optional Context / Note:</label>
                    <input
                      type="text"
                      className="form-input text-xs"
                      placeholder="e.g. Available Saturday morning with pickup truck"
                      value={customNote}
                      onChange={(e) => setCustomNote(e.target.value)}
                    />
                  </div>
                </div>
                <div className="d-flex justify-end">
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm d-flex align-center gap-1.5"
                    disabled={isSubmitting}
                  >
                    <Check size={14} />
                    <span>Commit to Help Request</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald d-flex align-center justify-between">
                <div className="d-flex align-center gap-2">
                  <CheckCircle2 size={16} />
                  <span className="text-xs font-semibold">You have actively committed to support this request.</span>
                </div>
                <span className="badge badge-emerald text-xs">Committed</span>
              </div>
            )}

            {/* List of Committed Volunteers */}
            <div>
              <span className="font-bold text-xs text-secondary d-block mb-2">
                Committed Neighbors ({request.responses?.length || 0})
              </span>
              {request.responses && request.responses.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {request.responses.map((resp, idx) => (
                    <div 
                      key={idx}
                      className="d-flex align-center justify-between p-2.5 rounded border bg-white"
                    >
                      <div className="d-flex align-center gap-2.5">
                        <img
                          src={resp.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                          alt={resp.user?.name || 'Volunteer'}
                          style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <span className="font-bold text-xs text-primary d-block">{resp.user?.name || 'Neighbor'}</span>
                          <span className="text-xs text-brand font-semibold d-block">{resp.user?.handle || '@neighbor'}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="badge badge-primary text-xs font-semibold d-block mb-0.5">{resp.role || 'Volunteer'}</span>
                        <span className="text-xs text-muted" style={{ fontSize: '0.68rem' }}>{resp.time || 'Recently'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded text-center border text-muted text-xs" style={{ background: 'var(--bg-subtle)' }}>
                  No volunteer commitments logged yet. Be the first to volunteer!
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TRANSPARENT RESOURCE MATCHES */}
        {activeTab === 'matcher' && (
          <div className="d-flex flex-column gap-3">
            <div className="p-2.5 rounded bg-primary-50 border border-primary-200 text-brand text-xs d-flex align-center gap-2">
              <GitMerge size={15} className="flex-shrink-0" />
              <span>
                CareMesh calculates 6 explainable matching factors (Location, Category, Specifications, Skills, Capacity, Timing) to recommend compatible resources.
              </span>
            </div>

            {relevantMatches.length > 0 ? (
              <div className="d-flex flex-column gap-2.5">
                {relevantMatches.map(match => (
                  <div key={match.id} className="p-3 rounded border bg-white">
                    <div className="d-flex align-start justify-between gap-2 mb-2">
                      <div>
                        <span className="font-bold text-xs text-primary d-block">{match.resourceTitle}</span>
                        <span className="text-xs text-muted">Provided by <strong>{match.provider?.name}</strong> ({match.provider?.location || 'Maplewood'})</span>
                      </div>
                      <span className={`badge ${match.status === 'Ready to Coordinate' ? 'badge-emerald' : 'badge-amber'} text-xs font-semibold flex-shrink-0`}>
                        {match.status}
                      </span>
                    </div>

                    <p className="text-xs text-secondary mb-2" style={{ lineHeight: '1.45', background: 'var(--bg-subtle)', padding: '6px 10px', borderRadius: '4px' }}>
                      💡 {match.summaryExplanation}
                    </p>

                    {/* Factor Breakdown */}
                    <div className="d-flex gap-1 flex-wrap mb-2.5">
                      {(match.factors || []).map((f, fIdx) => (
                        <span 
                          key={fIdx}
                          className={`badge ${f.status === 'pass' ? 'badge-emerald' : f.status === 'warn' ? 'badge-amber' : 'badge-rose'} text-xs`}
                          style={{ fontSize: '0.68rem' }}
                          title={f.explanation}
                        >
                          {f.status === 'pass' ? '✓' : f.status === 'warn' ? '⚠' : '✗'} {f.label}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary btn-xs w-100 d-flex align-center justify-center gap-1.5"
                      onClick={() => {
                        matchResourceToRequest(request.id, match.resourceId);
                        setFeedbackNotice(`Successfully confirmed resource match with "${match.resourceTitle}".`);
                      }}
                    >
                      <GitMerge size={13} />
                      <span>Confirm & Assign Resource to this Need</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded text-center border text-muted text-xs" style={{ background: 'var(--bg-subtle)' }}>
                <p className="mb-2">No matching directory resources found for this specific need yet.</p>
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => {
                    onClose();
                    openCreateModal('resource');
                  }}
                >
                  <Package size={13} />
                  <span>Offer a New Resource for this Need</span>
                </button>
              </div>
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
                <span>Delete Request</span>
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
                <span>Edit Request</span>
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
export default RequestDetailModal;
