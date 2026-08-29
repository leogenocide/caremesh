import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  Search, 
  Bell, 
  Plus, 
  Sparkles, 
  Eye, 
  HandHeart, 
  Package, 
  Calendar, 
  Target, 
  ShieldAlert, 
  X, 
  ExternalLink, 
  ChevronDown,
  Users,
  TrendingUp
} from 'lucide-react';

export const Navbar = () => {
  const navigate = useNavigate();
  const {
    navigateTo,
    searchQuery,
    setSearchQuery,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    openCreateModal,
    currentUser,
    observations,
    requests,
    resources,
    plans,
    communities
  } = useCareMesh();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const notifRef = useRef(null);
  const createMenuRef = useRef(null);
  const searchRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
      if (createMenuRef.current && !createMenuRef.current.contains(e.target)) {
        setIsCreateMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search results preview
  const searchResults = searchQuery.trim() ? [
    ...(requests || []).filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase())).map(r => ({ ...r, entityType: 'request' })),
    ...(resources || []).filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase())).map(r => ({ ...r, entityType: 'resource' })),
    ...(observations || []).filter(o => o.title.toLowerCase().includes(searchQuery.toLowerCase())).map(o => ({ ...o, entityType: 'observation' })),
    ...(plans || []).filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase())).map(p => ({ ...p, entityType: 'plan' })),
    ...(communities || []).filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(c => ({ ...c, title: c.name, entityType: 'community' }))
  ].slice(0, 6) : [];

  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);

  return (
    <header className="app-navbar">
      {/* Brand / Logo (Hidden on mobile when search is actively expanded) */}
      <div className={`d-flex align-center gap-2 flex-shrink-0 ${isMobileSearchActive ? 'd-none d-md-flex' : ''}`}>
        <div 
          className="d-flex align-center gap-2 cursor-pointer tap-active" 
          onClick={() => {
            navigate('/');
            navigateTo('home');
          }}
        >
          <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'var(--primary-600)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)', flexShrink: 0 }}>
            <Sparkles size={17} />
          </div>
          <div className="d-flex align-center gap-1">
            <span className="font-bold text-md text-primary" style={{ letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>CareMesh</span>
            <span className="badge badge-primary text-xs d-none d-sm-inline" style={{ padding: '0.1rem 0.35rem', fontSize: '0.6rem' }}>PROTOTYPE</span>
          </div>
        </div>
      </div>

      {/* Global Search Bar (Desktop Always-On, Mobile Expandable) */}
      <div 
        ref={searchRef} 
        style={{ 
          position: isMobileSearchActive ? 'absolute' : 'relative',
          left: isMobileSearchActive ? '0.5rem' : 'auto',
          right: isMobileSearchActive ? '0.5rem' : 'auto',
          width: isMobileSearchActive ? 'calc(100% - 1rem)' : '100%', 
          maxWidth: isMobileSearchActive ? '100%' : '380px', 
          margin: isMobileSearchActive ? '0' : '0 0.5rem',
          zIndex: isMobileSearchActive ? 120 : 'auto'
        }}
        className={`${!isMobileSearchActive ? 'd-none d-md-block' : ''}`}
      >
        <div className="d-flex align-center" style={{ position: 'relative' }}>
          <Search size={16} className="text-muted" style={{ position: 'absolute', left: '12px' }} />
          <input
            type="text"
            placeholder="Search needs, resources, plans, places..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            autoFocus={isMobileSearchActive}
            className="form-input"
            style={{ paddingLeft: '36px', paddingRight: '36px', height: '36px', borderRadius: 'var(--radius-full)', background: 'var(--bg-muted)', fontSize: '0.85rem' }}
          />
          <button 
            type="button" 
            className="text-muted" 
            onClick={() => {
              setSearchQuery('');
              if (isMobileSearchActive) setIsMobileSearchActive(false);
            }}
            style={{ position: 'absolute', right: '10px', padding: '4px' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Live Search Autocomplete & Recommendations Dropdown */}
        {isSearchFocused && (
          <div 
            className="dropdown-card p-0 animate-fade-in" 
            style={{ 
              top: '42px', 
              left: 0, 
              right: 0, 
              width: '100%',
              maxHeight: '380px',
              overflowY: 'auto'
            }}
          >
            {/* Case A: User has NOT typed yet -> Show Category Shortcuts & Recommended Searches */}
            {!searchQuery.trim() ? (
              <div className="p-3">
                {/* 1. Quick Category Chips */}
                <div className="mb-3">
                  <span className="text-xs font-bold text-muted text-uppercase d-block mb-2" style={{ letterSpacing: '0.04em' }}>
                    Quick Categories
                  </span>
                  <div className="d-flex align-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs d-flex align-center gap-1"
                      style={{ fontSize: '0.75rem', borderRadius: 'var(--radius-full)', padding: '0.25rem 0.6rem' }}
                      onMouseDown={() => {
                        navigate('/collaborate');
                        navigateTo('collaborate', 'requests');
                        setIsSearchFocused(false);
                        setIsMobileSearchActive(false);
                      }}
                    >
                      <HandHeart size={12} className="text-amber" />
                      <span>Needs</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs d-flex align-center gap-1"
                      style={{ fontSize: '0.75rem', borderRadius: 'var(--radius-full)', padding: '0.25rem 0.6rem' }}
                      onMouseDown={() => {
                        navigate('/plans');
                        navigateTo('plans');
                        setIsSearchFocused(false);
                        setIsMobileSearchActive(false);
                      }}
                    >
                      <Target size={12} className="text-blue-600" />
                      <span>Plans</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs d-flex align-center gap-1"
                      style={{ fontSize: '0.75rem', borderRadius: 'var(--radius-full)', padding: '0.25rem 0.6rem' }}
                      onMouseDown={() => {
                        navigate('/explore');
                        navigateTo('explore');
                        setIsSearchFocused(false);
                        setIsMobileSearchActive(false);
                      }}
                    >
                      <Eye size={12} className="text-brand" />
                      <span>Observations</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs d-flex align-center gap-1"
                      style={{ fontSize: '0.75rem', borderRadius: 'var(--radius-full)', padding: '0.25rem 0.6rem' }}
                      onMouseDown={() => {
                        navigate('/social');
                        navigateTo('social', 'communities');
                        setIsSearchFocused(false);
                        setIsMobileSearchActive(false);
                      }}
                    >
                      <Users size={12} className="text-purple-600" />
                      <span>Circles</span>
                    </button>
                  </div>
                </div>

                {/* 2. Recommended / Trending Searches */}
                <div>
                  <span className="text-xs font-bold text-muted text-uppercase d-flex align-center gap-1 mb-2" style={{ letterSpacing: '0.04em' }}>
                    <TrendingUp size={12} className="text-brand" /> Recommended & Urgent Items
                  </span>
                  <div className="d-flex flex-column gap-1">
                    {[
                      { id: 'obs_01', type: 'observation', title: 'Severe Silt & Debris Jam at Elm Street Creek Culvert', category: 'Field Observation • High Turbidity' },
                      { id: 'req_04', type: 'request', title: 'Need AWD / 4WD Vehicle to Transport 4 Seniors', category: 'Urgent Help Need • Pine Crest' },
                      { id: 'plan_01', type: 'plan', title: 'Willow Creek Ecological Flood Mitigation Project', category: 'Long-Term Plan • Active' },
                      { id: 'com_01', type: 'community', title: 'Willow Creek Watershed Alliance', category: 'Community Circle • 142 neighbors' }
                    ].map(rec => (
                      <div
                        key={rec.id}
                        className="d-flex align-center justify-between p-2 rounded cursor-pointer card-interactive"
                        style={{ borderRadius: 'var(--radius-md)' }}
                        onMouseDown={() => {
                          if (rec.type === 'request') {
                            navigate(`/requests/${rec.id}`);
                            navigateTo('collaborate', 'requests', rec.id);
                          } else if (rec.type === 'plan') {
                            navigate(`/plans/${rec.id}`);
                            navigateTo('plans', null, rec.id);
                          } else if (rec.type === 'community') {
                            navigate('/social');
                            navigateTo('social', 'communities');
                          } else {
                            navigate(`/observations/${rec.id}`);
                            navigateTo('explore', null, rec.id);
                          }
                          setIsSearchFocused(false);
                          setIsMobileSearchActive(false);
                        }}
                      >
                        <div className="d-flex align-center gap-2.5 min-w-0">
                          <div 
                            style={{ 
                              width: '26px', 
                              height: '26px', 
                              borderRadius: 'var(--radius-sm)', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              background: rec.type === 'request' ? 'var(--amber-100)' : rec.type === 'plan' ? 'var(--blue-100)' : rec.type === 'community' ? 'var(--purple-100)' : 'var(--primary-100)',
                              flexShrink: 0
                            }}
                          >
                            {rec.type === 'request' && <HandHeart size={13} className="text-amber" />}
                            {rec.type === 'plan' && <Target size={13} className="text-blue-600" />}
                            {rec.type === 'community' && <Users size={13} className="text-purple-600" />}
                            {rec.type === 'observation' && <Eye size={13} className="text-brand" />}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-primary text-truncate">{rec.title}</div>
                            <div className="text-muted" style={{ fontSize: '0.68rem' }}>{rec.category}</div>
                          </div>
                        </div>
                        <ExternalLink size={12} className="text-muted flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Case B: User is typing -> Show Grouped Matching Search Results */
              <div className="p-2">
                <div className="text-xs font-bold text-muted p-2 border-bottom">
                  Search Results ({searchResults.length})
                </div>
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted">
                    <Search size={22} className="text-muted mb-1 d-block mx-auto opacity-50" />
                    No matching items found for "{searchQuery}".
                  </div>
                ) : (
                  searchResults.map(item => (
                    <div
                      key={item.id}
                      className="d-flex align-center justify-between p-2 rounded cursor-pointer card-interactive"
                      style={{ borderRadius: 'var(--radius-md)', margin: '2px 0' }}
                      onMouseDown={() => {
                        if (item.entityType === 'request') {
                          navigate(`/requests/${item.id}`);
                          navigateTo('collaborate', 'requests', item.id);
                        } else if (item.entityType === 'resource') {
                          navigate(`/resources/${item.id}`);
                          navigateTo('collaborate', 'resources', item.id);
                        } else if (item.entityType === 'plan') {
                          navigate(`/plans/${item.id}`);
                          navigateTo('plans', null, item.id);
                        } else if (item.entityType === 'community') {
                          navigate('/social');
                          navigateTo('social', 'communities');
                        } else {
                          navigate(`/observations/${item.id}`);
                          navigateTo('explore', null, item.id);
                        }
                        setIsSearchFocused(false);
                        setIsMobileSearchActive(false);
                        setSearchQuery('');
                      }}
                    >
                      <div className="d-flex align-center gap-2.5 min-w-0 flex-1">
                        <div 
                          style={{ 
                            width: '26px', 
                            height: '26px', 
                            borderRadius: 'var(--radius-sm)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            background: item.entityType === 'request' ? 'var(--amber-100)' : item.entityType === 'plan' ? 'var(--blue-100)' : item.entityType === 'community' ? 'var(--purple-100)' : item.entityType === 'resource' ? '#f3e8ff' : 'var(--primary-100)',
                            flexShrink: 0
                          }}
                        >
                          {item.entityType === 'request' && <HandHeart size={13} className="text-amber" />}
                          {item.entityType === 'plan' && <Target size={13} className="text-blue-600" />}
                          {item.entityType === 'resource' && <Package size={13} style={{ color: '#7e22ce' }} />}
                          {item.entityType === 'community' && <Users size={13} className="text-purple-600" />}
                          {item.entityType === 'observation' && <Eye size={13} className="text-brand" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-xs text-primary text-truncate">{item.title}</div>
                          <div className="text-muted text-truncate" style={{ fontSize: '0.68rem' }}>
                            <span className="text-capitalize">{item.entityType}</span>
                            {item.location?.address ? ` • ${item.location.address}` : ''}
                            {item.category ? ` • ${item.category}` : ''}
                          </div>
                        </div>
                      </div>
                      <ExternalLink size={12} className="text-muted flex-shrink-0" />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls: Search Trigger (Mobile), Create Dropdown, Notifications, Profile */}
      <div className={`d-flex align-center gap-1 gap-sm-2 flex-shrink-0 ${isMobileSearchActive ? 'd-none' : ''}`}>
        {/* Mobile Search Button Trigger */}
        <button
          type="button"
          className="btn-icon d-flex d-md-none text-secondary"
          style={{ width: '34px', height: '34px', minWidth: '34px' }}
          onClick={() => setIsMobileSearchActive(true)}
          aria-label="Open search"
        >
          <Search size={17} />
        </button>

        {/* Create + Dropdown */}
        <div ref={createMenuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-center gap-1"
            style={{ padding: '0.35rem 0.55rem', height: '34px' }}
            onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
            title="Create coordination item"
          >
            <Plus size={16} />
            <span className="d-none d-sm-inline">Create</span>
            <ChevronDown size={13} className="d-none d-sm-inline" />
          </button>

          {isCreateMenuOpen && (
            <div 
              className="dropdown-card p-2 animate-fade-in"
              style={{
                top: '42px',
                right: 0,
                width: '230px',
                maxWidth: 'calc(100vw - 20px)'
              }}
            >
              <div className="text-xs font-bold text-muted p-2 border-bottom">Log Entry</div>
              
              <button
                type="button"
                className="dropdown-item w-100 text-left d-flex align-center gap-2"
                onClick={() => {
                  openCreateModal('observation');
                  setIsCreateMenuOpen(false);
                }}
              >
                <Eye size={15} className="text-brand" />
                <span>Log Observation</span>
              </button>

              <button
                type="button"
                className="dropdown-item w-100 text-left d-flex align-center gap-2"
                onClick={() => {
                  openCreateModal('request');
                  setIsCreateMenuOpen(false);
                }}
              >
                <HandHeart size={15} className="text-amber" />
                <span>Request Help / Labor</span>
              </button>

              <button
                type="button"
                className="dropdown-item w-100 text-left d-flex align-center gap-2"
                onClick={() => {
                  openCreateModal('resource');
                  setIsCreateMenuOpen(false);
                }}
              >
                <Package size={15} className="text-brand" />
                <span>Offer Resource / Skill</span>
              </button>

              <button
                type="button"
                className="dropdown-item w-100 text-left d-flex align-center gap-2"
                onClick={() => {
                  openCreateModal('event');
                  setIsCreateMenuOpen(false);
                }}
              >
                <Calendar size={15} className="text-purple" />
                <span>Schedule Workday / Event</span>
              </button>

              <button
                type="button"
                className="dropdown-item w-100 text-left d-flex align-center gap-2"
                onClick={() => {
                  openCreateModal('plan');
                  setIsCreateMenuOpen(false);
                }}
              >
                <Target size={15} className="text-blue-600" />
                <span>Initiate Long-term Plan</span>
              </button>

              <button
                type="button"
                className="dropdown-item w-100 text-left d-flex align-center gap-2"
                onClick={() => {
                  openCreateModal('safety');
                  setIsCreateMenuOpen(false);
                }}
              >
                <ShieldAlert size={15} className="text-rose" />
                <span>Post Safety Hazard</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Icon with Badge */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            style={{ position: 'relative', width: '34px', height: '34px', minWidth: '34px' }}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span 
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--rose-500)'
                }}
              />
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotifOpen && (
            <div
              className="dropdown-card p-0 animate-fade-in"
              style={{
                top: '44px',
                right: 0,
                width: '360px',
                maxWidth: 'calc(100vw - 20px)'
              }}
            >
              <div className="p-3 border-bottom d-flex align-center justify-between" style={{ background: 'var(--bg-subtle)' }}>
                <div className="d-flex align-center gap-2">
                  <span className="font-bold text-xs text-primary">Coordination Notices</span>
                  {unreadCount > 0 && (
                    <span className="badge badge-primary text-xs" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs text-brand text-xs p-0 font-semibold"
                    onClick={markAllNotificationsRead}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted">
                    <Bell size={20} className="text-muted mb-1 d-block mx-auto opacity-50" />
                    No notices at this time.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className="p-3 border-bottom cursor-pointer card-interactive"
                      style={{
                        background: n.isRead ? '#ffffff' : 'rgba(238, 242, 255, 0.65)',
                        borderBottom: '1px solid var(--border-light)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.targetView === 'collaborate') navigate('/collaborate');
                        else if (n.targetView === 'plans') navigate('/plans');
                        else if (n.targetView === 'social') navigate('/social');
                        else navigate('/explore');
                        navigateTo(n.targetView, n.targetSubTab, n.targetEntityId);
                        setIsNotifOpen(false);
                      }}
                    >
                      <div className="d-flex align-start gap-2.5 min-w-0">
                        <div 
                          style={{ 
                            width: '28px', 
                            height: '28px', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            background: n.type === 'safety_alert' ? 'rgba(225, 29, 72, 0.1)' : n.type === 'resource_match' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                            flexShrink: 0,
                            marginTop: '2px'
                          }}
                        >
                          {n.type === 'safety_alert' && <ShieldAlert size={14} className="text-rose" />}
                          {n.type === 'resource_match' && <HandHeart size={14} className="text-brand" />}
                          {n.type !== 'safety_alert' && n.type !== 'resource_match' && <Sparkles size={14} className="text-blue-600" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="d-flex align-center justify-between gap-1 mb-0.5">
                            <span className="font-bold text-xs text-primary text-truncate">{n.title}</span>
                            <span className="text-muted flex-shrink-0" style={{ fontSize: '0.65rem' }}>{n.timestamp}</span>
                          </div>
                          <p className="text-xs text-secondary mb-0" style={{ lineHeight: '1.4', fontSize: '0.78rem' }}>
                            {n.body}
                          </p>
                        </div>

                        {!n.isRead && (
                          <span 
                            style={{ 
                              width: '6px', 
                              height: '6px', 
                              borderRadius: '50%', 
                              background: 'var(--primary-600)', 
                              flexShrink: 0,
                              marginTop: '6px'
                            }} 
                          />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar / Quick Link */}
        <div 
          className="d-flex align-center gap-2 cursor-pointer flex-shrink-0"
          onClick={() => {
            navigate('/profile');
            navigateTo('profile');
          }}
          style={{ cursor: 'pointer', flexShrink: 0 }}
          title={`Signed in as ${currentUser.name}`}
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--primary-500)', flexShrink: 0 }}
          />
        </div>
      </div>
    </header>
  );
};
