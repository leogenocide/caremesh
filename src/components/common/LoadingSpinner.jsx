export const LoadingSpinner = ({ size = 28, message = 'Loading...', fullScreen = false }) => {
  const content = (
    <div 
      className="d-flex flex-column align-center justify-center gap-2 p-3"
      role="status"
      aria-live="polite"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          animation: 'caremesh-spin 0.75s linear infinite',
          color: 'var(--primary-600)'
        }}
      >
        <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
        <path d="M12 2a10 10 0 0 1 10 10" />
      </svg>
      {message && (
        <span className="text-xs text-muted font-medium">{message}</span>
      )}
      <span className="sr-only">{message}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div 
        className="d-flex align-center justify-center w-100" 
        style={{ minHeight: '60vh', flex: 1 }}
      >
        {content}
      </div>
    );
  }

  return content;
};
