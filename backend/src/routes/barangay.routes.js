const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const controller = require('../controllers/barangay.controller');
router.get('/:id', auth, authorize('Administrator', 'Barangay Secretary'), controller.getProfile);

module.exports = router;