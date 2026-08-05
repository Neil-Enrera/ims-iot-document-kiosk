# Decision Log

## Format

Each decision follows this template:

```markdown
### DEC-XXX — [Title]

**Status:** Proposed | Accepted | Rejected | Superseded by DEC-YYY
**Date:** YYYY-MM-DD
**Decision Maker(s):** _TBD_

**Decision:**
_Clear statement of what was decided._

**Reason:**
_Why this decision was made._

**Alternatives Considered:**
1. _Alternative 1_ — _why rejected_
2. _Alternative 2_ — _why rejected_

**Consequences:**
_What this decision means for the project._
```

---

## Decisions

### DEC-001 — Remove payments table from schema

**Status:** Accepted
**Date:** 2026-07-29
**Decision Maker(s):** Project Owner

**Decision:**
The `payments` table and all payment-related foreign keys, constraints, and seed data were removed from the database schema.

**Reason:**
The system is an Information Management System for document request processing. It does not handle payment processing, cashiering, or billing. The `processing_fee` field in `services` is informational only.

**Alternatives Considered:**
1. Keep payments table with a `status` field — rejected as it implies payment processing capability the system does not have.

**Consequences:**
- Simpler schema with fewer tables
- No payment-related code to maintain
- Clear scope boundary for the project

---

### DEC-002 — Replace address columns with barangays table + address_line

**Status:** Accepted
**Date:** 2026-07-29
**Decision Maker(s):** Project Owner, Database Architect

**Decision:**
The six address columns (`house_no`, `street`, `purok`, `barangay`, `city`, `province`) in the `residents` table were replaced with two columns: `barangay_id` (foreign key to a new `barangays` table) and `address_line` (VARCHAR(255)).

**Reason:**
The client does not use Purok or Sitio. The system does not require searching or reporting by street or individual address components. A normalized `barangays` table supports future multi-barangay deployment if needed.

**Alternatives Considered:**
1. Keep all address columns — rejected as it adds unnecessary complexity for fields the client does not use.
2. Use a single `address` TEXT column — rejected as it loses the ability to filter residents by barangay.

**Consequences:**
- One extra JOIN when querying residents with barangay details
- Cleaner address structure
- Future-proofed for multi-barangay expansion

---

### DEC-003 — Use ENUMs for status fields instead of VARCHAR

**Status:** Accepted
**Date:** 2026-07-29
**Decision Maker(s):** Database Architect

**Decision:**
All status columns (`users.status`, `residents.status`, `rfid_cards.status`, `residents.gender`, `residents.civil_status`) were changed from VARCHAR to ENUM with predefined valid values.

**Reason:**
Prevents data drift where `"Active"`, `"active"`, and `"ACTIVE"` coexist as different values. ENUMs enforce data consistency at the database level.

**Alternatives Considered:**
1. Keep VARCHAR with CHECK constraints — rejected as ENUMs are simpler and more enforced.

**Consequences:**
- Adding new status values requires ALTER TABLE
- Data is always consistent
- Application code can rely on known values

---

### DEC-004 — Remove deleted_at soft delete columns

**Status:** Accepted
**Date:** 2026-07-29
**Decision Maker(s):** Project Owner

**Decision:**
The `deleted_at` columns were removed from `users` and `residents` tables. The existing `status` ENUM fields (with values like `INACTIVE`, `MOVED`, `DECEASED`) serve the same purpose.

**Reason:**
Soft delete adds complexity — every query must filter on `deleted_at IS NULL`. Status ENUMs achieve the same result (marking records as inactive) without the overhead.

**Alternatives Considered:**
1. Keep soft delete and apply it consistently — rejected as unnecessary complexity for this project scope.

**Consequences:**
- Simpler queries (no WHERE deleted_at IS NULL needed)
- Deleted records are permanently removed with DELETE
- Status ENUMs provide the same functional outcome

---

### DEC-005 — Add CHECK constraints for request date ordering

**Status:** Accepted
**Date:** 2026-07-29
**Decision Maker(s):** Database Architect

**Decision:**
Two CHECK constraints were added to the `requests` table:
- `chk_request_dates`: `reviewed_date IS NULL OR reviewed_date >= request_date`
- `chk_release_dates`: `release_date IS NULL OR release_date >= reviewed_date`

**Reason:**
Prevents invalid date orderings (e.g., a request being reviewed before it was submitted, or released before review). Enforces timeline integrity at the database level.

**Alternatives Considered:**
1. Application-level validation only — rejected as it can be bypassed by direct SQL inserts.

**Consequences:**
- Invalid date combinations are rejected by the database
- Application code can trust date ordering
- MySQL 8.0.16+ or MariaDB 10.2.1+ required

---

### DEC-006 — Remove processing_fee CHECK constraint

**Status:** Accepted
**Date:** 2026-07-30
**Decision Maker(s):** Project Owner

**Decision:**
The CHECK constraint `chk_service_fee CHECK (processing_fee >= 0)` was removed from the `services` table.

**Reason:**
Not needed for the project scope. The `processing_fee` is informational and the application layer handles validation.

**Alternatives Considered:**
1. Keep the constraint — removed per project owner decision.

**Consequences:**
- Simpler schema
- No database-level fee validation

---

### DEC-007 — Remove estimated_processing_time and reviewed_by columns

**Status:** Accepted
**Date:** 2026-07-30
**Decision Maker(s):** Project Owner

**Decision:**
- `services.estimated_processing_time` column removed
- `requests.reviewed_by` column and its FK constraint removed

**Reason:**
`estimated_processing_time` was not used by the system. `reviewed_by` was removed per project requirements — the request lifecycle is tracked by `status_id` and `request_status_history` instead.

**Alternatives Considered:**
1. Keep reviewed_by as an audit field — removed as `request_status_history` serves this purpose better.

