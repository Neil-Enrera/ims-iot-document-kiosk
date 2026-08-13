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

module.exports = { searchResidents, findResidentById };
