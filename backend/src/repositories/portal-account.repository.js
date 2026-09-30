const pool = require('../config/database');

const findById = async (portalAccountId) => {
  const [rows] = await pool.query(
    'SELECT * FROM portal_accounts WHERE portal_account_id = ? LIMIT 1',
    [portalAccountId]
  );
  return rows[0] || null;
};

const findByAccountId = async (accountId) => {
  const [rows] = await pool.query(
    `SELECT pa.* FROM portal_accounts pa
     LEFT JOIN residents r ON pa.resident_id = r.resident_id
     WHERE pa.account_id = ? OR r.resident_code = ? LIMIT 1`,
    [accountId, accountId]
  );
  return rows[0] || null;
};

const findByResidentId = async (residentId) => {
  const [rows] = await pool.query(
    'SELECT * FROM portal_accounts WHERE resident_id = ? LIMIT 1',
    [residentId]
  );
  return rows[0] || null;
};

const findByEmail = async (email) => {
  const [rows] = await pool.query(
    'SELECT * FROM portal_accounts WHERE LOWER(email) = LOWER(?) LIMIT 1',
    [email]
  );
  return rows[0] || null;
};

const findProfileByPortalAccountId = async (portalAccountId) => {
  const [rows] = await pool.query(
    `SELECT pa.portal_account_id, pa.account_id, pa.resident_id, pa.email, pa.password_hash, pa.status,
            pa.must_change_password, pa.last_login, pa.created_at,
            r.resident_code, r.first_name, r.middle_name, r.last_name, r.suffix,
            r.birth_date, r.birth_place, r.gender, r.civil_status, r.blood_type,
            r.occupation, r.nationality, r.religion,
            r.house_number, r.street, r.subdivision, r.block, r.lot, r.purok_zone, r.sitio,
            r.municipality, r.province, r.zip_code, r.address_line,
            r.barangay_id, b.barangay_name,
            r.contact_number, r.emergency_contact_name, r.emergency_contact_number,
            r.photo, r.status AS resident_status
     FROM portal_accounts pa
     LEFT JOIN residents r ON r.resident_id = pa.resident_id
     LEFT JOIN barangays b ON r.barangay_id = b.barangay_id
     WHERE pa.portal_account_id = ? LIMIT 1`,
    [portalAccountId]
  );
  return rows[0] || null;
};

const findProfileByAccountId = async (accountId) => {
  const clean = (accountId || '').trim();
  const [rows] = await pool.query(
    `SELECT pa.portal_account_id, pa.account_id, pa.resident_id, pa.email, pa.password_hash, pa.status,
            pa.must_change_password, pa.last_login, pa.created_at,
            r.resident_code, r.first_name, r.middle_name, r.last_name, r.suffix,
            r.birth_date, r.birth_place, r.gender, r.civil_status, r.blood_type,
            r.occupation, r.nationality, r.religion,
            r.house_number, r.street, r.subdivision, r.block, r.lot, r.purok_zone, r.sitio,
            r.municipality, r.province, r.zip_code, r.address_line,
            r.barangay_id, b.barangay_name,
            r.contact_number, r.emergency_contact_name, r.emergency_contact_number,
            r.photo, r.status AS resident_status
     FROM portal_accounts pa
     LEFT JOIN residents r ON r.resident_id = pa.resident_id
     LEFT JOIN barangays b ON r.barangay_id = b.barangay_id
     WHERE pa.account_id = ? OR r.resident_code = ? LIMIT 1`,
    [clean, clean]
  );
  return rows[0] || null;
};

const findProfileByIdentifier = async (identifier) => {
  const clean = (identifier || '').trim();
  const [rows] = await pool.query(
    `SELECT pa.portal_account_id, pa.account_id, pa.resident_id, pa.email, pa.password_hash, pa.status,
            pa.must_change_password, pa.last_login, pa.created_at,
            r.resident_code, r.first_name, r.middle_name, r.last_name, r.suffix,
            r.birth_date, r.birth_place, r.gender, r.civil_status, r.blood_type,
            r.occupation, r.nationality, r.religion,
            r.house_number, r.street, r.subdivision, r.block, r.lot, r.purok_zone, r.sitio,
            r.municipality, r.province, r.zip_code, r.address_line,
            r.barangay_id, b.barangay_name,
            r.contact_number, r.emergency_contact_name, r.emergency_contact_number,
            r.photo, r.status AS resident_status
     FROM portal_accounts pa
     JOIN residents r ON r.resident_id = pa.resident_id
     LEFT JOIN barangays b ON r.barangay_id = b.barangay_id
     WHERE LOWER(pa.email) = LOWER(?) OR pa.account_id = ? OR r.resident_code = ? LIMIT 1`,
    [clean, clean.toUpperCase(), clean.toUpperCase()]
  );
  return rows[0] || null;
};

