-- =====================================================
-- Migration: Remove Barangay ID Replacement Service
-- Purpose  : Remove Barangay ID Replacement completely as requested.
-- Date     : 2026-09-24
-- =====================================================

USE ims_iot_document_kiosk;

DELETE FROM services WHERE service_name = 'Barangay ID Replacement';
