const pool = require('../config/database');

const log = async ({ userId, action, module, ipAddress }) => {
  try {
    let effectiveUserId = userId;
    if (effectiveUserId) {
      const [u] = await pool.query('SELECT user_id FROM users WHERE user_id = ?', [effectiveUserId]);
      if (u.length === 0) effectiveUserId = null;
    }
    if (!effectiveUserId) {
      const [firstUser] = await pool.query('SELECT user_id FROM users ORDER BY user_id ASC LIMIT 1');
      if (firstUser.length > 0) {
        effectiveUserId = firstUser[0].user_id;
      }
    }
    if (!effectiveUserId) return null;

    const [result] = await pool.query(
      'INSERT INTO audit_logs (user_id, action, module, ip_address) VALUES (?, ?, ?, ?)',
      [effectiveUserId, action, module, ipAddress || '127.0.0.1']
    );
    return result.insertId;
  } catch (err) {
    console.error('Failed to insert audit log:', err);
    return null;
  }
};

const findAll = async ({ search, module, userId, dateFrom, dateTo, page = 1, limit = 20 }) => {
  let query = `
    SELECT 
      a.*, 
      COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))), ''), u.username, 'System') AS user_name,
      u.username,
      u.email,
      r.role_name
    FROM audit_logs a 
    LEFT JOIN users u ON a.user_id = u.user_id
    LEFT JOIN user_roles r ON u.role_id = r.role_id
  `;
  let countQuery = `
    SELECT COUNT(*) AS total 
    FROM audit_logs a 
    LEFT JOIN users u ON a.user_id = u.user_id
  `;
  const conditions = [];
  const params = [];
  const countParams = [];

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push('(a.action LIKE ? OR a.module LIKE ? OR a.ip_address LIKE ? OR u.username LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR CONCAT(u.first_name, " ", u.last_name) LIKE ?)');
    params.push(term, term, term, term, term, term, term);
    countParams.push(term, term, term, term, term, term, term);
  }

  if (module && module.trim() && module !== 'All') {
    conditions.push('a.module = ?');
    params.push(module.trim());
    countParams.push(module.trim());
  }

  if (userId) {
    conditions.push('a.user_id = ?');
    params.push(userId);
    countParams.push(userId);
  }

  if (dateFrom) {
    conditions.push('DATE(a.created_at) >= ?');
    params.push(dateFrom);
    countParams.push(dateFrom);
  }

  if (dateTo) {
    conditions.push('DATE(a.created_at) <= ?');
    params.push(dateTo);
    countParams.push(dateTo);
  }

  if (conditions.length > 0) {
    const whereClause = ' WHERE ' + conditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause;
  }

  query += ' ORDER BY a.created_at DESC, a.audit_log_id DESC';
  const numLimit = parseInt(limit, 10) || 20;
  const numPage = parseInt(page, 10) || 1;
  const offset = (numPage - 1) * numLimit;
  query += ' LIMIT ? OFFSET ?';
  params.push(numLimit, offset);

  const [rows] = await pool.query(query, params);
  const [countResult] = await pool.query(countQuery, countParams);

  return { logs: rows, total: countResult[0]?.total || 0, page: numPage, limit: numLimit };
};

const findById = async (auditLogId) => {
  const [rows] = await pool.query(`
    SELECT 
      a.*, 
      COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))), ''), u.username, 'System') AS user_name,
      u.username,
      u.email,
      r.role_name
    FROM audit_logs a 
    LEFT JOIN users u ON a.user_id = u.user_id
    LEFT JOIN user_roles r ON u.role_id = r.role_id
    WHERE a.audit_log_id = ?
  `, [auditLogId]);
  return rows[0] || null;
};

const getModules = async () => {
  const [rows] = await pool.query('SELECT DISTINCT module FROM audit_logs WHERE module IS NOT NULL AND module != "" ORDER BY module ASC');
  return rows.map(r => r.module);
};

module.exports = { log, findAll, findById, getModules };
