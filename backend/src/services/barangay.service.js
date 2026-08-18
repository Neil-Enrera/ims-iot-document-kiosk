const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

// ============================================================
// Barangay service
// ------------------------------------------------------------
// Manages the single official Barangay ID card DOCX template
// stored on the barangay row (barangays.id_template_*). This
// mirrors the per-service template machinery but keeps the ID
// card template at barangay level so every approved application
// renders against one canonical card design.
// ============================================================

const findBarangay = async (barangayId) => {
  const [rows] = await pool.query('SELECT * FROM barangays WHERE barangay_id = ? LIMIT 1', [barangayId || 1]);
  if (rows[0]) return rows[0];
  const [fallback] = await pool.query('SELECT * FROM barangays ORDER BY barangay_id ASC LIMIT 1');
  return fallback[0] || null;
};

const getProfile = async (barangayId) => {
  const barangay = await findBarangay(barangayId);
  if (!barangay) return { success: false, message: 'Barangay profile not found.' };
  return { success: true, message: 'Barangay profile retrieved successfully.', data: barangay };
};

module.exports = { findBarangay, getProfile };