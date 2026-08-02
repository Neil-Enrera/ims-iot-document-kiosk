const reportRepository = require('../repositories/report.repository');

const getRequestsReport = async (filters) => {
  const { page = 1, limit = 20, ...rest } = filters;
  const result = await reportRepository.getRequestsReport({ ...rest, page, limit });
  return { success: true, message: 'Requests report retrieved successfully.', data: result };
};

const getResidentsReport = async (filters) => {
  const { page = 1, limit = 20, ...rest } = filters;
  const result = await reportRepository.getResidentsReport({ ...rest, page, limit });
  return { success: true, message: 'Residents report retrieved successfully.', data: result };
};

module.exports = { getRequestsReport, getResidentsReport };
