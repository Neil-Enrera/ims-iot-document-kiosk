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
router.put('/me', authenticatePortal, portalAuthController.updateProfile);
router.put('/profile', authenticatePortal, portalAuthController.updateProfile);
router.patch('/profile', authenticatePortal, portalAuthController.updateProfile);
router.post('/profile', authenticatePortal, portalAuthController.updateProfile);
router.put('/update-profile', authenticatePortal, portalAuthController.updateProfile);
router.post('/update-profile', authenticatePortal, portalAuthController.updateProfile);
router.post('/change-password', authenticatePortal, ...changePasswordValidation, validate, portalAuthController.changePassword);
router.post('/forgot-password', ...forgotPasswordValidation, validate, portalAuthController.forgotPassword);
router.post('/verify-reset-code', ...verifyResetCodeValidation, validate, portalAuthController.verifyResetCode);
router.post('/reset-password', ...resetPasswordValidation, validate, portalAuthController.resetPassword);
router.post('/contact', portalAuthController.contactUs);
router.get('/contact-info', portalAuthController.getBarangayContactInfo);

// Digital requirement upload (PDF, JPG, JPEG, PNG)
const { upload } = require('../middleware/upload.middleware');
const portalRequestController = require('../controllers/portal-request.controller');

router.post('/upload', authenticatePortal, upload.single('file'), portalRequestController.uploadFile);
router.get('/requests', authenticatePortal, portalRequestController.getRequests);
router.get('/requests/:id', authenticatePortal, portalRequestController.getRequestById);
router.post('/requests', authenticatePortal, portalRequestController.createRequest);
router.put('/requests/:id/resubmit', authenticatePortal, portalRequestController.resubmitRequest);
router.get('/services/:serviceId/previous-data', authenticatePortal, portalRequestController.getPreviousData);

module.exports = router;
