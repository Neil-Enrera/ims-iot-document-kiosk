# TASK-FOUNDATION-008 — Code Standards

> **Phase:** Foundation  
> **Task ID:** TASK-FOUNDATION-008  
> **Priority:** P1 (High)  
> **Status:** Done

---

# Objective

Establish and document coding standards, naming conventions, formatting rules, and development best practices for the **Information Management System with IoT-Assisted Document Request Services Kiosk for Barangay San Manuel**.

The goal is to ensure that all source code is consistent, readable, maintainable, and follows modern development standards.

---

# Background

As the project grows, inconsistent coding styles can make the codebase difficult to understand and maintain. By defining standards early, every developer and AI assistant will produce code that follows the same conventions.

---

# Scope

## Included

- Configure ESLint
- Configure Prettier
- Define naming conventions
- Define project structure standards
- Define TypeScript standards
- Define API standards
- Define database naming standards
- Document best practices

## Not Included

- Unit testing standards
- CI/CD linting
- Security policies

---

# Dependencies

- TASK-FOUNDATION-003 — Angular Project Initialization
- TASK-FOUNDATION-004 — Backend Project Initialization

---

# Business Rules

- All code must pass ESLint.
- All code must follow Prettier formatting.
- No unused imports or variables.
- No hardcoded configuration values.
- No commented-out production code.
- Functions should have a single responsibility.
- Keep modules small and maintainable.

---

# Naming Conventions

## General

| Item | Convention | Example |
|-------|------------|---------|
| Folder | kebab-case | `document-requests` |
| File | kebab-case | `resident.service.ts` |
| Variable | camelCase | `residentName` |
| Function | camelCase | `createRequest()` |
| Class | PascalCase | `ResidentService` |
| Interface | PascalCase | `Resident` |
| Enum | PascalCase | `RequestStatus` |
| Constant | UPPER_SNAKE_CASE | `MAX_UPLOAD_SIZE` |
| Database Table | snake_case | `document_requests` |
| Database Column | snake_case | `resident_id` |

---

# Angular Standards

- Feature-based module organization
- Standalone Components
- Smart/Dumb component separation where appropriate
- Services contain business communication
- Components handle presentation logic
- Use Angular Router for navigation
- Avoid business logic inside components

---

# Backend Standards

- RESTful API design
- Controllers handle HTTP requests only
- Services contain business logic
- Repositories handle database access
- Middleware for authentication, validation, and error handling
- Configuration isolated in `config/`

---

# Database Standards

- Primary keys: `id`
- Foreign keys: `<table>_id`
- Timestamps:
  - `created_at`
  - `updated_at`
- Soft delete (future):
  - `deleted_at`

---

# REST API Standards

Example:

```http
GET    /api/residents
GET    /api/residents/:id
POST   /api/residents
PUT    /api/residents/:id
DELETE /api/residents/:id
```

Response format:

```json
{
  "success": true,
  "message": "Resident retrieved successfully.",
  "data": {}
}
```

Error format:

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": []
}
```

---

# Formatting Rules

- Indentation: 2 spaces
- UTF-8 encoding
- LF line endings
- Maximum line length: 100–120 characters
- Remove trailing whitespace
- End files with a newline

---

# Files to Create

```text
backend/.eslintrc.json
backend/.prettierrc

frontend/.eslintrc.json
frontend/.prettierrc
```

---

# Files to Modify

```text
README.md
```

(Add a section linking to the project's coding standards.)

---

# Implementation Checklist

- [ ] Configure ESLint for backend
- [ ] Configure Prettier for backend
- [ ] Configure ESLint for frontend
- [ ] Configure Prettier for frontend
- [ ] Document naming conventions
- [ ] Document API response format
- [ ] Verify formatting tools work correctly

---

# Verification

Backend:

```bash
npm run lint
```

Frontend:

```bash
ng lint
```

Run Prettier:

```bash
npm run format
```

Expected Result:

- No linting errors.
- Code formatted successfully.
- Standards documented.

---

# Acceptance Criteria

- ESLint configured.
- Prettier configured.
- Naming conventions documented.
- REST API conventions documented.
- Database naming standards documented.
- Code formatting verified.

---

# Definition of Done

- Coding standards established.
- Linting operational.
- Formatting operational.
- Documentation completed.
- Acceptance criteria satisfied.

---

# Estimated Effort

30–45 minutes

---

# Next Task

**TASK-FOUNDATION-009 — Project Folder Structure**

---

# Notes for OpenCode

Before implementing:

1. Configure ESLint and Prettier without changing application functionality.
2. Follow the naming conventions defined in this document.
3. Ensure both frontend and backend can be linted successfully.
4. Keep formatting rules consistent across the entire project.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |