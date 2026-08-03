const applicationRepository = require('../repositories/application.repository');
const residentService = require('../services/resident.service');
const residentRepository = require('../repositories/resident.repository');
const notificationService = require('../services/notification.service');
const sseManager = require('../services/notification-sse');
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

const approveApplication = async (applicationId, userId, remarks) => {
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
  const updated = await applicationRepository.findById(applicationId);

  const resident = await residentRepository.findById(residentId);

  try {
    const auditRepository = require('../repositories/audit.repository');
    await auditRepository.log({
      userId,
      action: `Approved Barangay ID application #${applicationId} -> resident ${residentCode}`,
      module: 'BarangayID',
      ipAddress: null
    });
  } catch (auditError) {
    console.error('Failed to create approval audit log:', auditError);
  }

  sseManager.broadcastEvent('application-approved', {
    applicationId,
    applicationNumber: application.application_number,
    residentId,
    residentCode
  });

  return { success: true, message: 'Application approved and resident created.', data: { application: updated, resident } };
};

const rejectApplication = async (applicationId, userId, remarks) => {
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
      ipAddress: null
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

const getPendingCount = async () => {
  const [rows] = await pool.query("SELECT COUNT(*) AS total FROM barangay_id_applications WHERE status = 'PENDING'");
  return rows[0]?.total || 0;
};

module.exports = { getAllApplications, getApplicationById, createApplication, approveApplication, rejectApplication, getPendingCount };
