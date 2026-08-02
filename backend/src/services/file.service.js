const fs = require('fs');
const path = require('path');
const fileRepository = require('../repositories/file.repository');

const uploadFile = async (file, userId) => {
  const fileData = {
    originalName: file.originalname,
    fileName: file.filename,
    filePath: file.path,
    mimeType: file.mimetype,
    size: file.size,
    uploadedBy: userId
  };

  const fileId = await fileRepository.create(fileData);
  return {
    success: true,
    message: 'File uploaded successfully.',
    data: { fileId, fileName: file.originalname, filePath: file.path }
  };
};

const getFileById = async (fileId) => {
  const file = await fileRepository.findById(fileId);
  if (!file) {
    return { success: false, message: 'File not found.' };
  }
  return { success: true, message: 'File retrieved successfully.', data: file };
};

const getAllFiles = async ({ page = 1, limit = 20 }) => {
  const result = await fileRepository.findAll({ page, limit });
  return { success: true, message: 'Files retrieved successfully.', data: result };
};

const deleteFile = async (fileId) => {
  const file = await fileRepository.findById(fileId);
  if (!file) {
    return { success: false, message: 'File not found.' };
  }

  const filePath = path.join(__dirname, '../../', file.file_path);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await fileRepository.remove(fileId);
  return { success: true, message: 'File deleted successfully.', data: null };
};

const getFilePath = async (fileId) => {
  const file = await fileRepository.findById(fileId);
  if (!file) {
    return null;
  }
  return path.join(__dirname, '../../', file.file_path);
};

module.exports = { uploadFile, getFileById, getAllFiles, deleteFile, getFilePath };
