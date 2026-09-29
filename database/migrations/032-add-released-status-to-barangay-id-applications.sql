-- Migration 032: Add RELEASED status and release tracking to barangay_id_applications
ALTER TABLE `barangay_id_applications`
  MODIFY COLUMN `status` ENUM('PENDING','APPROVED','REJECTED','RETURNED','RELEASED') NOT NULL DEFAULT 'PENDING',
  ADD COLUMN `released_at` DATETIME NULL AFTER `reviewed_at`,
  ADD COLUMN `released_by` BIGINT UNSIGNED NULL AFTER `released_at`;
