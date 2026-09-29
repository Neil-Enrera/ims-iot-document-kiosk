-- =====================================================
-- Migration: Add Email and Contact Number to Barangay ID Form Fields
-- Purpose  : Ensure Barangay ID and Barangay ID Renewal dynamic form fields include contact_number and email.
-- Date     : 2026-09-29
-- =====================================================

USE ims_iot_document_kiosk;

UPDATE services
SET form_fields = JSON_ARRAY(
  JSON_OBJECT('key','full_name','label','Full Name','type','text','required',true,'placeholder','Full Name'),
  JSON_OBJECT('key','place_of_birth','label','Place of Birth','type','text','required',true,'placeholder','e.g. City of San Jose del Monte'),
  JSON_OBJECT('key','birth_date','label','Birth Date','type','date','required',true),
  JSON_OBJECT('key','gender','label','Gender','type','select','required',true,'options',JSON_ARRAY('Male','Female','Other')),
  JSON_OBJECT('key','civil_status','label','Civil Status','type','select','required',true,'options',JSON_ARRAY('Single','Married','Widowed','Separated','Divorced')),
  JSON_OBJECT('key','blood_type','label','Blood Type','type','select','required',false,'options',JSON_ARRAY('A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown')),
  JSON_OBJECT('key','contact_number','label','Contact Number','type','tel','required',true,'placeholder','09XX XXX XXXX'),
  JSON_OBJECT('key','email','label','Email Address (Optional)','type','email','required',false,'placeholder','you@example.com'),
  JSON_OBJECT('key','address','label','Complete Address','type','text','required',true,'placeholder','House No., Street, Barangay San Manuel'),
  JSON_OBJECT('key','emergency_contact_name','label','Emergency Contact Person','type','text','required',true,'placeholder','Contact Person Name'),
  JSON_OBJECT('key','emergency_contact_number','label','Emergency Contact Number','type','tel','required',true,'placeholder','09XX XXX XXXX')
)
WHERE service_name IN ('Barangay ID', 'Barangay ID Renewal');
