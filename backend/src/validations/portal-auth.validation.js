const { body } = require('express-validator');

const loginValidation = [
  body('accountId')
    .trim()
    .notEmpty().withMessage('Account ID is required.')
    .isLength({ min: 3, max: 20 }).withMessage('Account ID must be 3-20 characters.'),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ max: 100 }).withMessage('Password must not exceed 100 characters.')
];

const changePasswordValidation = [
  body('newPassword')
    .isLength({ min: 8, max: 100 }).withMessage('New password must be between 8 and 100 characters.')
];

const forgotPasswordValidation = [
  body('accountId')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 }).withMessage('Invalid Account ID.'),
  body('account_id')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 }).withMessage('Invalid Account ID.'),
  body('email')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Invalid email.')
];

const verifyResetCodeValidation = [
  body('accountId').optional().trim().isLength({ min: 3, max: 20 }).withMessage('Invalid Account ID.'),
  body('email').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Invalid email.'),
  body('code').trim().notEmpty().withMessage('Verification code is required.')
];

const resetPasswordValidation = [
  body('accountId').optional().trim().isLength({ min: 3, max: 20 }).withMessage('Invalid Account ID.'),
  body('email').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Invalid email.'),
  body('resetToken').trim().notEmpty().withMessage('Reset token is required.'),
  body('newPassword')
    .isLength({ min: 8, max: 100 }).withMessage('Password must be between 8 and 100 characters.')
];

module.exports = {
  loginValidation,
  changePasswordValidation,
  forgotPasswordValidation,
  verifyResetCodeValidation,
  resetPasswordValidation
};
