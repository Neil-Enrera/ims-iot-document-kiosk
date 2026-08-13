# TASK-FRONTEND-008 — RFID Management Module

> **Phase:** Frontend
> **Task ID:** TASK-FRONTEND-008
> **Priority:** P0 (Critical)
> **Status:** Done

---

# Objective

Develop the RFID Management Module to assign, verify, replace, activate, and deactivate RFID cards associated with resident records.

This module acts as the interface between the Information Management System and the RFID hardware used by the IoT-Assisted Document Request Services Kiosk.

---

# Background

The backend provides RFID APIs:

```
POST   /api/v1/rfid/assign
POST   /api/v1/rfid/verify
PATCH  /api/v1/rfid/replace
PATCH  /api/v1/rfid/deactivate
GET    /api/v1/rfid
GET    /api/v1/rfid/:id
```

Each RFID card should be assigned to **one resident only**.

---

# Scope

Included

- RFID Card List
- Assign RFID Card
- Verify RFID Card
- Replace Lost/Damaged Card
- Activate Card
- Deactivate Card
- RFID History
- Search
- Filters
- Resident RFID Summary

Not Included

- RFID Reader Driver
- ESP8266 Firmware
- Kiosk Touchscreen Logic

Those belong to the Hardware & Kiosk phase.

---

# Navigation

```
Sidebar

↓

Residents

↓

RFID Management
```

Route

```
/rfid
```

---

# RFID Workflow

```
New Resident

↓

Register Resident

↓

Assign RFID Card

↓

Scan RFID UID

↓

Save Assignment

↓

Resident Can Use Kiosk
```

---

# Card Replacement Workflow

```
Resident Reports Lost Card

↓

Deactivate Old Card

↓

Scan New Card

↓

Assign New RFID

↓

Update History
```

---

# Pages

## RFID Card List

Display

- RFID UID
- Resident Name
- Card Status
- Assigned Date
- Last Used
- Actions

Actions

- View
- Verify
- Replace
- Activate
- Deactivate

---

## Assign RFID

Fields

Resident

```
Search Resident
```

RFID UID

```
Auto-filled from scanner
```

Assigned Date

```
Automatic
```

Buttons

```
Assign

Cancel
```

---

## RFID Details

Display

- RFID UID
- Resident Information
- Assignment Date
- Status
- Last Used
- Assignment History

---

## Replace RFID

Display

Old RFID

↓

Scan New RFID

↓

Save

---

# UI Layout

```
+----------------------------------------------------------+

RFID Management

[ Assign RFID ]

-----------------------------------------------------------

Search

Status Filter

-----------------------------------------------------------

| RFID UID | Resident | Status | Last Used | Actions |

-----------------------------------------------------------

Pagination
```

---

# Search

Supports

- RFID UID
- Resident Name
- Resident ID

---

# Filters

- Active
- Inactive
- Lost
- Replaced
- Unassigned

---

# Validation

Before assignment

- Resident must exist.
- RFID UID must be unique.
- Resident must not already have an active RFID card.

Before replacement

- Existing card must be deactivated.
- New RFID UID must not already exist.

---

# Components

```
rfid-table.component

rfid-form.component

rfid-reader-status.component

rfid-history.component

rfid-status-badge.component
```

---

# Folder Structure

```
features/

rfid/

pages/

list/

assign/

replace/

detail/

components/

rfid-table/

rfid-history/

reader-status/

services/

rfid.facade.ts
```

---

# API Integration

Methods

```
getCards()

getCard()

assignCard()

verifyCard()

replaceCard()

activateCard()

deactivateCard()
```

---

# RFID Reader Integration

The frontend should listen for RFID scan events supplied by the backend or desktop bridge.

Workflow

```
Tap RFID Card

↓

Reader Detects UID

↓

Frontend Receives UID

↓

Populate Assignment Form

↓

User Confirms Assignment
```

The frontend should remain hardware-agnostic so different RFID readers can be used in the future.

---

# RFID Status

```
Active

Inactive

Lost

Replaced

Unassigned
```

Display each status using reusable status badges.

---

# Assignment History

Display

- Assigned By
- Assignment Date
- Previous Card
- Replacement Reason
- Status Changes

---

# Shared Components Used

- Data Table
- Search Bar
- Status Badge
- Confirmation Dialog
- Snackbar
- Loading Skeleton

---

# Loading State

Display

- Skeleton Table
- Skeleton Detail
- Reader Status Placeholder

---

# Error Handling

Duplicate RFID

```
RFID card is already assigned.
```

Resident already has an active RFID

```
Resident already has an active RFID card.
```

Reader unavailable

```
RFID reader is not connected.
```

---

# Role-Based Access

Administrator

- Full access

Secretary

- Assign
- Verify
- Replace

Treasurer

- View only

---

# Future Integration

This module integrates with

Resident Management

```
Resident Profile
```

Document Requests

```
Resident Verification
```

Kiosk

```
RFID Login
```

ESP8266

```
RFID Reader Events
```

---

# Implementation Checklist

- [ ] Build RFID Card List
- [ ] Build Assign RFID page
- [ ] Build Replace RFID workflow
- [ ] Build RFID Detail page
- [ ] Connect RFID APIs
- [ ] Integrate RFID scan events
- [ ] Implement search
- [ ] Implement filters
- [ ] Build assignment history
- [ ] Implement role permissions

---

# Verification

Administrator

Can assign, replace, activate, and deactivate cards.

Secretary

Can assign and verify cards.

Treasurer

Can view card information only.

RFID assignment updates the linked Resident Profile.

---

# Acceptance Criteria

- RFID cards can be assigned and replaced.
- RFID verification works through the backend API.
- Search and filtering operate correctly.
- Assignment history is recorded.
- UI follows the shared design system.
- Role-based permissions are enforced.

---

# Definition of Done

- RFID Management module completed.
- Backend integration verified.
- Ready for Service Management.
- Prepared for ESP8266/kiosk integration.

---

# Estimated Effort

10–12 hours

---

# Next Task

**TASK-FRONTEND-009 — Service Management Module**

---

# Notes for OpenCode

Before implementing:

1. Keep RFID reader communication separate from UI logic by introducing an `RfidReaderService`.
2. Design the RFID assignment form so it can accept scanned input automatically or manual UID entry for testing.
3. Record every assignment and replacement in an RFID history component for traceability.
4. Reuse the Resident search component instead of duplicating resident lookup logic.
5. Build the module so it can later connect to your ESP8266-based RFID reader without major UI changes.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |