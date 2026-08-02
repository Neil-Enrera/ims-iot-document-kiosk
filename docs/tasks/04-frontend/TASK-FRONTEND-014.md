# TASK-FRONTEND-014 — Audit Log Viewer

> **Phase:** Frontend
> **Task ID:** TASK-FRONTEND-014
> **Priority:** P1 (High)
> **Status:** Done

---

# Objective

Develop the Audit Log Viewer to display a permanent, searchable, and filterable history of significant actions performed within the Information Management System.

The Audit Log supports accountability, troubleshooting, and administrative oversight.

---

# Background

The backend provides:

```
GET /api/v1/audit-logs
GET /api/v1/audit-logs/:id
GET /api/v1/audit-logs/export
```

Audit records are generated automatically whenever users perform important actions.

---

# Scope

Included

- Audit Log List
- Audit Log Details
- Search
- Filters
- Pagination
- Export

Not Included

- Editing Audit Logs
- Deleting Audit Logs
- Manual Log Creation

Audit logs are immutable.

---

# Navigation

```
Sidebar

↓

Administration

↓

Audit Logs
```

Route

```
/audit-logs
```

---

# Logged Events

Authentication

```
User Login

User Logout

Failed Login
```

Users

```
User Created

User Updated

User Deactivated
```

Residents

```
Resident Registered

Resident Updated

Resident Archived

Resident Restored
```

RFID

```
Card Assigned

Card Replaced

Card Deactivated
```

Services

```
Service Created

Service Updated

Service Disabled
```

Document Requests

```
Request Created

Request Approved

Request Rejected

Request Released
```

Payments

```
Payment Recorded

Payment Verified

Payment Cancelled
```

System

```
Settings Updated

Role Changed

System Configuration Updated
```

---

# Audit Log List

Display

- Timestamp
- User
- Module
- Action
- Record Reference
- IP Address (if available)

Actions

- View Details

---

# Audit Detail

Display

General Information

- Event ID
- Timestamp
- User
- Module
- Action

Technical Information

- Record ID
- Previous Values
- New Values
- IP Address
- Device Information (if available)

---

# Audit Detail Layout

```
+----------------------------------------------------------+

Audit Event

----------------------------------------------------------

User Information

----------------------------------------------------------

Action Details

----------------------------------------------------------

Changed Fields

----------------------------------------------------------

Technical Information
```

---

# Search

Supports

- Username
- Resident Name
- Control Number
- RFID UID
- Event ID

---

# Filters

- Module
- Action
- User
- Date Range
- Success / Failure

---

# Sorting

- Newest First
- Oldest First

---

# Components

```
audit-table.component

audit-detail.component

change-history.component

audit-filter.component
```

---

# Folder Structure

```
features/

audit/

pages/

list/

detail/

components/

audit-table/

audit-detail/

change-history/

audit-filter/

services/

audit.facade.ts
```

---

# API Integration

Methods

```
getAuditLogs()

getAuditLog()

exportAuditLogs()
```

---

# Change History

For update events display:

```
Field

↓

Old Value

↓

New Value
```

Example

```
Status

Pending

↓

Approved
```

Only changed fields should be shown.

---

# Export

Supported Formats

```
PDF

Excel (XLSX)

CSV
```

Export should respect the currently applied filters.

---

# Shared Components Used

- Data Table
- Filter Panel
- Search Bar
- Pagination
- Detail Drawer/Dialog
- Loading Skeleton
- Snackbar

---

# Loading State

Display

- Skeleton Table
- Skeleton Detail

---

# Error Handling

API Error

```
Unable to load audit logs.
```

Export Error

```
Unable to export audit logs.
```

---

# Role-Based Access

Administrator

- Full access
- Export logs

Secretary

- No access

Treasurer

- No access

---

# Security

Audit logs

- Cannot be edited
- Cannot be deleted
- Cannot be created manually
- Must always reflect backend data

---

# Integration

Users

```
Account Activity
```

Residents

```
Resident Changes
```

Requests

```
Workflow History
```

Payments

```
Financial Activity
```

Settings

```
Configuration Changes
```

---

# Implementation Checklist

- [ ] Build Audit Log List
- [ ] Build Audit Detail View
- [ ] Build Change History Viewer
- [ ] Implement Search
- [ ] Implement Filters
- [ ] Implement Pagination
- [ ] Implement Export
- [ ] Connect Audit APIs
- [ ] Enforce Administrator-only access

---

# Verification

Administrator

Can view and export audit logs.

Secretary

Cannot access the module.

Audit entries accurately display:

- User
- Action
- Timestamp
- Changed fields

Logs cannot be modified from the UI.

---

# Acceptance Criteria

- Audit logs load successfully.
- Search and filtering work.
- Change history is displayed correctly.
- Export functions correctly.
- Role restrictions are enforced.
- UI follows the shared design system.

---

# Definition of Done

- Audit Log Viewer completed.
- Backend integration verified.
- Immutable audit history displayed.
- Ready for File Management.

---

# Estimated Effort

8–10 hours

---

# Next Task

**TASK-FRONTEND-015 — File Management Module**

---

# Notes for OpenCode

Before implementing:

1. Treat audit logs as read-only data; never expose edit or delete actions in the UI.
2. Highlight only the fields that changed during update events to improve readability.
3. Support deep links from audit entries to related records (when the user has permission to access them).
4. Keep filtering and export behavior consistent with the Reports module.
5. Display timestamps using the user's local timezone while preserving the original server timestamp internally.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |