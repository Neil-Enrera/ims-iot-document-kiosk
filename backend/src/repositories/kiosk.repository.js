const pool = require('../config/database');

const searchResidents = async (search, limit = 20) => {
  if (!search || search.trim().length < 2) return [];
  const term = `%${search.trim()}%`;
  const [rows] = await pool.query(
    `SELECT resident_id, resident_code, first_name, middle_name, last_name, suffix,
            birth_date, gender, civil_status, blood_type, occupation, address_line, contact_number,
            email, emergency_contact_name, emergency_contact_number, photo, status,
            barangay_id
     FROM residents
     WHERE status = 'ACTIVE'
       AND (resident_code LIKE ? OR first_name LIKE ? OR last_name LIKE ?
            OR CONCAT(first_name, ' ', last_name) LIKE ?
            OR contact_number LIKE ? OR address_line LIKE ?)
     ORDER BY first_name, last_name
     LIMIT ?`,
    [term, term, term, term, term, term, limit]
  );
  return rows;
};

const findResidentById = async (id) => {
  const [[row]] = await pool.query(
    `SELECT resident_id, resident_code, first_name, middle_name, last_name, suffix,
            birth_date, gender, civil_status, blood_type, occupation, address_line, contact_number,
            email, emergency_contact_name, emergency_contact_number, photo, status,
            barangay_id
     FROM residents
     WHERE resident_id = ? AND status = 'ACTIVE'`,
    [id]
  );
  return row || null;
};

// Service / application history for a resident (kiosk profile screen).
// Reads real rows from the requests table; only returns rows owned by the
// authenticated resident. request_number serves as the public reference number.
const findResidentHistory = async (residentId, limit = 20) => {
  const [rows] = await pool.query(
    `SELECT rq.request_id,
            rq.request_number AS reference_number,
            rq.request_date,
            COALESCE(
              JSON_UNQUOTE(JSON_EXTRACT(rq.service_snapshot, '$.service_name')),
              sv.service_name
            ) AS service_name,
            rs.status_name
     FROM requests rq
     JOIN request_statuses rs ON rq.status_id = rs.status_id
     LEFT JOIN services sv ON rq.service_id = sv.service_id
     WHERE rq.resident_id = ?
     ORDER BY rq.request_date DESC, rq.request_id DESC
     LIMIT ?`,
    [residentId, limit]
  );
  return rows;
};

module.exports = { searchResidents, findResidentById, findResidentHistory };
