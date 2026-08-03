const kioskService = require('../services/kiosk.service');
const residentService = require('../services/resident.service');
const applicationService = require('../services/application.service');
const rfidService = require('../services/rfid.service');
const auditRepository = require('../repositories/audit.repository');
const notificationService = require('../services/notification.service');
const sseManager = require('../services/notification-sse');
const { successResponse, errorResponse, createdResponse } = require('../utils/apiResponse');
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

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

// Public services list for kiosk (no auth required)
const getServices = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT service_id, service_name, description, requirements, form_fields, required_documents,
              processing_fee, processing_time, requires_photo, approval_workflow, is_active
       FROM services WHERE is_active = 1 ORDER BY service_name`
    );
    const services = rows.map(s => ({
      ...s,
      requirements: parseJsonField(s.requirements),
      form_fields: parseJsonField(s.form_fields),
      required_documents: parseJsonField(s.required_documents)
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

// Public request creation for kiosk (no auth required)
// Supports both:
//   - identified residents (resident_id + optional form_data)
//   - temporary guest sessions (guest {full_name, birth_date, address, contact_number, email?} + form_data)
const createRequest = async (req, res) => {
  try {
    const { service_id, resident_id, guest } = req.body;
    console.log('[Kiosk] createRequest body:', JSON.stringify({ service_id, resident_id, hasGuest: !!guest, hasPhoto: !!req.body.photo, hasFormData: !!req.body.form_data }));

    if (!service_id) {
      return errorResponse(res, 400, 'Service is required.');
    }
    if (!resident_id && !guest) {
      return errorResponse(res, 400, 'Resident or guest information is required.');
    }

    const formData = req.body.form_data !== undefined ? req.body.form_data : req.body.formData;

    // Get service details for notification
    const [services] = await pool.query('SELECT * FROM services WHERE service_id = ?', [service_id]);
    const service = services[0];
    if (!service) return errorResponse(res, 404, 'Service not found.');

    let resident = null;
    let applicant = null;

    if (resident_id) {
      const [residents] = await pool.query('SELECT resident_id, first_name, last_name, resident_code FROM residents WHERE resident_id = ?', [resident_id]);
      resident = residents[0];
      if (!resident) return errorResponse(res, 404, 'Resident not found.');
      applicant = { ...resident, isGuest: false };
    } else {
      const guestInfo = guest || {};
      if (!guestInfo.full_name) {
        return errorResponse(res, 400, 'Guest full name is required.');
      }
      applicant = {
        resident_id: null,
        first_name: guestInfo.full_name,
        middle_name: guestInfo.middle_name || null,
        last_name: '',
        resident_code: 'GUEST',
        isGuest: true,
        guestInfo
      };
    }

    const { requestId, requestNumber, requestDate } = await insertKioskRequest({
      resident: applicant,
      service,
      photo: req.body.photo,
      formData,
      req
    });

    return successResponse(res, 'Request submitted successfully.', {
      request_id: requestId,
      request_number: requestNumber,
      request_date: requestDate,
      status: 'Pending'
    });
  } catch (error) {
    console.error('Kiosk createRequest error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
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

// Public RFID verification for the kiosk (no auth required)
const verifyRfid = async (req, res) => {
  try {
    const { rfidUid } = req.body;
    if (!rfidUid) {
      return errorResponse(res, 400, 'RFID UID is required.');
    }
    const result = await rfidService.getResidentByUid(rfidUid);
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

// Shared helper: inserts a request row, saves photo attachment, creates audit + notification + SSE
// resident may be a real resident or a guest applicant (resident.resident_id === null, isGuest === true)
const insertKioskRequest = async ({ resident, service, photo, formData, req }) => {
  // Generate request number from the highest existing suffix (avoids duplicates after deletions/out-of-order ids)
  const [maxResult] = await pool.query(
    "SELECT MAX(CAST(SUBSTRING_INDEX(request_number, '-', -1) AS UNSIGNED)) AS max_num FROM requests"
  );
  const next = (maxResult[0]?.max_num || 0) + 1;
  const requestNumber = `REQ-${String(next).padStart(5, '0')}`;

  // Get default status_id (Pending)
  const [statusResult] = await pool.query("SELECT status_id FROM request_statuses WHERE status_name = 'Pending' LIMIT 1");
  const status = statusResult[0];
  const statusId = status?.status_id || 1;

  // For guest sessions, merge the basic guest information into form_data
  let storedFormData = formData || {};
  if (resident.isGuest && resident.guestInfo) {
    storedFormData = {
      ...storedFormData,
      _guest: {
        full_name: resident.guestInfo.full_name,
        middle_name: resident.guestInfo.middle_name || null,
        birth_date: resident.guestInfo.birth_date || null,
        address: resident.guestInfo.address || null,
        contact_number: resident.guestInfo.contact_number || null,
        email: resident.guestInfo.email || null
      }
    };
  }

  // Create request (resident_id may be NULL for guest sessions)
  const [result] = await pool.query(
    `INSERT INTO requests (resident_id, service_id, request_number, status_id, request_date, form_data, service_snapshot, created_at)
     VALUES (?, ?, ?, ?, NOW(), ?, ?, NOW())`,
    [
      resident.resident_id,
      service.service_id,
      requestNumber,
      statusId,
      Object.keys(storedFormData).length ? JSON.stringify(storedFormData) : null,
      JSON.stringify({
        service_id: service.service_id,
        service_name: service.service_name,
        description: service.description ?? null,
        requirements: parseJsonField(service.requirements),
        form_fields: parseJsonField(service.form_fields),
        required_documents: parseJsonField(service.required_documents),
        processing_fee: service.processing_fee ?? null,
        processing_time: service.processing_time ?? null,
        requires_photo: service.requires_photo ?? false,
        approval_workflow: service.approval_workflow ?? null
      })
    ]
  );

  const requestId = result.insertId;

  // Save captured photo to request_attachments if provided
  if (photo) {
    try {
      // Ensure kiosk-photos directory exists
      const photoDir = path.join(__dirname, '../../uploads/kiosk-photos');
      if (!fs.existsSync(photoDir)) {
        fs.mkdirSync(photoDir, { recursive: true });
      }

      // Decode Base64 data URL
      const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Generate filename and save
      const fileName = `request_${requestId}_${Date.now()}.jpg`;
      const filePath = path.join(photoDir, fileName);
      fs.writeFileSync(filePath, buffer);

      // Insert attachment record
      await pool.query(
        `INSERT INTO request_attachments (request_id, file_name, file_type, file_path)
         VALUES (?, ?, 'image/jpeg', ?)`,
        [requestId, fileName, `kiosk-photos/${fileName}`]
      );
    } catch (photoError) {
      console.error('Failed to save kiosk photo:', photoError);
      // Don't fail the request if photo storage fails
    }
  }

  try {
    auditRepository.log({ userId: 2, action: `Kiosk request created: ${requestNumber}`, module: 'Kiosk', ipAddress: req.ip });
  } catch (auditError) {
    console.error('Failed to create audit log:', auditError);
  }

  // Create notifications for all admins
  const residentName = resident.isGuest
    ? resident.guestInfo.full_name
    : `${resident.first_name} ${resident.last_name}`;
  const residentCode = resident.isGuest ? 'GUEST' : resident.resident_code;
  try {
    await notificationService.createNotificationForAdmins(
      'New Document Request',
      `${residentName} (${residentCode}) requested ${service.service_name} — ${requestNumber}`,
      'info',
      'request',
      requestId
    );
  } catch (notifError) {
    console.error('Failed to create notification:', notifError);
    // Don't fail the request if notification fails
  }

  // Broadcast a request-created event so the admin panel auto-refreshes
  sseManager.broadcastEvent('request-created', {
    requestId,
    requestNumber,
    serviceName: service.service_name,
    residentName
  });

  return { requestId, requestNumber, requestDate: new Date() };
};

const getHardwareStatus = async (req, res) => {
  try {
    const status = await kioskService.getHardwareStatus();
    return successResponse(res, 'Hardware status retrieved.', status);
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

module.exports = { searchResidents, getResident, getServices, createRequest, createBarangayIdApplication, verifyRfid, getHardwareStatus };
