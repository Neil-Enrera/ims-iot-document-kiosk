# TASK-BACKEND-010 — Service Management API

> **Phase:** Backend
> **Task ID:** TASK-BACKEND-010
> **Priority:** P1 (High)
> **Status:** Done

---

# Objective

Develop the Service Management API to manage all barangay services and documents available through the Information Management System and the IoT-Assisted Document Request Services Kiosk.

This module serves as the master source of available services that residents can request.

---

# Background

Barangay services may change over time. New services may be added, existing services may be updated, or some may become temporarily unavailable.

Instead of hardcoding services in the frontend or backend, all services should be maintained through this module.

Examples include:

- Barangay Clearance
- Certificate of Residency
- Certificate of Indigency
- Business Clearance
- Barangay ID
- Other future services

---

# Scope

## Included

- Create service
- View all services
- View service details
- Update service
- Activate/deactivate service
- Archive service (optional)
- Search services

## Not Included

- Document request workflow
- Payments
- Certificate generation

---

# Dependencies

- TASK-BACKEND-007 — User Management API
- TASK-BACKEND-006 — Role-Based Access Control (RBAC)

---

# Database Tables

Use the existing table:

```text
services
```

This table is the authoritative source for all requestable services.

---

# API Endpoints

## Create Service

```http
POST /api/v1/services
```

---

## Get All Services

```http
GET /api/v1/services
```

Supports:

- Pagination
- Search
- Status filtering
- Sorting

---

## Get Service Details

```http
GET /api/v1/services/:id
```

---

## Update Service

```http
PUT /api/v1/services/:id
```

---

## Activate / Deactivate Service

```http
PATCH /api/v1/services/:id/status
```

Example

```json
{
    "status": "inactive"
}
```

---

## Delete Service

```http
DELETE /api/v1/services/:id
```

Prefer soft deletion if supported.

---

# Suggested Service Fields

Depending on your existing schema, each service may include:

- Service Name
- Description
- Fee
- Processing Time
- Required Requirements
- Status (Active/Inactive)

> Use the fields already defined in your SQL schema. Extend only if your project requirements change.

---

# Business Rules

- Service names must be unique.
- Inactive services cannot be selected in the kiosk.
- Existing requests must retain historical references even if a service is later deactivated.
- Only authorized personnel may manage services.

---

# Authorization

| Action | Allowed Roles |
|---------|---------------|
| View Services | Administrator, Secretary, Staff |
| Create Service | Administrator |
| Update Service | Administrator |
| Change Status | Administrator |
| Delete Service | Administrator |

---

# Folder Structure

```text
backend/src/

controllers/
    service.controller.js

services/
    service.service.js

repositories/
    service.repository.js

routes/
    service.routes.js

validations/
    service.validation.js
```

---

# Files to Create

```text
controllers/service.controller.js
services/service.service.js
repositories/service.repository.js
routes/service.routes.js
validations/service.validation.js
```

---

# Files to Modify

```text
routes/api.js
```

Register the Service Management routes.

---

# Kiosk Integration

The kiosk retrieves available services from:

```http
GET /api/v1/services
```

Only services marked as **Active** should be displayed to residents.

Example flow:

```text
Resident Verified
        │
        ▼
GET /api/v1/services
        │
        ▼
Display Available Services
        │
        ▼
Resident Selects Service
        │
        ▼
Proceed to Document Request
```

---

# Implementation Checklist

- [ ] Create Service CRUD API
- [ ] Implement pagination
- [ ] Implement search
- [ ] Activate/deactivate services
- [ ] Prevent duplicate service names
- [ ] Protect endpoints using JWT and RBAC
- [ ] Test all endpoints

---

# Verification

### Create Service

```http
POST /api/v1/services
```

Expected:

```http
201 Created
```

---

### Get Active Services

```http
GET /api/v1/services
```

Returns only services available to the system (frontend or kiosk can filter active services as needed).

---

### Deactivate Service

```http
PATCH /api/v1/services/:id/status
```

Expected:

The service is no longer available for new requests.

---

# Acceptance Criteria

- Services can be created, viewed, updated, and deactivated.
- Duplicate service names are prevented.
- Service status controls availability.
- API responses follow the project standard.

---

# Definition of Done

- Service Management API completed.
- CRUD operations tested.
- Kiosk can retrieve active services.
- Ready for Document Request integration.

---

# Estimated Effort

3–5 hours

---

# Next Task

**TASK-BACKEND-011 — Document Request Management API**

---

# Notes for OpenCode

Before implementing:

1. Use the existing `services` table as the master list of barangay services.
2. Do not hardcode service names in controllers or the frontend.
3. Ensure only active services are available for new requests.
4. Protect management endpoints using JWT and RBAC.
5. Design the API so both the web application and kiosk consume the same service data.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |