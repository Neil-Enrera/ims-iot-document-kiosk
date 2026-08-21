const { body, param, query } = require('express-validator');

const nameRegex = /^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\-\.\']+$/;

const createValidation = [
  body('roleId').isInt({ min: 1 }).withMessage('Role ID is required.'),
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required.')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters.'),
  body('password')
    .isLength({ min: 6, max: 100 }).withMessage('Password must be between 6 and 100 characters.'),
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required.')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters.')
    .matches(nameRegex).withMessage('First name must contain letters only.'),
  body('middleName')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 50 }).withMessage('Middle name must not exceed 50 characters.')
    .matches(nameRegex).withMessage('Middle name must contain letters only.'),
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required.')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters.')
    .matches(nameRegex).withMessage('Last name must contain letters only.'),
  body('email')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail().withMessage('Invalid email format.')
    .isLength({ max: 100 }).withMessage('Email must not exceed 100 characters.'),
  body('contactNumber')
    .optional({ values: 'falsy' })
    .trim()
    .custom(val => {
      if (!val) return true;
      const clean = String(val).replace(/[\s\-()]/g, '');
      if (!/^(09\d{9}|\+639\d{9})$/.test(clean)) {
        throw new Error('Contact number must be a valid 11-digit mobile number (e.g. 09123456789).');
      }
      return true;
    })
];

const updateValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid user ID.'),
  body('roleId').isInt({ min: 1 }).withMessage('Role ID is required.'),
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required.')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters.')
    .matches(nameRegex).withMessage('First name must contain letters only.'),
  body('middleName')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 50 }).withMessage('Middle name must not exceed 50 characters.')
    .matches(nameRegex).withMessage('Middle name must contain letters only.'),
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required.')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters.')
    .matches(nameRegex).withMessage('Last name must contain letters only.'),
  body('email')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail().withMessage('Invalid email format.')
    .isLength({ max: 100 }).withMessage('Email must not exceed 100 characters.'),
  body('contactNumber')
    .optional({ values: 'falsy' })
    .trim()
    .custom(val => {
      if (!val) return true;
      const clean = String(val).replace(/[\s\-()]/g, '');
      if (!/^(09\d{9}|\+639\d{9})$/.test(clean)) {
        throw new Error('Contact number must be a valid 11-digit mobile number (e.g. 09123456789).');
      }
      return true;
    })
];

const statusValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid user ID.'),
  body('status').isIn(['ACTIVE', 'INACTIVE']).withMessage('Status must be ACTIVE or INACTIVE.')
];

const passwordValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid user ID.'),
  body('password').isLength({ min: 6, max: 100 }).withMessage('Password must be between 6 and 100 characters.')
];

const getAllValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100.'),
  query('sortBy').optional().isIn(['user_id', 'username', 'first_name', 'last_name', 'email', 'status', 'created_at']).withMessage('Invalid sort column.'),
  query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('Sort order must be ASC or DESC.')
];

module.exports = { createValidation, updateValidation, statusValidation, passwordValidation, getAllValidation };

