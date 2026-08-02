const { body, param, query } = require('express-validator');

const createValidation = [
  body('serviceName').trim().notEmpty().withMessage('Service name is required.')
    .isLength({ max: 100 }).withMessage('Service name must be 100 characters or less.'),
  body('description').optional().trim(),
  body('processingFee').optional().isFloat({ min: 0 }).withMessage('Processing fee must be a non-negative number.'),
  body('requiresPhoto').optional().isBoolean().withMessage('requiresPhoto must be a boolean.'),
  body('requirements').optional().isArray().withMessage('Requirements must be an array.'),
  body('formFields').optional().isArray().withMessage('Form fields must be an array.'),
  body('requiredDocuments').optional().isArray().withMessage('Required documents must be an array.'),
  body('processingTime').optional().trim(),
  body('approvalWorkflow').optional().trim()
];

const updateValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid service ID.'),
  body('serviceName').trim().notEmpty().withMessage('Service name is required.')
    .isLength({ max: 100 }).withMessage('Service name must be 100 characters or less.'),
  body('description').optional().trim(),
  body('processingFee').optional().isFloat({ min: 0 }).withMessage('Processing fee must be a non-negative number.'),
  body('requiresPhoto').optional().isBoolean().withMessage('requiresPhoto must be a boolean.'),
  body('requirements').optional().isArray().withMessage('Requirements must be an array.'),
  body('formFields').optional().isArray().withMessage('Form fields must be an array.'),
  body('requiredDocuments').optional().isArray().withMessage('Required documents must be an array.'),
  body('processingTime').optional().trim(),
  body('approvalWorkflow').optional().trim()
];

const statusValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid service ID.'),
  body('isActive').isBoolean().withMessage('isActive must be a boolean.')
];

const getAllValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100.'),
  query('sortBy').optional().isIn(['service_id', 'service_name', 'processing_fee', 'is_active', 'created_at']).withMessage('Invalid sort column.'),
  query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('Sort order must be ASC or DESC.')
];

module.exports = { createValidation, updateValidation, statusValidation, getAllValidation };
