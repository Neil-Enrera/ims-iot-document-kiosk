const test = require('node:test');
const assert = require('node:assert/strict');

// Import validation logic and schemas
const residentValidation = require('../src/validations/resident.validation');
const kioskValidation = require('../src/validations/kiosk.validation');
const userValidation = require('../src/validations/user.validation');
const serviceValidation = require('../src/validations/service.validation');
const requestValidation = require('../src/validations/request.validation');
const rfidValidation = require('../src/validations/rfid.validation');
const { validateServiceFormData, validateGuestInput } = require('../src/services/transaction.service');

// Helper to simulate express-validator validation chains
async function runValidation(validations, req) {
  for (const validation of validations) {
    if (typeof validation === 'function' && validation.length === 3) {
      // Middleware like normalizeBarangayIdNames
      await new Promise((resolve) => validation(req, {}, resolve));
    } else if (typeof validation?.run === 'function') {
      await validation.run(req);
    }
  }
  const { validationResult } = require('express-validator');
  return validationResult(req);
}

test('Name Regex - Philippine & International Valid Characters', () => {
  const nameRegex = /^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\-\.\']+$/;
  
  // Valid names
  const validNames = [
    'Juan',
    'Dela Cruz',
    'María',
    'Peñaflor',
    'Niño',
    'O\'Connor',
    'Jean-Luc',
    'Sto. Domingo',
    'M. J.',
    'José Protasio',
    'JÖRN' // wait, ö is german; let's check standard
  ];
  
  assert.equal(nameRegex.test('Juan'), true);
  assert.equal(nameRegex.test('Dela Cruz'), true);
  assert.equal(nameRegex.test('María'), true);
  assert.equal(nameRegex.test('Peñaflor'), true);
  assert.equal(nameRegex.test('Niño'), true);
  assert.equal(nameRegex.test("O'Connor"), true);
  assert.equal(nameRegex.test('Jean-Luc'), true);
  assert.equal(nameRegex.test('Sto. Domingo'), true);
  assert.equal(nameRegex.test('José Protasio'), true);

  // Invalid names (special symbols, numbers, sql injection, scripts)
  assert.equal(nameRegex.test('Juan123'), false);
  assert.equal(nameRegex.test('Juan@Cruz'), false);
  assert.equal(nameRegex.test('Juan<script>'), false);
  assert.equal(nameRegex.test('Juan!'), false);
  assert.equal(nameRegex.test('Juan#Cruz'), false);
  assert.equal(nameRegex.test('Juan$'), false);
});

test('Phone Number Format - Philippine Mobile Standards', () => {
  const phoneRegex = /^(09\d{9}|\+639\d{9})$/;

  // Valid numbers
  assert.equal(phoneRegex.test('09123456789'), true);
  assert.equal(phoneRegex.test('09987654321'), true);
  assert.equal(phoneRegex.test('+639123456789'), true);
  assert.equal(phoneRegex.test('+639987654321'), true);

  // Invalid numbers
  assert.equal(phoneRegex.test('08123456789'), false); // Doesn't start with 09
  assert.equal(phoneRegex.test('0912345678'), false);  // 10 digits (too short)
  assert.equal(phoneRegex.test('091234567890'), false); // 12 digits (too long)
  assert.equal(phoneRegex.test('1234567'), false);      // 7 digits (landline)
  assert.equal(phoneRegex.test('0912345678a'), false);  // Contains letter
  assert.equal(phoneRegex.test('+638123456789'), false); // Invalid +63 prefix
});

test('Resident Validation - Valid Resident Record', async () => {
  const validResident = {
    body: {
      firstName: 'Juan',
      middleName: 'Santos',
      lastName: 'Dela Cruz',
      suffix: 'Jr.',
      birthDate: '1995-06-15',
      birthPlace: 'San Manuel, Tarlac',
      nationality: 'Filipino',
      gender: 'Male',
      civilStatus: 'Single',
      barangayId: 1,
      addressLine: '123 Rizal Street, San Manuel, Tarlac',
      purokZone: 'Purok 1',
      sitio: 'Sitio Centro',
      contactNumber: '09123456789',
      email: 'juan.delacruz@example.com',
      emergencyContactName: 'Maria Dela Cruz',
      emergencyContactNumber: '09987654321'
    }
  };

  const result = await runValidation(residentValidation.createValidation, validResident);
  assert.equal(result.isEmpty(), true, `Expected no errors, got: ${JSON.stringify(result.array())}`);
});

test('Resident Validation - Invalid Characters, Length, and Bounds', async () => {
  const invalidResident = {
    body: {
      firstName: 'J', // Too short (min 2)
      lastName: 'Cruz123', // Contains numbers
      middleName: 'Santos@', // Invalid char
      birthDate: '2026-09-01', // Too young (< 1 year old)
      barangayId: 0, // Must be >= 1
      addressLine: 'St.', // Too short (min 5)
      contactNumber: '08123456789', // Invalid prefix
      email: 'not-an-email', // Invalid email
      emergencyContactName: 'Maria<script>', // Invalid char
      emergencyContactNumber: '123' // Too short
    }
  };

  const result = await runValidation(residentValidation.createValidation, invalidResident);
  assert.equal(result.isEmpty(), false);
  const errors = result.mapped();

  assert.ok(errors.firstName, 'Expected firstName error');
  assert.ok(errors.lastName, 'Expected lastName error');
  assert.ok(errors.middleName, 'Expected middleName error');
  assert.ok(errors.birthDate, 'Expected birthDate error');
  assert.ok(errors.barangayId, 'Expected barangayId error');
  assert.ok(errors.addressLine, 'Expected addressLine error');
  assert.ok(errors.contactNumber, 'Expected contactNumber error');
  assert.ok(errors.email, 'Expected email error');
  assert.ok(errors.emergencyContactName, 'Expected emergencyContactName error');
  assert.ok(errors.emergencyContactNumber, 'Expected emergencyContactNumber error');
});

test('Kiosk Barangay ID Application Validation', async () => {
  const validKioskApp = {
    body: {
      firstName: 'Maria',
      lastName: 'Santos',
      birthDate: '2000-01-01',
      gender: 'Female',
      civilStatus: 'Single',
      addressLine: '456 Mabini St, San Manuel',
      contactNumber: '09171234567',
      emergencyContactName: 'Jose Santos',
      emergencyContactNumber: '09181234567'
    }
  };

  const result = await runValidation(kioskValidation.barangayIdApplicationValidation, validKioskApp);
  assert.equal(result.isEmpty(), true, `Expected no errors, got: ${JSON.stringify(result.array())}`);
});

test('User Validation - Admin Panel User CRUD', async () => {
  const validUser = {
    body: {
      roleId: 2,
      username: 'jdelacruz',
      password: 'StrongPassword123',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      email: 'jdelacruz@sanmanuel.gov.ph',
      contactNumber: '09123456789'
    }
  };

  const result = await runValidation(userValidation.createValidation, validUser);
  assert.equal(result.isEmpty(), true, `Expected no errors, got: ${JSON.stringify(result.array())}`);

  const invalidUser = {
    body: {
      roleId: 'abc', // Not int
      username: 'jd', // Too short (< 3)
      password: '123', // Too short (< 6)
      firstName: 'Juan99', // Numbers in name
      lastName: '', // Empty
      contactNumber: '09123' // Too short
    }
  };

  const invalidResult = await runValidation(userValidation.createValidation, invalidUser);
  assert.equal(invalidResult.isEmpty(), false);
});

test('Service Validation - Admin Configurable Service & Dynamic Fields', async () => {
  const validService = {
    body: {
      serviceName: 'Barangay Clearance',
      description: 'Official Barangay Clearance for employment',
      processingFee: 50.00,
      requiresPhoto: true,
      isActive: true,
      requirements: ['Valid Government ID', 'Cedula'],
      formFields: [
        {
          key: 'purpose',
          label: 'Purpose of Request',
          type: 'text',
          required: true,
          validation: { minLength: 3, maxLength: 200 }
        },
        {
          key: 'years_in_barangay',
          label: 'Years Living in Barangay',
          type: 'number',
          required: true,
          validation: { min: 0, max: 100 }
        },
        {
          key: 'employment_type',
          label: 'Employment Type',
          type: 'select',
          required: true,
          options: ['Local', 'Overseas', 'Self-Employed']
        }
      ],
      documentMappings: [
        { placeholder: 'full_name', source: 'resident', field: 'full_name' },
        { placeholder: 'purpose', source: 'application', field: 'purpose' }
      ]
    }
  };

  const result = await runValidation(serviceValidation.createValidation, validService);
  assert.equal(result.isEmpty(), true, `Expected no errors, got: ${JSON.stringify(result.array())}`);
});

test('Dynamic Form Field Validation Engine (transaction.service.js)', () => {
  const formFields = [
    {
      key: 'full_name',
      label: 'Full Name',
      type: 'text',
      required: true,
      validation: { minLength: 2, maxLength: 100 }
    },
    {
      key: 'applicant_age',
      label: 'Applicant Age',
      type: 'number',
      required: true,
      validation: { min: 18, max: 65 }
    },
    {
      key: 'contact_no',
      label: 'Contact Number',
      type: 'tel',
      required: true
    },
    {
      key: 'email_addr',
      label: 'Email Address',
      type: 'email',
      required: false
    }
  ];

  // Test 1: Valid dynamic payload
  const validData = {
    full_name: 'Maria Elena Peña-Reyes',
    applicant_age: 25,
    contact_no: '09123456789',
    email_addr: 'maria@example.com'
  };
  const errors1 = validateServiceFormData(formFields, validData, 'General Clearance');
  assert.equal(errors1.length, 0, `Expected 0 errors, got: ${errors1.join(', ')}`);

  // Test 2: Invalid payload with out-of-range age, bad phone, numbers in name
  const invalidData = {
    full_name: 'Maria123',
    applicant_age: 16, // < min 18
    contact_no: '0812345', // bad phone
    email_addr: 'bad-email'
  };
  const errors2 = validateServiceFormData(formFields, invalidData, 'General Clearance');
  assert.ok(errors2.some(e => e.includes('letters only')), 'Expected name letters only error');
  assert.ok(errors2.some(e => e.includes('at least 18')), 'Expected age min bound error');
  assert.ok(errors2.some(e => e.includes('valid 11-digit contact number')), 'Expected phone error');
  assert.ok(errors2.some(e => e.includes('valid email address')), 'Expected email error');
});

test('Guest Demographic Validation (validateGuestInput)', () => {
  const validGuest = {
    full_name: 'Pedro Penduko',
    birth_date: '1998-05-20',
    contact_number: '09191234567',
    email: 'pedro@example.com'
  };
  const errors1 = validateGuestInput(validGuest);
  assert.equal(errors1.length, 0, `Expected 0 errors, got: ${errors1.join(', ')}`);

  const invalidGuest = {
    full_name: 'P', // too short
    birth_date: '2026-09-01', // too young (< 1 yr)
    contact_number: '0912', // too short
    email: 'invalid-email'
  };
  const errors2 = validateGuestInput(invalidGuest);
  assert.ok(errors2.length >= 4, `Expected at least 4 errors, got: ${errors2.length}`);
});
