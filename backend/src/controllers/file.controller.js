const fileService = require('../services/file.service');
const { successResponse, errorResponse, createdResponse, paginatedResponse } = require('../utils/apiResponse');

const upload = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 400, 'No file uploaded.');
    }
    const result = await fileService.uploadFile(req.file, req.user.userId);
    return createdResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const getAll = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await fileService.getAllFiles({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20
    });
    return paginatedResponse(res, result.message, result.data.files, result.data.total, result.data.page, result.data.limit);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const getById = async (req, res) => {
  try {
    const result = await fileService.getFileById(req.params.id);
    if (!result.success) return errorResponse(res, 404, result.message);
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const download = async (req, res) => {
  try {
    const filePath = await fileService.getFilePath(req.params.id);
    if (!filePath) {
      return errorResponse(res, 404, 'File not found.');
    }
    return res.download(filePath);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const remove = async (req, res) => {
  try {
    const result = await fileService.deleteFile(req.params.id);
    if (!result.success) return errorResponse(res, 404, result.message);
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

module.exports = { upload, getAll, getById, download, remove };
