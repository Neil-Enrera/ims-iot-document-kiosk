const { body, param, query } = require('express-validator');

const createValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required.'),
  body('middleName').optional().trim(),
  body('lastName').trim().notEmpty().withMessage('Last name is required.'),
  body('suffix').optional().trim(),
  body('birthDate').optional({ values: 'null' }).isISO8601().withMessage('Invalid date format.'),
  body('birthPlace').optional().trim(),
  body('nationality').optional().trim(),
  body('religion').optional().trim(),
  body('occupation').optional().trim(),
  body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other.'),
  body('civilStatus').optional().isIn(['Single', 'Married', 'Widowed', 'Separated', 'Divorced']).withMessage('Invalid civil status.'),
  body('barangayId').isInt({ min: 1 }).withMessage('Barangay ID is required.'),
  body('addressLine').trim().notEmpty().withMessage('Address is required.'),
  body('houseNumber').optional().trim(),
  body('street').optional().trim(),
  body('purokZone').optional().trim(),
  body('sitio').optional().trim(),
  body('municipality').optional().trim(),
  body('province').optional().trim(),
  body('zipCode').optional().trim(),
  body('contactNumber').optional().trim(),
  body('email').optional().isEmail().withMessage('Invalid email format.'),
  body('bloodType').optional().trim(),
  body('emergencyContactName').optional().trim(),
  body('emergencyContactNumber').optional().trim()
];

const updateValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid resident ID.'),
  body('firstName').trim().notEmpty().withMessage('First name is required.'),
  body('middleName').optional().trim(),
  body('lastName').trim().notEmpty().withMessage('Last name is required.'),
  body('suffix').optional().trim(),
  body('birthDate').optional({ values: 'null' }).isISO8601().withMessage('Invalid date format.'),
  body('birthPlace').optional().trim(),
  body('nationality').optional().trim(),
  body('religion').optional().trim(),
  body('occupation').optional().trim(),
  body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other.'),
  body('civilStatus').optional().isIn(['Single', 'Married', 'Widowed', 'Separated', 'Divorced']).withMessage('Invalid civil status.'),
  body('barangayId').isInt({ min: 1 }).withMessage('Barangay ID is required.'),
  body('addressLine').trim().notEmpty().withMessage('Address is required.'),
  body('houseNumber').optional().trim(),
  body('street').optional().trim(),
  body('purokZone').optional().trim(),
  body('sitio').optional().trim(),
  body('municipality').optional().trim(),
  body('province').optional().trim(),
  body('zipCode').optional().trim(),
  body('contactNumber').optional().trim(),
  body('email').optional().isEmail().withMessage('Invalid email format.'),
  body('bloodType').optional().trim(),
  body('emergencyContactName').optional().trim(),
  body('emergencyContactNumber').optional().trim()
];

const getAllValidation = [  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100.'),
  query('sortBy').optional().isIn(['resident_id', 'resident_code', 'first_name', 'last_name', 'birth_date', 'status', 'created_at']).withMessage('Invalid sort column.'),
  query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('Sort order must be ASC or DESC.'),
  query('barangayId').optional().isInt({ min: 1 }).withMessage('Invalid barangay ID.')
];

module.exports = { createValidation, updateValidation, getAllValidation };
