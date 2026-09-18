import { useState } from 'react';
import { useCareMesh } from '../../context/useCareMesh';
import { Modal } from '../common/Modal';
import { GoogleAccountPickerModal } from './GoogleAccountPickerModal';
import { 
  LogIn, 
  UserPlus, 
  AlertCircle, 
  Lock, 
  User
} from 'lucide-react';

export const AuthModal = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    closeAuthModal,
    loginUser,
    registerUser
  } = useCareMesh();

  const [activeTab, setActiveTab] = useState(authModalMode || 'login'); // 'login' | 'register'
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGooglePickerOpen, setIsGooglePickerOpen] = useState(false);

  // Sign In Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regHandle, setRegHandle] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('password123');
  const [regNeighborhood, setRegNeighborhood] = useState('Maplewood Central');
  const [regBio, setRegBio] = useState('');
  const [regSkills, setRegSkills] = useState('Community Logistics, First Aid');

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!loginIdentifier.trim()) {
      setErrorMsg('Please enter your handle, email, or user ID.');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await loginUser({
        login: loginIdentifier.trim(),
        password: loginPassword
      });
      closeAuthModal();
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regName.trim() || !regHandle.trim() || !regEmail.trim() || !regPassword) {
      setErrorMsg('Name, handle, email, and password are required.');
      return;
    }

    setLoading(true);
    try {
      const formattedHandle = regHandle.trim().startsWith('@') 
        ? regHandle.trim() 
        : `@${regHandle.trim()}`;

      const skillsArray = regSkills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      await registerUser({
        name: regName.trim(),
        handle: formattedHandle,
        email: regEmail.trim(),
        password: regPassword,
        bio: regBio.trim() || `Community member in ${regNeighborhood}.`,
        location: {
          address: `${regNeighborhood}, Maplewood`,
          neighborhood: regNeighborhood
        },
        skills: skillsArray
      });
      closeAuthModal();
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Handle or email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={closeAuthModal}
      title={activeTab === 'login' ? 'Sign In to CareMesh' : 'Create CareMesh Account'}
      maxWidth="540px"
      zIndex={1150}
    >
      <div className="d-flex flex-column gap-3">
        {/* Tab Switcher */}
        <div className="d-flex border-bottom pb-2 gap-2">
          <button
            type="button"
            className={`btn btn-sm flex-1 ${activeTab === 'login' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
            }}
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm flex-1 ${activeTab === 'register' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => {
              setActiveTab('register');
              setErrorMsg('');
            }}
          >
            <UserPlus size={15} />
            <span>Create Account</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose d-flex align-center gap-2 text-xs">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Continue with Google Button */}
        <div>
          <button
            type="button"
            className="btn btn-secondary w-100 d-flex align-center justify-center gap-2.5 p-2.5 font-medium card-interactive"
            style={{
              background: '#ffffff',
              border: '1px solid #dadce0',
              color: '#3c4043',
              boxShadow: '0 1px 2px rgba(60,64,67,0.08)',
              fontSize: '0.85rem'
            }}
            onClick={() => setIsGooglePickerOpen(true)}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Elegant Divider */}
          <div className="d-flex align-center gap-2 mt-3 mb-1">
            <div className="flex-1" style={{ height: '1px', background: 'var(--border-light)' }} />
            <span className="text-xs text-muted" style={{ fontSize: '0.72rem' }}>
              or continue with {activeTab === 'login' ? 'email' : 'account details'}
            </span>
            <div className="flex-1" style={{ height: '1px', background: 'var(--border-light)' }} />
          </div>
        </div>

        {/* SIGN IN TAB */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="d-flex flex-column gap-3">
            <div className="form-group">
              <label className="form-label text-xs font-bold text-secondary">
                Handle or Email
              </label>
              <div className="d-flex align-center" style={{ position: 'relative' }}>
                <User size={15} className="text-muted" style={{ position: 'absolute', left: '10px' }} />
                <input
                  type="text"
                  className="form-input text-xs"
                  placeholder="@mayalin or maya@example.com"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  style={{ paddingLeft: '32px' }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label text-xs font-bold text-secondary">
                Password
              </label>
              <div className="d-flex align-center" style={{ position: 'relative' }}>
                <Lock size={15} className="text-muted" style={{ position: 'absolute', left: '10px' }} />
                <input
                  type="password"
                  className="form-input text-xs"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{ paddingLeft: '32px' }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 mt-1"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* CREATE ACCOUNT TAB */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="d-flex flex-column gap-2.5">
            <div className="d-flex gap-2">
              <div className="form-group flex-1">
                <label className="form-label text-xs font-bold text-secondary">
                  Full Name *
                </label>
                <input
                  type="text"
                  className="form-input text-xs"
                  placeholder="e.g. Jordan Rivera"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group flex-1">
                <label className="form-label text-xs font-bold text-secondary">
                  Handle *
                </label>
                <input
                  type="text"
                  className="form-input text-xs"
                  placeholder="e.g. @jordan_r"
                  value={regHandle}
                  onChange={(e) => setRegHandle(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="d-flex gap-2">
              <div className="form-group flex-1">
                <label className="form-label text-xs font-bold text-secondary">
                  Email Address *
                </label>
                <input
                  type="email"
                  className="form-input text-xs"
                  placeholder="jordan@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group flex-1">
                <label className="form-label text-xs font-bold text-secondary">
                  Password *
                </label>
                <input
                  type="password"
                  className="form-input text-xs"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label text-xs font-bold text-secondary">
                Neighborhood / District
              </label>
              <input
                type="text"
                className="form-input text-xs"
                placeholder="e.g. Maplewood West"
                value={regNeighborhood}
                onChange={(e) => setRegNeighborhood(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label text-xs font-bold text-secondary">
                Skills & Capabilities (comma-separated)
              </label>
              <input
                type="text"
                className="form-input text-xs"
                placeholder="e.g. CERT Certified, Chainsaw Operator, CPR, Spanish"
                value={regSkills}
                onChange={(e) => setRegSkills(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label text-xs font-bold text-secondary">
                Short Bio / Neighborhood Focus
              </label>
              <textarea
                className="form-input text-xs"
                rows={2}
                placeholder="What community needs or resources do you focus on?"
                value={regBio}
                onChange={(e) => setRegBio(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 mt-2"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account & Sign In'}
            </button>
          </form>
        )}
      </div>

      <GoogleAccountPickerModal
        isOpen={isGooglePickerOpen}
        onClose={() => setIsGooglePickerOpen(false)}
        onSuccess={() => closeAuthModal()}
      />
    </Modal>
  );
};
export default AuthModal;
