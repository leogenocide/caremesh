import { useEffect } from 'react';
import { X } from 'lucide-react';

// Global stack tracking all open modals to ensure:
// 1. 'Escape' key only closes the topmost modal
// 2. document.body.style.overflow is only restored to 'unset' when ALL modals are closed
const activeModals = [];

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '680px',
  footer = null,
  zIndex = 1000,
  style = {}
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const modalRecord = { onClose, zIndex };
    activeModals.push(modalRecord);
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        // Resolve the topmost active modal by highest zIndex (latest mounted if tied)
        let topModal = activeModals[0];
        for (let i = 1; i < activeModals.length; i++) {
          if (activeModals[i].zIndex >= topModal.zIndex) {
            topModal = activeModals[i];
          }
        }
        if (topModal === modalRecord) {
          e.stopPropagation();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      const idx = activeModals.indexOf(modalRecord);
      if (idx !== -1) {
        activeModals.splice(idx, 1);
      }
      if (activeModals.length === 0) {
        document.body.style.overflow = 'unset';
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, zIndex]);

  if (!isOpen) return null;

  const titleId = title ? `modal_title_${title.replace(/\s+/g, '_').toLowerCase().slice(0, 20)}` : undefined;
  const subtitleId = subtitle ? `${titleId}_sub` : undefined;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose} 
      role="dialog" 
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={subtitleId}
      style={{ zIndex, ...style }}
    >
      <div 
        className="modal-content" 
        style={{ maxWidth }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-drag-handle" />

        <div className="modal-header">
          <div className="flex-1 min-w-0 pr-2">
            <h3 id={titleId} className="font-bold text-lg text-primary" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{title}</h3>
            {subtitle && <p id={subtitleId} className="text-xs text-muted mt-1" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{subtitle}</p>}
          </div>
          <button 
            type="button" 
            className="btn-icon text-muted flex-shrink-0" 
            onClick={onClose} 
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {children}
        </div>

        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
