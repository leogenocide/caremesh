import { useState } from 'react';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  Shield, 
  Search, 
  MapPin, 
  MessageSquare 
} from 'lucide-react';

export const GroupMembersTab = ({ community }) => {
  const { mockUsers, currentUser, setActiveConversationId, navigateTo } = useCareMesh();
  const [memberSearch, setMemberSearch] = useState('');

  if (!community) return null;

  // Build full members list
  const allKnownUsers = [currentUser, ...mockUsers];
  
  // Resolve member objects based on memberIds or fallback
  const memberIds = community.memberIds || [currentUser.id];
  const members = allKnownUsers.filter(u => memberIds.includes(u.id));

  const filteredMembers = members.filter(m => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.role?.toLowerCase().includes(q) || m.handle?.toLowerCase().includes(q);
  });

  const admins = filteredMembers.filter(m => community.adminIds?.includes(m.id));
  const regularMembers = filteredMembers.filter(m => !community.adminIds?.includes(m.id));

  return (
    <div className="d-flex flex-column gap-4">
      {/* Search and stats bar */}
      <div className="d-flex align-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-md font-bold text-primary">Group Members Directory</h3>
          <p className="text-xs text-muted mb-0">{community.memberCount} neighbors and coordinators participating in this circle</p>
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
          <Search size={14} className="text-muted" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          <input
            type="text"
            placeholder="Find a member by name or role..."
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '32px', fontSize: '0.8rem', height: '34px' }}
          />
        </div>
      </div>

      {/* 1. Admins & Leadership Section */}
      {admins.length > 0 && (
        <div className="card p-4">
          <div className="d-flex align-center justify-between mb-3 pb-2 border-bottom">
            <span className="font-bold text-xs text-secondary text-uppercase d-flex align-center gap-1">
              <Shield size={14} className="text-brand" />
              <span>Admins & Coordinators ({admins.length})</span>
            </span>
          </div>

          <div className="grid-2 gap-3">
            {admins.map(m => (
              <div 
                key={m.id} 
                className="d-flex align-center justify-between p-3 rounded"
                style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}
              >
                <div className="d-flex align-center gap-3 min-w-0">
                  <img
                    src={m.avatar}
                    alt={m.name}
                    style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div className="min-w-0">
                    <div className="d-flex align-center gap-1">
                      <span className="font-bold text-xs text-primary text-truncate">{m.name}</span>
                      {m.id === currentUser.id && <span className="badge badge-gray text-xs" style={{ fontSize: '0.65rem' }}>You</span>}
                    </div>
                    <span className="text-xs font-semibold text-brand d-block" style={{ fontSize: '0.72rem' }}>{m.role}</span>
                    <span className="text-xs text-muted d-flex align-center gap-1" style={{ fontSize: '0.7rem' }}>
                      <MapPin size={10} /> {m.location?.neighborhood || 'Maplewood'}
                    </span>
                  </div>
                </div>

                {m.id !== currentUser.id && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs btn-icon"
                    onClick={() => {
                      setActiveConversationId('conv_01');
                      navigateTo('social', 'messages');
                    }}
                    title="Direct Message"
                  >
                    <MessageSquare size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Community Members Section */}
      <div className="card p-4">
        <div className="d-flex align-center justify-between mb-3 pb-2 border-bottom">
          <span className="font-bold text-xs text-secondary text-uppercase">
            Community Members ({regularMembers.length})
          </span>
        </div>

        {regularMembers.length > 0 ? (
          <div className="grid-2 gap-3">
            {regularMembers.map(m => (
              <div 
                key={m.id} 
                className="d-flex align-center justify-between p-3 rounded"
                style={{ background: '#ffffff', border: '1px solid var(--border-light)' }}
              >
                <div className="d-flex align-center gap-3 min-w-0">
                  <img
                    src={m.avatar}
                    alt={m.name}
                    style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div className="min-w-0">
                    <div className="d-flex align-center gap-1">
                      <span className="font-bold text-xs text-primary text-truncate">{m.name}</span>
                      {m.id === currentUser.id && <span className="badge badge-gray text-xs" style={{ fontSize: '0.65rem' }}>You</span>}
                    </div>
                    <span className="text-xs text-secondary d-block" style={{ fontSize: '0.72rem' }}>{m.role || 'Neighbor'}</span>
                    <span className="text-xs text-muted d-flex align-center gap-1" style={{ fontSize: '0.7rem' }}>
                      <MapPin size={10} /> {m.location?.neighborhood || 'Maplewood District'}
                    </span>
                  </div>
                </div>

                {m.id !== currentUser.id && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs btn-icon"
                    onClick={() => {
                      setActiveConversationId('conv_01');
                      navigateTo('social', 'messages');
                    }}
                    title="Direct Message"
                  >
                    <MessageSquare size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted italic">No matching members found.</p>
        )}
      </div>
    </div>
  );
};
