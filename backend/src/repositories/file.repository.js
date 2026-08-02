const pool = require('../config/database');

const create = async ({ originalName, filePath, mimeType }) => {
  const [result] = await pool.query(
    'INSERT INTO request_attachments (request_id, file_name, file_type, file_path) VALUES (?, ?, ?, ?)',
    [0, originalName, mimeType, filePath]
  );
  return result.insertId;
};

const findById = async (fileId) => {
  const [rows] = await pool.query('SELECT * FROM request_attachments WHERE attachment_id = ?', [fileId]);
  return rows[0] || null;
};

const findAll = async ({ page, limit }) => {
  const offset = (page - 1) * limit;
  const [rows] = await pool.query('SELECT * FROM request_attachments ORDER BY uploaded_at DESC LIMIT ? OFFSET ?', [limit, offset]);
  const [countResult] = await pool.query('SELECT COUNT(*) AS total FROM request_attachments');
  return { files: rows, total: countResult[0].total, page, limit };
};

const remove = async (fileId) => {
  const [result] = await pool.query('DELETE FROM request_attachments WHERE attachment_id = ?', [fileId]);
  return result.affectedRows > 0;
};

module.exports = { create, findById, findAll, remove };
