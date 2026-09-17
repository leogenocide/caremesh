import { useState } from 'react';
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
  X
} from 'lucide-react';

export const EventDetailModal = ({ isOpen, onClose, event }) => {
  const { joinEvent, sendEventChatMessage, currentUser, updateEvent, deleteEvent, canUserManage } = useCareMesh();
  const [chatInput, setChatInput] = useState('');

  const isOwner = Boolean(
    event && currentUser && (
      event.organizer?.id === currentUser?.id ||
      event.organizerId === currentUser?.id ||
      event.organizer_id === currentUser?.id
    )
  );
  const canManage = isOwner || canUserManage(event);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editEventType, setEditEventType] = useState('community_activity');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editLocation, setEditLocation] = useState({ address: '', lat: null, lng: null });
  const [editMaxParticipants, setEditMaxParticipants] = useState(20);

  if (!event) return null;

  const isUserJoined = event.participants?.some(p => p.id === currentUser?.id);

  const handleStartEdit = () => {
    setEditTitle(event.title || '');
    setEditDescription(event.description || '');
    setEditEventType(event.eventType || 'community_activity');
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
      alert('Please enter a title for the activity.');
      return;
    }
    updateEvent(event.id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      eventType: editEventType,
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
                    value={editEventType}
                    onChange={(e) => setEditEventType(e.target.value)}
                  >
                    <option value="community_activity">Community Activity</option>
                    <option value="clean_up">Clean Up & Habitat</option>
                    <option value="repair_clinic">Repair Clinic</option>
                    <option value="workshop">Skill Share Workshop</option>
                    <option value="mutual_aid_prep">Mutual Aid Prep</option>
                    <option value="neighborhood_meeting">Neighborhood Assembly</option>
                  </select>
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
            <div className="d-flex align-center justify-between mb-2">
              <span className="badge badge-purple text-xs text-uppercase font-semibold">
                {event.eventType?.replace('_', ' ')}
              </span>
              <span className="badge badge-primary text-xs font-semibold">
                {event.participants?.length || 0} / {event.maxParticipants} Attendees
              </span>
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

            {/* Actions ribbon */}
            <div className="mt-3 pt-3 border-top d-flex justify-between align-center flex-wrap gap-2">
              <span className="text-xs text-muted">
                Organized by {event.organizer?.name}
              </span>

              <div className="d-flex align-center gap-2">
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
                        alert(`You joined "${event.title}"!`);
                      } else {
                        alert('You are already registered for this event.');
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
          <div className="d-flex align-center gap-2 pb-2 mb-2 border-bottom">
            <MessageSquare size={16} className="text-brand" />
            <h5 className="font-bold text-xs text-primary text-uppercase">
              Activity Coordination Chat ({event.chatMessages?.length || 0})
            </h5>
          </div>

          {/* Messages list */}
          <div className="d-flex flex-column gap-2 mb-3" style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
            {event.chatMessages?.map((msg) => {
              const isMe = msg.sender?.id === currentUser.id;
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
            })}
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
            <button type="submit" className="btn btn-primary btn-sm">
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
};
