const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');
const documentController = require('../controllers/document.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');
const { uploadTemplate } = require('../middleware/upload.middleware');
const { createValidation, updateValidation, statusValidation, getAllValidation } = require('../validations/service.validation');

router.get('/', authenticate, authorize('Administrator', 'Barangay Secretary', 'Staff'), ...getAllValidation, validate, serviceController.getAll);
router.get('/:id', authenticate, authorize('Administrator', 'Barangay Secretary', 'Staff'), serviceController.getById);
router.post('/', authenticate, authorize('Administrator'), ...createValidation, validate, serviceController.create);
router.put('/:id', authenticate, authorize('Administrator'), ...updateValidation, validate, serviceController.update);
router.patch('/:id/status', authenticate, authorize('Administrator'), ...statusValidation, validate, serviceController.changeStatus);
router.post('/:id/template', authenticate, authorize('Administrator'), uploadTemplate.single('template'), serviceController.uploadTemplate);
router.delete('/:id/template', authenticate, authorize('Administrator'), serviceController.removeTemplate);
router.get('/:id/template/placeholders', authenticate, authorize('Administrator', 'Barangay Secretary'), documentController.scanPlaceholders);
router.delete('/:id', authenticate, authorize('Administrator'), serviceController.remove);

module.exports = router;
