import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CareMesh ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleResetStorage = () => {
    if (window.confirm('Reset local prototype state to clean initial seed data? This will resolve any corrupted cached data.')) {
      try {
        localStorage.clear();
      } catch (e) {
        console.error('Storage clear error:', e);
      }
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div 
          className="d-flex flex-column align-center justify-center p-4" 
          style={{ minHeight: '60vh', width: '100%', maxWidth: '720px', margin: '2rem auto' }}
          role="alert"
        >
          <div className="card p-5 text-center d-flex flex-column align-center gap-3 w-100" style={{ border: '2px solid var(--rose-200)', background: '#fff9f9' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--rose-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--rose-600)' }}>
              <AlertTriangle size={32} />
            </div>

            <div>
              <h3 className="font-bold text-xl text-primary mb-1">
                Something unexpected occurred in this section
              </h3>
              <p className="text-sm text-secondary" style={{ maxWidth: '480px', margin: '0 auto' }}>
                CareMesh safely contained this issue so the rest of your session remains secure. You can try reloading the section or returning to the home dashboard.
              </p>
            </div>

            {this.state.error?.message && (
              <div 
                className="p-3 text-left w-100 rounded text-xs font-mono" 
                style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', overflowX: 'auto', maxHeight: '100px' }}
              >
                {this.state.error.message}
              </div>
            )}

            <div className="d-flex gap-2 flex-wrap justify-center mt-2">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={this.handleReset}
              >
                <RefreshCw size={14} />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={this.handleReload}
              >
                <span>Reload Page</span>
              </button>

              <a
                href="/"
                className="btn btn-secondary btn-sm"
                onClick={this.handleReset}
              >
                <Home size={14} />
                <span>Return to Home</span>
              </a>

              <button
                type="button"
                className="btn btn-ghost btn-sm text-rose"
                onClick={this.handleResetStorage}
                title="Clear local test storage if data corrupted"
              >
                <RotateCcw size={14} />
                <span>Reset Prototype Data</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
