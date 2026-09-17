import { useState } from 'react';
import { Modal } from '../common/Modal';
import { useCareMesh } from '../../context/useCareMesh';
import { Share2, MessageSquare } from 'lucide-react';

export const ShareToSocialModal = () => {
  const { shareSocialTarget, closeShareSocialModal, shareObservationToSocial, createPost, showToast } = useCareMesh();
  const [userNote, setUserNote] = useState('');

  if (!shareSocialTarget) return null;
  const { entity, type } = shareSocialTarget;

  const handleShare = (e) => {
    e.preventDefault();
    if (type === 'observation') {
      shareObservationToSocial(entity.id, userNote);
    } else {
      const content = userNote.trim()
        ? `${userNote.trim()}\n\n[${type.toUpperCase()}]: "${entity.title}"`
        : `Sharing ${type}: "${entity.title}". ${entity.description || ''}`;
      createPost(content, { type, id: entity.id, title: entity.title });
      closeShareSocialModal();
    }
    showToast(`Shared ${type} to community coordination feed!`, 'success');
    setUserNote('');
  };

  return (
    <Modal
      isOpen={Boolean(shareSocialTarget)}
      onClose={closeShareSocialModal}
      title="Share to Coordination Feed"
      subtitle="Observations and reports are distinct real-world records. Sharing communicates context to the community feed."
      maxWidth="600px"
      zIndex={1100}
    >
      <form onSubmit={handleShare} className="d-flex flex-column gap-4">
        {/* Entity Preview */}
        <div className="card p-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
          <div className="d-flex align-center gap-2 mb-1">
            <span className="badge badge-primary text-xs text-uppercase font-semibold">{type}</span>
            <span className="text-xs text-muted">{entity.location?.address || 'Community Context'}</span>
          </div>
          <h4 className="font-bold text-sm text-primary mb-1">{entity.title}</h4>
          <p className="text-xs text-secondary mb-0">{entity.description}</p>
        </div>

        {/* User Note */}
        <div>
          <label className="form-label font-bold text-sm text-primary">
            Add Context or Direct Call-to-Action (Optional)
          </label>
          <textarea
            value={userNote}
            onChange={(e) => setUserNote(e.target.value)}
            rows={3}
            placeholder="e.g. Needs immediate volunteer eyes before 4 PM rainfall..."
            className="form-textarea"
          />
        </div>

        {/* Footer */}
        <div className="d-flex align-center justify-between pt-3 border-top">
          <span className="text-xs text-muted d-flex align-center gap-1">
            <MessageSquare size={13} />
            <span>Visible to all neighborhood coordinators</span>
          </span>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={closeShareSocialModal}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              <Share2 size={14} />
              <span>Share to Feed</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
