import { useState, useEffect, useMemo, useRef } from 'react';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  Users, 
  Clock, 
  X, 
  Plus, 
  UserCheck, 
  UserMinus, 
  Sparkles,
  HandHeart,
  Calendar,
  Search,
  ChevronDown,
  Check
} from 'lucide-react';

// Pure formatting and search helpers for activity picker
const formatRequestItem = (r, isParticipating, currentUserId) => {
  const isOwner = r.requester?.id === currentUserId || r.requesterId === currentUserId || r.requester_id === currentUserId;
  return {
    key: `request:${r.id}`,
    type: 'request',
    raw: r,
    title: r.title,
    isParticipating,
    role: isOwner ? 'Your Request' : (isParticipating ? 'Volunteer' : 'Community Request'),
    roleBadgeClass: isOwner ? 'badge-warning' : (isParticipating ? 'badge-success' : 'badge-secondary'),
    subtext: `${r.peopleNeeded || 1} needed • ${r.urgency || 'medium'} urgency`,
    location: r.location?.address || ''
  };
};

const formatEventItem = (e, isParticipating, currentUserId) => {
  const isOrganizer = e.organizer?.id === currentUserId || e.organizerId === currentUserId || e.organizer_id === currentUserId;
  return {
    key: `event:${e.id}`,
    type: 'event',
    raw: e,
    title: e.title,
    isParticipating,
    role: isOrganizer ? 'Organizer' : (isParticipating ? 'Attending' : 'Community Event'),
    roleBadgeClass: isOrganizer ? 'badge-primary' : (isParticipating ? 'badge-info' : 'badge-secondary'),
    subtext: `${e.date || 'TBD'}${e.time ? ' • ' + e.time : ''}`,
    location: e.location?.address || ''
  };
};

const matchesActivityQuery = (item, query) => {
  if (!query) return true;
  return (
    item.title.toLowerCase().includes(query) ||
    item.role.toLowerCase().includes(query) ||
    item.subtext.toLowerCase().includes(query) ||
    item.location.toLowerCase().includes(query)
  );
};

