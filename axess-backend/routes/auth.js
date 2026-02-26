// routes/auth.js
const express    = require('express');
const router     = express.Router();
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const User       = require('../models/User');

// ── Multer config ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const safe = file.fieldname + '-' + Date.now() + ext;
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg'];
    const ext     = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF, PNG and JPG files are allowed'));
  },
});

// upload.any() accepts ALL field names — no LIMIT_UNEXPECTED_FILE errors
const registerUpload = upload.any();

// ── Helper: find a file by field name from req.files array ────────────────────
function getFile(files, fieldName) {
  if (!Array.isArray(files)) return null;
  const found = files.find(f => f.fieldname === fieldName);
  return found ? found.filename : null;
}

// ── Multer error handler middleware ───────────────────────────────────────────
function handleMulterError(err, req, res, next) {
  if (err && err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ message: `Unexpected file field: ${err.field}` });
  }
  if (err) {
    return res.status(400).json({ message: err.message || 'File upload error' });
  }
  next();
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', (req, res, next) => {
  registerUpload(req, res, (err) => {
    if (err) {
      console.error('Multer error on register:', err.message);
      return res.status(400).json({ message: err.message || 'File upload error' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      accountType,
      institution         = 'MUST',
      membership          = 'None',
      role                = 'user',
      campus,
      regNumber,
      program,
      level,
      yearOfStudy,
      educationBackground,
    } = req.body;

    // ── Basic validation ──────────────────────────────────────────────────
    if (!fullName || !email || !phone || !password || !accountType) {
      return res.status(400).json({ message: 'fullName, email, phone, password and accountType are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ── Build user data ───────────────────────────────────────────────────
    const userData = {
      fullName,
      email: normalizedEmail,
      phone,
      password: hashedPassword,
      accountType,
      institution,
      membership,
      role,
      verificationStatus:  'pending',
      passportPhotoFile:   getFile(req.files, 'passportPhotoFile'),
      studentIdFile:       getFile(req.files, 'studentIdFile'),
      nationalIdFile:      getFile(req.files, 'nationalIdFile'),
      educationProofFile:  getFile(req.files, 'educationProofFile'),
      centerFormFile:      getFile(req.files, 'centerFormFile'),
    };

    if (accountType === 'student') {
      userData.campus      = campus      || '';
      userData.regNumber   = regNumber   || '';
      userData.program     = program     || '';
      userData.level       = level       || '';
      userData.yearOfStudy = yearOfStudy || '';
    } else {
      userData.educationBackground = educationBackground || '';
    }

    const user = new User(userData);
    await user.save();

    console.log(`[REGISTER] New user registered: ${normalizedEmail}`);

    return res.status(201).json({
      message: 'Registration successful. Your account is pending admin approval.',
      email:   user.email,
    });

  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials.' });

    if (user.verificationStatus === 'pending') {
      return res.status(403).json({ message: 'Your account is pending admin approval.' });
    }
    if (user.verificationStatus === 'rejected') {
      return res.status(403).json({ message: 'Your account has been rejected. Please contact admin.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'changeme',
      { expiresIn: '7d' }
    );

    const { password: _pw, __v, ...safeUser } = user.toObject();
    return res.json({ token, user: safeUser });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /api/auth/check-status ───────────────────────────────────────────────
router.post('/check-status', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.json({ status: 'not_found' });
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('verificationStatus fullName');
    if (!user) return res.json({ status: 'not_found' });
    return res.json({ status: user.verificationStatus, fullName: user.fullName });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /api/auth/admin-reset-password ──────────────────────────────────────
router.post('/admin-reset-password', async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) {
      return res.status(400).json({ message: 'userId and newPassword are required.' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    const user   = await User.findByIdAndUpdate(userId, { password: hashed }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const adminName = req.user?.fullName || req.user?.email || 'Admin';
    console.log(`[ADMIN-RESET-PW] Admin "${adminName}" reset password for "${user.email}"`);
    return res.json({ message: 'Password reset successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /api/auth/impersonate ────────────────────────────────────────────────
router.post('/impersonate', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'changeme',
      { expiresIn: '1h' }
    );

    const adminName = req.user?.fullName || req.user?.email || 'Admin';
    console.log(`[IMPERSONATE] Admin "${adminName}" → "${user.fullName || user.email}"`);
    return res.json({ token, user });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// ── JWT auth middleware (used by protected routes below) ─────────────────────
function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || '';
    const token      = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'No token provided.' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'changeme');
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

// ── PUT /api/auth/profile ─────────────────────────────────────────────────────
// Allows a logged-in user to update their own fullName and phone.
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { fullName, phone } = req.body;
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ message: 'Full name is required.' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { fullName: fullName.trim(), phone: (phone || '').trim() },
      { new: true }
    ).select('-password -__v');

    if (!user) return res.status(404).json({ message: 'User not found.' });

    console.log(`[PROFILE-UPDATE] User "${user.email}" updated their profile.`);
    return res.json({ message: 'Profile updated successfully.', user });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── POST /api/auth/change-password ────────────────────────────────────────────
// Allows a logged-in user to change their own password (requires current password).
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword and newPassword are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    console.log(`[CHANGE-PW] User "${user.email}" changed their password.`);
    return res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── POST /api/auth/reset-password ─────────────────────────────────────────────
// Public route — allows a user to reset password using only their email.
// Used by the ResetPassword page (unauthenticated flow).
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'email and newPassword are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Return success even if email not found to prevent email enumeration
      return res.json({ message: 'If that email exists, the password has been reset.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    console.log(`[RESET-PW] Password reset for "${user.email}".`);
    return res.json({ message: 'Password reset successfully.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── WebAuthn / Fingerprint routes ─────────────────────────────────────────────
// Uses @simplewebauthn/server  →  npm install @simplewebauthn/server
//
// In-memory challenge store (fine for single-process; swap for Redis in prod)
const pendingChallenges = new Map(); // email → challenge string

// Helper: load library lazily so the rest of auth still works if pkg missing
let webauthnServer = null;
function getWebauthn() {
  if (!webauthnServer) {
    try {
      webauthnServer = require('@simplewebauthn/server');
    } catch {
      return null;
    }
  }
  return webauthnServer;
}

const RP_NAME   = process.env.RP_NAME   || 'aXess';
const RP_ID     = process.env.RP_ID     || 'localhost';
const RP_ORIGIN = process.env.RP_ORIGIN || 'http://localhost:5173';

// ── GET /api/auth/webauthn/check  ──────────────────────────────────────────────
// Called from Settings to check if current user has fingerprint registered
router.get('/webauthn/check', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('webauthnCredentials');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const hasFingerprint = Array.isArray(user.webauthnCredentials) && user.webauthnCredentials.length > 0;
    return res.json({ hasFingerprint, count: user.webauthnCredentials?.length || 0 });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── POST /api/auth/webauthn/register/start ─────────────────────────────────────
// Step 1: generate registration options and send to browser
router.post('/webauthn/register/start', async (req, res) => {
  const wa = getWebauthn();
  if (!wa) {
    return res.status(501).json({ message: '@simplewebauthn/server is not installed. Run: npm install @simplewebauthn/server' });
  }

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'email is required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: 'No account found with that email.' });

    // Exclude already-registered credentials so device is not re-registered
    const excludeCredentials = (user.webauthnCredentials || []).map(c => ({
      id:         c.credentialID,
      type:       'public-key',
      transports: c.transports || [],
    }));

    const options = await wa.generateRegistrationOptions({
      rpName:                  RP_NAME,
      rpID:                    RP_ID,
      userID:                  Buffer.from(user._id.toString(), 'utf8'),
      userName:                user.email,
      userDisplayName:         user.fullName,
      timeout:                 60000,
      attestationType:         'none',
      excludeCredentials,
      authenticatorSelection: {
        // Do NOT set authenticatorAttachment so the browser can pick the best
        // available authenticator (Windows Hello, Touch ID, etc.) without
        // being hijacked by Google Password Manager passkey flow.
        userVerification: 'required',
        residentKey:      'discouraged', // prevents passkey/password-manager popup
      },
    });

    // Store challenge keyed by email for verification step
    pendingChallenges.set(user.email, options.challenge);

    // Wrap in { options, userId } so the frontend can access
    // optionsResponse.options (consistent with authenticate/start shape)
    return res.json({ options, userId: user._id.toString() });
  } catch (err) {
    console.error('[WebAuthn] register/start error:', err);
    return res.status(500).json({ message: err.message || 'Server error.' });
  }
});

// ── POST /api/auth/webauthn/register/finish ────────────────────────────────────
// Step 2: verify the credential created by the browser and save it
router.post('/webauthn/register/finish', async (req, res) => {
  const wa = getWebauthn();
  if (!wa) return res.status(501).json({ message: '@simplewebauthn/server is not installed.' });

  try {
    const { email, credential } = req.body;
    if (!email || !credential) return res.status(400).json({ message: 'email and credential are required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const expectedChallenge = pendingChallenges.get(user.email);
    if (!expectedChallenge) return res.status(400).json({ message: 'No pending registration. Please start again.' });

    let verification;
    try {
      verification = await wa.verifyRegistrationResponse({
        response:          credential,
        expectedChallenge,
        expectedOrigin:    RP_ORIGIN,
        expectedRPID:      RP_ID,
        requireUserVerification: true,
      });
    } catch (verifyErr) {
      console.error('[WebAuthn] verification failed:', verifyErr);
      return res.status(400).json({ message: 'Fingerprint verification failed. Please try again.' });
    }

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ message: 'Fingerprint registration not verified.' });
    }

    // @simplewebauthn/server >=v7 moved fields under registrationInfo.credential
    // Support both the old shape (v6) and new shape (v7+)
    const info = verification.registrationInfo;
    const rawCredentialID        = info.credentialID        ?? info.credential?.id;
    const rawCredentialPublicKey = info.credentialPublicKey ?? info.credential?.publicKey;
    const rawCounter             = (info.counter !== undefined) ? info.counter : (info.credential?.counter ?? 0);

    if (!rawCredentialID || !rawCredentialPublicKey) {
      console.error('[WebAuthn] registrationInfo fields missing. Keys:', Object.keys(info));
      return res.status(500).json({ message: 'Could not extract credential. Check @simplewebauthn/server version.' });
    }

    // Convert Uint8Array / Buffer → base64 strings for MongoDB storage
    const toBase64 = (buf) => Buffer.from(buf).toString('base64');

    user.webauthnCredentials.push({
      credentialID:        toBase64(rawCredentialID),
      credentialPublicKey: toBase64(rawCredentialPublicKey),
      counter:             rawCounter,
      transports:          credential.response?.transports || [],
      registeredAt:        new Date(),
    });

    await user.save();
    pendingChallenges.delete(user.email);

    console.log(`[WebAuthn] Fingerprint registered for "${user.email}"`);
    return res.json({ success: true, message: 'Fingerprint registered successfully.' });
  } catch (err) {
    console.error('[WebAuthn] register/finish error:', err);
    return res.status(500).json({ message: err.message || 'Server error.' });
  }
});

// ── POST /api/auth/webauthn/authenticate/start ────────────────────────────────
// Step 1 of login: send authentication options to the browser
router.post('/webauthn/authenticate/start', async (req, res) => {
  const wa = getWebauthn();
  if (!wa) return res.status(501).json({ message: '@simplewebauthn/server is not installed.' });

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'email is required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.webauthnCredentials?.length) {
      return res.status(404).json({ message: 'No fingerprint registered for this account.' });
    }

    const allowCredentials = user.webauthnCredentials.map(c => ({
      id:         c.credentialID,
      type:       'public-key',
      transports: c.transports || ['internal'],
    }));

    const options = await wa.generateAuthenticationOptions({
      rpID:             RP_ID,
      timeout:          60000,
      allowCredentials,
      userVerification: 'required',
    });

    pendingChallenges.set(user.email, options.challenge);
    // Wrap consistently: { options, userId } — same shape as register/start
    // The spread pattern caused optionsResponse.options to be undefined on the frontend
    return res.json({ options, userId: user._id.toString() });
  } catch (err) {
    console.error('[WebAuthn] authenticate/start error:', err);
    return res.status(500).json({ message: err.message || 'Server error.' });
  }
});

// ── POST /api/auth/webauthn/authenticate/finish ───────────────────────────────
// Step 2 of login: verify the signed assertion and return a JWT
router.post('/webauthn/authenticate/finish', async (req, res) => {
  const wa = getWebauthn();
  if (!wa) return res.status(501).json({ message: '@simplewebauthn/server is not installed.' });

  try {
    const { userId, credential } = req.body;
    if (!userId || !credential) return res.status(400).json({ message: 'userId and credential are required.' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const expectedChallenge = pendingChallenges.get(user.email);
    if (!expectedChallenge) return res.status(400).json({ message: 'No pending authentication. Please start again.' });

    // Find the matching stored credential
    const fromBase64 = (str) => Buffer.from(str, 'base64');
    const storedCred = user.webauthnCredentials.find(c => c.credentialID === credential.id);
    if (!storedCred) return res.status(400).json({ message: 'Credential not recognised.' });

    let verification;
    try {
      verification = await wa.verifyAuthenticationResponse({
        response:          credential,
        expectedChallenge,
        expectedOrigin:    RP_ORIGIN,
        expectedRPID:      RP_ID,
        authenticator: {
          credentialID:        fromBase64(storedCred.credentialID),
          credentialPublicKey: fromBase64(storedCred.credentialPublicKey),
          counter:             storedCred.counter,
          transports:          storedCred.transports,
        },
        requireUserVerification: true,
      });
    } catch (verifyErr) {
      console.error('[WebAuthn] auth verification failed:', verifyErr);
      return res.status(400).json({ message: 'Fingerprint verification failed.' });
    }

    if (!verification.verified) {
      return res.status(400).json({ message: 'Fingerprint not verified.' });
    }

    // Update the counter to prevent replay attacks
    storedCred.counter = verification.authenticationInfo.newCounter;
    await user.save();
    pendingChallenges.delete(user.email);

    if (user.verificationStatus !== 'approved') {
      return res.status(403).json({ message: 'Your account is pending approval.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'changeme',
      { expiresIn: '7d' }
    );

    const { password: _pw, __v, ...safeUser } = user.toObject();
    console.log(`[WebAuthn] Fingerprint login for "${user.email}"`);
    return res.json({ success: true, token, user: safeUser });
  } catch (err) {
    console.error('[WebAuthn] authenticate/finish error:', err);
    return res.status(500).json({ message: err.message || 'Server error.' });
  }
});

module.exports = router;