// routes/members.js
const express    = require('express');
const router     = express.Router();
const User       = require('../models/User');
const bcrypt     = require('bcryptjs');
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const nodemailer = require('nodemailer');

// ── Multer config (same uploads folder as auth.js) ───────────────────────────
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

// Fields accepted by the manual-add endpoint (admin adds member with photo)
const manualUpload = upload.single('passportPhotoFile');

// ── Email transporter ────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

async function sendApprovalEmail(user) {
  try {
    await transporter.sendMail({
      from: `"aXess Admin" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Your aXess Account Has Been Approved',
      html: `<h2>Hello ${user.fullName},</h2><p>Your account has been <strong>approved</strong>. You can now log in.</p><p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login">Go to login page</a></p><br><p>Best regards,<br>aXess Team</p>`,
    });
  } catch (err) { console.error('Approval email failed:', err.message); }
}

async function sendRejectionEmail(user) {
  try {
    await transporter.sendMail({
      from: `"aXess Admin" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Update on Your aXess Membership Request',
      html: `<h2>Hello ${user.fullName},</h2><p>Your membership application has been <strong>rejected</strong>.</p><p>You are welcome to re-apply after addressing any issues.</p><br><p>Best regards,<br>aXess Team</p>`,
    });
  } catch (err) { console.error('Rejection email failed:', err.message); }
}

// ── File-serving helper ──────────────────────────────────────────────────────
router.get('/file/:filename', (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(process.cwd(), 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: `File not found: ${filename}` });
    }

    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.pdf':  'application/pdf',
      '.png':  'image/png',
      '.jpg':  'image/jpeg',
      '.jpeg': 'image/jpeg',
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.setHeader('Content-Type',        contentType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Access-Control-Allow-Origin',      process.env.FRONTEND_URL || 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error('File serve error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET all members ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password -__v').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST create member manually (admin adds from Members page) ───────────────
// Accepts optional passportPhotoFile as multipart/form-data
router.post('/manual', manualUpload, async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      accountType  = 'non_student',
      institution  = 'MUST',
      membership   = 'None',
      password,
      role         = 'user',
      verificationStatus = 'approved',
    } = req.body;

    if (!fullName || !email || !phone) {
      return res.status(400).json({ message: 'fullName, email and phone are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : await bcrypt.hash('TempPass123!', 10);

    const userData = {
      fullName,
      email: normalizedEmail,
      phone,
      password: hashedPassword,
      accountType,
      institution,
      membership,
      role,
      verificationStatus,
    };

    // Attach passport photo if uploaded
    if (req.file) {
      userData.passportPhotoFile = req.file.filename;
    }

    const user = new User(userData);
    await user.save();

    res.status(201).json({
      _id:               user._id,
      fullName:          user.fullName,
      email:             user.email,
      phone:             user.phone,
      accountType:       user.accountType,
      verificationStatus:user.verificationStatus,
      role:              user.role,
      passportPhotoFile: user.passportPhotoFile,
    });
  } catch (err) {
    console.error('Manual create error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// ── PATCH approve ────────────────────────────────────────────────────────────
router.patch('/:id/approve', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { verificationStatus: 'approved' }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    sendApprovalEmail(user);
    res.json(user);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ── PATCH reject ─────────────────────────────────────────────────────────────
router.patch('/:id/reject', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { verificationStatus: 'rejected' }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    sendRejectionEmail(user);
    res.json(user);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ── PATCH update role ────────────────────────────────────────────────────────
router.patch('/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const allowed = ['user', 'admin', 'innovator', 'member', 'guard', 'leader'];
    if (!allowed.includes(role)) return res.status(400).json({ message: 'Invalid role' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ── DELETE member ────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Clean up uploaded files
    const filesToDelete = ['passportPhotoFile', 'studentIdFile', 'nationalIdFile', 'educationProofFile', 'centerFormFile'];
    for (const field of filesToDelete) {
      if (user[field]) {
        const fp = path.join(process.cwd(), 'uploads', path.basename(user[field]));
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
      }
    }

    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;