-- =====================================================
-- Migration: Barangay ID approval, ID number, and card template
-- Purpose : Support the Barangay ID review workflow:
--           - RETURNED status for "return for correction"
--           - Official ID number assigned at approval
--             (BRGY-YYYY-NNNNNN) with issue/expiry dates
--           - Configurable validity period (id_validity_years)
--           - A single barangay-level ID card DOCX template
-- Date    : 2026-08-09
-- =====================================================

USE ims_iot_document_kiosk;

-- -----------------------------------------------------
-- barangay_id_applications: status + official ID fields
-- -----------------------------------------------------
ALTER TABLE barangay_id_applications
  MODIFY COLUMN status ENUM('PENDING','APPROVED','REJECTED','RETURNED') NOT NULL DEFAULT 'PENDING',
  ADD COLUMN id_number VARCHAR(30) NULL AFTER status,
  ADD COLUMN id_issued_at DATETIME NULL AFTER id_number,
  ADD COLUMN id_expiration_date DATE NULL AFTER id_issued_at,
  ADD COLUMN id_card_path VARCHAR(255) NULL AFTER id_expiration_date,
  ADD COLUMN id_card_mime VARCHAR(100) NULL AFTER id_card_path,
  ADD COLUMN id_card_size BIGINT NULL AFTER id_card_mime,
  ADD COLUMN id_card_generated_at DATETIME NULL AFTER id_card_size;

CREATE INDEX idx_application_id_number ON barangay_id_applications (id_number);

-- -----------------------------------------------------
-- barangays: single ID card template (DOCX) for the barangay
-- -----------------------------------------------------
ALTER TABLE barangays
  ADD COLUMN id_template_path VARCHAR(255) NULL AFTER address,
  ADD COLUMN id_template_original_name VARCHAR(255) NULL AFTER id_template_path,
  ADD COLUMN id_template_mime VARCHAR(100) NULL AFTER id_template_original_name,
  ADD COLUMN id_template_size BIGINT NULL AFTER id_template_mime;

-- -----------------------------------------------------
-- system_settings: configurable ID validity (in years)
-- -----------------------------------------------------
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, is_readonly)
SELECT 'id_validity_years', '3', 'number', 'barangay', 'Number of years a Barangay ID stays valid from its issue date', 0
WHERE NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'id_validity_years');

-- =====================================================
-- DONE
-- =====================================================
