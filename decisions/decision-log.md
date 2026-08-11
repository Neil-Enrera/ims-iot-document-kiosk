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

### DEC-012 — Claim window (expiry) for done documents

**Status:** Accepted
**Date:** 2026-08-05
**Decision Maker(s):** Project Owner

**Decision:**
Done (finished) documents get a configurable claim window. When a request reaches **Ready for Release**, the system records an `expires_at` deadline equal to the ready/release timestamp plus `document_claim_days` (default 15, configurable in System Settings → Document). A ready-for-release document is considered **expired** when `expires_at < NOW()`; releasing the document (claimed) clears the deadline. Expiry is a soft flag — it never deletes or modifies the generated document file.

**Reason:**
Done documents that residents never claim accumulate as clutter and mislead the Status Display Board ("Ready for Release" is shown as a live, actionable column). An explicit, configurable claim window lets staff see which finished documents are at risk (an "Expires in Xd / Expired" badge) and prevents stale records from blocking attention. Soft expiry preserves the generated file for future re-release rather than destroying completed work.

**Alternatives Considered:**
1. Auto-delete expired generated files — rejected as destructive; losing finished official documents could require full re-generation.
2. Hardcode a fixed claim window — rejected as different barangay workflows need different retention periods; making it a System Setting keeps it configurable without code changes.
3. Treat expiry as a new terminal workflow status — rejected as it would complicate the linear 7-step workflow and the status dropdown; an `is_expired` flag is simpler and still surfaces in the UI.

**Consequences:**
- Migration `011` adds `requests.expires_at` (DATETIME) and the `document_claim_days` System Setting.
- `request.service.js` sets `expires_at` on transition to Ready for Release and clears it on Released; `request.repository.js` returns a computed `is_expired` flag.
- Ready-for-release requests that have expired are hidden from the public Status Display Board.
- Admin Panel Document Requests list gains a "Claim Expiry" column with an Expired / X-day countdown badge, and the request details modal shows the claim deadline.

---

### DEC-013 — Independent kiosk visibility for services

**Status:** Accepted
**Date:** 2026-08-05
**Decision Maker(s):** Project Owner

**Decision:**
Services gain a second, independent status flag: **Show in Kiosk** (`services.show_in_kiosk`, default true). It is separate from the existing **Active** status. The Kiosk selection screen only lists services where `is_active = 1 AND show_in_kiosk = 1`. Unchecking "Show in Kiosk" removes a service from the Kiosk while keeping it Active and fully usable in the admin panel (new requests, document generation).

**Reason:**
Previously the only way to hide a service from the Kiosk was to deactivate it, which also made the service unusable in the admin panel. Barangay staff may want to stop offering a service at the self-service Kiosk (e.g. temporarily) but still accept and process requests for it through the office. A dedicated, reversible flag ("Show in Kiosk") expresses this intent without the destructive connotation of removing the service or collapsing its admin usability.

**Alternatives Considered:**
1. Reuse only the existing `is_active` flag for kiosk visibility — rejected, as it conflates "service is usable" with "service is offered at the Kiosk" and cannot represent an office-only service.
2. A destructive "Remove from Kiosk" action that deletes the service — rejected; it implies the service is gone and would break request/document history, whereas hiding is reversible and preserves data.
3. A terminal workflow-like "Hidden" state — rejected; a single boolean flag matches the existing `is_active` pattern and is simpler.

**Consequences:**
- Migration `012` adds `services.show_in_kiosk` (BOOLEAN, default TRUE).
- Kiosk public services query now filters on both `is_active` and `show_in_kiosk`.
- New endpoints `PATCH /services/:id/kiosk-visibility` and `PATCH /services/:id/status` operate the two flags independently.
- Admin Panel Service form gains a "Show in Kiosk" toggle; the Services list gains an "In Kiosk" column (Shown / Hidden).

---

### DEC-014 — Fix document preview rendering and normalize `{{placeholder}}` tags

**Status:** Accepted
**Date:** 2026-08-06
**Decision Maker(s):** Project Owner

**Decision:**
Two defects in the DEC-011 document workflow were fixed:

1. **Preview rendering (frontend)** — `DocumentPreviewModalComponent` no longer uses `ngOnChanges` + `@ViewChild(static: true)` to render. The preview container only exists inside an `@if (open)` block, so a static query resolved it once as `undefined` at init and never rendered. It now uses `ngAfterViewChecked()` (fires after the conditional view is created) with a dynamic `@ViewChild(container, { static: false })`; `render()` is idempotent via a `renderedKey` claimed synchronously, and re-entrant checks are safe. This fixes both the "Preview Template" button and the per-document "Preview".

2. **Placeholder normalization (backend + frontend)** — placeholder lookups are normalized (`trim`, strip `{{ }}`) everywhere a scan or mapping is compared, so `{{Name}}`, `Name`, and `  name  ` all match the bare tags the `docxtemplater` lexer extracts. `scanTemplatePlaceholders` now never throws on a missing/invalid/non-DOCX template (returns `[]`), and `generateDocument` rejects non-DOCX templates with a clear message instead of a 500.

**Reason:**
Preview of both the official template and generated documents rendered blank (the render never ran) and the scan used brace-less/underscore placeholder files. Normalization makes mappings robust against trivial formatting variations so placeholder replacement actually fills in data.

**Alternatives Considered:**
1. `ngAfterViewInit` instead of `ngAfterViewChecked` — rejected because `open`/`blob` inputs arrive over different change-detection cycles (template vs. generated preview), so a single init hook misses them.
2. Move the render to the parent component — rejected; keeps the modal self-contained.

**Consequences:**
- `document-preview-modal.component.ts`: `AfterViewChecked` lifecycle + dynamic `ViewChild` + idempotent `render()`.
- `document.service.js`: `normalizeTag()` local helper, throw-safe `scanTemplatePlaceholders`, non-DOCX guard.
- `service-form.component.ts`: `normalizePlaceholder()` and clearer "no {{tags}}" guidance.
- Verified: `tsc --noEmit` clean, 14 frontend tests, 32 backend tests, backend ESLint clean, live HTTP preview endpoints return 200 with correct content-type. **Existing uploaded templates (services 27/29/30/36) still contain no `{{placeholders}}` — those files must be redone with braces for automatic fill-in; preview will now render whatever is in the file even if it is blank of tags.**

---



---

### DEC-015 -? Prevent duplicate requests and generate documents for preview before approval

**Status:** Accepted
**Date:** 2026-08-06
**Decision Maker(s):** Project Owner

**Decision:**
A full end-to-end review of the document-request + template workflow addressed four issues:

1. **Duplicate requests (client + server).** The kiosk was the only place requests were created and it had no re-entry guard and no server idempotency; any double-click or retry inserted a second row. A stable `idempotency_key` (UUID, generated once per submission attempt on the kiosk, reused across retries, cleared after success) is now sent with every `POST /kiosk/requests`. The server stores it in a new UNIQUE `requests.idempotency_key` column (migration `014`), returns the existing request instead of inserting when the key repeats, and treats the rare UNIQUE-violation race the same way. The kiosk `submitRequest()`/`submitBarangay()` also short-circuit with `if (submitting()) return;`.

2. **Preview the populated document before approval (issue 3).** Documents used to auto-generate only on Document Processing (status 5) -? which IS the approve action -? so nothing existed to review first. Generation now fires idempotently as soon as a request reaches **Under Review (status 4)** (and re-fires as a fallback at status 5 only if none exists). `hasGeneratedDocument()` guards re-generation. The admin panel gains an explicit **Preview Document** action that generates on demand (when eligible) and opens the latest populated document before Approve/Reject.

3. **Template not used / document blank (issues 1 + 4).** The root cause was not routing: it was that the uploaded templates (services 27/29/30/36) contain **zero `{{placeholder}}` tags** -? they use literal underscores (`____________________`, `____ day of ____`) -? and `docxtemplater` only replaces `{{double_braced}}` tags. Generation therefore always produced an identical blank file. `generateDocument` now refuses to produce a silent blank official document when the template has no `{{tags}}` and returns a clear remediation message. `loadServiceWithMappings` now also parses `form_fields`/`requirements` (previously JSON strings crashed validation with "(service.form_fields || []).map is not a function").

**Reason:**
Duplicate rows wasted staff time and inflated queue numbers; approving without seeing the finished document forced blind decisions; and blank "generated" documents looked like a broken template-pipeline when the real problem was placeholder syntax in the source DOCX files.

**Alternatives Considered:**
1. Client-only guard for duplicates -? rejected; retries/network issues bypass it. Server-side UNIQUE key is authoritative.
2. Auto-generate only at status 4 and remove status-5 generation -? rejected; status 5 remains as a fallback so legacy/other flows still produce a document.
3. A "Generate Draft" admin action instead of auto-gen at Under Review -? rejected; auto-gen keeps the flow consistent and the Preview button can also force it on demand.

**Consequences:**
- Migration `014` (`requests.idempotency_key` + UNIQUE index) applied to the dev database.
- `kiosk.controller.js`: idempotency lookup + insert with key + UNIQUE-violation handling.
- `request.service.js`: auto-generate at UNDER_REVIEW and DOCUMENT_PROCESSING, guarded by `hasGeneratedDocument`, failures logged but non-blocking.
- `document.service.js`: no-tag guard, parsed JSON columns, `hasGeneratedDocument` export.
- `kiosk.component.ts`: submission re-entry guards + `idempotency_key` (UUID).
- `requests.component.ts`: Preview Document button + `previewRequestDocument()`.
- Verified live against the running server: admin login, tagged template upload, placeholder scan, request submit, duplicate re-submit returns the same request, Under Review auto-generates, and the generated DOCX contains the resident name/purpose/request number (9/9 E2E checks). All 32 backend tests and both frontend `tsc --noEmit` builds pass.
- **Still required by the business:** re-author services 27/29/30/36 templates with real `{{placeholders}}` and map them; blank/underscore templates now fail loudly instead of producing empty official documents.


