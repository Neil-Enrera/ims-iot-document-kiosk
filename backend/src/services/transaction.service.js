const pool = require('../config/database');
const transactionRepository = require('../repositories/transaction.repository');
const auditRepository = require('../repositories/audit.repository');
const notificationService = require('../services/notification.service');
const sseManager = require('../services/notification-sse');
const fs = require('fs');
const path = require('path');

const SUBMITTED_STATUS_ID = 1;
const TERMINAL_STATUS_IDS = [7, 8, 9]; // Released, Rejected, Cancelled

// ============================================================
// Pure helpers (exported for unit tests)
// ============================================================

// Decides whether a RESIDENT may start a new request for a service given the
// service's duplicate / repeat policies and the resident's request history.
// Returns { allowed:true } or { allowed:false, code, message, existing }.
const evaluateResidentPolicy = (service, activeRequests, latestRequest) => {
  if (!latestRequest) return { allowed: true };

  const hasActive = Array.isArray(activeRequests) && activeRequests.length > 0;
  if (hasActive) {
    if (service.allow_multiple_active_requests) {
      return { allowed: true };
    }
    const current = activeRequests[0];
    return {
      allowed: false,
      code: 'ACTIVE_REQUEST_EXISTS',
      message: `You already have an active ${service.service_name} request (${current.request_number}).`,
      existing: {
        request_id: current.request_id,
        request_number: current.request_number,
        status_id: current.status_id,
        status_name: current.status_name
      }
    };
  }

  const last = latestRequest;
  const lastStatusId = Number(last.status_id);
  if (TERMINAL_STATUS_IDS.includes(lastStatusId) && !service.allow_new_request_after_release) {
    return {
      allowed: false,
      code: 'NO_REPEAT_AFTER_RELEASE',
      message: `A new ${service.service_name} request is not allowed at this time (last request ${last.request_number} is ${last.status_name}).`,
      existing: {
        request_id: last.request_id,
        request_number: last.request_number,
        status_id: last.status_id,
        status_name: last.status_name
      }
    };
  }

  return { allowed: true };
};

