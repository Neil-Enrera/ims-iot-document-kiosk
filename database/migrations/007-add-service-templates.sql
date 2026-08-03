-- =====================================================
-- Migration: Service document templates
-- Purpose : Store an official document template (PDF, DOCX,
--           or image) for each barangay service. The template
--           is the reference for the fields an administrator
--           configures on the resident application form.
--           No OCR/AI field extraction is performed — the
--           template is a manual reference only.
-- Date    : 2026-08-03
-- =====================================================

USE ims_iot_document_kiosk;

-- -----------------------------------------------------
-- services: add official template file columns
-- -----------------------------------------------------
ALTER TABLE services
  ADD COLUMN template_path VARCHAR(255) NULL AFTER approval_workflow,
  ADD COLUMN template_original_name VARCHAR(255) NULL AFTER template_path,
  ADD COLUMN template_mime VARCHAR(100) NULL AFTER template_original_name,
  ADD COLUMN template_size BIGINT NULL AFTER template_mime;

-- =====================================================
-- DONE
-- =====================================================
