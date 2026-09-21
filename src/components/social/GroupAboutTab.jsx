import { useState } from 'react';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  Globe, 
  Lock, 
  MapPin, 
  Calendar, 
  Shield, 
  CheckCircle2, 
  History,
  Trash2,
  AlertTriangle
} from 'lucide-react';

export const GroupAboutTab = ({ community }) => {
  const { mockUsers, currentUser, deleteCommunity, showToast } = useCareMesh();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!community) return null;

  const userMap = new Map();
  (mockUsers || []).forEach(u => {
    if (u?.id) userMap.set(u.id, u);
  });
  if (currentUser?.id) {
    userMap.set(currentUser.id, currentUser);
  }

  const adminIds = new Set(community.adminIds || []);
  const modIds = new Set(community.moderatorIds || []);

  const admins = Array.from(adminIds).map(id => userMap.get(id)).filter(Boolean);
  const moderators = Array.from(modIds)
    .filter(id => !adminIds.has(id))
    .map(id => userMap.get(id))
    .filter(Boolean);

  const isPlatformAdmin = Boolean(currentUser?.isAdmin);
  const isCreator = Boolean(
    (community.creatorId && community.creatorId === currentUser?.id) ||
    community.isCreator ||
    isPlatformAdmin
  );

  return (
    <div className="d-flex flex-column gap-4">
      {/* 1. About Group Overview */}
      <div className="card p-4">
        <h3 className="text-md font-bold text-primary mb-2">About This Group</h3>
        <p className="text-xs text-secondary mb-4" style={{ lineHeight: '1.55', fontSize: '0.85rem' }}>
          {community.description}
        </p>

        <div className="grid-2 gap-3 pt-3 border-top">
          <div className="d-flex align-start gap-3">
            {community.privacy === 'private' ? (
              <Lock size={18} className="text-primary mt-1" />
            ) : (
              <Globe size={18} className="text-primary mt-1" />
            )}
            <div>
              <span className="font-bold text-xs text-primary d-block">
                {community.privacy === 'private' ? 'Private Neighborhood Group' : 'Public Community Group'}
              </span>
              <span className="text-xs text-muted">
                {community.privacy === 'private'
                  ? 'Only joined members can see who is in the group and what they post.'
                  : 'Anyone in the neighborhood can see who is in the group and what they post.'}
              </span>
            </div>
          </div>

          <div className="d-flex align-start gap-3">
            <History size={18} className="text-primary mt-1" />
            <div>
              <span className="font-bold text-xs text-primary d-block">Group History</span>
              <span className="text-xs text-muted">{community.createdDate || 'Active Community Group'}</span>
            </div>
          </div>

          <div className="d-flex align-start gap-3">
            <MapPin size={18} className="text-primary mt-1" />
            <div>
              <span className="font-bold text-xs text-primary d-block">Geographic Scope</span>
              <span className="text-xs text-muted">
                {typeof community.location === 'object' ? community.location?.address : community.location}
              </span>
            </div>
          </div>

          <div className="d-flex align-start gap-3">
            <Calendar size={18} className="text-primary mt-1" />
            <div>
              <span className="font-bold text-xs text-primary d-block">Community Category</span>
              <span className="text-xs text-muted text-capitalize">{community.category?.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Structured Community Rules */}
      <div className="card p-4">
        <div className="d-flex align-center justify-between mb-3 pb-2 border-bottom">
          <div>
            <h3 className="text-md font-bold text-primary">Group Rules from the Admins</h3>
            <p className="text-xs text-muted mb-0">Community agreements for productive coordination and safety</p>
          </div>
          <span className="badge badge-primary text-xs font-semibold">
            {community.rules?.length || 0} Rules
          </span>
        </div>

        {community.rules && community.rules.length > 0 ? (
          <div className="d-flex flex-column gap-3">
            {community.rules.map((rule, idx) => (
              <div 
                key={rule.id || idx}
                className="p-3 rounded"
                style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}
              >
                <span className="font-bold text-xs text-primary d-flex align-center gap-2 mb-1">
                  <CheckCircle2 size={14} className="text-brand" />
                  <span>{idx + 1}. {rule.title}</span>
                </span>
                <p className="text-xs text-secondary mb-0" style={{ paddingLeft: '1.4rem' }}>
                  {rule.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted italic">No custom rules configured for this group.</p>
        )}
      </div>

      {/* 3. Admins & Moderators Directory */}
      <div className="card p-4">
        <h3 className="text-md font-bold text-primary mb-3 pb-2 border-bottom">
          Admins & Moderation Team ({admins.length + moderators.length})
        </h3>

        <div className="grid-2 gap-3">
          {admins.map(adm => (
            <div 
              key={adm.id}
              className="d-flex align-center gap-3 p-2 rounded"
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}
            >
              <img
                src={adm.avatar}
                alt={adm.name}
                style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div className="min-w-0 flex-1">
                <div className="d-flex align-center gap-1">
                  <span className="font-bold text-xs text-primary text-truncate">{adm.name}</span>
                  <span className="badge badge-primary text-xs font-bold" style={{ fontSize: '0.65rem' }}>
                    <Shield size={10} /> Admin
                  </span>
                </div>
                <span className="text-xs text-muted d-block text-truncate">{adm.role}</span>
              </div>
            </div>
          ))}

          {moderators.map(mod => (
            <div 
              key={mod.id}
              className="d-flex align-center gap-3 p-2 rounded"
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}
            >
              <img
                src={mod.avatar}
                alt={mod.name}
                style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div className="min-w-0 flex-1">
                <div className="d-flex align-center gap-1">
                  <span className="font-bold text-xs text-primary text-truncate">{mod.name}</span>
                  <span className="badge badge-gray text-xs font-semibold" style={{ fontSize: '0.65rem' }}>
                    Moderator
                  </span>
                </div>
                <span className="text-xs text-muted d-block text-truncate">{mod.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Danger Zone: Creator Delete Community */}
      {isCreator && (
        <div className="card p-4" style={{ border: '1px solid #fecaca', background: '#fffafb' }}>
          <div className="d-flex align-center justify-between flex-wrap gap-3">
            <div>
              <div className="d-flex align-center gap-2 text-rose mb-1">
                <Trash2 size={16} />
                <h3 className="text-md font-bold text-primary mb-0">Danger Zone: Delete Community Circle</h3>
              </div>
              <p className="text-xs text-secondary mb-0" style={{ maxWidth: '520px' }}>
                Permanently delete <strong>{community.name}</strong>. All posts, comments, photos, documents, and membership roles in this circle will be destroyed. This cannot be undone.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-danger btn-sm d-flex align-center gap-1.5"
              style={{ background: 'var(--rose-600)', color: '#ffffff' }}
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <Trash2 size={14} />
              <span>Delete This Circle</span>
            </button>
          </div>
        </div>
      )}

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
