const express = require('express');
const router = express.Router();
const controller = require('../controllers/resident-update.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

// Protected Staff / Admin endpoints
router.get('/', authenticate, authorize('Administrator', 'Barangay Secretary', 'Staff'), controller.getAllRequests);
router.get('/:id', authenticate, authorize('Administrator', 'Barangay Secretary', 'Staff'), controller.getRequestById);
router.post('/:id/approve', authenticate, authorize('Administrator', 'Barangay Secretary'), controller.approveRequest);
router.post('/:id/reject', authenticate, authorize('Administrator', 'Barangay Secretary'), controller.rejectRequest);

module.exports = router;
