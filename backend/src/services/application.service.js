const applicationRepository = require('../repositories/application.repository');
const residentService = require('../services/resident.service');
const residentRepository = require('../repositories/resident.repository');
const notificationService = require('../services/notification.service');
const sseManager = require('../services/notification-sse');
const idCardService = require('../services/id-card.service');
const portalAccountService = require('../services/portal-account.service');
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

  const mergedFormData = data.formData || data.form_data || {};
  if (data.birthPlace && !mergedFormData.birth_place) mergedFormData.birth_place = data.birthPlace;
  if (data.religion && !mergedFormData.religion) mergedFormData.religion = data.religion;
  if (data.nationality && !mergedFormData.nationality) mergedFormData.nationality = data.nationality;
  if (data.occupation && !mergedFormData.occupation) mergedFormData.occupation = data.occupation;
  if (data.houseNumber && !mergedFormData.house_number) mergedFormData.house_number = data.houseNumber;
  if (data.street && !mergedFormData.street) mergedFormData.street = data.street;
  if (data.subdivision && !mergedFormData.subdivision) mergedFormData.subdivision = data.subdivision;
  if (data.block && !mergedFormData.block) mergedFormData.block = data.block;
  if (data.lot && !mergedFormData.lot) mergedFormData.lot = data.lot;
  if (data.purokZone && !mergedFormData.purok_zone) mergedFormData.purok_zone = data.purokZone;
  if (data.sitio && !mergedFormData.sitio) mergedFormData.sitio = data.sitio;
  if (data.municipality && !mergedFormData.municipality) mergedFormData.municipality = data.municipality;
  if (data.province && !mergedFormData.province) mergedFormData.province = data.province;
  if (data.zipCode && !mergedFormData.zip_code) mergedFormData.zip_code = data.zipCode;

  const emailFieldKey = await getPortalEmailField();
  const resolvedEmail = resolveApplicationEmail({ ...data, form_data: mergedFormData }, emailFieldKey, null) || data.email;

  const applicationId = await applicationRepository.create({
    ...data,
    formData: mergedFormData,
    email: resolvedEmail || data.email || null,
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

  const emailFieldKey = await getPortalEmailField();
  const targetEmail = resolveApplicationEmail(application, emailFieldKey, null);

  let rawFormData = {};
  if (application.form_data) {
    if (typeof application.form_data === 'string') {
      try { rawFormData = JSON.parse(application.form_data); } catch { rawFormData = {}; }
    } else if (typeof application.form_data === 'object') {
      rawFormData = application.form_data;
    }
  }

  const birthPlace = rawFormData.birth_place || rawFormData.birthPlace || rawFormData.place_of_birth || rawFormData.placeOfBirth || application.birth_place || null;
  const nationality = rawFormData.nationality || application.nationality || 'Filipino';
  const religion = rawFormData.religion || application.religion || null;
  const occupation = rawFormData.occupation || application.occupation || null;
  const civilStatus = rawFormData.civil_status || rawFormData.civilStatus || application.civil_status || null;
  const bloodType = rawFormData.blood_type || rawFormData.bloodType || application.blood_type || null;
  const houseNumber = rawFormData.house_number || rawFormData.houseNumber || null;
  const street = rawFormData.street || null;
  const subdivision = rawFormData.subdivision || null;
  const block = rawFormData.block || null;
  const lot = rawFormData.lot || null;
  const purokZone = rawFormData.purok_zone || rawFormData.purokZone || null;
  const sitio = rawFormData.sitio || null;
  const municipality = rawFormData.municipality || null;
  const province = rawFormData.province || null;
  const zipCode = rawFormData.zip_code || rawFormData.zipCode || null;
  const emergencyContactName = rawFormData.emergency_contact_name || rawFormData.emergencyContactName || application.emergency_contact_name || null;
  const emergencyContactNumber = rawFormData.emergency_contact_number || rawFormData.emergencyContactNumber || application.emergency_contact_number || null;
  const contactNumber = rawFormData.contact_number || rawFormData.contactNumber || application.contact_number || null;
  const email = targetEmail || rawFormData.email || application.email || null;
  const addressLine = application.address_line || rawFormData.address_line || rawFormData.addressLine || null;

  // Check if resident already exists to avoid duplicate resident records
  let residentId = application.resident_id || null;
  let residentCode = null;

  if (residentId) {
    const existing = await residentRepository.findById(residentId);
    if (existing) {
      residentCode = existing.resident_code;
    } else {
      residentId = null;
    }
  }

  if (!residentId) {
    const existingByName = await residentRepository.findByNameAndBirthDate(
      application.first_name,
      application.last_name,
      application.birth_date
    );
    if (existingByName) {
      residentId = existingByName.resident_id;
      residentCode = existingByName.resident_code;
    }
  }

  if (residentId) {
    // Update existing resident record with approved application data
    await residentRepository.update(residentId, {
      firstName: application.first_name,
      middleName: application.middle_name,
      lastName: application.last_name,
      suffix: application.suffix,
      birthDate: application.birth_date,
      birthPlace,
      nationality,
      religion,
      occupation,
      gender: application.gender,
      civilStatus,
      addressLine,
      houseNumber,
      street,
      subdivision,
      block,
      lot,
      purokZone,
      sitio,
      municipality,
      province,
      zipCode,
      contactNumber,
      email,
      bloodType,
      emergencyContactName,
      emergencyContactNumber
    });
  } else {
    // Create new resident record
    residentCode = await residentService.generateResidentCode();
    residentId = await residentRepository.create({
      residentCode,
      firstName: application.first_name,
      middleName: application.middle_name,
      lastName: application.last_name,
      suffix: application.suffix,
      birthDate: application.birth_date,
      birthPlace,
      nationality,
      religion,
      occupation,
      gender: application.gender,
      civilStatus,
      barangayId: 1,
      addressLine,
      houseNumber,
      street,
      subdivision,
      block,
      lot,
      purokZone,
      sitio,
      municipality,
      province,
      zipCode,
      contactNumber,
      email,
      bloodType,
      emergencyContactName,
      emergencyContactNumber
    });
  }

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

  // Auto-generate the online portal account after Barangay ID issuance
  // (spec §4-§6). Failures are logged but never block the approval itself.
  let portalAccount = null;
  try {
    const fullName = [application.first_name, application.middle_name, application.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();
    const portalEmail = resolveApplicationEmail(application, emailFieldKey, resident);
    const portalResult = await portalAccountService.createAccountForResident({
      residentId,
      residentCode,
      email: portalEmail,
      fullName
    });
    if (portalResult.success && portalResult.data?.account) {
      portalAccount = portalResult.data.account;
      updated.account_id = portalAccount.account_id;
    } else if (!portalResult.success) {
      console.error(`Portal account not created for application #${applicationId}:`, portalResult.message);
    }
  } catch (portalError) {
    console.error(`Failed to create portal account for application #${applicationId}:`, portalError);
  }

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

  // Send Ready for Release / ID approval email notification to the applicant
  try {
    const emailService = require('./email.service');
    const notificationEmail = resolveApplicationEmail(application, emailFieldKey, resident);
    if (notificationEmail) {
      const fullName = [application.first_name, application.middle_name, application.last_name]
        .filter(Boolean)
        .join(' ')
        .trim();
      await emailService.sendReadyForReleaseNotification({
        email: notificationEmail,
        name: fullName,
        requestNumber: application.application_number,
        serviceName: 'Barangay ID Application',
        fee: 0,
        isIdRequest: true
      });
    }
  } catch (emailErr) {
    console.error(`Failed to send Barangay ID application approval email for #${applicationId}:`, emailErr.message);
  }

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
    idNumber,
    accountId: portalAccount?.account_id || null
  });

  return {
    success: true,
    message: 'Application approved and resident created.',
    data: {
      application: finalApplication,
      resident,
      accountId: portalAccount?.account_id || null
    }
  };
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

const releaseApplication = async (applicationId, userId, ipAddress) => {
  const application = await applicationRepository.findById(applicationId);
  if (!application) {
    return { success: false, message: 'Application not found.' };
  }
  if (application.status === 'RELEASED') {
    return { success: true, message: 'Application is already marked as released.', data: application };
  }
  if (application.status !== 'APPROVED') {
    return { success: false, message: 'Only approved applications can be marked as released.' };
  }

  await applicationRepository.markReleased(applicationId, userId);

  try {
    const auditRepository = require('../repositories/audit.repository');
    await auditRepository.log({
      userId,
      action: `Marked Barangay ID application #${applicationId} (${application.application_number}) as Released`,
      module: 'BarangayID',
      ipAddress: ipAddress || '127.0.0.1'
    });
  } catch (auditError) {
    console.error('Failed to create release audit log:', auditError);
  }

  const updated = await applicationRepository.findById(applicationId);

  sseManager.broadcastEvent('application-updated', {
    applicationId,
    applicationNumber: application.application_number,
    status: 'RELEASED'
  });

  // Update Public Status Display stream so the entry is removed from Ready for Release board immediately
  try {
    const { broadcastStatusDisplayUpdate } = require('../controllers/kiosk.controller');
    broadcastStatusDisplayUpdate().catch(() => {});
  } catch {}

  return {
    success: true,
    message: `Application ${application.application_number} marked as released.`,
    data: updated
  };
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

// Configurable email field used for Online Portal account creation and notifications (default: 'email').
const getPortalEmailField = async () => {
  try {
    const [rows] = await pool.query(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'portal_account_email_field' LIMIT 1"
    );
    const fieldKey = rows[0]?.setting_value?.trim();
    return fieldKey || 'email';
  } catch {
    return 'email';
  }
};

const resolveApplicationEmail = (application, configuredField = 'email', resident = null) => {
  const field = (configuredField || 'email').trim();
  const formData = application?.form_data || {};

  // 1. If configured field exists in form_data (exact or normalized key match)
  if (formData && typeof formData === 'object') {
    if (formData[field] && typeof formData[field] === 'string' && formData[field].trim()) {
      return formData[field].trim();
    }
    const cleanKey = field.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [k, v] of Object.entries(formData)) {
      if (typeof v === 'string' && v.trim() && k.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanKey) {
        return v.trim();
      }
    }
  }

  // 2. If configured field matches a direct property on application
  if (application && application[field] && typeof application[field] === 'string' && application[field].trim()) {
    return application[field].trim();
  }

  // 3. Fallbacks to standard fields (application.email, resident.email, or any valid email in formData)
  if (application?.email && typeof application.email === 'string' && application.email.trim()) {
    return application.email.trim();
  }
  if (resident?.email && typeof resident.email === 'string' && resident.email.trim()) {
    return resident.email.trim();
  }
  if (formData && typeof formData === 'object') {
    for (const [k, v] of Object.entries(formData)) {
      if (typeof v === 'string' && v.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) {
        return v.trim();
      }
    }
  }

  return '';
};

module.exports = {
  getAllApplications,
  getApplicationById,
  createApplication,
  previewApplication,
  approveApplication,
  rejectApplication,
  releaseApplication,
  getPendingCount,
  getPortalEmailField,
  resolveApplicationEmail
};
