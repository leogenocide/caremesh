import { useCareMesh } from '../../context/useCareMesh';
import { 
  Users, 
  Globe, 
  Lock, 
  MapPin, 
  UserPlus, 
  Check, 
  Share2, 
  Calendar, 
  Image, 
  FileText, 
  Shield, 
  MessageSquare
} from 'lucide-react';

export const GroupCoverHeader = ({ community, activeTab, onTabChange }) => {
  const { currentUser, toggleJoinCommunity, openInviteModal } = useCareMesh();

  if (!community) return null;

  const isAdmin = community.adminIds?.includes(currentUser.id);
  const isJoined = community.isJoined;

  const tabs = [
    { id: 'discussion', label: 'Discussion', icon: <MessageSquare size={15} /> },
    { id: 'about', label: 'About & Rules', icon: <FileText size={15} /> },
    { 
      id: 'events', 
      label: 'Workdays & Events', 
      icon: <Calendar size={15} />, 
      count: community.linkedEventIds?.length || 0 
    },
    { 
      id: 'media', 
      label: 'Media & Files', 
      icon: <Image size={15} />, 
      count: (community.mediaGallery?.length || 0) + (community.files?.length || 0) 
    },
    { 
      id: 'members', 
      label: 'Members', 
      icon: <Users size={15} />, 
      count: community.memberCount 
    }
  ];

  return (
    <div className="card p-0 mb-3" style={{ overflow: 'hidden', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)' }}>
      {/* 1. High-Impact Hero Cover Banner */}
      <div 
        className="group-hero-cover"
        style={{
          height: '180px',
          position: 'relative',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          overflow: 'hidden'
        }}
      >
        <img
          src={community.banner}
          alt={community.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0.15) 60%, transparent 100%)'
          }}
        />

        <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
          <span className="badge" style={{ background: 'rgba(0,0,0,0.65)', color: '#ffffff', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.25)', fontSize: '0.7rem' }}>
            {community.category?.toUpperCase() || 'COMMUNITY'}
          </span>
        </div>
      </div>

      {/* 2. Overlapping Group Header & Actions Bar */}
      <div className="p-3 p-md-4" style={{ background: '#ffffff', position: 'relative' }}>
        <div 
          className="d-flex align-center justify-between flex-wrap gap-3"
          style={{ marginTop: '-44px', marginBottom: '14px' }}
        >
          {/* Avatar and Main Titles */}
          <div className="d-flex align-center gap-3 flex-wrap min-w-0 flex-1">
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                border: '3px solid #ffffff',
                boxShadow: 'var(--shadow-md)',
                background: '#ffffff',
                flexShrink: 0
              }}
            >
              <img
                src={community.avatar}
                alt={community.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="d-flex align-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-primary" style={{ letterSpacing: '-0.02em', margin: 0 }}>
                  {community.name}
                </h1>
                {isAdmin && (
                  <span className="badge badge-primary text-xs font-bold d-flex align-center gap-1">
                    <Shield size={12} /> Admin
                  </span>
                )}
              </div>

              <div className="d-flex align-center gap-2 text-xs text-muted mt-1 flex-wrap">
                <span className="font-semibold text-brand">{community.handle}</span>
                <span>•</span>
                <span className="d-flex align-center gap-1">
                  {community.privacy === 'private' ? <Lock size={12} /> : <Globe size={12} />}
                  <span>{community.privacy === 'private' ? 'Private' : 'Public'} Group ({community.memberCount} neighbors)</span>
                </span>
                <span>•</span>
                <span className="d-flex align-center gap-1">
                  <MapPin size={12} /> {community.location}
                </span>
              </div>
            </div>
          </div>

          {/* Group Action Buttons */}
          <div className="d-flex align-center gap-2 flex-wrap flex-shrink-0">
            <button
              className={`btn btn-sm ${isJoined ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => toggleJoinCommunity(community.id)}
            >
              {isJoined ? (
                <>
                  <Check size={14} className="text-brand font-bold" />
                  <span>Joined</span>
                </>
              ) : (
                <>
                  <UserPlus size={14} />
                  <span>Join Group</span>
                </>
              )}
            </button>

            <button
              className="btn btn-primary btn-sm"
              onClick={() => openInviteModal(community)}
            >
              <UserPlus size={14} />
              <span>+ Invite</span>
            </button>

            <button
              className="btn btn-secondary btn-sm btn-icon"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                alert(`Group link copied to clipboard: ${community.name}`);
              }}
              title="Share Group"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>

        {/* 3. Facebook Groups Sub-Navigation Tabs */}
        <div 
          className="touch-scroll-x gap-1 border-top pt-2" 
          style={{ borderTop: '1px solid var(--border-light)', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
        >
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  borderRadius: 'var(--radius-md)',
                  fontWeight: isActive ? 700 : 500,
                  flexShrink: 0
                }}
                onClick={() => onTabChange(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span 
                    className="badge" 
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--bg-muted)',
                      color: isActive ? '#ffffff' : 'var(--text-secondary)',
                      fontSize: '0.7rem',
                      padding: '0.1rem 0.4rem'
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
