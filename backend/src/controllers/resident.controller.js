const residentService = require('../services/resident.service');
const auditRepository = require('../repositories/audit.repository');
const { successResponse, errorResponse, createdResponse, paginatedResponse } = require('../utils/apiResponse');

const getAll = async (req, res) => {
  try {
    const { search, status, barangayId, page, limit, sortBy, sortOrder } = req.query;
    const result = await residentService.getAllResidents({
      search,
      status,
      barangayId: barangayId ? parseInt(barangayId) : undefined,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sortBy,
      sortOrder
    });
    if (!result.success) {
      return errorResponse(res, 400, result.message);
    }
    return paginatedResponse(res, result.message, result.data.residents, result.data.total, result.data.page, result.data.limit);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const getById = async (req, res) => {
  try {
    const result = await residentService.getResidentById(req.params.id);
    if (!result.success) {
      return errorResponse(res, 404, result.message);
    }
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const create = async (req, res) => {
  try {
    const result = await residentService.createResident(req.body);
    if (!result.success) {
      return errorResponse(res, 400, result.message);
    }
    if (req.user) {
      auditRepository.log({ userId: req.user.userId, action: 'Created resident', module: 'Residents', ipAddress: req.ip });
    }
    return createdResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const update = async (req, res) => {
  try {
    const result = await residentService.updateResident(req.params.id, req.body);
    if (!result.success) {
      return errorResponse(res, 404, result.message);
    }
    if (req.user) {
      auditRepository.log({ userId: req.user.userId, action: `Updated resident #${req.params.id}`, module: 'Residents', ipAddress: req.ip });
    }
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const archive = async (req, res) => {
  try {
    const result = await residentService.archiveResident(req.params.id);
    if (!result.success) {
      return errorResponse(res, 404, result.message);
    }
    if (req.user) {
      auditRepository.log({ userId: req.user.userId, action: `Archived resident #${req.params.id}`, module: 'Residents', ipAddress: req.ip });
    }
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const restore = async (req, res) => {
  try {
    const result = await residentService.restoreResident(req.params.id);
    if (!result.success) {
      return errorResponse(res, 404, result.message);
    }
    if (req.user) {
      auditRepository.log({ userId: req.user.userId, action: `Restored resident #${req.params.id}`, module: 'Residents', ipAddress: req.ip });
    }
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const remove = async (req, res) => {
  try {
    const result = await residentService.deleteResident(req.params.id);
    if (!result.success) {
      return errorResponse(res, 404, result.message);
    }
    if (req.user) {
      auditRepository.log({ userId: req.user.userId, action: `Deleted resident #${req.params.id}`, module: 'Residents', ipAddress: req.ip });
    }
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

module.exports = { getAll, getById, create, update, archive, restore, remove };
