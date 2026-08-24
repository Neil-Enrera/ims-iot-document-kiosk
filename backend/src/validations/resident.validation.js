const { body, param, query } = require('express-validator');

const nameRegex = /^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\-\.\']+$/;

const createValidation = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required.')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters.')
    .matches(nameRegex).withMessage('First name must contain letters only.'),
  body('middleName')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 50 }).withMessage('Middle name must not exceed 50 characters.')
    .matches(nameRegex).withMessage('Middle name must contain letters only.'),
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required.')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters.')
    .matches(nameRegex).withMessage('Last name must contain letters only.'),
  body('suffix').optional().trim().isLength({ max: 20 }).withMessage('Suffix must not exceed 20 characters.'),
  body('birthDate').optional({ values: 'null' }).isISO8601().withMessage('Invalid date format.').custom(val => {
    if (!val) return true;
    const d = new Date(val);
    if (isNaN(d.getTime())) {
      throw new Error('Invalid date format.');
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d >= today) {
      throw new Error('Birth date must be a past date (cannot be today or in the future).');
    }
    const minYear = today.getFullYear() - 125;
    if (d.getFullYear() < minYear) {
      throw new Error('Birth date must be a valid date within the last 125 years.');
    }
    return true;
  }),
  body('birthPlace').optional().trim().isLength({ max: 100 }).withMessage('Birth place must not exceed 100 characters.'),
  body('nationality').optional().trim().isLength({ max: 50 }).withMessage('Nationality must not exceed 50 characters.'),
  body('religion').optional().trim().isLength({ max: 50 }).withMessage('Religion must not exceed 50 characters.'),
  body('occupation').optional().trim().isLength({ max: 100 }).withMessage('Occupation must not exceed 100 characters.'),
  body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other.'),
  body('civilStatus').optional().isIn(['Single', 'Married', 'Widowed', 'Separated', 'Divorced']).withMessage('Invalid civil status.'),
  body('barangayId').isInt({ min: 1 }).withMessage('Barangay ID is required.'),
  body('addressLine').trim().notEmpty().withMessage('Address is required.').isLength({ min: 5, max: 255 }).withMessage('Address must be between 5 and 255 characters.'),
  body('houseNumber').optional().trim().isLength({ max: 50 }).withMessage('House number must not exceed 50 characters.'),
  body('street').optional().trim().isLength({ max: 100 }).withMessage('Street must not exceed 100 characters.'),
  body('purokZone').optional().trim().isLength({ max: 100 }).withMessage('Purok/Zone must not exceed 100 characters.'),
  body('sitio').optional().trim().isLength({ max: 100 }).withMessage('Sitio must not exceed 100 characters.'),
  body('municipality').optional().trim().isLength({ max: 100 }).withMessage('Municipality must not exceed 100 characters.'),
  body('province').optional().trim().isLength({ max: 100 }).withMessage('Province must not exceed 100 characters.'),
  body('zipCode').optional().trim().isLength({ max: 10 }).withMessage('ZIP code must not exceed 10 characters.'),
  body('contactNumber').optional({ values: 'falsy' }).trim().custom(val => {
    if (!val) return true;
    const clean = String(val).replace(/[\s\-()]/g, '');
    if (!/^(09\d{9}|\+639\d{9})$/.test(clean)) {
      throw new Error('Contact number must be a valid 11-digit mobile number (e.g. 09123456789).');
    }
    return true;
  }),
  body('email').optional({ values: 'falsy' }).trim().isEmail().withMessage('Invalid email format.').isLength({ max: 100 }).withMessage('Email must not exceed 100 characters.'),
  body('bloodType').optional().trim().isLength({ max: 10 }).withMessage('Blood type must not exceed 10 characters.'),
  body('emergencyContactName')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 }).withMessage('Emergency contact name must not exceed 100 characters.')
    .matches(nameRegex).withMessage('Emergency contact name must contain letters only.'),
  body('emergencyContactNumber').optional({ values: 'falsy' }).trim().custom(val => {
    if (!val) return true;
    const clean = String(val).replace(/[\s\-()]/g, '');
    if (!/^(09\d{9}|\+639\d{9})$/.test(clean)) {
      throw new Error('Emergency contact number must be a valid 11-digit mobile number (e.g. 09123456789).');
    }
    return true;
  })
];

const updateValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid resident ID.'),
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required.')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters.')
    .matches(nameRegex).withMessage('First name must contain letters only.'),
  body('middleName')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 50 }).withMessage('Middle name must not exceed 50 characters.')
    .matches(nameRegex).withMessage('Middle name must contain letters only.'),
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required.')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters.')
    .matches(nameRegex).withMessage('Last name must contain letters only.'),
  body('suffix').optional().trim().isLength({ max: 20 }).withMessage('Suffix must not exceed 20 characters.'),
  body('birthDate').optional({ values: 'null' }).isISO8601().withMessage('Invalid date format.').custom(val => {
    if (!val) return true;
    const d = new Date(val);
    if (isNaN(d.getTime())) {
      throw new Error('Invalid date format.');
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d >= today) {
      throw new Error('Birth date must be a past date (cannot be today or in the future).');
    }
    const minYear = today.getFullYear() - 125;
    if (d.getFullYear() < minYear) {
      throw new Error('Birth date must be a valid date within the last 125 years.');
    }
    return true;
  }),
  body('birthPlace').optional().trim().isLength({ max: 100 }).withMessage('Birth place must not exceed 100 characters.'),
  body('nationality').optional().trim().isLength({ max: 50 }).withMessage('Nationality must not exceed 50 characters.'),
  body('religion').optional().trim().isLength({ max: 50 }).withMessage('Religion must not exceed 50 characters.'),
  body('occupation').optional().trim().isLength({ max: 100 }).withMessage('Occupation must not exceed 100 characters.'),
  body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other.'),
  body('civilStatus').optional().isIn(['Single', 'Married', 'Widowed', 'Separated', 'Divorced']).withMessage('Invalid civil status.'),
  body('barangayId').isInt({ min: 1 }).withMessage('Barangay ID is required.'),
  body('addressLine').trim().notEmpty().withMessage('Address is required.').isLength({ min: 5, max: 255 }).withMessage('Address must be between 5 and 255 characters.'),
  body('houseNumber').optional().trim().isLength({ max: 50 }).withMessage('House number must not exceed 50 characters.'),
  body('street').optional().trim().isLength({ max: 100 }).withMessage('Street must not exceed 100 characters.'),
  body('purokZone').optional().trim().isLength({ max: 100 }).withMessage('Purok/Zone must not exceed 100 characters.'),
  body('sitio').optional().trim().isLength({ max: 100 }).withMessage('Sitio must not exceed 100 characters.'),
  body('municipality').optional().trim().isLength({ max: 100 }).withMessage('Municipality must not exceed 100 characters.'),
  body('province').optional().trim().isLength({ max: 100 }).withMessage('Province must not exceed 100 characters.'),
  body('zipCode').optional().trim().isLength({ max: 10 }).withMessage('ZIP code must not exceed 10 characters.'),
  body('contactNumber').optional({ values: 'falsy' }).trim().custom(val => {
    if (!val) return true;
    const clean = String(val).replace(/[\s\-()]/g, '');
    if (!/^(09\d{9}|\+639\d{9})$/.test(clean)) {
      throw new Error('Contact number must be a valid 11-digit mobile number (e.g. 09123456789).');
    }
    return true;
  }),
  body('email').optional({ values: 'falsy' }).trim().isEmail().withMessage('Invalid email format.').isLength({ max: 100 }).withMessage('Email must not exceed 100 characters.'),
  body('bloodType').optional().trim().isLength({ max: 10 }).withMessage('Blood type must not exceed 10 characters.'),
  body('emergencyContactName')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 }).withMessage('Emergency contact name must not exceed 100 characters.')
    .matches(nameRegex).withMessage('Emergency contact name must contain letters only.'),
  body('emergencyContactNumber').optional({ values: 'falsy' }).trim().custom(val => {
    if (!val) return true;
    const clean = String(val).replace(/[\s\-()]/g, '');
    if (!/^(09\d{9}|\+639\d{9})$/.test(clean)) {
      throw new Error('Emergency contact number must be a valid 11-digit mobile number (e.g. 09123456789).');
    }
    return true;
  })
];

const getAllValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100.'),
  query('sortBy').optional().isIn(['resident_id', 'resident_code', 'first_name', 'last_name', 'birth_date', 'status', 'created_at']).withMessage('Invalid sort column.'),
  query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('Sort order must be ASC or DESC.'),
  query('barangayId').optional().isInt({ min: 1 }).withMessage('Invalid barangay ID.')
];

module.exports = { createValidation, updateValidation, getAllValidation };

