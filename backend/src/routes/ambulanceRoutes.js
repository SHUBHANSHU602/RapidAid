const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  getAllAmbulances,
  getAmbulanceById,
  updateAmbulanceStatus,
} = require('../controllers/ambulanceController');

router.use(protect);

router.get('/', getAllAmbulances);
router.get('/:id', getAmbulanceById);
router.patch('/:id/status', restrictTo('admin'), updateAmbulanceStatus);

module.exports = router;