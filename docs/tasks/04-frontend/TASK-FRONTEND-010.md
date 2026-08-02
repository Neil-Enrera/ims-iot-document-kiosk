# TASK-FRONTEND-010 — Document Request Management Module

> **Phase:** Frontend
> **Task ID:** TASK-FRONTEND-010
> **Priority:** P0 (Critical)
> **Status:** Done

---

# Objective

Develop the Document Request Management Module to handle the complete lifecycle of barangay document requests—from request creation through approval, payment, document generation, and release.

This module is the operational core of the Information Management System.

---

# Background

The backend exposes:

```
POST   /api/v1/requests
GET    /api/v1/requests
GET    /api/v1/requests/:id
PATCH  /api/v1/requests/:id/status
PATCH  /api/v1/requests/:id/approve
PATCH  /api/v1/requests/:id/reject
PATCH  /api/v1/requests/:id/release
```

Requests may originate from:

- Staff
- IoT Kiosk

Both must follow the same workflow.

---

# Scope

Included

- Request List
- Create Request
- Request Details
- Approval Workflow
- Reject Workflow
- Payment Status
- Release Workflow
- Timeline
- Search
- Filters
- Pagination

Not Included

- Payment Recording
- Report Generation

---

# Navigation

```
Sidebar

↓

Document Requests
```

Route

```
/requests
```

---

# Workflow

```
Resident

↓

Select Service

↓

Create Request

↓

Pending

↓

Review

↓

Approved

↓

Payment Required?

↓

Yes

↓

Paid

↓

Generate Document

↓

Ready for Release

↓

Released
```

Rejected requests exit the workflow after review.

---

# Statuses

```
Pending

Under Review

Approved

Rejected

Payment Pending

Paid

Ready for Release

Released

Cancelled
```

---

# Pages

## Request List

Display

- Control Number
- Resident
- Service
- Date Requested
- Status
- Payment Status
- Assigned Staff

Actions

- View
- Approve
- Reject
- Release

---

## Create Request

Fields

Resident

```
Resident Lookup
```

Service

```
Dropdown
```

Supporting Notes

Optional

Request Source

```
Staff

Kiosk
```

Buttons

```
Submit

Cancel
```

---

## Request Details

Display

General Information

Resident

Selected Service

Requirements

Payment

Timeline

Approval Information

Generated Document

Release Information

---

# Request Detail Layout

```
+----------------------------------------------------------+

Control Number

Current Status

----------------------------------------------------------

Resident Information

----------------------------------------------------------

Service Details

----------------------------------------------------------

Payment Information

----------------------------------------------------------

Approval Timeline

----------------------------------------------------------

Generated Documents

----------------------------------------------------------

Release Information
```

---

# Search

Supports

- Control Number
- Resident Name
- Resident ID

---

# Filters

- Status
- Payment Status
- Service
- Request Source
- Date Range

---

# Sorting

- Date Requested
- Resident
- Service
- Status

---

# Components

```
request-table.component

request-form.component

request-detail.component

request-timeline.component

status-badge.component

approval-dialog.component

release-dialog.component
```

---

# Folder Structure

```
features/

requests/

pages/

list/

create/

detail/

components/

request-table/

request-form/

timeline/

approval/

release/

services/

request.facade.ts
```

---

# API Integration

Methods

```
getRequests()

getRequest()

createRequest()

approveRequest()

rejectRequest()

releaseRequest()

updateStatus()
```

---

# Timeline

Each request should display:

```
Request Created

↓

Under Review

↓

Approved

↓

Payment Completed

↓

Document Generated

↓

Ready for Release

↓

Released
```

Each event shows

- Timestamp
- Staff
- Remarks

---

# Approval

Administrator

Can

- Approve
- Reject

Secretary

Can

- Review
- Recommend

Treasurer

Cannot approve.

---

# Release

Before release

Verify

- Approved
- Payment completed (if required)
- Document generated

After release

Update status

```
Released
```

---

# Shared Components Used

- Data Table
- Timeline
- Status Badge
- Confirmation Dialog
- Snackbar
- Search Bar
- Pagination
- Loading Skeleton

---

# Loading State

Display

- Skeleton Table
- Skeleton Timeline
- Skeleton Detail

---

# Error Handling

Invalid workflow

```
This request cannot transition to the selected status.
```

Payment required

```
Payment must be completed before release.
```

Server Error

```
Unable to update request.
```

---

# Role-Based Access

Administrator

- Full access

Secretary

- Create
- Review
- View

Treasurer

- View only

---

# Integration

Resident

```
Resident Profile
```

Services

```
Available Services
```

Payments

```
Payment Status
```

Files

```
Generated Document
```

Dashboard

```
Request Statistics
```

Audit Log

```
Status Changes
```

Kiosk

```
Submitted Requests
```

---

# Implementation Checklist

- [ ] Build Request List
- [ ] Build Create Request
- [ ] Build Request Detail
- [ ] Build Timeline
- [ ] Implement Approval
- [ ] Implement Rejection
- [ ] Implement Release
- [ ] Implement Search
- [ ] Implement Filters
- [ ] Implement Pagination
- [ ] Connect Request APIs
- [ ] Enforce workflow validation

---

# Verification

Secretary

Can create requests.

Administrator

Can approve, reject, and release requests.

Treasurer

Can view requests.

Released requests cannot be modified.

Timeline displays every workflow event.

---

# Acceptance Criteria

- Complete request lifecycle implemented.
- Workflow transitions validated.
- Timeline displays correctly.
- Search and filters work.
- API integration verified.
- Role permissions enforced.

---

# Definition of Done

- Document Request module completed.
- Workflow engine operational.
- Ready for Payment Management.

---

# Estimated Effort

14–18 hours

---

# Next Task

**TASK-FRONTEND-011 — Payment Management Module**

---

# Notes for OpenCode

Before implementing:

1. Model request statuses as a finite state machine to prevent invalid transitions.
2. Keep payment, approval, and release logic in separate reusable components to avoid coupling.
3. Generate a unique control number for each request (or consume it from the backend) and display it consistently across the system.
4. Make the Request Detail page the central workspace, aggregating resident information, service details, payment status, attached files, and audit timeline.
5. Ensure requests created through the kiosk and those created by staff follow the exact same workflow and business rules.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |