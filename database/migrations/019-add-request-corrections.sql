-- =====================================================
-- Migration: Request Correction & Resubmission Workflow
-- Purpose : Allow staff to return a request for correction
--           (status 10) instead of rejecting it, and let the
--           resident correct affected fields and resubmit
--           (status 11) keeping the original request number.
-- Date    : 2026-08-12
-- =====================================================

USE ims_iot_document_kiosk;

-- =====================================================
-- 1. Add the two new workflow statuses
-- =====================================================

INSERT INTO request_statuses (status_id, status_name, description) VALUES
(10, 'Returned for Correction', 'Request returned by staff; resident must correct affected fields and resubmit'),
(11, 'Resubmitted', 'Resident has corrected the affected fields and resubmitted the request');

-- =====================================================
-- 2. Correction tracking table
--    One request may accumulate multiple correction cycles.
--    A correction is PENDING until the resident resubmits.
-- =====================================================

CREATE TABLE IF NOT EXISTS request_corrections (
    correction_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    request_id BIGINT UNSIGNED NOT NULL,
    affected_field VARCHAR(100) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    comment TEXT,
    original_value JSON NULL,
    updated_value JSON NULL,
    status ENUM('PENDING','RESOLVED') DEFAULT 'PENDING' NOT NULL,
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
