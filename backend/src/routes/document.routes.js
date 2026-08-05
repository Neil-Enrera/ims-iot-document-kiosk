const express = require('express');
const router = express.Router({ mergeParams: true });
const documentController = require('../controllers/document.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

// All routes are relative to /requests/:id/documents
router.get('/', authenticate, authorize('Administrator', 'Barangay Secretary', 'Staff'), documentController.list);
router.post('/generate', authenticate, authorize('Administrator', 'Barangay Secretary'), documentController.generate);
router.get('/:documentId', authenticate, authorize('Administrator', 'Barangay Secretary', 'Staff'), documentController.getById);
router.get('/:documentId/preview', authenticate, authorize('Administrator', 'Barangay Secretary', 'Staff'), documentController.preview);
router.get('/:documentId/download', authenticate, authorize('Administrator', 'Barangay Secretary', 'Staff'), documentController.download);
router.post('/:documentId/review/:status', authenticate, authorize('Administrator', 'Barangay Secretary'), documentController.review);
router.delete('/:documentId', authenticate, authorize('Administrator'), documentController.remove);

module.exports = router;
