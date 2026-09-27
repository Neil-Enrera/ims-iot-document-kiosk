const rfidRepository = require('../repositories/rfid.repository');
const residentRepository = require('../repositories/resident.repository');

const getAllCards = async ({ search, status, residentId, resident_id, page = 1, limit = 20, sortBy = 'rfid_card_id', sortOrder = 'ASC' }) => {
  const result = await rfidRepository.findAll({ search, status, residentId, resident_id, page, limit, sortBy, sortOrder });
  return { success: true, message: 'RFID cards retrieved successfully.', data: result };
};

const getCardById = async (rfidCardId) => {
  const card = await rfidRepository.findById(rfidCardId);
  if (!card) {
    return { success: false, message: 'RFID card not found.' };
  }
  return { success: true, message: 'RFID card retrieved successfully.', data: card };
};

const syncRenewalAndReleaseOnRfid = async ({ residentId, requestId, userId }) => {
  try {
    const pool = require('../config/database');
    const requestService = require('./request.service');

    // Look for any active ID Renewal / Replacement / ID application request for this resident
    const [activeRequests] = await pool.query(
      `SELECT rq.request_id, rq.service_id, rq.status_id, rq.form_data, rq.resident_id, s.service_name
       FROM requests rq
       LEFT JOIN services s ON rq.service_id = s.service_id
       WHERE rq.resident_id = ?
         AND (
           rq.request_id = ?
           OR (
             (LOWER(COALESCE(s.service_name, '')) LIKE '%barangay id%' OR LOWER(COALESCE(s.service_name, '')) LIKE '%id card%' OR LOWER(COALESCE(s.service_name, '')) LIKE '%renewal%' OR LOWER(COALESCE(s.service_name, '')) LIKE '%replacement%')
             AND rq.status_id IN (1, 2, 3, 4, 5, 6, 11)
           )
         )`,
      [residentId, requestId ? Number(requestId) : 0]
    );

    for (const reqRow of activeRequests) {
      try {
        await requestService.changeStatus(reqRow.request_id, 7, userId || null, 'RFID Card confirmed and registered. Barangay ID issued.');
      } catch (e) {
        console.error(`Failed to auto-release request ${reqRow.request_id}:`, e.message);
      }
    }

    // Also update any pending first-timer barangay_id_applications for this resident
    const [activeApps] = await pool.query(
      "SELECT application_id, status FROM barangay_id_applications WHERE (resident_id = ? OR applicant_id = ?) AND status IN ('PENDING', 'APPROVED')",
      [residentId, residentId]
    );
    for (const appRow of activeApps) {
      try {
        await pool.query(
          "UPDATE barangay_id_applications SET status = 'APPROVED', reviewed_at = NOW(), rejection_reason = NULL WHERE application_id = ?",
          [appRow.application_id]
        );
      } catch (e) {
        console.error(`Failed to auto-update application ${appRow.application_id}:`, e.message);
      }
    }

    // Broadcast status display update so Public Status Board updates immediately
    try {
      const { broadcastStatusDisplayUpdate } = require('../controllers/kiosk.controller');
      broadcastStatusDisplayUpdate().catch(() => {});
    } catch {}
  } catch (err) {
    console.error('syncRenewalAndReleaseOnRfid error:', err.message);
  }
};

const registerCard = async ({ cardUid, residentId, issuedDate, expirationDate, requestId, userId }) => {
  const existing = await rfidRepository.findByUid(cardUid);
  if (existing && existing.resident_id !== residentId && existing.status === 'ACTIVE') {
    return { success: false, message: 'RFID UID already assigned to another resident.' };
  }

  const resident = await residentRepository.findById(residentId);
  if (!resident) {
    return { success: false, message: 'Resident not found.' };
  }

  const activeCard = await rfidRepository.findActiveByResident(residentId);
  if (activeCard) {
    if (activeCard.card_uid === cardUid) {
      if (expirationDate !== undefined) {
        const pool = require('../config/database');
        await pool.query('UPDATE rfid_cards SET expiration_date = ?, status = ? WHERE rfid_card_id = ?', [expirationDate, 'ACTIVE', activeCard.rfid_card_id]);
      }
      await syncRenewalAndReleaseOnRfid({ residentId, requestId, userId });
      const updatedCard = await rfidRepository.findById(activeCard.rfid_card_id);
      return { success: true, message: 'RFID card verified and renewal completed.', data: updatedCard };
    } else {
      await rfidRepository.updateStatus(activeCard.rfid_card_id, 'CANCELLED');
    }
  }

  const cardId = await rfidRepository.create({
    residentId,
    cardUid,
    issuedDate: issuedDate || new Date().toISOString().split('T')[0],
    expirationDate: expirationDate || null
  });
  const card = await rfidRepository.findById(cardId);

  await syncRenewalAndReleaseOnRfid({ residentId, requestId, userId });

  return { success: true, message: 'RFID card registered successfully and renewal completed.', data: card };
};

