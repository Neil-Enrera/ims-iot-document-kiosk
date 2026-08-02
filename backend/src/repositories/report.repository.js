const pool = require('../config/database');

const getRequestsReport = async ({ dateFrom, dateTo, serviceId, statusId, residentId, page, limit }) => {
  let query = `SELECT rq.request_number, rq.request_date, rs.status_name, s.service_name, s.processing_fee,
    CONCAT(r.first_name, ' ', r.last_name) AS resident_name, r.resident_code
    FROM requests rq
    JOIN request_statuses rs ON rq.status_id = rs.status_id
    JOIN services s ON rq.service_id = s.service_id
    JOIN residents r ON rq.resident_id = r.resident_id`;
  let countQuery = 'SELECT COUNT(*) AS total FROM requests rq';
  const conditions = [];
  const params = [];
  const countParams = [];

  if (dateFrom) { conditions.push('rq.request_date >= ?'); params.push(dateFrom); countParams.push(dateFrom); }
  if (dateTo) { conditions.push('rq.request_date <= ?'); params.push(dateTo); countParams.push(dateTo); }
  if (serviceId) { conditions.push('rq.service_id = ?'); params.push(serviceId); countParams.push(serviceId); }
  if (statusId) { conditions.push('rq.status_id = ?'); params.push(statusId); countParams.push(statusId); }
  if (residentId) { conditions.push('rq.resident_id = ?'); params.push(residentId); countParams.push(residentId); }

  if (conditions.length > 0) {
    const whereClause = ' WHERE ' + conditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause;
  }

  query += ' ORDER BY rq.request_date DESC';
  const offset = (page - 1) * limit;
  query += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await pool.query(query, params);
  const [countResult] = await pool.query(countQuery, countParams);

  return { reports: rows, total: countResult[0].total, page, limit };
};

const getResidentsReport = async ({ dateFrom, dateTo, status, page, limit }) => {
  let query = `SELECT r.resident_code, r.first_name, r.last_name, r.birth_date, r.gender, r.status,
    b.barangay_name, r.created_at
    FROM residents r JOIN barangays b ON r.barangay_id = b.barangay_id`;
  let countQuery = 'SELECT COUNT(*) AS total FROM residents r';
  const conditions = [];
  const params = [];
  const countParams = [];

  if (dateFrom) { conditions.push('r.created_at >= ?'); params.push(dateFrom); countParams.push(dateFrom); }
  if (dateTo) { conditions.push('r.created_at <= ?'); params.push(dateTo); countParams.push(dateTo); }
  if (status) { conditions.push('r.status = ?'); params.push(status); countParams.push(status); }

  if (conditions.length > 0) {
    const whereClause = ' WHERE ' + conditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause;
  }

  query += ' ORDER BY r.created_at DESC';
  const offset = (page - 1) * limit;
  query += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await pool.query(query, params);
  const [countResult] = await pool.query(countQuery, countParams);

  return { reports: rows, total: countResult[0].total, page, limit };
};

module.exports = { getRequestsReport, getResidentsReport };
