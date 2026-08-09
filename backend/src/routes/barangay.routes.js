const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const controller = require('../controllers/barangay.controller');
const { uploadTemplate } = require('../middleware/upload.middleware');

router.get('/:id', auth, authorize('Administrator', 'Barangay Secretary'), controller.getProfile);
router.post('/:id/id-template', auth, authorize('Administrator'), uploadTemplate.single('template'), controller.uploadIdTemplate);
router.delete('/:id/id-template', auth, authorize('Administrator'), controller.removeIdTemplate);

module.exports = router;