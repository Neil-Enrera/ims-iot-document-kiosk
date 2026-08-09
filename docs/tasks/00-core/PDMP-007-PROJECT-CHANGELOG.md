# PDMP-007-PROJECT-CHANGELOG

Placeholder document.
Replace this content with the finalized PDMP content from our conversation.
# PDMP-007 — Project Changelog

> **Project:** Information Management System with IoT-Assisted Document Request Services Kiosk for Barangay San Manuel

**Document ID:** PDMP-007  
**Version:** 2.0.0  
**Status:** Active Development

---

# Purpose

The Project Changelog is the official record of significant changes made throughout the development lifecycle.

Unlike Git commit history, this document records **engineering decisions**, **feature milestones**, **architectural changes**, and **project evolution** in a format that is easy for developers, reviewers, advisers, and AI coding assistants to understand.

Every completed feature or major change should be reflected here.

---

# Changelog Guidelines

Record changes when they:

- Introduce a new feature.
- Modify existing functionality.
- Change business rules.
- Update the database schema.
- Affect the system architecture.
- Integrate hardware.
- Improve performance.
- Resolve significant bugs.
- Change development standards.

Minor formatting or typo fixes generally do not require an entry.

---

# Change Categories

Use one of the following categories:

| Category | Description |
|----------|-------------|
| Added | New functionality |
| Changed | Existing behavior modified |
| Fixed | Bug fixes |
| Removed | Deprecated or deleted functionality |
| Refactored | Internal improvements without behavior changes |
| Security | Security-related improvements |
| Performance | Performance optimizations |
| Documentation | Documentation updates |
| Hardware | Hardware integration changes |

---

# Version History

---

# Version 2.5.0

**Status:** Active Development

**Date:** 2026-08-09

## Changed

- **Kiosk screen redesign (phase 2 — document flow)** — replaced the dark blue kiosk theme with a light theme (`#F8FAFC` background, slate text, orange `#F97316` accent) and staggered layout pieces across the document request flow:
  - **Landing / welcome** — light background with orange curved accent, subtle Barangay Hall line art, redesigned CTA cards, and a three-column footer (Need Assistance / Office Hours / Current Time).
  - **Guest Info form** — full-width card layout with icon-prefixed inputs (gold circle / calendar / pin / phone / mail), inline check marks, per-field inline error messages (instead of a single banner), and `guest submitted`-driven validation (`guestInvalid()`), plus a 4-step progress indicator (Your Info → Select Document → Review → Submit) shared across the flow.
  - **Guest Info visual alignment with the landing page** — the form now reuses the landing page's `Background.png` (`bg-cover bg-center`) + radial glow overlay and the orange curved accent; the header back control is a small circular icon button with the "Back" label outside beside it; the old top-right language toggle was removed and the landing page's footer language selector (globe icon + English/Filipino pills) was adopted; content was down-scaled (74px column, smaller headings/labels/inputs/buttons, tighter spacing) with landscape-safe responsive sizing.
  - **RFID pulse** — rings now expand from the container's center (`transform-origin: center`) so they stay centered at any size, with reduced-motion opacity softened.
- **i18n key refinements** — guest labels no longer hard-code the `*` required marker (rendered separately in the template), added `birthDatePh` placeholders, and split the footer into labeled sub-keys (`landing.footer.assistance/hours/time/date/language/...`) plus a `progress.*` group.

**Modules Affected:** Kiosk (Frontend)

**Database Changes:** No (i18n strings and templates only)

**Testing:** `ng build kiosk-app` passes (bundle budget warning unchanged/pre-existing). All i18n keys referenced by the new template confirmed present in `en.ts`/`fil.ts`.

---

# Version 2.4.0

**Status:** Active Development

**Date:** 2026-08-06

## Removed

- **Service form simplification** — removed four fields from the Create/Edit Service form (they were unnecessary or redundant with the actual barangay workflow):
  - **Processing Time** (`services.processing_time`)
  - **Approval Workflow** (`services.approval_workflow`)
  - **Show in Kiosk** (`services.show_in_kiosk`) — every active service now appears on the kiosk; the kiosk query no longer filters on it.
  - **Required Documents** (`services.required_documents`) — redundant with the **What to Bring** list (`services.requirements`), which remains the single source of requirements shown to residents.

