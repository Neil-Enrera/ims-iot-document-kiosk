# TASK-BACKEND-015 — Audit Log API

> **Phase:** Backend
> **Task ID:** TASK-BACKEND-015
> **Priority:** P1 (High)
> **Status:** Done

---

# Objective

Develop the Audit Log API to automatically record significant user activities and system events within the Information Management System.

The Audit Log provides accountability, traceability, and security by maintaining a permanent record of critical operations performed by authenticated users.

---

# Background

Barangay personnel perform sensitive operations such as:

- Registering residents
- Updating resident information
- Assigning RFID cards
- Approving document requests
- Recording payments
- Managing users

The system must record these activities for monitoring and auditing purposes.

---

# Scope

## Included

- Automatic audit logging
- View audit logs
- Search audit logs
- Filter audit logs
- Audit log details

## Not Included

- Editing audit logs
- Deleting audit logs

Audit logs should be immutable.

---

# Dependencies

- TASK-BACKEND-005 — Authentication (JWT)
- TASK-BACKEND-011 — Document Request Management API
- TASK-BACKEND-012 — Payment Management API
- TASK-BACKEND-014 — Notification API

---

# Database Tables

Use the existing table:

```text
audit_logs
```

Suggested fields:

- Audit ID
- User ID
- Module
- Action
- Entity
- Entity ID
- Description
- IP Address
- User Agent
- Created At

Use the existing schema if these fields already exist.

---

# Audit Events

Automatically log events such as:

Authentication

- Login
- Logout
- Failed Login

Users

- Create User
- Update User
- Disable User

Residents

- Register Resident
- Update Resident
- Archive Resident

RFID

- Register RFID
- Assign RFID
- Replace RFID

Requests

- Create Request
- Approve Request
- Reject Request
- Release Request

Payments

- Record Payment
- Verify Payment
- Void Payment

System

- Change Settings
- Database Backup
- Restore

---

# API Endpoints

## Get Audit Logs

```http
GET /api/v1/audit-logs
```

Supports:

- Pagination
- Search
- Date Filter
- Module Filter
- User Filter

---

## Audit Log Details

```http
GET /api/v1/audit-logs/:id
```

---

# Business Rules

- Audit logs are automatically generated.
- Audit logs cannot be edited.
- Audit logs cannot be deleted.
- Every significant action should generate exactly one audit entry.
- System-generated actions should be distinguishable from user actions.

---

# Authorization

| Action | Allowed Roles |
|---------|---------------|
| View Audit Logs | Administrator |
| Search Audit Logs | Administrator |

No other roles should access audit logs.

---

# Folder Structure

```text
backend/src/

controllers/
    audit.controller.js

services/
    audit.service.js

repositories/
    audit.repository.js

routes/
    audit.routes.js
```

---

# Files to Create

```text
controllers/audit.controller.js
services/audit.service.js
repositories/audit.repository.js
routes/audit.routes.js
```

---

# Files to Modify

```text
routes/api.js
```

Register the Audit Log routes.

---

# Integration

Other modules should call the Audit Service after completing important operations.

Example:

```text
Approve Request
        │
        ▼
Request Service
        │
        ▼
Audit Service
        │
        ▼
Create Audit Log
```

Avoid inserting audit records directly from controllers.

---

# Implementation Checklist

- [ ] Automatically create audit records
- [ ] Retrieve audit logs
- [ ] Search audit logs
- [ ] Filter by user, module, and date
- [ ] Protect endpoints using JWT and RBAC
- [ ] Verify immutability of audit records

---

# Verification

### Retrieve Audit Logs

```http
GET /api/v1/audit-logs
```

Returns paginated audit records.

---

### Search Audit Logs

```http
GET /api/v1/audit-logs?module=requests
```

Returns only request-related audit events.

---

### Security

Attempt to modify an audit log.

Expected:

```http
405 Method Not Allowed
```

or no update endpoint available.

---

# Acceptance Criteria

- Significant system actions are automatically logged.
- Audit records cannot be modified or deleted.
- Audit logs are searchable and filterable.
- Access is restricted to administrators.
- API responses follow the project standard.

---

# Definition of Done

- Audit Log API completed.
- Automatic logging implemented.
- Audit queries tested.
- Ready for system configuration.

---

# Estimated Effort

3–5 hours

---

# Next Task

**TASK-BACKEND-016 — File & Document Management API**

---

# Notes for OpenCode

Before implementing:

1. Centralize audit logging in the Audit Service.
2. Do not duplicate logging logic across modules.
3. Keep audit records immutable.
4. Include enough context (user, action, entity, timestamp) for future investigations.
5. Ensure sensitive data such as passwords or tokens are never written to the audit log.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |