import { useCareMesh } from '../../context/useCareMesh';
import { 
  Calendar, 
  MapPin, 
  Users, 
  ChevronRight, 
  Check, 
  Plus 
} from 'lucide-react';

export const GroupEventsTab = ({ community }) => {
  const { events, currentUser, joinEvent, setSelectedEventChat, openCreateModal } = useCareMesh();

  if (!community) return null;

  const groupEvents = events.filter(e => community.linkedEventIds?.includes(e.id));

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex align-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-md font-bold text-primary">Group Workdays & Coordination Meetings</h3>
          <p className="text-xs text-muted mb-0">Upcoming field activities and operations organized by {community.name}</p>
        </div>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => openCreateModal('event')}
        >
          <Plus size={15} />
          <span>Schedule Workday</span>
        </button>
      </div>

      {groupEvents.length > 0 ? (
        <div className="grid-2 gap-3">
          {groupEvents.map(evt => {
            const isAttending = evt.participants?.some(p => p.id === currentUser.id);

            return (
              <div 
                key={evt.id} 
                className="card p-4 d-flex flex-column justify-between card-interactive"
              >
                <div>
                  {/* Header */}
                  <div className="d-flex align-center justify-between mb-2">
                    <span className="badge badge-primary text-xs font-semibold text-uppercase">
                      {evt.eventType?.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-bold text-primary d-flex align-center gap-1">
                      <Calendar size={13} /> {evt.date} · {evt.time}
                    </span>
                  </div>

                  <h4 className="font-bold text-md text-primary mb-1">{evt.title}</h4>
                  <p className="text-xs text-secondary mb-3" style={{ lineHeight: '1.45' }}>
                    {evt.description}
                  </p>

                  <div className="d-flex align-center gap-2 text-xs text-muted mb-3">
                    <MapPin size={13} /> {evt.location?.address}
                  </div>

                  {/* Attendees ribbon */}
                  <div className="d-flex align-center justify-between pt-2 border-top text-xs text-muted mb-3">
                    <span className="d-flex align-center gap-1">
                      <Users size={13} /> {evt.participants?.length || 0} Neighbors Attending
                    </span>
                    <div className="d-flex align-center -space-x-1" style={{ display: 'flex' }}>
                      {evt.participants?.slice(0, 4).map((p, idx) => (
                        <img
                          key={idx}
                          src={p.avatar}
                          alt=""
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '1.5px solid white',
                            marginLeft: idx > 0 ? '-6px' : '0'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="d-flex gap-2 pt-2 border-top">
                  <button
                    className={`btn btn-sm flex-1 ${isAttending ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => {
                      if (!isAttending) {
                        joinEvent(evt.id);
                        alert(`You RSVP'd for: "${evt.title}". See you there!`);
                      }
                    }}
                  >
                    {isAttending ? (
                      <>
                        <Check size={14} className="text-brand font-bold" />
                        <span>Attending</span>
                      </>
                    ) : (
                      <span>RSVP / Join</span>
                    )}
                  </button>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedEventChat(evt)}
                  >
                    <span>Event Chat</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-5 text-center text-muted">
          <Calendar size={36} className="mx-auto mb-2 opacity-50" />
          <h4 className="font-bold text-sm text-primary mb-1">No Upcoming Workdays Scheduled</h4>
          <p className="text-xs">Schedule a volunteer workday, creek cleanup, or planning meeting for this group.</p>
        </div>
      )}
    </div>
  );
};
