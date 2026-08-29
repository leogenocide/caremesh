import { useState } from 'react';
import { Modal } from '../common/Modal';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  MessageSquare, 
  Send 
} from 'lucide-react';

export const EventDetailModal = ({ isOpen, onClose, event }) => {
  const { joinEvent, sendEventChatMessage, currentUser } = useCareMesh();
  const [chatInput, setChatInput] = useState('');

  if (!event) return null;

  const isUserJoined = event.participants?.some(p => p.id === currentUser.id);

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

          {/* Join action */}
          <div className="mt-3 pt-3 border-top d-flex justify-between align-center">
            <span className="text-xs text-muted">
              Organized by {event.organizer?.name}
            </span>
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
          </div>
        </div>

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
