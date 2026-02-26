// routes/dashboard.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Room = require('../models/Room');
const Request = require('../models/Request');
const Report = require('../models/Report');
const { protect } = require('../middleware/auth');

router.get('/stats', protect, async (req, res) => {
  try {
    const [
      totalMembers,
      pendingVerifications,
      totalRooms,
      availableRooms,
      totalRequests,
      pendingRequests,
      totalReports,
      openReports,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ verificationStatus: 'pending' }),
      Room.countDocuments(),
      Room.countDocuments({ status: 'available' }),
      Request.countDocuments(),
      Request.countDocuments({ status: 'pending' }),
      Report.countDocuments(),
      Report.countDocuments({ status: 'open' }),
    ]);

    // Get requests for the last 7 days (for bar chart)
    const last7Days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await Request.countDocuments({
        requestedAt: {
          $gte: date,
          $lt: nextDate
        }
      });

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      last7Days.push({
        name: dayNames[date.getDay()],
        value: count
      });
    }

    // Get monthly data for last 6 months (for line chart)
    const last6Months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      
      const nextMonth = new Date(date);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const [requestCount, userCount] = await Promise.all([
        Request.countDocuments({
          requestedAt: {
            $gte: date,
            $lt: nextMonth
          }
        }),
        User.countDocuments({
          createdAt: {
            $gte: date,
            $lt: nextMonth
          }
        })
      ]);

      last6Months.push({
        name: monthNames[date.getMonth()],
        requests: requestCount,
        users: userCount
      });
    }

    // Get top 5 most used rooms
    const topRooms = await Request.aggregate([
      {
        $group: {
          _id: '$roomId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'rooms',
          localField: '_id',
          foreignField: '_id',
          as: 'room'
        }
      },
      { $unwind: '$room' },
      {
        $project: {
          name: '$room.name',
          code: '$room.code',
          count: 1
        }
      }
    ]);

    // Get request status breakdown
    const requestStatusBreakdown = await Request.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusMap = {
      pending: 0,
      approved: 0,
      returned: 0
    };
    requestStatusBreakdown.forEach(item => {
      statusMap[item._id] = item.count;
    });

    res.json({
      totalMembers,
      pendingVerifications,
      totalRooms,
      availableRooms,
      totalRequests,
      pendingRequests,
      totalReports,
      openReports,
      weeklyRequests: last7Days,
      monthlyData: last6Months,
      topRooms,
      requestStatusBreakdown: statusMap,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Dashboard stats error:', err.message);
    res.status(500).json({ message: 'Failed to load dashboard stats' });
  }
});

module.exports = router;