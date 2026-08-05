const express = require('express');
const router = express.Router();
const requestController = require('../controllers/request.controller');
const documentRoutes = require('./document.routes');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');
const { createValidation, updateValidation, statusValidation, changeStatusValidation, getAllValidation } = require('../validations/request.validation');

router.get('/stats', authenticate, authorize('Administrator', 'Barangay Secretary', 'Barangay Captain'), requestController.stats);
router.get('/', authenticate, authorize('Administrator', 'Barangay Secretary', 'Staff'), ...getAllValidation, validate, requestController.getAll);
router.get('/:id', authenticate, authorize('Administrator', 'Barangay Secretary', 'Staff'), requestController.getById);
router.post('/', authenticate, authorize('Administrator', 'Barangay Secretary', 'Staff'), ...createValidation, validate, requestController.create);
router.put('/:id', authenticate, authorize('Administrator', 'Barangay Secretary'), ...updateValidation, validate, requestController.update);
router.put('/:id/status', authenticate, authorize('Administrator', 'Barangay Secretary'), ...changeStatusValidation, validate, requestController.changeStatus);
router.post('/:id/approve', authenticate, authorize('Administrator', 'Barangay Secretary', 'Barangay Captain'), ...statusValidation, validate, requestController.approve);
router.post('/:id/reject', authenticate, authorize('Administrator', 'Barangay Secretary', 'Barangay Captain'), ...statusValidation, validate, requestController.reject);
router.post('/:id/cancel', authenticate, authorize('Administrator', 'Barangay Secretary'), ...statusValidation, validate, requestController.cancel);
router.post('/:id/release', authenticate, authorize('Administrator', 'Barangay Secretary'), ...statusValidation, validate, requestController.release);

// Automatic document generation endpoints
router.use('/:id/documents', documentRoutes);

module.exports = router;
