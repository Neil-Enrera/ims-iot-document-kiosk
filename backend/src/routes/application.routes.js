const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/application.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');
const { getAllValidation, reviewValidation } = require('../validations/application.validation');

router.get('/', authenticate, authorize('Administrator', 'Barangay Secretary', 'Barangay Captain', 'Staff'), ...getAllValidation, validate, applicationController.getAll);
router.get('/:id', authenticate, authorize('Administrator', 'Barangay Secretary', 'Barangay Captain', 'Staff'), applicationController.getById);
router.post('/:id/preview', authenticate, authorize('Administrator', 'Barangay Secretary', 'Barangay Captain', 'Staff'), ...reviewValidation, validate, applicationController.preview);
router.post('/:id/approve', authenticate, authorize('Administrator', 'Barangay Secretary', 'Barangay Captain', 'Staff'), ...reviewValidation, validate, applicationController.approve);
router.post('/:id/reject', authenticate, authorize('Administrator', 'Barangay Secretary', 'Barangay Captain', 'Staff'), ...reviewValidation, validate, applicationController.reject);
router.post('/:id/release', authenticate, authorize('Administrator', 'Barangay Secretary', 'Barangay Captain', 'Staff'), ...reviewValidation, validate, applicationController.release);

module.exports = router;
