import { useState } from 'react';
import { useCareMesh } from '../../context/useCareMesh';
import { Modal } from '../common/Modal';
import { LocationPicker } from '../common/LocationPicker';
import { 
  FileText, 
  Wrench, 
  Check, 
  Sparkles,
  AlertCircle
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
        skills: skillsArray
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
