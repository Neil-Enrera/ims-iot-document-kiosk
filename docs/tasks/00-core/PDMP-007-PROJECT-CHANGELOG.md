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