-- Migration 021: Add password_resets table for Administrator Forgot Password workflow
-- Generated on: 2026-08-19

CREATE TABLE IF NOT EXISTS password_resets (
    reset_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    email VARCHAR(100) NOT NULL,
    verification_code VARCHAR(10) NOT NULL,
    reset_token VARCHAR(255) NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_resets_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,
    INDEX idx_password_resets_email (email),
    INDEX idx_password_resets_code (verification_code),
    INDEX idx_password_resets_token (reset_token)
) ENGINE=InnoDB;