**Modules Affected:** Backend, Database, Admin Panel, Kiosk

**Database Changes:** Yes — migration 016 drops `processing_time`, `approval_workflow`, `required_documents`, and `show_in_kiosk` from `services`.

**API Changes:** Yes — removed `PATCH /services/:id/kiosk-visibility` and its service/controller/repository/validation chain; `POST /services` and `PUT /services/:id` no longer accept `processingTime`, `approvalWorkflow`, `showInKiosk`, or `requiredDocuments`. `GET /services` `sortBy` no longer accepts `show_in_kiosk`. Kiosk service list + request `service_snapshot` no longer include the removed fields.

**Architecture Changes:** No

**Breaking Changes:** Yes (minor) — existing data in the four dropped columns is gone (migration 016 is destructive). Existing requests keep their historical `service_snapshot` JSON untouched.

**Testing Performed:** Backend tests (45/45), ESLint clean on changed files, both `tsc --noEmit` builds clean, admin tests (14/14), live E2E: create/edit service without removed fields, kiosk service list, and full document request → generation flow.

---

# Version 2.3.0

**Status:** Active Development

**Date:** 2026-08-05

## Added

- **Document Preview & Approval Workflow** in the Admin Panel for generated documents:
  - New `DocumentPreviewModalComponent` (Angular + `docx-preview`) renders completed DOCX documents inline in a modal, preserving formatting, tables, images, and styles — replacing the previous "open in new tab" approach that failed for DOCX.
  - **Template Preview** in Service Form: Admin can preview the uploaded DOCX template and view a detected placeholders list (chips) after clicking "Scan Template". Auto-detected placeholders are pre-populated into the mapping table.
  - **Generated Document Preview** in Request Details: Admin clicks "Preview" to review the completed document before approval.
  - **Per-document approval status** (`pending` → `approved` | `rejected` | `returned`) with reviewer, timestamp, and remarks stored on `generated_documents` (migration 013).
  - **Approve / Reject / Return** action buttons on each pending document in the Request Details modal.
  - **Download / Print gating**: Only documents with `approval_status = approved` can be downloaded or printed. Pending/returned documents show preview only.
  - **Generation warnings** surfaced in the UI: missing placeholders, unmapped tags, orphaned application field references — computed during auto-generation and persisted.

- **Release gating**: Request cannot transition to **Released** (status 7) until at least one generated document is `approved`. Prevents releasing documents before admin review.

**Modules Affected:** Backend, Database, Admin Panel

**Database Changes:** Yes — migration 013 adds `approval_status`, `generation_warnings`, `reviewed_by`, `reviewed_at`, `review_remarks` to `generated_documents` (FK to `users`).

**API Changes:** 
- `GET /requests/:id/documents/:documentId/preview` — serves DOCX inline for preview modal (unrestricted for review)
- `GET /requests/:id/documents/:documentId/download` — gated to `approved` documents only
- `POST /requests/:id/documents/:documentId/review/:status` — approve/reject/return with optional `remarks`

**Architecture Changes:** No

**Breaking Changes:** No — existing documents default to `pending`; download now requires approval (was previously unrestricted).

**Testing Performed:** Backend tests (32/32), ESLint clean on changed files, manual E2E: create request → advance to Document Processing (auto-generates) → preview generated DOCX → approve → download → release (succeeds); attempt release without approved doc (blocked); reject/return workflow verified; template preview + placeholder detection verified.

---

# Version 2.2.1

**Status:** Active Development

**Date:** 2026-08-05

## Fixed

- Automatic document generation produced documents with **empty application-form values** (resident name, address, purpose, etc. all blank) while system fields (request number, date, barangay, processed by) rendered correctly.
  - **Root cause:** `document.service.js` fetched the request via a raw `pool.query`, so `request.form_data` came back as a MySQL JSON **string**; the lookup code treated it as an object (`lookup.application = request.form_data || {}`), so every `application`-sourced mapping resolved to `''`. The guest fallback (`request.form_data?._guest`) was broken for the same reason.
  - **Fix:** One line in `generateDocument` — `request.form_data = parseJson(request.form_data) || {}` — so both the application lookup and the `_guest` fallback operate on a parsed object.