const parseBirthDateHelper = (birthDate) => {
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

const calculateAgeHelper = (birthDate) => {
  const parsed = parseBirthDateHelper(birthDate);
  if (!parsed) return null;
  const today = new Date();
  let age = today.getFullYear() - parsed.year;
  const m = today.getMonth() - parsed.month;
  if (m < 0 || (m === 0 && today.getDate() < parsed.day)) {
    age--;
  }
  return age;
};

// Validate dynamic form data against service form_fields schema
const validateServiceFormData = (formFields, formData = {}, serviceName = 'Service') => {
  const fields = Array.isArray(formFields) ? formFields : [];
  const errors = [];
  const data = formData || {};

  for (const field of fields) {
    const rawVal = data[field.key];
    const empty = rawVal === undefined || rawVal === null || String(rawVal).trim() === '';

    if (empty) {
      if (field.required) {
        errors.push(`${field.label || field.key} is required.`);
      }
      continue;
    }

    const valStr = String(rawVal).trim();
    const valNum = Number(rawVal);
    const v = field.validation || {};

    // 1. Number / Age validations
    const isNumberType = field.type === 'number';
    const isAgeField = field.key.toLowerCase().includes('age') || (field.label && field.label.toLowerCase().includes('age'));
    if (isNumberType || isAgeField) {
      if (!/^-?\d+(\.\d+)?$/.test(valStr)) {
        errors.push(`${field.label || field.key} must be a valid number.`);
        continue;
      }
      if (v.min !== undefined && valNum < v.min) {
        errors.push(`${field.label || field.key} must be at least ${v.min}.`);
      }
      if (v.max !== undefined && valNum > v.max) {
        errors.push(`${field.label || field.key} must not exceed ${v.max}.`);
      }
      if (isAgeField) {
        if (valNum < 1 || valNum > 125) {
          errors.push(`${field.label || field.key} must be between 1 and 125.`);
        }
        if (/senior/i.test(serviceName) && valNum < 60) {
          errors.push(`${serviceName} requires the applicant to be at least 60 years old.`);
        }
        if (/first[- ]?time job seeker/i.test(serviceName) && valNum < 15) {
          errors.push(`${serviceName} requires the applicant to be at least 15 years old.`);
        }
        if (/solo parent/i.test(serviceName) && valNum < 18) {
          errors.push(`${serviceName} requires the applicant to be at least 18 years old.`);
        }
      }
    }

    // 2. Phone / Mobile validations
    const isPhone = field.type === 'tel' || field.key.toLowerCase().includes('contact') || field.key.toLowerCase().includes('phone') || field.key.toLowerCase().includes('mobile') || (field.label && (field.label.toLowerCase().includes('contact') || field.label.toLowerCase().includes('phone') || field.label.toLowerCase().includes('mobile')));
    if (isPhone) {
      const cleanPhone = valStr.replace(/[\s\-()]/g, '');
      if (!/^(09\d{9}|\+639\d{9})$/.test(cleanPhone)) {
        errors.push(`${field.label || field.key} must be a valid 11-digit contact number (e.g. 09123456789).`);
      }
    }

    // 3. Name validations
    const isName = !isPhone && !field.key.toLowerCase().includes('email') && !field.key.toLowerCase().includes('address') && (field.key.toLowerCase().includes('name') || field.key.toLowerCase().includes('relative') || (field.label && (field.label.toLowerCase().includes('name') || field.label.toLowerCase().includes('relative'))));
    if (isName) {
      if (!/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\-\.\']+$/.test(valStr)) {
        errors.push(`${field.label || field.key} must contain letters only.`);
      }
    }

    // 4. Email validations
    const isEmail = field.type === 'email' || field.key.toLowerCase().includes('email');
    if (isEmail) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valStr)) {
        errors.push(`${field.label || field.key} must be a valid email address.`);
      }
    }

    // 5. Date / Birthday validations
    const isDateField = field.type === 'date';
    const isBirthDate = isDateField && (field.key.toLowerCase().includes('birth') || (field.label && field.label.toLowerCase().includes('birth')) || field.key.toLowerCase() === 'dob');
    if (isDateField) {
      if (isBirthDate) {
        const computedAge = calculateAgeHelper(valStr);
        if (computedAge === null) {
          errors.push(`${field.label || field.key} must be a valid date.`);
        } else if (computedAge < 1) {
          errors.push(`${field.label || field.key} is invalid. Resident must be at least 1 year old (cannot be born in the current year or month).`);
        } else if (computedAge > 125) {
          errors.push(`${field.label || field.key} must be a valid date within the last 125 years.`);
        } else {
          // Check age requirement for age-restricted services
          if (/senior/i.test(serviceName) && computedAge < 60) {
            errors.push(`${serviceName} requires the applicant to be at least 60 years old (current computed age: ${computedAge}).`);
          }
          if (/first[- ]?time job seeker/i.test(serviceName) && computedAge < 15) {
            errors.push(`${serviceName} requires the applicant to be at least 15 years old (current computed age: ${computedAge}).`);
          }
          if (/solo parent/i.test(serviceName) && computedAge < 18) {
            errors.push(`${serviceName} requires the applicant to be at least 18 years old (current computed age: ${computedAge}).`);
          }
        }
      } else {
        const parsedDate = new Date(valStr);
        if (isNaN(parsedDate.getTime())) {
          errors.push(`${field.label || field.key} must be a valid date.`);
        }
      }
    }

    // 6. String length & pattern validations
    if (typeof rawVal === 'string' && !rawVal.startsWith('data:')) {
      const defaultMax = field.type === 'textarea' ? 500 : (isPhone ? 11 : (isName ? 100 : 255));
      const effectiveMax = v.maxLength || defaultMax;
      if (valStr.length > effectiveMax) {
        errors.push(`${field.label || field.key} must not exceed ${effectiveMax} characters.`);
      }
      if (v.minLength && valStr.length < v.minLength) {
        errors.push(`${field.label || field.key} must be at least ${v.minLength} characters.`);
      }
      if (v.pattern) {
        try {
          const reg = new RegExp(v.pattern);
          if (!reg.test(valStr)) {
            errors.push(v.patternMessage || `${field.label || field.key} has an invalid format.`);
          }
        } catch {
          // ignore invalid pattern
        }
      }
    }
  }

  return errors;
};

