const pool = require('../config/database');

const create = async ({ requestId, serviceId, fileName, filePath, fileType, fileSize, generatedBy }) => {
  const [result] = await pool.query(
    `INSERT INTO generated_documents (request_id, service_id, file_name, file_path, file_type, file_size, generated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [requestId, serviceId, fileName, filePath, fileType, fileSize, generatedBy]
  );
  return result.insertId;
};

const findByRequest = async (requestId) => {
  const [rows] = await pool.query(
    `SELECT gd.*, u.first_name AS generated_by_first, u.last_name AS generated_by_last
     FROM generated_documents gd
     LEFT JOIN users u ON gd.generated_by = u.user_id
     WHERE gd.request_id = ?
     ORDER BY gd.generated_at ASC`,
    [requestId]
  );
  return rows;
};

const findById = async (documentId) => {
  const [rows] = await pool.query(
    `SELECT gd.*, rq.request_number, rq.service_id AS request_service_id
     FROM generated_documents gd
     JOIN requests rq ON gd.request_id = rq.request_id
     WHERE gd.document_id = ?`,
    [documentId]
  );
  return rows[0] || null;
};

const remove = async (documentId) => {
  const [result] = await pool.query('DELETE FROM generated_documents WHERE document_id = ?', [documentId]);
  return result.affectedRows > 0;
};

module.exports = { create, findByRequest, findById, remove };
