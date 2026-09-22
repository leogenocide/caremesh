import { useState, useEffect, useRef } from 'react';
import { useCareMesh } from '../../context/useCareMesh';
import { Modal } from '../common/Modal';
import { 
  LogIn, 
  UserPlus, 
  AlertCircle, 
  Lock, 
  User,
  ArrowLeft,
  CheckCircle2,
  Info,
  Mail,
  KeyRound,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { CARTOON_AVATAR_PRESETS, DEFAULT_CARTOON_AVATAR } from '../../data/avatarPresets';

export const AuthModal = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    closeAuthModal,
    loginUser,
    registerUser,
    sendRegistrationVerificationCode,
    loginWithGoogle,
    forgotPassword,
    resetPassword,
    resetPasswordWithGoogle
  } = useCareMesh();

  const [activeTab, setActiveTab] = useState(authModalMode || 'login'); // 'login' | 'register'
  const [googleInfoMode, setGoogleInfoMode] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetMethod, setResetMethod] = useState('code'); // 'code' | 'google'
  const [resetStep, setResetStep] = useState(1); // 1 = enter email/verify, 2 = set new password
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [googleResetCredential, setGoogleResetCredential] = useState('');
  const [googleResetEmail, setGoogleResetEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Sign In Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regHandle, setRegHandle] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regNeighborhood, setRegNeighborhood] = useState('Maplewood Central');
  const [regBio, setRegBio] = useState('');
  const [regSkills, setRegSkills] = useState('Community Logistics, First Aid');
  const [regAvatar, setRegAvatar] = useState(DEFAULT_CARTOON_AVATAR);
  const [regStep, setRegStep] = useState(1); // 1 = Details & Avatar, 2 = Verify Email OTP
  const [regVerificationCode, setRegVerificationCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const googleButtonRef = useRef(null);
  const googleClientId = import.meta.env?.VITE_GOOGLE_CLIENT_ID || '';

  // Timer for registration OTP resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Initialize Google Identity Services if loaded and client ID configured
  useEffect(() => {
    if (!isAuthModalOpen) return;
    if (window.google?.accounts?.id && googleClientId && googleButtonRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            if (response?.credential) {
              setLoading(true);
              setErrorMsg('');
              try {
                await loginWithGoogle({ credential: response.credential });
                closeAuthModal();
              } catch (err) {
                setErrorMsg(err.message || 'Google sign-in failed. Please try again.');
              } finally {
                setLoading(false);
              }
            }
          }
        });
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'continue_with',
          shape: 'rectangular'
        });
      } catch (err) {
        console.warn('Google Identity Services setup:', err);
      }
    }
  }, [isAuthModalOpen, googleClientId, closeAuthModal, loginWithGoogle]);

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

  const handleGoogleClick = async () => {
    setErrorMsg('');
    if (window.google?.accounts?.id && googleClientId) {
      // Trigger Google One Tap / Account Chooser
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMomentum()) {
          setGoogleInfoMode(true);
        }
      });
      return;
    }

    // When Google Client ID is not configured in local environment
    setGoogleInfoMode(true);
  };

  const handleDemoGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Create a verifiable demo JWT token for development
      const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' })).replace(/=/g, '');
      const payload = btoa(JSON.stringify({
        email: 'google.neighbor@gmail.com',
        name: 'Jordan Rivera (Google)',
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        sub: 'google_demo_10928374'
      })).replace(/=/g, '');
      const testCredential = `test_google_${header}.${payload}.sig`;

      await loginWithGoogle({ credential: testCredential });
      closeAuthModal();
    } catch (err) {
      setErrorMsg(err.message || 'Demo Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const resetAllResetState = () => {
    setForgotMode(false);
    setResetStep(1);
    setResetMethod('code');
    setResetEmail('');
    setResetCode('');
    setResetNewPassword('');
    setResetConfirmPassword('');
    setGoogleResetCredential('');
    setGoogleResetEmail('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSendResetCode = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!resetEmail.trim()) {
      setErrorMsg('Please enter your Gmail address.');
      return;
    }
    setLoading(true);
    try {
      const res = await forgotPassword(resetEmail.trim());
      setSuccessMsg(res.message || 'Reset code sent to your Gmail inbox.');
      if (res.devCode) {
        setResetCode(res.devCode);
      }
      setResetStep(2);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeResetSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!resetCode.trim() || resetCode.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }
    if (!resetNewPassword || resetNewPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword({
        email: resetEmail.trim(),
        code: resetCode.trim(),
        newPassword: resetNewPassword
      });
      resetAllResetState();
      closeAuthModal();
    } catch (err) {
      setErrorMsg(err.message || 'Password reset failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerGoogleReset = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (window.google?.accounts?.id && googleClientId) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            if (response?.credential) {
              setGoogleResetCredential(response.credential);
              try {
                const payloadStr = atob(response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'));
                const payload = JSON.parse(payloadStr);
                setGoogleResetEmail(payload.email || 'Verified Google Account');
              } catch {
                setGoogleResetEmail('Verified Google Account');
              }
              setResetMethod('google');
              setResetStep(2);
            }
          }
        });
        window.google.accounts.id.prompt();
      } catch {
        setErrorMsg('Failed to initialize Google verification.');
      }
      return;
    }

    // In development mode without Google Client ID
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' })).replace(/=/g, '');
    const payload = btoa(JSON.stringify({
      email: 'caleb.zothansanga@gmail.com',
      name: 'Caleb Zothansanga (Verified Google)',
      sub: 'google_reset_demo_123'
    })).replace(/=/g, '');
    const testCredential = `test_google_${header}.${payload}.sig`;
    setGoogleResetCredential(testCredential);
    setGoogleResetEmail('caleb.zothansanga@gmail.com');
    setResetMethod('google');
    setResetStep(2);
  };

  const handleGoogleResetSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!resetNewPassword || resetNewPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await resetPasswordWithGoogle({
        credential: googleResetCredential,
        newPassword: resetNewPassword
      });
      resetAllResetState();
      closeAuthModal();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reset password with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestVerificationCode = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regName.trim() || !regHandle.trim() || !regEmail.trim() || !regPassword) {
      setErrorMsg('Name, handle, email, and password are required.');
      return;
    }

    if (regPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const formattedHandle = regHandle.trim().startsWith('@') 
        ? regHandle.trim() 
        : `@${regHandle.trim()}`;

      await sendRegistrationVerificationCode({
        email: regEmail.trim(),
        handle: formattedHandle
      });

      setRegStep(2);
      setResendCooldown(60);
      setSuccessMsg(`A 6-digit verification code has been sent to ${regEmail.trim()}. Please enter it below to activate your account.`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send verification code. Email or handle may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerificationCode = async () => {
    if (resendCooldown > 0 || loading) return;
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const formattedHandle = regHandle.trim().startsWith('@') 
        ? regHandle.trim() 
        : `@${regHandle.trim()}`;

      await sendRegistrationVerificationCode({
        email: regEmail.trim(),
        handle: formattedHandle
      });

      setResendCooldown(60);
      setSuccessMsg(`A fresh verification code has been sent to ${regEmail.trim()}.`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regVerificationCode.trim() || regVerificationCode.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code sent to your email.');
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
        verificationCode: regVerificationCode.trim(),
        avatar: regAvatar,
        bio: regBio.trim() || `Community member in ${regNeighborhood}.`,
        location: {
          address: `${regNeighborhood}, Maplewood`,
          neighborhood: regNeighborhood
        },
        skills: skillsArray
      });

      setRegStep(1);
      setRegVerificationCode('');
      closeAuthModal();
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={() => {
        setRegStep(1);
        setRegVerificationCode('');
        setErrorMsg('');
        setSuccessMsg('');
        closeAuthModal();
      }}
      title={
        forgotMode
          ? 'Reset Password via Gmail'
          : googleInfoMode 
            ? 'Single Sign-On with Google' 
            : activeTab === 'login' 
              ? 'Sign In to CareMesh' 
              : regStep === 2
                ? 'Verify Your Email Address'
                : 'Create CareMesh Account'
      }
      maxWidth="500px"
      zIndex={1150}
    >
      <div className="d-flex flex-column gap-3">
        {/* Tab Switcher (hidden in Google Info & Forgot Password Modes) */}
        {!googleInfoMode && !forgotMode && (
          <div className="d-flex border-bottom pb-2 gap-2">
            <button
              type="button"
              className={`btn btn-sm flex-1 ${activeTab === 'login' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => {
                setActiveTab('login');
                setErrorMsg('');
                setSuccessMsg('');
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
                setSuccessMsg('');
              }}
            >
              <UserPlus size={15} />
              <span>Create Account</span>
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose d-flex align-center gap-2 text-xs">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 d-flex align-center gap-2 text-xs">
            <CheckCircle2 size={16} className="flex-shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* FORGOT / RESET PASSWORD VIEW */}
        {forgotMode && (
          <div className="d-flex flex-column gap-3">
            {/* Reset Step 1: Verification Options */}
            {resetStep === 1 && (
              <div className="d-flex flex-column gap-2.5">
                <div className="p-3 rounded bg-blue-50 border border-blue-200 text-blue-900 d-flex flex-column gap-1.5 text-xs">
                  <div className="d-flex align-center gap-2 font-bold">
                    <KeyRound size={16} className="text-primary" />
                    <span>Reset Your Password Using Gmail</span>
                  </div>
                  <p className="m-0 text-muted" style={{ lineHeight: 1.4 }}>
                    Verify your identity either using 1-click Google OAuth verification or by requesting a 6-digit reset code to your Gmail address.
                  </p>
                </div>

                {/* 1-Click Google Verification Option */}
                <button
                  type="button"
                  className="btn btn-secondary w-100 d-flex align-center justify-center gap-2 p-2.5 font-medium card-interactive text-xs"
                  style={{
                    background: '#ffffff',
                    border: '1px solid #dadce0',
                    color: '#3c4043',
                    boxShadow: '0 1px 2px rgba(60,64,67,0.08)'
                  }}
                  onClick={handleTriggerGoogleReset}
                  disabled={loading}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Verify with Google (1-Click Instant Reset)</span>
                </button>

                <div className="d-flex align-center gap-2 my-1">
                  <div className="flex-1" style={{ height: '1px', background: 'var(--border-light)' }} />
                  <span className="text-xs text-muted" style={{ fontSize: '0.72rem' }}>
                    or receive a 6-digit code via Gmail
                  </span>
                  <div className="flex-1" style={{ height: '1px', background: 'var(--border-light)' }} />
                </div>

                {/* 6-Digit Email Form */}
                <form onSubmit={handleSendResetCode} className="d-flex flex-column gap-2.5">
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-secondary">
                      Registered Gmail Address
                    </label>
                    <div className="d-flex align-center" style={{ position: 'relative' }}>
                      <Mail size={15} className="text-muted" style={{ position: 'absolute', left: '10px' }} />
                      <input
                        type="email"
                        className="form-input text-xs"
                        placeholder="yourname@gmail.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        style={{ paddingLeft: '32px' }}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                  >
                    {loading ? 'Sending Code...' : 'Send 6-Digit Reset Code'}
                  </button>
                </form>
              </div>
            )}

            {/* Reset Step 2: Set New Password via Code */}
            {resetStep === 2 && resetMethod === 'code' && (
              <form onSubmit={handleCodeResetSubmit} className="d-flex flex-column gap-3">
                <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  Enter the 6-digit code sent to <strong>{resetEmail}</strong> and choose your new password.
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold text-secondary">
                    6-Digit Reset Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    className="form-input text-xs font-mono font-bold"
                    placeholder="123456"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/[^0-9]/g, ''))}
                    style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '1.1rem' }}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold text-secondary">
                    New Password (min 8 characters)
                  </label>
                  <div className="d-flex align-center" style={{ position: 'relative' }}>
                    <Lock size={15} className="text-muted" style={{ position: 'absolute', left: '10px' }} />
                    <input
                      type="password"
                      className="form-input text-xs"
                      placeholder="••••••••"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      style={{ paddingLeft: '32px' }}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold text-secondary">
                    Confirm New Password
                  </label>
                  <div className="d-flex align-center" style={{ position: 'relative' }}>
                    <Lock size={15} className="text-muted" style={{ position: 'absolute', left: '10px' }} />
                    <input
                      type="password"
                      className="form-input text-xs"
                      placeholder="••••••••"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      style={{ paddingLeft: '32px' }}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? 'Resetting Password...' : 'Reset Password & Sign In'}
                </button>

                <button
                  type="button"
                  className="btn btn-ghost w-100 text-xs text-muted"
                  onClick={() => setResetStep(1)}
                >
                  Didn't receive a code? Re-enter email
                </button>
              </form>
            )}

            {/* Reset Step 2: Set New Password via Google OAuth verification */}
            {resetStep === 2 && resetMethod === 'google' && (
              <form onSubmit={handleGoogleResetSubmit} className="d-flex flex-column gap-3">
                <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs d-flex align-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
                  <span>Google identity verified for <strong>{googleResetEmail}</strong>.</span>
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold text-secondary">
                    New Password (min 8 characters)
                  </label>
                  <div className="d-flex align-center" style={{ position: 'relative' }}>
                    <Lock size={15} className="text-muted" style={{ position: 'absolute', left: '10px' }} />
                    <input
                      type="password"
                      className="form-input text-xs"
                      placeholder="••••••••"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      style={{ paddingLeft: '32px' }}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold text-secondary">
                    Confirm New Password
                  </label>
                  <div className="d-flex align-center" style={{ position: 'relative' }}>
                    <Lock size={15} className="text-muted" style={{ position: 'absolute', left: '10px' }} />
                    <input
                      type="password"
                      className="form-input text-xs"
                      placeholder="••••••••"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      style={{ paddingLeft: '32px' }}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? 'Updating Password...' : 'Save New Password & Sign In'}
                </button>
              </form>
            )}

            <button
              type="button"
              className="btn btn-ghost w-100 d-flex align-center justify-center gap-1 text-xs mt-1"
              onClick={resetAllResetState}
            >
              <ArrowLeft size={14} />
              <span>Back to standard login</span>
            </button>
          </div>
        )}

        {/* GOOGLE SSO INFO / DEMO PANEL */}
        {googleInfoMode && (
          <div className="d-flex flex-column gap-3">
            <div className="p-3 rounded bg-blue-50 border border-blue-200 text-blue-900 d-flex flex-column gap-2 text-xs">
              <div className="d-flex align-center gap-2 font-bold">
                <CheckCircle2 size={16} className="text-primary" />
                <span>Google Single Sign-On (OAuth 2.0)</span>
              </div>
              <p className="m-0 text-muted" style={{ lineHeight: 1.5 }}>
                Google Sign-In uses Google Identity Services. Your identity is verified directly by Google (accounts.google.com) — no separate CareMesh password is required.
              </p>
              {!googleClientId && (
                <div className="p-2.5 bg-white rounded border border-blue-100 text-xs text-secondary mt-1">
                  <div className="d-flex align-center gap-1 font-semibold text-primary mb-1">
                    <Info size={13} />
                    <span>Google Identity Services Config</span>
                  </div>
                  <span style={{ lineHeight: 1.4, display: 'block' }}>
                    To enable live Google authentication in production, add <code>VITE_GOOGLE_CLIENT_ID</code> to your environment. In development mode, you can sign in using a verified Google test account below, or log in with your handle & password.
                  </span>
                </div>
              )}
            </div>

            <div className="d-flex flex-column gap-2 mt-1">
              <button
                type="button"
                className="btn btn-primary w-100 d-flex align-center justify-center gap-2"
                onClick={handleDemoGoogleSignIn}
                disabled={loading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>{loading ? 'Authenticating...' : 'Sign In as Verified Google User'}</span>
              </button>

              <button
                type="button"
                className="btn btn-ghost w-100 d-flex align-center justify-center gap-1 text-xs"
                onClick={() => {
                  setGoogleInfoMode(false);
                  setErrorMsg('');
                }}
              >
                <ArrowLeft size={14} />
                <span>Back to standard login</span>
              </button>
            </div>
          </div>
        )}

        {/* STANDARD SIGN IN TAB */}
        {!googleInfoMode && !forgotMode && activeTab === 'login' && (
          <div className="d-flex flex-column gap-3">
            {/* Continue with Google Option */}
            <div>
              <div ref={googleButtonRef} className="w-100"></div>
              {(!googleClientId || !window.google?.accounts?.id) && (
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
                  onClick={handleGoogleClick}
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
              )}

              <div className="d-flex align-center gap-2 mt-3 mb-1">
                <div className="flex-1" style={{ height: '1px', background: 'var(--border-light)' }} />
                <span className="text-xs text-muted" style={{ fontSize: '0.72rem' }}>
                  or sign in with handle / email & password
                </span>
                <div className="flex-1" style={{ height: '1px', background: 'var(--border-light)' }} />
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="d-flex flex-column gap-3">
              <div className="form-group">
                <label className="form-label text-xs font-bold text-secondary">
                  Handle or Email / Gmail
                </label>
                <div className="d-flex align-center" style={{ position: 'relative' }}>
                  <User size={15} className="text-muted" style={{ position: 'absolute', left: '10px' }} />
                  <input
                    type="text"
                    className="form-input text-xs"
                    placeholder="@mayalin or user@gmail.com"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    style={{ paddingLeft: '32px' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="d-flex justify-between align-center mb-1">
                  <label className="form-label text-xs font-bold text-secondary m-0">
                    Password
                  </label>
                  <button
                    type="button"
                    className="btn-link text-xs text-primary"
                    style={{ fontSize: '0.72rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    onClick={() => {
                      setForgotMode(true);
                      setResetStep(1);
                      setResetMethod('code');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
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
          </div>
        )}

        {/* CREATE ACCOUNT TAB */}
        {!googleInfoMode && !forgotMode && activeTab === 'register' && (
          <div>
            {/* Step 1: Account Information & Cartoon Avatar Selection */}
            {regStep === 1 && (
              <form onSubmit={handleRequestVerificationCode} className="d-flex flex-column gap-2.5">
                {/* Cartoon Avatar Picker */}
                <div className="p-2.5 rounded border mb-1" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-light)' }}>
                  <div className="d-flex align-center justify-between mb-2">
                    <label className="text-xs font-bold text-secondary text-uppercase d-flex align-center gap-1 m-0">
                      <Sparkles size={13} className="text-amber" />
                      <span>Choose Your Cartoon Persona</span>
                    </label>
                    <span className="text-xs text-muted" style={{ fontSize: '0.72rem' }}>
                      {CARTOON_AVATAR_PRESETS.find(p => p.url === regAvatar)?.label || 'Custom Cartoon'}
                    </span>
                  </div>
                  <div 
                    className="d-flex gap-2 flex-wrap justify-between" 
                    style={{ maxHeight: '130px', overflowY: 'auto', padding: '2px' }}
                  >
                    {CARTOON_AVATAR_PRESETS.map(preset => {
                      const isSelected = regAvatar === preset.url;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          className="btn btn-ghost p-0 cursor-pointer"
                          style={{
                            position: 'relative',
                            borderRadius: '50%',
                            border: isSelected ? '2.5px solid var(--primary-600)' : '2px solid transparent',
                            padding: '2px',
                            background: isSelected ? 'rgba(2, 132, 199, 0.12)' : 'transparent',
                            transition: 'all 0.15s ease'
                          }}
                          onClick={() => setRegAvatar(preset.url)}
                          title={`${preset.label} • ${preset.role}`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '50%',
                              objectFit: 'cover'
                            }}
                          />
                          {isSelected && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '-2px',
                                right: '-2px',
                                background: 'var(--primary-600)',
                                color: '#ffffff',
                                borderRadius: '50%',
                                width: '15px',
                                height: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.55rem'
                              }}
                            >
                              ✓
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

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
                      placeholder="name@gmail.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group flex-1">
                    <label className="form-label text-xs font-bold text-secondary">
                      Password (min 8 chars) *
                    </label>
                    <input
                      type="password"
                      className="form-input text-xs"
                      placeholder="Create secure password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold text-secondary">
                    Neighborhood Area
                  </label>
                  <input
                    type="text"
                    className="form-input text-xs"
                    placeholder="e.g. Maplewood North"
                    value={regNeighborhood}
                    onChange={(e) => setRegNeighborhood(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold text-secondary">
                    Skills / Mutual Aid Offerings
                  </label>
                  <input
                    type="text"
                    className="form-input text-xs"
                    placeholder="e.g. First Aid, Chainsaw, Solar Power"
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
                  className="btn btn-primary w-100 mt-2 d-flex align-center justify-center gap-1.5"
                  disabled={loading}
                >
                  <Mail size={15} />
                  <span>{loading ? 'Sending Verification Code...' : 'Continue to Email Verification'}</span>
                </button>
                <span className="text-xs text-muted text-center" style={{ fontSize: '0.72rem' }}>
                  A 6-digit email verification code will be sent to activate your account.
                </span>
              </form>
            )}

            {/* Step 2: Email Verification OTP Code Input */}
            {regStep === 2 && (
              <form onSubmit={handleVerifyAndRegister} className="d-flex flex-column gap-3 py-1">
                <div 
                  className="p-3 rounded border text-center d-flex flex-column align-center gap-2"
                  style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-light)' }}
                >
                  <div 
                    style={{ 
                      width: '46px', 
                      height: '46px', 
                      borderRadius: '50%', 
                      background: 'rgba(2, 132, 199, 0.12)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: 'var(--primary-600)' 
                    }}
                  >
                    <Mail size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-primary mb-1">Check Your Email</h4>
                    <p className="text-xs text-muted mb-0" style={{ lineHeight: 1.5 }}>
                      We sent a 6-digit verification code to <strong>{regEmail}</strong>. Enter it below to activate your CareMesh account.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-link text-xs text-primary"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    onClick={() => {
                      setRegStep(1);
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                  >
                    Wrong email address? Change details
                  </button>
                </div>

                <div className="form-group text-center">
                  <label className="form-label text-xs font-bold text-secondary d-block mb-1.5">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    maxLength={6}
                    placeholder="••••••"
                    value={regVerificationCode}
                    onChange={(e) => setRegVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                    style={{ 
                      letterSpacing: '6px', 
                      textAlign: 'center', 
                      fontSize: '1.25rem', 
                      fontWeight: 700,
                      maxWidth: '260px',
                      margin: '0 auto',
                      display: 'block'
                    }}
                    required
                    autoFocus
                  />
                  <span className="text-xs text-muted mt-1 d-block" style={{ fontSize: '0.72rem' }}>
                    Code expires in 15 minutes.
                  </span>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 mt-1 d-flex align-center justify-center gap-1.5"
                  disabled={loading || regVerificationCode.trim().length !== 6}
                >
                  <ShieldCheck size={16} />
                  <span>{loading ? 'Verifying & Creating Account...' : 'Verify Email & Complete Registration'}</span>
                </button>

                <div className="d-flex justify-between align-center pt-2 border-top">
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs text-muted"
                    onClick={() => {
                      setRegStep(1);
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                  >
                    ← Back to Edit Info
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs text-primary font-medium"
                    onClick={handleResendVerificationCode}
                    disabled={resendCooldown > 0 || loading}
                  >
                    {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
export default AuthModal;
