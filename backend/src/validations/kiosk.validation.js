const { body } = require('express-validator');

const barangayIdApplicationValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required.'),
  body('middleName').optional().trim(),
  body('lastName').trim().notEmpty().withMessage('Last name is required.'),
  body('suffix').optional().trim(),
  body('birthDate').optional({ values: 'null' }).isISO8601().withMessage('Invalid date format.'),
  body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other.'),
  body('civilStatus').optional().isIn(['Single', 'Married', 'Widowed', 'Separated', 'Divorced']).withMessage('Invalid civil status.'),
  body('occupation').optional().trim(),
  body('bloodType').optional().trim(),
  body('addressLine').trim().notEmpty().withMessage('Address is required.'),
  body('contactNumber').optional().trim(),
  body('email').optional().isEmail().withMessage('Invalid email format.'),
  body('emergencyContactName').optional().trim(),
  body('emergencyContactNumber').optional().trim(),
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
  body('formData').optional().isObject().withMessage('Invalid form data.')
];

const rfidVerifyValidation = [
  body('rfidUid').trim().notEmpty().withMessage('RFID UID is required.')
];

module.exports = { barangayIdApplicationValidation, createRequestValidation, rfidVerifyValidation };
