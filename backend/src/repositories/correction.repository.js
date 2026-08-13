const pool = require('../config/database');

const logCorrection = async ({ requestId, affectedField, reason, comment, originalValue, updatedValue, requestedBy }) => {
  const [result] = await pool.query(
    `INSERT INTO request_corrections
      (request_id, affected_field, reason, comment, original_value, updated_value, status, requested_by, resolved_at)
     VALUES (?, ?, ?, ?, ?, ?, 'RESOLVED', ?, NOW())`,
    [
      requestId,
      affectedField,
      reason || null,
      comment || null,
      originalValue !== undefined && originalValue !== null ? JSON.stringify(originalValue) : null,
      updatedValue !== undefined && updatedValue !== null ? JSON.stringify(updatedValue) : null,
      requestedBy
    ]
  );
  return result.insertId;
};

const findByRequest = async (requestId) => {
  const [rows] = await pool.query(
    `SELECT c.*, CONCAT(u.first_name, ' ', u.last_name) AS requested_by_name
     FROM request_corrections c
     LEFT JOIN users u ON c.requested_by = u.user_id
     WHERE c.request_id = ?
     ORDER BY c.created_at DESC`,
    [requestId]
  );
  return rows;
};

module.exports = { logCorrection, findByRequest };
