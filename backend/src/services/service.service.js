const serviceRepository = require('../repositories/service.repository');
const fs = require('fs');
const path = require('path');

const getAllServices = async ({ search, isActive, page = 1, limit = 20, sortBy = 'service_id', sortOrder = 'ASC' }) => {
  const result = await serviceRepository.findAll({ search, isActive, page, limit, sortBy, sortOrder });
  return { success: true, message: 'Services retrieved successfully.', data: result };
};

const getServiceById = async (serviceId) => {
  const service = await serviceRepository.findById(serviceId);
  if (!service) {
    return { success: false, message: 'Service not found.' };
  }
  return { success: true, message: 'Service retrieved successfully.', data: service };
};

const createService = async (serviceData) => {
  const existing = await serviceRepository.findByName(serviceData.serviceName);
  if (existing) {
    return { success: false, message: 'Service name already exists.' };
  }

  const serviceId = await serviceRepository.create(serviceData);
  const service = await serviceRepository.findById(serviceId);

  return { success: true, message: 'Service created successfully.', data: service };
};

const updateService = async (serviceId, serviceData) => {
  const service = await serviceRepository.findById(serviceId);
  if (!service) {
    return { success: false, message: 'Service not found.' };
  }

  if (serviceData.serviceName !== service.service_name) {
    const existing = await serviceRepository.findByName(serviceData.serviceName);
    if (existing) {
      return { success: false, message: 'Service name already exists.' };
    }
  }

  await serviceRepository.update(serviceId, serviceData);
  const updated = await serviceRepository.findById(serviceId);

  return { success: true, message: 'Service updated successfully.', data: updated };
};

const changeStatus = async (serviceId, isActive) => {
  const service = await serviceRepository.findById(serviceId);
  if (!service) {
    return { success: false, message: 'Service not found.' };
  }

  await serviceRepository.updateStatus(serviceId, isActive);
  const updated = await serviceRepository.findById(serviceId);

  return { success: true, message: 'Service status updated successfully.', data: updated };
};

const changeKioskVisibility = async (serviceId, showInKiosk) => {
  const service = await serviceRepository.findById(serviceId);
  if (!service) {
    return { success: false, message: 'Service not found.' };
  }

  await serviceRepository.updateKioskVisibility(serviceId, showInKiosk);
  const updated = await serviceRepository.findById(serviceId);

  return { success: true, message: 'Service kiosk visibility updated successfully.', data: updated };
};

const deleteService = async (serviceId) => {
  const service = await serviceRepository.findById(serviceId);
  if (!service) {
    return { success: false, message: 'Service not found.' };
  }

  await serviceRepository.remove(serviceId);
  return { success: true, message: 'Service deleted successfully.', data: null };
};

const uploadTemplate = async (serviceId, file) => {
  const service = await serviceRepository.findById(serviceId);
  if (!service) {
    return { success: false, message: 'Service not found.' };
  }
  if (!file) {
    return { success: false, message: 'A template file is required.' };
  }

  const template = {
    path: `templates/${file.filename}`,
    originalName: file.originalname,
    mime: file.mimetype,
    size: file.size
  };

  // Remove previous template file if one exists
  const previous = await serviceRepository.findTemplate(serviceId);
  if (previous && previous.template_path) {
    try {
      const oldPath = path.join(__dirname, '../../uploads', previous.template_path);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    } catch (err) {
      console.error('Failed to remove previous template:', err);
    }
  }

  await serviceRepository.saveTemplate(serviceId, template);
  const updated = await serviceRepository.findById(serviceId);

  return { success: true, message: 'Template uploaded successfully.', data: updated };
};

const removeTemplate = async (serviceId) => {
  const service = await serviceRepository.findById(serviceId);
  if (!service) {
    return { success: false, message: 'Service not found.' };
  }

  const previous = await serviceRepository.findTemplate(serviceId);
  if (previous && previous.template_path) {
    try {
      const oldPath = path.join(__dirname, '../../uploads', previous.template_path);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    } catch (err) {
      console.error('Failed to remove template file:', err);
    }
  }

  await serviceRepository.clearTemplate(serviceId);
  const updated = await serviceRepository.findById(serviceId);

  return { success: true, message: 'Template removed successfully.', data: updated };
};

module.exports = { getAllServices, getServiceById, createService, updateService, changeStatus, changeKioskVisibility, deleteService, uploadTemplate, removeTemplate };
