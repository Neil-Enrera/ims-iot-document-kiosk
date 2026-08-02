const pool = require('../config/database');

const findByUserId = async (userId, { page = 1, limit = 20, unreadOnly = false } = {}) => {
  const offset = (page - 1) * limit;
  let where = 'WHERE n.user_id = ?';
  const params = [userId];
  if (unreadOnly) { where += ' AND n.is_read = FALSE'; }
  const [rows] = await pool.query(`SELECT n.* FROM notifications n ${where} ORDER BY n.created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM notifications n ${where}`, params);
  return { notifications: rows, total, page, limit };
};

const findById = async (id) => {
  const [[row]] = await pool.query('SELECT * FROM notifications WHERE notification_id = ?', [id]);
  return row;
};

const create = async ({ userId, title, message, type = 'info', referenceType, referenceId }) => {
  const [result] = await pool.query(
    'INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, title, message, type, referenceType || null, referenceId || null]
  );
  return { notification_id: result.insertId, user_id: userId, title, message, type, is_read: false, reference_type: referenceType, reference_id: referenceId };
};

const createForUsers = async (userIds, { title, message, type = 'info', referenceType, referenceId }) => {
  if (!userIds || userIds.length === 0) return { count: 0, ids: [] };
  const values = userIds.map(userId => [userId, title, message, type, referenceType || null, referenceId || null]);
  const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
  const flatValues = values.flat();
  const [result] = await pool.query(
    `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id) VALUES ${placeholders}`,
    flatValues
  );
  // Get the IDs of the inserted notifications
  const startId = result.insertId;
  const ids = userIds.map((_, i) => startId + i);
  return { count: result.affectedRows, ids };
};

const markAsRead = async (id) => {
  await pool.query('UPDATE notifications SET is_read = TRUE WHERE notification_id = ?', [id]);
};

const markAllAsRead = async (userId) => {
  await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE', [userId]);
};

const getUnreadCount = async (userId) => {
  const [[{ count }]] = await pool.query('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE', [userId]);
  return count;
};

const remove = async (id) => {
  await pool.query('DELETE FROM notifications WHERE notification_id = ?', [id]);
};

module.exports = { findByUserId, findById, create, createForUsers, markAsRead, markAllAsRead, getUnreadCount, remove };
