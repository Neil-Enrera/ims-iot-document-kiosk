const pool = require('../config/database');

const create = async ({ originalName, mimeType, fileSize, filePath, category, description, uploadedBy }) => {
  const [result] = await pool.query(
    'INSERT INTO files (original_name, mime_type, file_size, file_path, category, description, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [originalName, mimeType, fileSize, filePath, category, description, uploadedBy]
  );
  return result.insertId;
};

const findById = async (fileId) => {
  const [rows] = await pool.query('SELECT * FROM files WHERE file_id = ?', [fileId]);
  return rows[0] || null;
};

const findAll = async ({ page, limit }) => {
  const offset = (page - 1) * limit;
  const [rows] = await pool.query('SELECT * FROM files ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]);
  const [countResult] = await pool.query('SELECT COUNT(*) AS total FROM files');
  return { files: rows, total: countResult[0].total, page, limit };
};

const remove = async (fileId) => {
  const [result] = await pool.query('DELETE FROM files WHERE file_id = ?', [fileId]);
  return result.affectedRows > 0;
};

module.exports = { create, findById, findAll, remove };
