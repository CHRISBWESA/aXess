// ═══════════════════════════════════════════════════════════════════════════
// BACKEND MIDDLEWARE FOR ROLE-BASED ACCESS CONTROL
// ═══════════════════════════════════════════════════════════════════════════
// Add this to your backend routes (requests.js, members.js, reports.js, etc.)
// Place this AFTER the authMiddleware but BEFORE admin-only route handlers

// ────────────────────────────────────────────────────────────────────────────
// ADMIN-ONLY MIDDLEWARE
// ────────────────────────────────────────────────────────────────────────────
const adminOnly = async (req, res, next) => {
  try {
    // req.user is already set by authMiddleware
    // Now check if the user's role is 'admin'
    
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    if (user.role !== 'admin') {
      console.log(`[ADMIN CHECK] User ${req.user.id} (${user.email}) attempted to access admin route`);
      return res.status(403).json({ 
        msg: 'Access denied. Administrator privileges required.' 
      });
    }
    
    // User is admin, proceed
    next();
  } catch (err) {
    console.error('[ADMIN CHECK ERROR]', err.message);
    res.status(500).json({ msg: 'Server error during authorization check' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// USAGE EXAMPLES IN YOUR ROUTES
// ────────────────────────────────────────────────────────────────────────────

// Example 1: In routes/requests.js
// GET all requests (admin only)
router.get('/all', authMiddleware, adminOnly, async (req, res) => {
  try {
    const requests = await Request.find()
      .populate('roomId', 'name code')
      .populate('userId', 'fullName phone email')
      .sort({ requestedAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET pending returns (admin only)
router.get('/pending-returns', authMiddleware, adminOnly, async (req, res) => {
  try {
    const requests = await Request.find({ returnApprovalStatus: 'pending_approval' })
      .populate('roomId', 'name code')
      .populate('userId', 'fullName phone email')
      .sort({ returnRequestedAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// PATCH approve return (admin only)
router.patch('/:id/approve-return', authMiddleware, adminOnly, async (req, res) => {
  // ... admin logic
});

// PATCH reject return (admin only)
router.patch('/:id/reject-return', authMiddleware, adminOnly, async (req, res) => {
  // ... admin logic
});

// ────────────────────────────────────────────────────────────────────────────

// Example 2: In routes/members.js
// GET all members (admin only)
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  // ... admin logic
});

// PATCH approve member (admin only)
router.patch('/:id/approve', authMiddleware, adminOnly, async (req, res) => {
  // ... admin logic
});

// PATCH reject member (admin only)
router.patch('/:id/reject', authMiddleware, adminOnly, async (req, res) => {
  // ... admin logic
});

// DELETE member (admin only)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  // ... admin logic
});

// ────────────────────────────────────────────────────────────────────────────

// Example 3: In routes/reports.js
// GET all reports (admin only)
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  // ... admin logic
});

// ────────────────────────────────────────────────────────────────────────────

// Example 4: In routes/dashboard.js
// Dashboard stats might show different data for admin vs user
// Option A: Same endpoint, filter data based on role
router.get('/stats', authMiddleware, async (req, res) => {
  const User = require('../models/User');
  const user = await User.findById(req.user.id);
  const isAdmin = user.role === 'admin';
  
  if (isAdmin) {
    // Return full stats for admin
    // ... fetch all data
  } else {
    // Return limited stats for regular users
    // ... fetch only user-specific data
  }
});

// ────────────────────────────────────────────────────────────────────────────
// EXPORT THE MIDDLEWARE
// ────────────────────────────────────────────────────────────────────────────
module.exports = { adminOnly };

// Then in each route file, import it:
// const { adminOnly } = require('../middleware/auth'); // if you put it in middleware/auth.js
// OR just define it at the top of each route file that needs it

