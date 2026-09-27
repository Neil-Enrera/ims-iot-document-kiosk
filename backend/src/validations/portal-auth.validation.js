const { body } = require('express-validator');

const loginValidation = [
  body().custom((_, { req }) => {
    const id = req.body.email || req.body.identifier || req.body.accountId || req.body.account_id || req.body.residentCode || req.body.resident_code;
    if (!id || typeof id !== 'string' || !id.trim()) {
      throw new Error('Email address or Resident ID is required.');
    }
    if (id.trim().length > 100) {
      throw new Error('Email or Resident ID must not exceed 100 characters.');
    }
    return true;
  }),
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
    .isLength({ min: 3, max: 100 }).withMessage('Invalid identifier.'),
  body('account_id')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Invalid identifier.'),
  body('email')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Invalid email.')
];

const verifyResetCodeValidation = [
  body('accountId').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Invalid identifier.'),
  body('email').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Invalid email.'),
  body('code').trim().notEmpty().withMessage('Verification code is required.')
];

const resetPasswordValidation = [
  body('accountId').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Invalid identifier.'),
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
