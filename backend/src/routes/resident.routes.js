const express = require('express');
const router = express.Router();
const residentController = require('../controllers/resident.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');
const { createValidation, updateValidation, getAllValidation } = require('../validations/resident.validation');

router.get('/', authenticate, authorize('Administrator', 'Barangay Secretary', 'Staff'), ...getAllValidation, validate, residentController.getAll);
router.get('/:id', authenticate, authorize('Administrator', 'Barangay Secretary', 'Staff'), residentController.getById);
router.post('/', authenticate, authorize('Administrator', 'Barangay Secretary'), ...createValidation, validate, residentController.create);
router.put('/:id', authenticate, authorize('Administrator', 'Barangay Secretary'), ...updateValidation, validate, residentController.update);
router.patch('/:id/archive', authenticate, authorize('Administrator'), residentController.archive);
router.patch('/:id/restore', authenticate, authorize('Administrator'), residentController.restore);
router.delete('/:id', authenticate, authorize('Administrator'), residentController.remove);

module.exports = router;
