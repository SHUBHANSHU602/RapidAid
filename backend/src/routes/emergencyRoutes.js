const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { validateTrigger } = require('../middleware/emergencyValidation');
const {
  triggerEmergency,
  getSession,
  getAllSessions,
  transitionSession,
} = require('../controllers/emergencyController');

router.use(protect); // All emergency routes require login

router.post('/trigger', validate(validateTrigger), triggerEmergency);
router.get('/', getAllSessions);
router.get('/:id', getSession);
router.post('/:id/transition', transitionSession);

module.exports = router;