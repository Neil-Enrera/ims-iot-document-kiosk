-- =====================================================
-- Migration: Supplemental resident & barangay fields
-- Purpose : Back the master placeholder library. Several
--           placeholders (birth place, nationality,
--           occupation, house/street/purok/sitio address
--           parts, ZIP, and barangay officials) need
--           source columns. All columns are nullable so
--           existing records remain valid; placeholders
--           render empty until populated.
-- Date    : 2026-08-06
-- =====================================================

USE ims_iot_document_kiosk;

-- -----------------------------------------------------
-- residents: identity + address part columns
-- -----------------------------------------------------
ALTER TABLE residents
  ADD COLUMN birth_place VARCHAR(150) NULL AFTER birth_date,
  ADD COLUMN nationality VARCHAR(50) NULL AFTER birth_place,
  ADD COLUMN religion VARCHAR(50) NULL AFTER nationality,
  ADD COLUMN occupation VARCHAR(100) NULL AFTER religion,
  ADD COLUMN house_number VARCHAR(20) NULL AFTER address_line,
  ADD COLUMN street VARCHAR(100) NULL AFTER house_number,
  ADD COLUMN purok_zone VARCHAR(50) NULL AFTER street,
  ADD COLUMN sitio VARCHAR(100) NULL AFTER purok_zone,
  ADD COLUMN municipality VARCHAR(100) NULL AFTER sitio,
  ADD COLUMN province VARCHAR(100) NULL AFTER municipality,
  ADD COLUMN zip_code VARCHAR(10) NULL AFTER province;

-- -----------------------------------------------------
-- barangays: officials + address for document sign-offs
-- -----------------------------------------------------
ALTER TABLE barangays
  ADD COLUMN captain_name VARCHAR(100) NULL AFTER email,
  ADD COLUMN secretary_name VARCHAR(100) NULL AFTER captain_name,
  ADD COLUMN treasurer_name VARCHAR(100) NULL AFTER secretary_name,
  ADD COLUMN address VARCHAR(200) NULL AFTER treasurer_name;

-- =====================================================
-- DONE
-- =====================================================
