
-- =====================================================
-- Database: ims-iot-document-kiosk
-- Project : Information Management System with
--           IoT-Assisted Document Request Services Kiosk
--           Barangay San Manuel
-- =====================================================
-- Scope: Resident information, RFID card management,
--         staff/user management, document request
--         processing, approval workflow, status tracking,
--         file attachments, and audit logging.
-- Note : Single kiosk only. No payment processing.
-- =====================================================

DROP DATABASE IF EXISTS ims_iot_document_kiosk;
CREATE DATABASE ims_iot_document_kiosk
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE ims_iot_document_kiosk;

-- =====================================================
-- MASTER TABLES
-- =====================================================

-- Roles assigned to system users (e.g. Secretary, Captain).
CREATE TABLE user_roles (
    role_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Barangay services available for document requests.
CREATE TABLE services (
    service_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    processing_fee DECIMAL(10,2) DEFAULT 0.00,
    requires_photo BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Reference table for request workflow statuses.
CREATE TABLE request_statuses (
    status_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    status_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- GEOGRAPHY TABLE
-- =====================================================

-- Barangay reference data for resident address normalization.
CREATE TABLE barangays (
    barangay_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    barangay_name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    zipcode VARCHAR(10),
    contact_number VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_barangay_city_province (barangay_name, city, province)
) ENGINE=InnoDB;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- System user accounts (staff, administrators).
CREATE TABLE users (
    user_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT UNSIGNED NOT NULL,
    first_name VARCHAR(100),
    middle_name VARCHAR(100),
    last_name VARCHAR(100),
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    contact_number VARCHAR(20),
    status ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE' NOT NULL,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id)
        REFERENCES user_roles(role_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    INDEX idx_users_role (role_id),
    INDEX idx_users_email (email)
) ENGINE=InnoDB;

-- Barangay residents registered in the system.
CREATE TABLE residents (
    resident_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    resident_code VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    suffix VARCHAR(20),
    birth_date DATE,
    gender ENUM('Male','Female','Other'),
    civil_status ENUM('Single','Married','Widowed','Separated','Divorced'),
    barangay_id BIGINT UNSIGNED NOT NULL,
    address_line VARCHAR(255) NOT NULL,
    contact_number VARCHAR(20),
    email VARCHAR(100),
    photo VARCHAR(255),
    status ENUM('ACTIVE','INACTIVE','MOVED','DECEASED') DEFAULT 'ACTIVE' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_residents_barangay
        FOREIGN KEY (barangay_id)
        REFERENCES barangays(barangay_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    INDEX idx_residents_barangay (barangay_id),
    INDEX idx_residents_status (status),
    INDEX idx_residents_name (last_name, first_name)
) ENGINE=InnoDB;

-- RFID cards issued to residents for kiosk identification.
CREATE TABLE rfid_cards (
    rfid_card_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    resident_id BIGINT UNSIGNED NOT NULL,
    card_uid VARCHAR(100) NOT NULL UNIQUE,
    status ENUM('ACTIVE','EXPIRED','LOST','CANCELLED') DEFAULT 'ACTIVE' NOT NULL,
    issued_date DATE,
    expiration_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rfid_resident
        FOREIGN KEY (resident_id)
        REFERENCES residents(resident_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    INDEX idx_rfid_resident (resident_id)
) ENGINE=InnoDB;

-- =====================================================
-- TRANSACTION TABLES
-- =====================================================

-- Document requests submitted by residents through the kiosk.
CREATE TABLE requests (
    request_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    request_number VARCHAR(30) NOT NULL UNIQUE,
    resident_id BIGINT UNSIGNED NOT NULL,
    service_id BIGINT UNSIGNED NOT NULL,
    status_id BIGINT UNSIGNED NOT NULL,
    purpose TEXT,
    remarks TEXT,
    request_date DATETIME NOT NULL,
    reviewed_date DATETIME,
    release_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_request_resident
        FOREIGN KEY (resident_id)
        REFERENCES residents(resident_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_request_service
        FOREIGN KEY (service_id)
        REFERENCES services(service_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_request_status
        FOREIGN KEY (status_id)
        REFERENCES request_statuses(status_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    INDEX idx_request_number (request_number),
    INDEX idx_request_resident (resident_id),
    INDEX idx_request_service (service_id),
    INDEX idx_request_status (status_id),
    INDEX idx_request_date (request_date),
    CONSTRAINT chk_request_dates CHECK (reviewed_date IS NULL OR reviewed_date >= request_date),
    CONSTRAINT chk_release_dates CHECK (release_date IS NULL OR release_date >= reviewed_date)
) ENGINE=InnoDB;

-- Tracks every status transition for each request.
CREATE TABLE request_status_history (
    history_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    request_id BIGINT UNSIGNED NOT NULL,
    old_status_id BIGINT UNSIGNED,
    new_status_id BIGINT UNSIGNED NOT NULL,
    changed_by BIGINT UNSIGNED,
    remarks TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_history_request
        FOREIGN KEY (request_id)
        REFERENCES requests(request_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_history_old_status
        FOREIGN KEY (old_status_id)
        REFERENCES request_statuses(status_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_history_new_status
        FOREIGN KEY (new_status_id)
        REFERENCES request_statuses(status_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_history_changed_by
        FOREIGN KEY (changed_by)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    INDEX idx_history_request (request_id)
) ENGINE=InnoDB;

-- Supporting documents and photos uploaded during request processing.
CREATE TABLE request_attachments (
    attachment_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    request_id BIGINT UNSIGNED NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    file_path VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attachment_request
        FOREIGN KEY (request_id)
        REFERENCES requests(request_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_attachment_request (request_id)
) ENGINE=InnoDB;

-- =====================================================
-- AUDIT LOGS
-- =====================================================

-- Records user actions for security and accountability.
CREATE TABLE audit_logs (
    audit_log_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    action VARCHAR(255),
    module VARCHAR(100),
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    INDEX idx_audit_user (user_id)
) ENGINE=InnoDB;

-- =====================================================
-- SEED DATA
-- =====================================================

-- Default user roles
INSERT INTO user_roles (role_name, description) VALUES
('Administrator', 'System Administrator'),
('Barangay Secretary', 'Processes document requests'),
('Barangay Captain', 'Approves requests');

-- Default request workflow statuses
-- Workflow: Submitted → Waiting for Requirements → Requirements Received
--           → Under Review → Document Processing → Ready for Release → Released
INSERT INTO request_statuses (status_name, description) VALUES
('Submitted', 'Submitted by resident through the kiosk'),
('Waiting for Requirements', 'Waiting for the resident to submit required documents'),
('Requirements Received', 'Required documents have been received'),
('Under Review', 'Being reviewed by staff'),
('Document Processing', 'Document is being processed'),
('Ready for Release', 'Ready to release'),
('Released', 'Released to resident'),
('Rejected', 'Rejected'),
('Cancelled', 'Cancelled by staff or resident');

-- Default barangay (Barangay San Manuel)
INSERT INTO barangays (barangay_name, city, province, zipcode) VALUES
('San Manuel', 'Tarlac City', 'Tarlac', '2300');

-- Default services
INSERT INTO services (service_name, description, processing_fee, requires_photo) VALUES
('Barangay Clearance', 'General clearance', 100.00, FALSE),
('Certificate of Indigency', 'Indigency certificate', 0.00, FALSE),
('Barangay Residency', 'Residency certificate', 50.00, FALSE),
('Barangay ID', 'Barangay Identification Card', 150.00, TRUE);
