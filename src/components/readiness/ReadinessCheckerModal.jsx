import { useState, useEffect } from 'react';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  Users, 
  Clock, 
  X, 
  Plus, 
  UserCheck, 
  UserMinus, 
  Sparkles
} from 'lucide-react';

export const ReadinessCheckerModal = () => {
  const {
    isReadinessModalOpen,
    closeReadinessModal,
    readinessModalCommunity,
    readinessModalCheckId,
    currentUser,
    readinessChecks,
    createReadinessCheck,
    submitReadinessResponse,
    closeReadinessCheck,
    communities
  } = useCareMesh();

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedCheckId, setSelectedCheckId] = useState(null);

  // New check form state
  const [title, setTitle] = useState('');
  const [communityId, setCommunityId] = useState(readinessModalCommunity?.id || 'com_01');
  const [targetHeadcount, setTargetHeadcount] = useState(5);
  const [shiftTime, setShiftTime] = useState('Tomorrow, 8:00 AM - 12:00 PM');
  const [notes, setNotes] = useState('');

  // Response form state
  const [responseStatus, setResponseStatus] = useState('ready'); // 'ready' | 'standby' | 'unavailable'
  const [hoursAvailable, setHoursAvailable] = useState(4);
  const [gearNotes, setGearNotes] = useState('');
  const [isResponding, setIsResponding] = useState(false);

  useEffect(() => {
    if (!isReadinessModalOpen) return;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        closeReadinessModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isReadinessModalOpen, closeReadinessModal]);

  if (!isReadinessModalOpen) return null;

  // Filter checks for current community if specified, otherwise show all
  const activeCommunityId = readinessModalCommunity?.id;
  const filteredChecks = activeCommunityId 
    ? readinessChecks.filter(rc => rc.communityId === activeCommunityId || !rc.communityId || rc.id === readinessModalCheckId)
    : readinessChecks;

  const effectiveCheckId = selectedCheckId || readinessModalCheckId;
  const currentActiveCheck = effectiveCheckId 
    ? (readinessChecks.find(rc => rc.id === effectiveCheckId) || filteredChecks[0])
    : filteredChecks[0];

  // Check if current user has already responded to the selected check
  const myResponse = currentActiveCheck?.responses?.find(r => r.userId === currentUser?.id);

  const handleCreateCheck = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newCheck = await createReadinessCheck({
      title: title.trim(),
      communityId,
      targetHeadcount: Number(targetHeadcount) || 5,
      shiftTime: shiftTime.trim(),
      notes: notes.trim()
    });

    setTitle('');
    setNotes('');
    setIsCreatingNew(false);
    if (newCheck?.id) setSelectedCheckId(newCheck.id);
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!currentActiveCheck) return;

    setIsResponding(true);
    try {
      await submitReadinessResponse(currentActiveCheck.id, {
        status: responseStatus,
        hoursAvailable: Number(hoursAvailable) || 0,
        gearNotes: gearNotes.trim()
      });
      setGearNotes('');
    } catch (err) {
      console.error('Response submission failed:', err);
    } finally {
      setIsResponding(false);
    }
  };

  const isCreatorOfCurrent = Boolean(currentUser?.id && (currentActiveCheck?.creatorId === currentUser.id || currentUser.isAdmin));

  return (
    <div 
      className="modal-overlay" 
      onClick={closeReadinessModal}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div 
        className="modal-content card p-0 animate-scale-in" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: 'min(90vh, 90dvh)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-light)'
        }}
      >
        {/* Header */}
        <div 
          className="p-4 d-flex align-center justify-between border-bottom flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)', color: '#ffffff' }}
        >
          <div className="d-flex align-center gap-3">
            <div 
              style={{ 
                width: '42px', 
                height: '42px', 
                borderRadius: 'var(--radius-lg)', 
                background: 'rgba(255, 255, 255, 0.15)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#6ee7b7'
              }}
            >
              <UserCheck size={24} />
            </div>
            <div>
              <div className="d-flex align-center gap-2">
                <h3 className="font-bold text-md text-white mb-0">Member Readiness Checker</h3>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', fontSize: '0.68rem' }}>
                  Creator & Dispatch Tool
                </span>
              </div>
              <p className="text-xs text-emerald-100 mb-0" style={{ opacity: 0.9, fontSize: '0.78rem' }}>
                Verify volunteer availability, standby capacity, and equipment preparedness before scheduling workdays.
              </p>
            </div>
          </div>

          <div className="d-flex align-center gap-2">
            <button
              type="button"
              className="btn btn-xs btn-secondary"
              style={{ fontSize: '0.75rem' }}
              onClick={() => setIsCreatingNew(!isCreatingNew)}
            >
              <Plus size={14} className="mr-1" />
              {isCreatingNew ? 'View Checks' : 'New Check'}
            </button>
            <button 
              type="button" 
              className="btn btn-ghost btn-sm btn-icon text-white" 
              onClick={closeReadinessModal}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="d-flex flex-column flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          {isCreatingNew ? (
            /* Create New Readiness Check Form */
            <form 
              onSubmit={handleCreateCheck} 
              className="p-4 overflow-y-auto d-flex flex-column gap-3 flex-1"
              style={{ 
                overflowY: 'auto', 
                flex: 1, 
                minHeight: 0, 
                maxHeight: 'calc(90vh - 90px)',
                WebkitOverflowScrolling: 'touch' 
              }}
            >
              <div className="d-flex align-center justify-between pb-2 border-bottom">
                <h4 className="font-bold text-sm text-primary mb-0">Initiate Member Readiness Check</h4>
                <span className="text-xs text-muted">Check neighbor availability for upcoming operations</span>
              </div>

              <div>
                <label className="form-label text-xs font-bold text-secondary mb-1 d-block">
                  Shift / Dispatch Title <span className="text-rose">*</span>
                </label>
                <input
                  type="text"
                  className="form-input text-xs"
                  placeholder="e.g. Saturday Watershed Restoration Crew Readiness"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2 gap-3">
                <div>
                  <label className="form-label text-xs font-bold text-secondary mb-1 d-block">
                    Target Community Circle
                  </label>
                  <select
                    className="form-input text-xs"
                    value={communityId}
                    onChange={(e) => setCommunityId(e.target.value)}
                  >
                    {communities.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label text-xs font-bold text-secondary mb-1 d-block">
                    Target Headcount Needed
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className="form-input text-xs"
                    value={targetHeadcount}
                    onChange={(e) => setTargetHeadcount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label text-xs font-bold text-secondary mb-1 d-block">
                  Time Window / Shift
                </label>
                <input
                  type="text"
                  className="form-input text-xs"
                  placeholder="e.g. Saturday Oct 14, 9:00 AM - 1:00 PM"
                  value={shiftTime}
                  onChange={(e) => setShiftTime(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label text-xs font-bold text-secondary mb-1 d-block">
                  Instructions & Required Gear Notes
                </label>
                <textarea
                  rows={3}
                  className="form-input text-xs"
                  placeholder="Mention needed skills, tools (work gloves, rain boots, hand trucks), or meeting coordinates..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="d-flex align-center justify-end gap-2 pt-2 border-top">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsCreatingNew(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ background: 'var(--brand)', borderColor: 'var(--brand)' }}
                  disabled={!title.trim()}
                >
                  Launch Readiness Check
                </button>
              </div>
            </form>
          ) : (
            /* Active Readiness Checks Viewer & Responder */
            <div className="d-flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
              {/* Left Column: Checks List */}
              <div 
                className="d-flex flex-column border-right overflow-y-auto"
                style={{ 
                  width: '260px', 
                  flexShrink: 0, 
                  background: 'var(--bg-subtle)', 
                  overflowY: 'auto', 
                  minHeight: 0,
                  WebkitOverflowScrolling: 'touch' 
                }}
              >
                <div className="p-3 border-bottom font-bold text-xs text-muted text-uppercase" style={{ fontSize: '0.68rem' }}>
                  Readiness Checks ({filteredChecks.length})
                </div>

                {filteredChecks.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted">
                    No active readiness checks. Click "New Check" above to launch one.
                  </div>
                ) : (
                  filteredChecks.map(check => {
                    const isSelected = check.id === currentActiveCheck?.id;
                    const readyPct = check.readyPercentage || 0;
                    return (
                      <div
                        key={check.id}
                        className="p-3 border-bottom cursor-pointer card-interactive"
                        style={{
                          background: isSelected ? '#ffffff' : 'transparent',
                          borderLeft: isSelected ? '3px solid var(--brand)' : '3px solid transparent'
                        }}
                        onClick={() => setSelectedCheckId(check.id)}
                      >
                        <div className="d-flex align-center justify-between mb-1">
                          <span className={`badge text-xs ${check.status === 'active' ? 'badge-primary' : 'badge-gray'}`} style={{ fontSize: '0.62rem' }}>
                            {check.status === 'active' ? 'Active' : 'Closed'}
                          </span>
                          <span className="font-bold text-xs" style={{ color: readyPct >= 100 ? 'var(--brand)' : 'var(--amber-dark)' }}>
                            {readyPct}%
                          </span>
                        </div>
                        <span className="font-bold text-xs text-primary d-block text-truncate mb-1">
                          {check.title}
                        </span>
                        <div className="d-flex align-center gap-1 text-muted" style={{ fontSize: '0.68rem' }}>
                          <Users size={11} />
                          <span>{check.readyCount || 0} / {check.targetHeadcount || 5} Ready</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Column: Selected Check Details & Responder */}
              <div 
                className="flex-1 overflow-y-auto p-4 d-flex flex-column gap-4" 
                style={{ 
                  minWidth: 0, 
                  overflowY: 'auto', 
                  flex: 1, 
                  minHeight: 0,
                  WebkitOverflowScrolling: 'touch' 
                }}
              >
                {currentActiveCheck ? (
                  <>
                    {/* Header & Status Gauge */}
                    <div className="card p-3 d-flex flex-column gap-3" style={{ background: 'var(--bg-subtle)' }}>
                      <div className="d-flex align-center justify-between gap-2 flex-wrap">
                        <div>
                          <div className="d-flex align-center gap-2">
                            <h4 className="font-bold text-sm text-primary mb-0">{currentActiveCheck.title}</h4>
                            <span className={`badge text-xs ${currentActiveCheck.status === 'active' ? 'badge-primary' : 'badge-gray'}`}>
                              {currentActiveCheck.status === 'active' ? 'Poll Open' : 'Closed'}
                            </span>
                            {(currentActiveCheck.requestId || currentActiveCheck.request_id) && (
                              <span className="badge badge-emerald text-xs font-semibold">
                                🤝 Volunteer Roll Call
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted d-block mt-0.5">
                            Shift: {currentActiveCheck.shiftTime || 'Upcoming schedule'}
                          </span>
                        </div>

                        {isCreatorOfCurrent && currentActiveCheck.status === 'active' && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => closeReadinessCheck(currentActiveCheck.id)}
                            title="Mark dispatch roster confirmed"
                          >
                            Close Check
                          </button>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="d-flex align-center justify-between text-xs mb-1">
                          <span className="font-bold text-secondary">
                            Crew Readiness: {currentActiveCheck.readyCount || 0} / {currentActiveCheck.targetHeadcount || 5} Confirmed
                          </span>
                          <span className="font-bold text-brand">{currentActiveCheck.readyPercentage || 0}%</span>
                        </div>
                        <div 
                          style={{ 
                            height: '8px', 
                            background: '#e2e8f0', 
                            borderRadius: 'var(--radius-full)', 
                            overflow: 'hidden' 
                          }}
                        >
                          <div 
                            style={{ 
                              width: `${Math.min(100, currentActiveCheck.readyPercentage || 0)}%`, 
                              height: '100%', 
                              background: currentActiveCheck.readyPercentage >= 100 ? 'var(--brand)' : 'linear-gradient(90deg, #10b981, #059669)',
                              transition: 'width 0.3s ease'
                            }} 
                          />
                        </div>
                      </div>

                      {currentActiveCheck.notes && (
                        <p className="text-xs text-secondary mb-0 p-2 rounded" style={{ background: '#ffffff', border: '1px solid var(--border-light)' }}>
                          <strong>Gear / Operational Note:</strong> {currentActiveCheck.notes}
                        </p>
                      )}
                    </div>

                    {/* Member Quick Response Card */}
                    {currentActiveCheck.status === 'active' && (
                      <div className="card p-3 border" style={{ borderColor: 'var(--primary-200)', background: '#f8fafc' }}>
                        <div className="d-flex align-center justify-between mb-2 pb-1 border-bottom">
                          <span className="font-bold text-xs text-primary d-flex align-center gap-1.5">
                            <Sparkles size={14} className="text-brand" />
                            <span>Your Readiness Response</span>
                          </span>
                          {myResponse && (
                            <span className="badge text-xs" style={{ background: myResponse.status === 'ready' ? '#dcfce7' : '#fef3c7', color: myResponse.status === 'ready' ? '#15803d' : '#b45309', fontSize: '0.68rem' }}>
                              Current: {myResponse.status.toUpperCase()} ({myResponse.hoursAvailable} hrs)
                            </span>
                          )}
                        </div>

                        <form onSubmit={handleSubmitResponse} className="d-flex flex-column gap-2.5">
                          <div className="grid-3 gap-2">
                            <button
                              type="button"
                              className={`btn btn-xs p-2 d-flex flex-column align-center gap-1 ${responseStatus === 'ready' ? 'btn-primary font-bold' : 'btn-secondary'}`}
                              style={{ height: 'auto', background: responseStatus === 'ready' ? 'var(--brand)' : undefined, borderColor: responseStatus === 'ready' ? 'var(--brand)' : undefined }}
                              onClick={() => setResponseStatus('ready')}
                            >
                              <UserCheck size={16} />
                              <span style={{ fontSize: '0.75rem' }}>Ready & Able</span>
                            </button>

                            <button
                              type="button"
                              className={`btn btn-xs p-2 d-flex flex-column align-center gap-1 ${responseStatus === 'standby' ? 'btn-primary font-bold' : 'btn-secondary'}`}
                              style={{ height: 'auto', background: responseStatus === 'standby' ? '#d97706' : undefined, borderColor: responseStatus === 'standby' ? '#d97706' : undefined }}
                              onClick={() => setResponseStatus('standby')}
                            >
                              <Clock size={16} />
                              <span style={{ fontSize: '0.75rem' }}>On Standby</span>
                            </button>

                            <button
                              type="button"
                              className={`btn btn-xs p-2 d-flex flex-column align-center gap-1 ${responseStatus === 'unavailable' ? 'btn-primary font-bold' : 'btn-secondary'}`}
                              style={{ height: 'auto', background: responseStatus === 'unavailable' ? '#dc2626' : undefined, borderColor: responseStatus === 'unavailable' ? '#dc2626' : undefined }}
                              onClick={() => setResponseStatus('unavailable')}
                            >
                              <UserMinus size={16} />
                              <span style={{ fontSize: '0.75rem' }}>Unavailable</span>
                            </button>
                          </div>

                          <div className="grid-2 gap-2">
                            <div>
                              <label className="form-label text-xs text-muted mb-1 d-block" style={{ fontSize: '0.7rem' }}>
                                Hours Available
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="12"
                                className="form-input text-xs"
                                value={hoursAvailable}
                                onChange={(e) => setHoursAvailable(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="form-label text-xs text-muted mb-1 d-block" style={{ fontSize: '0.7rem' }}>
                                Equipment / Gear Notes
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Bringing heavy gloves, first-aid kit"
                                className="form-input text-xs"
                                value={gearNotes}
                                onChange={(e) => setGearNotes(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="d-flex justify-end">
                            <button
                              type="submit"
                              className="btn btn-primary btn-xs"
                              disabled={isResponding}
                            >
                              {isResponding ? 'Saving...' : myResponse ? 'Update My Availability' : 'Confirm My Readiness'}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Member Roster List */}
                    <div>
                      <div className="d-flex align-center justify-between mb-2">
                        <span className="font-bold text-xs text-secondary text-uppercase" style={{ fontSize: '0.68rem' }}>
                          Reported Member Roster ({(currentActiveCheck.responses || []).length})
                        </span>
                      </div>

                      <div className="d-flex flex-column gap-2">
                        {(currentActiveCheck.responses || []).length === 0 ? (
                          <div className="p-3 rounded text-center text-xs text-muted" style={{ background: 'var(--bg-subtle)' }}>
                            No member responses logged yet. Neighbors in this circle can confirm above.
                          </div>
                        ) : (
                          currentActiveCheck.responses.map(resp => {
                            const user = resp.user || (currentUser?.id && resp.userId === currentUser.id ? currentUser : null);
                            const isReady = resp.status === 'ready';
                            const isStandby = resp.status === 'standby';

                            return (
                              <div
                                key={resp.id || resp.userId}
                                className="p-2.5 rounded d-flex align-center justify-between gap-2"
                                style={{ background: '#ffffff', border: '1px solid var(--border-light)' }}
                              >
                                <div className="d-flex align-center gap-2.5 min-w-0">
                                  <img
                                    src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                                    alt=""
                                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                                  />
                                  <div className="min-w-0">
                                    <div className="d-flex align-center gap-1.5">
                                      <span className="font-bold text-xs text-primary text-truncate">{user?.name || `Member ${resp.userId}`}</span>
                                      {currentUser?.id && resp.userId === currentUser.id && <span className="badge badge-gray text-xs" style={{ fontSize: '0.62rem' }}>You</span>}
                                    </div>
                                    {resp.gearNotes && (
                                      <span className="text-xs text-muted d-block text-truncate" style={{ fontSize: '0.7rem' }}>
                                        Gear: {resp.gearNotes}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="d-flex align-center gap-2 flex-shrink-0">
                                  {resp.hoursAvailable > 0 && (
                                    <span className="text-xs text-muted" style={{ fontSize: '0.7rem' }}>
                                      {resp.hoursAvailable} hrs
                                    </span>
                                  )}
                                  <span
                                    className="badge font-bold text-xs"
                                    style={{
                                      background: isReady ? '#dcfce7' : isStandby ? '#fef3c7' : '#fee2e2',
                                      color: isReady ? '#15803d' : isStandby ? '#b45309' : '#b91c1c',
                                      fontSize: '0.68rem'
                                    }}
                                  >
                                    {isReady ? 'Ready' : isStandby ? 'Standby' : 'Unavailable'}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-5 text-center text-muted my-auto">
                    Select a readiness check from the left to view details and member responses.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
