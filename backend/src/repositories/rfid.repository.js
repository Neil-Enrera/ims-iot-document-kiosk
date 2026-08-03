const pool = require('../config/database');

const findAll = async ({ search, status, page, limit, sortBy, sortOrder }) => {
  let query = 'SELECT rc.*, r.first_name, r.last_name, r.resident_code FROM rfid_cards rc JOIN residents r ON rc.resident_id = r.resident_id';
  let countQuery = 'SELECT COUNT(*) AS total FROM rfid_cards rc';
  const conditions = [];
  const params = [];
  const countParams = [];

  if (search) {
    conditions.push('(rc.card_uid LIKE ? OR r.first_name LIKE ? OR r.last_name LIKE ? OR r.resident_code LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term, term);
    countParams.push(term, term, term, term);
  }

  if (status) {
    conditions.push('rc.status = ?');
    params.push(status);
    countParams.push(status);
  }

  if (conditions.length > 0) {
    const whereClause = ' WHERE ' + conditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause;
  }

  const validSortColumns = ['rfid_card_id', 'card_uid', 'status', 'issued_date', 'created_at'];
  const column = validSortColumns.includes(sortBy) ? `rc.${sortBy}` : 'rc.rfid_card_id';
  const order = sortOrder === 'DESC' ? 'DESC' : 'ASC';
  query += ` ORDER BY ${column} ${order}`;

  const offset = (page - 1) * limit;
  query += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await pool.query(query, params);
  const [countResult] = await pool.query(countQuery, countParams);

  return { cards: rows, total: countResult[0].total, page, limit };
};

const findById = async (rfidCardId) => {
  const [rows] = await pool.query(
    'SELECT rc.*, r.first_name, r.last_name, r.resident_code FROM rfid_cards rc JOIN residents r ON rc.resident_id = r.resident_id WHERE rc.rfid_card_id = ?',
    [rfidCardId]
  );
  return rows[0] || null;
};

const findByUid = async (cardUid) => {
  const [rows] = await pool.query(
    `SELECT rc.*, r.first_name, r.middle_name, r.last_name, r.suffix, r.resident_code,
            r.birth_date, r.gender, r.civil_status, r.blood_type,
            r.contact_number, r.email, r.address_line,
            r.emergency_contact_name, r.emergency_contact_number
     FROM rfid_cards rc JOIN residents r ON rc.resident_id = r.resident_id WHERE rc.card_uid = ?`,
    [cardUid]
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
