const pool = require('../config/database');

// Statuses considered ACTIVE for duplicate prevention.
// Released (7), Rejected (8) and Cancelled (9) are terminal /
// non-active and follow the service's policy instead.
const ACTIVE_STATUS_IDS = [1, 2, 3, 4, 5, 6, 10, 11];
const RETURNED_STATUS_ID = 10;

const parseJsonField = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return null; }
  }
  return value;
};

const generateTransactionNumber = async () => {
  const year = new Date().getFullYear();
  const [rows] = await pool.query(
    "SELECT transaction_number FROM transactions ORDER BY transaction_id DESC LIMIT 1"
  );
  if (rows.length === 0) return `TXN-${year}-00001`;
  const lastNum = rows[0].transaction_number;
  const match = lastNum.match(/TXN-(\d{4})-(\d{5})/);
  if (!match) return `TXN-${year}-00001`;
  const num = parseInt(match[2], 10) + 1;
  return `TXN-${match[1]}-${String(num).padStart(5, '0')}`;
};

const findByIdempotencyKey = async (key) => {
  if (!key) return null;
  const [rows] = await pool.query(
    'SELECT * FROM transactions WHERE idempotency_key = ? LIMIT 1',
    [key]
  );
  return rows[0] || null;
};

// Runs inside the caller's DB transaction (conn).
const createTransaction = async (conn, { transactionNumber, residentId, guestSnapshot, idempotencyKey }) => {
  const [result] = await conn.query(
    `INSERT INTO transactions (transaction_number, resident_id, guest_snapshot, idempotency_key)
     VALUES (?, ?, ?, ?)`,
    [
      transactionNumber,
      residentId || null,
      guestSnapshot ? JSON.stringify(guestSnapshot) : null,
      idempotencyKey || null
    ]
  );
  return result.insertId;
};

// Full service rows (including policy flags) for the given ids.
const findServicesByIds = async (serviceIds) => {
  if (!serviceIds || serviceIds.length === 0) return [];
  const placeholders = serviceIds.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT service_id, service_name, description, requirements, form_fields,
            processing_fee, requires_photo, template_path, is_active,
            can_combine_with_others, allow_multiple_active_requests, allow_new_request_after_release
     FROM services WHERE service_id IN (${placeholders})`,
    serviceIds
  );
  return rows.map(s => ({
    ...s,
    requirements: parseJsonField(s.requirements),
    form_fields: parseJsonField(s.form_fields),
    can_combine_with_others: s.can_combine_with_others !== 0,
    allow_multiple_active_requests: s.allow_multiple_active_requests !== 0,
    allow_new_request_after_release: s.allow_new_request_after_release !== 0
  }));
};

const findResidentForSubmission = async (residentId) => {
  const [rows] = await pool.query(
    `SELECT resident_id, resident_code, first_name, middle_name, last_name, status
     FROM residents WHERE resident_id = ?`,
    [residentId]
  );
  return rows[0] || null;
};

// Pre-transaction submissions stored the key on the request row only. When a
// retry arrives with a key that already belongs to a legacy (transaction-less)
// request, this returns that request so the caller can return it as a duplicate.
const findLegacyRequestByKey = async (key) => {
  if (!key) return null;
  const [rows] = await pool.query(
    `SELECT rq.request_id, rq.request_number, rq.request_date, rq.service_id,
            COALESCE(s.service_name, JSON_UNQUOTE(JSON_EXTRACT(rq.service_snapshot, '$.service_name'))) AS service_name
     FROM requests rq
     LEFT JOIN services s ON rq.service_id = s.service_id
     WHERE rq.idempotency_key = ? AND rq.transaction_id IS NULL
     ORDER BY rq.request_id DESC LIMIT 1`,
    [key]
  );
  return rows[0] || null;
};

const findRequestsByTransaction = async (transactionId) => {  const [rows] = await pool.query(
    `SELECT rq.request_id, rq.request_number, rq.service_id, rq.status_id,
            rq.request_date, rq.form_data,
            COALESCE(s.service_name, JSON_UNQUOTE(JSON_EXTRACT(rq.service_snapshot, '$.service_name'))) AS service_name,
            rs.status_name
     FROM requests rq
     JOIN request_statuses rs ON rq.status_id = rs.status_id
     LEFT JOIN services s ON rq.service_id = s.service_id
     WHERE rq.transaction_id = ?
     ORDER BY rq.request_id ASC`,
    [transactionId]
  );
  return rows.map(r => ({ ...r, form_data: parseJsonField(r.form_data) }));
};

const findById = async (transactionId) => {
  const [rows] = await pool.query('SELECT * FROM transactions WHERE transaction_id = ?', [transactionId]);
  const transaction = rows[0] || null;
  if (!transaction) return null;
  const requests = await findRequestsByTransaction(transactionId);
  return { ...transaction, requests };
};

const findByNumber = async (transactionNumber) => {
  const [rows] = await pool.query('SELECT * FROM transactions WHERE transaction_number = ?', [transactionNumber]);
  const transaction = rows[0] || null;
  if (!transaction) return null;
  const requests = await findRequestsByTransaction(transaction.transaction_id);
  return { ...transaction, requests };
};

// ---- Duplicate detection ------------------------------------------------

// Active requests for a (resident, service): the source of truth for
// "resident already has an active request for this service".
const findActiveByResidentService = async (residentId, serviceId) => {
  const placeholders = ACTIVE_STATUS_IDS.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT rq.request_id, rq.request_number, rq.status_id, rq.request_date,
            rs.status_name
     FROM requests rq
     JOIN request_statuses rs ON rq.status_id = rs.status_id
     WHERE rq.resident_id = ? AND rq.service_id = ? AND rq.status_id IN (${placeholders})
     ORDER BY rq.request_id DESC`,
    [residentId, serviceId, ...ACTIVE_STATUS_IDS]
  );
  return rows;
};

// Latest request (any status) for the (resident, service) so the kiosk can
// distinguish "previously released" from "never requested".
const findLatestByResidentService = async (residentId, serviceId) => {
  const [rows] = await pool.query(
    `SELECT rq.request_id, rq.request_number, rq.status_id, rq.request_date,
            rs.status_name
     FROM requests rq
     JOIN request_statuses rs ON rq.status_id = rs.status_id
     WHERE rq.resident_id = ? AND rq.service_id = ?
     ORDER BY rq.request_id DESC LIMIT 1`,
    [residentId, serviceId]
  );
  return rows[0] || null;
};

// POSSIBLE duplicate for a GUEST session. Identity is never guaranteed for
// guests, so matching is advisory, never a hard block. We match on the
// temporary identity captured in the request: full_name plus at least one of
// birth_date / contact_number.
const findPossibleGuestMatches = async (serviceId, guestInfo) => {
  const fullName = String(guestInfo.full_name || '').trim().toLowerCase();
  if (!fullName) return [];
  const birthDate = guestInfo.birth_date || null;
  const contactNumber = guestInfo.contact_number || null;

  const [rows] = await pool.query(
    `SELECT rq.request_id, rq.request_number, rq.status_id, rq.request_date,
            rs.status_name,
            JSON_UNQUOTE(JSON_EXTRACT(rq.form_data, '$._guest.full_name')) AS guest_full_name,
            JSON_UNQUOTE(JSON_EXTRACT(rq.form_data, '$._guest.birth_date')) AS guest_birth_date,
            JSON_UNQUOTE(JSON_EXTRACT(rq.form_data, '$._guest.contact_number')) AS guest_contact_number
     FROM requests rq
     JOIN request_statuses rs ON rq.status_id = rs.status_id
     WHERE rq.service_id = ? AND rq.resident_id IS NULL
       AND JSON_UNQUOTE(JSON_EXTRACT(rq.form_data, '$._guest.full_name')) IS NOT NULL
     ORDER BY rq.request_id DESC`,
    [serviceId]
  );

  return rows.filter((row) => {
    if ((row.guest_full_name || '').trim().toLowerCase() !== fullName) return false;
    if (birthDate && row.guest_birth_date && String(row.guest_birth_date).slice(0, 10) === String(birthDate).slice(0, 10)) return true;
    if (contactNumber && row.guest_contact_number && String(row.guest_contact_number).trim() === String(contactNumber).trim()) return true;
    return false;
  });
};

module.exports = {
  ACTIVE_STATUS_IDS,
  RETURNED_STATUS_ID,
  generateTransactionNumber,
  findByIdempotencyKey,
  createTransaction,
  findById,
  findByNumber,
  findRequestsByTransaction,
  findLegacyRequestByKey,
  findServicesByIds,
  findResidentForSubmission,
  findActiveByResidentService,
  findLatestByResidentService,
  findPossibleGuestMatches
};