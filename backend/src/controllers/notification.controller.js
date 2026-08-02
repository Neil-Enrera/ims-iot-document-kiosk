const notificationService = require('../services/notification.service');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

const getAll = async (req, res) => {
  try {
    const result = await notificationService.getByUser(req.user.userId, {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      unreadOnly: req.query.unreadOnly === 'true'
    });
    return paginatedResponse(res, result.message, result.data, result.total, result.page, result.limit);
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const getById = async (req, res) => {
  try {
    const result = await notificationService.getById(parseInt(req.params.id), req.user.userId);
    if (!result.success) return errorResponse(res, 404, result.message);
    return successResponse(res, result.message, result.data);
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const markAsRead = async (req, res) => {
  try {
    const result = await notificationService.markAsRead(parseInt(req.params.id), req.user.userId);
    if (!result.success) return errorResponse(res, 404, result.message);
    return successResponse(res, result.message);
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.userId);
    return successResponse(res, result.message);
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const result = await notificationService.getUnreadCount(req.user.userId);
    return successResponse(res, result.message, result.data);
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const create = async (req, res) => {
  try {
    const { title, message, type } = req.body;
    if (!title) return errorResponse(res, 400, 'Title is required.');
    const result = await notificationService.createNotification(req.user.userId, title, message || '', type || 'info');
    return successResponse(res, 'Notification created successfully.', result);
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const remove = async (req, res) => {
  try {
    const result = await notificationService.remove(parseInt(req.params.id), req.user.userId);
    if (!result.success) return errorResponse(res, 404, result.message);
    return successResponse(res, result.message);
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

module.exports = { getAll, getById, create, markAsRead, markAllAsRead, getUnreadCount, remove };
