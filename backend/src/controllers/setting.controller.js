const settingService = require('../services/setting.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getAll = async (req, res) => {
  try {
    const result = await settingService.getAll();
    return successResponse(res, result.message, result.data);
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const getByCategory = async (req, res) => {
  try {
    const result = await settingService.getByCategory(req.params.category);
    return successResponse(res, result.message, result.data);
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const getByKey = async (req, res) => {
  try {
    const result = await settingService.getByKey(req.params.key);
    if (!result.success) return errorResponse(res, 404, result.message);
    return successResponse(res, result.message, result.data);
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const update = async (req, res) => {
  try {
    const { value } = req.body;
    if (value === undefined) return errorResponse(res, 400, 'Value is required.');
    const result = await settingService.updateSetting(req.params.key, String(value), req.user.userId);
    if (!result.success) return errorResponse(res, 400, result.message);
    return successResponse(res, result.message);
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

module.exports = { getAll, getByCategory, getByKey, update };
