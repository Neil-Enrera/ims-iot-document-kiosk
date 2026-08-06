-- 016: Drop simplified-out service fields.
-- Processing Time, Approval Workflow, Show in Kiosk, and Required Documents were
-- removed from the admin Service form as unnecessary/redundant. The "What to Bring"
-- (requirements) list is the single source of requirements for residents.
-- show_in_kiosk is dropped so every active service appears on the kiosk.

ALTER TABLE services
  DROP COLUMN processing_time,
  DROP COLUMN approval_workflow,
  DROP COLUMN required_documents,
  DROP COLUMN show_in_kiosk;
