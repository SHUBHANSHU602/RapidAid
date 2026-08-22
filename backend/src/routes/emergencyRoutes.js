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
  confirmArrival,
  generateArrivalOtp,
  getRouteToDestination,
  sendChatMessage,
  getChatHistory,
  getDriverReplies
} = require('../controllers/emergencyController');

router.use(protect); // All emergency routes require login

router.post('/trigger', validate(validateTrigger), triggerEmergency);
router.get('/', getAllSessions);
router.get('/:id', getSession);
router.post('/:id/transition', transitionSession);

// Missing routes
router.post('/:id/arrive', confirmArrival);
router.post('/:id/generate-otp', generateArrivalOtp);
router.post('/:id/get-route', getRouteToDestination);
router.post('/:id/chat', sendChatMessage);
router.get('/:id/chat', getChatHistory);
router.post('/:id/driver-replies', getDriverReplies);

module.exports = router;