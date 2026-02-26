// src/pages/ResetPassword.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check, X } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showRequirements, setShowRequirements] = useState(false);

  const [requirements, setRequirements] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
  });

  useEffect(() => {
    const password = newPassword;
    setShowRequirements(password.length > 0);
    setRequirements({
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    });
  }, [newPassword]);

  const isPasswordStrong = Object.values(requirements).every(Boolean);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!isPasswordStrong) {
      setError('Password does not meet all requirements');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Use /api proxy (same origin) instead of hardcoded localhost
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:       email.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      let data;
      try { data = await response.json(); } catch { throw new Error('Server returned invalid response'); }

      if (!response.ok) {
        throw new Error(data.msg || data.message || data.error || `Failed to reset password (${response.status})`);
      }

      setMessage('Password has been reset successfully! Redirecting to login…');
      // Always go to login after reset — this is the unauthenticated flow
      setTimeout(() => navigate('/login'), 2200);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
          padding: '40px 32px',
          width: '100%',
          maxWidth: '460px',
        }}
      >
        <h1
          style={{
            textAlign: 'center',
            fontSize: '28px',
            fontWeight: 700,
            color: '#1e3a8a',
            marginBottom: '32px',
          }}
        >
          Reset Password
        </h1>

        {message && (
          <div style={{
            background: '#d1fae5', color: '#065f46',
            padding: '12px 16px', borderRadius: '8px',
            marginBottom: '20px', fontSize: '15px', textAlign: 'center',
          }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{
            background: '#fee2e2', color: '#b91c1c',
            padding: '12px 16px', borderRadius: '8px',
            marginBottom: '20px', fontSize: '15px', textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{
                width: '100%', padding: '12px 16px',
                border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '16px',
              }}
            />
          </div>

          {/* New password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
              New Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                style={{
                  width: '100%', padding: '12px 44px 12px 16px',
                  border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '16px',
                }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {showRequirements && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontWeight: 500, marginBottom: '10px', color: '#4b5563' }}>
                  Password must contain:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { label: 'At least 8 characters',           met: requirements.minLength },
                    { label: 'One uppercase letter (A-Z)',       met: requirements.hasUpper  },
                    { label: 'One lowercase letter (a-z)',       met: requirements.hasLower  },
                    { label: 'One number (0-9)',                 met: requirements.hasNumber },
                    { label: 'One special character (!@#$%^&*)', met: requirements.hasSpecial},
                  ].map((req, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {req.met ? <Check size={18} color="#10b981" /> : <X size={18} color="#ef4444" />}
                      <span style={{ color: req.met ? '#10b981' : '#6b7280', fontSize: '14px' }}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
              Confirm New Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                style={{
                  width: '100%', padding: '12px 44px 12px 16px',
                  border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '16px',
                }}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isPasswordStrong || !passwordsMatch || !email.trim()}
            style={{
              width: '100%', padding: '14px',
              background: loading || !isPasswordStrong || !passwordsMatch || !email.trim()
                ? '#a5b4fc'
                : 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: 'white', border: 'none', borderRadius: '10px',
              fontSize: '16px', fontWeight: 600,
              cursor: loading || !isPasswordStrong || !passwordsMatch || !email.trim()
                ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <a href="/login" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>
            ← Back to Sign in
          </a>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;