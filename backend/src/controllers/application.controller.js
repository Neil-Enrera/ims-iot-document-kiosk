const applicationService = require('../services/application.service');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

const getAll = async (req, res) => {
  try {
    const { search, status, page, limit, sortBy, sortOrder } = req.query;
    const result = await applicationService.getAllApplications({
      search,
      status,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sortBy,
      sortOrder
    });
    if (!result.success) return errorResponse(res, 400, result.message);
    return paginatedResponse(res, result.message, result.data.applications, result.data.total, result.data.page, result.data.limit);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const getById = async (req, res) => {
  try {
    const result = await applicationService.getApplicationById(req.params.id);
    if (!result.success) return errorResponse(res, 404, result.message);
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

// Render a draft Barangay ID card for review. Uses the same render pipeline as
// the approved card but never persists, never assigns an ID number, and never
// creates a resident — the applicant only becomes a registered ID holder when
// the application is approved.
const preview = async (req, res) => {
  try {
    const result = await applicationService.previewApplication(req.params.id);
    if (!result.success) return errorResponse(res, 400, result.message);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'inline; filename="barangay-id-preview.docx"',
      'Cache-Control': 'no-store'
    });
    return res.send(result.data);
  } catch (error) {
    console.error('Application preview error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const approve = async (req, res) => {
  try {
    const result = await applicationService.approveApplication(req.params.id, req.user.userId, req.body.remarks);
    if (!result.success) return errorResponse(res, 400, result.message);
    return successResponse(res, result.message, result.data);
  } catch (error) {
    console.error('Application approve error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const reject = async (req, res) => {
  try {
    const result = await applicationService.rejectApplication(req.params.id, req.user.userId, req.body.remarks);
    if (!result.success) return errorResponse(res, 400, result.message);
    return successResponse(res, result.message, result.data);
  } catch (error) {
    console.error('Application reject error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

module.exports = { getAll, getById, preview, approve, reject };
