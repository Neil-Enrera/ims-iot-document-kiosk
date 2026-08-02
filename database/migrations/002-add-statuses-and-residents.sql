-- =====================================================
-- Migration: Add missing statuses and seed residents
-- Purpose : Fix request workflow and kiosk simulation
-- Date    : 2026-08-01
-- =====================================================

USE ims_iot_document_kiosk;

-- =====================================================
-- 1. Add missing request statuses
-- =====================================================

-- Add 'Processing' status (ID will be auto-incremented, likely 6)
INSERT IGNORE INTO request_statuses (status_name, description)
SELECT 'Processing', 'Being processed by staff'
WHERE NOT EXISTS (
    SELECT 1 FROM request_statuses WHERE status_name = 'Processing'
);

-- Add 'Cancelled' status (ID will be auto-incremented, likely 7)
INSERT IGNORE INTO request_statuses (status_name, description)
SELECT 'Cancelled', 'Cancelled by staff or resident'
WHERE NOT EXISTS (
    SELECT 1 FROM request_statuses WHERE status_name = 'Cancelled'
);

-- =====================================================
-- 2. Seed residents for kiosk simulation
-- =====================================================

-- Only insert if no residents exist yet
INSERT INTO residents (resident_code, first_name, middle_name, last_name, suffix, birth_date, gender, civil_status, barangay_id, address_line, contact_number, email, status)
SELECT 'RES-00001', 'Pedro', 'Santos', 'Garcia', 'Sr.', '1985-03-15', 'Male', 'Married', 1, '123 Rizal Street, Purok 1', '09171234567', 'pedro.garcia@email.com', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM residents WHERE resident_code = 'RES-00001');

INSERT INTO residents (resident_code, first_name, middle_name, last_name, suffix, birth_date, gender, civil_status, barangay_id, address_line, contact_number, email, status)
SELECT 'RES-00002', 'Ana', 'Reyes', 'Cruz', NULL, '1990-07-22', 'Female', 'Single', 1, '456 Mabini Avenue, Purok 2', '09181234568', 'ana.cruz@email.com', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM residents WHERE resident_code = 'RES-00002');

INSERT INTO residents (resident_code, first_name, middle_name, last_name, suffix, birth_date, gender, civil_status, barangay_id, address_line, contact_number, email, status)
SELECT 'RES-00003', 'Maria', 'Luna', 'Santos', NULL, '1992-11-08', 'Female', 'Married', 1, '789 Bonifacio Drive, Purok 3', '09191234569', 'maria.santos@email.com', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM residents WHERE resident_code = 'RES-00003');

INSERT INTO residents (resident_code, first_name, middle_name, last_name, suffix, birth_date, gender, civil_status, barangay_id, address_line, contact_number, email, status)
SELECT 'RES-00004', 'Juan', 'Panganiban', 'Dela Cruz', 'Jr.', '1988-05-01', 'Male', 'Single', 1, '321 Aguinaldo Highway, Purok 4', '09201234570', 'juan.delacruz@email.com', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM residents WHERE resident_code = 'RES-00004');

INSERT INTO residents (resident_code, first_name, middle_name, last_name, suffix, birth_date, gender, civil_status, barangay_id, address_line, contact_number, email, status)
SELECT 'RES-00005', 'Rosa', 'Aquino', 'Bautista', NULL, '1995-02-14', 'Female', 'Widowed', 1, '654 Luna Street, Purok 1', '09211234571', 'rosa.bautista@email.com', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM residents WHERE resident_code = 'RES-00005');

INSERT INTO residents (resident_code, first_name, middle_name, last_name, suffix, birth_date, gender, civil_status, barangay_id, address_line, contact_number, email, status)
SELECT 'RES-00006', 'Roberto', NULL, 'Villanueva', NULL, '1970-09-30', 'Male', 'Married', 1, '987 Zapote Road, Purok 5', '09221234572', 'roberto.v@email.com', 'INACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM residents WHERE resident_code = 'RES-00006');

-- =====================================================
-- DONE
-- =====================================================
