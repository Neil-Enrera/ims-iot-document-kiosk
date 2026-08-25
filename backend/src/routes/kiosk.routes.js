const express = require('express');
const router = express.Router();
const controller = require('../controllers/kiosk.controller');
const validate = require('../middleware/validation.middleware');
const { barangayIdApplicationValidation, createRequestValidation, rfidVerifyValidation } = require('../validations/kiosk.validation');
const { restrictStatusDisplayToLan } = require('../middleware/status-display-guard.middleware');

// Public kiosk endpoints (no auth required)
router.get('/kiosk/residents/search', controller.searchResidents);
router.get('/kiosk/residents/:id', controller.getResident);
router.get('/kiosk/services', controller.getServices);
router.post('/kiosk/requests', ...createRequestValidation, validate, controller.createRequest);
router.post('/kiosk/requests/preview', ...createRequestValidation, validate, controller.previewRequestDocument);
router.post('/kiosk/barangay-id', ...barangayIdApplicationValidation, validate, controller.createBarangayIdApplication);
router.post('/kiosk/barangay-id/preview', ...barangayIdApplicationValidation, validate, controller.previewBarangayId);
router.post('/kiosk/rfid/verify', ...rfidVerifyValidation, validate, controller.verifyRfid);
router.get('/kiosk/status-display', restrictStatusDisplayToLan, controller.getStatusDisplay);
router.get('/kiosk/status-display/stream', restrictStatusDisplayToLan, controller.getStatusDisplayStream);
router.get('/kiosk/hardware/status', controller.getHardwareStatus);
router.get('/kiosk/settings', controller.getKioskSettings);
router.get('/kiosk/barangay-id/config', controller.getBarangayIdConfig);

module.exports = router;
