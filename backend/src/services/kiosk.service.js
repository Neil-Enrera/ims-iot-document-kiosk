const kioskRepository = require('../repositories/kiosk.repository');

const searchResidents = async (search, limit) => {
  return await kioskRepository.searchResidents(search, limit);
};

const getResidentById = async (id) => {
  return await kioskRepository.findResidentById(id);
};

const getHardwareStatus = async () => {
  return {
    arduino: 'Disabled',
    rfid: 'Disabled',
    camera: 'Ready',
    printer: 'Offline',
    rfidEnabled: false
  };
};

module.exports = { searchResidents, getResidentById, getHardwareStatus };
