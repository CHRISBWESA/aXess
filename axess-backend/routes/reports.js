const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const { protect, adminOnly } = require('../middleware/auth');

// Get all reports → only admins
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reportedBy', 'fullName email phone')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    console.error('GET reports error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new report → any logged-in user
router.post('/', protect, async (req, res) => {
  try {
    const { title, roomCode, description, priority } = req.body;

    if (!title?.trim() || !roomCode?.trim()) {
      return res.status(400).json({ message: 'Title and room code are required' });
    }

    const report = new Report({
      title: title.trim(),
      roomCode: roomCode.trim().toUpperCase(),
      reportedBy: req.user.id,
      description: description?.trim() || '',
      priority: priority || 'medium',
      status: 'open'
    });

    await report.save();

    const populated = await Report.findById(report._id)
      .populate('reportedBy', 'fullName email phone');

    res.status(201).json(populated);
  } catch (err) {
    console.error('POST report error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;