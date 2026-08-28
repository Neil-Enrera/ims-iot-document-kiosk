const notificationRepository = require('../repositories/notification.repository');
const sseManager = require('./notification-sse');

const getByUser = async (userId, params) => {
  const result = await notificationRepository.findByUserId(userId, params);
  return { success: true, message: 'Notifications retrieved successfully.', data: result.notifications, total: result.total, page: result.page, limit: result.limit };
};

const getById = async (id, userId) => {
  const notification = await notificationRepository.findById(id);
  if (!notification) return { success: false, message: 'Notification not found.' };
  if (notification.user_id !== userId) return { success: false, message: 'Access denied.' };
  return { success: true, message: 'Notification retrieved successfully.', data: notification };
};

const markAsRead = async (id, userId) => {
  const notification = await notificationRepository.findById(id);
  if (!notification) return { success: false, message: 'Notification not found.' };
  if (notification.user_id !== userId) return { success: false, message: 'Access denied.' };
  await notificationRepository.markAsRead(id);

  // Send updated unread count to the user
  const newCount = await notificationRepository.getUnreadCount(userId);
  sseManager.sendUnreadCount(userId, newCount);

  return { success: true, message: 'Notification marked as read.' };
};

const markAllAsRead = async (userId) => {
  await notificationRepository.markAllAsRead(userId);

  // Send updated unread count to the user
  sseManager.sendUnreadCount(userId, 0);

  return { success: true, message: 'All notifications marked as read.' };
};

const getUnreadCount = async (userId) => {
  const count = await notificationRepository.getUnreadCount(userId);
  return { success: true, message: 'Unread count retrieved.', data: { count } };
};

const remove = async (id, userId) => {
  const notification = await notificationRepository.findById(id);
  if (!notification) return { success: false, message: 'Notification not found.' };
  if (notification.user_id !== userId) return { success: false, message: 'Access denied.' };
  await notificationRepository.remove(id);

  // Send updated unread count if the deleted notification was unread
  if (!notification.is_read) {
    const newCount = await notificationRepository.getUnreadCount(userId);
    sseManager.sendUnreadCount(userId, newCount);
  }

  return { success: true, message: 'Notification deleted.' };
};

const createNotification = async (userId, title, message, type = 'info', referenceType, referenceId) => {
  const result = await notificationRepository.create({ userId, title, message, type, referenceType, referenceId });

  // Broadcast the new notification to the user via SSE
  sseManager.sendToUser(userId, result);

  // Send updated unread count
  const newCount = await notificationRepository.getUnreadCount(userId);
  sseManager.sendUnreadCount(userId, newCount);

  return result;
};

const createNotificationForAdmins = async (title, message, type = 'info', referenceType, referenceId) => {
  // Get all active admin/staff users
  const pool = require('../config/database');
  const [adminUsers] = await pool.query(
    `SELECT u.user_id FROM users u 
     JOIN user_roles ur ON u.role_id = ur.role_id 
     WHERE u.status = 'ACTIVE'`
  );
  const adminIds = adminUsers.map(u => u.user_id);
  if (adminIds.length === 0) return { success: true, message: 'No admin users found.', data: 0 };
  const { count, ids } = await notificationRepository.createForUsers(adminIds, { title, message, type, referenceType, referenceId });

  // Broadcast to all connected admin clients via SSE with correct IDs
  for (let i = 0; i < adminIds.length; i++) {
    const adminId = adminIds[i];
    const notificationId = ids[i];
    const notification = {
      notification_id: notificationId,
      user_id: adminId,
      title,
      message,
      type,
      is_read: false,
      reference_type: referenceType,
      reference_id: referenceId,
      created_at: new Date().toISOString()
    };
    sseManager.sendToUser(adminId, notification);

    // Send updated unread count
    const newCount = await notificationRepository.getUnreadCount(adminId);
    sseManager.sendUnreadCount(adminId, newCount);
  }

  return { success: true, message: 'Notifications created for admins.', data: count };
};

module.exports = { getByUser, getById, markAsRead, markAllAsRead, getUnreadCount, remove, createNotification, createNotificationForAdmins };
