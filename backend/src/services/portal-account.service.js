const crypto = require('crypto');
const bcrypt = require('bcrypt');
const portalAccountRepository = require('../repositories/portal-account.repository');
const emailService = require('./email.service');
const config = require('../config/environment');

const generateAccountId = async () => {
  const last = await portalAccountRepository.findMaxAccountId();
  let next = 1;
  if (last) {
    const match = String(last).match(/^BSM-(\d+)$/);
    if (match) next = parseInt(match[1], 10) + 1;
  }
  return `BSM-${String(next).padStart(6, '0')}`;
};

const generateTemporaryPassword = (length = 8) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
};

// Called after Barangay ID approval + issuance. Idempotent per resident.
const createAccountForResident = async ({ residentId, residentCode, email, fullName }) => {
  if (!residentId) {
    return { success: false, message: 'Resident ID is required.', data: null };
  }

  const existing = await portalAccountRepository.findByResidentId(residentId);
  if (existing) {
    return { success: true, message: 'Portal account already exists.', data: { account: existing, created: false } };
  }

  const normalizedEmail = (email || '').trim();
  if (!normalizedEmail) {
    return {
      success: false,
      message: 'No email address on the Barangay ID application; portal account was not created.',
      data: null
    };
  }

  // Use the resident's master resident_code as the unified Account ID
  let accountId = residentCode;
  if (!accountId) {
    const residentRepo = require('../repositories/resident.repository');
    const resident = await residentRepo.findById(residentId);
    accountId = resident?.resident_code || (await generateAccountId());
  }

  const temporaryPassword = generateTemporaryPassword(8);
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);


  let portalAccountId;
  try {
    portalAccountId = await portalAccountRepository.create({
      accountId,
      residentId,
      email: normalizedEmail,
      passwordHash,
      mustChangePassword: true
    });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      const retryId = await generateAccountId();
      const retryHash = await bcrypt.hash(temporaryPassword, 10);
      portalAccountId = await portalAccountRepository.create({
        accountId: retryId,
        residentId,
        email: normalizedEmail,
        passwordHash: retryHash,
        mustChangePassword: true
      });
    } else {
      throw err;
    }
  }

  const account = await portalAccountRepository.findById(portalAccountId);
  const portalUrl = (config.app.frontendUrl || '').replace(/\/$/, '');

  try {
    await emailService.sendPortalCredentials({
      email: normalizedEmail,
      name: fullName,
      accountId: account.account_id,
      temporaryPassword,
      portalUrl
    });
  } catch (emailError) {
    console.error('Failed to send portal credentials email:', emailError);
  }

  return {
    success: true,
    message: 'Portal account created.',
    data: { account, created: true, temporaryPassword }
  };
};

module.exports = {
  createAccountForResident,
  generateAccountId,
  generateTemporaryPassword
};
