const reportService = require('../services/report.service');
const { errorResponse, paginatedResponse } = require('../utils/apiResponse');

const requestsReport = async (req, res) => {
  try {
    const { dateFrom, dateTo, serviceId, statusId, residentId, page, limit } = req.query;
    const result = await reportService.getRequestsReport({
      dateFrom, dateTo,
      serviceId: serviceId ? parseInt(serviceId) : undefined,
      statusId: statusId ? parseInt(statusId) : undefined,
      residentId: residentId ? parseInt(residentId) : undefined,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20
    });
    if (!result.success) return errorResponse(res, 400, result.message);
    return paginatedResponse(res, result.message, result.data.reports, result.data.total, result.data.page, result.data.limit);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const residentsReport = async (req, res) => {
  try {
    const { dateFrom, dateTo, status, page, limit } = req.query;
    const result = await reportService.getResidentsReport({
      dateFrom, dateTo, status,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20
    });
    if (!result.success) return errorResponse(res, 400, result.message);
    return paginatedResponse(res, result.message, result.data.reports, result.data.total, result.data.page, result.data.limit);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

module.exports = { requestsReport, residentsReport };
