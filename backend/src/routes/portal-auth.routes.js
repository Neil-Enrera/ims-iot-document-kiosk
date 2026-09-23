const express = require('express');
const router = express.Router();
const portalAuthController = require('../controllers/portal-auth.controller');
const authenticatePortal = require('../middleware/portal-auth.middleware');
const validate = require('../middleware/validation.middleware');
const {
  loginValidation,
  changePasswordValidation,
  forgotPasswordValidation,
  verifyResetCodeValidation,
  resetPasswordValidation
} = require('../validations/portal-auth.validation');

router.post('/login', ...loginValidation, validate, portalAuthController.login);
router.get('/me', authenticatePortal, portalAuthController.getMe);
router.post('/change-password', authenticatePortal, ...changePasswordValidation, validate, portalAuthController.changePassword);
router.post('/forgot-password', ...forgotPasswordValidation, validate, portalAuthController.forgotPassword);
router.post('/verify-reset-code', ...verifyResetCodeValidation, validate, portalAuthController.verifyResetCode);
router.post('/reset-password', ...resetPasswordValidation, validate, portalAuthController.resetPassword);

module.exports = router;
