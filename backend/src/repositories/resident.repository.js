const pool = require('../config/database');

const findAll = async ({ search, status, barangayId, page, limit, sortBy, sortOrder }) => {
  let query = 'SELECT r.*, b.barangay_name FROM residents r JOIN barangays b ON r.barangay_id = b.barangay_id';
  let countQuery = 'SELECT COUNT(*) AS total FROM residents r';
  const conditions = [];
  const params = [];
  const countParams = [];

  if (search) {
    conditions.push('(r.resident_code LIKE ? OR r.first_name LIKE ? OR r.last_name LIKE ? OR r.contact_number LIKE ? OR r.address_line LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term, term, term);
    countParams.push(term, term, term, term, term);
  }

  if (status) {
    conditions.push('r.status = ?');
    params.push(status);
    countParams.push(status);
  }

  if (barangayId) {
    conditions.push('r.barangay_id = ?');
    params.push(barangayId);
    countParams.push(barangayId);
  }

  if (conditions.length > 0) {
    const whereClause = ' WHERE ' + conditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause;
  }

  const validSortColumns = ['resident_id', 'resident_code', 'first_name', 'last_name', 'birth_date', 'status', 'created_at'];
  const column = validSortColumns.includes(sortBy) ? `r.${sortBy}` : 'r.resident_id';
  const order = sortOrder === 'DESC' ? 'DESC' : 'ASC';
  query += ` ORDER BY ${column} ${order}`;

  const offset = (page - 1) * limit;
  query += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await pool.query(query, params);
  const [countResult] = await pool.query(countQuery, countParams);

  return { residents: rows, total: countResult[0].total, page, limit };
};

const findById = async (residentId) => {
  const [rows] = await pool.query(
    'SELECT r.*, b.barangay_name FROM residents r JOIN barangays b ON r.barangay_id = b.barangay_id WHERE r.resident_id = ?',
    [residentId]
  );
  return rows[0] || null;
};

const findByCode = async (residentCode) => {
  const [rows] = await pool.query('SELECT resident_id FROM residents WHERE resident_code = ?', [residentCode]);
  return rows[0] || null;
};

const create = async ({ residentCode, firstName, middleName, lastName, suffix, birthDate, gender, civilStatus, barangayId, addressLine, contactNumber, email, bloodType, emergencyContactName, emergencyContactNumber }) => {
  const [result] = await pool.query(
    'INSERT INTO residents (resident_code, first_name, middle_name, last_name, suffix, birth_date, gender, civil_status, barangay_id, address_line, contact_number, email, blood_type, emergency_contact_name, emergency_contact_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [residentCode, firstName, middleName, lastName, suffix, birthDate, gender, civilStatus, barangayId, addressLine, contactNumber, email, bloodType || null, emergencyContactName || null, emergencyContactNumber || null]
  );
  return result.insertId;
};

const update = async (residentId, { firstName, middleName, lastName, suffix, birthDate, gender, civilStatus, barangayId, addressLine, contactNumber, email, bloodType, emergencyContactName, emergencyContactNumber }) => {
  const [result] = await pool.query(
    'UPDATE residents SET first_name = ?, middle_name = ?, last_name = ?, suffix = ?, birth_date = ?, gender = ?, civil_status = ?, barangay_id = ?, address_line = ?, contact_number = ?, email = ?, blood_type = ?, emergency_contact_name = ?, emergency_contact_number = ? WHERE resident_id = ?',
    [firstName, middleName, lastName, suffix, birthDate, gender, civilStatus, barangayId, addressLine, contactNumber, email, bloodType || null, emergencyContactName || null, emergencyContactNumber || null, residentId]
  );
  return result.affectedRows > 0;
};

const updateStatus = async (residentId, status) => {
  const [result] = await pool.query('UPDATE residents SET status = ? WHERE resident_id = ?', [status, residentId]);
  return result.affectedRows > 0;
};

const updatePhoto = async (residentId, photoPath) => {
  const [result] = await pool.query('UPDATE residents SET photo = ? WHERE resident_id = ?', [photoPath, residentId]);
  return result.affectedRows > 0;
};

const remove = async (residentId) => {
  const [result] = await pool.query('DELETE FROM residents WHERE resident_id = ?', [residentId]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, findByCode, create, update, updateStatus, updatePhoto, remove };
