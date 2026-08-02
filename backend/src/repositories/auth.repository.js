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

const updateLastLogin = async (userId) => {
  await pool.query('UPDATE users SET last_login = NOW() WHERE user_id = ?', [userId]);
};

module.exports = { findByUsername, findById, updateLastLogin };
