const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');
const { createValidation, updateValidation, statusValidation, getAllValidation } = require('../validations/service.validation');

router.get('/', authenticate, authorize('Administrator', 'Barangay Secretary', 'Staff'), ...getAllValidation, validate, serviceController.getAll);
router.get('/:id', authenticate, authorize('Administrator', 'Barangay Secretary', 'Staff'), serviceController.getById);
router.post('/', authenticate, authorize('Administrator'), ...createValidation, validate, serviceController.create);
router.put('/:id', authenticate, authorize('Administrator'), ...updateValidation, validate, serviceController.update);
router.patch('/:id/status', authenticate, authorize('Administrator'), ...statusValidation, validate, serviceController.changeStatus);
router.delete('/:id', authenticate, authorize('Administrator'), serviceController.remove);

module.exports = router;
