# TASK-HARDWARE-009 — Kiosk Security & Recovery

> **Phase:** Hardware & Kiosk
> **Task ID:** TASK-HARDWARE-009
> **Priority:** P0 (Critical)
> **Status:** Done

---

# Objective

Implement security controls and automatic recovery mechanisms that ensure the kiosk remains secure, reliable, and ready for the next resident even after unexpected interruptions.

The kiosk must always return to a safe and idle state without exposing resident information.

---

# Background

A public kiosk is exposed to risks such as:

- Resident walking away
- Browser refresh
- Power interruption
- Network disconnection
- Hardware failure
- Application crash

The system must recover safely while protecting resident data.

---

# Scope

Included

- Session Recovery
- Automatic Session Cleanup
- Idle Timeout
- Browser Refresh Recovery
- Hardware Failure Recovery
- Network Recovery
- Safe Restart
- Security Restrictions

Not Included

- Full Disk Encryption
- BIOS Security
- Operating System Hardening

---

# Recovery Workflow

```
Resident Using Kiosk

↓

Unexpected Event

↓

Detect Failure

↓

Determine Recovery Action

↓

Clear Session

↓

Reset Hardware

↓

Return Idle Screen
```

---

# Recovery Events

Session Timeout

```
Clear Session

↓

Return Idle
```

Browser Refresh

```
Check Session

↓

Resume

OR

Reset
```

Network Failure

```
Retry Connection

↓

Continue

OR

Return Idle
```

Arduino Disconnect

```
Disable RFID

↓

Show Warning

↓

Reconnect Automatically
```

Power Restart

```
Application Starts

↓

Health Check

↓

Idle Screen
```

---

# Session Security

Resident sessions

Must

- Expire automatically
- Never survive logout
- Never expose previous resident information

Stored

```
Memory Only
```

No resident session should persist after completion.

---

# Automatic Cleanup

After

- Request Submitted
- Timeout
- Browser Closed
- Hardware Failure

Perform

```
Clear Session

Clear Resident Data

Stop Camera

Reset Wizard

Disconnect Streams

Return Idle
```

---

# Browser Refresh

If browser refresh occurs

Backend checks

```
Session Valid?
```

YES

```
Resume Current Step
```

NO

```
Clear Everything

Return Idle
```

---

# Network Recovery

States

```
Connected

↓

Disconnected

↓

Reconnecting

↓

Connected
```

Retry Interval

```
Every 5 seconds
```

Maximum retries configurable in System Settings.

---

# Hardware Recovery

Monitor

- Arduino
- RFID
- Camera
- Printer

If device reconnects

Automatically restore service without restarting the application.

---

# Security Restrictions

Residents cannot

- Access browser controls
- Open developer tools (where kiosk software allows)
- Navigate away from kiosk pages
- Access administrative routes
- View previous requests

Administrative maintenance should require authenticated staff access.

---

# Error Screens

Network Lost

```
Connection Lost

Reconnecting...
```

Hardware Failure

```
Hardware Unavailable

Please wait...
```

Session Expired

```
Session Expired

Please scan your RFID card again.
```

Unexpected Error

```
Unexpected Error

Returning to Home...
```

---

# Kiosk Lockdown

When running in kiosk mode

- Full Screen
- Disable browser navigation (where supported)
- Hide address bar (browser configuration)
- Prevent route manipulation through application guards
- Restrict access to administrative modules

---

# Backend APIs

Check Session

```
GET

/api/v1/kiosk/session
```

Terminate Session

```
DELETE

/api/v1/kiosk/session
```

Health Check

```
GET

/api/v1/hardware/status
```

---

# Components

Angular

```
session-recovery.service.ts

idle-monitor.service.ts

network-monitor.service.ts

error-screen.component

kiosk-guard.ts
```

Backend

```
session.service.ts

health.controller.ts

recovery.service.ts
```

---

# Folder Structure

```
frontend/

features/

kiosk/

security/

services/

session-recovery.service.ts

idle-monitor.service.ts

network-monitor.service.ts

guards/

kiosk.guard.ts

components/

error-screen/
```

---

# Logging

Record

- Session Timeout
- Session Recovery
- Browser Refresh
- Hardware Recovery
- Network Recovery
- Unexpected Errors

Include

- Timestamp
- Kiosk ID
- Recovery Result

---

# Testing Checklist

- [ ] Session timeout
- [ ] Browser refresh
- [ ] Network disconnect
- [ ] Network reconnect
- [ ] Arduino disconnect
- [ ] Arduino reconnect
- [ ] Camera recovery
- [ ] Printer recovery
- [ ] Automatic cleanup
- [ ] Return to idle

---

# Acceptance Criteria

- Resident data is cleared after every session.
- Network interruptions recover automatically.
- Hardware reconnection works without restarting the application.
- Browser refresh resumes or safely resets the session.
- Kiosk always returns to a secure idle state.

---

# Definition of Done

- Kiosk security mechanisms implemented.
- Recovery workflows verified.
- System ready for full end-to-end testing.

---

# Estimated Effort

8–10 hours

---

# Next Task

**TASK-HARDWARE-010 — End-to-End Hardware Testing**

---

# Notes for OpenCode

Before implementing:

1. Treat the kiosk as an always-on application and design every failure path to return to a known safe state.
2. Store resident session data only in memory whenever possible, minimizing persistent client-side storage.
3. Separate recovery logic into dedicated services (network, session, hardware) to simplify testing and maintenance.
4. Ensure all cleanup routines stop hardware resources such as the webcam and clear sensitive data before returning to the idle screen.
5. Configure the kiosk to launch automatically after system startup and open directly in full-screen kiosk mode during deployment.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |