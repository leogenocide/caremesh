import { useState, useRef } from 'react';
import { useCareMesh } from '../../context/useCareMesh';
import { Modal } from '../common/Modal';
import { 
  Camera, 
  Upload, 
  Link as LinkIcon, 
  Check, 
  Sparkles,
  AlertCircle
} from 'lucide-react';

const PRESET_AVATARS = [
  {
    id: 'p1',
    label: 'Community Coordinator',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'p2',
    label: 'Equipment & Logistics',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'p3',
    label: 'Field Responder',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'p4',
    label: 'Senior Health Advocate',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'p5',
    label: 'Environmental Specialist',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'p6',
    label: 'Neighborhood Volunteer',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'p7',
    label: 'Mutual Aid Steward',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'p8',
    label: 'Youth Coordinator',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'p9',
    label: 'Senior Neighbor',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80'
  }
];

export const ChangeAvatarModal = ({ isOpen, onClose }) => {
  const { currentUser, updateUserProfile } = useCareMesh();
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.avatar || PRESET_AVATARS[0].url);
  const [customUrl, setCustomUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WebP, etc.).');
      return;
    }

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        setSelectedAvatar(dataUrl);
        setCustomUrl('');
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleCustomUrlApply = () => {
    setErrorMsg('');
    if (!customUrl.trim()) return;
    try {
      new URL(customUrl.trim());
      setSelectedAvatar(customUrl.trim());
    } catch {
      setErrorMsg('Please enter a valid HTTP/HTTPS image URL.');
    }
  };

  const handleSave = async () => {
    if (!selectedAvatar) return;
    setIsSaving(true);
    setErrorMsg('');
    try {
      await updateUserProfile({ avatar: selectedAvatar });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save profile picture.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Profile Picture"
      maxWidth="500px"
      zIndex={1100}
    >
      <div className="d-flex flex-column gap-3">
        {/* Active Preview */}
        <div className="d-flex align-center justify-center p-3 rounded" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
          <div className="d-flex align-center gap-3">
            <img
              src={selectedAvatar}
              alt="Selected Avatar Preview"
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid var(--primary-500)',
                boxShadow: 'var(--shadow-md)'
              }}
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
              }}
            />
            <div>
              <span className="font-bold text-xs text-primary d-block">Live Preview</span>
              <span className="text-xs text-muted">This avatar will appear across observations, plans, and coordination requests.</span>
            </div>
          </div>
        </div>

        {/* Error alert */}
        {errorMsg && (
          <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose d-flex align-center gap-2 text-xs">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Upload from Computer or Device */}
        <div>
          <label className="form-label text-xs font-bold text-secondary mb-1.5 d-flex align-center gap-1.5">
            <Upload size={14} className="text-brand" />
            <span>Upload Image from Device</span>
          </label>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm w-100 d-flex align-center justify-center gap-2 py-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera size={15} />
            <span>Choose Image File...</span>
          </button>
        </div>

        {/* Or Enter Web URL */}
        <div>
          <label className="form-label text-xs font-bold text-secondary mb-1.5 d-flex align-center gap-1.5">
            <LinkIcon size={14} className="text-primary" />
            <span>Or Enter Web Image URL</span>
          </label>
          <div className="d-flex gap-2">
            <input
              type="url"
              className="form-input text-xs flex-1"
              placeholder="https://example.com/my-photo.jpg"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCustomUrlApply();
                }
              }}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCustomUrlApply}
            >
              Apply
            </button>
          </div>
        </div>

        {/* Or Choose from Preset Gallery */}
        <div>
          <label className="form-label text-xs font-bold text-secondary mb-1.5 d-flex align-center gap-1.5">
            <Sparkles size={14} className="text-amber" />
            <span>Or Select from Community Presets</span>
          </label>
          <div 
            className="d-flex gap-2.5 flex-wrap justify-between p-2 rounded" 
            style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)', maxHeight: '180px', overflowY: 'auto' }}
          >
            {PRESET_AVATARS.map(preset => {
              const isSelected = selectedAvatar === preset.url;
              return (
                <button
                  key={preset.id}
                  type="button"
                  className="btn btn-ghost p-1 rounded-full cursor-pointer"
                  style={{
                    position: 'relative',
                    border: isSelected ? '2.5px solid var(--primary-600)' : '2px solid transparent',
                    borderRadius: '50%',
                    padding: '2px',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => {
                    setSelectedAvatar(preset.url);
                    setCustomUrl('');
                    setErrorMsg('');
                  }}
                  title={preset.label}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        background: 'var(--primary-600)',
                        color: '#ffffff',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <Check size={11} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
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
            type="button"
            className="btn btn-primary btn-sm d-flex align-center gap-1.5"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Check size={14} />
            <span>{isSaving ? 'Saving...' : 'Save Profile Picture'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
export default ChangeAvatarModal;
