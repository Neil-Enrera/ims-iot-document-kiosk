const pool = require('../config/database');

const findAll = async () => {
  const [rows] = await pool.query('SELECT * FROM system_settings ORDER BY category, setting_key');
  return rows;
};

const findByCategory = async (category) => {
  const [rows] = await pool.query('SELECT * FROM system_settings WHERE category = ? ORDER BY setting_key', [category]);
  return rows;
};

const findByKey = async (key) => {
  const [[row]] = await pool.query('SELECT * FROM system_settings WHERE setting_key = ?', [key]);
  return row;
};

const update = async (key, value, updatedBy) => {
  await pool.query('UPDATE system_settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?', [value, updatedBy, key]);
};

module.exports = { findAll, findByCategory, findByKey, update };
