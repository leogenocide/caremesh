import { useState } from 'react';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  Image, 
  FileText, 
  Download, 
  Calendar, 
  User,
  Upload
} from 'lucide-react';

export const GroupMediaTab = ({ community }) => {
  const { uploadCommunityMedia, showToast } = useCareMesh();
  const [activeMediaFilter, setActiveMediaFilter] = useState('photos'); // 'photos' | 'files'

  if (!community) return null;

  const photos = community.mediaGallery || [];
  const files = community.files || [];

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      if (showToast) showToast('Photo file must be under 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        const title = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        if (uploadCommunityMedia) {
          uploadCommunityMedia(community.id, {
            url: dataUrl,
            title: title ? title.charAt(0).toUpperCase() + title.slice(1) : 'Field Photo'
          });
        }
      }
    };
    reader.onerror = () => {
      if (showToast) showToast('Failed to read image file.', 'error');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Sub-tabs for Media vs Files */}
      <div className="d-flex align-center justify-between border-bottom pb-2 flex-wrap gap-2">
        <div className="d-flex gap-2">
          <button
            className={`btn btn-sm ${activeMediaFilter === 'photos' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveMediaFilter('photos')}
          >
            <Image size={14} />
            <span>Field Photos ({photos.length})</span>
          </button>
          <button
            className={`btn btn-sm ${activeMediaFilter === 'files' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveMediaFilter('files')}
          >
            <FileText size={14} />
            <span>Documents & Reports ({files.length})</span>
          </button>
        </div>

        <div className="d-flex align-center gap-2">
          {activeMediaFilter === 'photos' && (
            <label className="btn btn-primary btn-sm d-flex align-center gap-1.5 cursor-pointer mb-0">
              <Upload size={14} />
              <span>Upload Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
            </label>
          )}
          <span className="text-xs text-muted d-none d-sm-inline">Evidence & shared group records</span>
        </div>
      </div>

      {/* 1. PHOTOS GRID */}
      {activeMediaFilter === 'photos' && (
        <div>
          {photos.length > 0 ? (
            <div className="grid-3 gap-3">
              {photos.map(p => (
                <div 
                  key={p.id} 
                  className="card p-0 overflow-hidden card-interactive"
                  style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
                >
                  <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
                    <img
                      src={p.url}
                      alt={p.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div className="p-3">
                    <h5 className="font-bold text-xs text-primary mb-1 text-truncate">{p.title}</h5>
                    <div className="d-flex align-center justify-between text-xs text-muted" style={{ fontSize: '0.7rem' }}>
                      <span className="d-flex align-center gap-1"><User size={11} /> {p.uploader}</span>
                      <span className="d-flex align-center gap-1"><Calendar size={11} /> {p.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-5 text-center text-muted">
              <Image size={36} className="mx-auto mb-2 opacity-50" />
              <h4 className="font-bold text-sm text-primary mb-1">No Photos Uploaded Yet</h4>
              <p className="text-xs">Field photos attached in group posts will automatically appear here.</p>
            </div>
          )}
        </div>
      )}

      {/* 2. FILES & DOCUMENTS LIST */}
      {activeMediaFilter === 'files' && (
        <div className="d-flex flex-column gap-2">
          {files.length > 0 ? (
            files.map(f => (
              <div
                key={f.id}
                className="card p-3 d-flex align-center justify-between card-interactive"
                style={{ background: '#ffffff', border: '1px solid var(--border-light)' }}
              >
                <div className="d-flex align-center gap-3">
                  <div 
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--primary-50)',
                      color: 'var(--primary-700)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <FileText size={20} />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-primary mb-0">{f.name}</h5>
                    <span className="text-xs text-muted" style={{ fontSize: '0.72rem' }}>
                      {f.size} · {f.type} · Uploaded by {f.uploader} ({f.date})
                    </span>
                  </div>
                </div>

                <button
                  className="btn btn-secondary btn-xs d-flex align-center gap-1"
                  onClick={() => alert(`Simulated downloading document: "${f.name}"`)}
                >
                  <Download size={13} />
                  <span>Download</span>
                </button>
              </div>
            ))
          ) : (
            <div className="card p-5 text-center text-muted">
              <FileText size={36} className="mx-auto mb-2 opacity-50" />
              <h4 className="font-bold text-sm text-primary mb-1">No Shared Documents</h4>
              <p className="text-xs">Shared PDF guides, sensor calibration files, and official notices will appear here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
