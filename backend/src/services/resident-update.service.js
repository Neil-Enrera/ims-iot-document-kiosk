const residentUpdateRepo = require('../repositories/resident-update.repository');
const residentRepo = require('../repositories/resident.repository');
const auditRepo = require('../repositories/audit.repository');
const notificationService = require('./notification.service');

const submitRequest = async ({ residentId, requestedChanges, reason, ipAddress }) => {
  const resident = await residentRepo.findById(residentId);
  if (!resident) {
    return { success: false, message: 'Resident record not found.' };
  }

  const result = await residentUpdateRepo.create({
    residentId,
    requestedChanges,
    reason: reason || 'Resident requested profile information update via Kiosk'
  });

  await auditRepo.log({
    userId: 1,
    action: `Submitted Information Update Request [${result.requestNumber}] for Resident: ${resident.first_name} ${resident.last_name} (${resident.resident_code || 'ID: ' + residentId})`,
    module: 'Residents',
    ipAddress: ipAddress || '127.0.0.1'
  });

  // Create real-time notification for admin and staff
  try {
    const changedFields = Object.keys(requestedChanges || {})
      .filter(k => requestedChanges[k] !== undefined && requestedChanges[k] !== null && requestedChanges[k] !== '')
      .map(k => k.replace(/_/g, ' '))
      .join(', ');

    await notificationService.createNotificationForAdmins(
      'Resident Profile Update Request',
      `${resident.first_name} ${resident.last_name} submitted an update request (${result.requestNumber}) for: ${changedFields || 'address & contact information'}.`,
      'info',
      'resident_update',
      result.requestId
    );
  } catch (notifErr) {
    console.error('Failed to broadcast admin notification for resident update:', notifErr);
  }

  return {
    success: true,
    message: 'Information update request submitted successfully and is pending review.',
    data: result
  };
};

const getAllRequests = async (filters) => {
  const result = await residentUpdateRepo.findAll(filters);
  return { success: true, data: result.data, total: result.total, page: result.page, limit: result.limit };
};

const getRequestById = async (requestId) => {
  const request = await residentUpdateRepo.findById(requestId);
  if (!request) {
    return { success: false, message: 'Update request not found.' };
  }
  return { success: true, data: request };
};

const approveRequest = async (requestId, userId, reviewNotes, ipAddress) => {
  const request = await residentUpdateRepo.findById(requestId);
  if (!request) {
    return { success: false, message: 'Update request not found.' };
  }

  if (request.status !== 'PENDING') {
    return { success: false, message: `Request is already ${request.status.toLowerCase()}.` };
  }

  const changes = request.requested_changes || {};
  const currentResident = await residentRepo.findById(request.resident_id);
  if (!currentResident) {
    return { success: false, message: 'Associated resident record not found.' };
  }

  // Apply changes to resident record in database
  await residentRepo.update(request.resident_id, changes);

  // Update request status to APPROVED
  await residentUpdateRepo.updateStatus(requestId, {
    status: 'APPROVED',
    reviewedBy: userId,
    reviewNotes: reviewNotes || 'Approved by staff'
  });

  // Prepare audit log change diff summary
  const changeSummary = [];
  for (const [key, newVal] of Object.entries(changes)) {
    if (newVal !== undefined && newVal !== null) {
      const oldVal = currentResident[key] ?? 'N/A';
      changeSummary.push(`${key}: "${oldVal}" -> "${newVal}"`);
    }
  }

  await auditRepo.log({
    userId,
    action: `Approved Update Request [${request.request_number}] for Resident: ${currentResident.first_name} ${currentResident.last_name}. Changes applied: ${changeSummary.join(', ')}`,
    module: 'Residents',
    ipAddress: ipAddress || '127.0.0.1'
  });

  const updatedResident = await residentRepo.findById(request.resident_id);
  return {
    success: true,
    message: 'Resident update request approved and resident record successfully updated in database.',
    data: { request: await residentUpdateRepo.findById(requestId), resident: updatedResident }
  };
};

const rejectRequest = async (requestId, userId, reviewNotes, ipAddress) => {
  const request = await residentUpdateRepo.findById(requestId);
  if (!request) {
    return { success: false, message: 'Update request not found.' };
  }

  if (request.status !== 'PENDING') {
    return { success: false, message: `Request is already ${request.status.toLowerCase()}.` };
  }

  await residentUpdateRepo.updateStatus(requestId, {
    status: 'REJECTED',
    reviewedBy: userId,
    reviewNotes: reviewNotes || 'Rejected by staff'
  });

  await auditRepo.log({
    userId,
    action: `Rejected Update Request [${request.request_number}] for Resident ID ${request.resident_id}. Reason/Notes: ${reviewNotes || 'None'}`,
    module: 'Residents',
    ipAddress: ipAddress || '127.0.0.1'
  });

  return {
    success: true,
    message: 'Resident update request rejected. Resident record was not modified.',
    data: await residentUpdateRepo.findById(requestId)
  };
};

module.exports = {
  submitRequest,
  getAllRequests,
  getRequestById,
  approveRequest,
  rejectRequest
};
