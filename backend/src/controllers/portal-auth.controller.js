const portalAuthService = require('../services/portal-auth.service');
const auditRepository = require('../repositories/audit.repository');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const login = async (req, res) => {
  try {
    const identifier = req.body.email || req.body.identifier || req.body.accountId || req.body.account_id;
    const { password } = req.body;
    if (!identifier || !password) {
      return errorResponse(res, 400, 'Email address or Account ID and password are required.');
    }

    const result = await portalAuthService.login(identifier, password);
    if (!result.success) {
      auditRepository.log({
        userId: null,
        action: `Failed portal login for: ${identifier} (${result.message})`,
        module: 'PortalAuth',
        ipAddress: req.ip
      });
      return errorResponse(res, 401, result.message);
    }

    auditRepository.log({
      userId: null,
      action: `Portal resident logged in: ${result.data.account.account_id} (${result.data.account.email})`,
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

const updateProfile = async (req, res) => {
  try {
    const result = await portalAuthService.updateProfile(req.portalUser.portalAccountId, req.body);
    if (!result.success) {
      return errorResponse(res, 400, result.message);
    }
    auditRepository.log({
      userId: null,
      action: `Portal resident updated profile: ${req.portalUser.accountId}`,
      module: 'PortalAuth',
      ipAddress: req.ip
    });
    return successResponse(res, result.message, result.data);
  } catch (err) {
    console.error('portal updateProfile controller error:', err);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const emailService = require('../services/email.service');

const contactUs = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, subject, message } = req.body;
    if (!fullName || !fullName.trim()) {
      return errorResponse(res, 400, 'Full name is required.');
    }
    if (!email || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return errorResponse(res, 400, 'A valid email address is required.');
    }
    if (!subject || !subject.trim()) {
      return errorResponse(res, 400, 'Subject is required.');
    }
    if (!message || !message.trim()) {
      return errorResponse(res, 400, 'Message content is required.');
    }

    await emailService.sendContactUsMessage({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: phoneNumber ? phoneNumber.trim() : null,
      subject: subject.trim(),
      message: message.trim()
    });

    auditRepository.log({
      userId: null,
      action: `Contact inquiry received from: ${fullName.trim()} (${email.trim()})`,
      module: 'PortalContact',
      ipAddress: req.ip
    });

    return successResponse(res, 'Thank you! Your message has been sent successfully. We will get back to you as soon as possible.');
  } catch (err) {
    console.error('portal contactUs controller error:', err);
    return errorResponse(res, 500, 'Failed to send message. Please try again later.');
  }
};

const getBarangayContactInfo = async (req, res) => {
  try {
    const info = {
      barangayName: 'Barangay San Manuel',
      officeAddress: 'Barangay San Manuel Hall, San Manuel, City of San Jose del Monte, 3023 Bulacan',
      addressLine1: 'Barangay San Manuel Hall',
      addressLine2: 'San Manuel, City of San Jose del Monte, 3023 Bulacan',
      contactNumber: '(044) 307-8899 / 0917-123-4567',
      contactHours: '(Mon–Fri, 8:00 AM – 5:00 PM)',
      email: 'barangaysanmanuel.csjdm@gmail.com',
      emailResponseTime: "(We'll respond as soon as possible)",
      officeHoursDays: 'Monday – Friday',
      officeHoursTime: '8:00 AM – 5:00 PM',
      mapsUrl: 'https://maps.app.goo.gl/ShncDzyj6p411n5g6'
    };
    return successResponse(res, 'Barangay contact information retrieved successfully.', info);
  } catch (err) {
    console.error('getBarangayContactInfo error:', err);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

module.exports = { login, getMe, changePassword, forgotPassword, verifyResetCode, resetPassword, updateProfile, contactUs, getBarangayContactInfo };


