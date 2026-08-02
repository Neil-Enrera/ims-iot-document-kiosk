const kioskService = require('../services/kiosk.service');
const residentService = require('../services/resident.service');
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
const createRequest = async (req, res) => {
  try {
    const { service_id, resident_id } = req.body;
    console.log('[Kiosk] createRequest body:', JSON.stringify({ service_id, resident_id, hasPhoto: !!req.body.photo, hasFormData: !!req.body.form_data }));
    if (!service_id || !resident_id) {
      return errorResponse(res, 400, 'Service and resident are required.');
    }

    const formData = req.body.form_data !== undefined ? req.body.form_data : req.body.formData;

    // Get resident and service details for notification
    const [residents] = await pool.query('SELECT resident_id, first_name, last_name, resident_code FROM residents WHERE resident_id = ?', [resident_id]);
    const [services] = await pool.query('SELECT * FROM services WHERE service_id = ?', [service_id]);

    const resident = residents[0];
    const service = services[0];

    if (!resident) return errorResponse(res, 404, 'Resident not found.');
    if (!service) return errorResponse(res, 404, 'Service not found.');

    const { requestId, requestNumber, requestDate } = await insertKioskRequest({
      resident,
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

// Public Barangay ID application: creates a new resident + request (no auth)
const createBarangayIdApplication = async (req, res) => {
  try {
    const {
      firstName, middleName, lastName, suffix, birthDate, gender, civilStatus,
      addressLine, contactNumber, email, bloodType, emergencyContactName,
      emergencyContactNumber, photo
    } = req.body;

    console.log('[Kiosk] createBarangayIdApplication body:', JSON.stringify({ firstName, lastName, hasPhoto: !!photo }));

    // Generate a resident code for the new applicant
    const residentCode = await residentService.generateResidentCode();

    // Default barangay is San Manuel (id 1); allow override for flexibility
    const barangayId = req.body.barangayId || 1;

    // Save the captured photo to the resident record
    let photoPath = null;
    if (photo) {
      try {
        const photoDir = path.join(__dirname, '../../uploads/resident-photos');
        if (!fs.existsSync(photoDir)) {
          fs.mkdirSync(photoDir, { recursive: true });
        }
        const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `resident_${Date.now()}.jpg`;
        const filePath = path.join(photoDir, fileName);
        fs.writeFileSync(filePath, buffer);
        photoPath = `resident-photos/${fileName}`;
      } catch (photoError) {
        console.error('Failed to save Barangay ID resident photo:', photoError);
      }
    }

    // Create the resident
    const [result] = await pool.query(
      `INSERT INTO residents (resident_code, first_name, middle_name, last_name, suffix, birth_date, gender, civil_status, barangay_id, address_line, contact_number, email, photo, blood_type, emergency_contact_name, emergency_contact_number, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [
        residentCode, firstName, middleName || null, lastName, suffix || null,
        birthDate || null, gender || null, civilStatus || null, barangayId,
        addressLine, contactNumber || null, email || null, photoPath,
        bloodType || null, emergencyContactName || null, emergencyContactNumber || null
      ]
    );
    const residentId = result.insertId;

    // Look up the Barangay ID service
    const [services] = await pool.query(
      `SELECT * FROM services WHERE service_name = 'Barangay ID' AND is_active = 1 LIMIT 1`
    );
    const service = services[0];
    if (!service) {
      return errorResponse(res, 400, 'Barangay ID service is not configured.');
    }

    const resident = {
      resident_id: residentId,
      first_name: firstName,
      last_name: lastName,
      resident_code: residentCode
    };

    const formData = {
      first_name: firstName,
      middle_name: middleName || null,
      last_name: lastName,
      suffix: suffix || null,
      birth_date: birthDate || null,
      gender: gender || null,
      civil_status: civilStatus || null,
      address_line: addressLine,
      contact_number: contactNumber || null,
      email: email || null,
      blood_type: bloodType || null,
      emergency_contact_name: emergencyContactName || null,
      emergency_contact_number: emergencyContactNumber || null
    };

    const { requestId, requestNumber, requestDate } = await insertKioskRequest({
      resident,
      service,
      photo,
      formData,
      req
    });

    return createdResponse(res, 'Barangay ID application submitted successfully.', {
      resident_id: residentId,
      resident_code: residentCode,
      request_id: requestId,
      request_number: requestNumber,
      request_date: requestDate,
      status: 'Pending'
    });
  } catch (error) {
    console.error('Kiosk createBarangayIdApplication error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

// Shared helper: inserts a request row, saves photo attachment, creates audit + notification + SSE
const insertKioskRequest = async ({ resident, service, photo, formData, req }) => {
  // Generate request number
  const [countResult] = await pool.query('SELECT COUNT(*) as cnt FROM requests');
  const count = countResult[0]?.cnt || 0;
  const requestNumber = `REQ-${String(count + 1).padStart(5, '0')}`;

  // Get default status_id (Pending)
  const [statusResult] = await pool.query("SELECT status_id FROM request_statuses WHERE status_name = 'Pending' LIMIT 1");
  const status = statusResult[0];
  const statusId = status?.status_id || 1;

  // Create request
  const [result] = await pool.query(
    `INSERT INTO requests (resident_id, service_id, request_number, status_id, request_date, form_data, service_snapshot, created_at)
     VALUES (?, ?, ?, ?, NOW(), ?, ?, NOW())`,
    [
      resident.resident_id,
      service.service_id,
      requestNumber,
      statusId,
      formData ? JSON.stringify(formData) : null,
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
  const residentName = `${resident.first_name} ${resident.last_name}`;
  try {
    await notificationService.createNotificationForAdmins(
      'New Document Request',
      `${residentName} (${resident.resident_code}) requested ${service.service_name} — ${requestNumber}`,
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

module.exports = { searchResidents, getResident, getServices, createRequest, createBarangayIdApplication, getHardwareStatus };
