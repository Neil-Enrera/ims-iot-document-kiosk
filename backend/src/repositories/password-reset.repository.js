const pool = require('../config/database');

const invalidatePriorCodes = async (userId) => {
  await pool.query(
    'UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
    [userId]
  );
};

const createResetCode = async ({ userId, email, code, expiresAt }) => {
  // First invalidate prior pending codes for this user
  await invalidatePriorCodes(userId);

  const [result] = await pool.query(
    'INSERT INTO password_resets (user_id, email, verification_code, expires_at) VALUES (?, ?, ?, ?)',
    [userId, email, code, expiresAt]
  );
  return result.insertId;
};

const findValidCode = async ({ email, code }) => {
  const [rows] = await pool.query(
    'SELECT * FROM password_resets WHERE LOWER(email) = LOWER(?) AND verification_code = ? AND used_at IS NULL AND expires_at > NOW() ORDER BY reset_id DESC LIMIT 1',
    [email, code]
  );
  return rows[0] || null;
};

const setResetToken = async ({ resetId, resetToken }) => {
  const [result] = await pool.query(
    'UPDATE password_resets SET reset_token = ? WHERE reset_id = ? AND used_at IS NULL',
    [resetToken, resetId]
  );
  return result.affectedRows > 0;
};

const findValidToken = async ({ email, resetToken }) => {
  const [rows] = await pool.query(
    'SELECT pr.*, u.username, u.status as user_status FROM password_resets pr JOIN users u ON pr.user_id = u.user_id WHERE LOWER(pr.email) = LOWER(?) AND pr.reset_token = ? AND pr.used_at IS NULL AND pr.expires_at > NOW() LIMIT 1',
    [email, resetToken]
  );
  return rows[0] || null;
};

const markAsUsed = async (resetId) => {
  const [result] = await pool.query(
    'UPDATE password_resets SET used_at = NOW() WHERE reset_id = ?',
    [resetId]
  );
  return result.affectedRows > 0;
};

module.exports = {
  invalidatePriorCodes,
  createResetCode,
  findValidCode,
  setResetToken,
  findValidToken,
  markAsUsed
};