**Modules Affected:** Backend

**Database Changes:** No

**API Changes:** No

**Architecture Changes:** No

**Breaking Changes:** No

**Testing Performed:** Backend tests (32/32), ESLint clean on the changed file, live API E2E across the full workflow (create service → upload DOCX template → kiosk form visible → submit request → advance to Document Processing → auto-generate → download generated DOCX). 29/29 E2E checks pass: all placeholders substituted (full name, multiline address with preserved line breaks, date, civil status, special-char escaping, purpose, request number, processed by), no leftover `{{tags}}`, template formatting preserved, admin notification created with correct message.

---

# Version 2.0.0

**Status:** Initial PDMP Release

**Date:** YYYY-MM-DD

## Added

- Established Project Development Management Process.
- Created project documentation framework.
- Defined project roadmap.
- Defined architecture blueprint.
- Created dependency map.
- Established development standards.
- Created task specification template.

**Related Documents**

- PDMP-000
- PDMP-001
- PDMP-002
- PDMP-003
- PDMP-004
- PDMP-005
- PDMP-006

---

# Version 2.1.0

**Status:** Active Development

**Date:** 2026-08-03

## Added

- Template-driven dynamic application forms for document request services.
- Official document template upload per service (PDF/DOCX/image), stored under `uploads/templates/`, referenced via `services.template_*` columns (migration 007).
- Manual field configuration (no OCR/AI): text, textarea, number, date, tel, email, select (dropdown), checkbox, radio, signature, photo capture, file upload.
- Per-field options: required/optional, display order (up/down), helper text, default value, and validation rules (min/max, minLength/maxLength, pattern, file accept/max size).
- New admin endpoints: `POST /services/:id/template`, `DELETE /services/:id/template`.
- Kiosk renders all field types inline (checkbox/radio groups, signature pad, inline webcam capture, file upload) and shows a label → value summary in the Review step.
- `validateForm()` enforces required + configured validation rules for all field types.

**Modules Affected:** Backend, Database, Admin Panel, Kiosk

**Database Changes:** Yes — migration 007 adds `template_path`, `template_original_name`, `template_mime`, `template_size` to `services`.

**API Changes:** Yes — `POST /services/:id/template`, `DELETE /services/:id/template`; `form_fields` schema extended with new field types and optional keys.

**Architecture Changes:** No

**Breaking Changes:** No — `form_fields` JSON is backward compatible (new optional keys).

**Testing Performed:** Unit tests (29/29), build verification (kiosk + admin), e2e script covering template upload/remove, all 12 field types, and form_data round-trip.

---

# Version 2.1.1

**Status:** Active Development

**Date:** 2026-08-03

## Fixed

- File Management page uploads failing with `500 Internal server error` on every attempt.
  - **Root cause:** `file.repository.js` inserted standalone files into `request_attachments` with a sentinel `request_id = 0`, but `request_attachments.request_id` is a `NOT NULL` foreign key to `requests` — the insert always violated the FK.
  - **Fix:** New dedicated `files` table (migration 008) for the standalone document repository; `file.repository`, `file.service`, and `file.controller` rewritten against it.
  - The File page now persists `category` and `description`, returns the fields the admin UI expects (`file_id`, `original_name`, `mime_type`, `file_size`, `category`, `created_at`), and supports `.xlsx`, `.xls`, and `.csv` uploads (previously rejected by the multer filter).
  - `upload.middleware.js` storage destination now auto-creates its folder (same pattern as template uploads).

**Modules Affected:** Backend, Database

**Database Changes:** Yes — migration 008 creates the `files` table (`original_name`, `mime_type`, `file_size`, `file_path`, `category`, `description`, `uploaded_by`, `created_at`).

**API Changes:** No new endpoints; `POST /files/upload` now accepts `category`/`description` multipart fields.

**Architecture Changes:** No

**Breaking Changes:** No — `request_attachments` remains the table for request-bound attachments (kiosk photos); standalone files use the new `files` table.

**Testing Performed:** Unit tests (29/29), backend lint clean on changed files, curl e2e covering upload → list → download → delete with field round-trip, orphaned-file cleanup.

---

# Version 2.2.0

**Status:** Active Development

**Date:** 2026-08-03

## Added

