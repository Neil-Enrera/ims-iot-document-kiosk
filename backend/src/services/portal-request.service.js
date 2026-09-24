const pool = require('../config/database');
const transactionService = require('./transaction.service');
const notificationService = require('./notification.service');
const sseManager = require('./notification-sse');
const auditRepository = require('../repositories/audit.repository');

const parseJson = (val) => {
  if (!val) return null;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return null; }
  }
  return val;
};

const getResidentRequests = async (residentId, { page = 1, limit = 10, statusId, search } = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const offset = (pageNum - 1) * limitNum;

  let query = `
    SELECT rq.request_id, rq.transaction_id, rq.request_number, rq.resident_id,
           rq.service_id, rq.source, rq.status_id, rs.status_name,
           s.service_name, s.processing_fee, s.description AS service_description,
           rq.purpose, rq.remarks, rq.form_data, rq.service_snapshot,
           rq.request_date, rq.reviewed_date, rq.release_date, rq.expires_at,
           rq.created_at, rq.updated_at
    FROM requests rq
    JOIN request_statuses rs ON rq.status_id = rs.status_id
    JOIN services s ON rq.service_id = s.service_id
    WHERE rq.resident_id = ?
  `;
  let countQuery = `
    SELECT COUNT(*) AS total
    FROM requests rq
    JOIN services s ON rq.service_id = s.service_id
    WHERE rq.resident_id = ?
  `;

  const params = [residentId];
  const countParams = [residentId];

  if (statusId) {
    query += ' AND rq.status_id = ?';
    countQuery += ' AND rq.status_id = ?';
    params.push(statusId);
    countParams.push(statusId);
  }

  if (search) {
    const term = `%${search}%`;
    query += ' AND (rq.request_number LIKE ? OR s.service_name LIKE ?)';
    countQuery += ' AND (rq.request_number LIKE ? OR s.service_name LIKE ?)';
    params.push(term, term);
    countParams.push(term, term);
  }

  query += ' ORDER BY rq.request_id DESC LIMIT ? OFFSET ?';
  params.push(limitNum, offset);

  const [rows] = await pool.query(query, params);
  const [countResult] = await pool.query(countQuery, countParams);

  const requests = rows.map(r => {
    const formData = parseJson(r.form_data) || {};
    const serviceSnapshot = parseJson(r.service_snapshot) || {};
    return {
      ...r,
      form_data: formData,
      service_snapshot: serviceSnapshot,
      requirements: formData._requirements || [],
      correction_remarks: r.status_id === 10 ? (r.remarks || formData._correction_remarks || null) : null
    };
  });

  return {
    requests,
    total: countResult[0]?.total || 0,
    page: pageNum,
    limit: limitNum
  };
};

const getResidentRequestById = async (residentId, requestId) => {
  const [rows] = await pool.query(
    `SELECT rq.request_id, rq.transaction_id, rq.request_number, rq.resident_id,
            rq.service_id, rq.source, rq.status_id, rs.status_name,
            s.service_name, s.processing_fee, s.description AS service_description,
            s.requirements AS service_requirements, s.form_fields AS service_form_fields,
            rq.purpose, rq.remarks, rq.form_data, rq.service_snapshot,
            rq.request_date, rq.reviewed_date, rq.release_date, rq.expires_at,
            rq.created_at, rq.updated_at
     FROM requests rq
     JOIN request_statuses rs ON rq.status_id = rs.status_id
     JOIN services s ON rq.service_id = s.service_id
     WHERE rq.resident_id = ? AND rq.request_id = ? LIMIT 1`,
    [residentId, requestId]
  );

  const row = rows[0];
  if (!row) return null;

  const [historyRows] = await pool.query(
    `SELECT h.history_id, h.request_id, h.old_status_id, h.new_status_id,
            rs.status_name, h.remarks, h.changed_at,
            CONCAT(u.first_name, ' ', IFNULL(u.last_name, '')) AS changed_by_name
     FROM request_status_history h
     JOIN request_statuses rs ON h.new_status_id = rs.status_id
     LEFT JOIN users u ON h.changed_by = u.user_id
     WHERE h.request_id = ?
     ORDER BY h.changed_at ASC`,
    [requestId]
  );

  const formData = parseJson(row.form_data) || {};
  const serviceSnapshot = parseJson(row.service_snapshot) || {};

  return {
    ...row,
    form_data: formData,
    service_snapshot: serviceSnapshot,
    service_requirements: parseJson(row.service_requirements) || [],
    service_form_fields: parseJson(row.service_form_fields) || [],
    requirements: formData._requirements || [],
    correction_remarks: row.status_id === 10 ? (row.remarks || formData._correction_remarks || null) : null,
    history: historyRows
  };
};

const createOnlineRequest = async (residentId, { service_id, form_data = {}, requirements = [], idempotency_key, photo }, ip) => {
  const [residents] = await pool.query(
    'SELECT resident_id, resident_code, first_name, middle_name, last_name, status FROM residents WHERE resident_id = ? LIMIT 1',
    [residentId]
  );
  const resident = residents[0];
  if (!resident) {
    return { success: false, message: 'Resident record not found.' };
  }
  if (resident.status && resident.status !== 'ACTIVE') {
    return { success: false, message: 'Resident record is inactive. Please visit the barangay office.' };
  }

  // Inject digital requirements and metadata into form_data
  const mergedFormData = {
    ...form_data,
    _source: 'Online',
    _requirements: Array.isArray(requirements) ? requirements : []
  };

  const result = await transactionService.submitTransaction({
    services: [{
      service_id,
      form_data: mergedFormData,
      photo: photo || undefined
    }],
    resident_id: residentId,
    idempotency_key: idempotency_key || undefined,
    ip,
    source: 'Online'
  });

  if (!result.success) {
    return result;
  }

  const data = result.data;
  const firstReq = data.requests?.[0] || {};
  const residentName = `${resident.first_name} ${resident.last_name}`.trim();

  // Notify admin staff about online submission
  try {
    await notificationService.createNotificationForAdmins(
      'New Online Document Request',
      `${residentName} submitted an online request for ${firstReq.service_name || 'document'} (${firstReq.request_number})`,
      'info',
      'request',
      firstReq.request_id
    );
  } catch (err) {
    console.error('Failed to dispatch admin notification for online request:', err);
  }

  return {
    success: true,
    message: data.duplicate ? 'Request already recorded.' : 'Document request submitted successfully.',
    data: {
      transaction_id: data.transaction_id,
      transaction_number: data.transaction_number,
      request_id: firstReq.request_id,
      request_number: firstReq.request_number,
      request_date: firstReq.request_date,
      status: 'Submitted',
      requests: data.requests
    }
  };
};

const resubmitCorrectedRequest = async (residentId, requestId, { form_data = {}, requirements = [], remarks }) => {
  const [rows] = await pool.query(
    'SELECT * FROM requests WHERE request_id = ? AND resident_id = ? LIMIT 1',
    [requestId, residentId]
  );
  const current = rows[0];
  if (!current) {
    return { success: false, message: 'Request not found.' };
  }

  if (Number(current.status_id) !== 10) {
    return { success: false, message: 'Only requests Returned for Correction can be resubmitted.' };
  }

  const existingFormData = parseJson(current.form_data) || {};
  const updatedFormData = {
    ...existingFormData,
    ...form_data,
    _source: 'Online',
    _requirements: Array.isArray(requirements) && requirements.length > 0
      ? requirements
      : (existingFormData._requirements || []),
    _resubmitted_at: new Date().toISOString()
  };

  const newStatusId = 11; // Resubmitted
  const resubmitRemarks = remarks || 'Resident resubmitted corrected requirements and information';

  await pool.query(
    'UPDATE requests SET status_id = ?, form_data = ?, updated_at = NOW() WHERE request_id = ?',
    [newStatusId, JSON.stringify(updatedFormData), requestId]
  );

  await pool.query(
    `INSERT INTO request_status_history (request_id, old_status_id, new_status_id, remarks, changed_at)
     VALUES (?, 10, ?, ?, NOW())`,
    [requestId, newStatusId, resubmitRemarks]
  );

  // Broadcast and notify admins
  try {
    sseManager.broadcastEvent('request-status-changed', {
      requestId: parseInt(requestId, 10),
      statusId: newStatusId,
      statusName: 'Resubmitted'
    });
    await notificationService.createNotificationForAdmins(
      'Document Request Resubmitted',
      `Request #${current.request_number} was corrected and resubmitted by the resident.`,
      'info',
      'request',
      requestId
    );
  } catch (err) {
    console.error('Failed to notify staff on resubmit:', err);
  }

  const updated = await getResidentRequestById(residentId, requestId);
  return {
    success: true,
    message: 'Corrected request resubmitted successfully.',
    data: updated
  };
};

const getPreviousDataForService = async (residentId, serviceId) => {
  const [rows] = await pool.query(
    `SELECT request_id, request_number, form_data, created_at
     FROM requests
     WHERE resident_id = ? AND service_id = ?
     ORDER BY request_id DESC LIMIT 1`,
    [residentId, serviceId]
  );
  if (!rows[0]) return null;

  const raw = parseJson(rows[0].form_data) || {};
  // Exclude internal keys when reusing data
  const cleanData = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!k.startsWith('_')) {
      cleanData[k] = v;
    }
  }

  return {
    previous_request_id: rows[0].request_id,
    previous_request_number: rows[0].request_number,
    form_data: cleanData
  };
};

module.exports = {
  getResidentRequests,
  getResidentRequestById,
  createOnlineRequest,
  resubmitCorrectedRequest,
  getPreviousDataForService
};
