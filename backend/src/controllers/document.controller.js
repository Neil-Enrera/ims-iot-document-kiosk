const documentService = require('../services/document.service');
const { successResponse, errorResponse, createdResponse } = require('../utils/apiResponse');

const generate = async (req, res) => {
  try {
    const result = await documentService.generateDocument({
      requestId: req.params.id,
      userId: req.user.userId
    });
    if (!result.success) return errorResponse(res, 400, result.message);
    return createdResponse(res, result.message, result.data);
  } catch (error) {
    console.error('Document generation error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const list = async (req, res) => {
  try {
    const result = await documentService.listDocuments(req.params.id);
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const getById = async (req, res) => {
  try {
    const result = await documentService.getDocument(req.params.documentId);
    if (!result.success) return errorResponse(res, 404, result.message);
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const download = async (req, res) => {
  try {
    const result = await documentService.getDocument(req.params.documentId);
    if (!result.success) return errorResponse(res, 404, result.message);
    const doc = result.data;
    if (doc.approval_status !== 'approved') {
      return errorResponse(res, 403, 'This document has not been approved yet and cannot be downloaded.');
    }
    return res.download(doc.filePath, doc.file_name);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

// Serve the document inline so the admin panel can render it in a preview modal.
// Unlike download, preview is allowed for pending/returned documents so reviewers
// can inspect the completed document before approving it.
const preview = async (req, res) => {
  try {
    const result = await documentService.getDocument(req.params.documentId);
    if (!result.success) return errorResponse(res, 404, result.message);
    const doc = result.data;
    return res.sendFile(doc.filePath);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const review = async (req, res) => {
  try {
    const result = await documentService.reviewDocument(req.params.documentId, {
      status: req.params.status,
      reviewedBy: req.user.userId,
      remarks: req.body.remarks
    });
    if (!result.success) return errorResponse(res, 400, result.message);
    return successResponse(res, result.message, result.data);
  } catch (error) {
    console.error('Document review error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const remove = async (req, res) => {
  try {
    const result = await documentService.deleteDocument(req.params.documentId);
    if (!result.success) return errorResponse(res, 404, result.message);
    return successResponse(res, result.message, result.data);
  } catch {
    return errorResponse(res, 500, 'Internal server error.');
  }
};

const scanPlaceholders = async (req, res) => {
  try {
    const serviceService = require('../services/service.service');
    const service = await serviceService.getServiceById(req.params.id);
    if (!service.success) return errorResponse(res, 404, service.message);

    const placeholders = await documentService.scanTemplatePlaceholders(service.data);
    return successResponse(res, 'Template placeholders retrieved.', placeholders);
  } catch (error) {
    console.error('Template placeholder scan error:', error);
    return errorResponse(res, 500, 'Internal server error.');
  }
};

module.exports = { generate, list, getById, download, preview, review, remove, scanPlaceholders };
