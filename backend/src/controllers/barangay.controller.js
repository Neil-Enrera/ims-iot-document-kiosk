const barangayService = require('../services/barangay.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getProfile = async (req, res) => {
  try {
    const result = await barangayService.getProfile(req.params.id);
    if (!result.success) return errorResponse(res, 404, result.message);
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const uploadIdTemplate = async (req, res) => {
  try {
    const result = await barangayService.uploadIdTemplate(req.params.id, req.file);
    if (!result.success) return errorResponse(res, 400, result.message);
    return successResponse(res, result.message, result.data);
  } catch (error) {
    console.error('Barangay ID template upload error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const removeIdTemplate = async (req, res) => {
  try {
    const result = await barangayService.removeIdTemplate(req.params.id);
    if (!result.success) return errorResponse(res, 404, result.message);
    return successResponse(res, result.message, result.data);
  } catch (error) {
    console.error('Barangay ID template remove error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

module.exports = { getProfile, uploadIdTemplate, removeIdTemplate };