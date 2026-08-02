const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

router.get('/', authenticate, authorize('Administrator'), auditController.getAll);
router.get('/:id', authenticate, authorize('Administrator'), auditController.getById);

module.exports = router;
