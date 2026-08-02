# TASK-BACKEND-011 — Document Request Management API

> **Phase:** Backend
> **Task ID:** TASK-BACKEND-011
> **Priority:** P0 (Critical)
> **Status:** Done

---

# Objective

Develop the Document Request Management API to manage the complete lifecycle of barangay document requests submitted through both the Information Management System and the IoT-Assisted Document Request Services Kiosk.

This module is the core business process of the project.

---

# Background

Residents may request various barangay services such as:

- Barangay Clearance
- Certificate of Residency
- Certificate of Indigency
- Business Clearance
- Barangay ID
- Other future services

Requests may originate from:

- Staff Portal
- Self-Service Kiosk

The system must track every request from submission until release.

---

# Scope

## Included

- Create request
- View requests
- Search requests
- View request details
- Update request
- Change request status
- Approve request
- Reject request
- Cancel request
- Release completed request
- Request history
- Dashboard statistics support

## Not Included

- Payment processing
- PDF generation
- Notifications

---

# Dependencies

- TASK-BACKEND-008 Resident Management API
- TASK-BACKEND-009 RFID Management API
- TASK-BACKEND-010 Service Management API

---

# Database Tables

Use the existing tables:

```text
requests
services
residents
request_statuses
users
```

---

# Request Workflow

```text
Resident
        │
        ▼
Select Service
        │
        ▼
Submit Request
        │
        ▼
Pending Review
        │
        ▼
Approved / Rejected
        │
        ▼
Waiting for Payment (if applicable)
        │
        ▼
Processing
        │
        ▼
Ready for Release
        │
        ▼
Released
```

---

# Request Statuses

Use the existing `request_statuses` table.

Typical statuses include:

- Pending
- Under Review
- Approved
- Rejected
- Waiting for Payment
- Processing
- Ready for Release
- Released
- Cancelled

---

# API Endpoints

## Create Request

```http
POST /api/v1/requests
```

Request

```json
{
    "residentId": 15,
    "serviceId": 2,
    "remarks": "For employment purposes"
}
```

---

## Get Requests

```http
GET /api/v1/requests
```

Supports

- Pagination
- Search
- Status Filter
- Date Filter
- Resident Filter
- Service Filter

---

## Request Details

```http
GET /api/v1/requests/:id
```

---

## Update Request

```http
PUT /api/v1/requests/:id
```

---

## Update Status

```http
PATCH /api/v1/requests/:id/status
```

Example

```json
{
    "statusId": 3,
    "remarks": "Verified"
}
```

---

## Approve Request

```http
POST /api/v1/requests/:id/approve
```

---

## Reject Request

```http
POST /api/v1/requests/:id/reject
```

---

## Cancel Request

```http
POST /api/v1/requests/:id/cancel
```

---

## Release Request

```http
POST /api/v1/requests/:id/release
```

---

# Business Rules

- Resident must exist.
- Service must be active.
- Request must reference a valid status.
- Only authorized personnel may approve or reject requests.
- Released requests cannot be modified.
- Cancelled requests cannot be approved.
- Every status change must be recorded in the audit log.

---

# Validation Rules

- Resident ID is required.
- Service ID is required.
- Invalid status transitions are not allowed.
- Duplicate active requests for the same resident and service may be restricted based on your barangay's policy.

---

# Authorization

| Action | Allowed Roles |
|---------|---------------|
| View Requests | Administrator, Secretary, Staff |
| Create Request | Administrator, Secretary, Staff, Kiosk |
| Update Request | Administrator, Secretary |
| Approve Request | Administrator, Barangay Captain, Secretary |
| Reject Request | Administrator, Barangay Captain, Secretary |
| Release Request | Administrator, Secretary |
| Cancel Request | Administrator, Secretary |

---

# Folder Structure

```text
backend/src/

controllers/
    request.controller.js

services/
    request.service.js

repositories/
    request.repository.js

routes/
    request.routes.js

validations/
    request.validation.js
```

---

# Files to Create

```text
controllers/request.controller.js
services/request.service.js
repositories/request.repository.js
routes/request.routes.js
validations/request.validation.js
```

---

# Files to Modify

```text
routes/api.js
```

Register the Document Request routes.

---

# Kiosk Integration

The kiosk creates a request using:

```http
POST /api/v1/requests
```

Workflow:

```text
Resident taps RFID
        │
        ▼
Resident Verified
        │
        ▼
Retrieve Active Services
        │
        ▼
Resident Selects Service
        │
        ▼
Create Request
        │
        ▼
Request Number Generated
        │
        ▼
Confirmation Displayed
```

---

# Dashboard Support

Provide endpoints or query support for:

- Total Requests
- Pending Requests
- Approved Requests
- Released Requests
- Daily Requests
- Monthly Requests
- Requests by Service

These metrics will be consumed by the dashboard module.

---

# Implementation Checklist

- [ ] Create Request CRUD API
- [ ] Implement request workflow
- [ ] Validate status transitions
- [ ] Implement search and filters
- [ ] Protect endpoints using JWT and RBAC
- [ ] Integrate with residents and services
- [ ] Record audit events
- [ ] Test all workflow scenarios

---

# Verification

### Create Request

```http
POST /api/v1/requests
```

Expected:

```http
201 Created
```

---

### Approve Request

```http
POST /api/v1/requests/25/approve
```

Status changes to **Approved**.

---

### Release Request

```http
POST /api/v1/requests/25/release
```

Status changes to **Released**.

---

### Invalid Status Transition

Attempt to release a rejected request.

Expected:

```http
409 Conflict
```

---

# Acceptance Criteria

- Requests can be created from both the web system and kiosk.
- Workflow follows the approved business process.
- Invalid status transitions are prevented.
- Audit history is recorded.
- API follows project response standards.

---

# Definition of Done

- Document Request API completed.
- Workflow fully operational.
- Kiosk integration verified.
- Ready for payment integration.

---

# Estimated Effort

8–12 hours

---

# Next Task

**TASK-BACKEND-012 — Payment Management API**

---

# Notes for OpenCode

Before implementing:

1. Treat this as the central business module of the system.
2. Use the existing `requests`, `services`, `residents`, and `request_statuses` tables.
3. Keep workflow validation inside the service layer.
4. Prevent invalid status transitions (e.g., Released → Pending).
5. Ensure both the web application and kiosk use the same request creation endpoint.
6. Record significant actions (approval, rejection, release) in the audit log for traceability.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |