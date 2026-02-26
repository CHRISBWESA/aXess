// src/components/TwoFactorSetup.tsx
// Full 2FA modal: generates TOTP secret, shows QR code, verifies 6-digit code
import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Shield, Copy, Check } from 'lucide-react';

interface TwoFactorSetupProps {
  onClose: () => void;
  onSuccess: () => void;
}

// ── tiny TOTP helpers (no external lib needed) ─────────────────────────────
// Generate a random Base32 secret (160 bits = 32 chars)
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const generateSecret = (): string => {
  let secret = '';
  const array = new Uint8Array(20);
  crypto.getRandomValues(array);
  for (let i = 0; i < 20; i++) {
    secret += BASE32_CHARS[array[i] & 31];
  }
  return secret;
};

// Build the otpauth URI that Google Authenticator / Authy scans
const buildOtpUri = (secret: string, email: string, issuer = 'aXess'): string => {
  const label = encodeURIComponent(`${issuer}:${email}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
};

// Google Charts QR API (no backend needed)
const qrUrl = (otpUri: string): string =>
  `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpUri)}`;

// ── component ──────────────────────────────────────────────────────────────
const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState<'setup' | 'verify' | 'done'>('setup');
  const [secret, setSecret] = useState('');
  const [otpUri, setOtpUri] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Read user email from localStorage
  const [email, setEmail] = useState('user@axess.com');
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (u.email) setEmail(u.email);
    } catch {}

    const s = generateSecret();
    setSecret(s);
    setOtpUri(buildOtpUri(s, email));
  }, []);

  // Rebuild URI when email resolves
  useEffect(() => {
    if (secret) setOtpUri(buildOtpUri(secret, email));
  }, [email, secret]);

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your authenticator app.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ secret, token: code }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.msg || data.message || 'Verification failed');

      // Save 2FA enabled state in localStorage
      try {
        const u = JSON.parse(localStorage.getItem('currentUser') || '{}');
        localStorage.setItem('currentUser', JSON.stringify({ ...u, twoFactorEnabled: true }));
      } catch {}

      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── styles ─────────────────────────────────────────────────────────────
  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px',
  };
  const modal: React.CSSProperties = {
    background: 'var(--surface)',
    borderRadius: '16px',
    padding: '32px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
    position: 'relative',
  };

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modal}>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none',
            border: 'none', cursor: 'pointer', color: 'var(--muted-text)', padding: 4 }}
        >
          <X size={20} />
        </button>

        {/* ── STEP 1: Setup ──────────────────────────────────────────── */}
        {step === 'setup' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 56, height: 56, borderRadius: '14px',
                background: 'rgba(79,70,229,0.1)', marginBottom: '12px' }}>
                <Shield size={28} color="var(--soft-blue)" />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--soft-blue-dark)', margin: '0 0 6px' }}>
                Set Up Two-Factor Authentication
              </h2>
              <p style={{ color: 'var(--muted-text)', fontSize: '14px', margin: 0 }}>
                Scan the QR code with Google Authenticator, Authy, or any TOTP app.
              </p>
            </div>

            {/* QR Code */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <img
                src={qrUrl(otpUri)}
                alt="2FA QR Code"
                style={{ width: 180, height: 180, borderRadius: '12px',
                  border: '2px solid var(--glass-border)' }}
              />
            </div>

            {/* Manual secret */}
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '13px', color: 'var(--muted-text)', marginBottom: '8px', textAlign: 'center' }}>
                Or enter this key manually:
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px',
                background: 'var(--gray-light)', borderRadius: '10px', padding: '10px 14px' }}>
                <code style={{ flex: 1, fontSize: '14px', fontFamily: 'monospace',
                  letterSpacing: '0.1em', color: 'var(--soft-blue-dark)', wordBreak: 'break-all' }}>
                  {secret.match(/.{1,4}/g)?.join(' ')}
                </code>
                <button onClick={copySecret}
                  style={{ background: 'none', border: 'none', cursor: 'pointer',
                    color: copied ? '#10b981' : 'var(--muted-text)', padding: '4px', flexShrink: 0 }}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <button
              className="primary-btn"
              style={{ width: '100%' }}
              onClick={() => setStep('verify')}
            >
              I've scanned the code — Continue
            </button>
          </>
        )}

        {/* ── STEP 2: Verify ─────────────────────────────────────────── */}
        {step === 'verify' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 56, height: 56, borderRadius: '14px',
                background: 'rgba(79,70,229,0.1)', marginBottom: '12px' }}>
                <ShieldCheck size={28} color="var(--soft-blue)" />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--soft-blue-dark)', margin: '0 0 6px' }}>
                Verify Your Code
              </h2>
              <p style={{ color: 'var(--muted-text)', fontSize: '14px', margin: 0 }}>
                Enter the 6-digit code shown in your authenticator app to confirm setup.
              </p>
            </div>

            {error && (
              <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px',
                borderRadius: '8px', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleVerify}>
              <div className="form-group">
                <label>Authentication Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  autoFocus
                  style={{ textAlign: 'center', fontSize: '28px', letterSpacing: '0.3em',
                    fontWeight: 700, padding: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="button" className="secondary-btn"
                  style={{ margin: 0 }} onClick={() => setStep('setup')}>
                  ← Back
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  style={{ flex: 1, opacity: (loading || code.length !== 6) ? 0.6 : 1 }}
                  disabled={loading || code.length !== 6}
                >
                  {loading ? 'Verifying…' : 'Enable 2FA'}
                </button>
              </div>
            </form>
          </>
        )}

        {/* ── STEP 3: Done ───────────────────────────────────────────── */}
        {step === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(16,185,129,0.12)', marginBottom: '16px' }}>
              <ShieldCheck size={32} color="#10b981" />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--soft-blue-dark)', marginBottom: '8px' }}>
              2FA Enabled!
            </h2>
            <p style={{ color: 'var(--muted-text)', fontSize: '14px', marginBottom: '24px' }}>
              Two-factor authentication is now active on your account. You'll be asked for a code each time you log in.
            </p>
            <button className="primary-btn" style={{ width: '100%' }} onClick={() => { onSuccess(); onClose(); }}>
              Done
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default TwoFactorSetup;