-- =====================================================
-- Migration: Add requires_photo to services
-- Purpose : Conditional image capture per service
-- Date    : 2026-08-02
-- =====================================================

USE ims_iot_document_kiosk;

-- Add requires_photo column (default FALSE)
ALTER TABLE services ADD COLUMN requires_photo BOOLEAN DEFAULT FALSE AFTER processing_fee;

-- Set Barangay ID to require photo
UPDATE services SET requires_photo = TRUE WHERE service_name = 'Barangay ID';

-- =====================================================
-- DONE
-- =====================================================