---

### DEC-016 -? Master placeholder engine (generic, extensible library)

**Status:** Accepted
**Date:** 2026-08-06
**Decision Maker(s):** Project Owner

**Decision:**
Replace the ad-hoc per-service placeholder mappings with a **master placeholder engine** (`backend/src/services/placeholder.engine.js`) so any uploaded document template works without per-document-type code. Key behaviors:

1. **One library, all documents.** ~62 placeholders across six categories (Resident, Address, Document, Barangay, System, Barangay ID). Any `{{placeholder}}` in an uploaded DOCX is auto-filled from the resident record, the kiosk application form, the request, the barangay record, or the system clock.
2. **Auto-fill without mappings.** Generation resolves tags by priority: explicit per-service mapping (admin override) -? master library (key or alias) -? application form fallback. Services no longer need a mapping entry for every tag.
3. **Derived values.** `age` (computed from `birth_date`), plus `day`/`month`/`year`/`current_time`/`day_of_week` split out from the clock.
4. **Validation + UI.** Template scan now classifies tags as known (library) vs unknown; unknown tags warn at generation and are surfaced in the admin Service form (green vs amber chips). A new `GET /services/placeholders/library` endpoint + collapsible library panel lets admins browse/copy placeholders.
5. **Extensible.** New placeholders are added by appending a registry entry (`registerPlaceholder`); no core generation changes.

**Reason:**
Certificates (Indigency, Residency, Clearance, etc.) were blank because templates used underscores and, when tagged, required hand-built mappings per service. A data-driven registry makes every current and future barangay document fill-in automatically, without a developer.

**Alternatives Considered:**
1. Per-service hardcoded resolvers for each new template -? rejected; violates the "no code per document type" requirement.
2. Keep mappings mandatory and expand the option lists -? rejected; admin friction, easy to misconfigure, and still manual per service.
3. Image embedding (resident photo, logo) and QR/RFID generation now -? rejected; deferred (flagged `future`) so the library ships without half-baked binary embedding.

**Consequences:**
- New `placeholder.engine.js`; `document.service.js` delegates resolution + validation to it (old alias/lookup helpers removed).
- Migration `015` adds nullable identity/address columns to `residents` (birth_place, nationality, religion, occupation, house_number, street, purok_zone, sitio, municipality, province, zip_code) and officials/address to `barangays` (captain_name, secretary_name, treasurer_name, address) so those placeholders have backing fields.
- Admin Service form: library panel, known/unknown scan badges, auto-mapping only for unknown tags.
- Verified: 44 backend tests (12 new engine tests), 14 frontend tests, ESLint clean, both `tsc --noEmit` builds clean, live E2E 8/8 (library endpoint, no-mapping service, scan classification, auto-gen at Under Review, populated DOCX, unknown tag blank).
- **Still required by the business:** re-author real templates (e.g. the Indigency certificate) replacing underscores with library tags; populate resident birth dates/address parts and barangay officials so those fields fill in.


---

### DEC-017 - Age, reopenable Preview, and document-generation workflow

**Status:** Accepted
**Date:** 2026-08-06
**Decision Maker(s):** Project Owner

**Decision:**
Close three workflow gaps in the application-form / preview / generation path:

1. **Age is always present and auto-computed.** `{{age}}` (and `{{birth_date}}`) resolve from `resident.birth_date` when available, else from the application form. Guest submissions store identity under `form_data._guest`; the engine now merges those fields into the application context, so a guest's `full_name`/`age`/`birth_date` fill in without special casing. `age` is exposed in the admin Service form's resident-field picker (auto-computed from birth date).

2. **Preview reopens any number of times without a page refresh.** The `DocumentPreviewModalComponent` no longer mutates its `@Input open`; it emits `(onClose)` and `ngOnChanges`/`ngAfterViewChecked` reset and re-render the blob on every open, creating a fresh container each time. `request.component.ts` binds `(onClose)="closePreview()"` and `service-form` binds `(onClose)="showTemplatePreview = false"`.

3. **Document generation is auto-at-Under-Review with replace, not stack.** The recommended workflow for a real barangay office: a document generates automatically the moment the request reaches **Under Review** (so the officer previews the fully populated document before approving/rejecting); Preview generates one if missing; the manual action is renamed **Regenerate Document** and now replaces the previous version (same `REQ-xxxxx_<ts>` prefix prunes older copies) so repeated clicks never stack duplicates.

**Reason:**
Aged documents previously required the date to be manually typed; the preview modal could only be opened once per page load; and repeated "Generate" clicks created duplicate official documents. Auto-computing age removes a class of input errors, an infinitely-reopenable preview matches how officers review a file back-and-forth, and replace-on-regenerate keeps the official document set canonical per request.

