-- Migration 025: Align service document placeholder mappings with robust resolvers
-- Ensures full_name, day, month, and year map cleanly to resident and system resolvers.

UPDATE `services`
SET `document_mappings` = '[{"placeholder":"full_name","source":"resident","field":"full_name"},{"placeholder":"age","source":"resident","field":"age"},{"placeholder":"civil_status","source":"resident","field":"civil_status"},{"placeholder":"block","source":"application","field":"Block"},{"placeholder":"lot","source":"application","field":"lot"},{"placeholder":"street","source":"resident","field":"street"},{"placeholder":"subdivision","source":"application","field":"Subdivision"},{"placeholder":"relative_name","source":"application","field":"relative_name"},{"placeholder":"purpose","source":"application","field":"purpose"},{"placeholder":"day","source":"system","field":"day"},{"placeholder":"month","source":"system","field":"month"},{"placeholder":"year","source":"system","field":"year"}]'
WHERE `service_id` = 41;

UPDATE `services`
SET `document_mappings` = '[{"placeholder":"full_name","source":"resident","field":"full_name"},{"placeholder":"age","source":"resident","field":"age"},{"placeholder":"block","source":"application","field":"block"},{"placeholder":"lot","source":"application","field":"lot"},{"placeholder":"street","source":"application","field":"street"},{"placeholder":"subdivision","source":"application","field":"subdivision"},{"placeholder":"purpose","source":"application","field":"purpose"},{"placeholder":"day","source":"system","field":"day"},{"placeholder":"month","source":"system","field":"month"},{"placeholder":"year","source":"system","field":"year"},{"placeholder":"control_number","source":"system","field":"request_number"}]'
WHERE `service_id` = 68;
