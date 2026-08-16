-- 022: Drop request_attachments and request_corrections tables.
-- Both were write-only audit/storage tables with no read path anywhere in the
-- codebase (no endpoint, query, or frontend ever consumed their rows):
--   - request_attachments  : kiosk photos were written to disk (uploads/kiosk-photos)
--                            AND mirrored into this table, but the DB rows were
--                            never read; the table was empty.
--   - request_corrections  : field-level edit audit rows written by
--                            request.service.js updateRequest; its only reader
--                            (correction.repository.js findByRequest) was never
--                            called; the table was empty.
-- Corresponding code in backend/src was updated in the same change:
--   - transaction.service.js savePhoto() no longer inserts attachment rows.
--   - request.service.js no longer logs corrections; correction.repository.js removed.

DROP TABLE IF EXISTS request_corrections;
DROP TABLE IF EXISTS request_attachments;