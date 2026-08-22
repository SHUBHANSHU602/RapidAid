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
const { generateDriverReplies } = require('../services/ai/driverAssistService');
const EmergencySession = require('../models/EmergencySession');

// Driver requests quick replies
router.post('/:id/driver-replies', protect, async (req, res, next) => {
  try {
    const role = req.user.role.toLowerCase();
    if (role !== 'driver' && role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Driver role required' });
    }

    const session = await EmergencySession.findById(req.params.id).lean();
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const { lastPatientMessage, etaMinutes = 5 } = req.body;

    if (!lastPatientMessage || lastPatientMessage.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'lastPatientMessage is required' });
    }

    const replies = await generateDriverReplies(
      lastPatientMessage,
      session.emergencyType,
      etaMinutes
    );

    res.json({ success: true, replies });
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