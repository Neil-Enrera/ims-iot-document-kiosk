const pool = require('../src/config/database');

async function migrate() {
  const sql = `
    CREATE TABLE IF NOT EXISTS resident_update_requests (
      request_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      request_number VARCHAR(30) NOT NULL UNIQUE,
      resident_id BIGINT UNSIGNED NOT NULL,
      requested_changes JSON NOT NULL,
      reason TEXT NOT NULL,
      status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
      reviewed_by BIGINT UNSIGNED NULL,
      reviewed_at TIMESTAMP NULL,
      review_notes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (resident_id) REFERENCES residents(resident_id) ON DELETE CASCADE,
      FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL
    );
  `;
  await pool.query(sql);
  console.log('TABLE_CREATED_SUCCESSFULLY');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
