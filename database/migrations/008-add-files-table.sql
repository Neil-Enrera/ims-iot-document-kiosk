-- =====================================================
-- Migration: Standalone file management table
-- Purpose : The File Management page needs a general
--           document repository that is NOT tied to a
--           request. The previous implementation reused
--           request_attachments with a sentinel request_id
--           of 0, which violated the foreign key to
--           requests and broke every upload.
-- Date    : 2026-08-03
-- =====================================================

USE ims_iot_document_kiosk;

CREATE TABLE files (
    file_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NULL,
    file_size BIGINT NULL,
    file_path VARCHAR(500) NOT NULL,
    category VARCHAR(50) NULL,
    description VARCHAR(255) NULL,
    uploaded_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_file_uploader FOREIGN KEY (uploaded_by) REFERENCES users (user_id)
) ENGINE=InnoDB;

-- =====================================================
-- DONE
-- =====================================================
