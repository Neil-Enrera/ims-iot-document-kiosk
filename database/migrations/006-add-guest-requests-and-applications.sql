-- =====================================================
-- Migration: Guest requests + Barangay ID applications
-- Purpose : Support temporary (guest) document requests
--           where no permanent resident account exists,
--           and Barangay ID applications that must be
--           reviewed/approved by staff before a resident
--           record + RFID card are created.
-- Date    : 2026-08-03
-- =====================================================

USE ims_iot_document_kiosk;

-- -----------------------------------------------------
-- requests: allow guest requests without a resident
-- -----------------------------------------------------
ALTER TABLE requests
  MODIFY COLUMN resident_id BIGINT UNSIGNED NULL;

-- -----------------------------------------------------
-- Barangay ID applications (pending staff approval)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS barangay_id_applications (
    application_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    application_number VARCHAR(30) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    suffix VARCHAR(20),
    birth_date DATE,
    gender ENUM('Male','Female','Other'),
    civil_status ENUM('Single','Married','Widowed','Separated','Divorced'),
    occupation VARCHAR(100),
    blood_type VARCHAR(10),
    address_line VARCHAR(255) NOT NULL,
    contact_number VARCHAR(20),
    email VARCHAR(100),
    emergency_contact_name VARCHAR(100),
    emergency_contact_number VARCHAR(20),
    photo VARCHAR(255),
    signature VARCHAR(255),
    form_data JSON,
    status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING' NOT NULL,
    review_remarks TEXT,
    reviewed_by BIGINT UNSIGNED,
    reviewed_at DATETIME,
    resident_id BIGINT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_application_reviewer
        FOREIGN KEY (reviewed_by)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_application_resident
        FOREIGN KEY (resident_id)
        REFERENCES residents(resident_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    INDEX idx_application_status (status),
    INDEX idx_application_created (created_at)
) ENGINE=InnoDB;

-- =====================================================
-- DONE
-- =====================================================
