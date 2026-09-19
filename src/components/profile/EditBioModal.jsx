import { useState } from 'react';
import { useCareMesh } from '../../context/useCareMesh';
import { Modal } from '../common/Modal';
import { LocationPicker } from '../common/LocationPicker';
import { 
  FileText, 
  Wrench, 
  Check, 
  Sparkles,
  AlertCircle,
  Share2,
  Globe
} from 'lucide-react';

const BIO_TEMPLATES = [
  {
    label: 'Mutual Aid & Logistics',
    bio: 'Active community coordinator focused on mutual aid logistics, emergency supply distribution, and neighborhood resilience.'
  },
  {
    label: 'Gardening & Ecology',
    bio: 'Urban gardener and sustainability volunteer helping coordinate local composting, tool shares, and community garden plots.'
  },
  {
    label: 'Medical & First Aid',
    bio: 'CERT trained responder providing first aid support, neighborhood wellness checks, and emergency preparedness training.'
  },
  {
    label: 'Tool Share & Repair',
    bio: 'Fix-it enthusiast with equipment for carpentry, plumbing repairs, and neighborhood maintenance projects.'
  }
];

const EditBioForm = ({ onClose }) => {
  const { currentUser, updateUserProfile } = useCareMesh();
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [userLocation, setUserLocation] = useState({
    address: currentUser?.location?.neighborhood || currentUser?.location?.address || 'Maplewood',
    lat: currentUser?.location?.lat ?? 37.7749,
    lng: currentUser?.location?.lng ?? -122.4194
  });
  const [skillsText, setSkillsText] = useState((currentUser?.skills || []).join(', '));
  const [socialLinks, setSocialLinks] = useState({
    twitter: currentUser?.socialLinks?.twitter || '',
    linkedin: currentUser?.socialLinks?.linkedin || '',
    github: currentUser?.socialLinks?.github || '',
    instagram: currentUser?.socialLinks?.instagram || '',
    facebook: currentUser?.socialLinks?.facebook || '',
    whatsapp: currentUser?.socialLinks?.whatsapp || '',
    website: currentUser?.socialLinks?.website || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    if (!bio.trim()) {
      setErrorMsg('Bio cannot be empty.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      const skillsArray = skillsText
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      await updateUserProfile({
        bio: bio.trim(),
        location: {
          ...currentUser?.location,
          address: userLocation.address.trim(),
          neighborhood: userLocation.address.trim(),
          lat: userLocation.lat,
          lng: userLocation.lng
        },
        skills: skillsArray,
        socialLinks: {
          twitter: socialLinks.twitter?.trim() || '',
          linkedin: socialLinks.linkedin?.trim() || '',
          github: socialLinks.github?.trim() || '',
          instagram: socialLinks.instagram?.trim() || '',
          facebook: socialLinks.facebook?.trim() || '',
          whatsapp: socialLinks.whatsapp?.trim() || '',
          website: socialLinks.website?.trim() || ''
        }
      });

      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save bio.');
    } finally {
      setIsSaving(false);
    }
  };

  const charCount = bio.length;
  const maxChars = 500;

  return (
    <form onSubmit={handleSave} className="d-flex flex-column gap-3">
        {/* User Card Header */}
        <div className="d-flex align-center gap-2.5 p-2.5 rounded" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
          <img
            src={currentUser?.avatar}
            alt={currentUser?.name}
            style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-500)', flexShrink: 0 }}
          />
          <div className="min-w-0">
            <span className="font-bold text-xs text-primary d-block">{currentUser?.name}</span>
            <span className="text-xs font-semibold text-brand d-block">{currentUser?.handle}</span>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose d-flex align-center gap-2 text-xs">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Bio Textarea */}
        <div className="form-group">
          <div className="d-flex justify-between align-center mb-1">
            <label className="form-label text-xs font-bold text-secondary mb-0 d-flex align-center gap-1.5">
              <FileText size={14} className="text-brand" />
              <span>About You & Coordination Focus *</span>
            </label>
            <span className="text-xs text-muted" style={{ fontSize: '0.72rem' }}>
              <span className={charCount > maxChars ? 'text-rose font-bold' : ''}>{charCount}</span> / {maxChars}
            </span>
          </div>
          <textarea
            className="form-input text-xs"
            rows={4}
            placeholder="Describe your role in the community, what mutual aid you offer, or what projects you are actively coordinating..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={maxChars}
            required
            style={{ lineHeight: '1.5', resize: 'vertical' }}
          />
        </div>

        {/* Quick Inspiration Templates */}
        <div>
          <span className="text-xs font-bold text-secondary d-flex align-center gap-1 mb-1.5" style={{ fontSize: '0.72rem' }}>
            <Sparkles size={12} className="text-amber" />
            <span>Quick Templates & Focus Starters</span>
          </span>
          <div className="d-flex flex-wrap gap-1.5">
            {BIO_TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={() => setBio(tmpl.bio)}
                style={{ fontSize: '0.7rem' }}
              >
                {tmpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Neighborhood District & Coordinates */}
        <LocationPicker
          value={userLocation}
          onChange={setUserLocation}
          label="Neighborhood District & Coordinates"
          placeholder="e.g. Maplewood West, East Side, Central Basin"
        />

        {/* Skills & Capabilities */}
        <div className="form-group">
          <label className="form-label text-xs font-bold text-secondary mb-1 d-flex align-center gap-1.5">
            <Wrench size={14} className="text-emerald" />
            <span>Skills & Capabilities (comma-separated)</span>
          </label>
          <input
            type="text"
            className="form-input text-xs"
            placeholder="e.g. Water Testing, Chain Saw Operation, Carpentry, First Aid"
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
          />
        </div>

        {/* Social Media Platforms & External Profiles */}
        <div className="card p-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
          <div className="d-flex align-center justify-between mb-2 pb-1 border-bottom flex-wrap gap-1">
            <span className="text-xs font-bold text-secondary d-flex align-center gap-1.5">
              <Share2 size={13} className="text-brand" />
              <span>Social Media Platforms & External Links</span>
            </span>
            <span className="text-xs text-muted" style={{ fontSize: '0.68rem' }}>
              Displayed neatly on your profile
            </span>
          </div>

          <div className="d-flex flex-column gap-2">
            {/* X / Twitter */}
            <div className="d-flex align-center gap-2">
              <div 
                style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: '0.75rem' }}
                title="X / Twitter"
              >
                𝕏
              </div>
              <input
                type="text"
                className="form-input text-xs flex-1"
                placeholder="X / Twitter handle or URL (e.g. @mayalin_eco)"
                value={socialLinks.twitter}
                onChange={(e) => setSocialLinks(prev => ({ ...prev, twitter: e.target.value }))}
              />
            </div>

            {/* LinkedIn */}
            <div className="d-flex align-center gap-2">
              <div 
                style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#0a66c2', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, fontSize: '0.72rem' }}
                title="LinkedIn"
              >
                in
              </div>
              <input
                type="text"
                className="form-input text-xs flex-1"
                placeholder="LinkedIn URL or username (e.g. mayalin-civic)"
                value={socialLinks.linkedin}
                onChange={(e) => setSocialLinks(prev => ({ ...prev, linkedin: e.target.value }))}
              />
            </div>

            {/* GitHub */}
            <div className="d-flex align-center gap-2">
              <div 
                style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#24292f', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                title="GitHub"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </div>
              <input
                type="text"
                className="form-input text-xs flex-1"
                placeholder="GitHub username or profile URL (e.g. mayalin)"
                value={socialLinks.github}
                onChange={(e) => setSocialLinks(prev => ({ ...prev, github: e.target.value }))}
              />
            </div>

            {/* Instagram */}
            <div className="d-flex align-center gap-2">
              <div 
                style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#e1306c', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                title="Instagram"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </div>
              <input
                type="text"
                className="form-input text-xs flex-1"
                placeholder="Instagram handle or URL (e.g. @mayalin)"
                value={socialLinks.instagram}
                onChange={(e) => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))}
              />
            </div>

            {/* Facebook */}
            <div className="d-flex align-center gap-2">
              <div 
                style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#1877f2', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                title="Facebook"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <input
                type="text"
                className="form-input text-xs flex-1"
                placeholder="Facebook profile URL or username (e.g. facebook.com/mayalin)"
                value={socialLinks.facebook}
                onChange={(e) => setSocialLinks(prev => ({ ...prev, facebook: e.target.value }))}
              />
            </div>

            {/* WhatsApp */}
            <div className="d-flex align-center gap-2">
              <div 
                style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#25d366', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                title="WhatsApp"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08 0 1.23.89 2.42 1.02 2.59.13.17 1.76 2.69 4.27 3.77.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29z" />
                </svg>
              </div>
              <input
                type="text"
                className="form-input text-xs flex-1"
                placeholder="WhatsApp phone number or direct link (e.g. +1 555-0199 or wa.me/...)"
                value={socialLinks.whatsapp}
                onChange={(e) => setSocialLinks(prev => ({ ...prev, whatsapp: e.target.value }))}
              />
            </div>

            {/* Website / Portfolio */}
            <div className="d-flex align-center gap-2">
              <div 
                style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#059669', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                title="Website / Portfolio"
              >
                <Globe size={14} />
              </div>
              <input
                type="text"
                className="form-input text-xs flex-1"
                placeholder="Website, portfolio, or organization URL (e.g. mayalin.eco)"
                value={socialLinks.website}
                onChange={(e) => setSocialLinks(prev => ({ ...prev, website: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="d-flex justify-end gap-2 mt-2 pt-2 border-top">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-sm d-flex align-center gap-1.5"
            disabled={isSaving || charCount > maxChars}
          >
            <Check size={14} />
            <span>{isSaving ? 'Saving...' : 'Save Bio'}</span>
          </button>
        </div>
      </form>
  );
};

export const EditBioModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Bio & Community Focus"
      maxWidth="540px"
      zIndex={1100}
    >
      <EditBioForm onClose={onClose} />
    </Modal>
  );
};

export default EditBioModal;