**Alternatives Considered:**
1. Age typed by resident at the kiosk - rejected; error-prone and duplicates data already in the resident record.
2. Preview re-opens the existing browser tab - rejected: relies on fragile cached URL and breaks after generate.
3. Manual "Generate" only (no auto) - rejected as the default; auto-at-Under-Review is the primary flow because approval should be made against the actual populated document. Manual "Regenerate" stays as the fallback for template edits.

**Consequences:**
- `placeholder.engine.js`: `_guest` merge into application context; `age`/`birth_date` fall back to application; `full_name` falls back to application for guests.
- `document.service.js`: new `pruneOldGenerations()` export; `document.controller.js` `generate` calls it to keep only the newest generation.
- `document-preview-modal.component.ts`: reopened any number of times; emits `onClose`; re-renders per open.
- `requests.component.ts`: non-authority "Regenerate Document" button + workflow hint; `service-form.component.ts`: age picker entry.
- Verified: 45 backend tests (new guest merge test), 14 admin tests, ESLint clean, both `tsc --noEmit` clean, live E2E (resident age 36, guest age 16 + name, birth_date long-form, regenerate keeps 1 document) 8/8.
- **Still required by the business:** re-author real templates and populate resident birth dates / barangay officials so the auto-filled fields show meaningful values.


---

### DEC-018 - Simplify the Service form: drop redundant fields

**Status:** Accepted
**Date:** 2026-08-06
**Decision Maker(s):** Project Owner

**Decision:**
Remove four fields from the Create/Edit Service form because they did not match the actual barangay workflow or duplicated other fields:

1. **Processing Time** (`services.processing_time`) - dropped; not used anywhere in the request flow.
2. **Approval Workflow** (`services.approval_workflow`) - dropped; the system already has a fixed review/approval workflow per request status.
3. **Show in Kiosk** (`services.show_in_kiosk`) - dropped; every active service now appears on the kiosk. The kiosk query is `WHERE is_active = 1` and the `PATCH /services/:id/kiosk-visibility` endpoint was removed.
4. **Required Documents** (`services.required_documents`) - dropped as redundant; the **What to Bring** list (`services.requirements`) is the single source of requirements shown to residents.

**Reason:**
The form had overlapping requirement concepts (Requirements vs Required Documents) and fields that were never surfaced in the workflow. Simplifying to the fields the office actually manages (name, description, fee, photo flag, active status, template, What to Bring, application form fields, placeholder mappings) reduces admin confusion and keeps one canonical list of requirements.

**Alternatives Considered:**
1. Keep Required Documents alongside What to Bring - rejected; two parallel requirement lists create ambiguity about which one residents must follow.
2. Keep "Show in Kiosk" as a visibility toggle - rejected; the office wants every active service selectable at the kiosk, so the toggle added no value.
3. Keep the columns in the DB but hide them from the form - rejected; dead columns/data invite confusion and drift (migration 016 drops them cleanly).

**Consequences:**
- Migration `016-drop-service-simple-fields.sql` drops `processing_time`, `approval_workflow`, `required_documents`, `show_in_kiosk` from `services` (destructive).
- Removed `changeKioskVisibility` (service/controller/repository) and the `PATCH /services/:id/kiosk-visibility` route + validation.
- Kiosk service list + request `service_snapshot` no longer include the removed fields.
- `eslint.config.js` gained the missing `Buffer` Node global so `src/` lints with 0 errors.
- Verified: backend tests 45/45, admin tests 14/14, ESLint clean, both `tsc --noEmit` clean, live E2E 12/12 (create/update without removed fields, kiosk list, kiosk-visibility 404, request submit + document generation, snapshot has no removed fields).
- Existing requests keep their historical `service_snapshot` JSON; existing services keep all remaining fields.

---

### DEC-019 — Redesign kiosk screens with a light theme

**Status:** Accepted
**Date:** 2026-08-09
**Decision Maker(s):** Project Owner

**Decision:**
The kiosk document-request flow was redesigned from the dark blue theme to a light, high-contrast kiosk theme: off-white (`#F8FAFC`) canvas, slate text (`#0F172A`), and a single orange accent (`#F97316`) for interactive elements. The redesign spans the landing/welcome screen, the guest-info (temporary session) form, and shared chrome (back button, language toggle, 4-step progress indicator, and a three-column footer showing Need Assistance / Office Hours / Current Time). The guest form moved to a card layout with icon-prefixed inputs, per-field inline error messages, and inline success check marks driven by a new `guestSubmitted` signal + `guestInvalid()` helper (replacing the single banner error).

**Reason:**
The previous dark style looked dated and relied on heavy blue gradients; the light theme widens field visibility and centers on a brighter, more approachable "first screen" for residents, with larger touch targets (64px min-height) for the self-service kiosk. Inline per-field errors show residents exactly which field to fix, restarting a blank-vs-failed form.

