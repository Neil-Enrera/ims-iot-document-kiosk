const { body, param, query } = require('express-validator');

const registerValidation = [
  body('cardUid').trim().notEmpty().withMessage('RFID UID is required.'),
  body('residentId').isInt({ min: 1 }).withMessage('Resident ID is required.'),
  body('issuedDate').optional().isISO8601().withMessage('Invalid date format.'),
  body('expirationDate').optional().isISO8601().withMessage('Invalid date format.')
];

const assignValidation = [
  body('residentId').isInt({ min: 1 }).withMessage('Resident ID is required.'),
  body('cardUid').trim().notEmpty().withMessage('RFID UID is required.')
];

const verifyValidation = [
  body('rfidUid').trim().notEmpty().withMessage('RFID UID is required.')
];

const statusValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid RFID card ID.'),
  body('status').isIn(['ACTIVE', 'EXPIRED', 'LOST', 'CANCELLED', 'SUSPENDED', 'REVOKED', 'Active', 'Expired', 'Lost', 'Cancelled', 'Suspended', 'Revoked']).withMessage('Invalid status.')
];

const replaceValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid RFID card ID.'),
  body('newCardUid').trim().notEmpty().withMessage('New RFID UID is required.'),
  body('expirationDate').optional().isISO8601().withMessage('Invalid date format.')
];

const getAllValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100.'),
  query('sortBy').optional().isIn(['rfid_card_id', 'card_uid', 'status', 'issued_date', 'created_at', 'resident_name', 'resident_code', 'registration_status']).withMessage('Invalid sort column.'),
  query('sortOrder').optional().isIn(['ASC', 'DESC', 'asc', 'desc']).withMessage('Sort order must be ASC or DESC.'),
  query('status').optional(),
  query('search').optional(),
  query('residentId').optional(),
  query('resident_id').optional()
];

module.exports = { registerValidation, assignValidation, verifyValidation, statusValidation, replaceValidation, getAllValidation };
