const pool = require('../config/database');

const findAll = async ({ search, status, page, limit, sortBy, sortOrder }) => {
  let query = 'SELECT a.*, CONCAT(IFNULL(u.first_name, ""), " ", IFNULL(u.last_name, "")) AS reviewed_by_name FROM barangay_id_applications a LEFT JOIN users u ON a.reviewed_by = u.user_id';
  let countQuery = 'SELECT COUNT(*) AS total FROM barangay_id_applications a';
  const conditions = [];
  const params = [];
  const countParams = [];

  if (search) {
    conditions.push('(a.application_number LIKE ? OR a.first_name LIKE ? OR a.last_name LIKE ? OR a.address_line LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term, term);
    countParams.push(term, term, term, term);
  }

  if (status) {
    conditions.push('a.status = ?');
    params.push(status);
    countParams.push(status);
  }

  if (conditions.length > 0) {
    const whereClause = ' WHERE ' + conditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause;
  }

  const validSortColumns = ['application_id', 'application_number', 'first_name', 'last_name', 'status', 'created_at'];
  const column = validSortColumns.includes(sortBy) ? `a.${sortBy}` : 'a.application_id';
  const order = sortOrder === 'DESC' ? 'DESC' : 'ASC';
  query += ` ORDER BY ${column} ${order}`;

  const offset = (page - 1) * limit;
  query += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await pool.query(query, params);
  const [countResult] = await pool.query(countQuery, countParams);

  return { applications: parseRows(rows), total: countResult[0].total, page, limit };
};

const findById = async (applicationId) => {
  const [rows] = await pool.query(
    `SELECT a.*, CONCAT(IFNULL(u.first_name, ""), " ", IFNULL(u.last_name, "")) AS reviewed_by_name
     FROM barangay_id_applications a
     LEFT JOIN users u ON a.reviewed_by = u.user_id
     WHERE a.application_id = ?`,
    [applicationId]
  );
  const row = rows[0] || null;
  return row ? parseRows([row])[0] : null;
};

const findByNumber = async (applicationNumber) => {
  const [rows] = await pool.query(
    'SELECT * FROM barangay_id_applications WHERE application_number = ?',
    [applicationNumber]
  );
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO barangay_id_applications
       (application_number, first_name, middle_name, last_name, suffix, birth_date,
        gender, civil_status, occupation, blood_type, address_line, contact_number,
        email, emergency_contact_name, emergency_contact_number, photo, signature, form_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.applicationNumber,
      data.firstName, data.middleName || null, data.lastName, data.suffix || null,
      data.birthDate || null, data.gender || null, data.civilStatus || null,
      data.occupation || null, data.bloodType || null, data.addressLine,
      data.contactNumber || null, data.email || null,
      data.emergencyContactName || null, data.emergencyContactNumber || null,
      data.photo || null, data.signature || null,
      data.formData ? JSON.stringify(data.formData) : null
    ]
  );
  return result.insertId;
};

const updateStatus = async (applicationId, status, reviewedBy, remarks, residentId = null) => {
  const [result] = await pool.query(
    `UPDATE barangay_id_applications
     SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_remarks = ?,
         resident_id = COALESCE(?, resident_id)
     WHERE application_id = ?`,
    [status, reviewedBy, remarks || null, residentId, applicationId]
  );
  return result.affectedRows > 0;
};

const generateApplicationNumber = async () => {
  const [rows] = await pool.query(
    "SELECT application_number FROM barangay_id_applications ORDER BY application_id DESC LIMIT 1"
  );
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  if (rows.length === 0) return `APP-${ymd}-000001`;
  const last = rows[0].application_number;
  const match = last.match(/APP-\d{8}-(\d{6})/);
  const seq = match ? parseInt(match[1], 10) + 1 : 1;
  return `APP-${ymd}-${String(seq).padStart(6, '0')}`;
};

const parseRows = (rows) => {
  return rows.map(row => ({
    ...row,
    form_data: parseJsonField(row.form_data)
  }));
};

const parseJsonField = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return null; }
  }
  return value;
};

module.exports = { findAll, findById, findByNumber, create, updateStatus, generateApplicationNumber };
