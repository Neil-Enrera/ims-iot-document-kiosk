# PDMP-005-PROJECT-DEVELOPMENT-GUIDE

Placeholder document.
Replace this content with the finalized PDMP content from our conversation.
# PDMP-005 — Project Development Guide

> **Project:** Information Management System with IoT-Assisted Document Request Services Kiosk for Barangay San Manuel

**Document ID:** PDMP-005  
**Version:** 2.0.0  
**Status:** Active Development  
**Depends On:** PDMP-000, PDMP-001, PDMP-002, PDMP-003, PDMP-004

---

# Purpose

This document defines the engineering standards, coding conventions, development workflow, and quality requirements for the project.

Its objective is to ensure that every contributor—human or AI—follows a consistent approach when designing, implementing, testing, reviewing, and documenting software.

This document is the primary engineering reference during implementation.

---

# Development Principles

Development follows the principles defined in **PDMP-000**.

Every implementation should prioritize:

- Clarity over cleverness
- Simplicity over unnecessary complexity
- Consistency over personal preference
- Maintainability over shortcuts
- Verification before completion

---

# Repository Structure

```text
project/

├── backend/
├── frontend/
├── database/
├── hardware/
├── tests/
├── docs/
└── tasks/
```

Each directory has a single responsibility.

---

# Development Workflow

Every task follows the same lifecycle.

```text
Requirement
      │
Clarification
      │
Architecture
      │
Task
      │
Implementation
      │
Testing
      │
Review
      │
Documentation
      │
Merge
```

No implementation should bypass this workflow.

---

# Git Workflow

## Branch Naming

```text
feature/resident-management

feature/document-request

feature/rfid-registration

bugfix/login-validation

hotfix/api-authentication
```

---

## Commit Message Convention

```text
feat: add resident registration

fix: validate RFID duplicate

refactor: simplify request service

docs: update architecture

test: add resident API tests
```

Use small, focused commits whenever possible.

---

# Coding Standards

General rules:

- Write readable code.
- Prefer explicit naming.
- Avoid unnecessary abstractions.
- Keep functions focused.
- Eliminate duplicated logic.
- Use consistent formatting.

Code should explain itself whenever possible.

---

# Naming Conventions

## Variables

```text
camelCase
```

Example:

```ts
residentRequest
```

---

## Functions

Use verbs.

Examples:

```text
createResident()

updateRequest()

validateRFID()

generateCertificate()
```

---

## Classes

Use PascalCase.

Example:

```text
ResidentService

AuthenticationController

DocumentRequestRepository
```

---

## Files

Use kebab-case.

```text
resident.service.ts

request.controller.ts

audit-log.repository.ts
```

---

# Folder Organization

Backend

```text
config/

controllers/

middleware/

models/

repositories/

routes/

services/

validators/

utils/
```

Frontend

```text
core/

shared/

features/

layouts/

pages/

services/

guards/

interceptors/

models/
```

Each folder should have a clearly defined responsibility.

---

# API Standards

REST principles should be followed.

Example:

```text
GET

POST

PUT

PATCH

DELETE
```

Resource naming:

```text
/api/residents

/api/requests

/api/services

/api/users
```

Responses should be consistent.

Example:

```json
{
    "success": true,
    "message": "Resident created successfully.",
    "data": {}
}
```

Errors should follow the same structure.

---

# Validation Standards

Always validate:

- Required fields
- Input format
- Duplicate records
- Business rules
- Authorization
- Request ownership (where applicable)

Never trust client-side validation alone.

---

# Error Handling

Errors should:

- Be meaningful.
- Avoid exposing sensitive information.
- Be logged.
- Return appropriate HTTP status codes.

Example:

```text
400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

500 Internal Server Error
```

---

# Logging Standards

Log:

- Authentication events
- Failed validation
- Database errors
- Hardware communication
- System exceptions

Do not log:

- Passwords
- Tokens
- Sensitive personal information

---

# Database Standards

- Use foreign keys.
- Use meaningful table names.
- Normalize where appropriate.
- Avoid duplicated data.
- Maintain referential integrity.

Schema changes should be documented before implementation.

---

# Frontend Standards

The frontend should:

- Be responsive.
- Use reusable components.
- Separate presentation from business logic.
- Display meaningful validation messages.
- Handle loading and error states gracefully.

---

# Hardware Standards

The hardware layer should:

- Communicate only through the Backend API.
- Validate device responses.
- Handle disconnections gracefully.
- Log communication failures.

Business logic should never reside inside Arduino code.

---

# Testing Standards

Every meaningful feature should be verified.

Testing includes:

- Unit Testing
- Integration Testing
- End-to-End Testing
- Build Verification
- Manual Validation

Testing is part of development—not an optional final step.

---

# Code Review Checklist

Before merging:

- Requirements satisfied
- Acceptance criteria met
- Tests pass
- Build succeeds
- Documentation updated
- No unnecessary code
- Naming follows standards
- Architecture remains consistent

---

# AI Collaboration

OpenCode should:

- Read the relevant task before coding.
- Review architecture.
- Respect module boundaries.
- Implement only the approved scope.
- Preserve existing conventions.
- Avoid unrelated refactoring.

AI should not:

- Introduce undocumented dependencies.
- Change unrelated modules.
- Guess business rules.
- Skip testing.
- Ignore acceptance criteria.

---

# Definition of Complete

A feature is complete only when:

- Code is implemented.
- Tests pass.
- Build succeeds.
- Documentation is updated.
- Architecture remains consistent.
- Acceptance criteria are satisfied.
- Code review is complete.

---

# Related Documents

| Document | Purpose |
|----------|---------|
| PDMP-000 | Development Process |
| PDMP-001 | Project Overview |
| PDMP-002 | Project Roadmap |
| PDMP-003 | Project Architecture |
| PDMP-004 | Project Dependency Map |
| PDMP-006 | Task Template |

---

# Guiding Principle

> Every line of code should be understandable, testable, maintainable, and consistent with the project's architecture and development standards.

The objective is not only to produce working software, but to produce software that remains reliable and maintainable throughout its lifecycle.