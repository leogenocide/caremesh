import { useState } from 'react';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  Users, 
  Globe, 
  Lock, 
  MapPin, 
  UserPlus, 
  Check, 
  Share2, 
  HandHeart, 
  Image, 
  FileText, 
  Shield, 
  MessageSquare,
  ShieldAlert,
  UserCheck,
  Camera,
  Trash2,
  AlertTriangle
} from 'lucide-react';

export const GroupCoverHeader = ({ community, activeTab, onTabChange }) => {
  const { currentUser, toggleJoinCommunity, openInviteModal, reports, openReadinessModal, requests, updateCommunity, deleteCommunity, showToast } = useCareMesh();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!community) return null;

  const isPlatformAdmin = Boolean(currentUser?.isAdmin);
  const isCreator = Boolean(
    (community.creatorId && community.creatorId === currentUser?.id) ||
    community.isCreator ||
    isPlatformAdmin
  );
  const isAdmin = Boolean(community.adminIds?.includes(currentUser?.id) || isPlatformAdmin);
  const isModerator = Boolean(community.moderatorIds?.includes(currentUser?.id) || isAdmin);
  const canModerate = isAdmin || isModerator;
  const isJoined = community.isJoined;

  const handleBannerUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      if (showToast) showToast('Cover image must be under 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        if (updateCommunity) {
          updateCommunity(community.id, { banner: dataUrl });
        }
        if (showToast) showToast('Community cover banner updated!', 'success');
      }
    };
    reader.onerror = () => {
      if (showToast) showToast('Failed to read image file.', 'error');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      if (showToast) showToast('Avatar image must be under 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        if (updateCommunity) {
          updateCommunity(community.id, { avatar: dataUrl });
        }
        if (showToast) showToast('Community logo updated!', 'success');
      }
    };
    reader.onerror = () => {
      if (showToast) showToast('Failed to read image file.', 'error');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const pendingReportsCount = (reports || []).filter(
    r => (r.communityId === community.id || !r.communityId) && r.status === 'pending'
  ).length;

  const groupRequests = (requests || []).filter(r => 
    community.linkedRequestIds?.includes(r.id) || r.communityId === community.id
  );
  const visibleRequestsCount = groupRequests.filter(r => {
    if (r.visibility === 'group_only' && !isJoined && !isAdmin && r.requester?.id !== currentUser?.id) {
      return false;
    }
    return true;
  }).length;

  const tabs = [
    { id: 'discussion', label: 'Discussion', icon: <MessageSquare size={15} /> },
    { id: 'about', label: 'About & Rules', icon: <FileText size={15} /> },
    { 
      id: 'requests', 
      label: 'Help Requests', 
      icon: <HandHeart size={15} />, 
      count: visibleRequestsCount 
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
    },
    ...(canModerate ? [{
      id: 'moderation',
      label: 'Moderation',
      icon: <ShieldAlert size={15} />,
      count: pendingReportsCount
    }] : [])
  ];

  return (
    <div className="card p-0 mb-3" style={{ overflow: 'hidden', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)' }}>
      {/* 1. High-Impact Hero Cover Banner */}
      <div 
        className="group-hero-cover"
        style={{
          position: 'relative',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          overflow: 'hidden'
        }}
      >
        <img
          src={community.banner}
          alt={community.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.95 }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(15, 23, 42, 0.7) 0%, rgba(15, 23, 42, 0.1) 60%, transparent 100%)'
          }}
        />

        <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge" style={{ background: 'rgba(0,0,0,0.65)', color: '#ffffff', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.25)', fontSize: '0.7rem' }}>
            {community.category?.toUpperCase() || 'COMMUNITY'}
          </span>
        </div>

        {/* Community Admin Cover Photo Upload Button */}
        {isAdmin && (
          <div style={{ position: 'absolute', bottom: '12px', right: '12px', zIndex: 10 }}>
            <label 
              className="btn btn-sm text-xs font-semibold cursor-pointer d-flex align-center gap-1.5"
              style={{ 
                background: 'rgba(0, 0, 0, 0.72)', 
                color: '#ffffff', 
                backdropFilter: 'blur(8px)', 
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                margin: 0
              }}
              title="Upload new cover banner"
            >
              <Camera size={14} />
              <span className="d-none d-sm-inline">Change Cover</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        )}
      </div>

      {/* 2. Group Header & Actions Bar (Cleanly below the hero banner, zero text overlap) */}
      <div className="p-3 p-md-4" style={{ background: '#ffffff', position: 'relative' }}>
        <div 
          className="d-flex align-items-start justify-between flex-wrap gap-3"
          style={{ marginBottom: '14px' }}
        >
          {/* Avatar and Main Titles */}
          <div className="d-flex align-items-end gap-3 flex-wrap min-w-0 flex-1">
            <div className="group-avatar-box">
              <img
                src={community.avatar}
                alt={community.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'calc(var(--radius-xl) - 4px)' }}
              />
              {isAdmin && (
                <label
                  style={{
                    position: 'absolute',
                    bottom: '-4px',
                    right: '-4px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--primary-600)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    border: '2px solid #ffffff'
                  }}
                  title="Upload new community avatar"
                >
                  <Camera size={11} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>

            <div className="min-w-0 flex-1 pt-1">
              <div className="d-flex align-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-primary" style={{ letterSpacing: '-0.02em', margin: 0, lineHeight: 1.25 }}>
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
                  <MapPin size={12} /> {typeof community.location === 'object' ? community.location?.address : community.location}
                </span>
              </div>
            </div>
          </div>

          {/* Group Action Buttons */}
          <div className="group-cover-actions">
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
              className="btn btn-secondary btn-sm d-flex align-center gap-1"
              onClick={() => openReadinessModal(community)}
              title="Open Member Readiness Checker"
            >
              <UserCheck size={14} className="text-brand" />
              <span>Readiness</span>
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

            {isCreator && (
              <button
                type="button"
                className="btn btn-ghost btn-sm text-rose d-flex align-center gap-1"
                onClick={() => setIsDeleteModalOpen(true)}
                title="Permanently delete this community circle"
                style={{ color: 'var(--rose-600)' }}
              >
                <Trash2 size={14} />
                <span className="d-none d-sm-inline">Delete Circle</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Facebook Groups Sub-Navigation Tabs */}
        <div 
          className="touch-tab-nav border-top pt-2" 
          style={{ borderTop: '1px solid var(--border-light)' }}
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

      {/* Delete Community Confirmation Modal */}
      {isDeleteModalOpen && (
        <div 
          className="modal-overlay d-flex align-center justify-center p-3" 
          style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}
          onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
        >
          <div 
            className="modal-content card p-4 animate-scale-in" 
            style={{ maxWidth: '440px', width: '100%', background: '#ffffff' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-center gap-2 mb-3 text-rose">
              <AlertTriangle size={22} />
              <h3 className="font-bold text-md text-primary mb-0">Delete Community Circle?</h3>
            </div>
            <p className="text-xs text-secondary mb-3" style={{ lineHeight: '1.55' }}>
              Are you sure you want to permanently delete <strong>{community.name}</strong> ({community.handle})?
            </p>
            <div className="p-3 rounded mb-3 text-xs" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
              <p className="mb-1 font-semibold">⚠️ This action is permanent and cannot be undone:</p>
              <ul className="mb-0 pl-3">
                <li>All posts, poll votes, comments, and discussions in this circle will be deleted.</li>
                <li>All shared media files, photos, and group rules will be wiped.</li>
                <li>All membership roles, elections, and readiness checks will be removed.</li>
              </ul>
            </div>
            <div className="d-flex justify-end gap-2 pt-2 border-top">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm d-flex align-center gap-1.5"
                style={{ background: 'var(--rose-600)', color: '#ffffff' }}
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await deleteCommunity(community.id);
                    setIsDeleteModalOpen(false);
                  } catch (err) {
                    showToast?.(err.message || 'Failed to delete community circle.', 'error');
                  } finally {
                    setIsDeleting(false);
                  }
                }}
              >
                <Trash2 size={14} />
                <span>{isDeleting ? 'Deleting...' : 'Permanently Delete Circle'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
