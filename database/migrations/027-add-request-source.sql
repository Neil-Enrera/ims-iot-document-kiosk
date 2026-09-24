-- Migration 027: Add request source column (Kiosk vs Online)
-- Backs Section 16 of Barangay San Manuel Remote Online Portal spec

USE ims_iot_document_kiosk;

ALTER TABLE requests
    ADD COLUMN source ENUM('Kiosk', 'Online') NOT NULL DEFAULT 'Kiosk' AFTER service_id;
