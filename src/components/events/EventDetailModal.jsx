import { useState, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { LocationPicker } from '../common/LocationPicker';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  MessageSquare, 
  Send,
  Edit2,
  Trash2,
  Check,
  X,
  Share2,
  UserCheck,
  Search,
  Archive
} from 'lucide-react';

export const EventDetailModal = ({ isOpen, onClose, event }) => {
  const { 
    joinEvent, 
    sendEventChatMessage, 
    currentUser, 
    updateEvent, 
    deleteEvent, 
    canUserManage,
    openShareSocialModal,
    showToast,
    openReadinessModal,
    readinessChecks,
    viewUserProfile,
    isSystemAdmin,
    quarantineEntity
  } = useCareMesh();
  const [chatInput, setChatInput] = useState('');
  const [attendeeSearch, setAttendeeSearch] = useState('');

  const isOwner = Boolean(
    event && currentUser && (
      event.organizer?.id === currentUser?.id ||
      event.organizerId === currentUser?.id ||
      event.organizer_id === currentUser?.id
    )
  );
  const canManage = isOwner || canUserManage(event);

  const organizerUser = (typeof event?.organizer === 'object' && event?.organizer !== null)
    ? event.organizer
    : (event?.organizer || event?.organizerId || event?.organizer_id ? {
        id: event.organizerId || event.organizer_id || event.organizer,
        name: event.organizerName || 'Activity Host',
        avatar: event.organizerAvatar,
        handle: event.organizerHandle || '@organizer'
      } : null);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editEventType, setEditEventType] = useState('community_activity');
  const [editIsCustomEventType, setEditIsCustomEventType] = useState(false);
  const [editCustomEventType, setEditCustomEventType] = useState('');
  const [editAttendeePrivacy, setEditAttendeePrivacy] = useState('public');
  const [editChatPrivacy, setEditChatPrivacy] = useState('members_only');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editLocation, setEditLocation] = useState({ address: '', lat: null, lng: null });
  const [editMaxParticipants, setEditMaxParticipants] = useState(20);

  const isUserJoined = Boolean(event?.participants?.some(p => p.id === currentUser?.id));
  const canViewAttendees = Boolean(event?.attendeePrivacy !== 'members_only' || isUserJoined || canManage);
  const canAccessChat = Boolean(event?.chatPrivacy !== 'members_only' || isUserJoined || canManage);

  const filteredAttendees = useMemo(() => {
    const list = event?.participants || [];
    if (!attendeeSearch.trim()) return list;
    const q = attendeeSearch.toLowerCase().trim();
    return list.filter(p => 
      p.name?.toLowerCase().includes(q) || 
      p.handle?.toLowerCase().includes(q)
    );
  }, [event?.participants, attendeeSearch]);

  if (!event) return null;

  const linkedCheck = event?.id
    ? (readinessChecks || []).find(rc => rc.eventId === event.id || rc.event_id === event.id)
    : null;

  const handleStartEdit = () => {
    setEditTitle(event.title || '');
    setEditDescription(event.description || '');
    const isCustom = Boolean(event.isCustomEventType || event.customEventType || event.eventType === 'custom');
    setEditIsCustomEventType(isCustom);
    setEditCustomEventType(event.customEventType || (isCustom ? event.eventType : ''));
    setEditEventType(isCustom ? '__custom__' : (event.eventType || 'community_activity'));
    setEditAttendeePrivacy(event.attendeePrivacy || 'public');
    setEditChatPrivacy(event.chatPrivacy || 'members_only');
    setEditDate(event.date || '');
    setEditTime(event.time || '');
    setEditLocation({
      address: event.location?.address || '',
      lat: event.location?.lat ?? null,
      lng: event.location?.lng ?? null
    });
    setEditMaxParticipants(event.maxParticipants || 20);
    setIsEditing(true);
  };

  const handleSaveEdit = (e) => {
    if (e) e.preventDefault();
    if (!editTitle.trim()) {
      if (showToast) showToast('Please enter a title for the activity.', 'error');
      return;
    }
    const isCustom = editIsCustomEventType || editEventType === '__custom__';
    const finalCustomName = editCustomEventType.trim() || 'Custom Activity';
    updateEvent(event.id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      eventType: isCustom ? 'custom' : editEventType,
      isCustomEventType: isCustom,
      customEventType: isCustom ? finalCustomName : null,
      attendeePrivacy: editAttendeePrivacy,
      chatPrivacy: editChatPrivacy,
      date: editDate.trim(),
      time: editTime.trim(),
      location: {
        ...(event.location || {}),
        address: editLocation.address.trim(),
        lat: editLocation.lat,
        lng: editLocation.lng
      },
      address: editLocation.address.trim(),
      lat: editLocation.lat,
      lng: editLocation.lng,
      maxParticipants: parseInt(editMaxParticipants, 10) || 20
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to cancel and delete this event? This action cannot be undone.')) {
      deleteEvent(event.id);
      onClose();
    }
  };

  const handleQuarantine = async () => {
    const reason = window.prompt(
      `Quarantine "${event.title}" to Master Evidence Vault?\n\nEnter quarantine reason:`,
      'Policy violation review'
    );
    if (reason === null) return;
    try {
      await quarantineEntity({
        targetType: 'project',
        targetId: event.id,
        reason: reason.trim() || 'Quarantined by System Administrator',
        notes: `Quarantined from Civic Event Detail by ${currentUser?.name || 'System Admin'}`
      });
      onClose();
    } catch (err) {
      showToast?.(err.message || 'Failed to quarantine event', 'error');
    }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendEventChatMessage(event.id, chatInput);
    setChatInput('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={event.title}
      subtitle="Coordinated Activity & Real-Time Coordination"
      maxWidth="720px"
    >
      <div className="d-flex flex-column gap-4">
        {/* Event Details Card */}
        {isEditing ? (
          <div className="card p-4" style={{ background: 'var(--bg-subtle)' }}>
            <div className="d-flex align-center justify-between mb-3">
              <h4 className="font-bold text-md text-primary d-flex align-center gap-2 mb-0">
                <Edit2 size={16} className="text-brand" /> Edit Activity
              </h4>
              <button
                type="button"
                className="btn btn-ghost btn-xs text-muted"
                onClick={() => setIsEditing(false)}
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
                  placeholder="Activity title..."
                  required
                />
              </div>

              <div className="grid-2 gap-2">
                <div>
                  <label className="form-label text-xs font-semibold text-secondary mb-1">Activity Type</label>
                  <select
                    className="form-input"
                    value={editIsCustomEventType ? '__custom__' : editEventType}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setEditIsCustomEventType(true);
                      } else {
                        setEditIsCustomEventType(false);
                        setEditEventType(e.target.value);
                      }
                    }}
                  >
                    <option value="community_activity">Community Activity</option>
                    <option value="assistance_operation">Assistance Operation</option>
                    <option value="clean_up">Clean Up & Habitat</option>
                    <option value="repair_clinic">Repair Clinic</option>
                    <option value="workshop">Skill Share Workshop</option>
                    <option value="mutual_aid_prep">Mutual Aid Prep</option>
                    <option value="neighborhood_meeting">Neighborhood Assembly</option>
                    <option value="__custom__">✨ Custom Activity Type...</option>
                  </select>
                  {editIsCustomEventType && (
                    <input
                      type="text"
                      className="form-input mt-1.5"
                      value={editCustomEventType}
                      onChange={(e) => setEditCustomEventType(e.target.value)}
                      placeholder="e.g. Riparian Watershed Planting..."
                      required={editIsCustomEventType}
                    />
                  )}
                </div>

                <div>
                  <label className="form-label text-xs font-semibold text-secondary mb-1">Max Participants</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={editMaxParticipants}
                    onChange={(e) => setEditMaxParticipants(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-2 gap-2">
                <div>
                  <label className="form-label text-xs font-semibold text-secondary mb-1">Date</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    placeholder="e.g. This Saturday, Oct 14"
                  />
                </div>

                <div>
                  <label className="form-label text-xs font-semibold text-secondary mb-1">Time</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    placeholder="e.g. 10:00 AM - 1:00 PM"
                  />
                </div>
              </div>

              <LocationPicker
                value={editLocation}
                onChange={setEditLocation}
                label="Location & Coordinates"
                placeholder="Address or venue..."
              />

              <div>
                <label className="form-label text-xs font-semibold text-secondary mb-1">Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Details, what to bring, and expectations..."
                />
              </div>

              {/* Privacy & Member Access Controls */}
              <div className="p-2.5 rounded" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
                <span className="font-bold text-xs text-primary d-block mb-1.5">
                  🔒 Privacy & Member Access Controls
                </span>
                <div className="grid-2 gap-2 text-xs">
                  <div>
                    <label className="form-label text-xs font-semibold text-secondary mb-1">Attendee Roster Visibility</label>
                    <select
                      className="form-input text-xs"
                      value={editAttendeePrivacy}
                      onChange={(e) => setEditAttendeePrivacy(e.target.value)}
                    >
                      <option value="public">Public (Anyone can view roster)</option>
                      <option value="members_only">Members Only (Attendees & Host only)</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label text-xs font-semibold text-secondary mb-1">Coordination Chat Access</label>
                    <select
                      className="form-input text-xs"
                      value={editChatPrivacy}
                      onChange={(e) => setEditChatPrivacy(e.target.value)}
                    >
                      <option value="members_only">Members Only (Registered attendees only)</option>
                      <option value="public">Public (Open to everyone)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="d-flex align-center justify-end gap-2 mt-1">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                >
                  <Check size={14} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="card p-4" style={{ background: 'var(--bg-subtle)' }}>
            <div className="d-flex align-start justify-between gap-3 mb-2 flex-wrap">
              <div className="d-flex flex-column gap-1.5 flex-1 min-w-0">
                <div className="d-flex align-center gap-1.5 flex-wrap">
                  <span className="badge badge-purple text-xs text-uppercase font-semibold">
                    {event.customEventType || event.eventType?.replace('_', ' ')}
                  </span>
                  {event.attendeePrivacy === 'members_only' && (
                    <span className="badge badge-secondary text-xs" title="Attendee list is visible only to confirmed members and host">
                      🔒 Private Roster
                    </span>
                  )}
                  {event.chatPrivacy === 'members_only' && (
                    <span className="badge badge-secondary text-xs" title="Coordination chat is restricted to confirmed members">
                      🔒 Members-Only Chat
                    </span>
                  )}
                  <span className="badge badge-primary text-xs font-semibold">
                    {event.participants?.length || 0} / {event.maxParticipants} Attendees
                  </span>
                </div>
              </div>

              {/* Host / Organizer Profile Card */}
              {organizerUser && (
                <div 
                  className="d-flex align-center gap-2 p-2 rounded bg-white border flex-shrink-0 cursor-pointer card-interactive user-profile-trigger"
                  onClick={() => {
                    if (viewUserProfile) {
                      viewUserProfile(organizerUser);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (viewUserProfile) {
                        viewUserProfile(organizerUser);
                      }
                    }
                  }}
                  title={`View host ${organizerUser.name}'s profile`}
                >
                  <img
                    src={organizerUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={organizerUser.name}
                    style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div className="min-w-0">
                    <div className="d-flex align-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-primary d-block text-truncate user-profile-name" style={{ maxWidth: '120px' }}>
                        {organizerUser.name}
                      </span>
                      <span className="badge badge-purple text-xs" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                        Host
                      </span>
                    </div>
                    <span className="text-xs text-brand font-semibold d-block">{organizerUser.handle || '@organizer'}</span>
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-secondary mb-3" style={{ lineHeight: '1.5' }}>
              {event.description}
            </p>

            <div className="grid-2 gap-2 text-xs text-secondary">
              <div className="d-flex align-center gap-2">
                <Calendar size={14} className="text-purple" />
                <span><strong>Date:</strong> {event.date}</span>
              </div>
              <div className="d-flex align-center gap-2">
                <Clock size={14} className="text-purple" />
                <span><strong>Time:</strong> {event.time}</span>
              </div>
              <div className="d-flex align-center gap-2" style={{ gridColumn: 'span 2' }}>
                <MapPin size={14} className="text-purple" />
                <span><strong>Location:</strong> {event.location?.address}</span>
              </div>
            </div>

            {/* Attendee Readiness Roll Call Panel */}
            {linkedCheck && (
              <div className="card p-2.5 mt-3 rounded" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div className="d-flex align-center justify-between gap-2 mb-1.5 flex-wrap">
                  <div className="d-flex align-center gap-2">
                    <UserCheck size={16} className="text-brand flex-shrink-0" />
                    <div>
                      <span className="font-bold text-xs text-primary d-block">
                        Attendee Readiness Roll Call Active
                      </span>
                      <span className="text-xs text-muted" style={{ fontSize: '0.7rem' }}>
                        {linkedCheck.readyCount || 0} of {linkedCheck.targetHeadcount || event.maxParticipants || 10} attendees confirmed ready ({linkedCheck.readyPercentage || 0}%)
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs d-inline-flex align-center gap-1"
                    onClick={() => openReadinessModal({ eventId: event.id, checkId: linkedCheck.id })}
                  >
                    <UserCheck size={12} />
                    <span>Open Readiness Console</span>
                  </button>
                </div>
                <div style={{ height: '5px', background: '#dcfce7', borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${Math.min(100, linkedCheck.readyPercentage || 0)}%`, 
                      height: '100%', 
                      background: 'var(--brand)', 
                      transition: 'width 0.3s ease' 
                    }} 
                  />
                </div>
              </div>
            )}

            {/* Registered Attendees Roster (with Privacy Protection) */}
            {!canViewAttendees ? (
              <div className="card p-3 mt-3 rounded text-center" style={{ background: '#ffffff', border: '1px dashed var(--border-light)' }}>
                <div className="d-flex align-center justify-center gap-1.5 mb-1">
                  <Users size={14} className="text-muted" />
                  <span className="font-bold text-xs text-primary">
                    Attendee Roster is Members-Only ({event.participants?.length || 0} / {event.maxParticipants || 20} Registered)
                  </span>
                </div>
                <p className="text-xs text-muted mb-2" style={{ fontSize: '0.72rem' }}>
                  The organizer has restricted attendee list visibility to registered members and the host only.
                </p>
                {!isUserJoined && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs d-inline-flex align-center gap-1 mx-auto"
                    onClick={() => {
                      joinEvent(event.id);
                      if (showToast) showToast(`You joined "${event.title}"!`, 'success');
                    }}
                  >
                    <Users size={12} />
                    <span>Join Activity to View Attendees</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="card p-2.5 mt-3 rounded" style={{ background: '#ffffff', border: '1px solid var(--border-light)' }}>
                <div className="d-flex align-center justify-between gap-2 mb-2 flex-wrap">
                  <div className="d-flex align-center gap-1.5">
                    <Users size={14} className="text-brand flex-shrink-0" />
                    <span className="font-bold text-xs text-primary">
                      Registered Attendees ({event.participants?.length || 0} / {event.maxParticipants || 20})
                    </span>
                  </div>
                  {(event.participants?.length || 0) > 5 && (
                    <div className="position-relative d-flex align-center" style={{ minWidth: '150px' }}>
                      <Search size={11} className="position-absolute text-muted" style={{ left: '6px' }} />
                      <input
                        type="text"
                        className="form-input text-xs"
                        style={{ paddingLeft: '22px', height: '24px', fontSize: '0.68rem' }}
                        placeholder="Filter attendees..."
                        value={attendeeSearch}
                        onChange={(e) => setAttendeeSearch(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* Bounded Scrollable Attendees List */}
                <div 
                  className="d-flex flex-column gap-1.5" 
                  style={{ 
                    maxHeight: '160px', 
                    overflowY: 'auto', 
                    paddingRight: '4px' 
                  }}
                >
                  {filteredAttendees.length > 0 ? (
                    filteredAttendees.map((p, idx) => {
                      const isHost = p.id === event.organizer?.id || p.id === event.organizerId;
                      return (
                        <div 
                          key={p.id || idx}
                          className="p-1.5 rounded d-flex align-center justify-between gap-2"
                          style={{ background: 'var(--bg-subtle)' }}
                        >
                          <div 
                            className="d-flex align-center gap-2 min-w-0 cursor-pointer"
                            onClick={() => {
                              if (viewUserProfile) {
                                onClose();
                                viewUserProfile(p);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            title={`View ${p.name}'s Profile`}
                          >
                            <img
                              src={p.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                              alt={p.name}
                              style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <div className="min-w-0">
                              <span className="font-semibold text-xs text-primary d-block text-truncate hover-underline">
                                {p.name}
                              </span>
                              <span className="text-xs text-muted d-block text-truncate" style={{ fontSize: '0.66rem' }}>
                                {p.handle || `@user_${p.id?.slice(-4) || 'neighbor'}`}
                              </span>
                            </div>
                          </div>

                          <span className={`badge ${isHost ? 'badge-primary' : 'badge-secondary'} text-xs flex-shrink-0`} style={{ fontSize: '0.62rem' }}>
                            {isHost ? 'Host' : 'Attending'}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-xs text-muted p-2 text-center d-block">
                      {attendeeSearch ? 'No attendees match search filter.' : 'No attendees registered yet. Be the first to join!'}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Actions ribbon */}
            <div className="mt-3 pt-3 border-top d-flex justify-between align-center flex-wrap gap-2">
              {organizerUser ? (
                <div 
                  className="d-flex align-center gap-1.5 user-profile-trigger cursor-pointer"
                  onClick={() => {
                    if (viewUserProfile) {
                      viewUserProfile(organizerUser);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (viewUserProfile) {
                        viewUserProfile(organizerUser);
                      }
                    }
                  }}
                  title={`View ${organizerUser.name}'s profile`}
                >
                  <img
                    src={organizerUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={organizerUser.name}
                    style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <span className="text-xs text-muted">
                    Organized by <strong className="user-profile-name">{organizerUser.name}</strong>
                  </span>
                </div>
              ) : (
                <span className="text-xs text-muted">Organized by Community Member</span>
              )}

              <div className="d-flex align-center gap-2 flex-wrap">
                {canManage && (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleStartEdit}
                    >
                      <Edit2 size={14} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm text-rose"
                      style={{ background: 'var(--rose-50)', border: '1px solid var(--rose-200)' }}
                      onClick={handleDelete}
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </>
                )}

                {isSystemAdmin && (
                  <button
                    type="button"
                    className="btn btn-sm text-amber"
                    style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#b45309' }}
                    onClick={handleQuarantine}
                    title="Quarantine this event to Master Evidence Vault"
                  >
                    <Archive size={14} />
                    <span>Quarantine to Vault</span>
                  </button>
                )}

                {canManage && !linkedCheck && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => openReadinessModal({ eventId: event.id })}
                    title="Initiate Member Readiness Check for this event"
                  >
                    <UserCheck size={14} className="text-brand" />
                    <span>Readiness Check</span>
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => openShareSocialModal(event, 'event')}
                  title="Share Activity to External Platforms or Community"
                >
                  <Share2 size={14} />
                  <span>Share</span>
                </button>

                {isOwner ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary d-flex align-center gap-1.5"
                    disabled
                    style={{ opacity: 0.9 }}
                  >
                    <Users size={14} className="text-brand" />
                    <span>Organizer (Host)</span>
                  </button>
                ) : (
                  <button
                    className={`btn btn-sm ${isUserJoined ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => {
                      if (!isUserJoined) {
                        joinEvent(event.id);
                        if (showToast) showToast(`You joined "${event.title}"!`, 'success');
                      } else {
                        if (showToast) showToast('You are already registered for this event.', 'info');
                      }
                    }}
                  >
                    <Users size={14} />
                    <span>{isUserJoined ? 'You are Attending' : 'Join Activity'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Live Coordination Chat for this event */}
        <div className="card p-3" style={{ background: '#ffffff', border: '1px solid var(--border-light)' }}>
          <div className="d-flex align-center justify-between pb-2 mb-2 border-bottom flex-wrap gap-1">
            <div className="d-flex align-center gap-2">
              <MessageSquare size={16} className="text-brand" />
              <h5 className="font-bold text-xs text-primary text-uppercase mb-0">
                Activity Coordination Chat {canAccessChat ? `(${event.chatMessages?.length || 0})` : ''}
              </h5>
            </div>
            {event.chatPrivacy === 'members_only' && (
              <span className="badge badge-secondary text-xs" style={{ fontSize: '0.65rem' }}>
                🔒 Members Only
              </span>
            )}
          </div>

          {!canAccessChat ? (
            <div className="p-4 text-center rounded" style={{ background: 'var(--bg-subtle)' }}>
              <div style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>🔒</div>
              <h6 className="font-bold text-xs text-primary mb-1">Coordination Chat is Members-Only</h6>
              <p className="text-xs text-muted mb-3" style={{ maxWidth: '420px', margin: '0 auto 0.75rem auto', lineHeight: 1.4, fontSize: '0.78rem' }}>
                This channel is restricted to confirmed event attendees and the organizer to keep planning discussions secure.
              </p>
              {!isUserJoined && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm d-inline-flex align-center gap-1.5 mx-auto"
                  onClick={() => {
                    joinEvent(event.id);
                    if (showToast) showToast(`You joined "${event.title}"!`, 'success');
                  }}
                >
                  <Users size={14} />
                  <span>Join Activity to Access Chat</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Messages list */}
              <div className="d-flex flex-column gap-2 mb-3" style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                {event.chatMessages && event.chatMessages.length > 0 ? (
                  event.chatMessages.map((msg) => {
                    const isMe = msg.sender?.id === currentUser?.id;
                    return (
                      <div 
                        key={msg.id} 
                        className={`d-flex flex-column p-2 rounded text-xs ${isMe ? 'align-end' : 'align-start'}`}
                        style={{
                          background: isMe ? 'var(--primary-50)' : 'var(--bg-muted)',
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '85%',
                          borderRadius: 'var(--radius-md)'
                        }}
                      >
                        <div className="d-flex align-center gap-2 mb-1">
                          <span className="font-bold text-primary">{msg.sender?.name || 'Volunteer'}</span>
                          <span className="text-muted" style={{ fontSize: '0.68rem' }}>{msg.time}</span>
                        </div>
                        <p className="text-secondary" style={{ margin: 0 }}>{msg.text}</p>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center p-3 text-xs text-muted">
                    No messages yet. Send a message to coordinate tools, timing, or arrival!
                  </div>
                )}
              </div>

              {/* Chat input */}
              <form onSubmit={handleSendChat} className="d-flex gap-2">
                <input
                  type="text"
                  placeholder="Send message to coordinate tools, timing, or arrival..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.85rem' }}
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={!chatInput.trim()}>
                  <Send size={14} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
