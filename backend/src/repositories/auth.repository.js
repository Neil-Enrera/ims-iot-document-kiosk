const pool = require('../config/database');

const findByUsername = async (username) => {
  const [rows] = await pool.query(
    'SELECT u.*, r.role_name FROM users u JOIN user_roles r ON u.role_id = r.role_id WHERE u.username = ?',
    [username]
  );
  return rows[0] || null;
};

const findById = async (userId) => {
  const [rows] = await pool.query(
    'SELECT u.user_id, u.username, u.first_name, u.middle_name, u.last_name, u.email, u.contact_number, u.status, r.role_name FROM users u JOIN user_roles r ON u.role_id = r.role_id WHERE u.user_id = ?',
    [userId]
  );
  return rows[0] || null;
};

const findByEmail = async (email) => {
  const [rows] = await pool.query(
    'SELECT u.*, r.role_name FROM users u JOIN user_roles r ON u.role_id = r.role_id WHERE LOWER(u.email) = LOWER(?)',
    [email]
  );
  return rows[0] || null;
};

const updatePassword = async (userId, passwordHash) => {
  const [result] = await pool.query(
    'UPDATE users SET password_hash = ? WHERE user_id = ?',
    [passwordHash, userId]
  );
  return result.affectedRows > 0;
};

const updateLastLogin = async (userId) => {
  await pool.query('UPDATE users SET last_login = NOW() WHERE user_id = ?', [userId]);
};

const invalidatePendingLoginCodes = async (userId) => {
  await pool.query(
    'UPDATE login_verification_codes SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
    [userId]
  );
};

const createLoginCode = async ({ userId, email, code, tempToken, expiresAt }) => {
  await invalidatePendingLoginCodes(userId);
  const [result] = await pool.query(
    'INSERT INTO login_verification_codes (user_id, email, verification_code, temp_token, expires_at) VALUES (?, ?, ?, ?, ?)',
    [userId, email, code, tempToken, expiresAt]
  );
  return result.insertId;
};

const findValidLoginCode = async ({ email, code, tempToken }) => {
  const [rows] = await pool.query(
    'SELECT lvc.*, u.user_id, u.username, u.first_name, u.middle_name, u.last_name, u.email as user_email, u.contact_number, u.status as user_status, r.role_name FROM login_verification_codes lvc JOIN users u ON lvc.user_id = u.user_id JOIN user_roles r ON u.role_id = r.role_id WHERE LOWER(lvc.email) = LOWER(?) AND lvc.verification_code = ? AND lvc.temp_token = ? AND lvc.used_at IS NULL AND lvc.expires_at > NOW() ORDER BY lvc.code_id DESC LIMIT 1',
    [email, code, tempToken]
  );
  return rows[0] || null;
};

const findLatestLoginCode = async ({ email, tempToken }) => {
  const [rows] = await pool.query(
    'SELECT lvc.*, u.user_id, u.username, u.first_name, u.middle_name, u.last_name, u.email as user_email, u.status as user_status, r.role_name FROM login_verification_codes lvc JOIN users u ON lvc.user_id = u.user_id JOIN user_roles r ON u.role_id = r.role_id WHERE LOWER(lvc.email) = LOWER(?) AND lvc.temp_token = ? AND lvc.used_at IS NULL ORDER BY lvc.code_id DESC LIMIT 1',
    [email, tempToken]
  );
  return rows[0] || null;
};

const markLoginCodeUsed = async (codeId) => {
  const [result] = await pool.query(
    'UPDATE login_verification_codes SET used_at = NOW() WHERE code_id = ?',
    [codeId]
  );
  return result.affectedRows > 0;
};

module.exports = {
  findByUsername,
  findById,
  findByEmail,
  updatePassword,
  updateLastLogin,
  invalidatePendingLoginCodes,
  createLoginCode,
  findValidLoginCode,
  findLatestLoginCode,
  markLoginCodeUsed
};
