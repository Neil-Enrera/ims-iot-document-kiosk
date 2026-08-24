const { body, param } = require('express-validator');

const parseBirthDate = (birthDate) => {
  if (!birthDate) return null;
  if (birthDate instanceof Date) {
    return isNaN(birthDate.getTime()) ? null : {
      year: birthDate.getFullYear(),
      month: birthDate.getMonth(),
      day: birthDate.getDate()
    };
  }
  const s = String(birthDate).trim();
  const match = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
};

const calculateAge = (birthDate) => {
  const parsed = parseBirthDate(birthDate);
  if (!parsed) return null;
  const today = new Date();
  let age = today.getFullYear() - parsed.year;
  const m = today.getMonth() - parsed.month;
  if (m < 0 || (m === 0 && today.getDate() < parsed.day)) {
    age--;
  }
  return age;
};

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
  body('birthDate').optional({ values: 'null' }).isISO8601().withMessage('Invalid birth date format.').custom(async (val) => {
    if (!val) return true;
    const age = calculateAge(val);
    if (age === null || isNaN(age)) {
      throw new Error('Invalid birth date format.');
    }
    if (age < 1) {
      throw new Error('Birth date is invalid. Resident must be at least 1 year old (cannot be born in the current year or month).');
    }
    if (age > 125) {
      throw new Error('Birth date must be a valid date within the last 125 years.');
    }
    try {
      const settingRepo = require('../repositories/setting.repository');
      const minAgeSetting = await settingRepo.findByKey('barangay_id_min_age');
      const minAge = minAgeSetting ? parseInt(minAgeSetting.setting_value, 10) || 15 : 15;
      if (age < minAge) {
        throw new Error(`Barangay ID application requires the applicant to be at least ${minAge} years old based on barangay policy (current computed age: ${age}).`);
      }
    } catch (e) {
      if (e.message && e.message.includes('Barangay ID application requires')) throw e;
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
