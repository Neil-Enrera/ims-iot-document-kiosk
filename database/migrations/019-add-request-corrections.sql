-- =====================================================
-- Migration: Correction audit trail for Edit Document
-- Purpose : "Return for Correction" (status-based resident
--           resubmission) was removed from the workflow.
--           Instead, barangay staff correct typos and
--           wrong information directly via the "Edit
--           Document" action in the admin panel. This
--           table records each field-level correction so
--           the updated values are traceable: every edit
--           keeps the original request row, updates the
--           request's form_data in place, and regenerates
--           the official document from the corrected data.
-- Date    : 2026-08-12
-- =====================================================

USE ims_iot_document_kiosk;

-- =====================================================
-- NOTE: statuses 10 ("Returned for Correction") and 11
-- ("Resubmitted") from the original migration were NOT
-- created here. "Return for Correction" was intentionally
-- removed; edits happen in-place via "Edit Document" and
-- never change the request status.
-- =====================================================

-- =====================================================
-- 1. Correction tracking table
--    One correction row is inserted per changed form field
--    when an administrator saves an "Edit Document" change.
--    The correction is RESOLVED immediately (the edit is
--    applied right away, not awaiting resident action).
-- =====================================================

CREATE TABLE IF NOT EXISTS request_corrections (
    correction_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    request_id BIGINT UNSIGNED NOT NULL,
    affected_field VARCHAR(100) NOT NULL,
    reason VARCHAR(255) NULL,
    comment TEXT NULL,
    original_value JSON NULL,
    updated_value JSON NULL,
    status ENUM('PENDING','RESOLVED') DEFAULT 'RESOLVED' NOT NULL,
    requested_by BIGINT UNSIGNED NOT NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_correction_request
        FOREIGN KEY (request_id)
        REFERENCES requests(request_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_correction_requested_by
        FOREIGN KEY (requested_by)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    INDEX idx_correction_request (request_id),
    INDEX idx_correction_status (status)
) ENGINE=InnoDB;

-- =====================================================
-- DONE
-- =====================================================
