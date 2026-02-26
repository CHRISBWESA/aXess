// src/pages/Settings.tsx
import React, { useState, useEffect } from 'react';
import { Icons } from '../components/icons';
import { Eye, EyeOff, Check, X, Shield, ShieldCheck, Fingerprint } from 'lucide-react';
import TwoFactorSetup from '../components/TwoFactorSetup';
import { authAPI } from '../lib/api';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

// ── helpers ────────────────────────────────────────────────────────────────
const getToken = (): string | null => {
  try { return localStorage.getItem('authToken'); } catch { return null; }
};

const checkReqs = (pw: string) => ({
  minLength:  pw.length >= 8,
  hasUpper:  /[A-Z]/.test(pw),
  hasLower:  /[a-z]/.test(pw),
  hasNumber: /[0-9]/.test(pw),
  hasSpecial:/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw),
});

// ── Settings component ─────────────────────────────────────────────────────
const Settings: React.FC = () => {

  // ── theme ─────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [prefersDark, setPrefersDark] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );

  const applyTheme = (newTheme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (newTheme === 'system') {
      root.classList.toggle('dark', prefers);
      root.setAttribute('data-theme', prefers ? 'dark' : 'light');
    } else {
      root.classList.toggle('dark', newTheme === 'dark');
      root.setAttribute('data-theme', newTheme);
    }
    try { localStorage.setItem('theme', newTheme); } catch {}
  };

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null) ?? 'system';
    setTheme(saved);
    applyTheme(saved);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      setPrefersDark(e.matches);
      if ((localStorage.getItem('theme') ?? 'system') === 'system') applyTheme('system');
    };
    if (typeof mq.addEventListener === 'function') mq.addEventListener('change', onChange);
    else (mq as any).addListener(onChange);
    return () => {
      if (typeof mq.removeEventListener === 'function') mq.removeEventListener('change', onChange);
      else (mq as any).removeListener(onChange);
    };
  }, []);

  const handleThemeChange = (t: 'light' | 'dark' | 'system') => { setTheme(t); applyTheme(t); };
  const getNextTheme = (c: 'light' | 'dark' | 'system') =>
    c === 'system' ? 'dark' : c === 'dark' ? 'light' : 'system';
  const resolvedTheme = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
  const ThemeIcon = theme === 'system' ? Icons.Monitor : resolvedTheme === 'dark' ? Icons.Moon : Icons.Sun;
  const themeLabel = theme === 'system' ? 'System' : theme === 'dark' ? 'Dark Mode' : 'Light Mode';

  // ── profile ───────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({ fullName: '', email: '', phone: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        const u = JSON.parse(stored);
        setProfile({
          fullName: u.fullName || '',
          email:    u.email    || '',
          phone:    u.phone    || '',
        });
      }
    } catch {}
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    if (!profile.fullName.trim()) {
      setProfileMsg({ type: 'err', text: 'Full name is required.' });
      return;
    }
    setProfileLoading(true);
    try {
      const token = getToken();
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: profile.fullName.trim(),
          phone:    profile.phone.trim(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.msg || data.message || 'Failed to save profile');

      // sync localStorage so Header / other components see updated name
      try {
        const stored = localStorage.getItem('currentUser');
        const u = stored ? JSON.parse(stored) : {};
        localStorage.setItem('currentUser', JSON.stringify({
          ...u,
          fullName: profile.fullName.trim(),
          phone:    profile.phone.trim(),
        }));
      } catch {}

      setProfileMsg({ type: 'ok', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setProfileMsg({ type: 'err', text: err.message || 'Failed to save profile.' });
    } finally {
      setProfileLoading(false);
    }
  };

  // ── password change (inline – no navigation) ──────────────────────────────
  const [showPwForm, setShowPwForm]           = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent]         = useState(false);
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [pwLoading, setPwLoading]             = useState(false);
  const [pwMsg, setPwMsg]                     = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [showPwReqs, setShowPwReqs]           = useState(false);
  const [pwReqs, setPwReqs]                   = useState(checkReqs(''));

  useEffect(() => {
    setShowPwReqs(newPassword.length > 0);
    setPwReqs(checkReqs(newPassword));
  }, [newPassword]);

  const isPwStrong    = Object.values(pwReqs).every(Boolean);
  const passwordMatch = newPassword === confirmPassword && newPassword.length > 0;

  const resetPwForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPwMsg(null);
    setShowPwForm(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (!currentPassword.trim()) { setPwMsg({ type: 'err', text: 'Enter your current password.' }); return; }
    if (!isPwStrong)             { setPwMsg({ type: 'err', text: 'New password does not meet requirements.' }); return; }
    if (!passwordMatch)          { setPwMsg({ type: 'err', text: 'Passwords do not match.' }); return; }

    setPwLoading(true);
    try {
      const token = getToken();
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: currentPassword.trim(),
          newPassword:     newPassword.trim(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.msg || data.message || 'Failed to change password');

      // Show success, clear form, collapse – user stays on Settings page
      setPwMsg({ type: 'ok', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPwForm(false);
    } catch (err: any) {
      setPwMsg({ type: 'err', text: err.message || 'Failed to change password.' });
    } finally {
      setPwLoading(false);
    }
  };

  // ── notifications (local state only – extend with API if needed) ──────────
  const [notif, setNotif] = useState({
    emailNew:    true,
    pushReturns: true,
    dailySummary: false,
  });

  // ── 2FA ───────────────────────────────────────────────────────────────────
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2FAModal, setShow2FAModal]         = useState(false);

  // ── FINGERPRINT ───────────────────────────────────────────────────────────
  const [hasFingerprint, setHasFingerprint] = useState(false);
  const [fingerprintLoading, setFingerprintLoading] = useState(false);
  const [fingerprintMessage, setFingerprintMessage] = useState('');
  const [webauthnSupported, setWebauthnSupported] = useState<boolean | null>(null);
  const [showFpGuide, setShowFpGuide] = useState(false);

  // Check WebAuthn browser support on mount
  useEffect(() => {
    const checkSupport = async () => {
      try {
        const supported = !!(
          window.PublicKeyCredential &&
          typeof window.PublicKeyCredential === 'function' &&
          await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        );
        setWebauthnSupported(supported);
      } catch {
        setWebauthnSupported(false);
      }
    };
    checkSupport();
  }, []);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('currentUser') || '{}');
      setTwoFactorEnabled(!!u.twoFactorEnabled);

      // Check fingerprint status
      authAPI.checkFingerprint().then(result => {
        setHasFingerprint(result.hasFingerprint || false);
      }).catch(err => {
        console.error('Failed to check fingerprint:', err);
        setHasFingerprint(false);
      });
    } catch {}
  }, []);

  // ── FINGERPRINT HANDLERS ──────────────────────────────────────────────────
  const handleRegisterFingerprint = async () => {
    try {
      setFingerprintLoading(true);
      setFingerprintMessage('');

      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const email = user.email;

      if (!email) {
        throw new Error('Email not found. Please log in again.');
      }

      // Step 1: Get registration options from server
      // Server returns { options, userId } — options is the WebAuthn challenge object
      const optionsResponse = await authAPI.webauthnRegisterStart(email);

      if (!optionsResponse || !optionsResponse.options) {
        throw new Error(
          optionsResponse?.message ||
          'Server did not return registration options. Make sure @simplewebauthn/server is installed on the backend.'
        );
      }

      // Step 2: Prompt device for fingerprint scan
      let credential;
      try {
        credential = await startRegistration(optionsResponse.options);
      } catch (regError: any) {
        if (regError.name === 'NotAllowedError') {
          throw new Error('Fingerprint registration was cancelled or timed out. Please try again.');
        }
        if (regError.name === 'InvalidStateError') {
          throw new Error('This device fingerprint is already registered for your account.');
        }
        throw new Error('Fingerprint registration failed: ' + regError.message);
      }

      // Step 3: Send credential to server for verification and storage
      // Backend returns { success, message } (not { verified })
      const verifyResponse = await authAPI.webauthnRegisterFinish(email, credential);

      if (verifyResponse.success || verifyResponse.verified) {
        setHasFingerprint(true);
        setFingerprintMessage('✅ Fingerprint registered successfully! You can now use it for quick check-in.');
      } else {
        throw new Error(verifyResponse.message || 'Fingerprint registration could not be verified. Please try again.');
      }
    } catch (err: any) {
      console.error('Fingerprint registration error:', err);
      setFingerprintMessage('❌ ' + err.message);
    } finally {
      setFingerprintLoading(false);
    }
  };

  const handleTestFingerprint = async () => {
    try {
      setFingerprintLoading(true);
      setFingerprintMessage('');

      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const email = user.email;

      if (!email) {
        throw new Error('Email not found');
      }

      // Start authentication — server now returns { options, userId }
      const optionsResponse = await authAPI.webauthnAuthStart(email);

      if (!optionsResponse || !optionsResponse.options) {
        // Server returned 404 or error — credential not found in DB
        throw new Error(
          optionsResponse?.message ||
          'No fingerprint credential found on server. Please re-register your fingerprint.'
        );
      }

      // Prompt device for fingerprint scan
      let credential;
      try {
        credential = await startAuthentication(optionsResponse.options);
      } catch (authError: any) {
        if (authError.name === 'NotAllowedError') {
          throw new Error('Fingerprint test was cancelled or timed out. Please try again.');
        }
        if (authError.name === 'NotFoundError') {
          throw new Error(
            'No matching fingerprint found on this device. ' +
            'This can happen if you registered on a different device or browser. ' +
            'Try clicking "Re-register Fingerprint" to register on this device.'
          );
        }
        throw new Error('Fingerprint test failed: ' + authError.message);
      }

      // Verify fingerprint with server
      const verifyResponse = await authAPI.webauthnAuthFinish(optionsResponse.userId, credential);

      if (verifyResponse.verified || verifyResponse.success) {
        setFingerprintMessage('✅ Fingerprint test successful! Your fingerprint is working correctly on this device.');
      } else {
        throw new Error(verifyResponse.message || 'Fingerprint not recognized by the server. Please re-register.');
      }
    } catch (err: any) {
      console.error('Fingerprint test error:', err);
      setFingerprintMessage('❌ ' + err.message);
    } finally {
      setFingerprintLoading(false);
    }
  };

  // ── requirement rows ──────────────────────────────────────────────────────
  const reqRows = [
    { label: 'At least 8 characters',          met: pwReqs.minLength  },
    { label: 'One uppercase letter (A–Z)',      met: pwReqs.hasUpper   },
    { label: 'One lowercase letter (a–z)',      met: pwReqs.hasLower   },
    { label: 'One number (0–9)',                met: pwReqs.hasNumber  },
    { label: 'One special character (!@#$…)',   met: pwReqs.hasSpecial },
  ];

  return (
    <>
      <h1 className="section-title">Settings</h1>

      <div className="settings-grid">

        {/* ── Profile card ────────────────────────────────────────────────── */}
        <div className="settings-card">
          <div className="card-header">
            <Icons.Users size={20} />
            <h2>Profile</h2>
          </div>

          {profileMsg && (
            <div style={{
              padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px',
              background: profileMsg.type === 'ok' ? '#d1fae5' : '#fee2e2',
              color:      profileMsg.type === 'ok' ? '#065f46' : '#b91c1c',
            }}>
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleProfileSave}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={profile.fullName}
                onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))}
                placeholder="Your full name"
                required
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={profile.email}
                disabled
                style={{ opacity: 0.55, cursor: 'not-allowed' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--muted-text)', marginTop: '4px', display: 'block' }}>
                Email cannot be changed here.
              </span>
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                placeholder="+255 700 123 456"
              />
            </div>
            <button
              type="submit"
              className="primary-btn"
              disabled={profileLoading}
              style={{ width: '100%', opacity: profileLoading ? 0.7 : 1 }}
            >
              {profileLoading ? 'Saving…' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* ── Notifications card ───────────────────────────────────────────── */}
        <div className="settings-card">
          <div className="card-header">
            <Icons.Bell size={20} />
            <h2>Notifications</h2>
          </div>
          <label className="toggle-row">
            <input type="checkbox" className="toggle-checkbox"
              checked={notif.emailNew}
              onChange={e => setNotif(n => ({ ...n, emailNew: e.target.checked }))} />
            <span>Email notifications for new requests</span>
          </label>
          <label className="toggle-row">
            <input type="checkbox" className="toggle-checkbox"
              checked={notif.pushReturns}
              onChange={e => setNotif(n => ({ ...n, pushReturns: e.target.checked }))} />
            <span>Push alerts for key returns / sign-outs</span>
          </label>
          <label className="toggle-row">
            <input type="checkbox" className="toggle-checkbox"
              checked={notif.dailySummary}
              onChange={e => setNotif(n => ({ ...n, dailySummary: e.target.checked }))} />
            <span>Daily summary email report</span>
          </label>
        </div>

        {/* ── Appearance card ──────────────────────────────────────────────── */}
        <div className="settings-card">
          <div className="card-header">
            <Icons.Paintbrush size={20} />
            <h2>Appearance</h2>
          </div>
          <button
            className="primary-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
            onClick={() => handleThemeChange(getNextTheme(theme))}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <ThemeIcon size={18} />
            </span>
            <span>{themeLabel}</span>
          </button>
        </div>

        {/* ── Security card ────────────────────────────────────────────────── */}
        <div className="settings-card">
          <div className="card-header">
            <Icons.Lock size={20} />
            <h2>Security</h2>
          </div>

          {/* Success message shown after form collapses */}
          {pwMsg && !showPwForm && (
            <div style={{
              padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px',
              background: pwMsg.type === 'ok' ? '#d1fae5' : '#fee2e2',
              color:      pwMsg.type === 'ok' ? '#065f46' : '#b91c1c',
            }}>
              {pwMsg.text}
            </div>
          )}

          {!showPwForm ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                className="secondary-btn"
                style={{ width: '100%', textAlign: 'left', margin: 0 }}
                onClick={() => { setShowPwForm(true); setPwMsg(null); }}
              >
                Change Password
              </button>

              {/* 2FA button — shows status and opens modal */}
              <button
                className={twoFactorEnabled ? 'primary-btn' : 'secondary-btn'}
                style={{ width: '100%', textAlign: 'left', margin: 0,
                  display: 'flex', alignItems: 'center', gap: '10px' }}
                onClick={() => !twoFactorEnabled && setShow2FAModal(true)}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  {twoFactorEnabled
                    ? <ShieldCheck size={16} />
                    : <Shield size={16} />}
                </span>
                <span style={{ flex: 1 }}>
                  {twoFactorEnabled
                    ? 'Two-Factor Authentication — Enabled ✓'
                    : 'Enable Two-Factor Authentication'}
                </span>
              </button>

              {twoFactorEnabled && (
                <p style={{ fontSize: '12px', color: '#10b981', marginTop: '2px', marginLeft: '4px' }}>
                  Your account is protected with 2FA.
                </p>
              )}

              {/* ══════════════════════════════════════════════════════════════
                  FINGERPRINT AUTHENTICATION SECTION
              ══════════════════════════════════════════════════════════════ */}
              <div style={{ 
                marginTop: '24px', 
                paddingTop: '24px', 
                borderTop: '1px solid #e5e7eb' 
              }}>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: 600, 
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Fingerprint size={18} />
                  Fingerprint Authentication
                </h3>
                
                {hasFingerprint ? (
                  <>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      marginBottom: '6px', fontSize: '14px', color: '#059669', fontWeight: 600,
                    }}>
                      <Check size={16} />
                      Fingerprint registered and active on server
                    </div>
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px', lineHeight: 1.5 }}>
                      If the test fails with "No matching fingerprint", your credential was saved from a
                      different device or browser. Click <strong>Re-register on This Device</strong> to add this one.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={handleTestFingerprint}
                        disabled={fingerprintLoading}
                        className="primary-btn"
                        style={{
                          opacity: fingerprintLoading ? 0.6 : 1,
                          cursor: fingerprintLoading ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', gap: '8px',
                        }}
                      >
                        <Fingerprint size={16} />
                        {fingerprintLoading ? 'Scanning…' : 'Test Fingerprint'}
                      </button>
                      <button
                        type="button"
                        onClick={handleRegisterFingerprint}
                        disabled={fingerprintLoading}
                        className="secondary-btn"
                        style={{
                          opacity: fingerprintLoading ? 0.6 : 1,
                          cursor: fingerprintLoading ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', gap: '6px',
                        }}
                      >
                        <Fingerprint size={14} />
                        Re-register on This Device
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Browser / device support warning */}
                    {webauthnSupported === false && (
                      <div style={{
                        padding: '12px 16px', borderRadius: '10px', marginBottom: '16px',
                        background: '#fef3c7', border: '1px solid #fcd34d',
                        fontSize: '13px', color: '#92400e', lineHeight: 1.6,
                      }}>
                        <strong>⚠️ Device not supported</strong><br />
                        Your browser or device does not support biometric authentication.
                        Use <strong>Chrome or Edge on Windows 10/11</strong> (with Windows Hello set up),
                        or <strong>Safari on macOS/iOS</strong> with Touch ID enabled.
                      </div>
                    )}

                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px', lineHeight: 1.6 }}>
                      Register your device fingerprint / face / PIN to enable <strong>1-tap check-in</strong> at the Reports page.
                    </p>

                    {/* Step-by-step guide toggle */}
                    <button
                      type="button"
                      onClick={() => setShowFpGuide(v => !v)}
                      style={{
                        background: 'none', border: 'none', padding: 0,
                        color: '#6366f1', fontSize: '13px', fontWeight: 600,
                        cursor: 'pointer', marginBottom: '14px',
                        display: 'flex', alignItems: 'center', gap: '5px',
                      }}
                    >
                      {showFpGuide ? '▾' : '▸'} How to register your fingerprint
                    </button>

                    {showFpGuide && (
                      <div style={{
                        background: '#f8fafc', borderRadius: '10px',
                        padding: '14px 16px', marginBottom: '16px',
                        border: '1px solid #e2e8f0', fontSize: '13px',
                        color: '#374151', lineHeight: 1.7,
                      }}>
                        <div style={{ fontWeight: 700, marginBottom: '8px', color: '#1e293b' }}>
                          📋 Before you click Register:
                        </div>
                        <ol style={{ margin: 0, paddingLeft: '18px' }}>
                          <li style={{ marginBottom: '6px' }}>
                            <strong>Windows Hello:</strong> Go to <em>Settings → Accounts → Sign-in options</em> and make sure <em>Fingerprint recognition</em> or <em>Face recognition</em> is set up.
                          </li>
                          <li style={{ marginBottom: '6px' }}>
                            <strong>Use Chrome or Edge</strong> — Firefox does not support platform biometrics on Windows.
                          </li>
                          <li style={{ marginBottom: '6px' }}>
                            <strong>When the browser prompts you</strong>, select <em>"This device"</em> or <em>"Windows Hello"</em> — do <em>NOT</em> choose "Google Password Manager" or "Phone".
                          </li>
                          <li style={{ marginBottom: '6px' }}>
                            <strong>Touch the fingerprint sensor</strong> or look at the camera when Windows Hello activates.
                          </li>
                          <li>
                            <strong>On mobile</strong> (Android Chrome / iOS Safari): you will be prompted for your fingerprint or face automatically.
                          </li>
                        </ol>
                        <div style={{
                          marginTop: '10px', padding: '8px 12px',
                          background: '#fef3c7', borderRadius: '8px',
                          fontSize: '12px', color: '#92400e',
                        }}>
                          ⚠️ <strong>Important:</strong> You must register on <em>every device</em> you want to use for check-in. Credentials are stored per-device and per-browser.
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleRegisterFingerprint}
                      disabled={fingerprintLoading || webauthnSupported === false}
                      className="primary-btn"
                      style={{
                        opacity: (fingerprintLoading || webauthnSupported === false) ? 0.6 : 1,
                        cursor: (fingerprintLoading || webauthnSupported === false) ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px',
                      }}
                    >
                      <Fingerprint size={16} />
                      {fingerprintLoading ? 'Waiting for biometric scan…' : 'Register Fingerprint / Face'}
                    </button>
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                      When prompted by the browser, choose <strong>"This device"</strong> or <strong>"Windows Hello"</strong> — not Google Password Manager.
                    </p>
                  </>
                )}

                {/* Result message */}
                {fingerprintMessage && (
                  <div style={{
                    marginTop: '16px', padding: '12px 16px',
                    background: fingerprintMessage.startsWith('✅') ? '#d1fae5' : '#fee2e2',
                    color: fingerprintMessage.startsWith('✅') ? '#065f46' : '#b91c1c',
                    borderRadius: '8px', fontSize: '14px', lineHeight: 1.6,
                    border: `1px solid ${fingerprintMessage.startsWith('✅') ? '#6ee7b7' : '#fca5a5'}`,
                  }}>
                    {fingerprintMessage}
                    {/* Show re-register suggestion on common errors */}
                    {fingerprintMessage.includes('different device') || fingerprintMessage.includes('No matching') ? (
                      <div style={{ marginTop: '8px', fontSize: '13px' }}>
                        👉 Click <strong>Re-register Fingerprint</strong> above to register on this device.
                      </div>
                    ) : null}
                  </div>
                )}

                <div style={{
                  marginTop: '16px', padding: '12px',
                  background: '#f0f9ff', borderRadius: '8px',
                  fontSize: '13px', color: '#0369a1', lineHeight: 1.6,
                }}>
                  <strong>💡 Tip:</strong> Once registered, use your fingerprint to check in at the Reports page — no password needed.
                  Each device and browser needs its own registration.
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange}>

              {/* Inline error inside the open form */}
              {pwMsg && (
                <div style={{
                  padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '14px',
                  background: pwMsg.type === 'ok' ? '#d1fae5' : '#fee2e2',
                  color:      pwMsg.type === 'ok' ? '#065f46' : '#b91c1c',
                }}>
                  {pwMsg.text}
                </div>
              )}

              {/* Current password */}
              <div className="form-group">
                <label>Current Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    style={{ paddingRight: '44px' }}
                    required
                  />
                  <button type="button" onClick={() => setShowCurrent(v => !v)} style={eyeStyle}>
                    {showCurrent ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="form-group">
                <label>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    style={{ paddingRight: '44px' }}
                    required
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)} style={eyeStyle}>
                    {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {showPwReqs && (
                  <div style={{ marginTop: '10px' }}>
                    {reqRows.map((r, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
                        {r.met ? <Check size={14} color="#10b981" /> : <X size={14} color="#ef4444" />}
                        <span style={{ fontSize: '13px', color: r.met ? '#10b981' : 'var(--muted-text)' }}>
                          {r.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="form-group">
                <label>Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    style={{ paddingRight: '44px' }}
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} style={eyeStyle}>
                    {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px' }}>
                    {passwordMatch
                      ? <><Check size={13} color="#10b981" /><span style={{ fontSize: '13px', color: '#10b981' }}>Passwords match</span></>
                      : <><X     size={13} color="#ef4444" /><span style={{ fontSize: '13px', color: '#ef4444' }}>Passwords do not match</span></>
                    }
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={pwLoading || !isPwStrong || !passwordMatch || !currentPassword.trim()}
                  style={{
                    flex: 1,
                    opacity: (pwLoading || !isPwStrong || !passwordMatch || !currentPassword.trim()) ? 0.55 : 1,
                  }}
                >
                  {pwLoading ? 'Saving…' : 'Save Password'}
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  style={{ margin: 0 }}
                  onClick={resetPwForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <p className="security-note">
            Last login:{' '}
            {new Date().toLocaleDateString('en-GB', {
              day: '2-digit', month: 'long', year: 'numeric',
            })}{' '}
            {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} EAT
          </p>
        </div>

      </div>

      {/* 2FA Setup Modal */}
      {show2FAModal && (
        <TwoFactorSetup
          onClose={() => setShow2FAModal(false)}
          onSuccess={() => setTwoFactorEnabled(true)}
        />
      )}
    </>
  );
};

// Shared style for eye-toggle buttons
const eyeStyle: React.CSSProperties = {
  position: 'absolute', right: '12px', top: '50%',
  transform: 'translateY(-50%)', background: 'none',
  border: 'none', cursor: 'pointer', padding: '4px',
  color: 'var(--muted-text)',
};

export default Settings;