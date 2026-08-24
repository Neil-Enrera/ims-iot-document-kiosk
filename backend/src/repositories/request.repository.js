const pool = require('../config/database');

const findAll = async ({ search, statusId, residentId, serviceId, dateFrom, dateTo, page, limit, sortBy, sortOrder }) => {
  let query = `SELECT rq.*, rs.status_name, s.service_name, s.processing_fee,
    (rq.status_id = 6 AND rq.expires_at IS NOT NULL AND rq.expires_at < NOW()) AS is_expired,
    COALESCE(
      CONCAT(r.first_name, ' ', IFNULL(r.middle_name, ''), ' ', r.last_name),
      JSON_UNQUOTE(JSON_EXTRACT(rq.form_data, '$._guest.full_name'))
    ) AS resident_name,
    COALESCE(r.resident_code, 'GUEST') AS resident_code,
    sta.assigned_staff
    FROM requests rq
    JOIN request_statuses rs ON rq.status_id = rs.status_id
    JOIN services s ON rq.service_id = s.service_id
    LEFT JOIN residents r ON rq.resident_id = r.resident_id
    LEFT JOIN (
      SELECT h.request_id, CONCAT(u.first_name, ' ', IFNULL(u.last_name, '')) AS assigned_staff
      FROM request_status_history h
      JOIN users u ON h.changed_by = u.user_id
      JOIN (
        SELECT request_id, MAX(history_id) AS max_history_id
        FROM request_status_history
        GROUP BY request_id
      ) lm ON lm.max_history_id = h.history_id
    ) sta ON sta.request_id = rq.request_id`;
  let countQuery = 'SELECT COUNT(*) AS total FROM requests rq LEFT JOIN residents r ON rq.resident_id = r.resident_id JOIN services s ON rq.service_id = s.service_id';
  const conditions = [];
  const params = [];
  const countParams = [];

  if (search) {
    conditions.push('(rq.request_number LIKE ? OR r.first_name LIKE ? OR r.last_name LIKE ? OR s.service_name LIKE ? OR JSON_UNQUOTE(JSON_EXTRACT(rq.form_data, \'$._guest.full_name\')) LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term, term, term);
    countParams.push(term, term, term, term, term);
  }

  if (statusId) {
    conditions.push('rq.status_id = ?');
    params.push(statusId);
    countParams.push(statusId);
  }

  if (residentId) {
    conditions.push('rq.resident_id = ?');
    params.push(residentId);
    countParams.push(residentId);
  }

  if (serviceId) {
    conditions.push('rq.service_id = ?');
    params.push(serviceId);
    countParams.push(serviceId);
  }

  if (dateFrom) {
    const fromVal = dateFrom.includes(' ') || dateFrom.includes('T') ? dateFrom : `${dateFrom} 00:00:00`;
    conditions.push('rq.request_date >= ?');
    params.push(fromVal);
    countParams.push(fromVal);
  }

  if (dateTo) {
    const toVal = dateTo.includes(' ') || dateTo.includes('T') ? dateTo : `${dateTo} 23:59:59`;
    conditions.push('rq.request_date <= ?');
    params.push(toVal);
    countParams.push(toVal);
  }

  if (conditions.length > 0) {
    const whereClause = ' WHERE ' + conditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause;
  }

  const validSortColumns = ['request_id', 'request_number', 'request_date', 'status_id', 'created_at'];
  const column = validSortColumns.includes(sortBy) ? `rq.${sortBy}` : 'rq.request_id';
  const order = sortOrder === 'DESC' ? 'DESC' : 'ASC';
  query += ` ORDER BY ${column} ${order}`;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const offset = (pageNum - 1) * limitNum;
  query += ' LIMIT ? OFFSET ?';
  params.push(limitNum, offset);

  const [rows] = await pool.query(query, params);
  const [countResult] = await pool.query(countQuery, countParams);

  return { requests: parseRequestRows(rows), total: countResult[0].total, page: pageNum, limit: limitNum };
};

const parseRequestRows = (rows) => {
  return rows.map(row => ({
    ...row,
    form_data: parseJsonField(row.form_data),
    service_snapshot: parseJsonField(row.service_snapshot)
  }));
};

const parseJsonField = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return null; }
  }
  return value;
};

