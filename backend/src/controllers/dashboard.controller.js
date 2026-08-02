const dashboardService = require('../services/dashboard.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const summary = async (req, res) => {
  try {
    const result = await dashboardService.getSummary();
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const requestStats = async (req, res) => {
  try {
    const result = await dashboardService.getRequestStats();
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const residentStats = async (req, res) => {
  try {
    const result = await dashboardService.getResidentStats();
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const serviceStats = async (req, res) => {
  try {
    const result = await dashboardService.getServiceStats();
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const recentActivities = async (req, res) => {
  try {
    const result = await dashboardService.getRecentActivities();
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

module.exports = { summary, requestStats, residentStats, serviceStats, recentActivities };
