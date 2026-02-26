// routes/attendance.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

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

// Helper: Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// ══════════════════════════════════════════════════════════════════════════
// POST /api/attendance/check-in
// User checks in using fingerprint
// ══════════════════════════════════════════════════════════════════════════
router.post('/check-in', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = getTodayDate();

    // Check if user already checked in today
    const existing = await Attendance.findOne({ userId, date: today });
    if (existing) {
      return res.status(400).json({ 
        msg: 'You have already checked in today',
        checkInTime: existing.checkInTime
      });
    }

    // Create new attendance record
    const attendance = new Attendance({
      userId,
      date: today,
      checkInTime: new Date(),
      authMethod: 'fingerprint',
      status: 'checked_in'
    });

    await attendance.save();

    const populated = await Attendance.findById(attendance._id)
      .populate('userId', 'fullName email phone membership');

    console.log(`[CHECK-IN] User ${userId} checked in at ${new Date().toISOString()}`);

    res.status(201).json({
      msg: 'Checked in successfully',
      attendance: populated
    });
  } catch (err) {
    console.error('[CHECK-IN ERROR]', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// PATCH /api/attendance/check-out
// User checks out
// ══════════════════════════════════════════════════════════════════════════
router.patch('/check-out', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = getTodayDate();

    // Find today's check-in
    const attendance = await Attendance.findOne({ 
      userId, 
      date: today,
      status: 'checked_in'
    });

    if (!attendance) {
      return res.status(404).json({ 
        msg: 'No active check-in found for today. Please check in first.'
      });
    }

    // Update with check-out time
    attendance.checkOutTime = new Date();
    attendance.status = 'checked_out';
    await attendance.save();

    const populated = await Attendance.findById(attendance._id)
      .populate('userId', 'fullName email phone membership');

    console.log(`[CHECK-OUT] User ${userId} checked out at ${new Date().toISOString()}`);

    res.json({
      msg: 'Checked out successfully',
      attendance: populated
    });
  } catch (err) {
    console.error('[CHECK-OUT ERROR]', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// GET /api/attendance/my-status
// Get current user's attendance status for today
// ══════════════════════════════════════════════════════════════════════════
router.get('/my-status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = getTodayDate();

    const attendance = await Attendance.findOne({ userId, date: today })
      .populate('userId', 'fullName email phone membership');

    if (!attendance) {
      return res.json({ 
        checkedIn: false,
        message: 'Not checked in today'
      });
    }

    res.json({
      checkedIn: true,
      status: attendance.status,
      checkInTime: attendance.checkInTime,
      checkOutTime: attendance.checkOutTime,
      attendance
    });
  } catch (err) {
    console.error('[MY-STATUS ERROR]', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// GET /api/attendance/today
// Get all attendance records for today (admin only)
// ══════════════════════════════════════════════════════════════════════════
router.get('/today', authMiddleware, adminOnly, async (req, res) => {
  try {
    const today = getTodayDate();

    const attendances = await Attendance.find({ date: today })
      .populate('userId', 'fullName email phone membership role accountType')
      .sort({ checkInTime: -1 });

    res.json({
      date: today,
      count: attendances.length,
      attendances
    });
  } catch (err) {
    console.error('[TODAY ATTENDANCE ERROR]', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// GET /api/attendance/history
// Get attendance history with date range (admin only)
// ══════════════════════════════════════════════════════════════════════════
router.get('/history', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else {
      // Default: Last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
      const today = getTodayDate();
      query.date = { $gte: thirtyDaysAgoStr, $lte: today };
    }

    const attendances = await Attendance.find(query)
      .populate('userId', 'fullName email phone membership role accountType')
      .sort({ date: -1, checkInTime: -1 });

    res.json({
      count: attendances.length,
      attendances
    });
  } catch (err) {
    console.error('[HISTORY ERROR]', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// GET /api/attendance/stats
// Get attendance statistics (admin only)
// ══════════════════════════════════════════════════════════════════════════
router.get('/stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const today = getTodayDate();

    const [todayCount, totalUsers, weekAttendance] = await Promise.all([
      Attendance.countDocuments({ date: today }),
      User.countDocuments({ verificationStatus: 'approved' }),
      Attendance.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
          }
        },
        {
          $group: {
            _id: '$date',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      todayCount,
      totalUsers,
      attendanceRate: totalUsers > 0 ? Math.round((todayCount / totalUsers) * 100) : 0,
      weekAttendance
    });
  } catch (err) {
    console.error('[STATS ERROR]', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;