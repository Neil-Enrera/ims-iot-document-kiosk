-- =====================================================
-- Migration: Add Barangay ID Renewal and Replacement Services
-- Purpose  : Provide dedicated services for ID Renewal and Lost/Damaged ID Replacement.
-- Date     : 2026-09-24
-- =====================================================

USE ims_iot_document_kiosk;

-- 1. Insert Barangay ID Renewal
INSERT INTO services (
  service_name,
  description,
  requirements,
  form_fields,
  processing_fee,
  requires_photo,
  can_combine_with_others,
  allow_multiple_active_requests,
  allow_new_request_after_release,
  is_active,
  template_path,
  template_original_name,
  template_mime,
  template_size,
  document_mappings
)
SELECT
  'Barangay ID Renewal',
  'Renewal of existing or expired Barangay Identification Card for registered residents.',
  '["Old / Expired Barangay ID or Valid Government ID", "2x2 ID Photo (White Background)"]',
  '[{"key":"full_name","label":"Full Name","type":"text","required":true,"placeholder":"Full Name"},{"key":"place_of_birth","label":"Place of Birth","type":"text","required":true,"placeholder":"e.g. San Jose, Antique"},{"key":"birth_date","label":"Birth Date","type":"date","required":true},{"key":"address","label":"Complete Address","type":"text","required":true,"placeholder":"Block, Lot, Street, Subdivision"},{"key":"gender","label":"Gender","type":"select","required":true,"options":["Male","Female","Other"]},{"key":"civil_status","label":"Civil Status","type":"select","required":true,"options":["Single","Married","Widowed","Separated"]},{"key":"emergency_contact_name","label":"Emergency Contact Person","type":"text","required":true,"placeholder":"Contact Person Name"},{"key":"emergency_contact_number","label":"Emergency Contact Number","type":"tel","required":true,"placeholder":"09xxxxxxxxx"}]',
  150.00,
  1,
  1,
  0,
  1,
  1,
  'templates/Barangay-San-Manuel-ID-Template-Dummy.docx',
  'Barangay-San-Manuel-ID-Template-Dummy.docx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  38653,
  '[{"placeholder":"resident_photo","source":"application","field":"photo"},{"placeholder":"full_name","source":"application","field":"full_name"},{"placeholder":"place_of_birth","source":"application","field":"place_of_birth"},{"placeholder":"date_of_birth","source":"application","field":"birth_date"},{"placeholder":"address","source":"application","field":"address"},{"placeholder":"id_number","source":"system","field":"request_number"},{"placeholder":"date_issued","source":"system","field":"current_date"},{"placeholder":"valid_until","source":"system","field":"current_date"},{"placeholder":"civil_status","source":"application","field":"civil_status"},{"placeholder":"emergency_contact_name","source":"application","field":"emergency_contact_name"},{"placeholder":"emergency_contact_number","source":"application","field":"emergency_contact_number"},{"placeholder":"gender","source":"application","field":"gender"}]'
FROM (SELECT 1) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_name = 'Barangay ID Renewal');

-- 2. Insert Barangay ID Replacement
INSERT INTO services (
  service_name,
  description,
  requirements,
  form_fields,
  processing_fee,
  requires_photo,
  can_combine_with_others,
  allow_multiple_active_requests,
  allow_new_request_after_release,
  is_active,
  template_path,
  template_original_name,
  template_mime,
  template_size,
  document_mappings
)
SELECT
  'Barangay ID Replacement',
  'Replacement of lost, damaged, or unreadable Barangay Identification Card.',
  '["Affidavit of Loss (for Lost ID) or Surrendered Damaged ID", "2x2 ID Photo (White Background)", "Valid Government ID or Proof of Residency"]',
  '[{"key":"full_name","label":"Full Name","type":"text","required":true,"placeholder":"Full Name"},{"key":"place_of_birth","label":"Place of Birth","type":"text","required":true,"placeholder":"e.g. San Jose, Antique"},{"key":"birth_date","label":"Birth Date","type":"date","required":true},{"key":"address","label":"Complete Address","type":"text","required":true,"placeholder":"Block, Lot, Street, Subdivision"},{"key":"gender","label":"Gender","type":"select","required":true,"options":["Male","Female","Other"]},{"key":"civil_status","label":"Civil Status","type":"select","required":true,"options":["Single","Married","Widowed","Separated"]},{"key":"replacement_reason","label":"Reason for Replacement","type":"select","required":true,"options":["Lost ID","Damaged / Unreadable ID","Information Correction / Update"]},{"key":"emergency_contact_name","label":"Emergency Contact Person","type":"text","required":true,"placeholder":"Contact Person Name"},{"key":"emergency_contact_number","label":"Emergency Contact Number","type":"tel","required":true,"placeholder":"09xxxxxxxxx"}]',
  150.00,
  1,
  1,
  0,
  1,
  1,
  'templates/Barangay-San-Manuel-ID-Template-Dummy.docx',
  'Barangay-San-Manuel-ID-Template-Dummy.docx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  38653,
  '[{"placeholder":"resident_photo","source":"application","field":"photo"},{"placeholder":"full_name","source":"application","field":"full_name"},{"placeholder":"place_of_birth","source":"application","field":"place_of_birth"},{"placeholder":"date_of_birth","source":"application","field":"birth_date"},{"placeholder":"address","source":"application","field":"address"},{"placeholder":"id_number","source":"system","field":"request_number"},{"placeholder":"date_issued","source":"system","field":"current_date"},{"placeholder":"valid_until","source":"system","field":"current_date"},{"placeholder":"civil_status","source":"application","field":"civil_status"},{"placeholder":"emergency_contact_name","source":"application","field":"emergency_contact_name"},{"placeholder":"emergency_contact_number","source":"application","field":"emergency_contact_number"},{"placeholder":"gender","source":"application","field":"gender"}]'
FROM (SELECT 1) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_name = 'Barangay ID Replacement');
