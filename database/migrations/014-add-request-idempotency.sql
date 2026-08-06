-- =====================================================
-- Migration: Duplicate request prevention (idempotency)
-- Purpose : Prevent accidental duplicate document requests
--           (double-click, network retry, repeated submission)
--           while still allowing legitimate new requests.
--           The kiosk client sends a stable idempotency_key for
--           one submission attempt; the UNIQUE index makes the
--           server reject/return the existing row on a re-send.
-- Date    : 2026-08-06
-- =====================================================

USE ims_iot_document_kiosk;

-- -----------------------------------------------------
-- requests: idempotency_key + UNIQUE guard
-- -----------------------------------------------------
ALTER TABLE requests
  ADD COLUMN idempotency_key VARCHAR(64) NULL AFTER service_snapshot,
  ADD UNIQUE KEY uq_requests_idempotency (idempotency_key);

-- =====================================================
-- DONE
-- =====================================================
