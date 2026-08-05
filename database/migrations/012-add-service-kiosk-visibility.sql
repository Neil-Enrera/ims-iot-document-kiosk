-- =====================================================
-- Migration: Independent kiosk visibility for services
-- Purpose : Let a service remain Active (usable in admin:
--           new requests, document generation) while being
--           hidden from the Kiosk selection screen.
--           show_in_kiosk is checked by default and is
--           independent of is_active.
-- Date    : 2026-08-05
-- =====================================================

USE ims_iot_document_kiosk;

ALTER TABLE services
  ADD COLUMN show_in_kiosk BOOLEAN DEFAULT TRUE AFTER is_active;

-- =====================================================
-- DONE
-- =====================================================