**Alternatives Considered:**
1. Keep the dark theme and only tweak spacing — rejected; branding guidance moved to a light canvas.
2. Full form re-validation on every keystroke — rejected; errors only appear after the resident attempts to Continue (`guestSubmitted`), avoiding premature red borders.
3. Flat gray inputs — rejected; light-orange icon wells + focus ring match the CTA accent.

**Consequences:**
- kiosk.component.ts now owns the entire screen layout (landing through submit) with Tailwind utility classes; the old dark backgrounds are gone.
- Validation moved from a single `formError` banner to `guestSubmitted` + `guestInvalid('field')`; `formError` is still cleared before navigation.
- i18n: `progress.*` and `landing.footer.*` key groups added/refined; guest labels render the `*` marker in the template, not the string.
- Verified: `ng build kiosk-app` clean (budget warning pre-existing); all keys used by the new template exist in `en.ts`/`fil.ts`.

---

### DEC-020 - Render ID card photos without docxtemplater-image-module

**Status:** Accepted
**Date:** 2026-08-09
**Decision Maker(s):** Project Owner

**Decision:**
The `docxtemplater-image-module` (free v3.1.0) dependency was removed. Barangay ID card photos are now embedded by a small self-contained helper in `id-card.service.js` (`embedPhoto`): the `{{resident_photo}}` tag is normalized and rendered by docxtemplater as a sentinel text token, then the post-render step swaps the token's run for a real `<w:drawing>` element, adding the media part, the `document.xml.rels` relationship, and the `[Content_Types].xml` entry directly on the PizZip object.

**Reason:**
The free image module is abandoned upstream and is incompatible with `docxtemplater@3.69.3` (newer `scopeManager.getValue` requires a `part` meta argument), crashing with `Cannot read properties of undefined (reading 'part')`. The maintained version is paid. Embedding via PizZip keeps the whole card pipeline on the same free docxtemplater core already used for request documents.

**Alternatives Considered:**
1. Pin docxtemplater back to ~3.14 - rejected; regresses every other free-docxtemplater feature and forces older transitive behavior for no benefit.
2. Use the free `docxtemplater-image-module-free` fork - rejected; it targets docxtemplater 3.x but still breaks around 3.32+ (same `part` crash) and is no longer maintained.
3. Buy the paid image module - rejected; project constraints favor free, reproducible dependencies.

**Consequences:**
- `backend/package.json` drops `docxtemplater-image-module`; render uses plain `Docxtemplater` + `embedPhoto`.
- Photo dimensions are read from PNG/JPEG headers and capped at ~480px on the long side to keep official cards compact; images keep their natural aspect.
- Both `{{%resident_photo}}` and `{{resident_photo}}` template spellings resolve; legacy `%` markers are normalized before render.
- Verified: live E2E (insert application -> approve -> resident created, ID number `BRGY-YYYY-NNNNNN`, expiry, DOCX generated with embedded photo, name/id/expiry present), backend tests 54/54, ESLint 0 errors.

---

### DEC-022 - Scale the Capture Your ID Photo screen to match the optimized kiosk screens

**Status:** Accepted
**Date:** 2026-08-10
**Decision Maker(s):** Project Owner

**Decision:**
The kiosk "Capture Your ID Photo" screen was re-scaled so every element matches the sizing already applied to the optimized Barangay ID Requirements and Barangay ID Application screens (the scale introduced in DEC-019). On the landscape kiosk display it previously felt too large and zoomed in. Concretely, in `kiosk.component.ts` (the `bar.photo.*` step):

- Page title/desc now use the same clamp scale as Requirements/Application (`clamp(1.5rem,2.2vw,2.125rem)` / `clamp(0.925rem,1.1vw,1.075rem)`), down from `clamp(2.5rem,3vw,3rem)` / `clamp(1.125rem,1.15vw,1.25rem)`.
- The photo-grid container shrank from `max-w-[1280px]` / `270px` side columns to `max-w-[1180px]` / `240px` columns.
- The camera preview card is `max-w-[520px]` (4:3) instead of `640px`, with the corner markers, silhouette, and status overlays reduced accordingly.
- Buttons dropped from `min-h-[64px]`/`text-lg font-bold` to `min-h-[56px]`/`text-base sm:text-lg font-semibold`, matching the Requirements "Continue" button while staying touchscreen-friendly.
- Side panel titles now use `clamp(1rem,1.4vw,1.1875rem)` and tighter padding/spacing, matching the Requirements h3 / card rhythm.

**Reason:**
The photo step was built before the Requirements/Application steps were scaled down, so it broke the kiosk's visual rhythm and consumed the 1080p landscape viewport (the 640px camera plus large header/buttons pushed content into vertical scroll). Matching the accepted clamp scale keeps one consistent, more spacious look across the whole Barangay ID flow while preserving touch targets.

**Alternatives Considered:**
1. Keep the photo screen at its larger scale — rejected; it was the odd one out and felt zoomed in.
2. Rewrite the step at a new custom scale rather than reusing the accepted clamps — rejected; reusing the exact values guarantees consistency.

