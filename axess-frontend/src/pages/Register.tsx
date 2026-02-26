// src/pages/Register.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check, X, Fingerprint } from 'lucide-react';
import { authAPI } from '../lib/api';
import { startRegistration } from '@simplewebauthn/browser';

// ── Club membership options ──────────────────────────────────────────────────
const MEMBERSHIP_OPTIONS = [
  'None',
  'Innovation & Tech Club',
  'Entrepreneurship & Startup Club',
  'Environmental & Sustainability Club',
  'Debate & Public Speaking Club',
  'Photography & Film Club',
  'Music & Performing Arts Club',
  'Gaming & Esports Club',
  'Literature & Book Club',
  'Sports Analytics & Fitness Club',
  'Community Service & Outreach Club',
];

// ── Role options ─────────────────────────────────────────────────────────────
const ROLE_OPTIONS = [
  { value: 'user',      label: 'User' },
  { value: 'innovator', label: 'Innovator' },
  { value: 'member',    label: 'Member' },
  { value: 'guard',     label: 'Guard' },
  { value: 'leader',    label: 'Leader' },
  { value: 'admin',     label: 'Admin' },
];

// ── Passport photo preview ───────────────────────────────────────────────────
const PassportPhotoUpload: React.FC<{
  file: File | null;
  onChange: (f: File | null) => void;
}> = ({ file, onChange }) => {
  const inputRef  = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151', fontSize: '14px' }}>
        Passport-Size Photo * <span style={{ fontWeight: 400, color: '#6b7280' }}>(JPG / PNG, max 5 MB)</span>
      </label>

      {/* Click-to-upload zone */}
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          border: '2px dashed #c7d2fe', borderRadius: '12px',
          padding: '16px', cursor: 'pointer', background: '#f5f3ff',
          transition: 'border-color 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = '#c7d2fe')}
      >
        {/* Preview box */}
        <div style={{
          width: 80, height: 100, borderRadius: '8px',
          border: '1px solid #e5e7eb', overflow: 'hidden',
          background: '#fff', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px', color: '#d1d5db',
        }}>
          {preview
            ? <img src={preview} alt="Passport preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : '👤'}
        </div>

        <div>
          <div style={{ fontWeight: 600, color: '#4338ca', fontSize: '14px', marginBottom: '4px' }}>
            {file ? file.name : 'Click to upload photo'}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            {file
              ? `${(file.size / 1024).toFixed(0)} KB — click to change`
              : 'Passport-size (e.g. 35 × 45 mm). Used for your member ID card.'}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0] || null;
          if (f && f.size > 5 * 1024 * 1024) { alert('Photo must be smaller than 5 MB.'); return; }
          onChange(f);
          e.target.value = '';
        }}
      />

      {file && (
        <button
          type="button"
          onClick={() => onChange(null)}
          style={{ marginTop: '6px', background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', padding: 0 }}
        >
          ✕ Remove photo
        </button>
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// REGISTER COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
const Register: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Registration complete state
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registeredEmail,      setRegisteredEmail]      = useState('');

  // Fingerprint registration state
  const [fingerprintLoading, setFingerprintLoading] = useState(false);
  const [fingerprintSuccess, setFingerprintSuccess] = useState(false);

  // ── Basic fields ─────────────────────────────────────────────────────────
  const [fullName,     setFullName]     = useState('');
  const [email,        setEmail]        = useState('');
  const [phone,        setPhone]        = useState('');
  const [password,     setPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType,  setAccountType]  = useState<'student' | 'non_student'>('student');
  const [institution,  setInstitution]  = useState('MUST');
  const [membership,   setMembership]   = useState('None');
  const [role,         setRole]         = useState('user');

  // ── Student fields ───────────────────────────────────────────────────────
  const [campus,      setCampus]      = useState('');
  const [regNumber,   setRegNumber]   = useState('');
  const [program,     setProgram]     = useState('');
  const [level,       setLevel]       = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');

  // ── Non-student fields ───────────────────────────────────────────────────
  const [educationBackground, setEducationBackground] = useState('');

  // ── Files ────────────────────────────────────────────────────────────────
  const [passportPhotoFile,  setPassportPhotoFile]  = useState<File | null>(null);
  const [studentIdFile,      setStudentIdFile]      = useState<File | null>(null);
  const [nationalIdFile,     setNationalIdFile]     = useState<File | null>(null);
  const [residenceProofFile, setResidenceProofFile] = useState<File | null>(null);
  const [centerFormFile,     setCenterFormFile]     = useState<File | null>(null);

  // ── Password visibility & strength ───────────────────────────────────────
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);

  const [requirements, setRequirements] = useState({
    minLength:  false,
    hasUpper:   false,
    hasLower:   false,
    hasNumber:  false,
    hasSpecial: false,
  });

  useEffect(() => {
    setShowRequirements(password.length > 0);
    setRequirements({
      minLength:  password.length >= 8,
      hasUpper:   /[A-Z]/.test(password),
      hasLower:   /[a-z]/.test(password),
      hasNumber:  /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    });
  }, [password]);

  const isPasswordStrong = Object.values(requirements).every(Boolean);
  const passwordsMatch   = password === confirmPassword && password !== '';

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passportPhotoFile) { setError('Passport-size photo is required.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (!isPasswordStrong) { setError('Password does not meet strength requirements.'); return; }

    setLoading(true);

    const formData = new FormData();
    formData.append('fullName',    fullName);
    formData.append('email',       email);
    formData.append('phone',       phone);
    formData.append('password',    password);
    formData.append('accountType', accountType);
    formData.append('institution', institution);
    formData.append('membership',  membership || 'None');
    formData.append('role',        role);

    // Passport photo — always appended
    formData.append('passportPhotoFile', passportPhotoFile);

    if (accountType === 'student') {
      formData.append('campus',      campus);
      formData.append('regNumber',   regNumber);
      formData.append('program',     program);
      formData.append('level',       level);
      formData.append('yearOfStudy', yearOfStudy);
      if (studentIdFile) formData.append('studentIdFile', studentIdFile);
    } else {
      formData.append('educationBackground', educationBackground);
      if (nationalIdFile)     formData.append('nationalIdFile',    nationalIdFile);
      if (residenceProofFile) formData.append('educationProofFile', residenceProofFile);
      if (centerFormFile)     formData.append('centerFormFile',     centerFormFile);
    }

    try {
      const response = await authAPI.register(formData);
      setRegistrationComplete(true);
      setRegisteredEmail(response.email || email);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Fingerprint registration ─────────────────────────────────────────────
  const handleRegisterFingerprint = async () => {
    if (!registeredEmail) return;
    setFingerprintLoading(true);
    setError(null);
    try {
      const options    = await authAPI.webauthnRegisterStart(registeredEmail);
      const credential = await startRegistration(options);
      const result     = await authAPI.webauthnRegisterFinish(registeredEmail, credential);
      if (result.success) {
        setFingerprintSuccess(true);
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError')   setError('Fingerprint registration was cancelled or timed out.');
      else if (err.name === 'NotSupportedError') setError('Fingerprint authentication is not supported on this device.');
      else setError(err.message || 'Failed to register fingerprint. You can skip this step.');
    } finally {
      setFingerprintLoading(false);
    }
  };

  const handleSkipFingerprint = () => navigate('/login');

  // ── Input style ──────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px',
    border: '2px solid #e5e7eb', borderRadius: '10px',
    fontSize: '15px', boxSizing: 'border-box', color: '#111827',
    transition: 'border-color 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', marginBottom: '6px',
    fontWeight: 600, color: '#374151', fontSize: '14px',
  };

  const fieldWrap: React.CSSProperties = { marginBottom: '18px' };

  // ── Success / fingerprint screen ─────────────────────────────────────────
  if (registrationComplete) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ maxWidth: '480px', textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: fingerprintSuccess ? '#d1fae5' : '#ede9fe',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            {fingerprintSuccess
              ? <Check size={32} color="#10b981" />
              : <Fingerprint size={32} color="#6366f1" />}
          </div>

          <h1 className="auth-title" style={{ marginBottom: '12px' }}>
            {fingerprintSuccess ? 'All Set!' : 'Registration Successful!'}
          </h1>

          {fingerprintSuccess ? (
            <>
              <p style={{ color: '#10b981', marginBottom: '16px', fontWeight: 500 }}>
                ✓ Fingerprint registered successfully!
              </p>
              <p style={{ color: '#6b7280' }}>Redirecting to login…</p>
            </>
          ) : (
            <>
              <p style={{ color: '#6b7280', marginBottom: '8px' }}>
                Your account is pending admin approval. You'll receive an email once approved.
              </p>
              <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                While you wait, would you like to register your fingerprint for faster login?
              </p>

              {error && <div className="form-error" style={{ marginBottom: '16px' }}>{error}</div>}

              <button
                onClick={handleRegisterFingerprint}
                disabled={fingerprintLoading}
                style={{
                  width: '100%', padding: '14px',
                  background: '#6366f1', color: 'white', border: 'none',
                  borderRadius: '8px', fontWeight: 600, fontSize: '1rem',
                  cursor: fingerprintLoading ? 'not-allowed' : 'pointer',
                  opacity: fingerprintLoading ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  marginBottom: '12px',
                }}
              >
                <Fingerprint size={20} />
                {fingerprintLoading ? 'Registering…' : 'Register Fingerprint'}
              </button>

              <button
                onClick={handleSkipFingerprint}
                style={{
                  width: '100%', padding: '12px',
                  background: 'transparent', color: '#6b7280',
                  border: '1px solid #d1d5db', borderRadius: '8px',
                  fontWeight: 500, cursor: 'pointer',
                }}
              >
                Skip for now
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Registration Form ────────────────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '580px' }}>
        <h1 className="auth-title">aXess — Create Account</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="form-error" style={{ marginBottom: '16px' }}>{error}</div>}

          {/* ── Passport Photo (top — most visible) ── */}
          <PassportPhotoUpload file={passportPhotoFile} onChange={setPassportPhotoFile} />

          {/* ── Basic info ── */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Full Name *</label>
            <input type="text" style={inputStyle} value={fullName} onChange={e => setFullName(e.target.value)} required />
          </div>

          <div style={fieldWrap}>
            <label style={labelStyle}>Email Address *</label>
            <input type="email" style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div style={fieldWrap}>
            <label style={labelStyle}>Phone Number *</label>
            <input type="tel" style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} required />
          </div>

          {/* ── Password ── */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                style={inputStyle}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {showRequirements && (
            <div style={{ margin: '-8px 0 18px', fontSize: '13px', background: '#f9fafb', borderRadius: '8px', padding: '12px 14px' }}>
              <p style={{ fontWeight: 600, marginBottom: '8px', color: '#374151', margin: '0 0 8px' }}>Password must contain:</p>
              <div style={{ display: 'grid', gap: '5px' }}>
                {[
                  { label: 'At least 8 characters',        met: requirements.minLength },
                  { label: 'One uppercase letter (A–Z)',    met: requirements.hasUpper },
                  { label: 'One lowercase letter (a–z)',    met: requirements.hasLower },
                  { label: 'One number (0–9)',               met: requirements.hasNumber },
                  { label: 'One special character (!@#$…)', met: requirements.hasSpecial },
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {r.met ? <Check size={15} color="#10b981" /> : <X size={15} color="#ef4444" />}
                    <span style={{ color: r.met ? '#10b981' : '#6b7280' }}>{r.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={fieldWrap}>
            <label style={labelStyle}>Confirm Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                style={{ ...inputStyle, borderColor: confirmPassword && !passwordsMatch ? '#ef4444' : '#e5e7eb' }}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>Passwords do not match</p>
            )}
          </div>

          {/* ── Account type ── */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Account Type *</label>
            <select style={inputStyle} value={accountType} onChange={e => setAccountType(e.target.value as any)} required>
              <option value="student">Student</option>
              <option value="non_student">Non-Student / Professional</option>
            </select>
          </div>

          {/* ── Institution ── */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Institution</label>
            <input type="text" style={inputStyle} value={institution} onChange={e => setInstitution(e.target.value)} />
          </div>

          {/* ── Membership — dropdown list ── */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Club Membership</label>
            <select style={inputStyle} value={membership} onChange={e => setMembership(e.target.value)}>
              {MEMBERSHIP_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* ── Role selection ── */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Role</label>
            <select style={inputStyle} value={role} onChange={e => setRole(e.target.value)}>
              {ROLE_OPTIONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* ── Student-specific fields ── */}
          {accountType === 'student' && (
            <div style={{ background: '#f0f9ff', borderRadius: '12px', padding: '16px', marginBottom: '18px', border: '1px solid #bae6fd' }}>
              <h3 style={{ margin: '0 0 14px', color: '#0369a1', fontSize: '15px', fontWeight: 700 }}>🎓 Student Details</h3>

              <div style={fieldWrap}>
                <label style={labelStyle}>Campus *</label>
                <select style={inputStyle} value={campus} onChange={e => setCampus(e.target.value)} required>
                  <option value="">Select Campus</option>
                  <option value="Mbeya">Mbeya Campus</option>
                  <option value="Rukwa">Rukwa Campus</option>
                  <option value="Mtwara">Mtwara Campus</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>Registration Number *</label>
                <input type="text" style={inputStyle} value={regNumber} onChange={e => setRegNumber(e.target.value)} required />
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>Program *</label>
                <select style={inputStyle} value={program} onChange={e => setProgram(e.target.value)} required>
                  <option value="">Select Program</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Systems">Information Systems</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Business Administration">Business Administration</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>Level</label>
                <select style={inputStyle} value={level} onChange={e => setLevel(e.target.value)}>
                  <option value="">Select Level</option>
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>Year of Study</label>
                <select style={inputStyle} value={yearOfStudy} onChange={e => setYearOfStudy(e.target.value)}>
                  <option value="">Select Year</option>
                  {['1','2','3','4','5'].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 0 }}>
                <label style={labelStyle}>Student ID (PDF only) *</label>
                <input type="file" accept="application/pdf" required
                  onChange={e => setStudentIdFile(e.target.files?.[0] || null)}
                  style={{ fontSize: '14px' }} />
              </div>
            </div>
          )}

          {/* ── Non-student fields ── */}
          {accountType === 'non_student' && (
            <div style={{ background: '#fefce8', borderRadius: '12px', padding: '16px', marginBottom: '18px', border: '1px solid #fde68a' }}>
              <h3 style={{ margin: '0 0 14px', color: '#92400e', fontSize: '15px', fontWeight: 700 }}>👤 Non-Student Details</h3>

              <div style={fieldWrap}>
                <label style={labelStyle}>Education Background</label>
                <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                  value={educationBackground} onChange={e => setEducationBackground(e.target.value)} rows={3} />
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>National ID / Any Registration ID (PDF) *</label>
                <input type="file" accept="application/pdf" required
                  onChange={e => setNationalIdFile(e.target.files?.[0] || null)}
                  style={{ fontSize: '14px' }} />
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>Residence Proof — signed by Village Chairman (PDF) *</label>
                <input type="file" accept="application/pdf" required
                  onChange={e => setResidenceProofFile(e.target.files?.[0] || null)}
                  style={{ fontSize: '14px' }} />
              </div>

              <div style={{ marginBottom: 0 }}>
                <label style={labelStyle}>Registration Form from the Center (PDF) *</label>
                <input type="file" accept="application/pdf" required
                  onChange={e => setCenterFormFile(e.target.files?.[0] || null)}
                  style={{ fontSize: '14px' }} />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="save-btn"
            disabled={loading || !isPasswordStrong || !passwordsMatch || !passportPhotoFile}
            style={{
              opacity: loading || !isPasswordStrong || !passwordsMatch || !passportPhotoFile ? 0.6 : 1,
              cursor:  loading || !isPasswordStrong || !passwordsMatch || !passportPhotoFile ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creating Account…' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '16px' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: '#6366f1', fontWeight: 600 }}>Sign in</a>
        </p>
      </div>
    </div>
  );
};

export default Register;