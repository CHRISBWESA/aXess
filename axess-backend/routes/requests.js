const express = require('express');
const jwt = require('jsonwebtoken');
const Request = require('../models/Request');
const Room = require('../models/Room');
const router = express.Router();

// Auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ msg: 'No token provided, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Admin check middleware
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Admin access required' });
  }
  next();
};

// GET user's requests
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const requests = await Request.find({ userId })
      .populate('roomId', 'name code')
      .populate('userId', 'fullName phone')
      .sort({ requestedAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error('GET /requests error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET ALL requests (admin only) - for Reports page
router.get('/all', authMiddleware, adminOnly, async (req, res) => {
  try {
    const requests = await Request.find()
      .populate('roomId', 'name code')
      .populate('userId', 'fullName phone email')
      .sort({ requestedAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error('GET /requests/all error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET pending return approvals (admin only)
router.get('/pending-returns', authMiddleware, adminOnly, async (req, res) => {
  try {
    const requests = await Request.find({ returnApprovalStatus: 'pending_approval' })
      .populate('roomId', 'name code')
      .populate('userId', 'fullName phone email')
      .sort({ returnRequestedAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error('GET /pending-returns error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST new request
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { roomId, carriedItems, phone, membership } = req.body;
    const userId = req.user.id;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ msg: 'Room not found' });
    
    if (room.status !== 'available') {
      return res.status(400).json({ msg: 'Room is not available' });
    }
    
    if (room.isPrivate) {
      return res.status(403).json({ msg: 'This is a private room and cannot be requested' });
    }

    // Check if this is an impersonation request
    const isImpersonating = req.user.isImpersonating || false;
    const requestedBy = req.user.impersonatedBy || userId;

    const newRequest = new Request({
      userId,
      roomId,
      carriedItems,
      phone: phone?.trim() || undefined,
      membership: membership || 'No Membership',
      requestedBy: requestedBy,  // Who actually made the request
      isAdminRequest: isImpersonating
    });

    await newRequest.save();

    // Update room status
    await Room.findByIdAndUpdate(roomId, { status: 'requested' });

    // Return populated with requestedBy info
    const populated = await Request.findById(newRequest._id)
      .populate('roomId', 'name code')
      .populate('userId', 'fullName phone')
      .populate('requestedBy', 'fullName role');

    console.log(`[REQUEST] User: ${userId}, Room: ${roomId}, RequestedBy: ${requestedBy}, IsAdmin: ${isImpersonating}`);

    res.status(201).json(populated);
  } catch (err) {
    console.error('POST /requests error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PATCH request return (user initiates, needs admin approval)
router.patch('/:id/return', authMiddleware, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ msg: 'Request not found' });

    if (request.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to return this request' });
    }

    if (request.status !== 'approved' && request.status !== 'pending') {
      return res.status(400).json({ msg: 'Can only return pending or approved requests' });
    }

    // User requests to return → needs admin approval
    const updated = await Request.findByIdAndUpdate(
      req.params.id,
      { 
        returnApprovalStatus: 'pending_approval',
        returnRequestedAt: new Date()
      },
      { new: true }
    ).populate('roomId', 'name code')
     .populate('userId', 'fullName phone');

    console.log(`[RETURN REQUESTED] User ${req.user.id} requesting return for request ${req.params.id}`);
    res.json(updated);
  } catch (err) {
    console.error('PATCH /return error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PATCH approve return (admin only)
router.patch('/:id/approve-return', authMiddleware, adminOnly, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ msg: 'Request not found' });

    if (request.returnApprovalStatus !== 'pending_approval') {
      return res.status(400).json({ msg: 'No pending return request' });
    }

    // Admin approves the return
    const updated = await Request.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'returned',
        returnedAt: new Date(),
        returnApprovalStatus: 'approved',
        returnApprovedBy: req.user.id,
        returnApprovedAt: new Date()
      },
      { new: true }
    ).populate('roomId', 'name code')
     .populate('userId', 'fullName phone');

    // Make room available again
    await Room.findByIdAndUpdate(request.roomId, { status: 'available' });

    console.log(`[RETURN APPROVED] Admin ${req.user.id} approved return for request ${req.params.id}`);
    res.json(updated);
  } catch (err) {
    console.error('PATCH /approve-return error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PATCH reject return (admin only)
router.patch('/:id/reject-return', authMiddleware, adminOnly, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ msg: 'Request not found' });

    if (request.returnApprovalStatus !== 'pending_approval') {
      return res.status(400).json({ msg: 'No pending return request' });
    }

    // Admin rejects the return
    const updated = await Request.findByIdAndUpdate(
      req.params.id,
      { 
        returnApprovalStatus: 'rejected',
        returnApprovedBy: req.user.id,
        returnApprovedAt: new Date()
      },
      { new: true }
    ).populate('roomId', 'name code')
     .populate('userId', 'fullName phone');

    console.log(`[RETURN REJECTED] Admin ${req.user.id} rejected return for request ${req.params.id}`);
    res.json(updated);
  } catch (err) {
    console.error('PATCH /reject-return error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;