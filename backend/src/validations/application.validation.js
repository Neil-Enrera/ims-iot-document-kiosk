const { body, query, param } = require('express-validator');

const getAllValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100.'),
  query('sortBy').optional().isIn(['application_id', 'application_number', 'first_name', 'last_name', 'status', 'created_at']).withMessage('Invalid sort column.'),
  query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('Sort order must be ASC or DESC.'),
  query('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED']).withMessage('Invalid status.')
];

const reviewValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid application ID.'),
  body('remarks').optional().trim()
];

module.exports = { getAllValidation, reviewValidation };
