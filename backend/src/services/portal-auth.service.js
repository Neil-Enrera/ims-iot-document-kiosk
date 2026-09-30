const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const portalAccountRepository = require('../repositories/portal-account.repository');
const residentRepository = require('../repositories/resident.repository');
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
    return { success: false, message: 'Email address or Resident ID and password are required.' };
  }

  const cleanIdentifier = String(identifier).trim();
  const row = await portalAccountRepository.findProfileByIdentifier(cleanIdentifier);
  if (!row) {
    return { success: false, message: 'Invalid email, Resident ID, or password.' };
  }
  if (row.status !== 'ACTIVE') {
    return { success: false, message: 'This portal account is inactive. Please contact the barangay office.' };
  }
  if (row.resident_status && row.resident_status !== 'ACTIVE') {
    return { success: false, message: 'This resident record is inactive. Please contact the barangay office.' };
  }

  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid) {
    return { success: false, message: 'Invalid email, Resident ID, or password.' };
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
  const profile = await portalAccountRepository.findProfileByPortalAccountId(portalAccountId);
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
    return { success: false, message: 'Email or Resident ID is required.' };
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
    message: 'If an account with that Email or Resident ID exists, a 6-digit verification code has been sent to its registered email.'
  };
};

const normalizeIdentifier = (identifier) => {
  if (!identifier || typeof identifier !== 'string') return null;
  const clean = identifier.trim();
  if (!clean) return null;
  if (clean.includes('@')) {
    return { accountId: null, email: clean };
  }
  return { accountId: clean.toUpperCase(), email: null };
};

const verifyResetCode = async (identifier, code) => {
  if (!identifier || !code) {
    return { success: false, message: 'Email or Resident ID and verification code are required.' };
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
    return { success: false, message: 'Email or Resident ID, reset token, and new password are required.' };
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

const updateProfile = async (portalAccountId, updateData) => {
  const account = await portalAccountRepository.findById(portalAccountId);
  if (!account) {
    return { success: false, message: 'Portal account not found.' };
  }
  if (account.status !== 'ACTIVE') {
    return { success: false, message: 'This portal account is inactive.' };
  }

  const resident = await residentRepository.findById(account.resident_id);
  if (!resident) {
    return { success: false, message: 'Resident record not found.' };
  }

  // Validate contact number if provided
  if (updateData.contact_number && String(updateData.contact_number).trim()) {
    const cleanPhone = String(updateData.contact_number).trim().replace(/[\s\-()]/g, '');
    if (!/^(09\d{9}|\+639\d{9})$/.test(cleanPhone)) {
      return { success: false, message: 'Contact number must be a valid 11-digit mobile number (e.g. 09123456789).' };
    }
  }

  // Validate email if provided
  if (updateData.email && String(updateData.email).trim()) {
    const cleanEmail = String(updateData.email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, message: 'Please provide a valid email address.' };
    }
    const existingAccount = await portalAccountRepository.findByEmail(cleanEmail);
    if (existingAccount && Number(existingAccount.portal_account_id) !== Number(account.portal_account_id)) {
      return { success: false, message: 'This email address is already associated with another portal account.' };
    }
  }

  // Update resident fields
  const residentUpdatePayload = {
    contact_number: updateData.contact_number !== undefined ? updateData.contact_number : resident.contact_number,
    email: updateData.email !== undefined ? updateData.email : resident.email,
    civil_status: updateData.civil_status !== undefined ? updateData.civil_status : resident.civil_status,
    occupation: updateData.occupation !== undefined ? updateData.occupation : resident.occupation,
    religion: updateData.religion !== undefined ? updateData.religion : resident.religion,
    birth_place: updateData.birth_place !== undefined ? updateData.birth_place : resident.birth_place,
    blood_type: updateData.blood_type !== undefined ? updateData.blood_type : resident.blood_type,
    house_number: updateData.house_number !== undefined ? updateData.house_number : resident.house_number,
    street: updateData.street !== undefined ? updateData.street : resident.street,
    subdivision: updateData.subdivision !== undefined ? updateData.subdivision : resident.subdivision,
    block: updateData.block !== undefined ? updateData.block : resident.block,
    lot: updateData.lot !== undefined ? updateData.lot : resident.lot,
    purok_zone: updateData.purok_zone !== undefined ? updateData.purok_zone : resident.purok_zone,
    sitio: updateData.sitio !== undefined ? updateData.sitio : resident.sitio,
    emergency_contact_name: updateData.emergency_contact_name !== undefined ? updateData.emergency_contact_name : resident.emergency_contact_name,
    emergency_contact_number: updateData.emergency_contact_number !== undefined ? updateData.emergency_contact_number : resident.emergency_contact_number
  };

  await residentRepository.update(account.resident_id, residentUpdatePayload);

  if (updateData.email && String(updateData.email).trim()) {
    await portalAccountRepository.updateEmail(portalAccountId, String(updateData.email).trim().toLowerCase());
  }

  const updatedProfile = await portalAccountRepository.findProfileByPortalAccountId(portalAccountId);
  return {
    success: true,
    message: 'Profile updated successfully.',
    data: toPublicAccount(updatedProfile || account)
  };
};

module.exports = { login, getMe, changePassword, forgotPassword, verifyResetCode, resetPassword, updateProfile };
