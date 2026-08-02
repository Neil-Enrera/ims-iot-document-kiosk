# TASK-BACKEND-008 — Resident Management API

> **Phase:** Backend
> **Task ID:** TASK-BACKEND-008
> **Priority:** P1 (High)
> **Status:** Done

---

# Objective

Develop the Resident Management API to maintain complete and accurate resident records for Barangay San Manuel.

This module serves as the primary source of resident information used throughout the Information Management System and the IoT-Assisted Document Request Services Kiosk.

---

# Background

Residents are the core entity of the system.

All major system functions rely on resident information, including:

- RFID identification
- Document requests
- Certificate generation
- Payment records
- Audit history
- Kiosk verification

This module provides CRUD operations, search capabilities, and profile management for residents.

---

# Scope

## Included

- Register resident
- View residents
- Search residents
- View resident profile
- Update resident information
- Archive resident
- Restore archived resident
- Upload resident photo (if supported)

## Not Included

- RFID assignment
- Document requests
- Payments

---

# Dependencies

- TASK-BACKEND-002 — Database Integration
- TASK-BACKEND-005 — Authentication
- TASK-BACKEND-006 — RBAC

---

# Database Tables

Use the existing table(s):

```text
residents
```

If additional related tables exist (e.g., addresses or households), integrate them accordingly.

---

# API Endpoints

## Register Resident

```http
POST /api/v1/residents
```

---

## Get Residents

```http
GET /api/v1/residents
```

Supports:

- Pagination
- Search
- Filtering
- Sorting

---

## Resident Details

```http
GET /api/v1/residents/:id
```

---

## Update Resident

```http
PUT /api/v1/residents/:id
```

---

## Archive Resident

```http
PATCH /api/v1/residents/:id/archive
```

---

## Restore Resident

```http
PATCH /api/v1/residents/:id/restore
```

---

## Upload Resident Photo

```http
POST /api/v1/residents/:id/photo
```

(Optional, depending on your project scope.)

---

# Search Capabilities

Support searching by:

- Resident ID
- RFID Card Number (when linked)
- Full Name
- Address
- Contact Number

---

# Validation Rules

- Required fields must not be empty.
- Date of birth cannot be in the future.
- Contact number format must be validated.
- Duplicate resident records should be prevented based on agreed business rules.

---

# Authorization

| Action | Allowed Roles |
|---------|---------------|
| View Residents | Administrator, Secretary, Staff |
| Create Resident | Administrator, Secretary |
| Update Resident | Administrator, Secretary |
| Archive Resident | Administrator |
| Restore Resident | Administrator |

---

# Folder Structure

```text
backend/src/

controllers/
    resident.controller.js

services/
    resident.service.js

repositories/
    resident.repository.js

routes/
    resident.routes.js

validations/
    resident.validation.js
```

---

# Files to Create

```text
controllers/resident.controller.js
services/resident.service.js
repositories/resident.repository.js
routes/resident.routes.js
validations/resident.validation.js
```

---

# Files to Modify

```text
routes/api.js
```

Register the Resident Management routes.

---

# Business Rules

- A resident record must exist before an RFID card can be assigned.
- Archived residents cannot submit new document requests.
- Resident information must remain consistent across all related modules.
- Resident IDs must remain unique.

---

# Implementation Checklist

- [ ] Create Resident CRUD API
- [ ] Implement search functionality
- [ ] Implement pagination
- [ ] Implement archive/restore functionality
- [ ] Validate resident information
- [ ] Protect endpoints using JWT
- [ ] Apply RBAC permissions
- [ ] Test all endpoints

---

# Verification

### Register Resident

```http
POST /api/v1/residents
```

Expected:

```http
201 Created
```

---

### Search Residents

```http
GET /api/v1/residents?search=Juan
```

Returns matching residents.

---

### Archive Resident

```http
PATCH /api/v1/residents/15/archive
```

Resident becomes unavailable for new document requests.

---

# Acceptance Criteria

- Residents can be created, viewed, updated, archived, and restored.
- Search and pagination work correctly.
- RBAC restrictions are enforced.
- API responses follow the project standard.

---

# Definition of Done

- Resident Management API completed.
- CRUD operations fully tested.
- Search functionality operational.
- Ready for RFID integration.

---

# Estimated Effort

6–8 hours

---

# Next Task

**TASK-BACKEND-009 — RFID Management API**

---

# Notes for OpenCode

Before implementing:

1. Use the existing `residents` table as the authoritative source of resident data.
2. Keep business logic inside the service layer.
3. Use repositories for database access.
4. Protect all endpoints using JWT and RBAC.
5. Ensure the module can support future RFID and document request integrations without structural changes.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |