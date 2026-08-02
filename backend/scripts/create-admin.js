require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcrypt');
const pool = require('../src/config/database');

async function createAdmin() {
  const hash = await bcrypt.hash('admin123', 10);
  await pool.query(
    'INSERT INTO users (role_id, first_name, last_name, username, password_hash, email, status) VALUES (1, ?, ?, ?, ?, ?, ?)',
    ['Admin', 'User', 'admin', hash, 'admin@sanmanuel.gov.ph', 'ACTIVE']
  );
  console.log('Admin user created successfully');
  process.exit(0);
}

createAdmin().catch(err => { console.error(err); process.exit(1); });