**Consequences:**
- Simpler `requests` and `services` tables
- Request audit trail handled entirely by `request_status_history`

---

### DEC-008 — Remove TASK-BACKEND-012 and TASK-FRONTEND-011 (Payment Processing)

**Status:** Accepted
**Date:** 2026-07-31
**Decision Maker(s):** Project Owner

**Decision:**
TASK-BACKEND-012 (Payment Management API) and TASK-FRONTEND-011 (Payment Management Module) have been removed from the project scope. All payment-related documentation references are now outdated and superseded by this decision.

**Reason:**
The system is an Information Management System for document request processing. It does not handle payment processing, cashiering, or billing. The `processing_fee` field in `services` is informational only. This decision formalizes DEC-001 (Remove payments table) at the task level.

**Alternatives Considered:**
1. Keep payment tasks as optional — rejected as it creates confusion about project scope.

**Consequences:**
- TASK-BACKEND-012 and TASK-FRONTEND-011 deleted from docs/tasks/
- No code changes required (no payment code was ever implemented)
- Project scope is now clearly defined without payment processing
- Total task count reduced from 77 to 75

---

### DEC-009 — Template-driven application forms (manual field mapping, no OCR/AI)

**Status:** Accepted
**Date:** 2026-08-03
**Decision Maker(s):** Project Owner

**Decision:**
Document request application forms are generated from administrator-configured fields. Administrators upload the official barangay document template (PDF/DOCX/image) per service as the official reference, then manually map the fields that appear on the resident's application form. The system performs no OCR or AI-based field extraction.

**Reason:**
The application form must always match the official barangay document template. Manual mapping ensures accuracy, flexibility, and consistency while avoiding errors caused by automatic field detection, and it keeps the system future-proof when official templates change.

**Alternatives Considered:**
1. OCR/AI field extraction from uploaded templates — rejected per requirements; error-prone and unnecessary since administrators can map fields directly against the official template.

**Consequences:**
- `services` gained template file columns (migration 007) and `form_fields` now supports 12 field types plus validation/helper-text config.
- Two new template endpoints (`POST`/`DELETE /services/:id/template`); kiosk dynamic form and review steps extended.
- Scope limited to document request services; the dedicated Barangay ID application flow is unaffected.

---

### DEC-010 — Replace request status workflow with Status Display Board workflow
**Status:** Accepted
**Date:** 2026-08-04
**Decision Maker(s):** Project Owner

**Decision:**
The document request status workflow was replaced with a linear 7-step workflow that maps to the Status Display Board:
`Submitted → Waiting for Requirements → Requirements Received → Under Review → Document Processing → Ready for Release → Released`, with `Rejected` and `Cancelled` as terminal states. The previous workflow (`Pending → Approved → Processing → Ready for Release → Released`) was removed.

**Reason:**
The Status Display Board shows residents only two columns (Under Review and Ready for Release). The new workflow lets staff record the real-world document journey (submission of requirements, verification, processing) so the board reflects accurate progress and reduces unnecessary inquiries at the office.

**Alternatives Considered:**
1. Keep the existing 5-state workflow and map display columns onto it — rejected as it could not represent "Waiting for Requirements" and "Requirements Received", which are central to the physical document-submission process.

**Consequences:**
- Migration `009` renames/renumbers statuses; `ON UPDATE CASCADE` keeps `requests` and `request_status_history` consistent.
- `request.service.js` `VALID_TRANSITIONS` now enforce a strictly forward workflow (Under Review may skip directly to Ready for Release; terminal states cannot be reopened).
- Admin Panel request management now uses a status dropdown instead of approve/reject/release buttons.
- A public, read-only Status Display Board page at `/status-display` (in the kiosk app) polls a new public `GET /kiosk/status-display` endpoint every 7 seconds.
- New generic `PUT /requests/:id/status` endpoint; `request-status-changed` SSE event added for admin auto-refresh.

---

### DEC-011 — Template-driven automatic document generation

**Status:** Accepted
**Date:** 2026-08-05
**Decision Maker(s):** Project Owner

**Decision:**
Each document-request service may store an official DOCX template along with a set of `{{placeholder}}` mappings. When a request reaches **Document Processing** (approved stage), the system automatically renders the template by replacing each placeholder with the matching value (resident record, submitted `form_data`, or a system-generated value), and stores the completed document separately from the never-modified template. Staff can preview, download, or print generated documents.

**Reason:**
The goal is to remove manual retyping by barangay staff. Template-driven generation means adding or updating a service (create service → upload DOCX template with `{{placeholders}}` → configure mappings → save) requires no source-code changes, keeping the system scalable and maintainable. Placeholder mappings replace the (rejected in DEC-009) concept of OCR but extend the same manual-configuration philosophy from the application form to the final official document.

**Alternatives Considered:**
1. OCR/AI extraction from scanned templates — rejected per DEC-009; error-prone and unnecessary.
2. Hardcoding document fields per service in code — rejected as it requires code changes for each new/updated service.
3. Pure PDF templates only — rejected as DOCX is the natural editable office format and placeholder replacement is well supported by `docxtemplater`.

**Consequences:**
- Migration `010` adds `services.document_mappings` (JSON) and a `generated_documents` table.
- New document endpoints under `/requests/:id/documents`; `GET /services/:id/template/placeholders` assists mapping configuration.
- `request.service.js` auto-generates the document on transition to Document Processing; failures are logged and do not block the status change.
- Generated files are stored in `uploads/generated-documents/`; PDF conversion is optional and only runs if LibreOffice (`soffice`) is available.
- Admin Panel service form gains placeholder-mapping configuration (with "Scan Template"); request details modal gains a generated-documents section with Generate / Preview / Download / Print.

---

