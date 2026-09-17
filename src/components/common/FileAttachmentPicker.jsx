import { useState, useRef } from 'react';
import { 
  Paperclip, 
  Upload, 
  X, 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  File, 
  Link2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export const FileAttachmentPicker = ({
  files = [],
  onChange,
  maxFiles = 5,
  accept = 'image/*,.pdf,.doc,.docx,.txt,.csv,.json',
  label = 'Attach Photos & Documents from Device',
  helpText = 'Upload field photos, lab measurements, sensor data, or official notices (up to 10MB each)',
  allowUrlFallback = true
}) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlTitle, setUrlTitle] = useState('');
  const [urlValue, setUrlValue] = useState('');

  const handleFiles = (newFileList) => {
    setErrorMessage('');
    if (!newFileList || newFileList.length === 0) return;

    if (files.length + newFileList.length > maxFiles) {
      setErrorMessage(`You can attach a maximum of ${maxFiles} files.`);
      return;
    }

    const validFiles = Array.from(newFileList);
    const promises = validFiles.map((file) => {
      return new Promise((resolve) => {
        // 10MB limit
        if (file.size > 10 * 1024 * 1024) {
          setErrorMessage(`File "${file.name}" exceeds the 10MB limit.`);
          resolve(null);
          return;
        }

        const isImage = file.type.startsWith('image/');
        const reader = new FileReader();

        reader.onload = (e) => {
          resolve({
            id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            name: file.name,
            size: file.size,
            formattedSize: formatBytes(file.size),
            type: file.type || 'application/octet-stream',
            isImage,
            dataUrl: e.target?.result,
            lastModified: file.lastModified
          });
        };

        reader.onerror = () => {
          setErrorMessage(`Could not read file "${file.name}".`);
          resolve(null);
        };

        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then((results) => {
      const successful = results.filter(Boolean);
      if (successful.length > 0) {
        onChange?.([...files, ...successful]);
      }
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (fileId) => {
    onChange?.(files.filter(f => f.id !== fileId));
  };

  const handleAddUrl = (e) => {
    e.preventDefault();
    if (!urlValue.trim()) return;

    try {
      new URL(urlValue.trim());
    } catch {
      setErrorMessage('Please enter a valid HTTP or HTTPS link.');
      return;
    }

    const isImg = /\.(jpeg|jpg|gif|png|webp)($|\?)/i.test(urlValue);
    const newFile = {
      id: `url_${Date.now()}`,
      name: urlTitle.trim() || urlValue.split('/').pop() || 'Web Resource',
      size: 0,
      formattedSize: 'Link',
      type: isImg ? 'image/url' : 'text/url',
      isImage: isImg,
      dataUrl: urlValue.trim(),
      isWebLink: true
    };

    onChange?.([...files, newFile]);
    setUrlTitle('');
    setUrlValue('');
    setShowUrlInput(false);
    setErrorMessage('');
  };

  const getFileIcon = (file) => {
    if (file.isImage) return <ImageIcon size={18} className="text-brand" />;
    if (file.name?.endsWith('.csv') || file.name?.endsWith('.xlsx')) {
      return <FileSpreadsheet size={18} className="text-emerald-600" />;
    }
    if (file.name?.endsWith('.pdf') || file.type?.includes('pdf') || file.type?.includes('text')) {
      return <FileText size={18} className="text-blue-600" />;
    }
    return <File size={18} className="text-muted" />;
  };

  return (
    <div className="d-flex flex-column gap-2">
      <div className="d-flex align-center justify-between">
        <label className="form-label font-bold text-xs text-primary mb-0 d-flex align-center gap-1.5">
          <Paperclip size={14} className="text-brand" />
          <span>{label}</span>
          <span className="text-xs text-muted font-normal">({files.length}/{maxFiles})</span>
        </label>

        {allowUrlFallback && (
          <button
            type="button"
            className="btn btn-ghost btn-xs text-brand p-0"
            onClick={() => setShowUrlInput(!showUrlInput)}
          >
            <Link2 size={12} />
            <span>{showUrlInput ? 'Cancel Web Link' : '+ Add via Web Link'}</span>
          </button>
        )}
      </div>

      {helpText && (
        <span className="text-xs text-muted d-block" style={{ marginTop: '-4px' }}>
          {helpText}
        </span>
      )}

      {/* Error notification */}
      {errorMessage && (
        <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose d-flex align-center gap-2 text-xs">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Optional Web Link Input Box */}
      {showUrlInput && (
        <div className="card p-2.5 d-flex flex-column gap-2" style={{ background: 'var(--bg-subtle)' }}>
          <div className="d-flex gap-2">
            <input
              type="text"
              placeholder="Title or description (optional)"
              value={urlTitle}
              onChange={(e) => setUrlTitle(e.target.value)}
              className="input text-xs"
              style={{ flex: 1 }}
            />
            <input
              type="url"
              placeholder="https://example.com/evidence-document.pdf"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              className="input text-xs"
              style={{ flex: 2 }}
            />
            <button
              type="button"
              className="btn btn-primary btn-xs"
              onClick={handleAddUrl}
            >
              Add Link
            </button>
          </div>
        </div>
      )}

      {/* Dropzone & Browse Button */}
      {files.length < maxFiles && (
        <div
          className="rounded p-3 text-center cursor-pointer transition-all"
          style={{
            border: isDragging ? '2px dashed var(--primary-600)' : '2px dashed var(--border-default)',
            background: isDragging ? 'var(--primary-50)' : 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)'
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept={accept}
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files) {
                handleFiles(e.target.files);
                e.target.value = ''; // Reset input to allow re-uploading same file name
              }
            }}
          />

          <div className="d-flex flex-column align-center justify-center gap-1.5 py-1">
            <div 
              style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '50%', 
                background: 'rgba(59, 130, 246, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
            >
              <Upload size={18} className="text-brand" />
            </div>
            <span className="text-xs font-bold text-primary">
              Click to choose files from device or drag & drop here
            </span>
            <span className="text-xs text-muted" style={{ fontSize: '11px' }}>
              Images (PNG, JPG, WebP), PDFs, CSV telemetry, or text notes
            </span>
          </div>
        </div>
      )}

      {/* Attached Files List / Previews */}
      {files.length > 0 && (
        <div className="d-flex flex-column gap-1.5 mt-1">
          {files.map((file) => (
            <div
              key={file.id}
              className="card p-2 d-flex align-center justify-between gap-2"
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <div className="d-flex align-center gap-2.5" style={{ minWidth: 0, flex: 1 }}>
                {file.isImage && file.dataUrl ? (
                  <img
                    src={file.dataUrl}
                    alt={file.name}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: 'var(--radius-sm)',
                      objectFit: 'cover',
                      border: '1px solid var(--border-light)',
                      flexShrink: 0
                    }}
                  />
                ) : (
                  <div 
                    style={{ 
                      width: '38px', 
                      height: '38px', 
                      borderRadius: 'var(--radius-sm)', 
                      background: 'var(--bg-subtle)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0 
                    }}
                  >
                    {getFileIcon(file)}
                  </div>
                )}

                <div style={{ minWidth: 0, flex: 1 }}>
                  <span 
                    className="font-bold text-xs text-primary d-block text-truncate"
                    title={file.name}
                  >
                    {file.name}
                  </span>
                  <div className="d-flex align-center gap-2 mt-0.5">
                    <span className="badge badge-subtle text-xs" style={{ fontSize: '10px', padding: '1px 5px' }}>
                      {file.formattedSize}
                    </span>
                    {file.isWebLink ? (
                      <span className="text-xs text-muted" style={{ fontSize: '10px' }}>Web Link</span>
                    ) : (
                      <span className="text-xs text-emerald-600 d-flex align-center gap-1" style={{ fontSize: '10px' }}>
                        <CheckCircle2 size={10} /> Loaded from device
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-xs text-rose p-1"
                title="Remove attachment"
                onClick={() => handleRemoveFile(file.id)}
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
