const dashboardRepository = require('../repositories/dashboard.repository');

const getSummary = async () => {
  const data = await dashboardRepository.getSummary();
  return { success: true, message: 'Dashboard summary retrieved successfully.', data };
};

const getRequestStats = async () => {
  const data = await dashboardRepository.getRequestStats();
  return { success: true, message: 'Request statistics retrieved successfully.', data };
};

const getResidentStats = async () => {
  const data = await dashboardRepository.getResidentStats();
  return { success: true, message: 'Resident statistics retrieved successfully.', data };
};

const getServiceStats = async () => {
  const data = await dashboardRepository.getServiceStats();
  return { success: true, message: 'Service statistics retrieved successfully.', data };
};

const getRecentActivities = async () => {
  const data = await dashboardRepository.getRecentActivities();
  return { success: true, message: 'Recent activities retrieved successfully.', data };
};

module.exports = { getSummary, getRequestStats, getResidentStats, getServiceStats, getRecentActivities };
