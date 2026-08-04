const requestService = require('../services/request.service');
const auditRepository = require('../repositories/audit.repository');
const { successResponse, errorResponse, createdResponse, paginatedResponse } = require('../utils/apiResponse');
const sseManager = require('../services/notification-sse');

const getAll = async (req, res) => {
  try {
    const { search, statusId, residentId, serviceId, dateFrom, dateTo, page, limit, sortBy, sortOrder } = req.query;
    const result = await requestService.getAllRequests({
      search,
      statusId: statusId ? parseInt(statusId) : undefined,
      residentId: residentId ? parseInt(residentId) : undefined,
      serviceId: serviceId ? parseInt(serviceId) : undefined,
      dateFrom,
      dateTo,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sortBy,
      sortOrder
    });
    if (!result.success) return errorResponse(res, 400, result.message);
    return paginatedResponse(res, result.message, result.data.requests, result.data.total, result.data.page, result.data.limit);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const getById = async (req, res) => {
  try {
    const result = await requestService.getRequestById(req.params.id);
    if (!result.success) return errorResponse(res, 404, result.message);
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const create = async (req, res) => {
  try {
    const result = await requestService.createRequest(req.body);
    if (!result.success) return errorResponse(res, 400, result.message);
    if (req.user) {
      auditRepository.log({ userId: req.user.userId, action: 'Created request', module: 'Requests', ipAddress: req.ip });
    }
    return createdResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const update = async (req, res) => {
  try {
    const result = await requestService.updateRequest(req.params.id, req.body);
    if (!result.success) return errorResponse(res, 400, result.message);
    sseManager.broadcastEvent('request-updated', { requestId: parseInt(req.params.id), data: result.data });
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const approve = async (req, res) => {
  try {
    const result = await requestService.approveRequest(req.params.id, req.user.userId, req.body.remarks);
    if (!result.success) return errorResponse(res, 400, result.message);
    auditRepository.log({ userId: req.user.userId, action: `Approved request #${req.params.id}`, module: 'Requests', ipAddress: req.ip });
    sseManager.broadcastEvent('request-approved', { requestId: parseInt(req.params.id), data: result.data });
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const reject = async (req, res) => {
  try {
    const result = await requestService.rejectRequest(req.params.id, req.user.userId, req.body.remarks);
    if (!result.success) return errorResponse(res, 400, result.message);
    auditRepository.log({ userId: req.user.userId, action: `Rejected request #${req.params.id}`, module: 'Requests', ipAddress: req.ip });
    sseManager.broadcastEvent('request-rejected', { requestId: parseInt(req.params.id), data: result.data });
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const cancel = async (req, res) => {
  try {
    const result = await requestService.cancelRequest(req.params.id, req.user.userId, req.body.remarks);
    if (!result.success) return errorResponse(res, 400, result.message);
    auditRepository.log({ userId: req.user.userId, action: `Cancelled request #${req.params.id}`, module: 'Requests', ipAddress: req.ip });
    sseManager.broadcastEvent('request-cancelled', { requestId: parseInt(req.params.id), data: result.data });
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const changeStatus = async (req, res) => {
  try {
    const result = await requestService.changeStatus(req.params.id, parseInt(req.body.statusId, 10), req.user.userId, req.body.remarks);
    if (!result.success) return errorResponse(res, 400, result.message);
    auditRepository.log({ userId: req.user.userId, action: `Changed status of request #${req.params.id} to ${result.data.status_name}`, module: 'Requests', ipAddress: req.ip });
    sseManager.broadcastEvent('request-status-changed', { requestId: parseInt(req.params.id), data: result.data });
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const release = async (req, res) => {
  try {
    const result = await requestService.releaseRequest(req.params.id, req.user.userId, req.body.remarks);
    if (!result.success) return errorResponse(res, 400, result.message);
    auditRepository.log({ userId: req.user.userId, action: `Released request #${req.params.id}`, module: 'Requests', ipAddress: req.ip });
    sseManager.broadcastEvent('request-released', { requestId: parseInt(req.params.id), data: result.data });
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const stats = async (req, res) => {
  try {
    const result = await requestService.getStats();
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

module.exports = { getAll, getById, create, update, approve, reject, cancel, changeStatus, release, stats };
