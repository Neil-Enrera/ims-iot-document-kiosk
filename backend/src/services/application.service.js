const applicationRepository = require('../repositories/application.repository');
const residentService = require('../services/resident.service');
const residentRepository = require('../repositories/resident.repository');
const notificationService = require('../services/notification.service');
const sseManager = require('../services/notification-sse');
const idCardService = require('../services/id-card.service');
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

const getAllApplications = async ({ search, status, page = 1, limit = 20, sortBy = 'application_id', sortOrder = 'DESC' }) => {
  const result = await applicationRepository.findAll({ search, status, page, limit, sortBy, sortOrder });
  return { success: true, message: 'Barangay ID applications retrieved successfully.', data: result };
};

const getApplicationById = async (applicationId) => {
  const application = await applicationRepository.findById(applicationId);
  if (!application) {
    return { success: false, message: 'Application not found.' };
  }
  return { success: true, message: 'Application retrieved successfully.', data: application };
};

// Render a DRAFT preview of the Barangay ID card for an application WITHOUT
// approving it. The card is rendered to a buffer (never written to disk), no
// resident record is created, and no official ID number is assigned — so
// previewing the card never registers the applicant as an official Barangay ID
// holder. The official ID (with number, issue/expiry, and persisted card) is only
// generated later inside approveApplication.
const previewApplication = async (applicationId) => {
  const application = await applicationRepository.findById(applicationId);
  if (!application) {
    return { success: false, message: 'Application not found.' };
  }

  const barangay = await findBarangay();
  if (!barangay) {
    return { success: false, message: 'Barangay profile not found.' };
  }

  const rendered = await idCardService.renderCardBuffer({
    application,
    resident: {},
    barangay,
    processedBy: 'PREVIEW'
  });

  if (!rendered.success) {
    return { success: false, message: rendered.message };
  }

  return { success: true, message: 'Barangay ID preview rendered.', data: rendered.buffer };
};

const createApplication = async (data, ipAddress) => {
  const applicationNumber = await applicationRepository.generateApplicationNumber();

  // Save photo and signature to disk
  const photoPath = saveImage(data.photo, 'application-photos', 'app_photo');
  const signaturePath = saveImage(data.signature, 'application-signatures', 'app_signature');

  const applicationId = await applicationRepository.create({
    ...data,
    applicationNumber,
    photo: photoPath,
    signature: signaturePath
  });

  const application = await applicationRepository.findById(applicationId);

  // Notify all admins so they can review the application
  const applicantName = `${data.firstName} ${data.lastName}`;
  try {
    await notificationService.createNotificationForAdmins(
      'New Barangay ID Application',
      `${applicantName} submitted a Barangay ID application — ${applicationNumber}`,
      'info',
      'application',
      applicationId
    );
  } catch (notifError) {
    console.error('Failed to create application notification:', notifError);
  }

  sseManager.broadcastEvent('application-created', {
    applicationId,
    applicationNumber,
    applicantName
  });

  try {
    const auditRepository = require('../repositories/audit.repository');
    await auditRepository.log({
      userId: 2,
      action: `Barangay ID application submitted: ${applicationNumber}`,
      module: 'BarangayID',
      ipAddress
    });
  } catch (auditError) {
    console.error('Failed to create application audit log:', auditError);
  }

  return { success: true, message: 'Barangay ID application submitted successfully.', data: application };
};

const approveApplication = async (applicationId, userId, remarks, ipAddress) => {
  const application = await applicationRepository.findById(applicationId);
  if (!application) {
    return { success: false, message: 'Application not found.' };
  }
  if (application.status !== 'PENDING') {
    return { success: false, message: 'Only pending applications can be approved.' };
  }

  // Create the permanent resident record
  const residentCode = await residentService.generateResidentCode();
  const residentId = await residentRepository.create({
    residentCode,
    firstName: application.first_name,
    middleName: application.middle_name,
    lastName: application.last_name,
    suffix: application.suffix,
    birthDate: application.birth_date,
    gender: application.gender,
    civilStatus: application.civil_status,
    barangayId: 1,
    addressLine: application.address_line,
    contactNumber: application.contact_number,
    email: application.email,
    bloodType: application.blood_type,
    emergencyContactName: application.emergency_contact_name,
    emergencyContactNumber: application.emergency_contact_number
  });

  // Copy the captured photo to the resident record
  if (application.photo) {
    const srcPath = path.join(__dirname, `../../uploads/${application.photo}`);
    if (fs.existsSync(srcPath)) {
      try {
        const ext = path.extname(srcPath);
        const fileName = `resident_${Date.now()}${ext}`;
        const photoDir = path.join(__dirname, '../../uploads/resident-photos');
        if (!fs.existsSync(photoDir)) fs.mkdirSync(photoDir, { recursive: true });
        fs.copyFileSync(srcPath, path.join(photoDir, fileName));
        await residentRepository.updatePhoto(residentId, `resident-photos/${fileName}`);
      } catch (copyError) {
        console.error('Failed to copy application photo to resident:', copyError);
      }
    }
  }

  await applicationRepository.updateStatus(applicationId, 'APPROVED', userId, remarks, residentId);

  // Assign the official ID number + issue/expiry dates, then generate the
  // official ID card (DOCX) and attach it to the application row.
  const issuedAt = new Date();
  const validityYears = await getValidityYears();
  const idNumber = await generateIdNumber();
  const expirationDate = computeExpirationDate(issuedAt, validityYears);
  await applicationRepository.recordIdIssuance(applicationId, {
    idNumber,
    issuedAt,
    expirationDate: expirationDate.toISOString().slice(0, 10)
  });

  const updated = await applicationRepository.findById(applicationId);

  const resident = await residentRepository.findById(residentId);

  // Generate the ID card DOCX from the barangay's id_template. Failures are
  // logged but never block the approval itself.
  try {
    const barangay = await findBarangay();
    const processedBy = await findUserName(userId);
    const card = await idCardService.generateIdCard({
      application: updated,
      resident,
      barangay,
      processedBy
    });
    if (card.success) {
      await applicationRepository.updateIdCard(applicationId, card.data);
    } else {
      console.error(`ID card generation skipped for application #${applicationId}:`, card.message);
    }
  } catch (cardError) {
    console.error(`Failed to generate ID card for application #${applicationId}:`, cardError);
  }

  const finalApplication = await applicationRepository.findById(applicationId);

  try {
    const auditRepository = require('../repositories/audit.repository');
    await auditRepository.log({
      userId,
      action: `Approved Barangay ID application #${applicationId} -> resident ${residentCode} (ID ${idNumber})`,
      module: 'BarangayID',
      ipAddress: ipAddress || '127.0.0.1'
    });
  } catch (auditError) {
    console.error('Failed to create approval audit log:', auditError);
  }

  sseManager.broadcastEvent('application-approved', {
    applicationId,
    applicationNumber: application.application_number,
    residentId,
    residentCode,
    idNumber
  });

  return { success: true, message: 'Application approved and resident created.', data: { application: finalApplication, resident } };
};

const rejectApplication = async (applicationId, userId, remarks, ipAddress) => {
  const application = await applicationRepository.findById(applicationId);
  if (!application) {
    return { success: false, message: 'Application not found.' };
  }
  if (application.status !== 'PENDING') {
    return { success: false, message: 'Only pending applications can be rejected.' };
  }

  await applicationRepository.updateStatus(applicationId, 'REJECTED', userId, remarks);
  const updated = await applicationRepository.findById(applicationId);

  try {
    const auditRepository = require('../repositories/audit.repository');
    await auditRepository.log({
      userId,
      action: `Rejected Barangay ID application #${applicationId}`,
      module: 'BarangayID',
      ipAddress: ipAddress || '127.0.0.1'
    });
  } catch (auditError) {
    console.error('Failed to create rejection audit log:', auditError);
  }

  sseManager.broadcastEvent('application-rejected', {
    applicationId,
    applicationNumber: application.application_number
  });

  return { success: true, message: 'Application rejected.', data: updated };
};

const saveImage = (base64DataUrl, subdir, prefix) => {
  if (!base64DataUrl) return null;
  try {
    const base64Data = base64DataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const dir = path.join(__dirname, `../../uploads/${subdir}`);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const fileName = `${prefix}_${Date.now()}.png`;
    fs.writeFileSync(path.join(dir, fileName), buffer);
    return `${subdir}/${fileName}`;
  } catch (error) {
    console.error(`Failed to save ${subdir} image:`, error);
    return null;
  }
};

// Official ID number: BRGY-YYYY-NNNNNN (zero-padded, sequential per year).
// Numbers are only ever assigned at approval, so rejected/returned/reviewed
// applications never consume a sequence slot.
const generateIdNumber = async () => {
  const year = new Date().getFullYear();
  const last = await applicationRepository.findMaxIdNumber();
  let next = 1;
  if (last) {
    const match = last.match(/BRGY-\d{4}-(\d{6})/);
    if (match && String(last).startsWith(`BRGY-${year}-`)) {
      next = parseInt(match[1], 10) + 1;
    }
  }
  return `BRGY-${year}-${String(next).padStart(6, '0')}`;
};

// Expiry = issue date + id_validity_years (configurable, default 3).
const getValidityYears = async () => {
  try {
    const [rows] = await pool.query(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'id_validity_years' LIMIT 1"
    );
    const years = parseInt(rows[0]?.setting_value, 10);
    return years > 0 ? years : 3;
  } catch {
    return 3;
  }
};

// Compute expiry from the issue date, then record ID number + issue/expiry on
// the application row before the card is generated so the card renders the
// fresh id_number.
const computeExpirationDate = (issuedAt, years) => {
  const d = new Date(issuedAt);
  d.setFullYear(d.getFullYear() + years);
  return d;
};

const getPendingCount = async () => {
  const [rows] = await pool.query("SELECT COUNT(*) AS total FROM barangay_id_applications WHERE status = 'PENDING'");
  return rows[0]?.total || 0;
};

const findBarangay = async (barangayId) => {
  const [rows] = await pool.query(
    'SELECT * FROM barangays WHERE barangay_id = ? LIMIT 1',
    [barangayId || 1]
  );
  if (rows[0]) return rows[0];
  const [fallback] = await pool.query('SELECT * FROM barangays ORDER BY barangay_id ASC LIMIT 1');
  return fallback[0] || null;
};

const findUserName = async (userId) => {
  if (!userId) return '';
  const [rows] = await pool.query(
    'SELECT first_name, last_name FROM users WHERE user_id = ? LIMIT 1',
    [userId]
  );
  if (!rows[0]) return '';
  return [rows[0].first_name, rows[0].last_name].filter(Boolean).join(' ').trim();
};

module.exports = {
  getAllApplications,
  getApplicationById,
  createApplication,
  previewApplication,
  approveApplication,
  rejectApplication,
  getPendingCount
};
