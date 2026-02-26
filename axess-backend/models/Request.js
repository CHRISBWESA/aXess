const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  carriedItems: String,
  phone: { type: String, trim: true },
  membership: String,
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'returned'], 
    default: 'pending' 
  },
  requestedAt: { type: Date, default: Date.now },
  returnedAt: Date,
  
  // NEW: Return approval workflow
  returnApprovalStatus: {
    type: String,
    enum: ['none', 'pending_approval', 'approved', 'rejected'],
    default: 'none'
  },
  returnRequestedAt: Date,
  returnApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  returnApprovedAt: Date,
  
  // NEW: Track who actually made the request (for admin impersonation)
  requestedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    // If not set, defaults to userId (user requested for themselves)
  },
  isAdminRequest: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Index for faster queries
requestSchema.index({ userId: 1, roomId: 1 });
requestSchema.index({ returnApprovalStatus: 1 });

module.exports = mongoose.model('Request', requestSchema);