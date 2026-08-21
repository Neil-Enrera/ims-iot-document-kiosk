const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authRepository = require('../repositories/auth.repository');
const passwordResetRepository = require('../repositories/password-reset.repository');
const emailService = require('./email.service');
const config = require('../config/environment');

const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  const [user, domain] = email.split('@');
  if (user.length <= 2) {
    return `${user.charAt(0)}*@${domain}`;
  }
  const start = user.slice(0, 2);
  const end = user.slice(-1);
  return `${start}***${end}@${domain}`;
};

const login = async (identifier, password) => {
  if (!identifier || !password) {
    return { success: false, message: 'Invalid email or password.' };
  }

  const cleanIdentifier = identifier.trim();
  // Support searching by email first, fallback to username
  let user = await authRepository.findByEmail(cleanIdentifier);
  if (!user) {
    user = await authRepository.findByUsername(cleanIdentifier);
  }

  if (!user) {
    return { success: false, message: 'Invalid email or password.' };
  }

  if (user.status !== 'ACTIVE') {
    return { success: false, message: 'Account is inactive. Please contact the administrator.' };
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    return { success: false, message: 'Invalid email or password.' };
  }

  if (!user.email) {
    return { success: false, message: 'No registered email address found for this account. Please contact the system administrator.' };
  }

  // Generate secure 6-digit numeric OTP and temp verification token
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const tempToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await authRepository.createLoginCode({
    userId: user.user_id,
    email: user.email.toLowerCase(),
    code,
    tempToken,
    expiresAt
  });

  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
  await emailService.sendLoginVerificationCode({
    email: user.email,
    name: fullName,
    code,
    expiresMinutes: 10
  });

  return {
    success: true,
    requireOtp: true,
    message: 'Verification code sent to your registered email address.',
    data: {
      email: user.email,
      maskedEmail: maskEmail(user.email),
      tempToken,
      expiresMinutes: 10
    }
  };
};

const verifyLoginOtp = async (email, code, tempToken) => {
  if (!email || !code || !tempToken) {
    return { success: false, message: 'Email, verification code, and security token are required.' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = code.toString().trim();
  const normalizedToken = tempToken.trim();

  const loginRecord = await authRepository.findValidLoginCode({
    email: normalizedEmail,
    code: normalizedCode,
    tempToken: normalizedToken
  });

  if (!loginRecord) {
    return { success: false, message: 'Invalid or expired verification code. Please check your email or request a new code.' };
  }

  if (loginRecord.user_status !== 'ACTIVE') {
    return { success: false, message: 'This user account is currently inactive.' };
  }

  // Mark code as used
  await authRepository.markLoginCodeUsed(loginRecord.code_id);
  await authRepository.updateLastLogin(loginRecord.user_id);

  const token = jwt.sign(
    { userId: loginRecord.user_id, username: loginRecord.username, role: loginRecord.role_name },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  const userData = {
    user_id: loginRecord.user_id,
    username: loginRecord.username,
    first_name: loginRecord.first_name,
    middle_name: loginRecord.middle_name,
    last_name: loginRecord.last_name,
    email: loginRecord.user_email,
    contact_number: loginRecord.contact_number,
    status: loginRecord.user_status,
    role_name: loginRecord.role_name
  };

  return {
    success: true,
    message: 'Login successful.',
    data: { accessToken: token, user: userData }
  };
};

const resendLoginOtp = async (email, tempToken) => {
  if (!email || !tempToken) {
    return { success: false, message: 'Email and security session token are required.' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedToken = tempToken.trim();

  const loginRecord = await authRepository.findLatestLoginCode({
    email: normalizedEmail,
    tempToken: normalizedToken
  });

  if (!loginRecord) {
    return { success: false, message: 'Login session expired. Please sign in again with your email and password.' };
  }

  if (loginRecord.user_status !== 'ACTIVE') {
    return { success: false, message: 'This user account is currently inactive.' };
  }

  // Generate new 6-digit OTP code and new tempToken
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const newTempToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await authRepository.createLoginCode({
    userId: loginRecord.user_id,
    email: normalizedEmail,
    code,
    tempToken: newTempToken,
    expiresAt
  });

  const fullName = `${loginRecord.first_name || ''} ${loginRecord.last_name || ''}`.trim() || loginRecord.username;
  await emailService.sendLoginVerificationCode({
    email: loginRecord.user_email,
    name: fullName,
    code,
    expiresMinutes: 10
  });

  return {
    success: true,
    message: 'A new verification code has been sent to your email.',
    data: {
      email: loginRecord.user_email,
      maskedEmail: maskEmail(loginRecord.user_email),
      tempToken: newTempToken,
      expiresMinutes: 10
    }
  };
};

const getMe = async (userId) => {
  const user = await authRepository.findById(userId);
  if (!user) {
    return { success: false, message: 'User not found.' };
  }
  return { success: true, message: 'User retrieved successfully.', data: user };
};

const forgotPassword = async (email) => {
  if (!email || typeof email !== 'string') {
    return { success: false, message: 'A valid email address is required.' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await authRepository.findByEmail(normalizedEmail);

  if (user && user.status === 'ACTIVE') {
    // Generate secure 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await passwordResetRepository.createResetCode({
      userId: user.user_id,
      email: normalizedEmail,
      code,
      expiresAt
    });

    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
    await emailService.sendVerificationCode({
      email: normalizedEmail,
      name: fullName,
      code,
      expiresMinutes: 10
    });
  }

  // Always return generic message to prevent account enumeration
  return {
    success: true,
    message: 'If an account with that email exists, a 6-digit verification code has been sent.'
  };
};

const verifyResetCode = async (email, code) => {
  if (!email || !code) {
    return { success: false, message: 'Email and verification code are required.' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = code.toString().trim();

  const resetRecord = await passwordResetRepository.findValidCode({
    email: normalizedEmail,
    code: normalizedCode
  });

  if (!resetRecord) {
    return { success: false, message: 'Invalid or expired verification code. Please check your email or request a new code.' };
  }

  // Generate a random one-time reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  await passwordResetRepository.setResetToken({
    resetId: resetRecord.reset_id,
    resetToken
  });

  return {
    success: true,
    message: 'Verification code confirmed. You can now set your new password.',
    data: { resetToken }
  };
};

const resetPassword = async (email, resetToken, newPassword) => {
  if (!email || !resetToken || !newPassword) {
    return { success: false, message: 'Email, reset token, and new password are required.' };
  }

  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters.' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const resetRecord = await passwordResetRepository.findValidToken({
    email: normalizedEmail,
    resetToken
  });

  if (!resetRecord) {
    return { success: false, message: 'Invalid or expired password reset session. Please request a new code.' };
  }

  if (resetRecord.user_status !== 'ACTIVE') {
    return { success: false, message: 'This user account is currently inactive.' };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await authRepository.updatePassword(resetRecord.user_id, passwordHash);
  await passwordResetRepository.markAsUsed(resetRecord.reset_id);
  await passwordResetRepository.invalidatePriorCodes(resetRecord.user_id);

  return {
    success: true,
    message: 'Password has been reset successfully. You can now log in with your new password.'
  };
};

module.exports = { login, verifyLoginOtp, resendLoginOtp, getMe, forgotPassword, verifyResetCode, resetPassword };
