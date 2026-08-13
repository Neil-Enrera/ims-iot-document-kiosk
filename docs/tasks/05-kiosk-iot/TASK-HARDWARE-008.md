# TASK-HARDWARE-008 — Hardware Diagnostics & Monitoring

> **Phase:** Hardware & Kiosk
> **Task ID:** TASK-HARDWARE-008
> **Priority:** P1 (High)
> **Status:** Done

---

# Objective

Develop a Hardware Diagnostics & Monitoring module to continuously monitor the health and status of all kiosk hardware components.

The module enables administrators to quickly identify hardware issues, perform basic diagnostics, and verify that the kiosk is ready for resident use.

---

# Background

The kiosk depends on several hardware devices:

- ESP8266
- RFID Reader
- Webcam
- Printer
- Touchscreen Monitor

This module provides a centralized dashboard showing the operational status of each device.

---

# Scope

Included

- Device Status Dashboard
- Hardware Health Monitoring
- Connection Monitoring
- Diagnostic Tests
- Device Logs
- Manual Refresh
- Automatic Status Updates

Not Included

- Remote Firmware Updates
- Hardware Configuration Changes
- Predictive Maintenance

---

# Navigation

```
Administration

↓

Hardware Diagnostics
```

Route

```
/hardware/diagnostics
```

---

# Monitored Devices

ESP8266

- Connection Status
- Serial Port
- Firmware Version (optional)

RFID Reader

- Connected
- Ready
- Last Scan Time

Webcam

- Connected
- Resolution
- Permission Status

Printer

- Online
- Paper Status (if supported)
- Print Queue Status

Touchscreen

- Detected
- Resolution
- Full Screen Mode

---

# Overall Dashboard

Display

```
System Health

95%

Hardware Status

✓ ESP8266 Connected

✓ RFID Ready

✓ Camera Ready

✓ Printer Ready

✓ Touchscreen Active
```

Overall Health

```
Healthy

Warning

Critical
```

---

# Device Status

Each device displays

- Status
- Last Checked
- Connection Type
- Details

Example

```
RFID Reader

Status

Ready

Last Scan

10:32 AM

Connection

USB Serial
```

---

# Status Indicators

Healthy

```
Green
```

Warning

```
Orange
```

Offline

```
Gray
```

Critical

```
Red
```

Icons should accompany colors for accessibility.

---

# Automatic Monitoring

Refresh Interval

```
Every 10 seconds
```

(configurable)

Backend polls or receives events from the Hardware Integration Layer.

---

# Manual Diagnostics

Administrator can run

ESP8266 Test

```
Verify USB Serial Communication
```

RFID Test

```
Scan Test Card
```

Camera Test

```
Capture Test Image
```

Printer Test

```
Print Test Page
```

---

# Backend APIs

Current Status

```
GET

/api/v1/hardware/status
```

Run Diagnostic

```
POST

/api/v1/hardware/diagnostics
```

Response

```json
{
  "device":"RFID",
  "status":"Healthy",
  "details":"Reader responding normally."
}
```

---

# WebSocket Events

```
hardware-connected

hardware-disconnected

hardware-warning

hardware-error

hardware-health-updated
```

Frontend updates immediately when device states change.

---

# Hardware Logs

Record

- Device
- Event
- Status
- Timestamp
- Kiosk ID

Example

```
ESP8266 Connected

10:15 AM
```

```
Printer Offline

11:42 AM
```

---

# Components

Angular

```
hardware-dashboard.component

device-card.component

diagnostic-dialog.component

hardware-status.service.ts
```

Backend

```
hardware-monitor.service.ts

diagnostic.controller.ts

device-status.repository.ts
```

---

# Folder Structure

```
hardware/

monitoring/

services/

hardware-monitor.service.ts

diagnostics/

controllers/

diagnostic.controller.ts

frontend/

features/

hardware/

diagnostics/
```

---

# Error Handling

ESP8266 Disconnected

```
Hardware controller unavailable.
```

RFID Failure

```
Unable to communicate with RFID reader.
```

Camera Failure

```
Camera unavailable.
```

Printer Failure

```
Printer offline.
```

---

# Logging

Record

- Device Name
- Event
- Status
- Diagnostic Result
- Timestamp

All diagnostic actions should also be recorded in the audit log.

---

# Security

Only

```
Administrator
```

may access

- Diagnostics
- Device Logs
- Hardware Tests

Residents never see diagnostic information.

---

# Testing Checklist

- [ ] Detect ESP8266
- [ ] Detect RFID Reader
- [ ] Detect Webcam
- [ ] Detect Printer
- [ ] Display dashboard
- [ ] Run manual diagnostics
- [ ] Receive WebSocket updates
- [ ] Record hardware logs

---

# Acceptance Criteria

- Hardware dashboard displays current device status.
- Device health updates automatically.
- Manual diagnostics execute successfully.
- Hardware events are logged.
- Administrator-only access is enforced.

---

# Definition of Done

- Hardware monitoring operational.
- Diagnostics verified.
- Ready for Kiosk Security & Recovery.

---

# Estimated Effort

8–10 hours

---

# Next Task

**TASK-HARDWARE-009 — Kiosk Security & Recovery**

---

# Notes for OpenCode

Before implementing:

1. Build the diagnostics module on top of the Hardware Integration Layer rather than communicating directly with devices.
2. Use WebSockets for real-time status changes and periodic health checks as a fallback.
3. Treat each hardware device as an independent service so one device failure does not stop the entire kiosk.
4. Keep diagnostic tests read-only whenever possible to avoid changing device state during health checks.
5. Persist hardware events and diagnostic results for troubleshooting and long-term maintenance analysis.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |