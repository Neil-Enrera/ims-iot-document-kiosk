const residentUpdateService = require('../services/resident-update.service');
const { successResponse, createdResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

const submitRequest = async (req, res) => {
  try {
    const { resident_id, requested_changes, reason } = req.body;
    if (!resident_id) {
      return errorResponse(res, 400, 'Resident ID is required.');
    }
    if (!requested_changes || Object.keys(requested_changes).length === 0) {
      return errorResponse(res, 400, 'At least one field change must be specified.');
    }
    if (!reason || !reason.trim()) {
      return errorResponse(res, 400, 'Reason for change is required.');
    }

    const result = await residentUpdateService.submitRequest({
      residentId: resident_id,
      requestedChanges: requested_changes,
      reason,
      ipAddress: req.ip || req.connection.remoteAddress
    });

    if (!result.success) {
      return errorResponse(res, 400, result.message);
    }
    return createdResponse(res, result.message, result.data);
  } catch (error) {
    console.error('submitRequest error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const getAllRequests = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const p = parseInt(page, 10) || 1;
    const l = parseInt(limit, 10) || 20;
    const result = await residentUpdateService.getAllRequests({
      status,
      search,
      page: p,
      limit: l
    });
    return paginatedResponse(res, 'Resident update requests retrieved.', result.data, result.total, p, l);
  } catch (error) {
    console.error('getAllRequests error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const getRequestById = async (req, res) => {
  try {
    const result = await residentUpdateService.getRequestById(req.params.id);
    if (!result.success) {
      return errorResponse(res, 404, result.message);
    }
    return successResponse(res, 'Update request details retrieved.', result.data);
  } catch (error) {
    console.error('getRequestById error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const approveRequest = async (req, res) => {
  try {
    const { review_notes } = req.body;
    const userId = req.user?.userId || req.user?.user_id || null;
    const result = await residentUpdateService.approveRequest(
      req.params.id,
      userId,
      review_notes,
      req.ip || req.connection.remoteAddress
    );

    if (!result.success) {
      return errorResponse(res, 400, result.message);
    }
    return successResponse(res, result.message, result.data);
  } catch (error) {
    console.error('approveRequest error:', error);
    return errorResponse(res, 500, error.message || 'Internal server error.');
  }
};

const rejectRequest = async (req, res) => {
  try {
    const { review_notes } = req.body;
    const userId = req.user?.userId || req.user?.user_id || null;
    const result = await residentUpdateService.rejectRequest(
      req.params.id,
      userId,
      review_notes,
      req.ip || req.connection.remoteAddress
    );

    if (!result.success) {
      return errorResponse(res, 400, result.message);
    }
    return successResponse(res, result.message, result.data);
  } catch (error) {
    console.error('rejectRequest error:', error);
    return errorResponse(res, 500, error.message || 'Internal server error.');
  }
};

module.exports = {
  submitRequest,
  getAllRequests,
  getRequestById,
  approveRequest,
  rejectRequest
};
