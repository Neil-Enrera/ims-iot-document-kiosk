const portalAuthService = require('../services/portal-auth.service');
const auditRepository = require('../repositories/audit.repository');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const login = async (req, res) => {
  try {
    const accountId = req.body.accountId || req.body.account_id;
    const { password } = req.body;
    if (!accountId || !password) {
      return errorResponse(res, 400, 'Account ID and password are required.');
    }

    const result = await portalAuthService.login(accountId, password);
    if (!result.success) {
      auditRepository.log({
        userId: null,
        action: `Failed portal login for Account ID: ${accountId} (${result.message})`,
        module: 'PortalAuth',
        ipAddress: req.ip
      });
      return errorResponse(res, 401, result.message);
    }

    auditRepository.log({
      userId: null,
      action: `Portal resident logged in: ${result.data.account.account_id}`,
      module: 'PortalAuth',
      ipAddress: req.ip
    });

    return successResponse(res, result.message, result.data);
  } catch (err) {
    console.error('portal login controller error:', err);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const getMe = async (req, res) => {
  try {
    const result = await portalAuthService.getMe(req.portalUser.portalAccountId);
    if (!result.success) {
      return errorResponse(res, 404, result.message);
    }
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) {
      return errorResponse(res, 400, 'New password is required.');
    }

    const result = await portalAuthService.changePassword(req.portalUser.portalAccountId, newPassword);
    if (!result.success) {
      return errorResponse(res, 400, result.message);
    }

    auditRepository.log({
      userId: null,
      action: `Portal password changed for Account ID: ${req.portalUser.accountId}`,
      module: 'PortalAuth',
      ipAddress: req.ip
    });

    return successResponse(res, result.message, result.data);
  } catch (err) {
    console.error('portal changePassword controller error:', err);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const forgotPassword = async (req, res) => {
  try {
    const identifier = req.body.accountId || req.body.account_id || req.body.email;
    if (!identifier) {
      return errorResponse(res, 400, 'Account ID or email is required.');
    }
    const result = await portalAuthService.forgotPassword(identifier);
    return successResponse(res, result.message, result.data);
  } catch (err) {
    console.error('portal forgotPassword controller error:', err);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const verifyResetCode = async (req, res) => {
  try {
    const identifier = req.body.accountId || req.body.account_id || req.body.email;
    const { code } = req.body;
    if (!identifier || !code) {
      return errorResponse(res, 400, 'Account ID and verification code are required.');
    }
    const result = await portalAuthService.verifyResetCode(identifier, code);
    if (!result.success) {
      return errorResponse(res, 400, result.message);
    }
    return successResponse(res, result.message, result.data);
  } catch (err) {
    console.error('portal verifyResetCode controller error:', err);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const resetPassword = async (req, res) => {
  try {
    const identifier = req.body.accountId || req.body.account_id || req.body.email;
    const { resetToken, newPassword } = req.body;
    if (!identifier || !resetToken || !newPassword) {
      return errorResponse(res, 400, 'Account ID, reset token, and new password are required.');
    }
    const result = await portalAuthService.resetPassword(identifier, resetToken, newPassword);
    if (!result.success) {
      return errorResponse(res, 400, result.message);
    }
    auditRepository.log({
      userId: null,
      action: `Portal password reset completed for: ${identifier}`,
      module: 'PortalAuth',
      ipAddress: req.ip
    });
    return successResponse(res, result.message);
  } catch (err) {
    console.error('portal resetPassword controller error:', err);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

module.exports = { login, getMe, changePassword, forgotPassword, verifyResetCode, resetPassword };
