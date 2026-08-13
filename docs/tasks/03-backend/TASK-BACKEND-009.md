# TASK-BACKEND-009 — RFID Management API

> **Phase:** Backend
> **Task ID:** TASK-BACKEND-009
> **Priority:** P1 (High)
> **Status:** Done

---

# Objective

Develop the RFID Management API to register, assign, verify, and manage RFID cards for residents. This module enables the IoT-assisted kiosk to identify residents quickly and accurately using RFID technology.

---

# Background

The RFID system is one of the key IoT components of the project.

Each resident may be assigned one RFID card, which serves as their identification at the self-service kiosk. When a resident taps their RFID card, the kiosk retrieves their information and allows them to request barangay services.

---

# Scope

## Included

- Register RFID card
- Assign RFID card to a resident
- View RFID information
- Update RFID status
- Replace lost RFID card
- Deactivate RFID card
- Verify RFID card
- Search resident using RFID UID

## Not Included

- ESP8266 communication
- Kiosk interface
- Webcam verification

---

# Dependencies

- TASK-BACKEND-008 — Resident Management API

---

# Database Tables

Use the existing table:

```text
rfid_cards
```

Relationship:

```text
Resident (1)
      │
      │
      ▼
RFID Card (1)
```

Each RFID card belongs to only one resident.

---

# API Endpoints

## Register RFID Card

```http
POST /api/v1/rfid
```

Registers a new RFID UID in the system.

---

## Assign RFID Card

```http
POST /api/v1/rfid/assign
```

Example Request

```json
{
    "residentId": 25,
    "rfidUid": "A1B2C3D4"
}
```

---

## Verify RFID

```http
POST /api/v1/rfid/verify
```

Example Request

```json
{
    "rfidUid": "A1B2C3D4"
}
```

Example Response

```json
{
    "success": true,
    "message": "RFID verified successfully.",
    "data": {
        "resident": {},
        "rfid": {}
    }
}
```

---

## Get RFID Details

```http
GET /api/v1/rfid/:id
```

---

## Get Resident by RFID

```http
GET /api/v1/rfid/uid/:rfidUid
```

Returns the linked resident information.

---

## Update RFID Status

```http
PATCH /api/v1/rfid/:id/status
```

Status examples:

- Active
- Inactive
- Lost
- Replaced

---

## Replace RFID

```http
PATCH /api/v1/rfid/:id/replace
```

Deactivates the old card and assigns a new RFID UID.

---

# Business Rules

- One resident can have only one active RFID card.
- One RFID UID can belong to only one resident.
- Duplicate RFID UIDs are not allowed.
- Lost cards must be deactivated before replacement.
- Only active RFID cards can be used at the kiosk.

---

# Validation Rules

- RFID UID must be unique.
- Resident must exist.
- Resident cannot have multiple active RFID cards.
- Inactive cards cannot be verified.

---

# Authorization

| Action | Allowed Roles |
|---------|---------------|
| View RFID | Administrator, Secretary |
| Register RFID | Administrator, Secretary |
| Assign RFID | Administrator, Secretary |
| Replace RFID | Administrator |
| Deactivate RFID | Administrator |

---

# Folder Structure

```text
backend/src/

controllers/
    rfid.controller.js

services/
    rfid.service.js

repositories/
    rfid.repository.js

routes/
    rfid.routes.js

validations/
    rfid.validation.js
```

---

# Files to Create

```text
controllers/rfid.controller.js
services/rfid.service.js
repositories/rfid.repository.js
routes/rfid.routes.js
validations/rfid.validation.js
```

---

# Files to Modify

```text
routes/api.js
```

Register the RFID routes.

---

# Kiosk Integration

The kiosk will call:

```http
POST /api/v1/rfid/verify
```

Flow:

```text
Resident taps RFID
        │
        ▼
ESP8266 reads UID
        │
        ▼
Backend verifies RFID
        │
        ▼
Resident information returned
        │
        ▼
Kiosk displays available services
```

---

# Implementation Checklist

- [ ] Register RFID cards
- [ ] Assign RFID to residents
- [ ] Prevent duplicate RFID UIDs
- [ ] Verify RFID cards
- [ ] Replace lost RFID cards
- [ ] Update RFID status
- [ ] Protect endpoints using JWT and RBAC
- [ ] Test all RFID workflows

---

# Verification

### Verify RFID

```http
POST /api/v1/rfid/verify
```

Expected:

- Resident information returned for active cards.
- Error returned for inactive or unknown cards.

---

### Duplicate RFID

Attempt to assign an existing RFID UID.

Expected:

```http
409 Conflict
```

---

# Acceptance Criteria

- RFID cards can be registered and assigned.
- Resident lookup by RFID works.
- Duplicate cards are prevented.
- Lost and replaced cards are handled correctly.
- API follows project response standards.

---

# Definition of Done

- RFID Management API completed.
- Resident lookup operational.
- RFID verification tested.
- Ready for kiosk integration.

---

# Estimated Effort

4–6 hours

---

# Next Task

**TASK-BACKEND-010 — Service Management API**

---

# Notes for OpenCode

Before implementing:

1. Use the existing `rfid_cards` and `residents` tables.
2. Keep RFID verification logic in the service layer.
3. Enforce one active RFID card per resident.
4. Ensure all verification responses follow the standardized API format.
5. Design the module so the ESP8266 kiosk can consume it without additional backend changes.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |