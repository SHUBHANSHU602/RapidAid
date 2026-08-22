const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  getOverview,
  getEmergencyTypes,
  getDelayStats,
  getResponseTimes
} = require('../controllers/analyticsController');

// All analytics routes require admin access
router.use(protect);
router.use(restrictTo('admin'));

router.get('/overview', getOverview);
router.get('/emergency-types', getEmergencyTypes);
router.get('/delay-stats', getDelayStats);
router.get('/response-times', getResponseTimes);

module.exports = router;
