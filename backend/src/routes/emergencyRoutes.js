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
const { generateDelayMessage } = require('../services/ai/delayMessageService');

// Temporary test route — remove before Phase 4
router.post('/:id/test-delay-message', protect, async (req, res, next) => {
  try {
    const session = await EmergencySession.findById(req.params.id).lean();
    if (!session) return res.status(404).json({ message: 'Session not found' });
    const { currentEta = 10, drift = 5 } = req.body;
    const message = await generateDelayMessage(session, currentEta, drift);
    res.json({ success: true, message });
  } catch (err) {
    next(err);
  }
});
router.use(protect); // All emergency routes require login

router.post('/trigger', validate(validateTrigger), triggerEmergency);
router.get('/', getAllSessions);
router.get('/:id', getSession);
router.post('/:id/transition', transitionSession);

module.exports = router;