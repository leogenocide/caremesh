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
import { CARTOON_AVATAR_PRESETS, DEFAULT_CARTOON_AVATAR } from '../../data/avatarPresets';

export const ChangeAvatarModal = ({ isOpen, onClose }) => {
  const { currentUser, updateUserProfile } = useCareMesh();
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.avatar || DEFAULT_CARTOON_AVATAR);
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
            {CARTOON_AVATAR_PRESETS.map(preset => {
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
