# TASK-HARDWARE-005 — Kiosk Authentication Flow

> **Phase:** Hardware & Kiosk
> **Task ID:** TASK-HARDWARE-005
> **Priority:** P0 (Critical)
> **Status:** Deferred (Hardware Pending)

---

# Deferred Notice

RFID-based kiosk authentication is **temporarily disabled** pending hardware procurement. The kiosk currently uses manual resident selection (search by name/code) instead of RFID tap. All RFID authentication code remains intact and can be re-enabled by setting `KIOSK_RFID_ENABLED=true` in the backend `.env` file.

---

# Objective

Implement the complete authentication flow for the self-service kiosk using RFID-based resident identification.

The authentication flow establishes a secure kiosk session, verifies the resident, prepares the kiosk for document requests, and automatically terminates inactive sessions.

---

# Background

Authentication for the kiosk is different from the staff login system.

Staff

```
Username

Password

JWT
```

Residents

```
RFID Card

↓

Resident Verification

↓

Temporary Kiosk Session
```

No passwords are required for residents.

---

# Scope

Included

- RFID Authentication
- Resident Verification
- Session Creation
- Session Timeout
- Auto Logout
- Session Reset
- Authentication Error Handling

Not Included

- Staff Login
- Fingerprint Authentication
- Face Recognition
- QR Login

---

# Authentication Flow

```
Idle Screen

↓

Tap RFID Card

↓

Arduino Reads UID

↓

Backend Verification

↓

Resident Found?

↓

YES

↓

Create Kiosk Session

↓

Display Resident Information

↓

Proceed to Service Selection

↓

NO

↓

Display Error

↓

Return to Idle
```

---

# Session Lifecycle

```
Idle

↓

Authenticating

↓

Authenticated

↓

Selecting Service

↓

Submitting Request

↓

Session Completed

↓

Return to Idle
```

---

# Kiosk Session

Created after

```
Resident Verified
```

Session contains

```
Session ID

Resident ID

Resident Name

Login Time

Expiration Time

Current Step
```

---

# Session Timeout

Default

```
5 Minutes
```

If inactive

```
Session Expired

↓

Clear Resident Data

↓

Stop Camera

↓

Return Idle Screen
```

Timeout value should be configurable from the System Settings module.

---

# Resident Verification

Backend validates

- RFID exists
- RFID active
- Resident active
- Resident not archived

If successful

Return

```json
{
    "verified":true,
    "resident":{
        "id":25,
        "name":"Juan Dela Cruz",
        "photo":"resident.jpg"
    }
}
```

---

# Kiosk Welcome Screen

Display

```
Welcome

Juan Dela Cruz
```

Show

- Resident Photo
- Resident Name
- Current Date
- Available Services

---

# Authentication Errors

Unknown Card

```
RFID card not registered.
```

Inactive Card

```
RFID card inactive.
```

Archived Resident

```
Resident account unavailable.
```

Connection Lost

```
Unable to verify resident.
```

---

# Session Recovery

If

```
Browser Refresh
```

Backend checks

```
Session Valid?
```

YES

```
Resume Session
```

NO

```
Return Idle
```

---

# Auto Logout

Occurs when

- Session Timeout
- Request Completed
- Administrator Reset
- Hardware Failure

Actions

```
Clear Memory

Stop Camera

Reset UI

Return Idle
```

---

# WebSocket Events

Backend emits

```
session-created

session-expired

session-ended

resident-authenticated
```

Frontend updates immediately.

---

# Components

Angular

```
kiosk-session.service.ts

authentication.service.ts

idle-screen.component

welcome-screen.component

session-timeout.component
```

Backend

```
kiosk-session.service.ts

authentication.controller.ts

session.repository.ts
```

---

# Folder Structure

```
frontend/

features/

kiosk/

authentication/

components/

idle-screen/

welcome-screen/

session-timeout/

services/

kiosk-session.service.ts
```

---

# State Diagram

```
Idle

↓

Reading RFID

↓

Authenticating

↓

Authenticated

↓

Service Selection

↓

Photo Capture

↓

Request Submission

↓

Completed

↓

Idle
```

---

# Security

Resident session

- Exists only during kiosk use
- Automatically expires
- Cannot access staff modules
- Cannot access administration
- Cannot modify resident profile

---

# Logging

Record

- Session Start
- Session End
- Authentication Success
- Authentication Failure
- Timeout
- Kiosk ID

---

# Testing Checklist

- [ ] Authenticate valid RFID
- [ ] Reject unknown RFID
- [ ] Reject inactive card
- [ ] Create session
- [ ] Resume session after refresh
- [ ] Auto logout after timeout
- [ ] Reset kiosk correctly
- [ ] Log authentication events

---

# Acceptance Criteria

- Residents authenticate successfully using RFID.
- Sessions are created and destroyed correctly.
- Timeouts return the kiosk to the idle screen.
- Authentication errors are displayed clearly.
- Session events are logged.
- Unauthorized access is prevented.

---

# Definition of Done

- Kiosk authentication fully operational.
- Resident sessions managed securely.
- Ready for the document request workflow.

---

# Estimated Effort

8–10 hours

---

# Next Task

**TASK-HARDWARE-006 — Document Request Kiosk Workflow**

---

# Notes for OpenCode

Before implementing:

1. Use a dedicated `KioskSessionService` to manage the resident session independently from staff authentication.
2. Store only the minimum information required for the active kiosk session; retrieve additional data from the backend when needed.
3. Automatically terminate the session after request completion, timeout, or hardware failure to prevent unauthorized access.
4. Ensure every authentication attempt (successful or failed) is recorded in the audit logs with the kiosk identifier.
5. Design the session flow as a finite state machine (Idle → Authenticating → Authenticated → Request → Completed → Idle) to simplify maintenance and future enhancements.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |