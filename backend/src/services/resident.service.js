const residentRepository = require('../repositories/resident.repository');

const generateResidentCode = async () => {
  const [rows] = await require('../config/database').query(
    "SELECT resident_code FROM residents ORDER BY resident_id DESC LIMIT 1"
  );
  if (rows.length === 0) return 'RES-00001';
  const lastCode = rows[0].resident_code;
  const num = parseInt(lastCode.replace('RES-', ''), 10) + 1;
  return `RES-${String(num).padStart(5, '0')}`;
};

const getAllResidents = async ({ search, status, barangayId, page = 1, limit = 20, sortBy = 'resident_id', sortOrder = 'ASC' }) => {
  const result = await residentRepository.findAll({ search, status, barangayId, page, limit, sortBy, sortOrder });
  return { success: true, message: 'Residents retrieved successfully.', data: result };
};

const getResidentById = async (residentId) => {
  const resident = await residentRepository.findById(residentId);
  if (!resident) {
    return { success: false, message: 'Resident not found.' };
  }
  return { success: true, message: 'Resident retrieved successfully.', data: resident };
};

const createResident = async (residentData) => {
  if (residentData.residentCode) {
    const existing = await residentRepository.findByCode(residentData.residentCode);
    if (existing) {
      return { success: false, message: 'Resident code already exists.' };
    }
  } else {
    residentData.residentCode = await generateResidentCode();
  }

  const residentId = await residentRepository.create(residentData);
  const resident = await residentRepository.findById(residentId);

  return { success: true, message: 'Resident created successfully.', data: resident };
};

const updateResident = async (residentId, residentData) => {
  const resident = await residentRepository.findById(residentId);
  if (!resident) {
    return { success: false, message: 'Resident not found.' };
  }

  await residentRepository.update(residentId, residentData);
  const updated = await residentRepository.findById(residentId);

  return { success: true, message: 'Resident updated successfully.', data: updated };
};

const archiveResident = async (residentId) => {
  const resident = await residentRepository.findById(residentId);
  if (!resident) {
    return { success: false, message: 'Resident not found.' };
  }

  await residentRepository.updateStatus(residentId, 'INACTIVE');
  const updated = await residentRepository.findById(residentId);

  return { success: true, message: 'Resident archived successfully.', data: updated };
};

const restoreResident = async (residentId) => {
  const resident = await residentRepository.findById(residentId);
  if (!resident) {
    return { success: false, message: 'Resident not found.' };
  }

  await residentRepository.updateStatus(residentId, 'ACTIVE');
  const updated = await residentRepository.findById(residentId);

  return { success: true, message: 'Resident restored successfully.', data: updated };
};

const uploadPhoto = async (residentId, photoPath) => {
  const resident = await residentRepository.findById(residentId);
  if (!resident) {
    return { success: false, message: 'Resident not found.' };
  }

  await residentRepository.updatePhoto(residentId, photoPath);
  const updated = await residentRepository.findById(residentId);

  return { success: true, message: 'Photo uploaded successfully.', data: updated };
};

const deleteResident = async (residentId) => {
  const resident = await residentRepository.findById(residentId);
  if (!resident) {
    return { success: false, message: 'Resident not found.' };
  }

  await residentRepository.remove(residentId);
  return { success: true, message: 'Resident deleted successfully.', data: null };
};

module.exports = { generateResidentCode, getAllResidents, getResidentById, createResident, updateResident, archiveResident, restoreResident, uploadPhoto, deleteResident };