const findById = async (requestId) => {
  const [rows] = await pool.query(
    `SELECT rq.*, rs.status_name, s.service_name, s.processing_fee,
      (rq.status_id = 6 AND rq.expires_at IS NOT NULL AND rq.expires_at < NOW()) AS is_expired,
      COALESCE(
        CONCAT(r.first_name, ' ', IFNULL(r.middle_name, ''), ' ', r.last_name),
        JSON_UNQUOTE(JSON_EXTRACT(rq.form_data, '$._guest.full_name'))
      ) AS resident_name,
      COALESCE(r.resident_code, 'GUEST') AS resident_code, r.contact_number, r.email, r.address_line,
      sta.assigned_staff
      FROM requests rq
      JOIN request_statuses rs ON rq.status_id = rs.status_id
      JOIN services s ON rq.service_id = s.service_id
      LEFT JOIN residents r ON rq.resident_id = r.resident_id
      LEFT JOIN (
        SELECT h.request_id, CONCAT(u.first_name, ' ', IFNULL(u.last_name, '')) AS assigned_staff
        FROM request_status_history h
        JOIN users u ON h.changed_by = u.user_id
        JOIN (
          SELECT request_id, MAX(history_id) AS max_history_id
          FROM request_status_history
          GROUP BY request_id
        ) lm ON lm.max_history_id = h.history_id
      ) sta ON sta.request_id = rq.request_id
      WHERE rq.request_id = ?`,
    [requestId]
  );
  const row = rows[0] || null;
  return row ? parseRequestRows([row])[0] : null;
};

const findHistory = async (requestId) => {
  const [rows] = await pool.query(
    `SELECT h.*, rs.status_name, CONCAT(u.first_name, ' ', u.last_name) AS changed_by_name
      FROM request_status_history h
      JOIN request_statuses rs ON h.new_status_id = rs.status_id
      LEFT JOIN users u ON h.changed_by = u.user_id
      WHERE h.request_id = ?
      ORDER BY h.changed_at ASC`,
    [requestId]
  );
  return rows;
};

const generateRequestNumber = async () => {
  const [rows] = await pool.query(
    "SELECT request_number FROM requests ORDER BY request_id DESC LIMIT 1"
  );
  if (rows.length === 0) return 'REQ-2026-00001';
  const lastNum = rows[0].request_number;
  const match = lastNum.match(/REQ-(\d{4})-(\d{5})/);
  if (!match) return 'REQ-2026-00001';
  const num = parseInt(match[2], 10) + 1;
  return `REQ-${match[1]}-${String(num).padStart(5, '0')}`;
};

const create = async ({ residentId, serviceId, statusId, purpose, remarks, requestDate }) => {
  const requestNumber = await generateRequestNumber();
  const [result] = await pool.query(
    'INSERT INTO requests (request_number, resident_id, service_id, status_id, purpose, remarks, request_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [requestNumber, residentId, serviceId, statusId, purpose, remarks, requestDate]
  );
  return { insertId: result.insertId, requestNumber };
};

const update = async (requestId, { serviceId, purpose, remarks, formData }) => {
  const [result] = await pool.query(
    'UPDATE requests SET service_id = ?, purpose = ?, remarks = ?, form_data = ? WHERE request_id = ?',
    [serviceId, purpose, remarks, formData ? JSON.stringify(formData) : null, requestId]
  );
  return result.affectedRows > 0;
};

const updateStatus = async (requestId, statusId, changedBy, remarks, expiresAt = null) => {
  const [current] = await pool.query('SELECT status_id FROM requests WHERE request_id = ?', [requestId]);
  const oldStatusId = current[0]?.status_id || null;

  await pool.query(
    `UPDATE requests SET status_id = ?,
      reviewed_date = IF(? IN (4,8), NOW(), reviewed_date),
      release_date = IF(? = 7, NOW(), release_date),
      expires_at = IF(? = 6, IFNULL(?, expires_at), IF(? = 7, NULL, expires_at))
      WHERE request_id = ?`,
    [statusId, statusId, statusId, statusId, expiresAt, statusId, requestId]
  );

  await pool.query(
    'INSERT INTO request_status_history (request_id, old_status_id, new_status_id, changed_by, remarks) VALUES (?, ?, ?, ?, ?)',
    [requestId, oldStatusId, statusId, changedBy, remarks]
  );

  return true;
};

const getStats = async () => {
  const [total] = await pool.query('SELECT COUNT(*) AS total FROM requests');
  const [pending] = await pool.query('SELECT COUNT(*) AS total FROM requests WHERE status_id = 1');
  const [inProcess] = await pool.query('SELECT COUNT(*) AS total FROM requests WHERE status_id IN (4, 5)');
  const [released] = await pool.query('SELECT COUNT(*) AS total FROM requests WHERE status_id = 7');
  const [byService] = await pool.query(
    'SELECT s.service_name, COUNT(*) AS count FROM requests rq JOIN services s ON rq.service_id = s.service_id GROUP BY s.service_name'
  );

  return {
    total: total[0].total,
    pending: pending[0].total,
    approved: inProcess[0].total,
    released: released[0].total,
    byService
  };
};

module.exports = { findAll, findById, findHistory, create, update, updateStatus, getStats };
