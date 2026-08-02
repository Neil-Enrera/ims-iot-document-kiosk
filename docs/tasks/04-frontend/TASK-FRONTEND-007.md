# TASK-FRONTEND-007 — Resident Management Module

> **Phase:** Frontend
> **Task ID:** TASK-FRONTEND-007
> **Priority:** P0 (Critical)
> **Status:** Done

---

# Objective

Develop the Resident Management Module to manage resident records, profile information, photos, RFID assignments, and document request history.

This module serves as the central resident information hub for the entire Information Management System.

---

# Background

The backend already provides:

```
POST   /api/v1/residents
GET    /api/v1/residents
GET    /api/v1/residents/:id
PUT    /api/v1/residents/:id
PATCH  /api/v1/residents/:id/archive
PATCH  /api/v1/residents/:id/restore
POST   /api/v1/residents/:id/photo
```

This module will be referenced by:

- RFID Management
- Document Requests
- Payments
- Reports
- Dashboard
- Kiosk

---

# Scope

Included

- Resident List
- Resident Registration
- Resident Profile
- Edit Resident
- Archive / Restore
- Upload Profile Photo
- Search
- Filters
- Pagination
- Resident Timeline
- RFID Summary
- Document Request Summary

Not Included

- RFID Registration (Separate Module)
- Kiosk Resident Authentication
- Resident Self-Service Portal

---

# Navigation

```
Sidebar

↓

Residents
```

Route

```
/residents
```

---

# Pages

## Resident List

Displays

- Resident ID
- Full Name
- Gender
- Address
- Contact Number
- Status
- RFID Status
- Registered Date

Actions

- View Profile
- Edit
- Archive
- Restore

---

## Register Resident

Fields

Personal Information

- First Name
- Middle Name
- Last Name
- Suffix
- Birthdate
- Gender
- Civil Status
- Nationality

Contact Information

- Mobile Number
- Email (Optional)

Address

- House Number
- Street
- Purok/Sitio
- Barangay
- City
- Province

Emergency Contact

- Name
- Relationship
- Contact Number

System Information

- Resident Status

Buttons

```
Save

Cancel
```

---

## Resident Profile

Display

Profile Photo

Personal Information

Contact Information

Address

RFID Information

Document Requests

Payment History

Activity Timeline

---

## Edit Resident

Editable

- Contact Information
- Address
- Emergency Contact
- Status

Restricted (depending on policy)

- Full Name
- Birthdate

---

## Archive Resident

Confirmation dialog

Reason (Optional)

Resident becomes inactive but remains in the database.

---

## Restore Resident

Restore archived resident.

---

# Resident Profile Layout

```
+--------------------------------------------------------------+

Profile Photo

Resident Information

---------------------------------------------------------------

Personal Information

Contact Information

Address

---------------------------------------------------------------

RFID Summary

---------------------------------------------------------------

Recent Requests

---------------------------------------------------------------

Recent Payments

---------------------------------------------------------------

Activity Timeline

```

---

# Search

Supports

- Name
- Resident ID
- Mobile Number
- RFID UID

---

# Filters

- Gender
- Resident Status
- RFID Status
- Registration Date
- Archived / Active

---

# Sorting

- Name
- Registration Date
- Birthdate

---

# Validation

Required

- First Name
- Last Name
- Birthdate
- Gender
- Address

Optional

- Email
- Emergency Contact

Validate

- Contact number format
- Email format
- Birthdate cannot be in the future

---

# Components

```
resident-table.component

resident-form.component

resident-profile.component

resident-photo.component

resident-status-badge.component

resident-timeline.component

resident-summary-card.component
```

---

# Folder Structure

```
features/

residents/

pages/

list/

create/

edit/

profile/

components/

resident-table/

resident-form/

resident-photo/

resident-summary/

timeline/

services/

resident.facade.ts
```

---

# API Integration

Methods

```
getResidents()

getResident()

createResident()

updateResident()

archiveResident()

restoreResident()

uploadPhoto()
```

---

# Resident Summary Widgets

Display

```
Total Requests

Approved Requests

Released Documents

Assigned RFID

Outstanding Payments
```

---

# Activity Timeline

Examples

```
Resident Registered

RFID Assigned

Document Requested

Request Approved

Payment Recorded

Document Released
```

Display

- Icon
- Description
- Timestamp
- User

---

# Shared Components Used

- Data Table
- Search Bar
- Pagination
- Card
- Status Badge
- Confirmation Dialog
- Snackbar
- Image Upload
- Timeline

---

# Loading State

Display

- Skeleton Table
- Skeleton Profile
- Skeleton Cards

---

# Error Handling

Resident not found

```
Resident record not found.
```

Upload failed

```
Unable to upload profile photo.
```

Validation failed

Display field-specific errors.

---

# Responsive Design

Desktop

- Table + Sidebar Summary

Tablet

- Compact table

Mobile (Future)

- Card-based profile

---

# Role-Based Access

Administrator

- Full access

Secretary

- Create
- Edit
- View

Treasurer

- View only

---

# Future Integration

This module will integrate with:

RFID Module

```
Assign Card
Replace Card
```

Document Requests

```
View Request History

Create Request
```

Kiosk

```
Resident Verification
```

---

# Implementation Checklist

- [ ] Build Resident List
- [ ] Build Register Resident
- [ ] Build Resident Profile
- [ ] Build Edit Resident
- [ ] Implement Archive/Restore
- [ ] Implement Photo Upload
- [ ] Implement Search
- [ ] Implement Filters
- [ ] Implement Pagination
- [ ] Build Activity Timeline
- [ ] Build Resident Summary
- [ ] Connect Resident APIs

---

# Verification

Secretary

Can register a resident.

Administrator

Can archive and restore residents.

Treasurer

Can only view resident information.

Resident profile displays:

- Personal information
- RFID summary
- Recent requests
- Recent payments

---

# Acceptance Criteria

- Resident CRUD operations work correctly.
- Search, filtering, and pagination function properly.
- Resident profile aggregates related information.
- Photo upload works.
- Role permissions are enforced.
- UI follows the shared design system.

---

# Definition of Done

- Resident Management module completed.
- Backend integration verified.
- Profile view operational.
- Ready for RFID Management.

---

# Estimated Effort

12–15 hours

---

# Next Task

**TASK-FRONTEND-008 — RFID Management Module**

---

# Notes for OpenCode

Before implementing:

1. Treat the Resident Profile as the primary workspace for resident-related operations.
2. Reuse shared components such as cards, tables, dialogs, and timelines.
3. Display related summaries (RFID, requests, payments) using separate reusable widgets rather than embedding business logic in the profile component.
4. Use lazy loading for profile subsections if they require multiple API calls.
5. Keep the Resident module independent of RFID operations—the RFID module should extend resident functionality rather than duplicate it.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |