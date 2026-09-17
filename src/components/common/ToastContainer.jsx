import { useCareMesh } from '../../context/useCareMesh';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts = [], dismissToast } = useCareMesh();

  if (!toasts || toasts.length === 0) return null;

  const getVariantStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          border: '1.5px solid #86efac',
          background: '#f0fdf4',
          iconColor: '#16a34a',
          icon: <CheckCircle2 size={18} />
        };
      case 'error':
        return {
          border: '1.5px solid #fca5a5',
          background: '#fef2f2',
          iconColor: '#dc2626',
          icon: <AlertCircle size={18} />
        };
      case 'warning':
        return {
          border: '1.5px solid #fde68a',
          background: '#fffbeb',
          iconColor: '#d97706',
          icon: <AlertTriangle size={18} />
        };
      case 'info':
      default:
        return {
          border: '1.5px solid #bae6fd',
          background: '#f0f9ff',
          iconColor: '#0284c7',
          icon: <Info size={18} />
        };
    }
  };

  return (
    <div 
      className="caremesh-toast-container"
      aria-live="polite"
      aria-atomic="false"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        pointerEvents: 'none',
        maxWidth: '420px',
        width: 'calc(100vw - 2rem)'
      }}
    >
      {toasts.map(toast => {
        const variant = getVariantStyles(toast.type);

        return (
          <div
            key={toast.id}
            role="status"
            className="animate-fade-in"
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '0.85rem 1.1rem',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
              background: variant.background,
              border: variant.border,
              transition: 'all 0.2s ease',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ color: variant.iconColor, flexShrink: 0, marginTop: '2px' }}>
              {variant.icon}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {toast.title && (
                <div className="font-bold text-xs text-primary mb-0.5" style={{ lineHeight: '1.3' }}>
                  {toast.title}
                </div>
              )}
              <div className="text-xs text-secondary" style={{ lineHeight: '1.4', wordBreak: 'break-word' }}>
                {toast.message}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-xs p-0 text-muted"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              style={{ padding: '2px', marginLeft: '4px', flexShrink: 0 }}
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
