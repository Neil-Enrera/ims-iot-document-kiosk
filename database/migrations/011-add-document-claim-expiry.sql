-- =====================================================
-- Migration: Document claim window / expiry
-- Purpose : Done documents (Ready for Release and Released)
--           get a configurable claim window. If the resident does
--           not claim within the window, staff can see the request
--           as EXPIRED. Expiry never deletes the generated file.
--           Expired done documents are hidden from the Status Display Board.
-- Date    : 2026-08-05
-- =====================================================

USE ims_iot_document_kiosk;

-- -----------------------------------------------------
-- requests: track when a done document's claim window ends
-- -----------------------------------------------------
-- expires_at : deadline for a Ready for Release document to be claimed.
--              Cleared (NULL) when the request is released or moved back.
--              A ready document is considered EXPIRED when
--              status_id = 6 AND expires_at < NOW() (computed on the fly).
ALTER TABLE requests
  ADD COLUMN expires_at DATETIME NULL AFTER release_date;

-- -----------------------------------------------------
-- system_settings: configurable claim window (in days)
-- -----------------------------------------------------
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, is_readonly)
SELECT 'document_claim_days', '15', 'number', 'document', 'Number of days a done (Ready for Release) document stays claimable before it is considered expired', 0
WHERE NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'document_claim_days');

-- =====================================================
-- DONE
-- =====================================================