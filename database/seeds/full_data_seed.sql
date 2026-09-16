SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS system_settings (
    setting_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string',
    category VARCHAR(50) DEFAULT 'general',
    description VARCHAR(255),
    is_readonly BOOLEAN DEFAULT FALSE,
    updated_by BIGINT UNSIGNED NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_system_settings_key (setting_key),
    INDEX idx_system_settings_category (category)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS login_verification_codes (
    code_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    email VARCHAR(100) NOT NULL,
    verification_code VARCHAR(10) NOT NULL,
    temp_token VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_lvc_email (email),
    INDEX idx_lvc_code (verification_code),
    INDEX idx_lvc_token (temp_token)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS password_resets (
    reset_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    email VARCHAR(100) NOT NULL,
    verification_code VARCHAR(10) NOT NULL,
    reset_token VARCHAR(255) NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_password_resets_email (email),
    INDEX idx_password_resets_code (verification_code),
    INDEX idx_password_resets_token (reset_token)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS barangay_id_applications (
    application_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    application_number VARCHAR(50) NOT NULL UNIQUE,
    resident_id BIGINT UNSIGNED NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    suffix VARCHAR(20),
    birth_date DATE NOT NULL,
    gender ENUM('Male','Female','Other') NOT NULL,
    civil_status ENUM('Single','Married','Widowed','Separated','Divorced') NOT NULL,
    blood_type VARCHAR(10),
    contact_number VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address_line VARCHAR(500) NOT NULL,
    emergency_contact_name VARCHAR(100) NOT NULL,
    emergency_contact_number VARCHAR(20) NOT NULL,
    photo_path VARCHAR(500),
    status ENUM('PENDING','APPROVED','REJECTED','ISSUED') DEFAULT 'PENDING' NOT NULL,
    admin_remarks TEXT,
    reviewed_by BIGINT UNSIGNED NULL,
    reviewed_at DATETIME NULL,
    issued_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_bid_app_status (status),
    INDEX idx_bid_app_number (application_number)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS resident_update_requests (
    request_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    resident_id BIGINT UNSIGNED NOT NULL,
    changes JSON NOT NULL,
    status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING' NOT NULL,
    admin_remarks TEXT,
    reviewed_by BIGINT UNSIGNED NULL,
    reviewed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_rur_resident (resident_id),
    INDEX idx_rur_status (status)
) ENGINE=InnoDB;

-- Table: user_roles
DELETE FROM `user_roles`;
INSERT INTO `user_roles` (`role_id`, `role_name`, `description`, `is_active`, `created_at`, `updated_at`) VALUES (1, 'Administrator', 'System Administrator', 1, '2026-07-29 05:27:50', '2026-07-29 05:27:50');
INSERT INTO `user_roles` (`role_id`, `role_name`, `description`, `is_active`, `created_at`, `updated_at`) VALUES (2, 'Barangay Secretary', 'Processes document requests', 1, '2026-07-29 05:27:50', '2026-07-29 05:27:50');
INSERT INTO `user_roles` (`role_id`, `role_name`, `description`, `is_active`, `created_at`, `updated_at`) VALUES (4, 'Barangay Captain', 'Approves requests', 1, '2026-07-29 05:27:50', '2026-07-29 05:27:50');
INSERT INTO `user_roles` (`role_id`, `role_name`, `description`, `is_active`, `created_at`, `updated_at`) VALUES (5, 'Staff', 'General staff member', 1, '2026-07-30 14:22:53', '2026-07-30 14:22:53');

-- Table: users
DELETE FROM `users`;
INSERT INTO `users` (`user_id`, `role_id`, `first_name`, `middle_name`, `last_name`, `username`, `password_hash`, `email`, `contact_number`, `status`, `last_login`, `created_at`, `updated_at`) VALUES (22, 1, 'Neil Andrei', 'ANDREI MADRID', 'Enrera', 'Admin1', '$2b$10$uqlraFryDZp/zezzcbkc9ezki2SY8qBCbD1qb21.jxUmgUniHvtfm', 'andreienrera@gmail.com', '09476141605', 'ACTIVE', '2026-09-15 04:11:43', '2026-08-19 08:20:56', '2026-09-15 04:11:43');
INSERT INTO `users` (`user_id`, `role_id`, `first_name`, `middle_name`, `last_name`, `username`, `password_hash`, `email`, `contact_number`, `status`, `last_login`, `created_at`, `updated_at`) VALUES (23, 1, 'Wien Allen', 'A', 'Reyes', 'Admin2', '$2b$10$uqlraFryDZp/zezzcbkc9ezki2SY8qBCbD1qb21.jxUmgUniHvtfm', 'wienreyes@gmail.com', '09123456789', 'ACTIVE', '2026-08-21 09:35:53', '2026-08-21 09:33:38', '2026-09-03 16:27:36');

-- Table: barangays
DELETE FROM `barangays`;
INSERT INTO `barangays` (`barangay_id`, `barangay_name`, `city`, `province`, `zipcode`, `contact_number`, `email`, `captain_name`, `secretary_name`, `treasurer_name`, `address`, `id_template_path`, `id_template_original_name`, `id_template_mime`, `id_template_size`, `created_at`, `updated_at`) VALUES (1, 'San Manuel', 'Tarlac City', 'Tarlac', '2300', NULL, NULL, NULL, NULL, NULL, NULL, 'templates/da4927dcbc4b31935f47f59b7e9cbd73.docx', 'Dummy_Barangay_ID_Reference_Style_Editable.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 38653, '2026-07-29 15:14:35', '2026-08-09 18:33:19');

-- Table: system_settings
DELETE FROM `system_settings`;
INSERT INTO `system_settings` (`setting_id`, `setting_key`, `setting_value`, `setting_type`, `category`, `description`, `is_readonly`, `updated_by`, `updated_at`) VALUES (1, 'barangay_name', 'Barangay San Manuel', 'string', 'barangay', 'Barangay name', 0, 22, '2026-09-03 12:59:23');
INSERT INTO `system_settings` (`setting_id`, `setting_key`, `setting_value`, `setting_type`, `category`, `description`, `is_readonly`, `updated_by`, `updated_at`) VALUES (2, 'barangay_address', 'San Jose Del Monte Bulacan', 'string', 'barangay', 'Barangay address', 0, 22, '2026-09-03 12:59:23');
INSERT INTO `system_settings` (`setting_id`, `setting_key`, `setting_value`, `setting_type`, `category`, `description`, `is_readonly`, `updated_by`, `updated_at`) VALUES (3, 'barangay_contact', '09123456789', 'string', 'barangay', 'Contact number', 0, 22, '2026-09-03 12:59:23');
INSERT INTO `system_settings` (`setting_id`, `setting_key`, `setting_value`, `setting_type`, `category`, `description`, `is_readonly`, `updated_by`, `updated_at`) VALUES (4, 'office_hours', '8:00 AM - 5:00 PM', 'string', 'barangay', 'Office hours', 0, 22, '2026-09-03 12:59:23');
INSERT INTO `system_settings` (`setting_id`, `setting_key`, `setting_value`, `setting_type`, `category`, `description`, `is_readonly`, `updated_by`, `updated_at`) VALUES (5, 'kiosk_idle_timeout', '120', 'number', 'kiosk', 'Idle timeout in seconds', 0, 22, '2026-09-04 12:35:03');
INSERT INTO `system_settings` (`setting_id`, `setting_key`, `setting_value`, `setting_type`, `category`, `description`, `is_readonly`, `updated_by`, `updated_at`) VALUES (6, 'kiosk_session_timeout', '500', 'number', 'kiosk', 'Session timeout in seconds', 0, NULL, '2026-08-18 15:17:16');
INSERT INTO `system_settings` (`setting_id`, `setting_key`, `setting_value`, `setting_type`, `category`, `description`, `is_readonly`, `updated_by`, `updated_at`) VALUES (7, 'kiosk_camera_enabled', 'false', 'boolean', 'kiosk', 'Camera enabled', 0, NULL, '2026-08-01 02:25:59');
INSERT INTO `system_settings` (`setting_id`, `setting_key`, `setting_value`, `setting_type`, `category`, `description`, `is_readonly`, `updated_by`, `updated_at`) VALUES (8, 'kiosk_rfid_enabled', 'true', 'boolean', 'kiosk', 'RFID enabled', 0, NULL, '2026-08-01 02:25:59');
INSERT INTO `system_settings` (`setting_id`, `setting_key`, `setting_value`, `setting_type`, `category`, `description`, `is_readonly`, `updated_by`, `updated_at`) VALUES (9, 'document_validity_days', '30', 'number', 'document', 'Document validity in days', 0, NULL, '2026-07-31 11:18:57');
INSERT INTO `system_settings` (`setting_id`, `setting_key`, `setting_value`, `setting_type`, `category`, `description`, `is_readonly`, `updated_by`, `updated_at`) VALUES (10, 'auto_generate_request_number', 'true', 'boolean', 'document', 'Auto generate request number', 0, NULL, '2026-07-31 11:18:57');
INSERT INTO `system_settings` (`setting_id`, `setting_key`, `setting_value`, `setting_type`, `category`, `description`, `is_readonly`, `updated_by`, `updated_at`) VALUES (11, 'enable_notifications', 'true', 'boolean', 'notification', 'Enable in-app notifications', 0, NULL, '2026-07-31 11:18:57');
INSERT INTO `system_settings` (`setting_id`, `setting_key`, `setting_value`, `setting_type`, `category`, `description`, `is_readonly`, `updated_by`, `updated_at`) VALUES (12, 'maintenance_mode', 'false', 'boolean', 'system', 'Maintenance mode', 0, NULL, '2026-08-01 01:46:31');
INSERT INTO `system_settings` (`setting_id`, `setting_key`, `setting_value`, `setting_type`, `category`, `description`, `is_readonly`, `updated_by`, `updated_at`) VALUES (13, 'system_version', '1.0.0', 'string', 'system', 'System version (read-only)', 0, NULL, '2026-07-31 13:31:54');
INSERT INTO `system_settings` (`setting_id`, `setting_key`, `setting_value`, `setting_type`, `category`, `description`, `is_readonly`, `updated_by`, `updated_at`) VALUES (14, 'document_claim_days', '15', 'number', 'document', 'Number of days a done (Ready for Release) document stays claimable before it is considered expired', 0, NULL, '2026-08-05 12:22:30');
INSERT INTO `system_settings` (`setting_id`, `setting_key`, `setting_value`, `setting_type`, `category`, `description`, `is_readonly`, `updated_by`, `updated_at`) VALUES (15, 'id_validity_years', '3', 'number', 'barangay', 'Number of years a Barangay ID stays valid from its issue date', 0, 22, '2026-09-03 12:59:23');
INSERT INTO `system_settings` (`setting_id`, `setting_key`, `setting_value`, `setting_type`, `category`, `description`, `is_readonly`, `updated_by`, `updated_at`) VALUES (16, 'barangay_id_min_age', '15', 'number', 'barangay', 'Minimum age eligible to apply for a Barangay ID (default: 15)', 0, 22, '2026-09-03 12:59:23');

-- Table: request_statuses
DELETE FROM `request_statuses`;
INSERT INTO `request_statuses` (`status_id`, `status_name`, `description`, `created_at`, `updated_at`) VALUES (1, 'Submitted', 'Submitted by resident through the kiosk', '2026-07-29 05:27:50', '2026-08-04 10:50:53');
INSERT INTO `request_statuses` (`status_id`, `status_name`, `description`, `created_at`, `updated_at`) VALUES (2, 'Waiting for Requirements', 'Waiting for the resident to submit required documents', '2026-08-04 10:50:53', '2026-08-04 10:50:53');
INSERT INTO `request_statuses` (`status_id`, `status_name`, `description`, `created_at`, `updated_at`) VALUES (3, 'Requirements Received', 'Required documents have been received', '2026-08-04 10:50:53', '2026-08-04 10:50:53');
INSERT INTO `request_statuses` (`status_id`, `status_name`, `description`, `created_at`, `updated_at`) VALUES (4, 'Under Review', 'Being reviewed by staff', '2026-07-29 05:27:50', '2026-08-04 10:50:53');
INSERT INTO `request_statuses` (`status_id`, `status_name`, `description`, `created_at`, `updated_at`) VALUES (5, 'Document Processing', 'Document is being processed', '2026-07-30 14:26:38', '2026-08-04 10:50:53');
INSERT INTO `request_statuses` (`status_id`, `status_name`, `description`, `created_at`, `updated_at`) VALUES (6, 'Ready for Release', 'Ready to release', '2026-07-29 05:27:50', '2026-08-04 10:50:53');
INSERT INTO `request_statuses` (`status_id`, `status_name`, `description`, `created_at`, `updated_at`) VALUES (7, 'Released', 'Released to resident', '2026-07-29 05:27:50', '2026-08-04 10:50:53');
INSERT INTO `request_statuses` (`status_id`, `status_name`, `description`, `created_at`, `updated_at`) VALUES (8, 'Rejected', 'Rejected', '2026-07-29 05:27:50', '2026-08-04 10:50:53');
INSERT INTO `request_statuses` (`status_id`, `status_name`, `description`, `created_at`, `updated_at`) VALUES (9, 'Cancelled', 'Request cancelled by user', '2026-07-30 14:26:38', '2026-07-30 14:26:38');
INSERT INTO `request_statuses` (`status_id`, `status_name`, `description`, `created_at`, `updated_at`) VALUES (10, 'Returned for Correction', 'Request returned by staff; resident must correct affected fields and resubmit', '2026-08-12 08:22:39', '2026-08-12 08:22:39');
INSERT INTO `request_statuses` (`status_id`, `status_name`, `description`, `created_at`, `updated_at`) VALUES (11, 'Resubmitted', 'Resident has corrected the affected fields and resubmitted the request', '2026-08-12 08:22:39', '2026-08-12 08:22:39');

-- Table: services
DELETE FROM `services`;
INSERT INTO `services` (`service_id`, `service_name`, `description`, `requirements`, `form_fields`, `processing_fee`, `requires_photo`, `can_combine_with_others`, `allow_multiple_active_requests`, `allow_new_request_after_release`, `is_active`, `template_path`, `template_original_name`, `template_mime`, `template_size`, `document_mappings`, `created_at`, `updated_at`) VALUES (41, 'CERTIFICATE OF INDIGENCY', 'An official document certifying that an individual or family has limited financial means and may qualify for government assistance and other benefits.', '[\"Valid ID\",\"HOA Certificate\"]', '[{\"key\":\"purpose\",\"label\":\"Purpose of request\",\"type\":\"text\",\"required\":true,\"placeholder\":\"Purpose\"},{\"key\":\"relative_name\",\"label\":\"Name of relative/beneficiary\",\"type\":\"text\",\"required\":true,\"placeholder\":\"Name of relative\"},{\"key\":\"Block\",\"label\":\"block\",\"type\":\"text\",\"required\":true,\"placeholder\":\"Block\"},{\"key\":\"lot\",\"label\":\"Lot\",\"type\":\"text\",\"required\":true,\"placeholder\":\"Lot\"},{\"key\":\"Subdivision\",\"label\":\"subdivision\",\"type\":\"text\",\"required\":true,\"placeholder\":\"Subdivision\"}]', '100.00', 0, 1, 0, 1, 1, 'templates/b859aef560ec92bf0fe03b4a4a7b2b24.docx', 'Dummy_Certificate_Colored_Template.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 27438, '[{\"placeholder\":\"full_name\",\"source\":\"resident\",\"field\":\"full_name\"},{\"placeholder\":\"age\",\"source\":\"resident\",\"field\":\"age\"},{\"placeholder\":\"civil_status\",\"source\":\"resident\",\"field\":\"civil_status\"},{\"placeholder\":\"block\",\"source\":\"application\",\"field\":\"Block\"},{\"placeholder\":\"lot\",\"source\":\"application\",\"field\":\"lot\"},{\"placeholder\":\"street\",\"source\":\"resident\",\"field\":\"street\"},{\"placeholder\":\"subdivision\",\"source\":\"application\",\"field\":\"Subdivision\"},{\"placeholder\":\"relative_name\",\"source\":\"application\",\"field\":\"relative_name\"},{\"placeholder\":\"purpose\",\"source\":\"application\",\"field\":\"purpose\"},{\"placeholder\":\"day\",\"source\":\"system\",\"field\":\"day\"},{\"placeholder\":\"month\",\"source\":\"system\",\"field\":\"month\"},{\"placeholder\":\"year\",\"source\":\"system\",\"field\":\"year\"}]', '2026-08-06 11:03:49', '2026-09-03 17:47:40');
INSERT INTO `services` (`service_id`, `service_name`, `description`, `requirements`, `form_fields`, `processing_fee`, `requires_photo`, `can_combine_with_others`, `allow_multiple_active_requests`, `allow_new_request_after_release`, `is_active`, `template_path`, `template_original_name`, `template_mime`, `template_size`, `document_mappings`, `created_at`, `updated_at`) VALUES (68, 'Barangay Clearance', 'Official Barangay Clearance for employment, valid ID applications, postal ID, and government transactions.', '[\"Valid ID\",\"Proof of Residency\"]', '[{\"key\":\"purpose\",\"label\":\"Purpose of Request\",\"type\":\"select\",\"required\":true,\"options\":[\"Local Employment\",\"Overseas Employment\",\"Bank Account Opening\",\"Postal ID\",\"Police Clearance\",\"NBI Clearance\",\"Business Permit\",\"School Requirement\",\"Other\"]},{\"key\":\"block\",\"label\":\"Block No.\",\"type\":\"text\",\"required\":true,\"placeholder\":\"e.g., Block 5\"},{\"key\":\"lot\",\"label\":\"Lot No.\",\"type\":\"text\",\"required\":true,\"placeholder\":\"e.g., Lot 12\"},{\"key\":\"street\",\"label\":\"Street\",\"type\":\"text\",\"required\":true,\"placeholder\":\"e.g., Mabini Street\"},{\"key\":\"subdivision\",\"label\":\"Subdivision\",\"type\":\"text\",\"required\":true,\"placeholder\":\"e.g., Villa San Manuel\"}]', '100.00', 0, 1, 0, 1, 1, 'templates/cdb4900fdc08fad0a3fae411483cef11.docx', 'Barangay-San-Manuel-Clearance-Template (1).docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 25269, '[{\"placeholder\":\"full_name\",\"source\":\"resident\",\"field\":\"full_name\"},{\"placeholder\":\"age\",\"source\":\"resident\",\"field\":\"age\"},{\"placeholder\":\"block\",\"source\":\"application\",\"field\":\"block\"},{\"placeholder\":\"lot\",\"source\":\"application\",\"field\":\"lot\"},{\"placeholder\":\"street\",\"source\":\"application\",\"field\":\"street\"},{\"placeholder\":\"subdivision\",\"source\":\"application\",\"field\":\"subdivision\"},{\"placeholder\":\"purpose\",\"source\":\"application\",\"field\":\"purpose\"},{\"placeholder\":\"day\",\"source\":\"system\",\"field\":\"day\"},{\"placeholder\":\"month\",\"source\":\"system\",\"field\":\"month\"},{\"placeholder\":\"year\",\"source\":\"system\",\"field\":\"year\"},{\"placeholder\":\"control_number\",\"source\":\"system\",\"field\":\"request_number\"}]', '2026-08-25 21:21:02', '2026-09-03 08:49:14');
INSERT INTO `services` (`service_id`, `service_name`, `description`, `requirements`, `form_fields`, `processing_fee`, `requires_photo`, `can_combine_with_others`, `allow_multiple_active_requests`, `allow_new_request_after_release`, `is_active`, `template_path`, `template_original_name`, `template_mime`, `template_size`, `document_mappings`, `created_at`, `updated_at`) VALUES (69, 'Barangay ID', 'Official Barangay Identification Card', '[\"Birth Certificate or Valid ID\",\"Proof of Residency\"]', '[{\"key\":\"full_name\",\"label\":\"Full Name\",\"type\":\"text\",\"required\":true,\"placeholder\":\"Full Name\"},{\"key\":\"place_of_birth\",\"label\":\"Place of Birth\",\"type\":\"text\",\"required\":true,\"placeholder\":\"e.g. San Jose, Antique\"},{\"key\":\"birth_date\",\"label\":\"Birth Date\",\"type\":\"date\",\"required\":true},{\"key\":\"address\",\"label\":\"Complete Address\",\"type\":\"text\",\"required\":true,\"placeholder\":\"Block, Lot, Street, Subdivision\"},{\"key\":\"gender\",\"label\":\"Gender\",\"type\":\"select\",\"required\":true,\"options\":[\"Male\",\"Female\",\"Other\"]},{\"key\":\"civil_status\",\"label\":\"Civil Status\",\"type\":\"select\",\"required\":true,\"options\":[\"Single\",\"Married\",\"Widowed\",\"Separated\"]},{\"key\":\"emergency_contact_name\",\"label\":\"Emergency Contact Person\",\"type\":\"text\",\"required\":true,\"placeholder\":\"Contact Person Name\"},{\"key\":\"emergency_contact_number\",\"label\":\"Emergency Contact Number\",\"type\":\"tel\",\"required\":true,\"placeholder\":\"09xxxxxxxxx\"}]', '150.00', 1, 1, 0, 1, 1, 'templates/Barangay-San-Manuel-ID-Template-Dummy.docx', 'Barangay-San-Manuel-ID-Template-Dummy.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 38653, '[{\"placeholder\":\"resident_photo\",\"source\":\"application\",\"field\":\"photo\"},{\"placeholder\":\"full_name\",\"source\":\"application\",\"field\":\"full_name\"},{\"placeholder\":\"place_of_birth\",\"source\":\"application\",\"field\":\"place_of_birth\"},{\"placeholder\":\"date_of_birth\",\"source\":\"application\",\"field\":\"birth_date\"},{\"placeholder\":\"address\",\"source\":\"application\",\"field\":\"address\"},{\"placeholder\":\"id_number\",\"source\":\"system\",\"field\":\"request_number\"},{\"placeholder\":\"date_issued\",\"source\":\"system\",\"field\":\"current_date\"},{\"placeholder\":\"valid_until\",\"source\":\"system\",\"field\":\"current_date\"},{\"placeholder\":\"civil_status\",\"source\":\"application\",\"field\":\"civil_status\"},{\"placeholder\":\"emergency_contact_name\",\"source\":\"application\",\"field\":\"emergency_contact_name\"},{\"placeholder\":\"emergency_contact_number\",\"source\":\"application\",\"field\":\"emergency_contact_number\"},{\"placeholder\":\"gender\",\"source\":\"application\",\"field\":\"gender\"}]', '2026-08-25 21:48:44', '2026-09-10 15:42:37');

-- Table: residents
DELETE FROM `residents`;
INSERT INTO `residents` (`resident_id`, `resident_code`, `first_name`, `middle_name`, `last_name`, `suffix`, `birth_date`, `birth_place`, `nationality`, `religion`, `occupation`, `gender`, `civil_status`, `blood_type`, `barangay_id`, `address_line`, `house_number`, `street`, `subdivision`, `block`, `lot`, `purok_zone`, `sitio`, `municipality`, `province`, `zip_code`, `contact_number`, `emergency_contact_name`, `emergency_contact_number`, `email`, `photo`, `status`, `created_at`, `updated_at`) VALUES (42, 'RES-00001', 'Neil Andrei', 'Madrid', 'Enrera', NULL, '2003-09-23 16:00:00', NULL, NULL, NULL, 'Employee', NULL, 'Single', NULL, 1, 'Blk 15, Lot 20, Samaria, Adeline Homes', NULL, 'Samaria', 'Adeline Homes', '15', '20', NULL, NULL, NULL, NULL, NULL, '09476141605', 'hanna', '09476141605', 'ninjagoblok0@gmail.com', 'resident-photos/resident_1787652173049.png', 'ACTIVE', '2026-08-25 10:02:53', '2026-09-03 17:59:27');
INSERT INTO `residents` (`resident_id`, `resident_code`, `first_name`, `middle_name`, `last_name`, `suffix`, `birth_date`, `birth_place`, `nationality`, `religion`, `occupation`, `gender`, `civil_status`, `blood_type`, `barangay_id`, `address_line`, `house_number`, `street`, `subdivision`, `block`, `lot`, `purok_zone`, `sitio`, `municipality`, `province`, `zip_code`, `contact_number`, `emergency_contact_name`, `emergency_contact_number`, `email`, `photo`, `status`, `created_at`, `updated_at`) VALUES (43, 'RES-00002', 'Neil Andrei Madrid', '', 'Enrera', '', '2003-09-22 16:00:00', 'Quezon City', '', '', 'Employee', 'Male', 'Single', NULL, 1, 'Blk 15, Lot 20 B, Samaria, Pleasant Hills', 'Blk 15', 'Samaria', 'Pleasant Hills', '15', '20 B', NULL, NULL, NULL, NULL, NULL, '09123456789', 'hanna', '09476141605', 'andreienrera@gmail.com', 'resident-photos/resident_1787691830756.png', 'ACTIVE', '2026-08-25 21:03:50', '2026-09-03 18:13:49');
INSERT INTO `residents` (`resident_id`, `resident_code`, `first_name`, `middle_name`, `last_name`, `suffix`, `birth_date`, `birth_place`, `nationality`, `religion`, `occupation`, `gender`, `civil_status`, `blood_type`, `barangay_id`, `address_line`, `house_number`, `street`, `subdivision`, `block`, `lot`, `purok_zone`, `sitio`, `municipality`, `province`, `zip_code`, `contact_number`, `emergency_contact_name`, `emergency_contact_number`, `email`, `photo`, `status`, `created_at`, `updated_at`) VALUES (45, 'RES-00003', 'AuditTestUpdated', NULL, 'Resident', NULL, '1995-05-14 16:00:00', NULL, 'Filipino', NULL, NULL, 'Male', 'Single', NULL, 1, '456 Updated Lane', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '09171234567', NULL, NULL, 'audittest@example.com', NULL, 'ACTIVE', '2026-09-03 16:04:19', '2026-09-03 16:04:20');
INSERT INTO `residents` (`resident_id`, `resident_code`, `first_name`, `middle_name`, `last_name`, `suffix`, `birth_date`, `birth_place`, `nationality`, `religion`, `occupation`, `gender`, `civil_status`, `blood_type`, `barangay_id`, `address_line`, `house_number`, `street`, `subdivision`, `block`, `lot`, `purok_zone`, `sitio`, `municipality`, `province`, `zip_code`, `contact_number`, `emergency_contact_name`, `emergency_contact_number`, `email`, `photo`, `status`, `created_at`, `updated_at`) VALUES (48, 'RES-00004', 'Neil Andrei', NULL, 'Enrera', NULL, '2003-09-23 16:00:00', NULL, 'Filipino', NULL, NULL, 'Male', 'Single', NULL, 1, 'Blk 15 Lot 20 B, Samaria Street', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', 'Hanna', '09159747544', '', 'resident-photos/resident_1788875749340.png', 'ACTIVE', '2026-09-08 13:55:49', '2026-09-08 13:55:49');
INSERT INTO `residents` (`resident_id`, `resident_code`, `first_name`, `middle_name`, `last_name`, `suffix`, `birth_date`, `birth_place`, `nationality`, `religion`, `occupation`, `gender`, `civil_status`, `blood_type`, `barangay_id`, `address_line`, `house_number`, `street`, `subdivision`, `block`, `lot`, `purok_zone`, `sitio`, `municipality`, `province`, `zip_code`, `contact_number`, `emergency_contact_name`, `emergency_contact_number`, `email`, `photo`, `status`, `created_at`, `updated_at`) VALUES (49, 'RES-00005', 'Enrera', NULL, 'Enrera', NULL, '2003-09-23 16:00:00', NULL, 'Filipino', NULL, NULL, 'Male', 'Single', NULL, 1, 'Blk 15, Lot 20 B, Samaria, Santolan Hills, San Manuel, Tarlac', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', 'Kurimas Leo Kusing', '09123456789', '', 'resident-photos/resident_1788875893717.png', 'ACTIVE', '2026-09-08 13:58:13', '2026-09-08 13:58:13');

-- Table: rfid_cards
DELETE FROM `rfid_cards`;
INSERT INTO `rfid_cards` (`rfid_card_id`, `resident_id`, `card_uid`, `status`, `issued_date`, `expiration_date`, `created_at`, `updated_at`) VALUES (17, 42, 'C9463D05', 'ACTIVE', NULL, '2029-08-24 16:00:00', '2026-08-25 10:06:59', '2026-08-25 10:06:59');
INSERT INTO `rfid_cards` (`rfid_card_id`, `resident_id`, `card_uid`, `status`, `issued_date`, `expiration_date`, `created_at`, `updated_at`) VALUES (18, 45, 'TEST_1788451460005', '', NULL, NULL, '2026-09-03 16:04:20', '2026-09-03 16:04:20');
INSERT INTO `rfid_cards` (`rfid_card_id`, `resident_id`, `card_uid`, `status`, `issued_date`, `expiration_date`, `created_at`, `updated_at`) VALUES (21, 48, '1225562341', 'ACTIVE', NULL, '2029-09-12 16:00:00', '2026-09-13 06:21:23', '2026-09-13 06:21:23');
INSERT INTO `rfid_cards` (`rfid_card_id`, `resident_id`, `card_uid`, `status`, `issued_date`, `expiration_date`, `created_at`, `updated_at`) VALUES (22, 43, '1225208565', 'ACTIVE', NULL, '2029-09-12 16:00:00', '2026-09-13 07:04:06', '2026-09-13 07:04:06');

SET FOREIGN_KEY_CHECKS = 1;
