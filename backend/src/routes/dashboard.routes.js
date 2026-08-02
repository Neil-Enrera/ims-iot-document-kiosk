const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

router.get('/summary', authenticate, authorize('Administrator', 'Barangay Secretary'), dashboardController.summary);
router.get('/requests', authenticate, authorize('Administrator', 'Barangay Secretary'), dashboardController.requestStats);
router.get('/residents', authenticate, authorize('Administrator', 'Barangay Secretary'), dashboardController.residentStats);
router.get('/services', authenticate, authorize('Administrator', 'Barangay Secretary'), dashboardController.serviceStats);
router.get('/activities', authenticate, authorize('Administrator', 'Barangay Secretary'), dashboardController.recentActivities);

module.exports = router;
