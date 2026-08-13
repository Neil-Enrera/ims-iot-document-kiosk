const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: +(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ims_iot_document_kiosk'
  });
  const [r] = await c.query('SELECT request_id, request_number, status_id FROM requests WHERE status_id IN (10,11)');
  console.log('REQUESTS in 10/11:', JSON.stringify(r));
  const [h] = await c.query('SELECT history_id, request_id, old_status_id, new_status_id FROM request_status_history WHERE old_status_id IN (10,11) OR new_status_id IN (10,11)');
  console.log('HISTORY rows referencing 10/11:', h.length, JSON.stringify(h.slice(0, 20)));
  const [cr] = await c.query('SELECT correction_id, request_id, status FROM request_corrections');
  console.log('CORRECTIONS:', JSON.stringify(cr));
  await c.end();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
