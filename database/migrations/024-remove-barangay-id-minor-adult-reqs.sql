-- =====================================================
-- Migration: Remove Barangay ID Minor & Adult Requirements Settings
-- Purpose  : Remove separate minor and adult requirements settings
--            so Barangay ID uses unified service-level requirements.
-- =====================================================

USE ims_iot_document_kiosk;

DELETE FROM system_settings
WHERE setting_key IN ('barangay_id_minor_reqs', 'barangay_id_adult_reqs');
