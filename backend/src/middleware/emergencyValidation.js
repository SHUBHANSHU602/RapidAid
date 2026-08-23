const { body } = require('express-validator');

exports.validateTrigger = [
  body('lat')
    .notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('lng')
    .notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  body('emergencyType')
    .notEmpty().withMessage('Emergency type is required')
    .isIn([
      'ACCIDENT', 'CARDIAC', 'FIRE', 'STROKE', 'OTHER',
      'SNAKE_BITE', 'BREATHING', 'HEAD_INJURY', 'BURNS',
      'POISONING', 'PREGNANCY', 'TRAUMA', 'RESPIRATORY', 'NEUROLOGICAL'
    ])
    .withMessage('Invalid emergency type'),
  body('severityLevel')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Severity must be between 1 and 5'),
  body('description')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Description must be under 500 characters'),
];