**Consequences:**
- Single source of truth for kiosk screen rhythm (same clamp values across Requirements, Application, and Photo steps).
- Camera is smaller but still a 4:3 capture view appropriate for an ID portrait.
- Verified: `npm run build:kiosk` clean (pre-existing budget/ESM warnings only); no backend/API changes.

---

### DEC-021 - Reuse the card render pipeline for a no-persist kiosk live preview

**Status:** Accepted
**Date:** 2026-08-10
**Decision Maker(s):** Project Owner

**Decision:**
`id-card.service.js` was split so the DOCX rendering step returns a buffer without writing to disk: `renderCardBuffer({ application, resident, barangay, processedBy })`. The persisted `generateIdCard` now delegates to it, and a new public kiosk endpoint (`POST /kiosk/barangay-id/preview`) calls the same function with an application object built from the kiosk's in-progress form payload (`applicationFromKioskPayload`) — no application row or resident is created — then streams the DOCX back for inline preview via `docx-preview`.

**Reason:**
Residents wanted to see their official ID card before submitting. Rendering `createBarangayIdApplication` would have persisted a real application on every preview tap. One shared render function guarantees the preview looks exactly like the final approved card (same placeholders, photo embedding, and template), and DRYs away a copy of ~60 lines.

**Alternatives Considered:**
1. Client-side DOCX templating on the kiosk - rejected; the authoritative template/placeholder engine lives server-side, and duplicating it risks mismatch between preview and the real card.
2. Reuse `generateIdCard` then delete the file - rejected; writing and unlink-ing a partial card per preview is wasteful and leaves cleanup edge cases.
3. Preview as static image server-side - rejected; needs a headless Office renderer (extra heavy dependency) for formatting fidelity.

**Consequences:**
- `renderCardBuffer` returns `{ success, buffer, applied, message }`, handles missing/invalid templates, scans tags, embeds the photo, and normalizes legacy `%` markers — unchanged behavior for the persisted path.
- Preview has no `id_number`/expiry yet (correct: the ID number is assigned at approval), so those placeholders render blank on the preview card.
- `applicationFromKioskPayload` maps the kiosk's camelCase body (same `barangayIdApplicationValidation`) onto the application row columns used by `buildContext`.
- Verified: live `POST /kiosk/barangay-id/preview` returns a valid DOCX with the photo drawing + media part; backend tests 52/52 (2 new mapper tests), lint 0 errors, both frontend `tsc --noEmit` + `ng build` clean.

---

### DEC-023 - Complete the kiosk ID preview end-to-end (photo tag, sizing, expiry mapping)

**Status:** Accepted
**Date:** 2026-08-10
**Decision Maker(s):** Project Owner

**Decision:**
A live re-verification of the DEC-021 kiosk preview against the **actual barangay template** found three gaps between the design (DEC-020/DEC-021) and the real running system, all fixed:

1. **No photo on the preview.** DEC-021 was verified against the test fixture template, which contains a `{{resident_photo}}` tag. The barangay's active ID template did **not** contain that tag, so `embedPhoto` had no sentinel token to swap and the preview silently rendered without the photo. The live template in `uploads/` was patched to place `{{resident_photo}}` in the photo box (photo only renders where the tag exists — it is a template/data requirement, not code). Code now also allows the caller to size the embedded photo via `embedPhoto(doc, buffer, centered, maxPhotoPx)` with a new `maxPhotoPx` param defaulting to 480; the card pipeline passes 300 so the portrait fits the standard 2x2 box in both the preview and the approved card after DEC-020's natural-aspect cap.

2. **`{{valid_until}}` never filled even on approved cards.** `expiration_date` resolved only from `c.request.expires_at` or `c.application.expiration_date`, but the barangay ID row stores the expiry in `id_expiration_date` (mapped to `id_expiration`). The template's `Valid Until` tag (`{{valid_until}}`, an alias of `expiration_date`) therefore resolved blank on every approved card. `buildContext` now also maps `expiration_date: application.id_expiration_date`, so approved/printed cards show the assigned expiry.

3. **Kiosk shows only the first validation error.** `previewBarangayId`/`submitBarangay` replaced the generic `message` with `errors[0].msg` when the server returns field-level validation failures, so the resident sees the actual offending field on screen instead of a generic failure.

**Reason:**
The business requirement is that the kiosk preview shows the actual generated ID (photo + submitted info) using exactly the same template and mapping as the approved/printed card. A preview that omits the photo or a printed card with a blank expiry undermines trust in the ID products; surfacing one actionable validation error at a time fits the 1080p landscape kiosk flow.

**Alternatives Considered:**
1. Auto-inject `{{resident_photo}}` into the template at render time if missing - rejected; injecting a drawing into an arbitrary DOCX box is not robust, and the tag must be authored into the official template anyway for both preview and printed cards.
2. Surface all validation errors at once on the kiosk - rejected; keeps the single, scannable per-attempt error consistent with the rest of the flow.

