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

const uploadIdTemplate = async (barangayId, file) => {
  if (!file) {
    return { success: false, message: 'A template file is required.' };
  }
  if (!file.mimetype.includes('wordprocessingml') && !file.originalname.toLowerCase().endsWith('.docx')) {
    return { success: false, message: 'The Barangay ID card template must be a .docx file.' };
  }

  const barangay = await findBarangay(barangayId);
  if (!barangay) {
    return { success: false, message: 'Barangay profile not found.' };
  }

  // Remove the previous template file (if any) to avoid orphan files.
  if (barangay.id_template_path) {
    try {
      const oldPath = path.join(__dirname, '../../uploads', barangay.id_template_path);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    } catch (err) {
      console.error('Failed to remove previous ID template:', err);
    }
  }

  await pool.query(
    `UPDATE barangays
     SET id_template_path = ?, id_template_original_name = ?, id_template_mime = ?, id_template_size = ?
     WHERE barangay_id = ?`,
    [`templates/${file.filename}`, file.originalname, file.mimetype, file.size, barangay.barangay_id]
  );

  const updated = await findBarangay(barangay.barangay_id);
  return { success: true, message: 'Barangay ID card template uploaded successfully.', data: updated };
};

const removeIdTemplate = async (barangayId) => {
  const barangay = await findBarangay(barangayId);
  if (!barangay) {
    return { success: false, message: 'Barangay profile not found.' };
  }
  if (barangay.id_template_path) {
    try {
      const oldPath = path.join(__dirname, '../../uploads', barangay.id_template_path);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    } catch (err) {
      console.error('Failed to remove ID template file:', err);
    }
  }
  await pool.query(
    `UPDATE barangays
     SET id_template_path = NULL, id_template_original_name = NULL, id_template_mime = NULL, id_template_size = NULL
     WHERE barangay_id = ?`,
    [barangay.barangay_id]
  );
  const updated = await findBarangay(barangay.barangay_id);
  return { success: true, message: 'Barangay ID card template removed successfully.', data: updated };
};

module.exports = { findBarangay, getProfile, uploadIdTemplate, removeIdTemplate };