const findMaxAccountId = async () => {
  const [rows] = await pool.query(
    "SELECT account_id FROM portal_accounts WHERE account_id LIKE 'BSM-%' ORDER BY account_id DESC LIMIT 1"
  );
  return rows[0]?.account_id || null;
};

const create = async ({ accountId, residentId, email, passwordHash, mustChangePassword = true }) => {
  const [result] = await pool.query(
    `INSERT INTO portal_accounts (account_id, resident_id, email, password_hash, must_change_password)
     VALUES (?, ?, ?, ?, ?)`,
    [accountId, residentId, email, passwordHash, mustChangePassword ? 1 : 0]
  );
  return result.insertId;
};

const updatePassword = async (portalAccountId, passwordHash) => {
  const [result] = await pool.query(
    'UPDATE portal_accounts SET password_hash = ?, must_change_password = 0 WHERE portal_account_id = ?',
    [passwordHash, portalAccountId]
  );
  return result.affectedRows > 0;
};

const updateEmail = async (portalAccountId, email) => {
  const [result] = await pool.query(
    'UPDATE portal_accounts SET email = ? WHERE portal_account_id = ?',
    [email, portalAccountId]
  );
  return result.affectedRows > 0;
};

const updateLastLogin = async (portalAccountId) => {
  await pool.query(
    'UPDATE portal_accounts SET last_login = NOW() WHERE portal_account_id = ?',
    [portalAccountId]
  );
};

const invalidatePriorResets = async (portalAccountId) => {
  await pool.query(
    'UPDATE portal_password_resets SET used_at = NOW() WHERE portal_account_id = ? AND used_at IS NULL',
    [portalAccountId]
  );
};

const createResetCode = async ({ portalAccountId, email, code, expiresAt }) => {
  await invalidatePriorResets(portalAccountId);
  const [result] = await pool.query(
    `INSERT INTO portal_password_resets (portal_account_id, email, verification_code, expires_at)
     VALUES (?, ?, ?, ?)`,
    [portalAccountId, email, code, expiresAt]
  );
  return result.insertId;
};

const findValidResetCode = async ({ email, accountId, code }) => {
  let sql = `SELECT pr.*, pa.account_id, pa.email AS account_email, pa.status AS account_status, pa.must_change_password
     FROM portal_password_resets pr
     JOIN portal_accounts pa ON pa.portal_account_id = pr.portal_account_id
     LEFT JOIN residents r ON pa.resident_id = r.resident_id
     WHERE pr.verification_code = ?
       AND pr.used_at IS NULL AND pr.expires_at > NOW()`;
  const params = [code];

  if (accountId) {
    sql += ' AND (pa.account_id = ? OR r.resident_code = ?)';
    params.push(accountId, accountId);
  } else if (email) {
    sql += ' AND LOWER(pr.email) = LOWER(?)';
    params.push(email);
  } else {
    return null;
  }

  sql += ' ORDER BY pr.reset_id DESC LIMIT 1';
  const [rows] = await pool.query(sql, params);
  return rows[0] || null;
};

const setResetToken = async ({ resetId, resetToken }) => {
  const [result] = await pool.query(
    'UPDATE portal_password_resets SET reset_token = ? WHERE reset_id = ? AND used_at IS NULL',
    [resetToken, resetId]
  );
  return result.affectedRows > 0;
};

const findValidResetToken = async ({ email, accountId, resetToken }) => {
  let sql = `SELECT pr.*, pa.account_id, pa.email AS account_email, pa.status AS account_status
     FROM portal_password_resets pr
     JOIN portal_accounts pa ON pa.portal_account_id = pr.portal_account_id
     LEFT JOIN residents r ON pa.resident_id = r.resident_id
     WHERE pr.reset_token = ?
       AND pr.used_at IS NULL AND pr.expires_at > NOW()`;
  const params = [resetToken];

  if (accountId) {
    sql += ' AND (pa.account_id = ? OR r.resident_code = ?)';
    params.push(accountId, accountId);
  } else if (email) {
    sql += ' AND LOWER(pr.email) = LOWER(?)';
    params.push(email);
  } else {
    return null;
  }

  sql += ' LIMIT 1';
  const [rows] = await pool.query(sql, params);
  return rows[0] || null;
};

const markResetUsed = async (resetId) => {
  const [result] = await pool.query(
    'UPDATE portal_password_resets SET used_at = NOW() WHERE reset_id = ?',
    [resetId]
  );
  return result.affectedRows > 0;
};

module.exports = {
  findById,
  findByAccountId,
  findByResidentId,
  findByEmail,
  findProfileByPortalAccountId,
  findProfileByAccountId,
  findProfileByIdentifier,
  findMaxAccountId,
  create,
  updatePassword,
  updateEmail,
  updateLastLogin,
  createResetCode,
  findValidResetCode,
  setResetToken,
  findValidResetToken,
  markResetUsed
};
