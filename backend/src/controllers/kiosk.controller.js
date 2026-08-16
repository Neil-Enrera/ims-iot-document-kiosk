const kioskService = require('../services/kiosk.service');
const requestService = require('../services/request.service');
const applicationService = require('../services/application.service');
const rfidService = require('../services/rfid.service');
const notificationService = require('../services/notification.service');
const sseManager = require('../services/notification-sse');
const transactionService = require('../services/transaction.service');
const idCardService = require('../services/id-card.service');
const documentService = require('../services/document.service');
const { findBarangay } = require('../services/barangay.service');
const { successResponse, errorResponse, createdResponse } = require('../utils/apiResponse');
const pool = require('../config/database');

// ============================================================
// MANUAL RESIDENT SELECTION (active — no hardware needed)
// ============================================================

const searchResidents = async (req, res) => {
  try {
    const { q, limit } = req.query;
    if (!q || q.trim().length < 2) {
      return successResponse(res, 'Enter at least 2 characters to search.', []);
    }
    const results = await kioskService.searchResidents(q, parseInt(limit) || 20);
    return successResponse(res, 'Residents found.', results);
  } catch (error) {
    console.error('Kiosk searchResidents error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const getResident = async (req, res) => {
  try {
    const { id } = req.params;
    const resident = await kioskService.getResidentById(id);
    if (!resident) return errorResponse(res, 404, 'Resident not found.');
    return successResponse(res, 'Resident retrieved.', resident);
  } catch (error) {
    console.error('Kiosk getResident error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

// Public request creation for kiosk (no auth required)
// One submission becomes one TRANSACTION grouping one or more Service Requests.
// Supports both:
//   - identified residents (resident_id + optional form_data)
//   - temporary guest sessions (guest {full_name, birth_date, address, contact_number, email?} + form_data)
// Accepts a single `service_id` (current kiosk) or a `services` array (future
// multi-select). The response stays request-number compatible with the kiosk.
const createRequest = async (req, res) => {
  try {
    const { resident_id, guest, idempotency_key, idempotencyKey } = req.body;
    console.log('[Kiosk] createRequest body:', JSON.stringify({ resident_id, hasGuest: !!guest, hasServices: Array.isArray(req.body.services), service_id: req.body.service_id, hasPhoto: !!req.body.photo, hasFormData: !!req.body.form_data }));

    const services = Array.isArray(req.body.services) && req.body.services.length
      ? req.body.services.map(s => ({
          service_id: s.service_id,
          form_data: s.form_data ?? s.formData ?? undefined,
          photo: s.photo ?? undefined
        }))
      : req.body.service_id
        ? [{
            service_id: req.body.service_id,
            form_data: req.body.form_data !== undefined ? req.body.form_data : req.body.formData,
            photo: req.body.photo || undefined
          }]
        : [];

    const result = await transactionService.submitTransaction({
      services,
      resident_id: resident_id || undefined,
      guest,
      idempotency_key: idempotency_key || idempotencyKey || undefined,
      ip: req.ip
    });

    if (!result.success) {
      const body = { success: false, message: result.message };
      if (result.code) body.code = result.code;
      if (result.existing) body.existing = result.existing;
      return res.status(400).json(body);
    }

    const data = result.data;
    const first = data.requests?.[0] || {};
    return successResponse(res, data.duplicate ? 'Request already submitted.' : 'Request submitted successfully.', {
      transaction_id: data.transaction_id,
      transaction_number: data.transaction_number,
      request_id: first.request_id ?? null,
      request_number: first.request_number ?? data.transaction_number,
      request_date: first.request_date ?? data.created_at,
      status: 'Submitted',
      duplicate: data.duplicate,
      requests: data.requests || [],
      possible_duplicates: data.possible_duplicates || []
    });
  } catch (error) {
    console.error('Kiosk createRequest error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

// Public services list for kiosk (no auth required)
const getServices = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT service_id, service_name, description, requirements, form_fields,
              processing_fee, requires_photo, is_active, template_path
       FROM services WHERE is_active = 1 ORDER BY service_name`
    );
    const services = rows.map(s => ({
      ...s,
      requirements: parseJsonField(s.requirements),
      form_fields: parseJsonField(s.form_fields),
      has_template: !!s.template_path
    }));
    return successResponse(res, 'Services retrieved.', services);
  } catch (error) {
    console.error('Kiosk getServices error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const parseJsonField = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return null; }
  }
  return value;
};

// Public Barangay ID application: creates an APPLICATION record (no resident yet)
// Staff review the application, then approve -> creates resident + RFID assignment
const createBarangayIdApplication = async (req, res) => {
  try {
    const {
      firstName, middleName, lastName, suffix, birthDate, gender, civilStatus,
      addressLine, contactNumber, email, occupation, bloodType,
      emergencyContactName, emergencyContactNumber, photo, signature, formData
    } = req.body;

    console.log('[Kiosk] createBarangayIdApplication body:', JSON.stringify({ firstName, lastName, hasPhoto: !!photo, hasSignature: !!signature }));

    const result = await applicationService.createApplication({
      firstName, middleName, lastName, suffix, birthDate, gender, civilStatus,
      addressLine, contactNumber, email, occupation, bloodType,
      emergencyContactName, emergencyContactNumber, photo, signature, formData
    }, req.ip);

    if (!result.success) return errorResponse(res, 400, result.message);

    const app = result.data;
    return createdResponse(res, result.message, {
      application_id: app.application_id,
      application_number: app.application_number,
      status: app.status
    });
  } catch (error) {
    console.error('Kiosk createBarangayIdApplication error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

// Public live preview: renders the barangay's ID card template with the kiosk's
// in-progress form data (no application row is created) so the applicant can
// review their card before submitting. Returns the DOCX buffer directly.
const previewBarangayId = async (req, res) => {
  try {
    const barangay = await findBarangay();
    if (!barangay) return errorResponse(res, 404, 'Barangay profile not found.');

    const application = idCardService.applicationFromKioskPayload(req.body || {});
    const rendered = await idCardService.renderCardBuffer({
      application,
      resident: {},
      barangay,
      processedBy: 'PREVIEW'
    });

    if (!rendered.success) return errorResponse(res, 400, rendered.message);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'inline; filename="barangay-id-preview.docx"',
      'Cache-Control': 'no-store'
    });
    return res.send(rendered.buffer);
  } catch (error) {
    console.error('Kiosk previewBarangayId error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

// Public live preview for a document REQUEST: renders the service's document
// template with the kiosk's in-progress form data (no request row is created)
// so the resident can review exactly what the generated document will contain
// before submitting. Returns the DOCX buffer directly. Previewing NEVER:
// approves the request, registers/releases a document, changes status, or
// writes an official file — the admin's later review/approval drives all that.
const previewRequestDocument = async (req, res) => {
  try {
    const { service_id, resident_id, guest, form_data } = req.body;

    if (!service_id) {
      return errorResponse(res, 400, 'Service is required.');
    }

    const rendered = await documentService.renderRequestPreview({
      serviceId: service_id,
      formData: form_data,
      residentId: resident_id || null,
      guest: guest || null,
      processedBy: 'PREVIEW'
    });

    if (!rendered.success) return errorResponse(res, 400, rendered.message);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'inline; filename="document-preview.docx"',
      'Cache-Control': 'no-store'
    });
    return res.send(rendered.buffer);
  } catch (error) {
    console.error('Kiosk previewRequestDocument error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

// Public RFID verification for the kiosk (no auth required)
const verifyRfid = async (req, res) => {
  try {
    const { rfidUid } = req.body;
    console.log('[Kiosk Controller] Received verify request for UID:', rfidUid);
    if (!rfidUid) {
      return errorResponse(res, 400, 'RFID UID is required.');
    }
    const result = await rfidService.getResidentByUid(rfidUid);
    console.log('[Kiosk Controller] getResidentByUid result:', result);
    if (!result.success) {
      return successResponse(res, 'RFID not recognized.', { recognized: false, message: result.message });
    }
    return successResponse(res, 'RFID recognized.', {
      recognized: true,
      resident: result.data.resident,
      rfid: result.data.rfid
    });
  } catch (error) {
    console.error('Kiosk verifyRfid error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

// Public status display board (no auth required)
// Returns only request numbers grouped by board column for resident privacy.
const fetchStatusDisplayData = async () => {
  const [rows] = await pool.query(
    `SELECT rq.request_number, rq.request_id, rs.status_name
     FROM requests rq
     JOIN request_statuses rs ON rq.status_id = rs.status_id
     WHERE rs.status_name IN ('Under Review', 'Document Processing', 'Ready for Release')
       AND NOT (rs.status_name = 'Ready for Release' AND rq.expires_at IS NOT NULL AND rq.expires_at < NOW())
     ORDER BY rq.request_id ASC`
  );

  return {
    updatedAt: new Date().toISOString(),
    underReview: rows
      .filter(r => r.status_name === 'Under Review' || r.status_name === 'Document Processing')
      .map(r => r.request_number),
    readyForRelease: rows
      .filter(r => r.status_name === 'Ready for Release')
      .map(r => r.request_number)
  };
};

const getStatusDisplay = async (req, res) => {
  try {
    const data = await fetchStatusDisplayData();
    return successResponse(res, 'Status display retrieved.', data);
  } catch (error) {
    console.error('Kiosk getStatusDisplay error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

// Public Server-Sent Events stream for the status display board. Connected
// clients receive a fresh snapshot every few seconds instead of polling the
// REST endpoint themselves, so the board stays live with no client requests.
const statusDisplayClients = new Set();
const STATUS_DISPLAY_PUSH_MS = 5000;

const getStatusDisplayStream = async (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.flushHeaders?.();

  statusDisplayClients.add(res);

  const writeToClient = (client, data) => {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const push = async () => {
    if (statusDisplayClients.size === 0) return;
    try {
      const data = await fetchStatusDisplayData();
      for (const client of statusDisplayClients) {
        writeToClient(client, data);
      }
    } catch (error) {
      console.error('Status display SSE push error:', error);
    }
  };

  const timer = setInterval(push, STATUS_DISPLAY_PUSH_MS);

  res.on('close', () => {
    clearInterval(timer);
    statusDisplayClients.delete(res);
  });

  // Send an initial snapshot immediately on connect
  try {
    const data = await fetchStatusDisplayData();
    writeToClient(res, data);
  } catch (error) {
    console.error('Status display SSE initial push error:', error);
  }
};

const getHardwareStatus = async (req, res) => {
  try {
    const status = await kioskService.getHardwareStatus();
    return successResponse(res, 'Hardware status retrieved.', status);
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

module.exports = { searchResidents, getResident, getServices, createRequest, createBarangayIdApplication, previewBarangayId, previewRequestDocument, verifyRfid, getStatusDisplay, getStatusDisplayStream, getHardwareStatus };