const validateGuestInput = (guest) => {
  if (!guest) return [];
  const errors = [];
  const fullName = String(guest.full_name || guest.fullName || [guest.first_name, guest.middle_name, guest.last_name, guest.suffix].filter(Boolean).join(' ') || '').trim();
  const birthDate = guest.birth_date || guest.birthDate;
  const contactNumber = String(guest.contact_number || guest.contactNumber || '').trim().replace(/[\s\-()]/g, '');
  const email = guest.email ? String(guest.email).trim() : '';

  if (!fullName || fullName.length < 2) {
    errors.push('Guest full name must be at least 2 characters.');
  } else if (!/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\-\.\']+$/.test(fullName)) {
    errors.push('Guest full name must contain letters only.');
  }
  if (fullName.length > 100) {
    errors.push('Guest full name must not exceed 100 characters.');
  }
  if (birthDate) {
    const computedAge = calculateAgeHelper(birthDate);
    if (computedAge === null) {
      errors.push('Guest birth date must be a valid date.');
    } else if (computedAge < 1) {
      errors.push('Guest birth date is invalid. Resident must be at least 1 year old (cannot be born in the current year or month).');
    } else if (computedAge > 125) {
      errors.push('Guest birth date must be a valid date within the last 125 years.');
    }
  }
  if (contactNumber && !/^(09\d{9}|\+639\d{9})$/.test(contactNumber)) {
    errors.push('Guest contact number must be a valid 11-digit mobile number (e.g. 09123456789).');
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Guest email must be a valid email address.');
  }

  return errors;
};

// Temporary identity captured for a guest session. Stored on the transaction
// (and mirrored into each request's form_data `_guest`) for possible-duplicate
// matching later. Identity is best-effort; never treated as a hard guarantee.
const buildGuestSnapshot = (guest) => {
  const g = guest || {};
  const snapshot = {};
  const putTrimmed = (key, value) => {
    if (value === undefined || value === null) return;
    const trimmed = String(value).trim();
    if (trimmed) snapshot[key] = trimmed;
  };
  const computedFullName = g.full_name || [g.first_name, g.middle_name, g.last_name, g.suffix].filter(Boolean).join(' ').trim();
  putTrimmed('full_name', computedFullName);
  putTrimmed('first_name', g.first_name);
  putTrimmed('middle_name', g.middle_name);
  putTrimmed('last_name', g.last_name);
  putTrimmed('suffix', g.suffix);
  if (g.birth_date) snapshot.birth_date = g.birth_date;
  putTrimmed('birth_place', g.birth_place);
  putTrimmed('gender', g.gender);
  putTrimmed('civil_status', g.civil_status);
  putTrimmed('nationality', g.nationality);
  putTrimmed('religion', g.religion);
  putTrimmed('occupation', g.occupation);
  putTrimmed('blood_type', g.blood_type);
  putTrimmed('contact_number', g.contact_number);
  putTrimmed('email', g.email);
  putTrimmed('subdivision', g.subdivision);
  putTrimmed('street', g.street);
  putTrimmed('block', g.block);
  putTrimmed('lot', g.lot);
  putTrimmed('house_number', g.house_number);
  putTrimmed('purok_zone', g.purok_zone);
  putTrimmed('sitio', g.sitio);
  putTrimmed('municipality', g.municipality);
  putTrimmed('province', g.province);
  putTrimmed('zip_code', g.zip_code);
  putTrimmed('address', g.address);
  return Object.keys(snapshot).length ? snapshot : null;
};

