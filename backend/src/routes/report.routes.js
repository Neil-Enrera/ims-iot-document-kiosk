const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

router.get('/requests', authenticate, authorize('Administrator', 'Barangay Secretary'), reportController.requestsReport);
router.get('/residents', authenticate, authorize('Administrator', 'Barangay Secretary'), reportController.residentsReport);

module.exports = router;
