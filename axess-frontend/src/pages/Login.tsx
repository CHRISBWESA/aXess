// src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../lib/api';

const Login: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [statusInfo, setStatusInfo] = useState<{ status: string; fullName?: string } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      setStatusInfo(data);

      if (data.status === 'pending') {
        setError(
          `⏳ Hi ${data.fullName || 'there'}, your account is awaiting admin approval.\n` +
          `Please wait — you will be able to log in once approved.\n` +
          `Do NOT use "Forgot Password" — your registration password is correct and will work after approval.`
        );
        return;
      }

      if (data.status === 'rejected') {
        setError(
          `❌ Your account application was not approved.\n` +
          `Please contact the administrator for assistance.`
        );
        return;
      }

      if (data.status === 'unknown') {
        setStep(2);
        return;
      }

      setStep(2);
    } catch (err: any) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authAPI.login(email.trim(), password);

      localStorage.setItem('authToken', response.token);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      localStorage.removeItem('impersonating');

      navigate('/dashboard');
    } catch (err: any) {
      const msg =
        err.response?.data?.msg ||
        err.response?.data?.message ||
        err.message ||
        'Login failed. Please check your credentials.';

      if (msg.toLowerCase().includes('pending')) {
        setError(
          `⏳ Your account is awaiting admin approval. Please wait.\n` +
          `Your registration password is saved correctly — you will NOT need to reset it.`
        );
      } else if (msg.toLowerCase().includes('rejected')) {
        setError(`❌ Your account was not approved. Contact the administrator.`);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const s = {
    wrap: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column' as const,          // ← changed to column
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative' as const,             // for absolute positioning of footer if needed
    } as React.CSSProperties,
    card: {
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
      padding: '40px 32px',
      width: '100%',
      maxWidth: '420px',
      marginTop: '35px',                    // ← pushes footer to bottom
    } as React.CSSProperties,
    label: {
      display: 'block',
      marginBottom: '6px',
      fontWeight: 600,
      color: '#374151',
      fontSize: '14px',
    } as React.CSSProperties,
    input: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '10px',
      fontSize: '16px',
      boxSizing: 'border-box' as const,
    },
    btn: (disabled: boolean) => ({
      background: disabled ? '#a5b4fc' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
      color: 'white',
      border: 'none',
      padding: '14px 24px',
      borderRadius: '10px',
      fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      width: '100%',
      fontSize: '16px',
      transition: 'all 0.2s',
    } as React.CSSProperties),
  };

  const isPending = statusInfo?.status === 'pending';
  const isRejected = statusInfo?.status === 'rejected';

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        {/* Logo Image */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <img
            src="/images/logo.png"
            alt="Logo"
            style={{
              width: '190px',
              height: '130px',
              objectFit: 'contain',
              borderRadius: '24px',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.15)',
              marginTop: '25px',
            }}
          />
        </div>

        {/* Heading */}
        <h2 style={{
          textAlign: 'center',
          fontSize: '22px',
          fontWeight: 700,
          color: '#000000',
          marginBottom: '6px',
        }}>
          {step === 1 ? 'Welcome back' : `Hi, ${statusInfo?.fullName || email.split('@')[0]}`}
        </h2>

        <p style={{
          textAlign: 'center',
          color: '#6b7280',
          marginBottom: '28px',
          fontSize: '14px',
        }}>
          {step === 1 ? 'Sign in to your account to continue' : 'Enter your password to sign in'}
        </p>

        {error && (
          <div style={{
            background: isPending ? '#fef3c7' : '#fee2e2',
            color: isPending ? '#92400e' : '#b91c1c',
            border: `1px solid ${isPending ? '#f59e0b' : '#fca5a5'}`,
            padding: '14px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '14px',
            lineHeight: '1.6',
            whiteSpace: 'pre-line',
          }}>
            {error}
          </div>
        )}

        {!isPending && !isRejected && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {[1, 2].map(n => (
              <div key={n} style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                background: step >= n ? '#6366f1' : '#e5e7eb',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        )}

        {step === 1 && !isPending && !isRejected && (
          <form onSubmit={handleCheckEmail}>
            <div style={{ marginBottom: '20px' }}>
              <label style={s.label}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                placeholder="your.email@example.com"
                style={s.input}
              />
            </div>
            <button type="submit" disabled={loading || !email.trim()} style={s.btn(loading || !email.trim())}>
              {loading ? 'Checking…' : 'Continue →'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button type="button" onClick={() => navigate('/register')}
                style={{
                  background: 'transparent',
                  border: '1px solid #6366f1',
                  color: '#6366f1',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  width: '100%',
                }}>
                Create account
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={s.label}>Email address</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="email"
                  value={email}
                  readOnly
                  style={{ ...s.input, background: '#f9fafb', color: '#6b7280', flex: 1 }}
                />
                <button type="button" onClick={() => { setStep(1); setPassword(''); setError(null); setStatusInfo(null); }}
                  style={{
                    background: 'none',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    color: '#6b7280',
                    fontSize: '13px',
                    whiteSpace: 'nowrap',
                  }}>
                  Change
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={s.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                autoFocus
                placeholder="Enter your password"
                style={s.input}
              />
            </div>

            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
              <a href="/reset-password" style={{ color: '#6366f1', fontSize: '14px', textDecoration: 'none' }}>
                Forgot password?
              </a>
            </div>

            <button type="submit" disabled={loading || !password} style={s.btn(loading || !password)}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}

        {isPending && (
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button onClick={() => { setStep(1); setError(null); setStatusInfo(null); setEmail(''); }}
              style={{
                background: 'transparent',
                border: '1px solid #d1d5db',
                color: '#6b7280',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
              }}>
              Use a different account
            </button>
          </div>
        )}
      </div>

      {/* Footer text - outside the white card, at the bottom */}
      <div style={{
        marginTop: 'auto',                    // pushes it to bottom
        padding: '20px 0',
        textAlign: 'center',
        color: '#ffffff',
        fontSize: '14px',
        opacity: 0.85,
      }}>
        <div style={{ fontSize: '12px', marginBottom: '2px' }}>
          from
        </div>
        <div style={{
          fontSize: '16px',
          fontWeight: 600,
          letterSpacing: '0.5px',
        }}>
          BLECAxmartlabs
        </div>
      </div>
    </div>
  );
};

export default Login;