-- =====================================================
-- Migration: Service configuration, dynamic forms, request form data
-- Purpose : Configurable services (requirements, dynamic form fields,
--           required documents, processing time, approval workflow),
--           store submitted form data on requests, and extend resident
--           record for Barangay ID applications.
-- Date    : 2026-08-02
-- =====================================================

USE ims_iot_document_kiosk;

-- -----------------------------------------------------
-- services: add configuration columns
-- -----------------------------------------------------
ALTER TABLE services
  ADD COLUMN requirements JSON NULL AFTER description,
  ADD COLUMN form_fields JSON NULL AFTER requirements,
  ADD COLUMN required_documents JSON NULL AFTER form_fields,
  ADD COLUMN processing_time VARCHAR(100) NULL AFTER processing_fee,
  ADD COLUMN approval_workflow VARCHAR(100) NULL AFTER is_active;

-- -----------------------------------------------------
-- requests: store submitted dynamic form data + service snapshot
-- -----------------------------------------------------
ALTER TABLE requests
  ADD COLUMN form_data JSON NULL AFTER remarks,
  ADD COLUMN service_snapshot JSON NULL AFTER form_data;

-- -----------------------------------------------------
-- residents: extra fields for Barangay ID applications
-- -----------------------------------------------------
ALTER TABLE residents
  ADD COLUMN blood_type VARCHAR(10) NULL AFTER civil_status,
  ADD COLUMN emergency_contact_name VARCHAR(100) NULL AFTER contact_number,
  ADD COLUMN emergency_contact_number VARCHAR(20) NULL AFTER emergency_contact_name;

-- -----------------------------------------------------
-- Seed configuration for known services (idempotent by service_name)
-- -----------------------------------------------------