**Consequences:**
- `id-card.service.js`: `embedPhoto` gains `maxPhotoPx`; `renderCardBuffer` passes 300; `buildContext` maps `expiration_date` for the barangay ID context.
- The barangay's active ID template (under gitignored `uploads/`) now places `{{resident_photo}}` in the photo box; **a fresh clone must re-apply this tag to whichever template is uploaded** so previews and cards include the photo.
- Kiosk preview/toast error text surfaces the first field error (`errors[0].msg`) on both preview and submit.
- Verified live: preview render succeeds with photo media embedded, name/id present, `{{valid_until}}` now renders the assigned expiry on an approved-context card (`Valid Until: <date>`), and preview leaves the application `PENDING` with `resident_id` null (no approve/register). Backend tests 54/54, ESLint no new issues.

---

### DEC-024 - Fix Barangay ID photo embedding (broken image relationship + nested paragraph)

**Status:** Accepted
**Date:** 2026-08-10
**Decision Maker(s):** Project Owner

**Decision:**
The kiosk "Preview My ID Card" rendered the resident's information and the card design but the captured photo never appeared in the template's 2×2 photo box. Root cause was two OOXML defects in `embedPhoto` (`backend/src/services/id-card.service.js`) that have existed since DEC-020, both of which make the photo impossible to render:

1. **Broken image relationship.** The `Relationship` Target was written as `media/` + (`word/media/...` minus `word/`) = **`media/media/image1.png`**, while the media part actually lives at `word/media/image1.png`. Every renderer (docx-preview on the kiosk, Word, LibreOffice) resolves that target relative to `word/`, hits a non-existent part, and renders an empty photo area — even though the media part, content-type entry, and drawing were all inserted.

2. **Malformed nested paragraph.** `buildDrawingXml` with `centered: true` wrapped the drawing in its own `<w:p>`, and `embedPhoto` replaced the token's `<w:r>` with that whole paragraph — producing a `<w:p>` nested inside the photo-cell's `<w:p>` (invalid OOXML), which further broke rendering in stricter viewers.

Prior E2E passes (DEC-020/021) only asserted that a media part existed in the generated zip — `embedPhoto` adds the media before attempting the replacement, so those checks passed while the relationship was broken and no image was ever displayable.

**Fix (both in `embedPhoto`):**
- Relationship Target is now `media/<filename>` (single `media/` segment), resolving to the actual `word/media/image1.png` part.
- The token `<w:t>` is swapped for a bare inline `<w:drawing>` **inside the same run**, preserving the run's properties and any adjacent `<w:br/>` line breaks. `buildDrawingXml` now returns only the `<w:drawing>` fragment; the drawing sits in a single `<w:r>` with no nested paragraph. The template's photo cell is already a centered paragraph, so the photo lands centered in the 2×2 box at its natural aspect, capped at 300px on the long side.

**Reason:**
Photos were being "embedded" into unreachable parts, so every Barangay ID card and every preview silently lacked the resident's photo while the code reported success. A correct relationship target and valid run structure are prerequisites for any renderer to display the image, and both were trivial to repair in the same post-render helper.

**Alternatives Considered:**
1. Reintroduce `docxtemplater-image-module` — rejected; DEC-020 removed it because it crashes with current docxtemplater and the maintained version is paid.
2. Replace the entire photo-cell paragraph with a new centered one — rejected; the template's paragraph holds the "PHOTO / 2 × 2" caption text that must stay, and splicing into the run preserves layout.
3. Store the photo as a separate base64 data URI in the DOCX — rejected; not valid OOXML, not editable in Word.

**Consequences:**
- `embedPhoto(doc, imageBuffer, maxPhotoPx)` signature (dropped unused `centered` param); `buildDrawingXml` returns the `<w:drawing>` fragment.
- New test sub-suite `ID card photo embedding (valid relay + inline drawing)` asserts: media part exists, relationship target is `media/image1.png` and never `media/media/`, the drawing run is a single `<w:r>` with no nested `<w:p>`, and the referenced `rId` maps to the image target.
- Verified: backend tests 55/55, ESLint no new issues; live `POST /kiosk/barangay-id/preview` returns 200 DOCX with drawing present, token consumed, `word/media/image1.png` present, `Target="media/image1.png"`, resident info rendered, and `PENDING` application count unchanged (4 → 4 → no persist/approve). The camera capture already produces `canvas.toDataURL('image/jpeg', 0.8)` and preview sends it as a data URL string — no frontend change was required.
- **Deployment note:** the LAN kiosk backend (`192.168.100.102`) must run this updated `id-card.service.js` for the fix to apply there; the dev backend on this machine was restarted from scratch because a stale pre-fix server process was still occupying port 3000 and serving the old logic.

---

### DEC-025 — Kiosk document request preview becomes a modal (admin-panel-style)

**Status:** Accepted
**Date:** 2026-08-11
**Decision Maker(s):** Project Owner

