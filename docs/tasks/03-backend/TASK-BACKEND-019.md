# TASK-BACKEND-019 — Automatic Document Generation

> **Phase:** Backend (with database + admin panel support)
> **Task ID:** TASK-BACKEND-019
> **Priority:** P1 (High)
> **Status:** Complete

---

# Objective

Eliminate manual retyping by barangay staff. When a resident completes the dynamic application form and the request is approved, the system automatically populates the official barangay DOCX document template with the submitted information, replacing `{{placeholder}}` tags with real values. The uploaded template is never modified — each approved request generates a brand-new document stored separately.

---

# Design Principles

- **Template-driven** — adding a new service requires no source code changes. The administrator only:
  1. Creates the service
  2. Uploads the official DOCX template (with `{{placeholders}}` instead of blank spaces)
  3. Configures placeholder mappings
  4. Saves
- **No hardcoded document fields** — everything is stored dynamically in the database.
- **Original template untouched** — generated documents are separate rows/files.
- **Staff never retype** resident information into the official document.

---

# Database (migration 010)

- `services.document_mappings` (JSON) — array of `{ placeholder, source, field }` entries:
  - `source: 'resident'` → resident record columns
  - `source: 'application'` → submitted `form_data` keys
  - `source: 'system'` → system-generated values
- New `generated_documents` table — one row per generated file, FK to `requests` (CASCADE), `services` (RESTRICT), and `users` (generated_by, SET NULL).

---

# Backend

## New files

- `repositories/document.repository.js` — CRUD for `generated_documents`.
- `services/document.service.js` — core generation engine:
  - Resolves each mapping into a value from resident info, `form_data`, or system values.
  - Uses `docxtemplater` + `pizzip` to render the DOCX template with `{{ }}` delimiters.
  - Writes the generated DOCX to `uploads/generated-documents/` (separate from templates).
  - Optionally converts to PDF via LibreOffice if a `soffice` binary is available (`LIBREOFFICE_PATH` env or well-known paths).
  - `scanTemplatePlaceholders()` — extracts `{{placeholder}}` tags from an uploaded DOCX to help the admin configure mappings.
- `controllers/document.controller.js`
- `routes/document.routes.js` — mounted under `/requests/:id/documents`

## Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/requests/:id/documents` | List generated documents for a request |
| POST | `/requests/:id/documents/generate` | Generate the official document now |
| GET | `/requests/:id/documents/:documentId` | Get document metadata |
| GET | `/requests/:id/documents/:documentId/download` | Download the generated file |
| DELETE | `/requests/:id/documents/:documentId` | Delete a generated document (Administrator) |
| GET | `/services/:id/template/placeholders` | Scan the uploaded DOCX for placeholders |

## Auto-generation hook

- `request.service.js changeStatus` — when a request transitions to **Document Processing** (status 5), the document is automatically generated. A generation failure never blocks the status change (logged and skipped).

## Placeholder sources

| Source | Example fields |
|--------|----------------|
| Resident | `full_name`, `first_name`, `birth_date`, `gender`, `civil_status`, `address_line`, `contact_number`, `email`, `resident_code`, `blood_type`, emergency contact fields |
| Application | Any `form_data` key submitted on the dynamic form (e.g. `purpose`, `office_address`, `business_name`, `pole_type`, `street`, `remarks`) |
| System | `request_number`, `current_date`/`issued_date`, `barangay_name`, `city_name`, `processed_by` |

Guests (no resident record) fall back to `form_data._guest` for resident fields.

---

# Admin Panel

- Service form gained a **Document Placeholder Mappings** section:
  - **Scan Template** button auto-detects `{{placeholders}}` from the uploaded DOCX.
  - Add/remove mappings; each maps a placeholder to a source (Resident Information / Application Form / System Generated) and a field.
  - Mappings are saved with the service (`documentMappings`).
- Request details modal gained a **Generated Documents** section:
  - Lists generated documents (name, date, size).
  - **Generate Document** button (requires status ≥ Under Review).
  - **Preview**, **Download**, and **Print** actions.

---

# Acceptance Criteria

- [x] Admin can upload a DOCX template with `{{placeholders}}` and configure mappings per service.
- [x] Placeholder scan returns the template's placeholders.
- [x] After a request reaches Document Processing, the document auto-generates.
- [x] Staff can manually generate / regenerate a document for approved requests.
- [x] Generated document is stored separately from the template; template never modified.
- [x] Placeholder values resolve from resident, application, and system sources.
- [x] Preview / download / print available from the request details modal.
- [x] Backend lint clean and existing tests pass.

---

# Deliverables

- `database/migrations/010-add-document-generation.sql`
- Backend: document repository/service/controller/routes + request auto-gen hook + service validation/repository `documentMappings`
- `docxtemplater` + `pizzip` dependencies
- Admin Panel: service form placeholder mapping UI + request details documents section

---

# Estimated Effort

6–10 hours
