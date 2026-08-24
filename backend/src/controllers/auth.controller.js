const authService = require('../services/auth.service');
const auditRepository = require('../repositories/audit.repository');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const login = async (req, res) => {
  try {
    const identifier = req.body.email || req.body.username;
    const { password } = req.body;
    if (!identifier || !password) {
      return errorResponse(res, 400, 'Email and password are required.');
    }

    const result = await authService.login(identifier, password);
    if (!result.success) {
      return errorResponse(res, 401, result.message);
    }

    if (result.data?.user) {
      auditRepository.log({
        userId: result.data.user.userId || result.data.user.user_id,
        action: `User logged in: ${identifier}`,
        module: 'Authentication',
        ipAddress: req.ip
      });
    }

    return successResponse(res, result.message, result.data);
  } catch (err) {
    console.error('login controller error:', err);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const verifyLoginOtp = async (req, res) => {
  try {
    const { email, code, tempToken } = req.body;
    if (!email || !code || !tempToken) {
      return errorResponse(res, 400, 'Email, verification code, and security session token are required.');
    }

    const result = await authService.verifyLoginOtp(email, code, tempToken);
    if (!result.success) {
      return errorResponse(res, 400, result.message);
    }

    if (result.data?.user) {
      auditRepository.log({
        userId: result.data.user.userId || result.data.user.user_id,
        action: `User authenticated via OTP: ${email}`,
        module: 'Authentication',
        ipAddress: req.ip
      });
    }

    return successResponse(res, result.message, result.data);
  } catch (err) {
    console.error('verifyLoginOtp controller error:', err);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const resendLoginOtp = async (req, res) => {
  try {
    const { email, tempToken } = req.body;
    if (!email || !tempToken) {
      return errorResponse(res, 400, 'Email and security session token are required.');
    }

    const result = await authService.resendLoginOtp(email, tempToken);
    if (!result.success) {
      return errorResponse(res, 400, result.message);
    }

    return successResponse(res, result.message, result.data);
  } catch (err) {
    console.error('resendLoginOtp controller error:', err);
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

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return errorResponse(res, 400, 'Email address is required.');
    }
    const result = await authService.forgotPassword(email);
    return successResponse(res, result.message);
  } catch (err) {
    console.error('forgotPassword controller error:', err);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return errorResponse(res, 400, 'Email and verification code are required.');
    }
    const result = await authService.verifyResetCode(email, code);
    if (!result.success) {
      return errorResponse(res, 400, result.message);
    }
    return successResponse(res, result.message, result.data);
  } catch (err) {
    console.error('verifyResetCode controller error:', err);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    if (!email || !resetToken || !newPassword) {
      return errorResponse(res, 400, 'Email, reset token, and new password are required.');
    }
    const result = await authService.resetPassword(email, resetToken, newPassword);
    if (!result.success) {
      return errorResponse(res, 400, result.message);
    }
    return successResponse(res, result.message);
  } catch (err) {
    console.error('resetPassword controller error:', err);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

module.exports = { login, verifyLoginOtp, resendLoginOtp, getMe, forgotPassword, verifyResetCode, resetPassword };
