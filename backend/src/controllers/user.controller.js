const userService = require('../services/user.service');
const auditRepository = require('../repositories/audit.repository');
const { successResponse, errorResponse, createdResponse, paginatedResponse } = require('../utils/apiResponse');

const getAll = async (req, res) => {
  try {
    const { search, status, page, limit, sortBy, sortOrder } = req.query;
    const result = await userService.getAllUsers({
      search,
      status,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sortBy,
      sortOrder
    });
    if (!result.success) {
      return errorResponse(res, 400, result.message);
    }
    return paginatedResponse(res, result.message, result.data.users, result.data.total, result.data.page, result.data.limit);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const getById = async (req, res) => {
  try {
    const result = await userService.getUserById(req.params.id);
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
    const result = await userService.createUser(req.body);
    if (!result.success) {
      return errorResponse(res, 400, result.message);
    }
    auditRepository.log({
      userId: req.user?.userId,
      action: `Created user account '${req.body.username || req.body.email}'`,
      module: 'Users',
      ipAddress: req.ip
    });
    return createdResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const update = async (req, res) => {
  try {
    const result = await userService.updateUser(req.params.id, req.body);
    if (!result.success) {
      return errorResponse(res, 404, result.message);
    }
    auditRepository.log({
      userId: req.user?.userId,
      action: `Updated user account #${req.params.id}`,
      module: 'Users',
      ipAddress: req.ip
    });
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const changeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await userService.changeStatus(req.params.id, status);
    if (!result.success) {
      return errorResponse(res, 404, result.message);
    }
    auditRepository.log({
      userId: req.user?.userId,
      action: `Changed status of user #${req.params.id} to '${status}'`,
      module: 'Users',
      ipAddress: req.ip
    });
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const changePassword = async (req, res) => {
  try {
    const { password } = req.body;
    const result = await userService.changePassword(req.params.id, password);
    if (!result.success) {
      return errorResponse(res, 404, result.message);
    }
    auditRepository.log({
      userId: req.user?.userId,
      action: `Changed password for user #${req.params.id}`,
      module: 'Users',
      ipAddress: req.ip
    });
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const remove = async (req, res) => {
  try {
    const result = await userService.deleteUser(req.params.id);
    if (!result.success) {
      return errorResponse(res, 404, result.message);
    }
    auditRepository.log({
      userId: req.user?.userId,
      action: `Deleted user account #${req.params.id}`,
      module: 'Users',
      ipAddress: req.ip
    });
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

module.exports = { getAll, getById, create, update, changeStatus, changePassword, remove };