const mergeGuestFormData = (formData, guestSnapshot) => {
  const merged = { ...(formData || {}) };
  if (guestSnapshot) merged._guest = guestSnapshot;
  return Object.keys(merged).length ? merged : null;
};

// REQ-XXXXX using the highest existing trailing suffix (avoids collisions after
// deletions/out-of-order ids, consistent with the previous kiosk format).
const formatRequestNumber = (next) =>
  `REQ-${String(Number(next) || 1).padStart(5, '0')}`;

// ============================================================
// Kiosk submission
// ============================================================

// One kiosk submission becomes one TRANSACTION row grouping one or more
// Service Requests. Idempotency is anchored on the transaction so a retry of
// the same submission (double-click / refresh / network retry) returns the
// original transaction instead of duplicating requests.
//
// input: { services:[{service_id, form_data, photo}], resident_id?, guest?,
//          idempotency_key?, ip? }
//
// Returns:
//   { success:true,  data:{ transaction_id, transaction_number, created_at,
//                            duplicate, possible_duplicates, requests:[...] } }
//   { success:false, code, message, existing? }
const submitTransaction = async (input) => {
  const services = input.services || [];
  const residentId = input.resident_id || null;
  const guest = input.guest || null;
  const idempotencyKey = input.idempotency_key || null;
  const ip = input.ip || null;

  if (!Array.isArray(services) || services.length === 0) {
    return { success: false, code: 'NO_SERVICES', message: 'At least one service is required.' };
  }
  if (services.length > 2) {
    return { success: false, code: 'MAX_SERVICES_EXCEEDED', message: 'You can select a maximum of 2 services per transaction.' };
  }
  for (const s of services) {
    if (!s || !s.service_id) {
      return { success: false, code: 'INVALID_SERVICE', message: 'A service is missing its service_id.' };
    }
  }
  if (!residentId && !guest) {
    return { success: false, code: 'NO_IDENTITY', message: 'Resident or guest information is required.' };
  }

  // ---- Idempotency: return the existing transaction for this submission key ----
  if (idempotencyKey) {
    const existingTxn = await transactionRepository.findByIdempotencyKey(idempotencyKey);
    if (existingTxn) {
      const full = await transactionRepository.findById(existingTxn.transaction_id);
      return {
        success: true,
        data: buildTransactionResult(full, true)
      };
    }
  }

  // ---- Resolve identity ----
  let resident = null;
  if (residentId) {
    resident = await transactionRepository.findResidentForSubmission(residentId);
    if (!resident) return { success: false, code: 'RESIDENT_NOT_FOUND', message: 'Resident not found.' };
  }
  const guestSnapshot = guest ? buildGuestSnapshot(guest) : null;
  if (guest && !guestSnapshot) {
    return { success: false, code: 'GUEST_NAME_REQUIRED', message: 'Guest full name is required.' };
  }

  // Validate guest input if guest session
  if (guest) {
    const guestErrors = validateGuestInput(guest);
    if (guestErrors.length > 0) {
      return {
        success: false,
        code: 'GUEST_VALIDATION_ERROR',
        message: guestErrors[0],
        errors: guestErrors
      };
    }
  }

  // ---- Resolve services + policy checks (BEFORE writing anything) ----
  const serviceIds = [...new Set(services.map(s => s.service_id))];
  const serviceRows = await transactionRepository.findServicesByIds(serviceIds);
  const serviceById = new Map(serviceRows.map(s => [s.service_id, s]));

  for (const s of services) {
    const service = serviceById.get(s.service_id);
    if (!service) return { success: false, code: 'SERVICE_NOT_FOUND', message: `Service (${s.service_id}) not found.` };
    if (!service.is_active) return { success: false, code: 'SERVICE_INACTIVE', message: `${service.service_name} is not available.` };

    // Validate dynamic form data for this service
    const formErrors = validateServiceFormData(service.form_fields, s.form_data || s.formData, service.service_name);
    if (formErrors.length > 0) {
      return {
        success: false,
        code: 'VALIDATION_ERROR',
        message: formErrors[0],
        errors: formErrors
      };
    }
  }

  if (services.length > 1) {
    for (const s of services) {
      const service = serviceById.get(s.service_id);
      if (!service.can_combine_with_others) {
        return {
          success: false,
          code: 'NOT_COMBINABLE',
          message: `${service.service_name} must be requested separately.`
        };
      }
    }
  }

  const possibleDuplicates = [];
  if (resident) {
    for (const s of services) {
      const service = serviceById.get(s.service_id);
      const [activeRequests, latestRequest] = await Promise.all([
        transactionRepository.findActiveByResidentService(residentId, s.service_id),
        transactionRepository.findLatestByResidentService(residentId, s.service_id)
      ]);
      const verdict = evaluateResidentPolicy(service, activeRequests, latestRequest);
      if (!verdict.allowed) {
        return {
          success: false,
          code: verdict.code,
          message: verdict.message,
          existing: verdict.existing
        };
      }
    }
  } else {
    // Guest: matching is advisory only — surface but never block.
    for (const s of services) {
      const possible = await transactionRepository.findPossibleGuestMatches(s.service_id, guestSnapshot);
      if (possible.length) {
        possibleDuplicates.push({
          service_id: s.service_id,
          service_name: serviceById.get(s.service_id).service_name,
          matches: possible.map(p => ({
            request_id: p.request_id,
            request_number: p.request_number,
            status_name: p.status_name
          }))
        });
      }
    }
  }

  // ---- Persist transaction + requests atomically ----
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const transactionNumber = await transactionRepository.generateTransactionNumber();
    const transactionId = await transactionRepository.createTransaction(conn, {
      transactionNumber,
      residentId,
      guestSnapshot,
      idempotencyKey
    });

    const requestNumbers = await allocateRequestNumbers(conn, services.length);
    const createdRequests = [];

    for (let i = 0; i < services.length; i++) {
      const s = services[i];
      const service = serviceById.get(s.service_id);
      const requestNumber = requestNumbers[i];
      // Whole-submission key stays on the transaction; per-request keys must be
      // unique (UNIQUE index), so de-duplicate only when grouping multiple.
      const requestKey = idempotencyKey
        ? (services.length === 1 ? idempotencyKey : `${idempotencyKey}#${i}`)
        : null;
      const storedFormData = guest
        ? mergeGuestFormData(s.form_data, guestSnapshot)
        : (s.form_data && Object.keys(s.form_data).length ? { ...s.form_data } : null);

      const serviceSnapshot = {
        service_id: service.service_id,
        service_name: service.service_name,
        description: service.description ?? null,
        requirements: service.requirements,
        form_fields: service.form_fields,
        processing_fee: service.processing_fee ?? null,
        requires_photo: service.requires_photo ?? false
      };

      let requestId;
      try {
        const [result] = await conn.query(
          `INSERT INTO requests
             (transaction_id, resident_id, service_id, request_number, status_id,
              request_date, form_data, service_snapshot, idempotency_key, created_at)
           VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, NOW())`,
          [
            transactionId,
            residentId,
            service.service_id,
            requestNumber,
            SUBMITTED_STATUS_ID,
            JSON.stringify(storedFormData),
            JSON.stringify(serviceSnapshot),
            requestKey
          ]
        );
        requestId = result.insertId;
      } catch (error) {
        // Legacy request besides the transaction already holds this key
        // (pre-transaction submissions). Roll back and return that request.
        if (error.code === 'ER_DUP_ENTRY' && requestKey) {
          const legacy = await transactionRepository.findLegacyRequestByKey(requestKey);
          await conn.rollback();
          if (legacy) {
            return {
              success: true,
              data: {
                transaction_id: null,
                transaction_number: null,
                duplicate: true,
                possible_duplicates: [],
                requests: [{
                  request_id: legacy.request_id,
                  request_number: legacy.request_number,
                  request_date: legacy.request_date,
                  status_name: 'Submitted',
                  service_id: legacy.service_id,
                  service_name: legacy.service_name || null
                }]
              }
            };
          }
          return { success: false, code: 'DUPLICATE_KEY', message: 'This submission was already recorded.' };
        }
        throw error;
      }

      if (s.photo) {
        await savePhoto(requestId, s.photo);
      }

      createdRequests.push({
        request_id: requestId,
        request_number: requestNumber,
        request_date: new Date(),
        service_id: service.service_id,
        service_name: service.service_name
      });
    }

    await conn.commit();
    conn.release();

    // Best-effort side effects AFTER commit so a notification/audit failure can
    // never roll back an accepted submission.
    const applicantName = resident
      ? `${resident.first_name} ${resident.last_name}`.trim()
      : (guestSnapshot ? guestSnapshot.full_name : 'Resident');
    const applicantCode = resident ? resident.resident_code : 'GUEST';

    for (const r of createdRequests) {
      try {
        auditRepository.log({
          userId: 2,
          action: `Kiosk request created: ${r.request_number}`,
          module: 'Kiosk',
          ipAddress: ip
        });
      } catch { /* non-critical */ }

      try {
        await notificationService.createNotificationForAdmins(
          'New Document Request',
          `${applicantName} (${applicantCode}) requested ${r.service_name} — ${r.request_number}`,
          'info',
          'request',
          r.request_id
        );
      } catch { /* non-critical */ }

      sseManager.broadcastEvent('request-created', {
        requestId: r.request_id,
        requestNumber: r.request_number,
        serviceName: r.service_name,
        residentName: applicantName
      });
    }

    return {
      success: true,
      data: {
        transaction_id: transactionId,
        transaction_number: transactionNumber,
        created_at: new Date(),
        duplicate: false,
        possible_duplicates: possibleDuplicates,
        requests: createdRequests
      }
    };
  } catch (error) {
    try { await conn.rollback(); } catch { /* already rolled back */ }
    conn.release();
    throw error;
  }
};

