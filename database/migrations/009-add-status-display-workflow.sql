-- =====================================================
-- Migration: New request status workflow for Status Display Board
-- Purpose : Align the request lifecycle with the Status Display Board:
--           Submitted → Waiting for Requirements → Requirements Received
--           → Under Review → Document Processing → Ready for Release → Released
--           (Rejected and Cancelled remain terminal states)
-- Date    : 2026-08-04
-- =====================================================

USE ims_iot_document_kiosk;

-- =====================================================
-- 1. Rename existing statuses to the new workflow names.
--    IDs are preserved so existing requests and history stay valid.
-- =====================================================

UPDATE request_statuses SET status_name = 'Submitted', description = 'Submitted by resident through the kiosk' WHERE status_name = 'Pending';
UPDATE request_statuses SET status_name = 'Under Review', description = 'Being reviewed by staff' WHERE status_name = 'Approved';
UPDATE request_statuses SET status_name = 'Document Processing', description = 'Document is being processed' WHERE status_name = 'Processing';

-- =====================================================
-- 2. Renumber statuses into a clean linear workflow.
--    ON UPDATE CASCADE propagates new IDs to requests.status_id
--    and to request_status_history (old/new status).
--
--    Final IDs:
--      1 Submitted
--      2 Waiting for Requirements
--      3 Requirements Received
--      4 Under Review
--      5 Document Processing
--      6 Ready for Release
--      7 Released
--      8 Rejected
--      9 Cancelled
-- =====================================================

-- Move Released 5 -> 7 (7 is currently free)
UPDATE request_statuses SET status_id = 7 WHERE status_name = 'Released';

-- Move Document Processing 6 -> 5 (5 is now free)
UPDATE request_statuses SET status_id = 5 WHERE status_name = 'Document Processing';

-- Move Ready for Release 4 -> 6 (6 is now free)
UPDATE request_statuses SET status_id = 6 WHERE status_name = 'Ready for Release';

-- Move Under Review 2 -> 4 (4 is now free)
UPDATE request_statuses SET status_id = 4 WHERE status_name = 'Under Review';

-- Move Rejected 3 -> 8 (8 is free)
UPDATE request_statuses SET status_id = 8 WHERE status_name = 'Rejected';

-- =====================================================
-- 3. Insert the two new workflow statuses at IDs 2 and 3
-- =====================================================

INSERT INTO request_statuses (status_id, status_name, description) VALUES
(2, 'Waiting for Requirements', 'Waiting for the resident to submit required documents'),
(3, 'Requirements Received', 'Required documents have been received');

-- Reset auto-increment so future inserts do not collide
ALTER TABLE request_statuses AUTO_INCREMENT = 10;

-- =====================================================
-- DONE
-- =====================================================
