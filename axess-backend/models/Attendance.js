// models/Attendance.js
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  checkInTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  checkOutTime: {
    type: Date,
    default: null
  },
  authMethod: {
    type: String,
    enum: ['fingerprint', 'manual', 'password'],
    default: 'fingerprint'
  },
  status: {
    type: String,
    enum: ['checked_in', 'checked_out'],
    default: 'checked_in'
  },
  // For tracking which day this attendance belongs to
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true
  },
  notes: {
    type: String,
    trim: true
  }
}, { timestamps: true });

// Index for faster queries
attendanceSchema.index({ userId: 1, date: 1 });
attendanceSchema.index({ date: 1 });

// Ensure one check-in per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);