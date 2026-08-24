const rfidService = require('../services/rfid.service');
const auditRepository = require('../repositories/audit.repository');
const { successResponse, errorResponse, createdResponse, paginatedResponse } = require('../utils/apiResponse');

const getAll = async (req, res) => {
  try {
    const { search, status, residentId, resident_id, page, limit, sortBy, sortOrder } = req.query;
    const result = await rfidService.getAllCards({
      search, status, residentId: residentId || resident_id, page: parseInt(page) || 1, limit: parseInt(limit) || 20, sortBy, sortOrder
    });
    if (!result.success) return errorResponse(res, 400, result.message);
    return paginatedResponse(res, result.message, result.data.cards, result.data.total, result.data.page, result.data.limit);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const getById = async (req, res) => {
  try {
    const result = await rfidService.getCardById(req.params.id);
    if (!result.success) return errorResponse(res, 404, result.message);
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const register = async (req, res) => {
  try {
    const result = await rfidService.registerCard(req.body);
    if (!result.success) return errorResponse(res, 400, result.message);
    auditRepository.log({
      userId: req.user?.userId,
      action: `Registered RFID card (UID: ${req.body.rfidUid})`,
      module: 'RFID',
      ipAddress: req.ip
    });
    return createdResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const assign = async (req, res) => {
  try {
    const result = await rfidService.assignCard(req.body);
    if (!result.success) return errorResponse(res, 400, result.message);
    auditRepository.log({
      userId: req.user?.userId,
      action: `Assigned RFID card (UID: ${req.body.rfidUid}) to resident #${req.body.residentId}`,
      module: 'RFID',
      ipAddress: req.ip
    });
    return createdResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const verify = async (req, res) => {
  try {
    const result = await rfidService.verifyCard(req.body.rfidUid);
    if (!result.success) return errorResponse(res, 404, result.message);
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const getByUid = async (req, res) => {
  try {
    const result = await rfidService.getResidentByUid(req.params.rfidUid);
    if (!result.success) return errorResponse(res, 404, result.message);
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const updateStatus = async (req, res) => {
  try {
    const result = await rfidService.updateCardStatus(req.params.id, req.body.status);
    if (!result.success) return errorResponse(res, 404, result.message);
    auditRepository.log({
      userId: req.user?.userId,
      action: `Changed status of RFID card #${req.params.id} to '${req.body.status}'`,
      module: 'RFID',
      ipAddress: req.ip
    });
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const replace = async (req, res) => {
  try {
    const result = await rfidService.replaceCard(req.params.id, req.body.newCardUid, req.body.expirationDate);
    if (!result.success) return errorResponse(res, 400, result.message);
    auditRepository.log({
      userId: req.user?.userId,
      action: `Replaced RFID card #${req.params.id} with UID: ${req.body.newCardUid}`,
      module: 'RFID',
      ipAddress: req.ip
    });
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const remove = async (req, res) => {
  try {
    const result = await rfidService.deleteCard(req.params.id);
    if (!result.success) return errorResponse(res, 404, result.message);
    auditRepository.log({
      userId: req.user?.userId,
      action: `Deleted RFID card #${req.params.id}`,
      module: 'RFID',
      ipAddress: req.ip
    });
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

module.exports = { getAll, getById, register, assign, verify, getByUid, updateStatus, replace, remove };
