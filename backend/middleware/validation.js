const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your input data',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Authentication validation rules
const signupValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('role')
    .isIn(['doctor', 'nurse', 'radiologist', 'admin'])
    .withMessage('Role must be one of: doctor, nurse, radiologist, admin'),
  body('licenseNumber')
    .optional()
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage('License number must be between 5 and 20 characters'),
  handleValidationErrors
];

const signinValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Patient validation rules
const patientValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  body('gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  body('phoneNumber')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must be less than 200 characters'),
  body('medicalHistory')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Medical history must be less than 1000 characters'),
  handleValidationErrors
];

const patientUpdateValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid patient ID format'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  body('phoneNumber')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must be less than 200 characters'),
  body('medicalHistory')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Medical history must be less than 1000 characters'),
  handleValidationErrors
];

// Symptom validation rules
const symptomValidation = [
  body('patientId')
    .isUUID()
    .withMessage('Invalid patient ID format'),
  body('symptoms')
    .isArray({ min: 1 })
    .withMessage('At least one symptom must be provided'),
  body('symptoms.*.name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Symptom name must be between 2 and 100 characters'),
  body('symptoms.*.severity')
    .isIn(['mild', 'moderate', 'severe'])
    .withMessage('Symptom severity must be mild, moderate, or severe'),
  body('symptoms.*.duration')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Duration must be less than 100 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  handleValidationErrors
];

// Query parameter validation
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must be less than 100 characters'),
  handleValidationErrors
];

module.exports = {
  signupValidation,
  signinValidation,
  patientValidation,
  patientUpdateValidation,
  symptomValidation,
  paginationValidation,
  handleValidationErrors
};
