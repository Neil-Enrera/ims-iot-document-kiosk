const pool = require('../config/database');

const findAll = async ({ search, status, barangayId, page, limit, sortBy, sortOrder }) => {
  let query = 'SELECT r.*, b.barangay_name, rc.card_uid, rc.status AS rfid_card_status FROM residents r JOIN barangays b ON r.barangay_id = b.barangay_id LEFT JOIN rfid_cards rc ON rc.resident_id = r.resident_id AND rc.status = "ACTIVE"';
  let countQuery = 'SELECT COUNT(DISTINCT r.resident_id) AS total FROM residents r LEFT JOIN rfid_cards rc ON rc.resident_id = r.resident_id AND rc.status = "ACTIVE"';
  const conditions = [];
  const params = [];
  const countParams = [];

  if (search) {
    conditions.push('(r.resident_code LIKE ? OR r.first_name LIKE ? OR r.last_name LIKE ? OR r.contact_number LIKE ? OR r.address_line LIKE ? OR rc.card_uid LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term, term, term, term);
    countParams.push(term, term, term, term, term, term);
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
    `SELECT r.*, b.barangay_name, rc.card_uid, rc.status AS rfid_card_status, rc.issued_date AS rfid_issued_date, rc.expiration_date AS rfid_expiration_date
     FROM residents r 
     JOIN barangays b ON r.barangay_id = b.barangay_id 
     LEFT JOIN rfid_cards rc ON rc.resident_id = r.resident_id AND rc.status = 'ACTIVE'
     WHERE r.resident_id = ?`,
    [residentId]
  );
  return rows[0] || null;
};

const findByCode = async (residentCode) => {
  const [rows] = await pool.query('SELECT resident_id FROM residents WHERE resident_code = ?', [residentCode]);
  return rows[0] || null;
};

const create = async (data) => {
  const code = data.residentCode ?? data.resident_code;
  const firstName = data.firstName ?? data.first_name;
  const middleName = data.middleName ?? data.middle_name;
  const lastName = data.lastName ?? data.last_name;
  const suffix = data.suffix;
  const birthDate = data.birthDate ?? data.birth_date;
  const birthPlace = data.birthPlace ?? data.birth_place;
  const nationality = data.nationality || 'Filipino';
  const religion = data.religion;
  const occupation = data.occupation;
  const gender = data.gender;
  const civilStatus = data.civilStatus ?? data.civil_status;
  const barangayId = data.barangayId ?? data.barangay_id;
  const houseNumber = data.houseNumber ?? data.house_number;
  const street = data.street;
  const subdivision = data.subdivision;
  const block = data.block;
  const lot = data.lot;
  const purokZone = data.purokZone ?? data.purok_zone;
  const sitio = data.sitio;
  const municipality = data.municipality;
  const province = data.province;
  const zipCode = data.zipCode ?? data.zip_code;
  const contactNumber = data.contactNumber ?? data.contact_number;
  const email = data.email;
  const bloodType = data.bloodType ?? data.blood_type;
  const emergencyContactName = data.emergencyContactName ?? data.emergency_contact_name;
  const emergencyContactNumber = data.emergencyContactNumber ?? data.emergency_contact_number;

  let addressLine = data.addressLine ?? data.address_line;
  if (!addressLine) {
    const rawParts = [
      block ? (String(block).toLowerCase().startsWith('blk') ? block : `Blk ${block}`) : null,
      lot ? (String(lot).toLowerCase().startsWith('lot') ? lot : `Lot ${lot}`) : null,
      houseNumber,
      street,
      subdivision,
      purokZone,
      sitio,
      municipality,
      province
    ].filter(Boolean);

    const uniqueParts = [];
    for (const p of rawParts) {
      if (p && !uniqueParts.some(u => u.toLowerCase() === String(p).toLowerCase())) {
        uniqueParts.push(p);
      }
    }
    addressLine = uniqueParts.join(', ');
  }

  const [result] = await pool.query(
    'INSERT INTO residents (resident_code, first_name, middle_name, last_name, suffix, birth_date, birth_place, nationality, religion, occupation, gender, civil_status, barangay_id, address_line, house_number, street, subdivision, block, lot, purok_zone, sitio, municipality, province, zip_code, contact_number, email, blood_type, emergency_contact_name, emergency_contact_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [code, firstName, middleName, lastName, suffix, birthDate, birthPlace || null, nationality || null, religion || null, occupation || null, gender, civilStatus, barangayId, addressLine || '', houseNumber || null, street || null, subdivision || null, block || null, lot || null, purokZone || null, sitio || null, municipality || null, province || null, zipCode || null, contactNumber || '', email || '', bloodType || null, emergencyContactName || null, emergencyContactNumber || null]
  );
  return result.insertId;
};

const update = async (residentId, data) => {
  const fields = [];
  const params = [];

  const map = {
    first_name: data.firstName ?? data.first_name,
    middle_name: data.middleName ?? data.middle_name,
    last_name: data.lastName ?? data.last_name,
    suffix: data.suffix,
    birth_date: data.birthDate ?? data.birth_date,
    birth_place: data.birthPlace ?? data.birth_place,
    nationality: data.nationality,
    religion: data.religion,
    occupation: data.occupation,
    gender: data.gender,
    civil_status: data.civilStatus ?? data.civil_status,
    barangay_id: data.barangayId ?? data.barangay_id,
    address_line: data.addressLine ?? data.address_line,
    house_number: data.houseNumber ?? data.house_number,
    street: data.street,
    subdivision: data.subdivision,
    block: data.block,
    lot: data.lot,
    purok_zone: data.purokZone ?? data.purok_zone,
    sitio: data.sitio,
    municipality: data.municipality,
    province: data.province,
    zip_code: data.zipCode ?? data.zip_code,
    contact_number: data.contactNumber ?? data.contact_number,
    email: data.email,
    blood_type: data.bloodType ?? data.blood_type,
    emergency_contact_name: data.emergencyContactName ?? data.emergency_contact_name,
    emergency_contact_number: data.emergencyContactNumber ?? data.emergency_contact_number
  };

  // If individual address parts are provided and address_line is not explicitly given, compose address_line
  if (data.addressLine === undefined && data.address_line === undefined) {
    if (data.subdivision !== undefined || data.block !== undefined || data.lot !== undefined || data.street !== undefined || data.purok_zone !== undefined || data.purokZone !== undefined || data.house_number !== undefined || data.houseNumber !== undefined) {
      const rawParts = [
        map.block ? (String(map.block).toLowerCase().startsWith('blk') ? map.block : `Blk ${map.block}`) : null,
        map.lot ? (String(map.lot).toLowerCase().startsWith('lot') ? map.lot : `Lot ${map.lot}`) : null,
        map.house_number,
        map.street,
        map.subdivision,
        map.purok_zone,
        map.sitio,
        map.municipality,
        map.province
      ].filter(Boolean);

      const uniqueParts = [];
      for (const p of rawParts) {
        if (p && !uniqueParts.some(u => u.toLowerCase() === String(p).toLowerCase())) {
          uniqueParts.push(p);
        }
      }
      if (uniqueParts.length > 0) {
        map.address_line = uniqueParts.join(', ');
      }
    }
  }

  const nullableCols = ['birth_place', 'house_number', 'street', 'subdivision', 'block', 'lot', 'purok_zone', 'sitio', 'municipality', 'province', 'zip_code', 'blood_type', 'emergency_contact_name', 'emergency_contact_number'];

  for (const [col, val] of Object.entries(map)) {
    if (val !== undefined) {
      fields.push(`${col} = ?`);
      params.push(val === '' && nullableCols.includes(col) ? null : val);
    }
  }

  if (fields.length === 0) return true;
  params.push(residentId);
  const [result] = await pool.query(`UPDATE residents SET ${fields.join(', ')} WHERE resident_id = ?`, params);
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
