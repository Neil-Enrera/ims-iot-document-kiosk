const fs = require('fs');
const fileRepository = require('../repositories/file.repository');

const uploadFile = async (file, userId, category, description) => {
  const fileData = {
    originalName: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.size,
    filePath: file.path,
    category: category || null,
    description: description || null,
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

  if (fs.existsSync(file.file_path)) {
    fs.unlinkSync(file.file_path);
  }

  await fileRepository.remove(fileId);
  return { success: true, message: 'File deleted successfully.', data: null };
};

const getFilePath = async (fileId) => {
  const file = await fileRepository.findById(fileId);
  if (!file) {
    return null;
  }
  return file.file_path;
};

module.exports = { uploadFile, getFileById, getAllFiles, deleteFile, getFilePath };
