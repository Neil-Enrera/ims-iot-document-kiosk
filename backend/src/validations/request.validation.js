const { body, param, query } = require('express-validator');

const createValidation = [
  body('residentId').isInt({ min: 1 }).withMessage('Resident ID is required.'),
  body('serviceId').isInt({ min: 1 }).withMessage('Service ID is required.'),
  body('purpose').optional().trim(),
  body('remarks').optional().trim()
];

const updateValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid request ID.'),
  body('serviceId').isInt({ min: 1 }).withMessage('Service ID is required.'),
  body('purpose').optional().trim(),
  body('remarks').optional().trim()
];

const statusValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid request ID.'),
  body('remarks').optional().trim()
];

const getAllValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100.'),
  query('statusId').optional().isInt({ min: 1 }).withMessage('Invalid status ID.'),
  query('residentId').optional().isInt({ min: 1 }).withMessage('Invalid resident ID.'),
  query('serviceId').optional().isInt({ min: 1 }).withMessage('Invalid service ID.')
];

module.exports = { createValidation, updateValidation, statusValidation, getAllValidation };
