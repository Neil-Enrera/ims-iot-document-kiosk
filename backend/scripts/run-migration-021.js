const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const pool = require('../src/config/database');
const fs = require('fs');

async function run() {
  const sqlPath = path.join(__dirname, '..', '..', 'database', 'migrations', '021-add-password-resets.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await pool.query(sql);
  console.log('Migration 021 executed successfully.');
  await pool.end();
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
