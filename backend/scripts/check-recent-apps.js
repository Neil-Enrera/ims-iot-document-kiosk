const db = require('../src/config/database');

(async () => {
  try {
    const [apps] = await db.query('SELECT application_id, application_number, first_name, last_name, status, resident_id, created_at FROM barangay_id_applications ORDER BY application_id DESC LIMIT 5');
    console.log('--- RECENT APPLICATIONS ---');
    console.log(apps);

    const [residents] = await db.query('SELECT resident_id, resident_code, first_name, last_name, status, created_at FROM residents ORDER BY resident_id DESC LIMIT 5');
    console.log('--- RECENT RESIDENTS ---');
    console.log(residents);

    const [rfidCards] = await db.query('SELECT rfid_card_id, resident_id, card_uid, status, created_at FROM rfid_cards ORDER BY rfid_card_id DESC LIMIT 5');
    console.log('--- RECENT RFID CARDS ---');
    console.log(rfidCards);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
