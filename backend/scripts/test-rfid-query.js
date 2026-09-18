const rfidRepo = require('../src/repositories/rfid.repository');

(async () => {
  try {
    const res = await rfidRepo.findAll({ page: 2, limit: 10, sortBy: 'resident_name', sortOrder: 'ASC' });
    console.log('Total residents in RFID view:', res.total);
    console.log('Page 1 items:');
    res.cards.forEach((c, idx) => {
      console.log(`${idx + 1}. [ID: ${c.resident_id}] ${c.resident_name} (${c.resident_code}) - UID: ${c.card_uid || 'None'} - Status: ${c.registration_status}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
