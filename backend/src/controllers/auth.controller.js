const authService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return errorResponse(res, 400, 'Username and password are required.');
    }

    const result = await authService.login(username, password);
    if (!result.success) {
      return errorResponse(res, 401, result.message);
    }

    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const getMe = async (req, res) => {
  try {
    const result = await authService.getMe(req.user.userId);
    if (!result.success) {
      return errorResponse(res, 404, result.message);
    }
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

module.exports = { login, getMe };
