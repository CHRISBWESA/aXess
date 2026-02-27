// routes/stats.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Room = require('../models/Room');
const Request = require('../models/Request');
const Report = require('../models/report');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/stats/overview
router.get('/overview', protect, adminOnly, async (req, res) => {
  try {
    const stats = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ verificationStatus: 'pending' }),
      Room.countDocuments(),
      Room.countDocuments({ status: 'available' }),
      Request.countDocuments(),
      Request.countDocuments({ status: 'pending' }),
      Request.countDocuments({ status: 'approved' }),
      Report.countDocuments(),
      Report.countDocuments({ status: 'open' }),
    ]);

    res.json({
      totalUsers: stats[0],
      pendingVerifications: stats[1],
      totalRooms: stats[2],
      availableRooms: stats[3],
      totalRequests: stats[4],
      pendingRequests: stats[5],
      activeRequests: stats[6],
      totalReports: stats[7],
      openReports: stats[8],
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Stats error:', err.message);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

module.exports = router;