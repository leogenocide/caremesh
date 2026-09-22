import { useState } from 'react';
import { Modal } from '../common/Modal';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  Share2, 
  Copy, 
  Check, 
  Send, 
  Mail, 
  Smartphone, 
  Globe, 
  MessageSquare,
  ExternalLink
} from 'lucide-react';

const getShareDetails = (entity, type) => {
  if (!entity) return { title: 'CareMesh Civic Record', description: '', category: 'civic', url: window.location.href, shareText: '' };

  const origin = window.location.origin;
  const rawTitle = entity.title || entity.name || entity.content?.slice(0, 50) || 'CareMesh Civic Record';
  const description = entity.description || entity.content || entity.summary || '';
  const category = entity.category || entity.contributionType || type || 'civic';
  let path;
  let prefix = 'CareMesh Record';

  switch (type) {
    case 'observation':
      path = `/explore?tab=observations&id=${entity.id}`;
      prefix = 'Field Observation';
      break;
    case 'request':
      path = `/collaborate?tab=requests&id=${entity.id}`;
      prefix = 'Help Request';
      break;
    case 'resource':
      path = `/collaborate?tab=resources&id=${entity.id}`;
      prefix = 'Available Resource';
      break;
    case 'plan':
      path = `/plans?id=${entity.id}`;
      prefix = 'Resilience Plan';
      break;
    case 'safety':
      path = `/explore?tab=safety&id=${entity.id}`;
      prefix = 'Safety Alert';
      break;
    case 'post':
      path = `/social?postId=${entity.id}`;
      prefix = 'Community Discussion';
      break;
    case 'event':
      path = `/collaborate?tab=events&id=${entity.id}`;
      prefix = 'Civic Event';
      break;
    default:
      path = `/?id=${entity.id}`;
  }

  const title = `[${prefix}] ${rawTitle}`;
  const url = `${origin}${path}`;
  const shareText = `${title}\n${description ? `${description.slice(0, 160)}...\n\n` : ''}View details on CareMesh: ${url}`;

  return { title, rawTitle, description, category, url, shareText, prefix };
};

