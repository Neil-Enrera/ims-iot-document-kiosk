const requestRepository = require('../repositories/request.repository');
const residentRepository = require('../repositories/resident.repository');
const serviceRepository = require('../repositories/service.repository');
const settingRepository = require('../repositories/setting.repository');
const documentService = require('./document.service');

// Workflow: Submitted -> Waiting for Requirements -> Requirements Received
//           -> Under Review -> Document Processing -> Ready for Release -> Released
const VALID_TRANSITIONS = {
  1: [2, 8, 9],   // Submitted -> Waiting for Requirements, Rejected, Cancelled
  2: [3, 8, 9],   // Waiting for Requirements -> Requirements Received, Rejected, Cancelled
  3: [4, 8, 9],   // Requirements Received -> Under Review, Rejected, Cancelled
  4: [5, 6, 8, 9],// Under Review -> Document Processing, Ready for Release, Rejected, Cancelled
  5: [6, 8, 9],   // Document Processing -> Ready for Release, Rejected, Cancelled
  6: [7],          // Ready for Release -> Released
  7: [],           // Released -> (end)
  8: [],           // Rejected -> (end)
  9: []            // Cancelled -> (end)
};

const STATUS_IDS = {
  SUBMITTED: 1,
  WAITING_FOR_REQUIREMENTS: 2,
  REQUIREMENTS_RECEIVED: 3,
  UNDER_REVIEW: 4,
  DOCUMENT_PROCESSING: 5,
  READY_FOR_RELEASE: 6,
  RELEASED: 7,
  REJECTED: 8,
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
    statusId: STATUS_IDS.SUBMITTED,
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

  // When a document is finished (Ready for Release), open a claim window.
  // If the resident does not claim within the configured days, the done
  // document is considered expired. Releasing closes the window.
  let expiresAt = null;
  if (statusId === STATUS_IDS.READY_FOR_RELEASE) {
    const claimDays = await getClaimWindowDays();
    if (claimDays > 0) {
      expiresAt = new Date(Date.now() + claimDays * 24 * 60 * 60 * 1000);
    }
  }

  await requestRepository.updateStatus(requestId, statusId, userId, remarks, expiresAt);
  const updated = await requestRepository.findById(requestId);

  // Automatically generate the official document when the request reaches
  // Document Processing. Generation failures do not block the status change.
  if (statusId === STATUS_IDS.DOCUMENT_PROCESSING) {
    try {
      await documentService.generateDocument({ requestId, userId });
    } catch (error) {
      console.error(`Auto document generation failed for request ${requestId}:`, error.message);
    }
  }

  return { success: true, message: 'Request status updated successfully.', data: updated };
};

const approveRequest = async (requestId, userId, remarks) => {
  return changeStatus(requestId, STATUS_IDS.UNDER_REVIEW, userId, remarks || 'Approved');
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

const getClaimWindowDays = async () => {
  const setting = await settingRepository.findByKey('document_claim_days');
  const days = parseInt(setting?.setting_value, 10);
  return Number.isInteger(days) && days > 0 ? days : 0;
};

const getStats = async () => {
  const stats = await requestRepository.getStats();
  return { success: true, message: 'Statistics retrieved successfully.', data: stats };
};

module.exports = { getAllRequests, getRequestById, createRequest, updateRequest, changeStatus, approveRequest, rejectRequest, cancelRequest, releaseRequest, getClaimWindowDays, getStats };
