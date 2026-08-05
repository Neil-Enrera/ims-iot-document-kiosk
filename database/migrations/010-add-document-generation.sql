-- =====================================================
-- Migration: Automatic document generation
-- Purpose : Configure placeholder mappings per service so
--           the system can automatically populate the official
--           DOCX template after a request is approved.
--           Generated documents are stored separately from
--           the original template (which is never modified).
-- Date    : 2026-08-05
-- =====================================================

USE ims_iot_document_kiosk;

-- -----------------------------------------------------
-- services: store placeholder mapping configuration
-- -----------------------------------------------------
-- Each entry: { placeholder, source, field }
--   source: 'resident'  -> resident record fields
--           'application' -> submitted form_data keys
--           'system'     -> system-generated values
ALTER TABLE services
  ADD COLUMN document_mappings JSON NULL AFTER template_size;

-- -----------------------------------------------------
-- generated_documents: one row per generated official document
-- -----------------------------------------------------
CREATE TABLE generated_documents (
    document_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    request_id BIGINT UNSIGNED NOT NULL,
    service_id BIGINT UNSIGNED NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NULL,
    generated_by BIGINT UNSIGNED,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_gen_doc_request
        FOREIGN KEY (request_id)
        REFERENCES requests(request_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_gen_doc_service
        FOREIGN KEY (service_id)
        REFERENCES services(service_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_gen_doc_user
        FOREIGN KEY (generated_by)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    INDEX idx_gen_doc_request (request_id)
) ENGINE=InnoDB;

-- =====================================================
-- DONE
-- =====================================================
