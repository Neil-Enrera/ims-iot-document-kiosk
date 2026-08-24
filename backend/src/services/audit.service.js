const auditRepository = require('../repositories/audit.repository');

const getAuditLogs = async ({ search, module, userId, dateFrom, dateTo, page = 1, limit = 20 }) => {
  const result = await auditRepository.findAll({ search, module, userId, dateFrom, dateTo, page, limit });
  return { success: true, message: 'Audit logs retrieved successfully.', data: result };
};

const getAuditLogById = async (auditLogId) => {
  const log = await auditRepository.findById(auditLogId);
  if (!log) {
    return { success: false, message: 'Audit log not found.' };
  }
  return { success: true, message: 'Audit log retrieved successfully.', data: log };
};

const getAuditModules = async () => {
  const modules = await auditRepository.getModules();
  return { success: true, message: 'Audit modules retrieved successfully.', data: modules };
};

module.exports = { getAuditLogs, getAuditLogById, getAuditModules };
