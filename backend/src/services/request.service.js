const requestRepository = require('../repositories/request.repository');
const residentRepository = require('../repositories/resident.repository');
const serviceRepository = require('../repositories/service.repository');

const VALID_TRANSITIONS = {
  1: [2, 3, 9],   // Pending -> Approved, Rejected, Cancelled
  2: [6, 4, 9],   // Approved -> Processing, Ready for Release, Cancelled
  3: [],           // Rejected -> (end)
  6: [4],          // Processing -> Ready for Release
  4: [5],          // Ready for Release -> Released
  5: [],           // Released -> (end)
  9: []            // Cancelled -> (end)
};

const STATUS_IDS = {
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3,
  READY_FOR_RELEASE: 4,
  RELEASED: 5,
  PROCESSING: 6,
  CANCELLED: 9
};

const getAllRequests = async ({ search, statusId, residentId, serviceId, dateFrom, dateTo, page = 1, limit = 20, sortBy = 'request_id', sortOrder = 'DESC' }) => {
  const result = await requestRepository.findAll({ search, statusId, residentId, serviceId, dateFrom, dateTo, page, limit, sortBy, sortOrder });
  return { success: true, message: 'Requests retrieved successfully.', data: result };
};

const getRequestById = async (requestId) => {
  const request = await requestRepository.findById(requestId);
  if (!request) {
    return { success: false, message: 'Request not found.' };
  }
  const history = await requestRepository.findHistory(requestId);
  return { success: true, message: 'Request retrieved successfully.', data: { ...request, history } };
};

const createRequest = async ({ residentId, serviceId, purpose, remarks }) => {
  const resident = await residentRepository.findById(residentId);
  if (!resident) {
    return { success: false, message: 'Resident not found.' };
  }

  const service = await serviceRepository.findById(serviceId);
  if (!service) {
    return { success: false, message: 'Service not found.' };
  }

  if (!service.is_active) {
    return { success: false, message: 'Service is not available.' };
  }

  const { insertId } = await requestRepository.create({
    residentId,
    serviceId,
    statusId: STATUS_IDS.PENDING,
    purpose,
    remarks,
    requestDate: new Date().toISOString().slice(0, 19).replace('T', ' ')
  });

  const request = await requestRepository.findById(insertId);
  return { success: true, message: 'Request created successfully.', data: request };
};

const updateRequest = async (requestId, { serviceId, purpose, remarks }) => {
  const request = await requestRepository.findById(requestId);
  if (!request) {
    return { success: false, message: 'Request not found.' };
  }

  if (request.status_id === STATUS_IDS.RELEASED || request.status_id === STATUS_IDS.CANCELLED) {
    return { success: false, message: 'Cannot modify a released or cancelled request.' };
  }

  await requestRepository.update(requestId, { serviceId, purpose, remarks });
  const updated = await requestRepository.findById(requestId);

  return { success: true, message: 'Request updated successfully.', data: updated };
};

const changeStatus = async (requestId, statusId, userId, remarks) => {
  const request = await requestRepository.findById(requestId);
  if (!request) {
    return { success: false, message: 'Request not found.' };
  }

  const allowed = VALID_TRANSITIONS[request.status_id] || [];
  if (!allowed.includes(statusId)) {
    return { success: false, message: 'Invalid status transition.' };
  }

  await requestRepository.updateStatus(requestId, statusId, userId, remarks);
  const updated = await requestRepository.findById(requestId);

  return { success: true, message: 'Request status updated successfully.', data: updated };
};

const approveRequest = async (requestId, userId, remarks) => {
  return changeStatus(requestId, STATUS_IDS.APPROVED, userId, remarks || 'Approved');
};

const rejectRequest = async (requestId, userId, remarks) => {
  return changeStatus(requestId, STATUS_IDS.REJECTED, userId, remarks || 'Rejected');
};

const cancelRequest = async (requestId, userId, remarks) => {
  return changeStatus(requestId, STATUS_IDS.CANCELLED, userId, remarks || 'Cancelled');
};

const releaseRequest = async (requestId, userId, remarks) => {
  return changeStatus(requestId, STATUS_IDS.RELEASED, userId, remarks || 'Released');
};

const getStats = async () => {
  const stats = await requestRepository.getStats();
  return { success: true, message: 'Statistics retrieved successfully.', data: stats };
};

module.exports = { getAllRequests, getRequestById, createRequest, updateRequest, changeStatus, approveRequest, rejectRequest, cancelRequest, releaseRequest, getStats };
