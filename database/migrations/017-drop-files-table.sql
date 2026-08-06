-- 017: Drop the standalone files table (removed Files module).
-- The files table was a generic bucket with no foreign keys to business entities.
-- All actual file storage is handled by dedicated columns/tables:
--   - services.template_path (service templates)
--   - residents.photo (resident photos)
--   - request_attachments (kiosk photos + request attachments)
--   - generated_documents (generated official documents)

DROP TABLE IF EXISTS files;