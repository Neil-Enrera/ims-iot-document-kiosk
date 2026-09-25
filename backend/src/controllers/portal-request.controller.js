const portalRequestService = require('../services/portal-request.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getRequests = async (req, res) => {
  try {
    const residentId = req.portalUser.residentId;
    const { page, limit, statusId, search } = req.query;
    const data = await portalRequestService.getResidentRequests(residentId, { page, limit, statusId, search });
    return successResponse(res, 'Resident requests retrieved successfully.', data);
  } catch (error) {
    console.error('Portal getRequests error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const getRequestById = async (req, res) => {
  try {
    const residentId = req.portalUser.residentId;
    const { id } = req.params;
    const data = await portalRequestService.getResidentRequestById(residentId, id);
    if (!data) {
      return errorResponse(res, 404, 'Request not found.');
    }
    return successResponse(res, 'Request details retrieved successfully.', data);
  } catch (error) {
    console.error('Portal getRequestById error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const createRequest = async (req, res) => {
  try {
    const residentId = req.portalUser.residentId;
    const { service_id, form_data, requirements, idempotency_key, photo } = req.body;

    if (!service_id) {
      return errorResponse(res, 400, 'Service selection is required.');
    }

    const result = await portalRequestService.createOnlineRequest(
      residentId,
      { service_id, form_data, requirements, idempotency_key, photo },
      req.ip
    );

    if (!result.success) {
      return errorResponse(res, 400, result.message, result.errors || []);
    }

    return successResponse(res, result.message, result.data);
  } catch (error) {
    console.error('Portal createRequest error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const resubmitRequest = async (req, res) => {
  try {
    const residentId = req.portalUser.residentId;
    const { id } = req.params;
    const { form_data, requirements, remarks } = req.body;

    const result = await portalRequestService.resubmitCorrectedRequest(
      residentId,
      id,
      { form_data, requirements, remarks }
    );

    if (!result.success) {
      return errorResponse(res, 400, result.message);
    }

    return successResponse(res, result.message, result.data);
  } catch (error) {
    console.error('Portal resubmitRequest error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const getPreviousData = async (req, res) => {
  try {
    const residentId = req.portalUser.residentId;
    const { serviceId } = req.params;
    const data = await portalRequestService.getPreviousDataForService(residentId, serviceId);
    return successResponse(res, 'Previous application data retrieved.', data);
  } catch (error) {
    console.error('Portal getPreviousData error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 400, 'No file uploaded.');
    }

    const folder = req.file.mimetype && req.file.mimetype.startsWith('image/') ? 'resident-photos' : 'documents';
    const fileUrl = `/uploads/${folder}/${req.file.filename}`;
    return successResponse(res, 'Requirement file uploaded successfully.', {
      file_url: fileUrl,
      file_name: req.file.filename,
      original_name: req.file.originalname,
      mime_type: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    console.error('Portal uploadFile error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

module.exports = {
  getRequests,
  getRequestById,
  createRequest,
  resubmitRequest,
  getPreviousData,
  uploadFile
};
