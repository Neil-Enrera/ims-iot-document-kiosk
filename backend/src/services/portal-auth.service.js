const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const portalAccountRepository = require('../repositories/portal-account.repository');
const emailService = require('./email.service');
const config = require('../config/environment');

const toPublicAccount = (row) => ({
  portal_account_id: row.portal_account_id,
  account_id: row.account_id,
  resident_id: row.resident_id,
  resident_code: row.resident_code,
  email: row.email,
  first_name: row.first_name,
  middle_name: row.middle_name,
  last_name: row.last_name,
  suffix: row.suffix,
  birth_date: row.birth_date,
  birth_place: row.birth_place,
  gender: row.gender,
  civil_status: row.civil_status,
  blood_type: row.blood_type,
  occupation: row.occupation,
  nationality: row.nationality,
  religion: row.religion,
  house_number: row.house_number,
  street: row.street,
  subdivision: row.subdivision,
  block: row.block,
  lot: row.lot,
  purok_zone: row.purok_zone,
  sitio: row.sitio,
  municipality: row.municipality,
  province: row.province,
  zip_code: row.zip_code,
  address_line: row.address_line,
  barangay_id: row.barangay_id,
  barangay_name: row.barangay_name,
  contact_number: row.contact_number,
  emergency_contact_name: row.emergency_contact_name,
  emergency_contact_number: row.emergency_contact_number,
  photo: row.photo,
  status: row.status,
  resident_status: row.resident_status,
  must_change_password: Number(row.must_change_password) === 1,
  last_login: row.last_login
});

const login = async (identifier, password) => {
  if (!identifier || !password) {
    return { success: false, message: 'Email address or Account ID and password are required.' };
  }

  const cleanIdentifier = String(identifier).trim();
  const row = await portalAccountRepository.findProfileByIdentifier(cleanIdentifier);
  if (!row) {
    return { success: false, message: 'Invalid email/Account ID or password.' };
  }
  if (row.status !== 'ACTIVE') {
    return { success: false, message: 'This portal account is inactive. Please contact the barangay office.' };
  }
  if (row.resident_status && row.resident_status !== 'ACTIVE') {
    return { success: false, message: 'This resident record is inactive. Please contact the barangay office.' };
  }

  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid) {
    return { success: false, message: 'Invalid email/Account ID or password.' };
  }

  await portalAccountRepository.updateLastLogin(row.portal_account_id);

  const mustChangePassword = Number(row.must_change_password) === 1;
  const token = jwt.sign(
    {
      type: 'portal',
      portalAccountId: row.portal_account_id,
      accountId: row.account_id,
      residentId: row.resident_id,
      email: row.email
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  return {
    success: true,
    message: mustChangePassword
      ? 'Login successful. Please change your temporary password to continue.'
      : 'Login successful.',
    data: {
      accessToken: token,
      mustChangePassword,
      account: toPublicAccount(row)
    }
  };
};

const getMe = async (portalAccountId) => {
  const row = await portalAccountRepository.findById(portalAccountId);
  if (!row) {
    return { success: false, message: 'Account not found.' };
  }
  const profile = await portalAccountRepository.findProfileByAccountId(row.account_id);
  if (!profile) {
    return { success: false, message: 'Account not found.' };
  }
  return {
    success: true,
    message: 'Account retrieved successfully.',
    data: toPublicAccount(profile)
  };
};

const changePassword = async (portalAccountId, newPassword) => {
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    return { success: false, message: 'New password must be at least 8 characters.' };
  }

  const account = await portalAccountRepository.findById(portalAccountId);
  if (!account) {
    return { success: false, message: 'Account not found.' };
  }
  if (account.status !== 'ACTIVE') {
    return { success: false, message: 'This portal account is inactive.' };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await portalAccountRepository.updatePassword(portalAccountId, passwordHash);

  return {
    success: true,
    message: 'Password changed successfully. You can now access the portal.',
    data: { mustChangePassword: false }
  };
};

const forgotPassword = async (identifier) => {
  if (!identifier || typeof identifier !== 'string') {
    return { success: false, message: 'Account ID is required.' };
  }

  const key = normalizeIdentifier(identifier);
  let account = null;
  if (key.accountId) {
    account = await portalAccountRepository.findByAccountId(key.accountId);
  }
  if (!account && key.email) {
    account = await portalAccountRepository.findByEmail(key.email);
  }

  if (account && account.status === 'ACTIVE') {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await portalAccountRepository.createResetCode({
      portalAccountId: account.portal_account_id,
      email: account.email,
      code,
      expiresAt
    });

    const profile = await portalAccountRepository.findProfileByAccountId(account.account_id);
    const fullName = profile
      ? [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ').trim()
      : '';

    await emailService.sendVerificationCode({
      email: account.email,
      name: fullName || 'Resident',
      code,
      expiresMinutes: 10
    });
  }

  return {
    success: true,
    message: 'If an account with that Account ID exists, a 6-digit verification code has been sent to its registered email.'
  };
};

const normalizeIdentifier = (identifier) => {
  if (!identifier || typeof identifier !== 'string') return null;
  const clean = identifier.trim();
  if (!clean) return null;
  if (clean.toUpperCase().startsWith('BSM-')) {
    return { accountId: clean.toUpperCase(), email: null };
  }
  if (clean.includes('@')) {
    return { accountId: null, email: clean };
  }
  return { accountId: clean.toUpperCase(), email: null };
};

const verifyResetCode = async (identifier, code) => {
  if (!identifier || !code) {
    return { success: false, message: 'Account ID and verification code are required.' };
  }

  const key = normalizeIdentifier(identifier);
  const resetRecord = await portalAccountRepository.findValidResetCode({
    accountId: key.accountId,
    email: key.email,
    code: code.toString().trim()
  });

  if (!resetRecord) {
    return { success: false, message: 'Invalid or expired verification code. Please check your email or request a new code.' };
  }
  if (resetRecord.account_status !== 'ACTIVE') {
    return { success: false, message: 'This portal account is inactive.' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  await portalAccountRepository.setResetToken({ resetId: resetRecord.reset_id, resetToken });

  return {
    success: true,
    message: 'Verification code confirmed. You can now set your new password.',
    data: {
      resetToken,
      accountId: resetRecord.account_id,
      email: resetRecord.account_email
    }
  };
};

const resetPassword = async (identifier, resetToken, newPassword) => {
  if (!identifier || !resetToken || !newPassword) {
    return { success: false, message: 'Account ID, reset token, and new password are required.' };
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return { success: false, message: 'Password must be at least 8 characters.' };
  }

  const key = normalizeIdentifier(identifier);
  const resetRecord = await portalAccountRepository.findValidResetToken({
    accountId: key.accountId,
    email: key.email,
    resetToken: resetToken.trim()
  });

  if (!resetRecord) {
    return { success: false, message: 'Invalid or expired password reset session. Please request a new code.' };
  }
  if (resetRecord.account_status !== 'ACTIVE') {
    return { success: false, message: 'This portal account is inactive.' };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await portalAccountRepository.updatePassword(resetRecord.portal_account_id, passwordHash);
  await portalAccountRepository.markResetUsed(resetRecord.reset_id);

  return {
    success: true,
    message: 'Password has been reset successfully. You can now log in with your new password.'
  };
};

module.exports = { login, getMe, changePassword, forgotPassword, verifyResetCode, resetPassword };
