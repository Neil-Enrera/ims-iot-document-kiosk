const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');
const { createValidation, updateValidation, statusValidation, passwordValidation, getAllValidation } = require('../validations/user.validation');

router.get('/', authenticate, authorize('Administrator'), ...getAllValidation, validate, userController.getAll);
router.get('/:id', authenticate, authorize('Administrator'), userController.getById);
router.post('/', authenticate, authorize('Administrator'), ...createValidation, validate, userController.create);
router.put('/:id', authenticate, authorize('Administrator'), ...updateValidation, validate, userController.update);
router.patch('/:id/status', authenticate, authorize('Administrator'), ...statusValidation, validate, userController.changeStatus);
router.patch('/:id/password', authenticate, authorize('Administrator'), ...passwordValidation, validate, userController.changePassword);
router.delete('/:id', authenticate, authorize('Administrator'), userController.remove);

module.exports = router;
