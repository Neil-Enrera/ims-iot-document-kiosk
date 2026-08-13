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
  putTrimmed('full_name', g.full_name);
  putTrimmed('middle_name', g.middle_name);
  if (g.birth_date) snapshot.birth_date = g.birth_date;
  putTrimmed('address', g.address);
  putTrimmed('contact_number', g.contact_number);
  putTrimmed('email', g.email);
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

  // ---- Resolve services + policy checks (BEFORE writing anything) ----
  const serviceIds = [...new Set(services.map(s => s.service_id))];
  const serviceRows = await transactionRepository.findServicesByIds(serviceIds);
  const serviceById = new Map(serviceRows.map(s => [s.service_id, s]));

  for (const s of services) {
    const service = serviceById.get(s.service_id);
    if (!service) return { success: false, code: 'SERVICE_NOT_FOUND', message: `Service (${s.service_id}) not found.` };
    if (!service.is_active) return { success: false, code: 'SERVICE_INACTIVE', message: `${service.service_name} is not available.` };
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
        await savePhoto(conn, requestId, s.photo);
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

// Saves a base64 photo for a request into kiosk-photos + request_attachments.
// Photo storage must never fail the submission.
const savePhoto = async (conn, requestId, photo) => {
  try {
    const photoDir = path.join(__dirname, '../../uploads/kiosk-photos');
    if (!fs.existsSync(photoDir)) fs.mkdirSync(photoDir, { recursive: true });

    const base64Data = String(photo).replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    if (!buffer.length) return;

    const fileName = `request_${requestId}_${Date.now()}.jpg`;
    const filePath = path.join(photoDir, fileName);
    fs.writeFileSync(filePath, buffer);

    await conn.query(
      `INSERT INTO request_attachments (request_id, file_name, file_type, file_path)
       VALUES (?, ?, 'image/jpeg', ?)`,
      [requestId, fileName, `kiosk-photos/${fileName}`]
    );
  } catch (error) {
    console.error('Failed to save kiosk photo:', error);
  }
};

module.exports = {
  submitTransaction,
  evaluateResidentPolicy,
  buildGuestSnapshot,
  mergeGuestFormData,
  formatRequestNumber
};