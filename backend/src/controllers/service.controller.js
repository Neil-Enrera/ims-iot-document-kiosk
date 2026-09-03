const serviceService = require('../services/service.service');
const auditRepository = require('../repositories/audit.repository');
const { successResponse, errorResponse, createdResponse, paginatedResponse } = require('../utils/apiResponse');

const getAll = async (req, res) => {
  try {
    const { search, isActive, page, limit, sortBy, sortOrder } = req.query;
    const result = await serviceService.getAllServices({
      search,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sortBy,
      sortOrder
    });
    if (!result.success) return errorResponse(res, 400, result.message);
    return paginatedResponse(res, result.message, result.data.services, result.data.total, result.data.page, result.data.limit);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const getById = async (req, res) => {
  try {
    const result = await serviceService.getServiceById(req.params.id);
    if (!result.success) return errorResponse(res, 404, result.message);
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const create = async (req, res) => {
  try {
    const result = await serviceService.createService(req.body);
    if (!result.success) return errorResponse(res, 400, result.message);
    const svcName = result.data?.service_name || req.body.serviceName || req.body.service_name;
    auditRepository.log({
      userId: req.user?.userId,
      action: `Created service #${result.data?.service_id || ''} '${svcName}' (Fee: ₱${Number(req.body.fee || req.body.processing_fee || 0).toFixed(2)})`,
      module: 'Services',
      ipAddress: req.ip
    });
    return createdResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const update = async (req, res) => {
  try {
    const result = await serviceService.updateService(req.params.id, req.body);
    if (!result.success) return errorResponse(res, 400, result.message);
    const svcName = result.data?.service_name || req.body.serviceName || '';
    const updatedParts = [];
    if (req.body.form_fields !== undefined || req.body.formFields !== undefined) updatedParts.push('form fields');
    if (req.body.requirements !== undefined) updatedParts.push('requirements');
    if (req.body.placeholder_mappings !== undefined || req.body.placeholderMappings !== undefined) updatedParts.push('placeholder mappings');
    if (req.body.processing_fee !== undefined || req.body.fee !== undefined) updatedParts.push('processing fee');
    if (req.body.description !== undefined) updatedParts.push('description');
    const partsDesc = updatedParts.length > 0 ? ` [Modified: ${updatedParts.join(', ')}]` : '';
    auditRepository.log({
      userId: req.user?.userId,
      action: `Updated service #${req.params.id} '${svcName}'${partsDesc}`,
      module: 'Services',
      ipAddress: req.ip
    });
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const changeStatus = async (req, res) => {
  try {
    const result = await serviceService.changeStatus(req.params.id, req.body.isActive);
    if (!result.success) return errorResponse(res, 404, result.message);
    const svcName = result.data?.service_name || '';
    auditRepository.log({
      userId: req.user?.userId,
      action: `Changed status of service #${req.params.id} '${svcName}' to ${req.body.isActive ? 'Active' : 'Inactive'}`,
      module: 'Services',
      ipAddress: req.ip
    });
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const uploadTemplate = async (req, res) => {
  try {
    const result = await serviceService.uploadTemplate(req.params.id, req.file);
    if (!result.success) return errorResponse(res, 400, result.message);
    const svcName = result.data?.service_name || '';
    auditRepository.log({
      userId: req.user?.userId,
      action: `Uploaded DOCX template for service #${req.params.id} '${svcName}': ${req.file?.originalname || 'template.docx'}`,
      module: 'Services',
      ipAddress: req.ip
    });
    return successResponse(res, result.message, result.data);
  } catch (error) {
    console.error('Service template upload error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const removeTemplate = async (req, res) => {
  try {
    const result = await serviceService.removeTemplate(req.params.id);
    if (!result.success) return errorResponse(res, 404, result.message);
    const svcName = result.data?.service_name || '';
    auditRepository.log({
      userId: req.user?.userId,
      action: `Removed DOCX template for service #${req.params.id} '${svcName}'`,
      module: 'Services',
      ipAddress: req.ip
    });
    return successResponse(res, result.message, result.data);
  } catch (error) {
    console.error('Service template remove error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const remove = async (req, res) => {
  try {
    const result = await serviceService.deleteService(req.params.id);
    if (!result.success) return errorResponse(res, 404, result.message);
    auditRepository.log({
      userId: req.user?.userId,
      action: `Deleted service #${req.params.id}`,
      module: 'Services',
      ipAddress: req.ip
    });
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

module.exports = { getAll, getById, create, update, changeStatus, uploadTemplate, removeTemplate, remove };