const buildTransactionResult = (transaction, duplicate) => {
  return {
    transaction_id: transaction.transaction_id,
    transaction_number: transaction.transaction_number,
    created_at: transaction.created_at,
    duplicate,
    possible_duplicates: [],
    requests: transaction.requests || []
  };
};

const allocateRequestNumbers = async (conn, count) => {
  const [rows] = await conn.query(
    "SELECT MAX(CAST(SUBSTRING_INDEX(request_number, '-', -1) AS UNSIGNED)) AS max_num FROM requests"
  );
  const base = (rows[0]?.max_num || 0) + 1;
  return Array.from({ length: count }, (_, i) => formatRequestNumber(base + i));
};

// Saves a base64 photo for a request into kiosk-photos.
// Photo storage must never fail the submission.
const savePhoto = async (requestId, photo) => {
  try {
    const photoDir = path.join(__dirname, '../../uploads/kiosk-photos');
    if (!fs.existsSync(photoDir)) fs.mkdirSync(photoDir, { recursive: true });

    const base64Data = String(photo).replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    if (!buffer.length) return;

    const fileName = `request_${requestId}_${Date.now()}.jpg`;
    fs.writeFileSync(path.join(photoDir, fileName), buffer);
  } catch (error) {
    console.error('Failed to save kiosk photo:', error);
  }
};

module.exports = {
  submitTransaction,
  evaluateResidentPolicy,
  validateGuestInput,
  buildGuestSnapshot,
  mergeGuestFormData,
  formatRequestNumber
};