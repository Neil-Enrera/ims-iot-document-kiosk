const express = require('express');
const router = express.Router();
const rfidController = require('../controllers/rfid.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');
const { registerValidation, assignValidation, verifyValidation, statusValidation, replaceValidation, getAllValidation } = require('../validations/rfid.validation');

router.get('/', authenticate, authorize('Administrator', 'Barangay Secretary'), ...getAllValidation, validate, rfidController.getAll);
router.get('/:id', authenticate, authorize('Administrator', 'Barangay Secretary'), rfidController.getById);
router.get('/uid/:rfidUid', authenticate, authorize('Administrator', 'Barangay Secretary'), rfidController.getByUid);
router.post('/', authenticate, authorize('Administrator', 'Barangay Secretary'), ...registerValidation, validate, rfidController.register);
router.post('/assign', authenticate, authorize('Administrator', 'Barangay Secretary'), ...assignValidation, validate, rfidController.assign);
router.post('/verify', authenticate, ...verifyValidation, validate, rfidController.verify);
router.patch('/:id/status', authenticate, authorize('Administrator'), ...statusValidation, validate, rfidController.updateStatus);
router.patch('/:id/replace', authenticate, authorize('Administrator'), ...replaceValidation, validate, rfidController.replace);
router.delete('/:id', authenticate, authorize('Administrator'), rfidController.remove);

module.exports = router;
