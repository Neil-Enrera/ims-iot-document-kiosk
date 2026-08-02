const pool = require('../config/database');

const log = async ({ userId, action, module, ipAddress }) => {
  const [result] = await pool.query(
    'INSERT INTO audit_logs (user_id, action, module, ip_address) VALUES (?, ?, ?, ?)',
    [userId, action, module, ipAddress]
  );
  return result.insertId;
};

const findAll = async ({ search, module, userId, dateFrom, dateTo, page, limit }) => {
  let query = 'SELECT a.*, CONCAT(u.first_name, " ", u.last_name) AS user_name FROM audit_logs a JOIN users u ON a.user_id = u.user_id';
  let countQuery = 'SELECT COUNT(*) AS total FROM audit_logs a';
  const conditions = [];
  const params = [];
  const countParams = [];

  if (search) {
    conditions.push('(a.action LIKE ? OR a.module LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term);
    countParams.push(term, term);
  }

  if (module) {
    conditions.push('a.module = ?');
    params.push(module);
    countParams.push(module);
  }

  if (userId) {
    conditions.push('a.user_id = ?');
    params.push(userId);
    countParams.push(userId);
  }

  if (dateFrom) {
    conditions.push('a.created_at >= ?');
    params.push(dateFrom);
    countParams.push(dateFrom);
  }

  if (dateTo) {
    conditions.push('a.created_at <= ?');
    params.push(dateTo);
    countParams.push(dateTo);
  }

  if (conditions.length > 0) {
    const whereClause = ' WHERE ' + conditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause;
  }

  query += ' ORDER BY a.created_at DESC';
  const offset = (page - 1) * limit;
  query += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await pool.query(query, params);
  const [countResult] = await pool.query(countQuery, countParams);

  return { logs: rows, total: countResult[0].total, page, limit };
};

const findById = async (auditLogId) => {
  const [rows] = await pool.query(
    'SELECT a.*, CONCAT(u.first_name, " ", u.last_name) AS user_name FROM audit_logs a JOIN users u ON a.user_id = u.user_id WHERE a.audit_log_id = ?',
    [auditLogId]
  );
  return rows[0] || null;
};

module.exports = { log, findAll, findById };
