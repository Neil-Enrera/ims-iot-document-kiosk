const pool = require('../config/database');

const findAll = async ({ search, status, page, limit, sortBy, sortOrder }) => {
  let query = 'SELECT u.user_id, u.username, u.first_name, u.middle_name, u.last_name, u.email, u.contact_number, u.status, u.last_login, u.created_at, u.updated_at, r.role_id, r.role_name FROM users u JOIN user_roles r ON u.role_id = r.role_id';
  let countQuery = 'SELECT COUNT(*) AS total FROM users u';
  const conditions = [];
  const params = [];
  const countParams = [];

  if (search) {
    conditions.push('(u.username LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)');
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (status) {
    conditions.push('u.status = ?');
    params.push(status);
    countParams.push(status);
  }

  if (conditions.length > 0) {
    const whereClause = ' WHERE ' + conditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause;
  }

  const validSortColumns = ['user_id', 'username', 'first_name', 'last_name', 'email', 'status', 'created_at'];
  const column = validSortColumns.includes(sortBy) ? sortBy : 'user_id';
  const order = sortOrder === 'DESC' ? 'DESC' : 'ASC';
  query += ` ORDER BY u.${column} ${order}`;

  const offset = (page - 1) * limit;
  query += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await pool.query(query, params);
  const [countResult] = await pool.query(countQuery, countParams);
  const total = countResult[0].total;

  return { users: rows, total, page, limit };
};

const findById = async (userId) => {
  const [rows] = await pool.query(
    'SELECT u.user_id, u.username, u.first_name, u.middle_name, u.last_name, u.email, u.contact_number, u.status, u.last_login, u.created_at, u.updated_at, r.role_id, r.role_name FROM users u JOIN user_roles r ON u.role_id = r.role_id WHERE u.user_id = ?',
    [userId]
  );
  return rows[0] || null;
};

const findByUsername = async (username) => {
  const [rows] = await pool.query('SELECT user_id FROM users WHERE username = ?', [username]);
  return rows[0] || null;
};

const create = async ({ roleId, firstName, middleName, lastName, username, passwordHash, email, contactNumber }) => {
  const [result] = await pool.query(
    'INSERT INTO users (role_id, first_name, middle_name, last_name, username, password_hash, email, contact_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [roleId, firstName, middleName, lastName, username, passwordHash, email, contactNumber]
  );
  return result.insertId;
};

const update = async (userId, { roleId, firstName, middleName, lastName, email, contactNumber }) => {
  const [result] = await pool.query(
    'UPDATE users SET role_id = ?, first_name = ?, middle_name = ?, last_name = ?, email = ?, contact_number = ? WHERE user_id = ?',
    [roleId, firstName, middleName, lastName, email, contactNumber, userId]
  );
  return result.affectedRows > 0;
};

const updateStatus = async (userId, status) => {
  const [result] = await pool.query('UPDATE users SET status = ? WHERE user_id = ?', [status, userId]);
  return result.affectedRows > 0;
};

const updatePassword = async (userId, passwordHash) => {
  const [result] = await pool.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [passwordHash, userId]);
  return result.affectedRows > 0;
};

const remove = async (userId) => {
  const [result] = await pool.query('DELETE FROM users WHERE user_id = ?', [userId]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, findByUsername, create, update, updateStatus, updatePassword, remove };