INSERT INTO services (service_name, description, requirements, form_fields, required_documents, processing_fee, requires_photo, processing_time, approval_workflow, is_active) VALUES
(
  'Barangay Clearance',
  'General clearance certifying the resident has no criminal record within the barangay.',
  JSON_ARRAY(
    'Valid Government ID',
    'Proof of Residency (if applicable)',
    'Community Tax Certificate (Cedula) if required by the barangay'
  ),
  JSON_ARRAY(
    JSON_OBJECT('key','full_name','label','Full Name','type','text','required',true,'placeholder','Full name'),
    JSON_OBJECT('key','address','label','Address','type','text','required',true,'placeholder','Complete address'),
    JSON_OBJECT('key','birth_date','label','Date of Birth','type','date','required',true),
    JSON_OBJECT('key','civil_status','label','Civil Status','type','select','required',true,'options',JSON_ARRAY('Single','Married','Widowed','Separated','Divorced')),
    JSON_OBJECT('key','contact_number','label','Contact Number','type','tel','required',true,'placeholder','09XX XXX XXXX'),
    JSON_OBJECT('key','purpose','label','Purpose of Request','type','textarea','required',true,'placeholder','Why do you need this document?'),
    JSON_OBJECT('key','occupation','label','Occupation','type','text','required',false,'placeholder','Your occupation'),
    JSON_OBJECT('key','email','label','Email (optional)','type','email','required',false,'placeholder','you@example.com')
  ),
  JSON_ARRAY('Valid Government ID', 'Proof of Residency'),
  100.00, FALSE, '1-2 business days', 'Review by Barangay Secretary, approve by Barangay Captain', TRUE
),
(
  'Barangay Certificate',
  'Certificate attesting to the residency or character of a resident.',
  JSON_ARRAY(
    'Valid Government ID',
    'Proof of Residency'
  ),
  JSON_ARRAY(
    JSON_OBJECT('key','full_name','label','Full Name','type','text','required',true,'placeholder','Full name'),
    JSON_OBJECT('key','address','label','Address','type','text','required',true,'placeholder','Complete address'),
    JSON_OBJECT('key','birth_date','label','Date of Birth','type','date','required',true),
    JSON_OBJECT('key','purpose','label','Purpose of Request','type','textarea','required',true,'placeholder','Why do you need this document?')
  ),
  JSON_ARRAY('Valid Government ID', 'Proof of Residency'),
  100.00, FALSE, '1-2 business days', 'Review by Barangay Secretary, approve by Barangay Captain', TRUE
),
(
  'Certificate of Residency',
  'Certificate confirming that a person has been a resident of the barangay.',
  JSON_ARRAY(
    'Proof of Residency',
    'Valid Government ID'
  ),
  JSON_ARRAY(
    JSON_OBJECT('key','full_name','label','Full Name','type','text','required',true,'placeholder','Full name'),
    JSON_OBJECT('key','address','label','Address','type','text','required',true,'placeholder','Complete address'),
    JSON_OBJECT('key','years_of_residency','label','Years of Residency','type','number','required',true,'placeholder','How many years?'),
    JSON_OBJECT('key','purpose','label','Purpose','type','textarea','required',true,'placeholder','Why do you need this document?')
  ),
  JSON_ARRAY('Proof of Residency', 'Valid Government ID'),
  50.00, FALSE, 'Same day', 'Review by Barangay Secretary, approve by Barangay Captain', TRUE
),
(
  'Barangay Residency',
  'Residency certificate for barangay residents.',
  JSON_ARRAY(
    'Proof of Residency',
    'Valid Government ID'
  ),
  JSON_ARRAY(
    JSON_OBJECT('key','full_name','label','Full Name','type','text','required',true,'placeholder','Full name'),
    JSON_OBJECT('key','address','label','Address','type','text','required',true,'placeholder','Complete address'),
    JSON_OBJECT('key','years_of_residency','label','Years of Residency','type','number','required',true,'placeholder','How many years?'),
    JSON_OBJECT('key','purpose','label','Purpose','type','textarea','required',true,'placeholder','Why do you need this document?')
  ),
  JSON_ARRAY('Proof of Residency', 'Valid Government ID'),
  50.00, FALSE, 'Same day', 'Review by Barangay Secretary, approve by Barangay Captain', TRUE
),
(
  'Certificate of Indigency',
  'Certificate stating that a resident qualifies as an indigent.',
  JSON_ARRAY(
    'Valid Government ID',
    'Proof of Residency'
  ),
  JSON_ARRAY(
    JSON_OBJECT('key','full_name','label','Full Name','type','text','required',true,'placeholder','Full name'),
    JSON_OBJECT('key','address','label','Address','type','text','required',true,'placeholder','Complete address'),
    JSON_OBJECT('key','occupation','label','Occupation','type','text','required',true,'placeholder','Your occupation'),
    JSON_OBJECT('key','monthly_income','label','Monthly Income','type','number','required',true,'placeholder','Approximate monthly income'),
    JSON_OBJECT('key','household_members','label','Household Members','type','number','required',true,'placeholder','Number of household members'),
    JSON_OBJECT('key','purpose','label','Purpose','type','textarea','required',true,'placeholder','Why do you need this document?')
  ),
  JSON_ARRAY('Valid Government ID', 'Proof of Residency'),
  0.00, FALSE, 'Same day', 'Review by Barangay Secretary, approve by Barangay Captain', TRUE
),
(
  'Barangay Business Clearance',
  'Clearance for business operations within the barangay.',
  JSON_ARRAY(
    'Business Permit / DTI Registration',
    'Valid Government ID of owner'
  ),
  JSON_ARRAY(
    JSON_OBJECT('key','business_name','label','Business Name','type','text','required',true,'placeholder','Name of the business'),
    JSON_OBJECT('key','owner_name','label','Owner Name','type','text','required',true,'placeholder','Full name of the owner'),
    JSON_OBJECT('key','business_address','label','Business Address','type','text','required',true,'placeholder','Address of the business'),
    JSON_OBJECT('key','nature_of_business','label','Nature of Business','type','text','required',true,'placeholder','Type of business'),
    JSON_OBJECT('key','contact_number','label','Contact Number','type','tel','required',true,'placeholder','09XX XXX XXXX')
  ),
  JSON_ARRAY('Business Permit / DTI Registration', 'Valid Government ID of owner'),
  500.00, FALSE, '3-5 business days', 'Review by Barangay Secretary, approve by Barangay Captain', TRUE
),
(
  'First Time Job Seeker Certificate',
  'Certificate for first-time job seekers (RA 11261).',
  JSON_ARRAY(
    'Valid Government ID',
    'Proof of Residency'
  ),
  JSON_ARRAY(
    JSON_OBJECT('key','full_name','label','Full Name','type','text','required',true,'placeholder','Full name'),
    JSON_OBJECT('key','address','label','Address','type','text','required',true,'placeholder','Complete address'),
    JSON_OBJECT('key','birth_date','label','Date of Birth','type','date','required',true),
    JSON_OBJECT('key','contact_number','label','Contact Number','type','tel','required',true,'placeholder','09XX XXX XXXX'),
    JSON_OBJECT('key','purpose','label','Purpose','type','textarea','required',true,'placeholder','Employment you are applying for')
  ),
  JSON_ARRAY('Valid Government ID', 'Proof of Residency'),
  0.00, FALSE, 'Same day', 'Review by Barangay Secretary, approve by Barangay Captain', TRUE
),
(
  'Certificate of Good Moral',
  'Certificate attesting to the good moral character of a resident.',
  JSON_ARRAY(
    'Valid Government ID',
    'Proof of Residency'
  ),
  JSON_ARRAY(
    JSON_OBJECT('key','full_name','label','Full Name','type','text','required',true,'placeholder','Full name'),
    JSON_OBJECT('key','address','label','Address','type','text','required',true,'placeholder','Complete address'),
    JSON_OBJECT('key','birth_date','label','Date of Birth','type','date','required',true),
    JSON_OBJECT('key','contact_number','label','Contact Number','type','tel','required',true,'placeholder','09XX XXX XXXX'),
    JSON_OBJECT('key','purpose','label','Purpose','type','textarea','required',true,'placeholder','Why do you need this document?')
  ),
  JSON_ARRAY('Valid Government ID', 'Proof of Residency'),
  100.00, FALSE, '1-2 business days', 'Review by Barangay Secretary, approve by Barangay Captain', TRUE
),
(
  'Solo Parent Certificate',
  'Certificate confirming solo parent status for eligible residents.',
  JSON_ARRAY(
    'Valid Government ID',
    'Solo Parent ID or supporting affidavit'
  ),
  JSON_ARRAY(
    JSON_OBJECT('key','full_name','label','Full Name','type','text','required',true,'placeholder','Full name'),
    JSON_OBJECT('key','address','label','Address','type','text','required',true,'placeholder','Complete address'),
    JSON_OBJECT('key','birth_date','label','Date of Birth','type','date','required',true),
    JSON_OBJECT('key','contact_number','label','Contact Number','type','tel','required',true,'placeholder','09XX XXX XXXX'),
    JSON_OBJECT('key','purpose','label','Purpose','type','textarea','required',true,'placeholder','Why do you need this document?')
  ),
  JSON_ARRAY('Valid Government ID', 'Solo Parent ID or supporting affidavit'),
  0.00, FALSE, '1-2 business days', 'Review by Barangay Secretary, approve by Barangay Captain', TRUE
),
(
  'Senior Citizen Certificate',
  'Certificate for senior citizen residents.',
  JSON_ARRAY(
    'Senior Citizen ID',
    'Proof of Residency'
  ),
  JSON_ARRAY(
    JSON_OBJECT('key','full_name','label','Full Name','type','text','required',true,'placeholder','Full name'),
    JSON_OBJECT('key','address','label','Address','type','text','required',true,'placeholder','Complete address'),
    JSON_OBJECT('key','birth_date','label','Date of Birth','type','date','required',true),
    JSON_OBJECT('key','contact_number','label','Contact Number','type','tel','required',true,'placeholder','09XX XXX XXXX'),
    JSON_OBJECT('key','purpose','label','Purpose','type','textarea','required',true,'placeholder','Why do you need this document?')
  ),
  JSON_ARRAY('Senior Citizen ID', 'Proof of Residency'),
  0.00, FALSE, 'Same day', 'Review by Barangay Secretary, approve by Barangay Captain', TRUE
),
(
  'Barangay ID',
  'Barangay Identification Card for residents.',
  JSON_ARRAY(
    'Birth Certificate or Valid ID',
    'Proof of Residency',
    'Passport-size photo (captured at the kiosk)'
  ),
  JSON_ARRAY(
    JSON_OBJECT('key','full_name','label','Full Name','type','text','required',true,'placeholder','Full name'),
    JSON_OBJECT('key','address','label','Address','type','text','required',true,'placeholder','Complete address'),
    JSON_OBJECT('key','birth_date','label','Birthdate','type','date','required',true),
    JSON_OBJECT('key','gender','label','Gender','type','select','required',true,'options',JSON_ARRAY('Male','Female','Other')),
    JSON_OBJECT('key','civil_status','label','Civil Status','type','select','required',true,'options',JSON_ARRAY('Single','Married','Widowed','Separated','Divorced')),
    JSON_OBJECT('key','blood_type','label','Blood Type','type','select','required',false,'options',JSON_ARRAY('A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown')),
    JSON_OBJECT('key','emergency_contact_name','label','Emergency Contact Person','type','text','required',true,'placeholder','Name of emergency contact'),
    JSON_OBJECT('key','emergency_contact_number','label','Emergency Contact Number','type','tel','required',true,'placeholder','09XX XXX XXXX')
  ),
  JSON_ARRAY('Birth Certificate or Valid ID', 'Proof of Residency'),
  150.00, TRUE, '3-5 business days', 'Review by Barangay Secretary, approve by Barangay Captain', TRUE
)
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  requirements = VALUES(requirements),
  form_fields = VALUES(form_fields),
  required_documents = VALUES(required_documents),
  processing_time = VALUES(processing_time),
  approval_workflow = VALUES(approval_workflow);

-- =====================================================
-- DONE
-- =====================================================
