# TASK-FRONTEND-009 — Service Management Module

> **Phase:** Frontend
> **Task ID:** TASK-FRONTEND-009
> **Priority:** P0 (Critical)
> **Status:** Done

---

# Objective

Develop the Service Management Module to manage barangay services and document types offered through the Information Management System and the IoT-Assisted Document Request Services Kiosk.

Administrators should be able to configure available services, requirements, fees, processing times, and availability.

---

# Background

The backend provides:

```
POST   /api/v1/services
GET    /api/v1/services
GET    /api/v1/services/:id
PUT    /api/v1/services/:id
PATCH  /api/v1/services/:id/status
DELETE /api/v1/services/:id
```

These services will be used by:

- Document Request Module
- Kiosk Interface
- Dashboard
- Reports

---

# Scope

Included

- Service List
- Create Service
- Edit Service
- View Service Details
- Activate / Deactivate Service
- Search
- Filters
- Pagination

Not Included

- Document Approval Workflow
- Request Processing
- Payment Recording

---

# Navigation

```
Sidebar

↓

Services
```

Route

```
/services
```

---

# Pages

## Service List

Displays

- Service Code
- Service Name
- Category
- Processing Time
- Fee
- Status
- Availability

Actions

- View
- Edit
- Activate / Deactivate
- Delete

---

## Create Service

Fields

General Information

- Service Code
- Service Name
- Category
- Description

Processing

- Processing Time
- Unit (Minutes / Hours / Days)

Payment

- Service Fee

Requirements

- List of Requirements

Availability

- Available in Kiosk
- Requires Approval
- Active Status

Buttons

```
Save

Cancel
```

---

## Service Details

Display

- Service Information
- Description
- Fee
- Processing Time
- Requirements
- Status
- Total Requests
- Created Date
- Updated Date

---

## Edit Service

Editable

- Name
- Description
- Fee
- Processing Time
- Requirements
- Availability
- Status

Not Editable

- Service Code (recommended after creation)

---

# Example Services

```
Barangay Clearance

Certificate of Indigency

Certificate of Residency

Business Clearance

Barangay ID

First Time Job Seeker Certificate
```

---

# UI Layout

```
+-------------------------------------------------------------+

Service Management

[ Add Service ]

---------------------------------------------------------------

Search

Category Filter

Status Filter

---------------------------------------------------------------

| Code | Service | Fee | Time | Status | Actions |

---------------------------------------------------------------

Pagination
```

---

# Search

Supports

- Service Code
- Service Name
- Description

---

# Filters

- Category
- Status
- Kiosk Availability
- Requires Approval

---

# Sorting

- Service Name
- Fee
- Processing Time
- Date Created

---

# Validation

Required

- Service Code
- Service Name
- Processing Time

Optional

- Description
- Requirements

Validate

- Fee cannot be negative
- Processing Time must be greater than zero
- Service Code must be unique

---

# Components

```
service-table.component

service-form.component

service-detail.component

requirement-list.component

service-status-badge.component
```

---

# Folder Structure

```
features/

services/

pages/

list/

create/

edit/

detail/

components/

service-table/

service-form/

requirement-list/

services/

service.facade.ts
```

---

# API Integration

Methods

```
getServices()

getService()

createService()

updateService()

deleteService()

updateStatus()
```

---

# Requirements Management

Each service can define one or more requirements.

Example

Barangay Clearance

- Valid ID
- Community Tax Certificate

Certificate of Indigency

- Valid ID
- Request Form

The frontend should allow administrators to add, edit, remove, and reorder requirements.

---

# Kiosk Availability

Each service should include a switch:

```
Available on Kiosk

Yes / No
```

If disabled, the service is hidden from the kiosk interface.

---

# Shared Components Used

- Data Table
- Search Bar
- Status Badge
- Form Controls
- Confirmation Dialog
- Snackbar
- Loading Skeleton

---

# Loading State

Display

- Skeleton Table
- Skeleton Form
- Skeleton Detail

---

# Error Handling

Duplicate Service Code

```
Service code already exists.
```

Invalid Fee

```
Fee must be zero or greater.
```

Server Error

```
Unable to save service.
```

---

# Role-Based Access

Administrator

- Full access

Secretary

- View only

Treasurer

- View only

---

# Future Integration

This module integrates with:

Document Requests

```
Available Services
```

Kiosk

```
Service Selection Screen
```

Reports

```
Most Requested Services
```

Dashboard

```
Service Statistics
```

---

# Implementation Checklist

- [ ] Build Service List
- [ ] Build Create Service page
- [ ] Build Edit Service page
- [ ] Build Service Detail page
- [ ] Build Requirements editor
- [ ] Implement Search
- [ ] Implement Filters
- [ ] Implement Pagination
- [ ] Connect Service APIs
- [ ] Implement Role Permissions

---

# Verification

Administrator

Can create, update, activate, deactivate, and delete services.

Secretary

Can view services only.

Inactive services no longer appear in the kiosk.

Requirements are displayed correctly.

---

# Acceptance Criteria

- Service CRUD operations work correctly.
- Requirements can be managed.
- Kiosk availability toggle functions.
- Search, filters, and pagination work.
- UI follows the shared design system.
- Role-based permissions are enforced.

---

# Definition of Done

- Service Management module completed.
- Backend integration verified.
- Service catalog ready for Document Request module.

---

# Estimated Effort

8–10 hours

---

# Next Task

**TASK-FRONTEND-010 — Document Request Management Module**

---

# Notes for OpenCode

Before implementing:

1. Store document requirements as a structured list rather than plain text to support future validation and dynamic display.
2. Separate service configuration from request processing—this module defines services, while the Document Request module handles transactions.
3. Use reusable chips or list components for displaying requirements.
4. Make the "Available on Kiosk" setting configurable so the same service catalog can support both staff-assisted and self-service workflows.
5. Keep service codes immutable after creation to preserve reporting consistency and historical records.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |