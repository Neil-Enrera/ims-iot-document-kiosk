const pool = require('../config/database');

const getSummary = async () => {
  const [residents] = await pool.query("SELECT COUNT(*) AS total FROM residents WHERE status = 'ACTIVE'");
  const [requests] = await pool.query('SELECT COUNT(*) AS total FROM requests');
  const [pending] = await pool.query('SELECT COUNT(*) AS total FROM requests WHERE status_id = 1');
  const [released] = await pool.query('SELECT COUNT(*) AS total FROM requests WHERE status_id = 7');
  const [activeServices] = await pool.query('SELECT COUNT(*) AS total FROM services WHERE is_active = 1');
  const [todayRequests] = await pool.query('SELECT COUNT(*) AS total FROM requests WHERE DATE(request_date) = CURDATE()');
  const [awaitingIdReview] = await pool.query("SELECT COUNT(*) AS total FROM barangay_id_applications WHERE status = 'PENDING'");
  const [readyForRelease] = await pool.query('SELECT COUNT(*) AS total FROM requests WHERE status_id = 6');
  const [processingRequests] = await pool.query('SELECT COUNT(*) AS total FROM requests WHERE status_id = 5');

  return {
    totalResidents: residents[0].total,
    totalRequests: requests[0].total,
    pendingRequests: pending[0].total,
    releasedRequests: released[0].total,
    activeServices: activeServices[0].total,
    todayRequests: todayRequests[0].total,
    awaitingIdReview: awaitingIdReview[0].total,
    readyForRelease: readyForRelease[0].total,
    processingRequests: processingRequests[0].total
  };
};

const getRequestStats = async () => {
  const [byStatus] = await pool.query(
    'SELECT rs.status_name, COUNT(*) AS count FROM requests rq JOIN request_statuses rs ON rq.status_id = rs.status_id GROUP BY rs.status_name'
  );
  const [byService] = await pool.query(
    'SELECT s.service_name, COUNT(*) AS count FROM requests rq JOIN services s ON rq.service_id = s.service_id GROUP BY s.service_name'
  );
  const [daily] = await pool.query(
    'SELECT DATE(request_date) AS date, COUNT(*) AS count FROM requests WHERE request_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY DATE(request_date) ORDER BY date'
  );
  const [monthly] = await pool.query(
    'SELECT YEAR(request_date) AS year, MONTH(request_date) AS month, COUNT(*) AS count FROM requests GROUP BY YEAR(request_date), MONTH(request_date) ORDER BY year DESC, month DESC LIMIT 12'
  );

  return { byStatus, byService, daily, monthly };
};

const getResidentStats = async () => {
  const [total] = await pool.query('SELECT COUNT(*) AS total FROM residents');
  const [active] = await pool.query("SELECT COUNT(*) AS total FROM residents WHERE status = 'ACTIVE'");
  const [inactive] = await pool.query("SELECT COUNT(*) AS total FROM residents WHERE status = 'INACTIVE'");
  const [newThisMonth] = await pool.query(
    "SELECT COUNT(*) AS total FROM residents WHERE created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')"
  );

  return { total: total[0].total, active: active[0].total, inactive: inactive[0].total, newThisMonth: newThisMonth[0].total };
};

const getServiceStats = async () => {
  const [mostRequested] = await pool.query(
    'SELECT s.service_name, COUNT(*) AS count FROM requests rq JOIN services s ON rq.service_id = s.service_id GROUP BY s.service_name ORDER BY count DESC LIMIT 5'
  );
  const [active] = await pool.query('SELECT COUNT(*) AS total FROM services WHERE is_active = 1');
  const [inactive] = await pool.query('SELECT COUNT(*) AS total FROM services WHERE is_active = 0');

  return { mostRequested, active: active[0].total, inactive: inactive[0].total };
};

const getRecentActivities = async () => {
  const [activities] = await pool.query(
    `SELECT h.changed_at AS timestamp,
      CONCAT('Request ', rq.request_number, ' status changed to ', rs.status_name) AS description,
      CONCAT(u.first_name, ' ', u.last_name) AS actor
      FROM request_status_history h
      JOIN requests rq ON h.request_id = rq.request_id
      JOIN request_statuses rs ON h.new_status_id = rs.status_id
      LEFT JOIN users u ON h.changed_by = u.user_id
      ORDER BY h.changed_at DESC
      LIMIT 20`
  );

  return activities;
};

module.exports = { getSummary, getRequestStats, getResidentStats, getServiceStats, getRecentActivities };
