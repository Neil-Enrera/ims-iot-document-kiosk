const pool = require('../config/database');

const create = async ({ requestId, serviceId, fileName, filePath, fileType, fileSize, generatedBy, generationWarnings }) => {
  const [result] = await pool.query(
    `INSERT INTO generated_documents
       (request_id, service_id, file_name, file_path, file_type, file_size, generated_by, generation_warnings)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [requestId, serviceId, fileName, filePath, fileType, fileSize, generatedBy, generationWarnings ? JSON.stringify(generationWarnings) : null]
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
  return rows.map(parseWarnings);
};

const findById = async (documentId) => {
  const [rows] = await pool.query(
    `SELECT gd.*, rq.request_number, rq.service_id AS request_service_id
     FROM generated_documents gd
     JOIN requests rq ON gd.request_id = rq.request_id
     WHERE gd.document_id = ?`,
    [documentId]
  );
  return parseWarnings(rows[0] || null);
};

const updateApproval = async (documentId, { status, reviewedBy, reviewRemarks }) => {
  const [result] = await pool.query(
    `UPDATE generated_documents
     SET approval_status = ?, reviewed_by = ?, reviewed_at = NOW(), review_remarks = ?
     WHERE document_id = ?`,
    [status, reviewedBy, reviewRemarks || null, documentId]
  );
  return result.affectedRows > 0;
};

const remove = async (documentId) => {
  const [result] = await pool.query('DELETE FROM generated_documents WHERE document_id = ?', [documentId]);
  return result.affectedRows > 0;
};

const parseWarnings = (row) => {
  if (!row) return row;
  if (typeof row.generation_warnings === 'string') {
    try {
      row.generation_warnings = JSON.parse(row.generation_warnings);
    } catch {
      row.generation_warnings = [];
    }
  }
  if (row.generation_warnings === null || row.generation_warnings === undefined) row.generation_warnings = [];
  return row;
};

module.exports = { create, findByRequest, findById, updateApproval, remove };
