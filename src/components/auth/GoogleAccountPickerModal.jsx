import { useState } from 'react';
import { Modal } from '../common/Modal';
import { useCareMesh } from '../../context/useCareMesh';
import { UserPlus, ArrowRight, AlertCircle, ShieldCheck, Mail } from 'lucide-react';

export const GoogleAccountPickerModal = ({ isOpen, onClose, onSuccess }) => {
  const { loginWithGoogle } = useCareMesh();
  const [useCustomAccount, setUseCustomAccount] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Preset community Google accounts for 1-click login
  const presetGoogleAccounts = [
    {
      name: 'Maya Lin',
      email: 'maya@caremesh.org',
      displayEmail: 'maya.lin@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'Environmental Scientist & Coordinator',
      googleId: 'g_sub_maya_lin_2026'
    },
    {
      name: 'Dave Miller',
      email: 'dave@caremesh.org',
      displayEmail: 'dave.miller@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'Woodworker & Emergency Volunteer',
      googleId: 'g_sub_dave_miller_2026'
    },
    {
      name: 'Elena Ramos',
      email: 'elena@caremesh.org',
      displayEmail: 'elena.ramos@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      role: 'Civil Engineer & Hydrologist',
      googleId: 'g_sub_elena_ramos_2026'
    },
    {
      name: 'Marcus Chen',
      email: 'marcus@caremesh.org',
      displayEmail: 'marcus.chen@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      role: 'Community Garden Director',
      googleId: 'g_sub_marcus_chen_2026'
    },
    {
      name: 'Priya Patel',
      email: 'priya@caremesh.org',
      displayEmail: 'priya.patel@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      role: 'Urban Planner & Public Health',
      googleId: 'g_sub_priya_patel_2026'
    }
  ];

  const handleSelectPreset = async (account) => {
    setErrorMsg('');
    setLoading(true);
    try {
      await loginWithGoogle({
        email: account.email,
        name: account.name,
        avatar: account.avatar,
        googleId: account.googleId
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const trimmedEmail = customEmail.trim();
    if (!trimmedEmail) {
      setErrorMsg('Please enter your Gmail address.');
      return;
    }
    if (!trimmedEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const resolvedName = customName.trim() || trimmedEmail.split('@')[0];
      const resolvedAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
      const resolvedGoogleId = `g_sub_${trimmedEmail.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;

      await loginWithGoogle({
        email: trimmedEmail,
        name: resolvedName,
        avatar: resolvedAvatar,
        googleId: resolvedGoogleId
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="460px"
      zIndex={1200}
    >
      <div className="d-flex flex-column gap-3 p-1">
        {/* Google Header */}
        <div className="text-center mb-1">
          <div className="d-inline-flex align-center justify-center p-2 mb-2 rounded-full" style={{ background: '#f8f9fa' }}>
            <svg width="28" height="28" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
          </div>
          <h3 className="font-bold text-lg text-primary mb-1">Sign in with Google</h3>
          <p className="text-xs text-muted">
            Choose an account to continue to <strong>CareMesh</strong>
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose d-flex align-center gap-2 text-xs">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!useCustomAccount ? (
          <div className="d-flex flex-column gap-2">
            <div className="d-flex flex-column gap-1.5" style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {presetGoogleAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  className="btn btn-ghost text-left p-2.5 rounded d-flex align-center justify-between card-interactive"
                  style={{ 
                    border: '1px solid var(--border-light)', 
                    background: '#ffffff',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => handleSelectPreset(account)}
                  disabled={loading}
                >
                  <div className="d-flex align-center gap-2.5">
                    <img
                      src={account.avatar}
                      alt={account.name}
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <span className="font-bold text-xs text-primary d-block">{account.name}</span>
                      <span className="text-xs text-secondary d-block" style={{ fontSize: '0.72rem' }}>
                        {account.displayEmail || account.email}
                      </span>
                      <span className="text-muted text-xs" style={{ fontSize: '0.65rem' }}>
                        {account.role}
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-muted" />
                </button>
              ))}
            </div>

            <div className="border-top pt-2 mt-1">
              <button
                type="button"
                className="btn btn-secondary btn-sm w-100 d-flex align-center justify-center gap-2"
                onClick={() => setUseCustomAccount(true)}
                disabled={loading}
              >
                <UserPlus size={14} />
                <span>Use another Gmail account</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="d-flex flex-column gap-2.5">
            <div className="form-group">
              <label className="form-label text-xs font-bold text-secondary">
                Gmail or Google Account Email *
              </label>
              <div className="d-flex align-center" style={{ position: 'relative' }}>
                <Mail size={15} className="text-muted" style={{ position: 'absolute', left: '10px' }} />
                <input
                  type="email"
                  className="form-input text-xs"
                  placeholder="yourname@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  style={{ paddingLeft: '32px' }}
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label text-xs font-bold text-secondary">
                Display Name (Optional)
              </label>
              <input
                type="text"
                className="form-input text-xs"
                placeholder="e.g. Jordan Woods"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>

            <div className="d-flex gap-2 mt-1">
              <button
                type="button"
                className="btn btn-secondary btn-sm flex-1"
                onClick={() => {
                  setUseCustomAccount(false);
                  setErrorMsg('');
                }}
                disabled={loading}
              >
                Back to Accounts
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm flex-1 d-flex align-center justify-center gap-1"
                disabled={loading}
              >
                <span>{loading ? 'Connecting...' : 'Continue to CareMesh'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </form>
        )}

        {/* Google OAuth Legal Footer */}
        <div className="mt-2 pt-2 border-top text-center">
          <p className="text-muted mb-0" style={{ fontSize: '0.68rem', lineHeight: '1.4' }}>
            <ShieldCheck size={12} className="d-inline mr-1 text-emerald" />
            To continue, Google will securely share your name, email address, and profile picture with CareMesh.
          </p>
        </div>
      </div>
    </Modal>
  );
};
