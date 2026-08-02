const { body, param, query } = require('express-validator');

const createValidation = [
  body('roleId').isInt({ min: 1 }).withMessage('Role ID is required.'),
  body('username').trim().notEmpty().withMessage('Username is required.')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('firstName').trim().notEmpty().withMessage('First name is required.'),
  body('middleName').optional().trim(),
  body('lastName').trim().notEmpty().withMessage('Last name is required.'),
  body('email').optional().isEmail().withMessage('Invalid email format.'),
  body('contactNumber').optional().trim()
];

const updateValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid user ID.'),
  body('roleId').isInt({ min: 1 }).withMessage('Role ID is required.'),
  body('firstName').trim().notEmpty().withMessage('First name is required.'),
  body('middleName').optional().trim(),
  body('lastName').trim().notEmpty().withMessage('Last name is required.'),
  body('email').optional().isEmail().withMessage('Invalid email format.'),
  body('contactNumber').optional().trim()
];

const statusValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid user ID.'),
  body('status').isIn(['ACTIVE', 'INACTIVE']).withMessage('Status must be ACTIVE or INACTIVE.')
];

const passwordValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid user ID.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.')
];

const getAllValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100.'),
  query('sortBy').optional().isIn(['user_id', 'username', 'first_name', 'last_name', 'email', 'status', 'created_at']).withMessage('Invalid sort column.'),
  query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('Sort order must be ASC or DESC.')
];

module.exports = { createValidation, updateValidation, statusValidation, passwordValidation, getAllValidation };
