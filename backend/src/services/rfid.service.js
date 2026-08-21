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

const registerCard = async ({ cardUid, residentId, issuedDate, expirationDate }) => {
  const existing = await rfidRepository.findByUid(cardUid);
  if (existing) {
    return { success: false, message: 'RFID UID already exists.' };
  }

  const resident = await residentRepository.findById(residentId);
  if (!resident) {
    return { success: false, message: 'Resident not found.' };
  }

  const activeCard = await rfidRepository.findActiveByResident(residentId);
  if (activeCard) {
    return { success: false, message: 'Resident already has an active RFID card.' };
  }

  const cardId = await rfidRepository.create({ residentId, cardUid, issuedDate, expirationDate });
  const card = await rfidRepository.findById(cardId);

  return { success: true, message: 'RFID card registered successfully.', data: card };
};

const assignCard = async ({ residentId, cardUid }) => {
  const resident = await residentRepository.findById(residentId);
  if (!resident) {
    return { success: false, message: 'Resident not found.' };
  }

  const activeCard = await rfidRepository.findActiveByResident(residentId);
  if (activeCard) {
    return { success: false, message: 'Resident already has an active RFID card.' };
  }

  const existing = await rfidRepository.findByUid(cardUid);
  if (existing) {
    return { success: false, message: 'RFID UID already assigned to another resident.' };
  }

  const cardId = await rfidRepository.create({ residentId, cardUid, issuedDate: new Date().toISOString().split('T')[0], expirationDate: null });
  const card = await rfidRepository.findById(cardId);

  return { success: true, message: 'RFID card assigned successfully.', data: card };
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
    first_name, middle_name, last_name, suffix, resident_code, birth_date,
    gender, civil_status, blood_type, occupation, contact_number, email, address_line,
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
    gender,
    civil_status,
    blood_type,
    occupation,
    barangay_id: resident_barangay_id,
    address_line,
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

const replaceCard = async (rfidCardId, newCardUid, expirationDate) => {
  const card = await rfidRepository.findById(rfidCardId);
  if (!card) {
    return { success: false, message: 'RFID card not found.' };
  }

  const existing = await rfidRepository.findByUid(newCardUid);
  if (existing) {
    return { success: false, message: 'New RFID UID already exists.' };
  }

  const newCardId = await rfidRepository.replace(rfidCardId, newCardUid, expirationDate);
  const newCard = await rfidRepository.findById(newCardId);

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
