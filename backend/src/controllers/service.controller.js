const serviceService = require('../services/service.service');
const { successResponse, errorResponse, createdResponse, paginatedResponse } = require('../utils/apiResponse');

const getAll = async (req, res) => {
  try {
    const { search, isActive, page, limit, sortBy, sortOrder } = req.query;
    const result = await serviceService.getAllServices({
      search,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sortBy,
      sortOrder
    });
    if (!result.success) return errorResponse(res, 400, result.message);
    return paginatedResponse(res, result.message, result.data.services, result.data.total, result.data.page, result.data.limit);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const getById = async (req, res) => {
  try {
    const result = await serviceService.getServiceById(req.params.id);
    if (!result.success) return errorResponse(res, 404, result.message);
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const create = async (req, res) => {
  try {
    const result = await serviceService.createService(req.body);
    if (!result.success) return errorResponse(res, 400, result.message);
    return createdResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const update = async (req, res) => {
  try {
    const result = await serviceService.updateService(req.params.id, req.body);
    if (!result.success) return errorResponse(res, 400, result.message);
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const changeStatus = async (req, res) => {
  try {
    const result = await serviceService.changeStatus(req.params.id, req.body.isActive);
    if (!result.success) return errorResponse(res, 404, result.message);
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const uploadTemplate = async (req, res) => {
  try {
    const result = await serviceService.uploadTemplate(req.params.id, req.file);
    if (!result.success) return errorResponse(res, 400, result.message);
    return successResponse(res, result.message, result.data);
  } catch (error) {
    console.error('Service template upload error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const removeTemplate = async (req, res) => {
  try {
    const result = await serviceService.removeTemplate(req.params.id);
    if (!result.success) return errorResponse(res, 404, result.message);
    return successResponse(res, result.message, result.data);
  } catch (error) {
    console.error('Service template remove error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const remove = async (req, res) => {
  try {
    const result = await serviceService.deleteService(req.params.id);
    if (!result.success) return errorResponse(res, 404, result.message);
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

module.exports = { getAll, getById, create, update, changeStatus, uploadTemplate, removeTemplate, remove };