- **Edit Service** action in the Services module: an Edit button per table row opens the existing modal with the current service fully populated (name, description, requirements, dynamic form fields, processing time, fee, template, toggles). Row click also opens edit.
- **Status (Active/Inactive)** toggle in the service form; `is_active` is now saved through the create/update API (previously only settable via the separate status endpoint).
- **Delete Service** action per table row (previously implemented but unreachable).
- Shared `app-table` now supports a per-row actions template via `rowActionsTemplate`.

**Modules Affected:** Admin Panel, Backend

**Database Changes:** No

**API Changes:** `POST /services` and `PUT /services/:id` now accept an optional `isActive` boolean.

**Architecture Changes:** No

**Breaking Changes:** No

**Testing Performed:** Unit tests (29/29), admin build, live create → update → delete round-trip verifying name/fee/photo/status/requirements persist, validation returns 400 on empty name or non-boolean `isActive`.

---

# Change Entry Template

## Version

Example:

```text
Version 2.1.0
```

---

### Date

```text
YYYY-MM-DD
```

---

### Category

- Added
- Changed
- Fixed
- Removed
- Refactored
- Security
- Performance
- Documentation
- Hardware

---

### Summary

Provide a concise description of the change.

Example:

> Added RFID registration workflow for resident identification.

---

### Reason

Explain why the change was necessary.

Example:

> Residents must be uniquely identified before requesting documents through the kiosk.

---

### Related Tasks

- TASK-BACKEND-004
- TASK-KIOSK-002

---

### Modules Affected

- Backend
- Database
- Kiosk

---

### Files Affected

```text
backend/

frontend/

database/

hardware/
```

---

### Database Changes

Yes / No

If yes:

- New tables
- Updated schema
- New migrations

---

### API Changes

Yes / No

If yes:

List modified endpoints.

---

### Architecture Changes

Yes / No

If yes:

Reference updated diagrams or architecture documents.

---

### Breaking Changes

Yes / No

If yes:

Describe the impact and required migration steps.

---

### Testing Performed

- Unit Tests
- Integration Tests
- E2E Tests
- Build Verification
- Manual Validation

---

### Verification Status

- [ ] Reviewed
- [ ] Tested
- [ ] Documentation Updated
- [ ] Ready for Merge

---

### Notes

Additional implementation notes or future considerations.

---

# Decision Log

Some changes involve important engineering decisions that should be preserved.

Use this section to record:

- Technology stack decisions
- Architecture changes
- Hardware changes
- Database redesign
- Security improvements
- Performance optimizations

---

## ADR-001

**Decision**

Use Angular + Node.js + Express + MySQL as the primary technology stack.

**Reason**

Supports modular architecture, REST APIs, and future scalability while matching the team's technical expertise.

---

## ADR-002

**Decision**

Use RFID cards for resident identification instead of usernames or passwords at the kiosk.

**Reason**

Improves usability and reduces authentication friction for residents.

---

# Release Milestones

| Version | Milestone | Status |
|----------|-----------|--------|
| 2.0.0 | PDMP Foundation | ✅ |
| 2.1.0 | Database Complete | ⬜ |
| 2.2.0 | Backend Complete | ⬜ |
| 2.3.0 | Frontend Complete | ⬜ |
| 2.4.0 | Kiosk Complete | ⬜ |
| 2.5.0 | Hardware Integration | ⬜ |
| 2.6.0 | Testing Complete | ⬜ |
| 2.7.0 | Deployment Ready | ⬜ |
| 3.0.0 | Capstone Final Release | ⬜ |

---

# AI Context

Before implementing a feature, OpenCode should review recent changelog entries to:

- Understand recent engineering decisions.
- Avoid reintroducing resolved issues.
- Preserve architectural consistency.
- Identify modules that were recently modified.

When a task is completed, the changelog should be updated before the task is considered fully complete.

---

# Related Documents

- PDMP-000 — Project Development Management Process
- PDMP-002 — Project Roadmap
- PDMP-003 — Project Architecture
- PDMP-006 — Task Specification Template
- PDMP-008 — Product Backlog

---

# Guiding Principle

> Every meaningful change should be traceable from implementation back to its purpose, ensuring that the project's evolution is transparent, understandable, and maintainable.