export const ShareToSocialModal = () => {
  const { 
    shareSocialTarget, 
    closeShareSocialModal, 
    shareObservationToSocial, 
    createPost, 
    showToast 
  } = useCareMesh();

  const [activeShareTab, setActiveShareTab] = useState('external'); // 'external' | 'feed'
  const [userNote, setUserNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [isNativeSharing, setIsNativeSharing] = useState(false);

  if (!shareSocialTarget) return null;
  const { entity, type } = shareSocialTarget;

  const shareDetails = getShareDetails(entity, type);
  const hasNativeShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  const handleCopyLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareDetails.url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareDetails.url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      showToast('Link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Failed to copy link.', 'error');
    }
  };

  const handleNativeShare = async () => {
    if (!hasNativeShare) {
      handleCopyLink();
      return;
    }
    setIsNativeSharing(true);
    try {
      await navigator.share({
        title: shareDetails.title,
        text: shareDetails.description ? `${shareDetails.title}\n${shareDetails.description}` : shareDetails.title,
        url: shareDetails.url
      });
      showToast('Shared successfully!', 'success');
    } catch (err) {
      if (err.name !== 'AbortError') {
        showToast('Native share cancelled or unavailable.', 'info');
      }
    } finally {
      setIsNativeSharing(false);
    }
  };

  const openPlatformWindow = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=550');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${shareDetails.title}\n${shareDetails.url}`);
    openPlatformWindow(`https://api.whatsapp.com/send?text=${text}`);
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(shareDetails.title);
    const url = encodeURIComponent(shareDetails.url);
    openPlatformWindow(`https://twitter.com/intent/tweet?text=${text}&url=${url}`);
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(shareDetails.title);
    const url = encodeURIComponent(shareDetails.url);
    openPlatformWindow(`https://t.me/share/url?url=${url}&text=${text}`);
  };

  const handleShareFacebook = () => {
    const url = encodeURIComponent(shareDetails.url);
    openPlatformWindow(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(shareDetails.url);
    openPlatformWindow(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`);
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(shareDetails.title);
    const body = encodeURIComponent(
      `${shareDetails.title}\n\n${shareDetails.description || ''}\n\nView details on CareMesh:\n${shareDetails.url}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleInternalFeedShare = (e) => {
    e.preventDefault();
    if (type === 'observation') {
      shareObservationToSocial(entity.id, userNote);
    } else {
      const content = userNote.trim()
        ? `${userNote.trim()}\n\n[${type.toUpperCase()}]: "${shareDetails.rawTitle}"\n${shareDetails.url}`
        : `Sharing ${type}: "${shareDetails.rawTitle}". ${entity.description || ''}\n${shareDetails.url}`;
      createPost(content, { type, id: entity.id, title: shareDetails.rawTitle });
      closeShareSocialModal();
    }
    showToast(`Shared ${type} to community coordination feed!`, 'success');
    setUserNote('');
  };

  return (
    <Modal
      isOpen={Boolean(shareSocialTarget)}
      onClose={closeShareSocialModal}
      title="Share to Other Platforms & Neighbors"
      subtitle="Broadcast this civic record to external channels, messaging apps, or the CareMesh feed."
      maxWidth="620px"
      zIndex={1100}
    >
      <div className="d-flex flex-column gap-3.5">
        {/* Entity Summary Preview Card */}
        <div className="card p-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
          <div className="d-flex align-center justify-between gap-2 flex-wrap mb-1">
            <div className="d-flex align-center gap-1.5 flex-wrap">
              <span className="badge badge-primary text-xs text-uppercase font-semibold">
                {shareDetails.prefix}
              </span>
              {shareDetails.category && (
                <span className="badge badge-gray text-xs text-capitalize">
                  {shareDetails.category.replace('_', ' ')}
                </span>
              )}
            </div>
            <span className="text-xs text-muted">
              {entity.location?.address || entity.location || 'Maplewood Corridor'}
            </span>
          </div>
          <h4 className="font-bold text-sm text-primary mb-1">{shareDetails.rawTitle}</h4>
          {shareDetails.description && (
            <p className="text-xs text-secondary mb-0 line-clamp-2" style={{ lineHeight: '1.45' }}>
              {shareDetails.description}
            </p>
          )}
        </div>

        {/* Tab Switcher: Share External Platforms vs CareMesh Community Feed */}
        <div className="touch-tab-nav flex-wrap gap-1.5 border-bottom pb-1">
          <button
            type="button"
            className={`btn btn-sm ${activeShareTab === 'external' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => setActiveShareTab('external')}
          >
            <Globe size={14} />
            <span>External Platforms & Apps</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${activeShareTab === 'feed' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => setActiveShareTab('feed')}
          >
            <MessageSquare size={14} />
            <span>CareMesh Community Feed</span>
          </button>
        </div>

        {/* TAB 1: EXTERNAL PLATFORMS & DIRECT LINK */}
        {activeShareTab === 'external' && (
          <div className="d-flex flex-column gap-3">
            {/* Native Mobile / Device Share CTA */}
            {hasNativeShare && (
              <button
                type="button"
                className="btn btn-primary btn-sm d-flex align-center justify-center gap-2 py-2.5 w-100"
                onClick={handleNativeShare}
                disabled={isNativeSharing}
              >
                <Smartphone size={16} />
                <span className="font-bold">Share via Device Apps (WhatsApp, Messages, etc.)</span>
              </button>
            )}

            {/* Direct 1-Click Platform Channels */}
            <div>
              <span className="text-xs font-bold text-secondary text-uppercase d-block mb-2">
                Share Directly to Platforms:
              </span>
              <div className="share-platform-grid">
                {/* WhatsApp */}
                <button
                  type="button"
                  className="share-platform-btn"
                  style={{ background: '#25D366' }}
                  onClick={handleShareWhatsApp}
                  title="Share to WhatsApp"
                >
                  <Send size={14} />
                  <span>WhatsApp</span>
                </button>

                {/* X (Twitter) */}
                <button
                  type="button"
                  className="share-platform-btn"
                  style={{ background: '#0f172a' }}
                  onClick={handleShareTwitter}
                  title="Share to X (Twitter)"
                >
                  <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>𝕏</span>
                  <span>Post on X</span>
                </button>

                {/* Telegram */}
                <button
                  type="button"
                  className="share-platform-btn"
                  style={{ background: '#229ED9' }}
                  onClick={handleShareTelegram}
                  title="Share to Telegram"
                >
                  <Send size={14} />
                  <span>Telegram</span>
                </button>

                {/* Facebook */}
                <button
                  type="button"
                  className="share-platform-btn"
                  style={{ background: '#1877F2' }}
                  onClick={handleShareFacebook}
                  title="Share to Facebook"
                >
                  <ExternalLink size={14} />
                  <span>Facebook</span>
                </button>

                {/* LinkedIn */}
                <button
                  type="button"
                  className="share-platform-btn"
                  style={{ background: '#0A66C2' }}
                  onClick={handleShareLinkedIn}
                  title="Share to LinkedIn"
                >
                  <ExternalLink size={14} />
                  <span>LinkedIn</span>
                </button>

                {/* Email */}
                <button
                  type="button"
                  className="share-platform-btn"
                  style={{ background: '#475569' }}
                  onClick={handleShareEmail}
                  title="Share via Email"
                >
                  <Mail size={14} />
                  <span>Email</span>
                </button>
              </div>
            </div>

            {/* Copy Direct Link Field */}
            <div className="card p-3" style={{ background: '#ffffff', border: '1px solid var(--border-default)' }}>
              <label className="form-label font-bold text-xs text-secondary mb-1.5 d-block">
                Copy Direct Record Link
              </label>
              <div className="d-flex align-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareDetails.url}
                  className="form-input text-xs flex-1"
                  style={{ background: 'var(--bg-subtle)' }}
                  onClick={(e) => e.target.select()}
                />
                <button
                  type="button"
                  className={`btn btn-sm d-flex align-center gap-1.5 flex-shrink-0 ${copied ? 'btn-primary font-bold' : 'btn-secondary'}`}
                  style={copied ? { background: 'var(--emerald-600)', borderColor: 'var(--emerald-600)' } : {}}
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <>
                      <Check size={14} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
              <span className="text-xs text-muted d-block mt-1.5" style={{ fontSize: '0.72rem' }}>
                Anyone with this direct link can view and inspect this record on CareMesh.
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: CROSS-POST TO CAREMESH COMMUNITY FEED */}
        {activeShareTab === 'feed' && (
          <form onSubmit={handleInternalFeedShare} className="d-flex flex-column gap-3">
            <div>
              <label className="form-label font-bold text-xs text-primary mb-1">
                Add Context or Direct Call-to-Action for Neighbors:
              </label>
              <textarea
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                rows={3}
                placeholder="e.g. Neighbors, please review this report before the upcoming planning committee meeting..."
                className="form-textarea text-xs"
              />
              <span className="text-xs text-muted d-block mt-1">
                This will create a new post in the community coordination discussion feed referencing this record.
              </span>
            </div>

            <div className="d-flex align-center justify-end gap-2 pt-2 border-top">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={closeShareSocialModal}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm d-flex align-center gap-1.5">
                <Share2 size={14} />
                <span>Publish to Community Feed</span>
              </button>
            </div>
          </form>
        )}

        {/* Modal Close Footer for Tab 1 */}
        {activeShareTab === 'external' && (
          <div className="d-flex align-center justify-end pt-2 border-top">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={closeShareSocialModal}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export const ShareModal = ShareToSocialModal;
export default ShareToSocialModal;