const SearchableActivityPicker = ({
  selectedActivityKey,
  onSelectActivity,
  participatingRequests = [],
  participatingEvents = [],
  otherRequests = [],
  otherEvents = [],
  currentUser
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'requests' | 'events'
  const [showOther, setShowOther] = useState(false);
  const containerRef = useRef(null);
  const currentUserId = currentUser?.id;

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Find currently selected item
  const selectedItem = useMemo(() => {
    if (!selectedActivityKey) return null;
    if (selectedActivityKey.startsWith('request:')) {
      const id = selectedActivityKey.replace('request:', '');
      const part = participatingRequests.find(r => r.id === id);
      if (part) return formatRequestItem(part, true, currentUserId);
      const other = otherRequests.find(r => r.id === id);
      if (other) return formatRequestItem(other, false, currentUserId);
    } else if (selectedActivityKey.startsWith('event:')) {
      const id = selectedActivityKey.replace('event:', '');
      const part = participatingEvents.find(e => e.id === id);
      if (part) return formatEventItem(part, true, currentUserId);
      const other = otherEvents.find(e => e.id === id);
      if (other) return formatEventItem(other, false, currentUserId);
    }
    return null;
  }, [selectedActivityKey, participatingRequests, otherRequests, participatingEvents, otherEvents, currentUserId]);

  const q = searchQuery.toLowerCase().trim();

  const formattedParticipating = useMemo(() => {
    const reqs = participatingRequests.map(r => formatRequestItem(r, true, currentUserId));
    const evts = participatingEvents.map(e => formatEventItem(e, true, currentUserId));
    return [...reqs, ...evts];
  }, [participatingRequests, participatingEvents, currentUserId]);

  const formattedOther = useMemo(() => {
    const reqs = otherRequests.map(r => formatRequestItem(r, false, currentUserId));
    const evts = otherEvents.map(e => formatEventItem(e, false, currentUserId));
    return [...reqs, ...evts];
  }, [otherRequests, otherEvents, currentUserId]);

  // Apply tab filters and search filters
  const filteredParticipating = useMemo(() => {
    return formattedParticipating.filter(item => {
      if (activeTab === 'requests' && item.type !== 'request') return false;
      if (activeTab === 'events' && item.type !== 'event') return false;
      return matchesActivityQuery(item, q);
    });
  }, [formattedParticipating, activeTab, q]);

  const filteredOther = useMemo(() => {
    return formattedOther.filter(item => {
      if (activeTab === 'requests' && item.type !== 'request') return false;
      if (activeTab === 'events' && item.type !== 'event') return false;
      return matchesActivityQuery(item, q);
    });
  }, [formattedOther, activeTab, q]);

  const totalOtherCount = formattedOther.length;
  // If there's an active query, automatically reveal other matching operations
  const shouldShowOther = showOther || q.length > 0;

  return (
    <div className="position-relative w-100" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        className="form-input text-xs w-100 d-flex align-center justify-between gap-1.5"
        style={{
          cursor: 'pointer',
          textAlign: 'left',
          minHeight: '38px',
          background: 'var(--input-bg, #ffffff)',
          borderColor: isOpen ? 'var(--color-primary, #3b82f6)' : 'var(--border-color, #cbd5e1)',
          boxShadow: isOpen ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none'
        }}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="d-flex align-center gap-1.5 min-w-0 flex-1">
          {selectedItem ? (
            <>
              {selectedItem.type === 'request' ? (
                <HandHeart size={14} className="text-amber flex-shrink-0" />
              ) : (
                <Calendar size={14} className="text-brand flex-shrink-0" />
              )}
              <span className="text-truncate font-semibold text-primary" style={{ fontSize: '0.78rem' }}>
                {selectedItem.title}
              </span>
              <span 
                className={`badge ${selectedItem.roleBadgeClass} text-xs flex-shrink-0`}
                style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}
              >
                {selectedItem.role}
              </span>
            </>
          ) : (
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
              Select participating request or civic event...
            </span>
          )}
        </div>
        <ChevronDown 
          size={14} 
          className="text-muted flex-shrink-0 transition-transform" 
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          className="position-absolute w-100 rounded-md border shadow-lg"
          style={{
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 120,
            background: 'var(--card-bg, #ffffff)',
            borderColor: 'var(--border-color, #e2e8f0)',
            boxShadow: '0 12px 28px -4px rgba(0,0,0,0.18), 0 8px 12px -4px rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}
        >
          {/* Search Bar */}
          <div className="p-2 border-bottom" style={{ background: 'var(--surface-color, #f8fafc)' }}>
            <div className="position-relative d-flex align-center">
              <Search size={13} className="position-absolute text-muted" style={{ left: '8px' }} />
              <input
                type="text"
                autoFocus
                className="form-input text-xs w-100"
                style={{ paddingLeft: '28px', paddingRight: q ? '26px' : '8px', height: '30px', fontSize: '0.75rem' }}
                placeholder="Search activities, roles, dates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="btn-icon position-absolute"
                  style={{ right: '4px', width: '20px', height: '20px', padding: 0 }}
                  title="Clear search"
                >
                  <X size={12} className="text-muted" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="d-flex align-center gap-1 mt-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              <button
                type="button"
                className={`btn btn-xs ${activeTab === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.66rem', padding: '0.15rem 0.5rem', borderRadius: '12px' }}
                onClick={() => setActiveTab('all')}
              >
                All ({formattedParticipating.length + (shouldShowOther ? formattedOther.length : 0)})
              </button>
              <button
                type="button"
                className={`btn btn-xs ${activeTab === 'requests' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.66rem', padding: '0.15rem 0.5rem', borderRadius: '12px' }}
                onClick={() => setActiveTab('requests')}
              >
                🤝 Requests
              </button>
              <button
                type="button"
                className={`btn btn-xs ${activeTab === 'events' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.66rem', padding: '0.15rem 0.5rem', borderRadius: '12px' }}
                onClick={() => setActiveTab('events')}
              >
                📅 Events
              </button>
            </div>
          </div>

          {/* Activity Scroll List */}
          <div 
            style={{ 
              maxHeight: '230px', 
              overflowY: 'auto', 
              padding: '0.4rem', 
              overscrollBehavior: 'contain' 
            }}
          >
            {/* Section 1: Currently Participating */}
            {filteredParticipating.length > 0 && (
              <div className="mb-2">
                <div 
                  className="px-2 py-1 text-muted font-bold text-uppercase d-flex align-center justify-between"
                  style={{ fontSize: '0.65rem', letterSpacing: '0.04em' }}
                >
                  <span>Active Participations</span>
                  <span className="badge badge-success text-xs" style={{ fontSize: '0.6rem', padding: '0.05rem 0.3rem' }}>
                    {filteredParticipating.length}
                  </span>
                </div>
                {filteredParticipating.map(item => {
                  const isSelected = item.key === selectedActivityKey;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className="w-100 text-left p-2 rounded transition-all d-flex align-center justify-between gap-1.5"
                      style={{
                        background: isSelected ? 'var(--primary-50, #eff6ff)' : 'transparent',
                        border: isSelected ? '1px solid var(--primary-200, #bfdbfe)' : '1px solid transparent',
                        cursor: 'pointer',
                        marginBottom: '2px'
                      }}
                      onClick={() => {
                        onSelectActivity(item.key);
                        setIsOpen(false);
                      }}
                    >
                      <div className="d-flex align-center gap-1.5 min-w-0 flex-1">
                        {item.type === 'request' ? (
                          <HandHeart size={14} className="text-amber flex-shrink-0" />
                        ) : (
                          <Calendar size={14} className="text-brand flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="d-flex align-center gap-1">
                            <span className="text-truncate font-semibold text-primary" style={{ fontSize: '0.76rem' }}>
                              {item.title}
                            </span>
                            <span 
                              className={`badge ${item.roleBadgeClass} text-xs flex-shrink-0`}
                              style={{ fontSize: '0.6rem', padding: '0.05rem 0.3rem' }}
                            >
                              {item.role}
                            </span>
                          </div>
                          <div className="text-muted text-truncate" style={{ fontSize: '0.68rem', marginTop: '1px' }}>
                            {item.subtext} {item.location ? `• ${item.location}` : ''}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check size={14} className="text-brand flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Section 2: Other Community Operations */}
            {shouldShowOther ? (
              filteredOther.length > 0 && (
                <div>
                  <div 
                    className="px-2 py-1 text-muted font-bold text-uppercase d-flex align-center justify-between"
                    style={{ fontSize: '0.65rem', letterSpacing: '0.04em' }}
                  >
                    <span>Other Community Operations</span>
                    <span className="badge badge-secondary text-xs" style={{ fontSize: '0.6rem', padding: '0.05rem 0.3rem' }}>
                      {filteredOther.length}
                    </span>
                  </div>
                  {filteredOther.map(item => {
                    const isSelected = item.key === selectedActivityKey;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        className="w-100 text-left p-2 rounded transition-all d-flex align-center justify-between gap-1.5"
                        style={{
                          background: isSelected ? 'var(--primary-50, #eff6ff)' : 'transparent',
                          border: isSelected ? '1px solid var(--primary-200, #bfdbfe)' : '1px solid transparent',
                          cursor: 'pointer',
                          marginBottom: '2px'
                        }}
                        onClick={() => {
                          onSelectActivity(item.key);
                          setIsOpen(false);
                        }}
                      >
                        <div className="d-flex align-center gap-1.5 min-w-0 flex-1">
                          {item.type === 'request' ? (
                            <HandHeart size={14} className="text-amber flex-shrink-0" />
                          ) : (
                            <Calendar size={14} className="text-brand flex-shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="d-flex align-center gap-1">
                              <span className="text-truncate font-semibold text-primary" style={{ fontSize: '0.76rem' }}>
                                {item.title}
                              </span>
                            </div>
                            <div className="text-muted text-truncate" style={{ fontSize: '0.68rem', marginTop: '1px' }}>
                              {item.subtext} {item.location ? `• ${item.location}` : ''}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check size={14} className="text-brand flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )
            ) : totalOtherCount > 0 ? (
              <div className="p-1 pt-2 border-top text-center">
                <button
                  type="button"
                  className="btn btn-ghost btn-xs w-100 text-muted"
                  style={{ fontSize: '0.7rem', padding: '0.35rem 0.5rem' }}
                  onClick={() => setShowOther(true)}
                >
                  + Show {totalOtherCount} Other Community Activities
                </button>
              </div>
            ) : null}

            {/* Empty Search State */}
            {filteredParticipating.length === 0 && (!shouldShowOther || filteredOther.length === 0) && (
              <div className="p-3 text-center text-muted" style={{ fontSize: '0.75rem' }}>
                {q ? (
                  <>No activities match &ldquo;<span className="font-semibold">{q}</span>&rdquo;</>
                ) : (
                  <>No participating activities found</>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const ReadinessCheckerModal = () => {
  const {
    isReadinessModalOpen,
    closeReadinessModal,
    readinessModalCommunity,
    readinessModalCheckId,
    readinessModalRequestId,
    readinessModalEventId,
    currentUser,
    readinessChecks,
    createReadinessCheck,
    submitReadinessResponse,
    closeReadinessCheck,
    requests = [],
    events = [],
    showToast
  } = useCareMesh();

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedCheckId, setSelectedCheckId] = useState(null);

  // Participating Requests: where currentUser is requester or volunteer
  const participatingRequests = useMemo(() => {
    if (!currentUser?.id || currentUser.id === 'usr_guest') return [];
    return (requests || []).filter(r => {
      const isOwner = r.requester?.id === currentUser.id || r.requesterId === currentUser.id || r.requester_id === currentUser.id;
      const isVolunteer = r.responses?.some(resp => resp.userId === currentUser.id || resp.user?.id === currentUser.id || resp.user_id === currentUser.id);
      return isOwner || isVolunteer;
    });
  }, [requests, currentUser]);

  // Participating Events: where currentUser is organizer or participant
  const participatingEvents = useMemo(() => {
    if (!currentUser?.id || currentUser.id === 'usr_guest') return [];
    return (events || []).filter(e => {
      const isOrganizer = e.organizer?.id === currentUser.id || e.organizerId === currentUser.id || e.organizer_id === currentUser.id;
      const isParticipant = e.participants?.some(p => p.id === currentUser.id);
      return isOrganizer || isParticipant;
    });
  }, [events, currentUser]);

  // Other active requests & events in case user wants to target any community operation
  const otherRequests = useMemo(() => {
    const participatingIds = new Set(participatingRequests.map(r => r.id));
    return (requests || []).filter(r => !participatingIds.has(r.id) && r.status !== 'fulfilled');
  }, [requests, participatingRequests]);

  const otherEvents = useMemo(() => {
    const participatingIds = new Set(participatingEvents.map(e => e.id));
    return (events || []).filter(e => !participatingIds.has(e.id) && e.status !== 'cancelled' && e.status !== 'completed');
  }, [events, participatingEvents]);

  const defaultActivityKey = useMemo(() => {
    if (readinessModalRequestId) return `request:${readinessModalRequestId}`;
    if (readinessModalEventId) return `event:${readinessModalEventId}`;
    if (participatingRequests.length > 0) return `request:${participatingRequests[0].id}`;
    if (participatingEvents.length > 0) return `event:${participatingEvents[0].id}`;
    if (otherRequests.length > 0) return `request:${otherRequests[0].id}`;
    if (otherEvents.length > 0) return `event:${otherEvents[0].id}`;
    return '';
  }, [readinessModalRequestId, readinessModalEventId, participatingRequests, participatingEvents, otherRequests, otherEvents]);

  const [userSelectedActivityKey, setUserSelectedActivityKey] = useState(null);
  const selectedActivityKey = userSelectedActivityKey ?? defaultActivityKey;

  const targetActivityReq = useMemo(() => {
    if (!selectedActivityKey?.startsWith('request:')) return null;
    const reqId = selectedActivityKey.replace('request:', '');
    return requests.find(r => r.id === reqId) || null;
  }, [selectedActivityKey, requests]);

  const targetActivityEvt = useMemo(() => {
    if (!selectedActivityKey?.startsWith('event:')) return null;
    const evtId = selectedActivityKey.replace('event:', '');
    return events.find(e => e.id === evtId) || null;
  }, [selectedActivityKey, events]);

  const defaultTitle = targetActivityReq 
    ? `Volunteer Roll Call: ${targetActivityReq.title}` 
    : targetActivityEvt 
      ? `Readiness Check: ${targetActivityEvt.title}` 
      : '';

  const defaultHeadcount = targetActivityReq 
    ? (Number(targetActivityReq.peopleNeeded) || 4)
    : targetActivityEvt 
      ? (Number(targetActivityEvt.maxParticipants) || 12)
      : 5;

  const defaultShiftTime = targetActivityReq 
    ? (targetActivityReq.urgency === 'immediate' ? 'Immediate Response Window' : 'Scheduled Shift (Next 24-48 Hours)')
    : targetActivityEvt 
      ? `${targetActivityEvt.date} • ${targetActivityEvt.time}`
      : 'Tomorrow, 8:00 AM - 12:00 PM';

  const defaultNotes = targetActivityReq 
    ? `Operational readiness check for help request "${targetActivityReq.title}". Please confirm your available hours and required equipment.`
    : targetActivityEvt 
      ? `Readiness roll-call for civic event "${targetActivityEvt.title}". Please confirm attendance, arrival tools, and availability.`
      : '';

  const [userTitle, setUserTitle] = useState(null);
  const [userHeadcount, setUserHeadcount] = useState(null);
  const [userShiftTime, setUserShiftTime] = useState(null);
  const [userNotes, setUserNotes] = useState(null);

  const title = userTitle ?? defaultTitle;
  const targetHeadcount = userHeadcount ?? defaultHeadcount;
  const shiftTime = userShiftTime ?? defaultShiftTime;
  const notes = userNotes ?? defaultNotes;

  const handleSelectActivity = (key) => {
    setUserSelectedActivityKey(key);
    setUserTitle(null);
    setUserHeadcount(null);
    setUserShiftTime(null);
    setUserNotes(null);
  };

  const selectedActivitySummary = useMemo(() => {
    if (targetActivityReq) {
      const isOwner = targetActivityReq.requester?.id === currentUser?.id || targetActivityReq.requesterId === currentUser?.id || targetActivityReq.requester_id === currentUser?.id;
      return {
        type: 'request',
        title: targetActivityReq.title,
        meta: isOwner ? 'Your Help Request' : 'Committed Volunteer',
        details: `${targetActivityReq.peopleNeeded || 1} Needed • ${targetActivityReq.urgency ? targetActivityReq.urgency.toUpperCase() : 'MEDIUM'} Urgency`
      };
    }
    if (targetActivityEvt) {
      const isOrganizer = targetActivityEvt.organizer?.id === currentUser?.id || targetActivityEvt.organizerId === currentUser?.id || targetActivityEvt.organizer_id === currentUser?.id;
      return {
        type: 'event',
        title: targetActivityEvt.title,
        meta: isOrganizer ? 'Organizer / Host' : 'Attending Member',
        details: `${targetActivityEvt.date} • Max: ${targetActivityEvt.maxParticipants || 20}`
      };
    }
    return null;
  }, [targetActivityReq, targetActivityEvt, currentUser]);

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

  // Filter checks for current community or request/event if specified, otherwise show all
  const filteredChecks = useMemo(() => {
    if (readinessModalCheckId) {
      const target = readinessChecks.find(rc => rc.id === readinessModalCheckId);
      if (target) return [target, ...readinessChecks.filter(rc => rc.id !== readinessModalCheckId)];
    }
    if (readinessModalRequestId) {
      return readinessChecks.filter(rc => rc.requestId === readinessModalRequestId || rc.request_id === readinessModalRequestId);
    }
    if (readinessModalEventId) {
      return readinessChecks.filter(rc => rc.eventId === readinessModalEventId || rc.event_id === readinessModalEventId);
    }
    if (readinessModalCommunity?.id) {
      return readinessChecks.filter(rc => rc.communityId === readinessModalCommunity.id || !rc.communityId);
    }
    return readinessChecks;
  }, [readinessChecks, readinessModalCheckId, readinessModalRequestId, readinessModalEventId, readinessModalCommunity]);

  if (!isReadinessModalOpen) return null;

  const effectiveCheckId = selectedCheckId || readinessModalCheckId;
  const currentActiveCheck = effectiveCheckId 
    ? (readinessChecks.find(rc => rc.id === effectiveCheckId) || filteredChecks[0])
    : filteredChecks[0];

  // Check if current user has already responded to the selected check
  const myResponse = currentActiveCheck?.responses?.find(r => r.userId === currentUser?.id);

  const handleCreateCheck = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    let reqId = null;
    let evtId = null;
    let resolvedCommunityId = null;

    if (selectedActivityKey) {
      const [type, id] = selectedActivityKey.split(':');
      if (type === 'request') {
        reqId = id;
        const req = (requests || []).find(r => r.id === id);
        resolvedCommunityId = req?.communityId || null;
      } else if (type === 'event') {
        evtId = id;
        const evt = (events || []).find(e => e.id === id);
        resolvedCommunityId = evt?.communityId || null;
      }
    }

    const newCheck = await createReadinessCheck({
      title: title.trim(),
      requestId: reqId,
      eventId: evtId,
      communityId: resolvedCommunityId || readinessModalCommunity?.id || null,
      targetHeadcount: Number(targetHeadcount) || 5,
      shiftTime: shiftTime.trim(),
      notes: notes.trim()
    });

    if (showToast) {
      showToast('Member readiness check launched successfully!', 'success');
    }
    setUserTitle(null);
    setUserHeadcount(null);
    setUserShiftTime(null);
    setUserNotes(null);
    setUserSelectedActivityKey(null);
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
      className="readiness-modal-overlay animate-fade-in" 
      onClick={closeReadinessModal}
    >
      <div 
        className="readiness-modal-dialog animate-scale-in" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="readiness-modal-header border-bottom">
          <div className="d-flex align-center gap-3">
            <div className="readiness-header-icon">
              <UserCheck size={22} />
            </div>
            <div>
              <div className="d-flex align-center gap-2">
                <h3 className="font-bold text-md text-white mb-0">Member Readiness Checker</h3>
                <span className="badge readiness-header-badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', fontSize: '0.68rem' }}>
                  Creator & Dispatch Tool
                </span>
              </div>
              <p className="text-xs text-emerald-100 mb-0 readiness-header-desc" style={{ opacity: 0.9, fontSize: '0.78rem' }}>
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
              aria-label="Close readiness modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="readiness-modal-body">
          {isCreatingNew ? (
            /* Create New Readiness Check Form */
            <form 
              onSubmit={handleCreateCheck} 
              className="readiness-form-container"
            >
              <div className="d-flex align-center justify-between pb-2 border-bottom flex-wrap gap-1">
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
                  onChange={(e) => setUserTitle(e.target.value)}
                  required
                />
              </div>

              <div className="readiness-form-grid">
                <div>
                  <label className="form-label text-xs font-bold text-secondary mb-1 d-flex align-center justify-between">
                    <span>Participating Request or Event <span className="text-rose">*</span></span>
                    {(participatingRequests.length > 0 || participatingEvents.length > 0) && (
                      <span className="badge badge-primary text-xs" style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}>
                        {participatingRequests.length + participatingEvents.length} Active
                      </span>
                    )}
                  </label>
                  <SearchableActivityPicker
                    selectedActivityKey={selectedActivityKey}
                    onSelectActivity={handleSelectActivity}
                    participatingRequests={participatingRequests}
                    participatingEvents={participatingEvents}
                    otherRequests={otherRequests}
                    otherEvents={otherEvents}
                    currentUser={currentUser}
                  />

                  {selectedActivitySummary && (
                    <div 
                      className="p-1.5 rounded mt-1.5 text-xs d-flex align-center justify-between gap-1"
                      style={{ 
                        background: selectedActivitySummary.type === 'request' ? 'var(--amber-50)' : 'var(--primary-50)', 
                        border: `1px solid ${selectedActivitySummary.type === 'request' ? 'var(--amber-200)' : 'var(--primary-200)'}` 
                      }}
                    >
                      <div className="d-flex align-center gap-1.5 min-w-0">
                        {selectedActivitySummary.type === 'request' ? (
                          <HandHeart size={13} className="text-amber flex-shrink-0" />
                        ) : (
                          <Calendar size={13} className="text-brand flex-shrink-0" />
                        )}
                        <span className="text-truncate font-semibold text-primary" style={{ fontSize: '0.72rem' }}>
                          {selectedActivitySummary.title}
                        </span>
                      </div>
                      <span className="badge badge-secondary text-xs flex-shrink-0" style={{ fontSize: '0.62rem' }}>
                        {selectedActivitySummary.meta}
                      </span>
                    </div>
                  )}
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
                    onChange={(e) => setUserHeadcount(e.target.value)}
                    required
                  />
                  {selectedActivitySummary && (
                    <span className="text-xs text-muted d-block mt-1" style={{ fontSize: '0.7rem' }}>
                      {selectedActivitySummary.details}
                    </span>
                  )}
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
                  onChange={(e) => setUserShiftTime(e.target.value)}
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
                  onChange={(e) => setUserNotes(e.target.value)}
                />
              </div>

              <div className="d-flex align-center justify-end gap-2 pt-2 border-top mt-auto">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setUserTitle(null);
                    setUserHeadcount(null);
                    setUserShiftTime(null);
                    setUserNotes(null);
                    setUserSelectedActivityKey(null);
                    setIsCreatingNew(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm d-inline-flex align-center gap-1.5 font-bold"
                  style={{
                    background: !title.trim() ? '#cbd5e1' : 'var(--primary-600, #059669)',
                    borderColor: !title.trim() ? '#cbd5e1' : 'var(--primary-600, #059669)',
                    color: !title.trim() ? '#64748b' : '#ffffff',
                    cursor: !title.trim() ? 'not-allowed' : 'pointer',
                    boxShadow: !title.trim() ? 'none' : '0 2px 4px rgba(5, 150, 105, 0.25)',
                    padding: '0.45rem 1.1rem'
                  }}
                  disabled={!title.trim()}
                  title={!title.trim() ? 'Provide a title to launch' : 'Launch Ready Check'}
                >
                  <UserCheck size={15} />
                  <span>Launch Ready Check</span>
                </button>
              </div>
            </form>
          ) : (
            /* Active Readiness Checks Viewer & Responder */
            <div className="d-flex flex-1 overflow-hidden" style={{ minHeight: 0, width: '100%' }}>
              {/* Left Column: Checks List (Desktop >= 768px) */}
              <div className="readiness-sidebar d-flex flex-column">
                <div className="p-3 border-bottom font-bold text-xs text-muted text-uppercase" style={{ fontSize: '0.68rem' }}>
                  Readiness Checks ({filteredChecks.length})
                </div>

                {filteredChecks.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted">
                    No active readiness checks. Click &quot;New Check&quot; above to launch one.
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
                        <div className="d-flex align-center justify-between gap-1 text-muted" style={{ fontSize: '0.68rem' }}>
                          <div className="d-flex align-center gap-1">
                            <Users size={11} />
                            <span>{check.readyCount || 0} / {check.targetHeadcount || 5} Ready</span>
                          </div>
                          {(check.requestId || check.request_id) && (
                            <span className="badge badge-emerald" style={{ fontSize: '0.58rem', padding: '0.05rem 0.3rem' }}>Request</span>
                          )}
                          {(check.eventId || check.event_id) && (
                            <span className="badge badge-purple" style={{ fontSize: '0.58rem', padding: '0.05rem 0.3rem' }}>Event</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Column: Selected Check Details & Responder (100% width on mobile) */}
              <div className="readiness-detail-pane">
                {/* Mobile Check Selector: Shown only on mobile screens (< 768px) when multiple checks exist */}
                {filteredChecks.length > 1 && (
                  <div className="readiness-mobile-switcher card p-2.5 mb-1" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
                    <div className="d-flex align-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-muted text-uppercase" style={{ fontSize: '0.68rem' }}>
                        Select Check ({filteredChecks.length} available)
                      </span>
                      {currentActiveCheck && (
                        <span className={`badge text-xs ${currentActiveCheck.status === 'active' ? 'badge-primary' : 'badge-gray'}`} style={{ fontSize: '0.65rem' }}>
                          {currentActiveCheck.readyPercentage || 0}% Ready
                        </span>
                      )}
                    </div>
                    <select
                      className="form-input text-xs font-semibold"
                      style={{ background: '#ffffff' }}
                      value={currentActiveCheck?.id || ''}
                      onChange={(e) => setSelectedCheckId(e.target.value)}
                      aria-label="Select active readiness check"
                    >
                      {filteredChecks.map(check => (
                        <option key={check.id} value={check.id}>
                          {check.title} ({check.readyCount || 0}/{check.targetHeadcount || 5} Ready · {check.status === 'active' ? 'Active' : 'Closed'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {currentActiveCheck ? (
                  <>
                    {/* Header & Status Gauge */}
                    <div className="card p-3 d-flex flex-column gap-3" style={{ background: 'var(--bg-subtle)' }}>
                      <div className="d-flex align-center justify-between gap-2 flex-wrap">
                        <div>
                          <div className="d-flex align-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-primary mb-0">{currentActiveCheck.title}</h4>
                            <span className={`badge text-xs ${currentActiveCheck.status === 'active' ? 'badge-primary' : 'badge-gray'}`}>
                              {currentActiveCheck.status === 'active' ? 'Poll Open' : 'Closed'}
                            </span>
                            {(currentActiveCheck.requestId || currentActiveCheck.request_id) && (
                              <span className="badge badge-emerald text-xs font-semibold d-inline-flex align-center gap-1">
                                <HandHeart size={11} /> Help Request Roll Call
                              </span>
                            )}
                            {(currentActiveCheck.eventId || currentActiveCheck.event_id) && (
                              <span className="badge badge-purple text-xs font-semibold d-inline-flex align-center gap-1">
                                <Calendar size={11} /> Civic Event Roll Call
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
                        <div className="d-flex align-center justify-between mb-2 pb-1 border-bottom flex-wrap gap-1">
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
                          <div className="readiness-status-options">
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

                          <div className="readiness-inputs-row">
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
                  <div className="p-4 text-center text-muted my-auto card" style={{ background: 'var(--bg-subtle)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                    <h4 className="font-bold text-sm text-primary mb-1">No Active Readiness Checks</h4>
                    <p className="text-xs text-muted mb-3">
                      There are currently no active volunteer readiness polls for this community circle.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm d-inline-flex align-center gap-1.5"
                      style={{ background: 'var(--primary-600, #059669)', borderColor: 'var(--primary-600, #059669)', color: '#ffffff' }}
                      onClick={() => setIsCreatingNew(true)}
                    >
                      <Plus size={14} className="mr-1" />
                      Create New Readiness Check
                    </button>
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
