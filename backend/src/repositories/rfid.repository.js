const pool = require('../config/database');

const findAll = async ({ search, status, residentId, resident_id, page = 1, limit = 20, sortBy, sortOrder }) => {
  const targetResidentId = residentId || resident_id;

  let query;
  let countQuery;
  const conditions = [];
  const params = [];
  const countParams = [];

  if (targetResidentId) {
    query = 'SELECT rc.*, r.first_name, r.middle_name, r.last_name, r.suffix, r.resident_code FROM rfid_cards rc JOIN residents r ON rc.resident_id = r.resident_id';
    countQuery = 'SELECT COUNT(*) AS total FROM rfid_cards rc JOIN residents r ON rc.resident_id = r.resident_id';
    conditions.push('rc.resident_id = ?');
    params.push(targetResidentId);
    countParams.push(targetResidentId);
  } else {
    query = `
      SELECT 
        r.resident_id,
        r.resident_code,
        r.first_name,
        r.middle_name,
        r.last_name,
        r.suffix,
        r.contact_number,
        r.status AS resident_status,
        rc.rfid_card_id,
        rc.card_uid,
        rc.status AS card_status,
        rc.status AS status,
        rc.issued_date,
        rc.expiration_date,
        rc.created_at,
        CASE 
          WHEN rc.card_uid IS NOT NULL AND UPPER(rc.status) = 'ACTIVE' THEN 'Registered' 
          ELSE 'Not Registered' 
        END AS registration_status
      FROM residents r
      LEFT JOIN (
        SELECT rc1.*
        FROM rfid_cards rc1
        INNER JOIN (
          SELECT resident_id, 
                 COALESCE(
                   MAX(CASE WHEN UPPER(status) = 'ACTIVE' THEN rfid_card_id END),
                   MAX(rfid_card_id)
                 ) AS best_id
          FROM rfid_cards
          GROUP BY resident_id
        ) rc_best ON rc1.rfid_card_id = rc_best.best_id
      ) rc ON rc.resident_id = r.resident_id
    `;
    countQuery = `
      SELECT COUNT(*) AS total
      FROM residents r
      LEFT JOIN (
        SELECT rc1.*
        FROM rfid_cards rc1
        INNER JOIN (
          SELECT resident_id, 
                 COALESCE(
                   MAX(CASE WHEN UPPER(status) = 'ACTIVE' THEN rfid_card_id END),
                   MAX(rfid_card_id)
                 ) AS best_id
          FROM rfid_cards
          GROUP BY resident_id
        ) rc_best ON rc1.rfid_card_id = rc_best.best_id
      ) rc ON rc.resident_id = r.resident_id
    `;
  }

  if (search) {
    conditions.push('(rc.card_uid LIKE ? OR r.first_name LIKE ? OR r.last_name LIKE ? OR r.resident_code LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term, term);
    countParams.push(term, term, term, term);
  }

  if (status) {
    const s = status.toUpperCase();
    if (s === 'REGISTERED') {
      conditions.push("rc.card_uid IS NOT NULL AND UPPER(rc.status) = 'ACTIVE'");
    } else if (s === 'NOT_REGISTERED' || s === 'NOT REGISTERED') {
      conditions.push("(rc.card_uid IS NULL OR UPPER(rc.status) != 'ACTIVE')");
    } else if (s === 'ACTIVE') {
      conditions.push("UPPER(rc.status) = 'ACTIVE'");
    } else if (s === 'SUSPENDED') {
      conditions.push("UPPER(rc.status) = 'SUSPENDED'");
    } else if (s === 'REVOKED' || s === 'CANCELLED') {
      conditions.push("UPPER(rc.status) IN ('REVOKED', 'CANCELLED')");
    } else if (s !== 'ALL' && s !== '') {
      conditions.push('rc.status = ?');
      params.push(status);
      countParams.push(status);
    }
  }

  if (conditions.length > 0) {
    const whereClause = ' WHERE ' + conditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause;
  }

  const validSortMap = {
    'resident_name': 'r.last_name',
    'resident_code': 'r.resident_code',
    'card_uid': 'rc.card_uid',
    'status': 'rc.status',
    'registration_status': "CASE WHEN rc.card_uid IS NOT NULL AND UPPER(rc.status) = 'ACTIVE' THEN 0 ELSE 1 END",
    'issued_date': 'rc.issued_date',
    'rfid_card_id': 'rc.rfid_card_id'
  };

  if (sortBy && validSortMap[sortBy]) {
    const column = validSortMap[sortBy];
    const order = sortOrder === 'DESC' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${column} ${order}`;
  } else {
    // Default: Show Registered residents first, then sort by last name, first name
    query += ` ORDER BY CASE WHEN rc.card_uid IS NOT NULL AND UPPER(rc.status) = 'ACTIVE' THEN 0 ELSE 1 END, r.last_name ASC, r.first_name ASC`;
  }

  const offset = (page - 1) * limit;
  query += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await pool.query(query, params);
  const [countResult] = await pool.query(countQuery, countParams);

  const cards = rows.map(row => {
    const parts = [
      row.last_name ? `${row.last_name},` : '',
      row.first_name,
      row.middle_name ? `${row.middle_name.charAt(0)}.` : '',
      row.suffix
    ].filter(Boolean);
    return {
      ...row,
      resident_name: parts.join(' ') || '-'
    };
  });

  return { cards, total: countResult[0].total, page, limit };
};

const findById = async (rfidCardId) => {
  const [rows] = await pool.query(
    'SELECT rc.*, r.first_name, r.last_name, r.resident_code FROM rfid_cards rc JOIN residents r ON rc.resident_id = r.resident_id WHERE rc.rfid_card_id = ?',
    [rfidCardId]
  );
  return rows[0] || null;
};

const findByUid = async (cardUid) => {
  const cleanUid = cardUid.replace(/[:\s-]/g, '').toUpperCase();
  let reversedUid = cleanUid;
  if (cleanUid.length === 8) {
    reversedUid = cleanUid.match(/.{1,2}/g).reverse().join('');
  } else if (cleanUid.length === 14) {
    reversedUid = cleanUid.match(/.{1,2}/g).reverse().join('');
  }

  const [rows] = await pool.query(
    `SELECT rc.*, r.first_name, r.middle_name, r.last_name, r.suffix, r.resident_code,
            r.birth_date, r.birth_place, r.nationality, r.religion, r.gender, r.civil_status, r.blood_type, r.occupation,
            r.contact_number, r.email, r.address_line, r.house_number, r.street, r.subdivision, r.block, r.lot, r.purok_zone, r.sitio, r.municipality, r.province, r.zip_code,
            r.emergency_contact_name, r.emergency_contact_number,
            r.photo AS resident_photo, r.status AS resident_status, r.barangay_id AS resident_barangay_id
     FROM rfid_cards rc JOIN residents r ON rc.resident_id = r.resident_id 
     WHERE UPPER(REPLACE(REPLACE(REPLACE(rc.card_uid, ':', ''), ' ', ''), '-', '')) IN (?, ?)
     ORDER BY (CASE WHEN UPPER(rc.status) = 'ACTIVE' THEN 1 ELSE 2 END), rc.rfid_card_id DESC`,
    [cleanUid, reversedUid]
  );
  return rows[0] || null;
};

const findActiveByResident = async (residentId) => {
  const [rows] = await pool.query(
    "SELECT * FROM rfid_cards WHERE resident_id = ? AND status = 'ACTIVE'",
    [residentId]
  );
  return rows[0] || null;
};

const create = async ({ residentId, cardUid, issuedDate, expirationDate }) => {
  const [result] = await pool.query(
    'INSERT INTO rfid_cards (resident_id, card_uid, issued_date, expiration_date) VALUES (?, ?, ?, ?)',
    [residentId, cardUid, issuedDate, expirationDate]
  );
  return result.insertId;
};

const updateStatus = async (rfidCardId, status) => {
  const [result] = await pool.query('UPDATE rfid_cards SET status = ? WHERE rfid_card_id = ?', [status, rfidCardId]);
  return result.affectedRows > 0;
};

const replace = async (rfidCardId, newCardUid, expirationDate) => {
  await pool.query("UPDATE rfid_cards SET status = 'CANCELLED' WHERE rfid_card_id = ?", [rfidCardId]);
  const oldCard = await findById(rfidCardId);
  const newId = await create({ residentId: oldCard.resident_id, cardUid: newCardUid, issuedDate: new Date().toISOString().split('T')[0], expirationDate });
  return newId;
};

const remove = async (rfidCardId) => {
  const [result] = await pool.query('DELETE FROM rfid_cards WHERE rfid_card_id = ?', [rfidCardId]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, findByUid, findActiveByResident, create, updateStatus, replace, remove };
