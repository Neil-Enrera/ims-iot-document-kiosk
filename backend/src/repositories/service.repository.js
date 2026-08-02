const pool = require('../config/database');

const findAll = async ({ search, isActive, page, limit, sortBy, sortOrder }) => {
  let query = 'SELECT * FROM services';
  let countQuery = 'SELECT COUNT(*) AS total FROM services';
  const conditions = [];
  const params = [];
  const countParams = [];

  if (search) {
    conditions.push('(service_name LIKE ? OR description LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term);
    countParams.push(term, term);
  }

  if (isActive !== undefined) {
    conditions.push('is_active = ?');
    params.push(isActive);
    countParams.push(isActive);
  }

  if (conditions.length > 0) {
    const whereClause = ' WHERE ' + conditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause;
  }

  const validSortColumns = ['service_id', 'service_name', 'processing_fee', 'is_active', 'created_at'];
  const column = validSortColumns.includes(sortBy) ? sortBy : 'service_id';
  const order = sortOrder === 'DESC' ? 'DESC' : 'ASC';
  query += ` ORDER BY ${column} ${order}`;

  const offset = (page - 1) * limit;
  query += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await pool.query(query, params);
  const [countResult] = await pool.query(countQuery, countParams);

  return { services: parseServiceRows(rows), total: countResult[0].total, page, limit };
};

// mysql2 returns JSON columns already parsed, but keep a safe fallback
const parseServiceRows = (rows) => {
  return rows.map(row => ({
    ...row,
    requirements: parseJson(row.requirements),
    form_fields: parseJson(row.form_fields),
    required_documents: parseJson(row.required_documents)
  }));
};

const parseJson = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return null; }
  }
  return value;
};

const findById = async (serviceId) => {
  const [rows] = await pool.query('SELECT * FROM services WHERE service_id = ?', [serviceId]);
  const row = rows[0] || null;
  return row ? parseServiceRows([row])[0] : null;
};

const findByName = async (serviceName) => {
  const [rows] = await pool.query('SELECT service_id FROM services WHERE service_name = ?', [serviceName]);
  return rows[0] || null;
};

const create = async ({ serviceName, description, processingFee, requiresPhoto, requirements, formFields, requiredDocuments, processingTime, approvalWorkflow }) => {
  const [result] = await pool.query(
    `INSERT INTO services (service_name, description, processing_fee, requires_photo, requirements, form_fields, required_documents, processing_time, approval_workflow)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      serviceName, description, processingFee, requiresPhoto || false,
      JSON.stringify(requirements ?? null),
      JSON.stringify(formFields ?? null),
      JSON.stringify(requiredDocuments ?? null),
      processingTime || null,
      approvalWorkflow || null
    ]
  );
  return result.insertId;
};

const update = async (serviceId, { serviceName, description, processingFee, requiresPhoto, requirements, formFields, requiredDocuments, processingTime, approvalWorkflow }) => {
  const [result] = await pool.query(
    `UPDATE services
     SET service_name = ?, description = ?, processing_fee = ?, requires_photo = ?,
         requirements = ?, form_fields = ?, required_documents = ?, processing_time = ?, approval_workflow = ?
     WHERE service_id = ?`,
    [
      serviceName, description, processingFee, requiresPhoto || false,
      JSON.stringify(requirements ?? null),
      JSON.stringify(formFields ?? null),
      JSON.stringify(requiredDocuments ?? null),
      processingTime || null,
      approvalWorkflow || null,
      serviceId
    ]
  );
  return result.affectedRows > 0;
};

const updateStatus = async (serviceId, isActive) => {
  const [result] = await pool.query('UPDATE services SET is_active = ? WHERE service_id = ?', [isActive, serviceId]);
  return result.affectedRows > 0;
};

const remove = async (serviceId) => {
  const [result] = await pool.query('DELETE FROM services WHERE service_id = ?', [serviceId]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, findByName, create, update, updateStatus, remove };
