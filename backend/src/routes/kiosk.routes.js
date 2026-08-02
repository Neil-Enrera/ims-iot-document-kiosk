const express = require('express');
const router = express.Router();
const controller = require('../controllers/kiosk.controller');
const validate = require('../middleware/validation.middleware');
const { barangayIdApplicationValidation, createRequestValidation } = require('../validations/kiosk.validation');

// Public kiosk endpoints (no auth required)
router.get('/kiosk/residents/search', controller.searchResidents);
router.get('/kiosk/residents/:id', controller.getResident);
router.get('/kiosk/services', controller.getServices);
router.post('/kiosk/requests', ...createRequestValidation, validate, controller.createRequest);
router.post('/kiosk/barangay-id', ...barangayIdApplicationValidation, validate, controller.createBarangayIdApplication);
router.get('/kiosk/hardware/status', controller.getHardwareStatus);

// RFID verification (DEFERRED — requires hardware)
// Re-enable route when KIOSK_RFID_ENABLED=true in .env
// router.post('/kiosk/rfid/scan', controller.verifyRfid);

module.exports = router;
