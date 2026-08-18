-- =====================================================
-- Migration: Move Barangay ID template settings to services table
-- Purpose : Support template mapping, form field mapping,
--           and template upload directly under 'Barangay ID' service.
-- Date    : 2026-08-16
-- =====================================================

USE ims_iot_document_kiosk;

-- IDEMPOTENT INSERT: Ensure Barangay ID service exists with correct default form fields
INSERT INTO services (service_name, description, requirements, form_fields, processing_fee, requires_photo, is_active)
SELECT 
  'Barangay ID',
  'Barangay Identification Card for residents.',
  '["Birth Certificate or Valid ID", "Proof of Residency", "Passport-size photo (captured at the kiosk)"]',
  '[{"key":"full_name","label":"Full Name","type":"text","required":true,"placeholder":"Full name"},{"key":"address","label":"Address","type":"text","required":true,"placeholder":"Complete address"},{"key":"birth_date","label":"Birthdate","type":"date","required":true},{"key":"gender","label":"Gender","type":"select","required":true,"options":["Male","Female","Other"]},{"key":"civil_status","label":"Civil Status","type":"select","required":true,"options":["Single","Married","Widowed","Separated","Divorced"]},{"key":"blood_type","label":"Blood Type","type":"select","required":false,"options":["A+","A-","B+","B-","AB+","AB-","O+","O-","Unknown"]},{"key":"emergency_contact_name","label":"Emergency Contact Person","type":"text","required":true,"placeholder":"Name of emergency contact"},{"key":"emergency_contact_number","label":"Emergency Contact Number","type":"tel","required":true,"placeholder":"09XX XXX XXXX"}]',
  150.00,
  TRUE,
  TRUE
FROM (SELECT 1) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_name = 'Barangay ID');

-- Move template details from barangays to the services row for 'Barangay ID'
UPDATE services s, barangays b
SET 
  s.template_path = b.id_template_path,
  s.template_original_name = b.id_template_original_name,
  s.template_mime = b.id_template_mime,
  s.template_size = b.id_template_size
WHERE s.service_name = 'Barangay ID'
  AND b.id_template_path IS NOT NULL;
