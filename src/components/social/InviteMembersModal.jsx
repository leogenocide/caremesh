import { useState } from 'react';
import { Modal } from '../common/Modal';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  Search, 
  Check, 
  Send, 
  MapPin 
} from 'lucide-react';

export const InviteMembersModal = () => {
  const { 
    inviteModalCommunity, 
    closeInviteModal, 
    mockUsers, 
    currentUser, 
    inviteMembersToCommunity 
  } = useCareMesh();

  const [search, setSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  if (!inviteModalCommunity) return null;

  const existingMemberIds = inviteModalCommunity.memberIds || [];
  
  // Available neighbors not yet in this group
  const nonMembers = mockUsers.filter(u => u.id !== currentUser.id && !existingMemberIds.includes(u.id));

  const filteredNeighbors = nonMembers.filter(u => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q);
  });

  const toggleSelectUser = (id) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter(uid => uid !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  const handleSendInvites = (e) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) {
      alert('Please select at least one neighbor to invite.');
      return;
    }

    inviteMembersToCommunity(inviteModalCommunity.id, selectedUserIds);
    alert(`Successfully invited ${selectedUserIds.length} neighbor(s) to ${inviteModalCommunity.name}!`);
    closeInviteModal();
    setSelectedUserIds([]);
    setSearch('');
  };

  return (
    <Modal
      isOpen={Boolean(inviteModalCommunity)}
      onClose={closeInviteModal}
      title={`Invite Neighbors to ${inviteModalCommunity.name}`}
      subtitle="Invite trusted local coordinators, volunteers, and neighbors to join this circle."
      maxWidth="580px"
    >
      <form onSubmit={handleSendInvites} className="d-flex flex-column gap-3">
        {/* Search Bar */}
        <div style={{ position: 'relative' }}>
          <Search size={14} className="text-muted" style={{ position: 'absolute', left: '10px', top: '11px' }} />
          <input
            type="text"
            placeholder="Search neighbors by name or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '32px', fontSize: '0.85rem' }}
          />
        </div>

        {/* Neighbors List */}
        <div 
          className="d-flex flex-column gap-2"
          style={{ maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}
        >
          {filteredNeighbors.length > 0 ? (
            filteredNeighbors.map(user => {
              const isSelected = selectedUserIds.includes(user.id);
              return (
                <div
                  key={user.id}
                  className="d-flex align-center justify-between p-2 rounded cursor-pointer card-interactive"
                  style={{
                    background: isSelected ? 'var(--primary-50)' : 'var(--bg-subtle)',
                    border: isSelected ? '1.5px solid var(--primary-500)' : '1px solid var(--border-light)'
                  }}
                  onClick={() => toggleSelectUser(user.id)}
                >
                  <div className="d-flex align-center gap-3">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <h5 className="font-bold text-xs text-primary mb-0">{user.name}</h5>
                      <span className="text-xs text-secondary d-block" style={{ fontSize: '0.72rem' }}>
                        {user.role}
                      </span>
                      <span className="text-xs text-muted d-flex align-center gap-1" style={{ fontSize: '0.68rem' }}>
                        <MapPin size={10} /> {user.location?.neighborhood || 'Maplewood District'}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      border: isSelected ? 'none' : '2px solid var(--border-default)',
                      background: isSelected ? 'var(--primary-600)' : '#ffffff',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {isSelected && <Check size={13} />}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-xs text-muted">
              {nonMembers.length === 0
                ? 'All neighborhood coordinators are already members of this group!'
                : 'No matching neighbors found.'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="d-flex align-center justify-between pt-3 border-top">
          <span className="text-xs text-muted">
            {selectedUserIds.length} neighbor(s) selected
          </span>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={closeInviteModal}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={selectedUserIds.length === 0}
            >
              <Send size={14} />
              <span>Send Invitations</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
