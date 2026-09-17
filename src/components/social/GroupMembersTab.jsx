import { useState, useEffect } from 'react';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  Shield, 
  ShieldCheck, 
  Search, 
  MapPin, 
  MessageSquare, 
  UserX, 
  Flag, 
  Vote, 
  Plus, 
  CheckCircle2 
} from 'lucide-react';

export const GroupMembersTab = ({ community }) => {
  const { 
    mockUsers, 
    currentUser, 
    moderatorElections,
    loadCommunityElections,
    nominateModerator,
    voteForModerator,
    appointModerator,
    kickCommunityMember,
    openReportModal,
    viewUserProfile,
    startDirectMessage
  } = useCareMesh();

  const [memberSearch, setMemberSearch] = useState('');
  const [isNominateOpen, setIsNominateOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    if (community?.id) {
      loadCommunityElections(community.id);
    }
  }, [community?.id, loadCommunityElections]);

  if (!community) return null;

  // Build deduplicated full members list prioritizing latest currentUser
  const userMap = new Map();
  (mockUsers || []).forEach(u => {
    if (u?.id) userMap.set(u.id, u);
  });
  if (currentUser?.id) {
    userMap.set(currentUser.id, currentUser);
  }
  const allKnownUsers = Array.from(userMap.values());
  
  // Resolve unique member objects based on memberIds or fallback
  const rawMemberIds = community.memberIds || (currentUser?.id ? [currentUser.id] : []);
  const uniqueMemberIds = Array.from(new Set(rawMemberIds));
  const members = uniqueMemberIds
    .map(id => userMap.get(id))
    .filter(Boolean);

  const filteredMembers = members.filter(m => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.toLowerCase();
    return m.name?.toLowerCase().includes(q) || m.role?.toLowerCase().includes(q) || m.handle?.toLowerCase().includes(q);
  });

  const adminIds = new Set(community.adminIds || []);
  const modIds = new Set(community.moderatorIds || []);

  const admins = filteredMembers.filter(m => adminIds.has(m.id));
  const moderators = filteredMembers.filter(m => modIds.has(m.id) && !adminIds.has(m.id));
  const regularMembers = filteredMembers.filter(m => !adminIds.has(m.id) && !modIds.has(m.id));

  const isPlatformAdmin = Boolean(currentUser?.isAdmin);
  const isCurrentAdmin = Boolean(adminIds.has(currentUser?.id) || isPlatformAdmin);
  const isCurrentModerator = Boolean(modIds.has(currentUser?.id) || isCurrentAdmin);
  const canModerate = isCurrentAdmin || isCurrentModerator;

  // Active elections for this community
  const communityElections = moderatorElections.filter(e => e.communityId === community.id);

  const handleKickMember = (member) => {
    if (window.confirm(`Are you sure you want to kick ${member.name} from "${community.name}"? They will be removed from this community circle.`)) {
      kickCommunityMember(community.id, member.id);
    }
  };

  const handleReportAvatar = (member) => {
    openReportModal({
      targetType: 'profile_picture',
      targetId: member.id,
      title: `${member.name}'s Profile Picture`,
      reportedUser: member,
      communityId: community.id,
      scope: 'community'
    });
  };

  const handleNominate = async (e) => {
    e.preventDefault();
    if (!selectedCandidateId) return;
    if (selectedCandidateId === currentUser?.id) {
      alert('You cannot nominate yourself as moderator. Nominations must come from fellow community members.');
      return;
    }

    try {
      await nominateModerator(community.id, selectedCandidateId);
      setIsNominateOpen(false);
      setSelectedCandidateId('');
    } catch (err) {
      alert(err.message || 'Failed to nominate member');
    }
  };

  const handleVote = async (electionId) => {
    setIsVoting(true);
    try {
      await voteForModerator(community.id, electionId, 'yes');
    } catch (err) {
      alert(err.message || 'Vote failed');
    } finally {
      setIsVoting(false);
    }
  };

  const handleAppoint = async (electionId) => {
    try {
      await appointModerator(community.id, electionId);
    } catch (err) {
      alert(err.message || 'Appointment failed');
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Search and stats bar */}
      <div className="d-flex align-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-md font-bold text-primary mb-0">Group Members & Democratic Leadership</h3>
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

      {/* ============================================================ */}
      {/* DEMOCRATIC MODERATOR SELECTION & ELECTIONS                   */}
      {/* ============================================================ */}
      <div 
        className="card p-4" 
        style={{ 
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', 
          border: '1px solid #bbf7d0',
          borderRadius: 'var(--radius-xl)'
        }}
      >
        <div className="d-flex align-center justify-between gap-2 flex-wrap mb-2 pb-2 border-bottom">
          <div className="d-flex align-center gap-2">
            <div 
              style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                background: '#dcfce7', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--brand-dark)'
              }}
            >
              <Vote size={18} />
            </div>
            <div>
              <span className="font-bold text-xs text-primary d-block">
                Democratic Moderator Elections
              </span>
              <span className="text-xs text-muted" style={{ fontSize: '0.72rem' }}>
                Communities choose their own moderators. 3 neighbor votes empower a peer to review reports.
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-xs d-flex align-center gap-1"
            style={{ background: 'var(--brand)', borderColor: 'var(--brand)' }}
            onClick={() => setIsNominateOpen(!isNominateOpen)}
          >
            <Plus size={13} />
            <span>{isNominateOpen ? 'Cancel Nomination' : 'Nominate Moderator'}</span>
          </button>
        </div>

        {/* Nomination Dropdown / Form */}
        {isNominateOpen && (
          <form onSubmit={handleNominate} className="p-3 mb-3 rounded bg-white border d-flex align-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-secondary">Nominate Candidate:</span>
            <select
              className="form-input text-xs flex-1"
              value={selectedCandidateId}
              onChange={(e) => setSelectedCandidateId(e.target.value)}
              required
            >
              <option value="">Select a group member...</option>
              {regularMembers.filter(m => m.id !== currentUser?.id).map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.handle || `@user_${m.id}`})</option>
              ))}
            </select>
            <button
              type="submit"
              className="btn btn-primary btn-xs"
              disabled={!selectedCandidateId}
            >
              Submit Nomination
            </button>
          </form>
        )}

        {/* Active Elections List */}
        {communityElections.length > 0 ? (
          <div className="d-flex flex-column gap-2 mt-2">
            {communityElections.map(election => {
              const candidate = allKnownUsers.find(u => u.id === election.candidateId) || { name: 'Neighbor', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' };
              const isPassed = election.status === 'passed';
              const votes = election.votesCount || election.yesVotes || 0;
              const target = election.targetVotes || 3;
              const hasVoted = election.hasVoted;

              return (
                <div 
                  key={election.id}
                  className="p-3 rounded bg-white d-flex align-center justify-between gap-3 flex-wrap"
                  style={{ border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-xs)' }}
                >
                  <div className="d-flex align-center gap-2.5 min-w-0">
                    <img 
                      src={candidate.avatar} 
                      alt="" 
                      style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div className="min-w-0">
                      <div className="d-flex align-center gap-1.5">
                        <span className="font-bold text-xs text-primary text-truncate">{candidate.name}</span>
                        <span 
                          className="badge text-xs font-bold"
                          style={{
                            background: isPassed ? '#dcfce7' : '#fef3c7',
                            color: isPassed ? '#15803d' : '#b45309',
                            fontSize: '0.65rem'
                          }}
                        >
                          {isPassed ? 'Elected Moderator' : 'Nominated (In Vote)'}
                        </span>
                      </div>
                      <span className="text-xs text-muted d-block" style={{ fontSize: '0.7rem' }}>
                        Tally: {votes} / {target} community votes
                      </span>
                    </div>
                  </div>

                  {/* Actions & Vote Button */}
                  <div className="d-flex align-center gap-2">
                    {!isPassed && (
                      <>
                        <button
                          type="button"
                          className="btn btn-secondary btn-xs d-flex align-center gap-1"
                          onClick={() => handleVote(election.id)}
                          disabled={hasVoted || isVoting}
                          title={hasVoted ? 'You have already voted' : 'Cast vote to support nomination'}
                        >
                          <Vote size={12} />
                          <span>{hasVoted ? 'Voted' : 'Vote to Support'}</span>
                        </button>

                        {isCurrentAdmin && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs text-brand font-semibold"
                            onClick={() => handleAppoint(election.id)}
                            title="Admin fast-track appointment"
                          >
                            Appoint Immediately
                          </button>
                        )}
                      </>
                    )}

                    {isPassed && (
                      <span className="text-xs text-brand font-bold d-flex align-center gap-1" style={{ fontSize: '0.75rem' }}>
                        <CheckCircle2 size={14} /> Confirmed Moderator
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-secondary mb-0 mt-1" style={{ fontSize: '0.76rem' }}>
            No active elections currently running. Any community member can nominate a trusted neighbor above.
          </p>
        )}
      </div>

      {/* 1. Admins & Leadership Section */}
      {admins.length > 0 && (
        <div className="card p-4">
          <div className="d-flex align-center justify-between mb-3 pb-2 border-bottom">
            <span className="font-bold text-xs text-secondary text-uppercase d-flex align-center gap-1">
              <Shield size={14} className="text-brand" />
              <span>Circle Admins ({admins.length})</span>
            </span>
          </div>

          <div className="grid-2 gap-3">
            {admins.map(m => (
              <div 
                key={m.id} 
                className="d-flex align-center justify-between p-3 rounded"
                style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}
              >
                <div 
                  className="d-flex align-center gap-3 min-w-0 user-profile-trigger"
                  onClick={() => viewUserProfile(m)}
                  title={`View ${m.name}'s profile & contributions`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      viewUserProfile(m);
                    }
                  }}
                >
                  <img
                    src={m.avatar}
                    alt={m.name}
                    style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div className="min-w-0">
                    <div className="d-flex align-center gap-1">
                      <span className="font-bold text-xs text-primary text-truncate user-profile-name">{m.name}</span>
                      {m.id === currentUser?.id && <span className="badge badge-gray text-xs" style={{ fontSize: '0.65rem' }}>You</span>}
                    </div>
                    <span className="text-xs font-semibold text-brand d-block" style={{ fontSize: '0.72rem' }}>Circle Admin</span>
                    <span className="text-xs text-muted d-flex align-center gap-1" style={{ fontSize: '0.7rem' }}>
                      <MapPin size={10} /> {m.location?.neighborhood || 'Maplewood'}
                    </span>
                  </div>
                </div>

                <div className="d-flex align-center gap-1.5 flex-shrink-0">
                  {m.id !== currentUser?.id && (
                    <>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-muted"
                        onClick={() => handleReportAvatar(m)}
                        title="Report profile picture"
                      >
                        <Flag size={12} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs btn-icon"
                        onClick={() => startDirectMessage(m)}
                        title="Direct Message"
                      >
                        <MessageSquare size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Elected Community Moderators Section */}
      {moderators.length > 0 && (
        <div className="card p-4">
          <div className="d-flex align-center justify-between mb-3 pb-2 border-bottom">
            <span className="font-bold text-xs text-secondary text-uppercase d-flex align-center gap-1">
              <ShieldCheck size={14} className="text-brand" />
              <span>Elected Community Moderators ({moderators.length})</span>
            </span>
          </div>

          <div className="grid-2 gap-3">
            {moderators.map(m => (
              <div 
                key={m.id} 
                className="d-flex align-center justify-between p-3 rounded"
                style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}
              >
                <div 
                  className="d-flex align-center gap-3 min-w-0 user-profile-trigger"
                  onClick={() => viewUserProfile(m)}
                  title={`View ${m.name}'s profile & contributions`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      viewUserProfile(m);
                    }
                  }}
                >
                  <img
                    src={m.avatar}
                    alt={m.name}
                    style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div className="min-w-0">
                    <div className="d-flex align-center gap-1">
                      <span className="font-bold text-xs text-primary text-truncate user-profile-name">{m.name}</span>
                      {m.id === currentUser?.id && <span className="badge badge-gray text-xs" style={{ fontSize: '0.65rem' }}>You</span>}
                    </div>
                    <span className="badge text-xs font-bold" style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.68rem', display: 'inline-block' }}>
                      Community Moderator
                    </span>
                    <span className="text-xs text-muted d-flex align-center gap-1 mt-0.5" style={{ fontSize: '0.7rem' }}>
                      <MapPin size={10} /> {m.location?.neighborhood || 'Maplewood'}
                    </span>
                  </div>
                </div>

                <div className="d-flex align-center gap-1.5 flex-shrink-0">
                  {m.id !== currentUser?.id && (
                    <>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-muted"
                        onClick={() => handleReportAvatar(m)}
                        title="Report profile picture"
                      >
                        <Flag size={12} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs btn-icon"
                        onClick={() => startDirectMessage(m)}
                        title="Direct Message"
                      >
                        <MessageSquare size={13} />
                      </button>
                      {canModerate && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs text-rose"
                          onClick={() => handleKickMember(m)}
                          title="Kick from circle"
                        >
                          <UserX size={13} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Community Members Section */}
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
                <div 
                  className="d-flex align-center gap-3 min-w-0 user-profile-trigger"
                  onClick={() => viewUserProfile(m)}
                  title={`View ${m.name}'s profile & contributions`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      viewUserProfile(m);
                    }
                  }}
                >
                  <img
                    src={m.avatar}
                    alt={m.name}
                    style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div className="min-w-0">
                    <div className="d-flex align-center gap-1">
                      <span className="font-bold text-xs text-primary text-truncate user-profile-name">{m.name}</span>
                      {m.id === currentUser?.id && <span className="badge badge-gray text-xs" style={{ fontSize: '0.65rem' }}>You</span>}
                    </div>
                    <span className="text-xs text-secondary d-block" style={{ fontSize: '0.72rem' }}>Member</span>
                    <span className="text-xs text-muted d-flex align-center gap-1" style={{ fontSize: '0.7rem' }}>
                      <MapPin size={10} /> {m.location?.neighborhood || 'Maplewood District'}
                    </span>
                  </div>
                </div>

                <div className="d-flex align-center gap-1.5 flex-shrink-0">
                  {m.id !== currentUser?.id && (
                    <>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-muted"
                        onClick={() => handleReportAvatar(m)}
                        title="Report profile picture"
                      >
                        <Flag size={12} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs btn-icon"
                        onClick={() => startDirectMessage(m)}
                        title="Direct Message"
                      >
                        <MessageSquare size={13} />
                      </button>
                      {canModerate && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs text-rose"
                          onClick={() => handleKickMember(m)}
                          title="Kick member from circle"
                        >
                          <UserX size={13} />
                        </button>
                      )}
                    </>
                  )}
                </div>
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
