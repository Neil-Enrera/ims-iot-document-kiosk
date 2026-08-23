const { body, param } = require('express-validator');

const barangayIdApplicationValidation = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required.')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters.')
    .matches(/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\-\.\']+$/).withMessage('First name must contain letters only.'),
  body('middleName')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 50 }).withMessage('Middle name must not exceed 50 characters.')
    .matches(/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\-\.\']+$/).withMessage('Middle name must contain letters only.'),
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required.')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters.')
    .matches(/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\-\.\']+$/).withMessage('Last name must contain letters only.'),
  body('suffix').optional().trim().isLength({ max: 20 }).withMessage('Suffix must not exceed 20 characters.'),
  body('birthDate').optional({ values: 'null' }).isISO8601().withMessage('Invalid birth date format.').custom(val => {
    if (!val) return true;
    const d = new Date(val);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (isNaN(d.getTime()) || d > today || d.getFullYear() < (today.getFullYear() - 125)) {
      throw new Error('Birth date must be a valid past date.');
    }
    return true;
  }),
  body('placeOfBirth').optional().trim().isLength({ max: 150 }).withMessage('Place of birth must not exceed 150 characters.'),
  body('birthPlace').optional().trim().isLength({ max: 150 }).withMessage('Place of birth must not exceed 150 characters.'),
  body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other.'),
  body('civilStatus').optional().isIn(['Single', 'Married', 'Widowed', 'Separated', 'Divorced']).withMessage('Invalid civil status.'),
  body('occupation').optional().trim().isLength({ max: 100 }).withMessage('Occupation must not exceed 100 characters.'),
  body('bloodType').optional().trim().isLength({ max: 10 }).withMessage('Blood type must not exceed 10 characters.'),
  body('addressLine').trim().notEmpty().withMessage('Address is required.').isLength({ min: 5, max: 255 }).withMessage('Address must be between 5 and 255 characters.'),
  body('contactNumber').optional().trim().custom(val => {
    if (!val) return true;
    const clean = String(val).replace(/[\s\-()]/g, '');
    if (!/^(09\d{9}|\+639\d{9})$/.test(clean)) {
      throw new Error('Contact number must be a valid 11-digit mobile number (e.g. 09123456789).');
    }
    return true;
  }),
  body('email').optional({ values: 'falsy' }).trim().isEmail().withMessage('Invalid email format.').isLength({ max: 100 }).withMessage('Email must not exceed 100 characters.'),
  body('emergencyContactName')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 }).withMessage('Emergency contact name must not exceed 100 characters.')
    .matches(/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\-\.\']+$/).withMessage('Emergency contact name must contain letters only.'),
  body('emergencyContactNumber').optional().trim().custom(val => {
    if (!val) return true;
    const clean = String(val).replace(/[\s\-()]/g, '');
    if (!/^(09\d{9}|\+639\d{9})$/.test(clean)) {
      throw new Error('Emergency contact number must be a valid 11-digit mobile number (e.g. 09123456789).');
    }
    return true;
  }),
  body('photo').optional().isString().withMessage('Invalid photo format.'),
  body('signature').optional().isString().withMessage('Invalid signature format.'),
  body('formData').optional().isObject().withMessage('Invalid form data.')
];

const createRequestValidation = [
  body('serviceId').optional().isInt({ min: 1 }).withMessage('Invalid service ID.'),
  body('service_id').optional().isInt({ min: 1 }).withMessage('Invalid service ID.'),
  body('residentId').optional().isInt({ min: 1 }).withMessage('Invalid resident ID.'),
  body('resident_id').optional().isInt({ min: 1 }).withMessage('Invalid resident ID.'),
  body('guest').optional().isObject().withMessage('Invalid guest information.'),
  body('purpose').optional().trim(),
  body('remarks').optional().trim(),
  body('photo').optional().isString().withMessage('Invalid photo format.'),
  body('formData').optional().isObject().withMessage('Invalid form data.'),
  body('idempotency_key').optional().isString().withMessage('Invalid idempotency key.'),
  body('idempotencyKey').optional().isString().withMessage('Invalid idempotency key.')
];

const rfidVerifyValidation = [
  body('rfidUid').trim().notEmpty().withMessage('RFID UID is required.')
];

module.exports = { barangayIdApplicationValidation, createRequestValidation, rfidVerifyValidation };