const assignCard = async ({ residentId, cardUid, requestId, userId }) => {
  const resident = await residentRepository.findById(residentId);
  if (!resident) {
    return { success: false, message: 'Resident not found.' };
  }

  const existing = await rfidRepository.findByUid(cardUid);
  if (existing && existing.resident_id !== residentId && existing.status === 'ACTIVE') {
    return { success: false, message: 'RFID UID already assigned to another resident.' };
  }

  const activeCard = await rfidRepository.findActiveByResident(residentId);
  if (activeCard) {
    if (activeCard.card_uid === cardUid) {
      await syncRenewalAndReleaseOnRfid({ residentId, requestId, userId });
      return { success: true, message: 'RFID card already assigned and renewal completed.', data: activeCard };
    } else {
      await rfidRepository.updateStatus(activeCard.rfid_card_id, 'CANCELLED');
    }
  }

  const cardId = await rfidRepository.create({
    residentId,
    cardUid,
    issuedDate: new Date().toISOString().split('T')[0],
    expirationDate: null
  });
  const card = await rfidRepository.findById(cardId);

  await syncRenewalAndReleaseOnRfid({ residentId, requestId, userId });

  return { success: true, message: 'RFID card assigned successfully and renewal completed.', data: card };
};

const verifyCard = async (cardUid) => {
  const card = await rfidRepository.findByUid(cardUid);
  if (!card) {
    return { success: false, message: 'RFID card not found.' };
  }

  if (card.status !== 'ACTIVE') {
    return { success: false, message: 'RFID card is not active.' };
  }

  const { resident, rfid } = splitResidentAndRfid(card);

  return { success: true, message: 'RFID verified successfully.', data: { resident, rfid } };
};

const getResidentByUid = async (cardUid) => {
  const card = await rfidRepository.findByUid(cardUid);
  if (!card) {
    return { success: false, message: 'RFID card not found.' };
  }

  const { resident, rfid } = splitResidentAndRfid(card);

  return { success: true, message: 'Resident retrieved successfully.', data: { resident, rfid } };
};

// Splits the flattened rfid_cards JOIN residents row into the resident profile
// object (resident_id, name, demographics, contact, photo, status, barangay_id)
// and the RFID card record (card id, uid, issue/expiry, card status).
const splitResidentAndRfid = (card) => {
  const {
    first_name, middle_name, last_name, suffix, resident_code, birth_date, birth_place,
    nationality, religion, gender, civil_status, blood_type, occupation, contact_number, email,
    address_line, house_number, street, subdivision, block, lot, purok_zone, sitio, municipality, province, zip_code,
    emergency_contact_name, emergency_contact_number,
    resident_photo, resident_status, resident_barangay_id, ...rfidData
  } = card;

  const resident = {
    resident_id: card.resident_id,
    resident_code,
    first_name,
    middle_name,
    last_name,
    suffix,
    birth_date,
    birth_place,
    nationality,
    religion,
    gender,
    civil_status,
    blood_type,
    occupation,
    barangay_id: resident_barangay_id,
    address_line,
    house_number,
    street,
    subdivision,
    block,
    lot,
    purok_zone,
    sitio,
    municipality,
    province,
    zip_code,
    contact_number,
    email,
    emergency_contact_name,
    emergency_contact_number,
    photo: resident_photo,
    status: resident_status
  };

  return { resident, rfid: rfidData };
};

const updateCardStatus = async (rfidCardId, status) => {
  const card = await rfidRepository.findById(rfidCardId);
  if (!card) {
    return { success: false, message: 'RFID card not found.' };
  }

  await rfidRepository.updateStatus(rfidCardId, status);
  const updated = await rfidRepository.findById(rfidCardId);

  return { success: true, message: 'RFID card status updated successfully.', data: updated };
};

const replaceCard = async (rfidCardId, newCardUid, expirationDate, userId, requestId) => {
  const card = await rfidRepository.findById(rfidCardId);
  if (!card) {
    return { success: false, message: 'RFID card not found.' };
  }

  const existing = await rfidRepository.findByUid(newCardUid);
  if (existing && existing.resident_id !== card.resident_id && existing.status === 'ACTIVE') {
    return { success: false, message: 'New RFID UID already exists.' };
  }

  const newCardId = await rfidRepository.replace(rfidCardId, newCardUid, expirationDate);
  const newCard = await rfidRepository.findById(newCardId);

  await syncRenewalAndReleaseOnRfid({ residentId: card.resident_id, requestId, userId });

  return { success: true, message: 'RFID card replaced successfully.', data: newCard };
};

const deleteCard = async (rfidCardId) => {
  const card = await rfidRepository.findById(rfidCardId);
  if (!card) {
    return { success: false, message: 'RFID card not found.' };
  }

  await rfidRepository.remove(rfidCardId);
  return { success: true, message: 'RFID card deleted successfully.', data: null };
};

module.exports = { getAllCards, getCardById, registerCard, assignCard, verifyCard, getResidentByUid, updateCardStatus, replaceCard, deleteCard };
