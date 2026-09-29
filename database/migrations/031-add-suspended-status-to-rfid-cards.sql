-- Migration 031: Widen rfid_cards status enum to include SUSPENDED and REVOKED
ALTER TABLE `rfid_cards`
  MODIFY COLUMN `status` ENUM('ACTIVE','INACTIVE','SUSPENDED','EXPIRED','LOST','CANCELLED','REVOKED') DEFAULT 'ACTIVE';
