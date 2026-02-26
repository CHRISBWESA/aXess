// models/User.js
const mongoose = require('mongoose');

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

const userSchema = new mongoose.Schema({
  fullName:       { type: String, required: true },
  email:          { type: String, required: true, unique: true },
  phone:          { type: String, required: true },
  password:       { type: String, required: true },
  accountType:    { type: String, enum: ['student', 'non_student'], required: true },
  institution:    String,
  membership:     { type: String, default: 'None' },

  // Student-specific
  regNumber:      String,
  campus:         String,
  program:        String,
  level:          String,
  yearOfStudy:    String,

  // Non-student
  educationBackground: String,

  // ── Uploaded documents ─────────────────────────────────────────────────
  passportPhotoFile:   String,   // NEW — passport-size photo for ID (both student & non-student)
  studentIdFile:       String,   // Students only
  nationalIdFile:      String,   // Non-students: National ID / Registration ID
  educationProofFile:  String,   // Non-students: Residence proof (Village Chairman)
  centerFormFile:      String,   // Non-students: Registration form from center

  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },

  // ── Expanded roles ─────────────────────────────────────────────────────
  role: {
    type: String,
    enum: ['user', 'admin', 'innovator', 'member', 'guard', 'leader'],
    default: 'user',
  },

  // WebAuthn / Fingerprint Authentication
  webauthnCredentials: {
    type: [{
      credentialID:        { type: String, required: true },
      credentialPublicKey: { type: String, required: true },
      counter:             { type: Number, default: 0 },
      transports:          [String],
      registeredAt:        { type: Date, default: Date.now },
    }],
    default: [],
  },

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
module.exports.MEMBERSHIP_OPTIONS = MEMBERSHIP_OPTIONS;