**Decision:**
The pre-submission document preview on the kiosk Review step is no longer an inline `docx-preview` pane inside the step. It is now a dedicated modal (`document-preview-modal.component.ts`) that mirrors the admin panel's document preview UX: a translucent full-screen overlay with a zoom toolbar (zoom out / in, percentage readout, Fit Width), a scrollable white document area that renders the generated DOCX via `renderAsync`, and an action footer with **Edit Information** and **Submit Request** buttons.

**Reason:**
The resident should see the generated request document the same way barangay staff do in the admin panel, in a focused, full-size view with size controls, instead of a cramped inline pane. The application form remains the single source of truth: "Edit Information" closes the preview and returns to the form step, and every preview is regenerated from the current form values. Keeping the blob in memory lets the resident reopen the same preview without re-fetching until they edit.

**Alternatives Considered:**
1. Keep the inline preview pane — rejected; small embedded view, no zoom controls, and inconsistent with the admin panel experience.
2. Let residents edit the DOCX directly inside the preview — rejected; editing the generated file is not practical and the form already captures the same fields.

**Consequences:**
- New standalone `document-preview-modal.component.ts` in the kiosk feature, mounted beside the Barangay ID preview modal; new i18n keys (`doc.review.previewScroll`, `doc.review.previewFitWidth`, `common.close`, `common.zoomIn`, `common.zoomOut`) in both `en.ts` and `fil.ts`.
- The inline `#docPreviewContainer`, `renderDocPreview()`, and the `docx-preview` import were removed from `kiosk.component.ts`; `openDocPreview()`/`closeDocPreview()` manage the modal, and `submitRequest()` closes it on submit so errors surface on the Review step beneath.
- Verified: `tsc --noEmit` and `ng build kiosk-app` both pass (pre-existing budget/`jszip` ESM warnings only).

---

### DEC-026 — Every document preview auto-fits exactly like the kiosk "Review Your Request" modal

**Status:** Accepted
**Date:** 2026-08-12
**Decision Maker(s):** Project Owner

**Decision:**
All document preview screens behave like the working kiosk pre-submission modal: the document loads automatically, auto-scales to fit the preview width the moment it opens (no manual Fit Width / double-click needed), stays centered, renders every page, and keeps the zoom controls. The fix reuses the exact working pattern rather than building a new implementation:

1. **Root cause:** `docx-preview` injects pages asynchronously and may not have laid out yet in the very tick after `renderAsync` resolves. A single immediate width measure can read 0, so the fit never applies and the preview stays at 100%, forcing the user to click Fit Width (exactly what the admin Document Requests, Generated Document Preview, and Barangay ID previews required).
2. **Fixes:**
   - `barangay-preview-modal.component.ts` (kiosk) was rewritten to mirror `document-preview-modal.component.ts`: zoom (`[style.zoom]`) now scales a centered wrapper `<div #previewBox class="w-fit min-w-full mx-auto flex flex-col items-center">`, `applyInitialZoom()` derives the auto-fit from the real `.docx` page `offsetWidth` vs the area (`clientWidth - 32`), and a Fit Width / reset-zoom button was added (previously only zoom ± and close existed, and zoom was bound to the container element itself).
   - `document-preview-modal.component.ts` (admin) and the kiosk document modal gain `scheduleSettleFit()` — a `requestAnimationFrame` re-measure (guarded by `userAdjusted` so it never overrides a manual zoom) that re-applies the fit-width once the browser has finished layout. The PDF/iframe and image branches keep the existing behavior (native width, zoom 1).

**Reason:**
The kiosk modal was the reference-good behavior; the admin modal was structurally identical but measured too early, and the kiosk Barangay ID modal was a code outlier (zoom on the container, no fit-width control at all). Fitting at layout-settle time removes the artificial "double-click / click Fit Width before the document is visible" step from every screen while keeping a single consistent implementation pattern across the whole system.

**Alternatives Considered:**
1. Build a brand-new shared cross-app preview component — rejected; kiosk-app and admin-panel are separate Angular applications with no shared library, and the existing modals are already nearly identical, so a shared component adds indirection without solving the timing bug.
2. Force a fixed percentage zoom (e.g. always 0.6) on every document — rejected; arbitrary and breaks documents of unusual widths.
3. Poll/loop until `offsetWidth > 0` — rejected; a single `requestAnimationFrame` settle is sufficient and simpler, and repeated re-measures risk fighting the user's zoom.

**Consequences:**
- Kiosk Barangay ID preview now opens already fitted and centered, with Zoom In/Out, Fit Width, and close controls (blue accent retained; new `bar.preview.zoom` i18n key in `en.ts`/`fil.ts`).
- Admin Document Requests / Generated Document Preview and kiosk Review previews auto-fit on open through the settle re-measure; user zooms are never overridden.
- Verified: `npx ng build kiosk-app` and `npx ng build admin-panel` both pass from repo root (pre-existing initial-budget and `jszip`/ESM warnings only).
