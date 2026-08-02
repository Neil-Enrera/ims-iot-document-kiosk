# PDMP-006-TASK-SPECIFICATION-TEMPLATE

Placeholder document.
Replace this content with the finalized PDMP content from our conversation.
# PDMP-006 — Task Specification Template

> **Project:** Information Management System with IoT-Assisted Document Request Services Kiosk for Barangay San Manuel

**Document ID:** PDMP-006  
**Version:** 2.0.0  
**Status:** Active Development

---

# Purpose

This document defines the standard format for all development tasks.

Every implementation task, bug fix, enhancement, refactor, research activity, or documentation update should follow this specification.

The objective is to ensure that every task is:

- Clearly defined
- Properly scoped
- Independently testable
- Easy to review
- Easy for AI assistants to understand
- Fully traceable throughout the project lifecycle

---

# Task Metadata

| Field | Value |
|--------|-------|
| Task ID | |
| Title | |
| Phase | |
| Module | |
| Priority | Critical / High / Medium / Low |
| Status | Backlog / Ready / In Progress / Review / Testing / Done / Blocked |
| Assignee | |
| Reviewer | |
| Estimated Effort | |
| Actual Effort | |
| Created Date | |
| Last Updated | |

---

# Objective

Describe what this task aims to accomplish.

Focus on the outcome rather than the implementation.

---

# Background

Provide context for the task.

Explain:

- Why this task exists.
- Which requirement it satisfies.
- Related business process.
- Previous work (if applicable).

---

# Scope

## Included

-

-

-

## Not Included

-

-

-

Clearly define the boundaries of the task.

---

# Business Rules

Document all business logic relevant to this task.

Example:

- Only registered residents may request documents.
- Duplicate RFID cards are not allowed.
- Requests require staff approval before processing.

---

# Prerequisites

List anything that must exist before this task can begin.

Examples:

- Database tables
- API endpoints
- Completed tasks
- Hardware setup
- Environment configuration

---

# Dependencies

| Dependency | Status |
|------------|--------|
| PDMP Document | |
| Previous Task | |
| Module | |
| Database | |
| Hardware | |

---

# Architecture References

Related documents:

- PDMP-003 — Project Architecture
- PDMP-004 — Project Dependency Map

Relevant diagrams:

- Sequence Diagram
- Flowchart
- ERD
- Module Diagram

---

# UI / UX Reference

If applicable, describe:

- Screen layout
- User flow
- Responsive behavior
- Validation messages
- Accessibility requirements

Attach wireframes or mockups if available.

---

# Database Impact

Tables affected:

-

-

-

Operations:

- Create
- Read
- Update
- Delete

Schema changes:

Yes / No

Migration required:

Yes / No

---

# API Specification

Endpoints:

| Method | Endpoint | Purpose |
|----------|----------|---------|
| GET | | |
| POST | | |
| PUT | | |
| PATCH | | |
| DELETE | | |

Request validation:

-

-

Response format:

```json
{
    "success": true,
    "message": "",
    "data": {}
}
```

---

# Files to Create

```text
backend/

frontend/

database/

tests/
```

---

# Files to Modify

```text
backend/

frontend/

database/

tests/
```

---

# Implementation Plan

- [ ] Review requirements
- [ ] Review architecture
- [ ] Review dependencies
- [ ] Implement feature
- [ ] Add validation
- [ ] Update documentation
- [ ] Write tests
- [ ] Verify build

Add additional implementation steps specific to the task.

---

# Testing Plan

## Unit Tests

- [ ]

- [ ]

---

## Integration Tests

- [ ]

- [ ]

---

## End-to-End Tests

- [ ]

- [ ]

---

## Build Verification

- [ ] Project builds successfully

---

## Manual Validation

- [ ]

- [ ]

---

# Acceptance Criteria

The task is considered successful when:

- [ ]

- [ ]

- [ ]

Acceptance criteria should be measurable and verifiable.

---

# Definition of Done

The task is complete only when:

- Requirements satisfied
- Scope respected
- Code implemented
- Tests pass
- Build succeeds
- Documentation updated
- Architecture remains consistent
- Reviewer approval received

---

# Risks

Potential risks:

-

-

-

Mitigation:

-

-

-

---

# Future Improvements

Document ideas that are intentionally postponed.

-

-

-

---

# Notes for OpenCode

Before implementation:

1. Read PDMP-003 (Project Architecture).
2. Review PDMP-004 (Dependency Map).
3. Follow PDMP-005 (Development Guide).
4. Do not modify unrelated modules.
5. Follow the approved scope.
6. Preserve existing architecture.
7. Update documentation if behavior changes.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| | | |

---

# Review Checklist

- [ ] Objective achieved
- [ ] Scope followed
- [ ] Business rules implemented
- [ ] Validation completed
- [ ] Tests passed
- [ ] Documentation updated
- [ ] Reviewer approved

---

# Related Documents

- PDMP-000 — Project Development Management Process
- PDMP-003 — Project Architecture
- PDMP-004 — Project Dependency Map
- PDMP-005 — Project Development Guide
- CHANGELOG.md

---

# Guiding Principle

> A task is complete only when its implementation, testing, documentation, and review are all complete.