# TASK-HARDWARE-003 — RFID Reader Integration

> **Phase:** Hardware & Kiosk
> **Task ID:** TASK-HARDWARE-003
> **Priority:** P0 (Critical)
> **Status:** Deferred (Hardware Pending)

---

# Deferred Notice

RFID card verification is **temporarily disabled** pending hardware procurement. The kiosk currently uses manual resident selection (search by name/code). All RFID code remains intact and can be re-enabled by setting `KIOSK_RFID_ENABLED=true` in the backend `.env` file.

---

# Objective

Integrate the MFRC522 RFID Reader with the Arduino Uno, Express backend, MySQL database, and Angular kiosk to enable resident identification through RFID cards.

The RFID reader serves as the primary authentication mechanism for residents using the self-service kiosk.

---

# Background

The Arduino detects an RFID card and sends only its UID to the backend.

The backend validates the UID, retrieves the resident's information, and returns the result to the kiosk.

Business logic remains entirely in the backend.

---

# Scope

Included

- MFRC522 Integration
- RFID Card Detection
- UID Transmission
- Resident Lookup
- Unknown Card Handling
- Active/Inactive Card Validation
- Real-Time UI Updates

Not Included

- Fingerprint Authentication
- QR Code Authentication
- Face Recognition

---

# Hardware Components

Arduino Uno

↓

MFRC522 RFID Reader

↓

RFID Card

---

# Wiring

MFRC522

```
SDA   → D10

SCK   → D13

MOSI  → D11

MISO  → D12

IRQ   → Not Used

GND   → GND

RST   → D9

3.3V  → 3.3V
```

---

# Arduino Responsibilities

Read RFID UID

↓

Send UID

↓

Wait for next scan

Arduino must NOT

- Store resident information
- Validate residents
- Decide permissions
- Access the database

---

# Communication Flow

```
Resident

↓

Tap RFID Card

↓

MFRC522

↓

Arduino

↓

Serial

↓

Node.js Hardware Service

↓

RFID Service

↓

Database

↓

Resident Found?

↓

YES

↓

Angular Kiosk

↓

Welcome Resident

↓

Proceed to Service Selection

↓

NO

↓

Display Error
```

---

# RFID Database

Table

```
rfid_cards
```

Example

| UID | Resident | Status |
|------|----------|---------|
|4A8D72E1|Resident #25|Active|
|9C12AB55|Resident #52|Inactive|

---

# Validation Rules

Verify

- Card exists
- Card is active
- Resident exists
- Resident is active

---

# Backend APIs

Lookup Card

```
POST

/api/v1/rfid/scan
```

Request

```json
{
    "uid":"4A8D72E1"
}
```

Response

```json
{
    "verified":true,
    "resident":{
        "id":25,
        "name":"Juan Dela Cruz",
        "photo":"photo.jpg"
    }
}
```

Unknown Card

```json
{
    "verified":false,
    "message":"RFID card not registered."
}
```

Inactive Card

```json
{
    "verified":false,
    "message":"RFID card is inactive."
}
```

---

# WebSocket Event

Backend emits

```
rfid-scan
```

Payload

```json
{
  "uid":"4A8D72E1",
  "verified":true
}
```

Angular immediately updates the kiosk UI.

---

# Kiosk UI

Idle Screen

```
Please Tap Your RFID Card
```

Card Detected

```
Reading RFID...
```

Resident Verified

```
Welcome

Juan Dela Cruz
```

Unknown Card

```
RFID Card Not Registered
```

Inactive Card

```
RFID Card Inactive
```

---

# Session Rules

Successful Scan

- Start kiosk session
- Load resident profile
- Allow service selection

Failed Scan

- Return to idle screen
- Do not create a session

---

# Security

The UID is

- Validated server-side
- Never trusted by itself
- Logged for auditing

Sensitive resident information is returned only after successful verification.

---

# Logging

Record

- RFID Scan
- Resident ID
- Scan Time
- Result
- Kiosk ID

Example

```
RFID Scan

UID

Resident

Success

Timestamp
```

---

# Error Handling

Unknown UID

```
RFID card not registered.
```

Inactive Card

```
Card is inactive.
```

Duplicate Scan

Ignore repeated scans within

```
3 seconds
```

Reader Offline

```
RFID reader unavailable.
```

---

# Components

Backend

```
rfid.service.ts

rfid.controller.ts

rfid.repository.ts
```

Frontend

```
kiosk-rfid.service.ts

rfid-status.component

resident-preview.component
```

Arduino

```
rfid_reader.ino
```

---

# Folder Structure

```
hardware/

arduino/

rfid_reader.ino

backend/

modules/

rfid/

frontend/

features/

kiosk/

rfid/
```

---

# Testing Checklist

- [ ] Detect RFID card
- [ ] Read UID correctly
- [ ] Send UID to backend
- [ ] Lookup resident
- [ ] Handle unknown card
- [ ] Handle inactive card
- [ ] Start kiosk session
- [ ] Ignore duplicate scans
- [ ] Log RFID events

---

# Acceptance Criteria

- RFID reader detects cards reliably.
- Backend validates UID correctly.
- Registered residents are identified.
- Unknown and inactive cards are handled gracefully.
- Kiosk UI updates in real time.
- Scan events are recorded in audit logs.

---

# Definition of Done

- RFID authentication fully operational.
- Resident identification completed through RFID.
- Ready for webcam integration.

---

# Estimated Effort

8–10 hours

---

# Next Task

**TASK-HARDWARE-004 — Webcam Integration**

---

# Notes for OpenCode

Before implementing:

1. Debounce RFID scans by ignoring repeated reads of the same UID within a short configurable interval (for example, 3 seconds).
2. Perform all resident validation on the backend; Arduino should only transmit the UID.
3. Use WebSockets to immediately notify the kiosk when a scan has been processed and whether it succeeded.
4. Log every scan attempt, including unsuccessful ones, to support troubleshooting and auditing.
5. Keep the RFID module independent of the kiosk workflow so it can later be reused for staff attendance or access control if needed.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |