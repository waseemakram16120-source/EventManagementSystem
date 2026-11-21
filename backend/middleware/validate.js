const { body, validationResult } = require('express-validator');

const CATEGORIES = [
  'conference', 'workshop', 'seminar', 'meetup', 'concert',
  'sports', 'exhibition', 'party', 'other',
];

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0].msg,
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const notInPast = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Please provide a valid date');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) throw new Error('Event date cannot be in the past');
  return true;
};

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ max: 50 }).withMessage('Name must be at most 50 characters'),
  body('email').trim().isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidation,
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation,
];

const eventValidation = [
  body('title').trim().notEmpty().withMessage('Event title is required')
    .isLength({ max: 100 }).withMessage('Title must be at most 100 characters'),
  body('description').trim().notEmpty().withMessage('Event description is required')
    .isLength({ max: 2000 }).withMessage('Description must be at most 2000 characters'),
  body('category').isIn(CATEGORIES).withMessage('Please choose a valid category'),
  body('date').notEmpty().withMessage('Event date is required').custom(notInPast),
  body('time').trim().notEmpty().withMessage('Event time is required'),
  body('location.venue').trim().notEmpty().withMessage('Venue is required'),
  body('location.address').trim().notEmpty().withMessage('Address is required'),
  body('location.city').trim().notEmpty().withMessage('City is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price cannot be negative'),
  body('image').optional({ values: 'falsy' }).isURL().withMessage('Image must be a valid URL'),
  handleValidation,
];

// Same rules, but every field optional — used for PUT /api/events/:id.
const eventUpdateValidation = [
  body('title').optional().trim().notEmpty().withMessage('Event title is required')
    .isLength({ max: 100 }).withMessage('Title must be at most 100 characters'),
  body('description').optional().trim().notEmpty().withMessage('Event description is required')
    .isLength({ max: 2000 }).withMessage('Description must be at most 2000 characters'),
  body('category').optional().isIn(CATEGORIES).withMessage('Please choose a valid category'),
  body('date').optional().custom(notInPast),
  body('time').optional().trim().notEmpty().withMessage('Event time is required'),
  body('location.venue').optional().trim().notEmpty().withMessage('Venue is required'),
  body('location.address').optional().trim().notEmpty().withMessage('Address is required'),
  body('location.city').optional().trim().notEmpty().withMessage('City is required'),
  body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price cannot be negative'),
  body('image').optional({ values: 'falsy' }).isURL().withMessage('Image must be a valid URL'),
  handleValidation,
];

module.exports = { registerValidation, loginValidation, eventValidation, eventUpdateValidation, CATEGORIES };
