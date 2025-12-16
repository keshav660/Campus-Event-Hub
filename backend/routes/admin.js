// routes/admin.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/role');

router.get('/stats', auth, isAdmin, async (req, res) => {
  // placeholder - replace with real aggregation later
  res.json({
    totalEventsHosted: 0,
    totalRegistrations: 0,
    pendingApprovals: 0
  });
});

module.exports = router;
