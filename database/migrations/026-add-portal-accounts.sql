-- Migration 026: Online portal accounts (sections 4-7 of the Remote Online Portal spec)
-- Account ID: BSM-000001 format, tied to resident_id, hashed password, first-login flag.

USE ims_iot_document_kiosk;

CREATE TABLE IF NOT EXISTS portal_accounts (
    portal_account_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    account_id VARCHAR(20) NOT NULL UNIQUE,
    resident_id BIGINT UNSIGNED NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    must_change_password TINYINT(1) NOT NULL DEFAULT 1,
    status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    last_login DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_portal_accounts_resident
        FOREIGN KEY (resident_id)
        REFERENCES residents(resident_id)
        ON DELETE CASCADE,
    INDEX idx_portal_accounts_account_id (account_id),
    INDEX idx_portal_accounts_email (email),
    INDEX idx_portal_accounts_resident (resident_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS portal_password_resets (
    reset_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    portal_account_id BIGINT UNSIGNED NOT NULL,
    email VARCHAR(100) NOT NULL,
    verification_code VARCHAR(10) NOT NULL,
    reset_token VARCHAR(255) NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_portal_password_resets_account
        FOREIGN KEY (portal_account_id)
        REFERENCES portal_accounts(portal_account_id)
        ON DELETE CASCADE,
    INDEX idx_portal_resets_email (email),
    INDEX idx_portal_resets_code (verification_code),
    INDEX idx_portal_resets_token (reset_token)
) ENGINE=InnoDB;
