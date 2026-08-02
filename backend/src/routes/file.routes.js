const express = require('express');
const router = express.Router();
const fileController = require('../controllers/file.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/', authenticate, authorize('Administrator', 'Barangay Secretary', 'Staff'), fileController.getAll);
router.get('/:id', authenticate, fileController.getById);
router.get('/:id/download', authenticate, fileController.download);
router.post('/upload', authenticate, authorize('Administrator', 'Barangay Secretary', 'Staff'), upload.single('file'), fileController.upload);
router.delete('/:id', authenticate, authorize('Administrator'), fileController.remove);

module.exports = router;
