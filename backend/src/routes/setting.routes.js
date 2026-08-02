const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const controller = require('../controllers/setting.controller');

router.get('/settings', auth, authorize('Administrator'), controller.getAll);
router.get('/settings/category/:category', auth, authorize('Administrator'), controller.getByCategory);
router.get('/settings/:key', auth, authorize('Administrator'), controller.getByKey);
router.put('/settings/:key', auth, authorize('Administrator'), controller.update);

module.exports = router;
