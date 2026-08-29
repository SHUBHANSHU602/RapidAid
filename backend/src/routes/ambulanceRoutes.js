const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAllAmbulances,
  getMyAmbulance,
  getMyActiveSession,
  getAmbulanceById,
  updateAmbulanceStatus,
} = require('../controllers/ambulanceController');

router.use(protect);

router.get('/me', getMyAmbulance);
router.get('/me/active-session', getMyActiveSession);
router.get('/', getAllAmbulances);
router.get('/:id', getAmbulanceById);
router.patch('/:id/status', updateAmbulanceStatus);

module.exports = router;
