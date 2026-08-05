-- =====================================================
-- Migration: Document preview & approval workflow
-- Purpose : Track review/approval of generated documents so
--           admins preview a completed document before it is
--           approved for printing, download, or release.
--           Also stores placeholder-generation warnings so
--           missing/invalid placeholders can be surfaced.
-- Date    : 2026-08-05
-- =====================================================

USE ims_iot_document_kiosk;

-- -----------------------------------------------------
-- generated_documents: review/approval fields
-- -----------------------------------------------------
-- approval_status lifecycle:
--   pending  -> newly generated, awaiting admin review
--   approved -> admin reviewed the completed document (print/download/release allowed)
--   rejected -> admin rejected the generated document (request terminal)
--   returned -> needs correction; admin can regenerate
ALTER TABLE generated_documents
  ADD COLUMN approval_status ENUM('pending','approved','rejected','returned') NOT NULL DEFAULT 'pending' AFTER generated_at,
  ADD COLUMN generation_warnings JSON NULL AFTER approval_status,
  ADD COLUMN reviewed_by BIGINT UNSIGNED NULL AFTER generation_warnings,
  ADD COLUMN reviewed_at DATETIME NULL AFTER reviewed_by,
  ADD COLUMN review_remarks VARCHAR(500) NULL AFTER reviewed_at,
  ADD CONSTRAINT fk_gen_doc_reviewer
      FOREIGN KEY (reviewed_by)
      REFERENCES users(user_id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;

-- =====================================================
-- DONE
-- =====================================================
