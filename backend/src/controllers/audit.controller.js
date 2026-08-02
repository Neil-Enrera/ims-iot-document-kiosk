const auditService = require('../services/audit.service');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

const getAll = async (req, res) => {
  try {
    const { search, module, userId, dateFrom, dateTo, page, limit } = req.query;
    const result = await auditService.getAuditLogs({
      search, module,
      userId: userId ? parseInt(userId) : undefined,
      dateFrom, dateTo,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20
    });
    if (!result.success) return errorResponse(res, 400, result.message);
    return paginatedResponse(res, result.message, result.data.logs, result.data.total, result.data.page, result.data.limit);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const getById = async (req, res) => {
  try {
    const result = await auditService.getAuditLogById(req.params.id);
    if (!result.success) return errorResponse(res, 404, result.message);
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

module.exports = { getAll, getById };
