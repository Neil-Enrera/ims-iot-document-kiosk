-- =====================================================
-- Migration: Multiple Service Request Transactions
-- Purpose : Allow one kiosk submission (a TRANSACTION) to
--           create MULTIPLE independent Service Requests.
--
--           ONE TRANSACTION -> MULTIPLE SERVICE REQUESTS
--
--           Each Service Request keeps its own:
--             service, form data, requirements, status,
--             status history, corrections, generated
--             document and release status. The Transaction
--             only groups the batch and anchors the
--             idempotency guard (whole-submission retry).
--
--           Also adds service-level policies for:
--             - combining services in one transaction
--             - allowing duplicate active requests
--             - allowing a new request after release
-- Date    : 2026-08-13
-- =====================================================

USE ims_iot_document_kiosk;

-- -----------------------------------------------------
-- 1. transactions: one row per kiosk submission batch
-- -----------------------------------------------------
-- resident_id is NULL for guest sessions; guest_snapshot
-- stores the temporary (non-resident) identity used for
-- possible-duplicate matching. idempotency_key guards the
-- whole submission (double-click / refresh / network retry)
-- so a successful retry returns the existing transaction
-- instead of creating duplicate Service Requests.
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    transaction_number VARCHAR(30) NOT NULL UNIQUE,
    resident_id BIGINT UNSIGNED NULL,
    guest_snapshot JSON NULL,
    idempotency_key VARCHAR(64) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_transaction_resident
        FOREIGN KEY (resident_id)
        REFERENCES residents(resident_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    UNIQUE KEY uq_transactions_idempotency (idempotency_key),
    INDEX idx_transaction_resident (resident_id),
    INDEX idx_transaction_number (transaction_number)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- 2. requests: link each Service Request to a Transaction
-- -----------------------------------------------------
ALTER TABLE requests
    ADD COLUMN transaction_id BIGINT UNSIGNED NULL AFTER request_id,
    ADD CONSTRAINT fk_request_transaction
        FOREIGN KEY (transaction_id)
        REFERENCES transactions(transaction_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    ADD INDEX idx_request_transaction (transaction_id);

-- -----------------------------------------------------
-- 3. services: multiple-service + duplicate policy config
-- -----------------------------------------------------
-- can_combine_with_others            : may this service be requested
--                                      alongside other services in one
--                                      transaction? FALSE = "This service
--                                      must be requested separately."
-- allow_multiple_active_requests     : may a resident have more than one
--                                      ACTIVE request for this service at
--                                      the same time? (active = any status
--                                      before Released/Rejected/Cancelled)
-- allow_new_request_after_release    : may a new request be created after a
--                                      Released/Rejected/Cancelled request?
-- Defaults follow the spec examples: all services are combinable,
-- duplicates of active requests are prevented, and repeat requests after
-- release are allowed (no artificial time restrictions).
ALTER TABLE services
    ADD COLUMN can_combine_with_others BOOLEAN DEFAULT TRUE AFTER requires_photo,
    ADD COLUMN allow_multiple_active_requests BOOLEAN DEFAULT FALSE AFTER can_combine_with_others,
    ADD COLUMN allow_new_request_after_release BOOLEAN DEFAULT TRUE AFTER allow_multiple_active_requests;

-- =====================================================
-- DONE
-- =====================================================