const pool = require('../config/database');

const generateRequestNumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `UPD-${dateStr}-`;
  const [rows] = await pool.query(
    'SELECT request_number FROM resident_update_requests WHERE request_number LIKE ? ORDER BY request_id DESC LIMIT 1',
    [`${prefix}%`]
  );
  if (rows.length > 0) {
    const lastNum = parseInt(rows[0].request_number.split('-').pop(), 10) || 0;
    return `${prefix}${String(lastNum + 1).padStart(4, '0')}`;
  }
  return `${prefix}0001`;
};

const create = async ({ residentId, requestedChanges, reason }) => {
  const requestNumber = await generateRequestNumber();
  const [result] = await pool.query(
    'INSERT INTO resident_update_requests (request_number, resident_id, requested_changes, reason, status) VALUES (?, ?, ?, ?, ?)',
    [requestNumber, residentId, JSON.stringify(requestedChanges), reason, 'PENDING']
  );
  return { requestId: result.insertId, requestNumber };
};

const findAll = async ({ status, search, page = 1, limit = 20 }) => {
  let query = `
    SELECT 
      ur.*,
      r.first_name,
      r.middle_name,
      r.last_name,
      r.suffix,
      r.resident_code,
      r.contact_number AS current_contact_number,
      r.email AS current_email,
      r.civil_status AS current_civil_status,
      r.occupation AS current_occupation,
      r.address_line AS current_address_line,
      r.house_number AS current_house_number,
      r.street AS current_street,
      r.subdivision AS current_subdivision,
      r.block AS current_block,
      r.lot AS current_lot,
      r.purok_zone AS current_purok_zone,
      r.photo AS resident_photo,
      u.username AS reviewer_username,
      CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS reviewer_name
    FROM resident_update_requests ur
    JOIN residents r ON ur.resident_id = r.resident_id
    LEFT JOIN users u ON ur.reviewed_by = u.user_id
  `;
  let countQuery = `
    SELECT COUNT(*) AS total
    FROM resident_update_requests ur
    JOIN residents r ON ur.resident_id = r.resident_id
  `;

  const conditions = [];
  const params = [];
  const countParams = [];

  if (status && status !== 'All') {
    conditions.push('ur.status = ?');
    params.push(status);
    countParams.push(status);
  }

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push('(ur.request_number LIKE ? OR r.first_name LIKE ? OR r.last_name LIKE ? OR r.resident_code LIKE ? OR CONCAT(r.first_name, " ", r.last_name) LIKE ?)');
    params.push(term, term, term, term, term);
    countParams.push(term, term, term, term, term);
  }

  if (conditions.length > 0) {
    const whereClause = ' WHERE ' + conditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause;
  }

  query += ' ORDER BY ur.request_id DESC LIMIT ? OFFSET ?';
  const offset = (page - 1) * limit;
  params.push(Number(limit), Number(offset));

  const [rows] = await pool.query(query, params);
  const [[{ total }]] = await pool.query(countQuery, countParams);

  const parsedRows = rows.map(r => ({
    ...r,
    requested_changes: typeof r.requested_changes === 'string' ? JSON.parse(r.requested_changes) : r.requested_changes
  }));

  return { data: parsedRows, total, page: Number(page), limit: Number(limit) };
};

const findById = async (requestId) => {
  const [rows] = await pool.query(
    `SELECT 
      ur.*,
      r.first_name,
      r.middle_name,
      r.last_name,
      r.suffix,
      r.resident_code,
      r.birth_date,
      r.birth_place,
      r.gender,
      r.blood_type,
      r.nationality,
      r.religion,
      r.contact_number AS current_contact_number,
      r.email AS current_email,
      r.civil_status AS current_civil_status,
      r.occupation AS current_occupation,
      r.address_line AS current_address_line,
      r.house_number AS current_house_number,
      r.street AS current_street,
      r.subdivision AS current_subdivision,
      r.block AS current_block,
      r.lot AS current_lot,
      r.purok_zone AS current_purok_zone,
      r.photo AS resident_photo,
      u.username AS reviewer_username,
      CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS reviewer_name
    FROM resident_update_requests ur
    JOIN residents r ON ur.resident_id = r.resident_id
    LEFT JOIN users u ON ur.reviewed_by = u.user_id
    WHERE ur.request_id = ?`,
    [requestId]
  );

  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    ...row,
    requested_changes: typeof row.requested_changes === 'string' ? JSON.parse(row.requested_changes) : row.requested_changes
  };
};

const updateStatus = async (requestId, { status, reviewedBy, reviewNotes }) => {
  let validReviewerId = null;
  if (reviewedBy) {
    const [userRows] = await pool.query('SELECT user_id FROM users WHERE user_id = ?', [reviewedBy]);
    if (userRows.length > 0) {
      validReviewerId = reviewedBy;
    }
  }

  const [result] = await pool.query(
    'UPDATE resident_update_requests SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_notes = ? WHERE request_id = ?',
    [status, validReviewerId, reviewNotes || null, requestId]
  );
  return result.affectedRows > 0;
};

module.exports = {
  create,
  findAll,
  findById,
  updateStatus
};
