-- =====================================================
-- Migration: Barangay ID Age Eligibility & Requirements Settings
-- Purpose  : Make Barangay ID age eligibility rules and
--            minor/adult requirements configurable by Admin.
-- =====================================================

USE ims_iot_document_kiosk;

INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, is_readonly)
VALUES
    ('barangay_id_min_age', '15', 'number', 'barangay', 'Minimum age eligible to apply for a Barangay ID (default: 15)', 0),
    ('barangay_id_minor_reqs', 'Proof of Residency\nPurok/Zone Certification or Clearance\nBarangay ID Application Form', 'string', 'barangay', 'Requirements for minor applicants aged 15–17 (one per line)', 0),
    ('barangay_id_adult_reqs', 'Proof of Residency\nValid Government ID or Barangay Clearance\nBarangay ID Application Form', 'string', 'barangay', 'Requirements for adult applicants aged 18+ (one per line)', 0)
ON DUPLICATE KEY UPDATE
    description = VALUES(description);
