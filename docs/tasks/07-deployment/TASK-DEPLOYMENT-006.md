# TASK-DEPLOYMENT-006 — Kiosk Deployment & Hardware Configuration

> **Phase:** Deployment
> **Task ID:** TASK-DEPLOYMENT-006
> **Priority:** P0 (Critical)
> **Status:** DONE

---

# Objective

Deploy, install, and configure the self-service kiosk hardware for the Information Management System with IoT-Assisted Document Request Services Kiosk.

This task ensures that all hardware components are correctly installed, connected, configured, and verified before the system becomes operational.

---

# Background

The kiosk serves as the primary interaction point for residents requesting barangay documents.

Unlike the Information Management System used by barangay staff, the kiosk must operate continuously, provide a simple user experience, and communicate reliably with the backend server.

The deployment includes both physical installation and software configuration.

---

# Scope

## Included

- Touchscreen Installation
- Arduino Deployment
- RFID Reader Installation
- Webcam Installation
- Queue Slip Printer Installation
- USB Device Configuration
- Kiosk Browser Configuration
- Hardware Communication Verification
- Resident Workflow Verification

---

## Not Included

- Production Go-Live
- Backup Configuration
- System Handover

---

# Kiosk Architecture

```
                 Resident

                    │

                    ▼

          Touchscreen Monitor

                    │

                    ▼

          Angular Kiosk Interface

                    │

                    ▼

             Express Backend

                    │

                    ▼

              MySQL Database

                    ▲

                    │

      ┌─────────────┼─────────────┐

      ▼             ▼             ▼

 Arduino Uno   RFID Reader   USB Webcam

                    │

                    ▼

            Queue Slip Printer
```

---

# Hardware Components

## Touchscreen Monitor

Purpose

```
Resident User Interface
```

Verify

- Touch input
- Full-screen display
- Correct resolution
- Stable power

---

## Arduino Uno

Purpose

```
Hardware Controller
```

Verify

- USB connection
- Serial communication
- Automatic detection

Expected

```
COM Port Detected
```

---

## MFRC522 RFID Reader

Purpose

```
Resident Authentication
```

Verify

- Card detection
- UID reading
- Multiple consecutive scans
- Invalid card handling

Expected

```
UID transmitted successfully.
```

---

## USB Webcam

Purpose

```
Resident Photo Capture
```

Verify

- Camera detected
- Live preview
- Photo capture
- Upload to backend

---

## Queue Slip Printer

Purpose

```
Print Request Acknowledgement
```

Verify

- Printer connected
- Paper loaded
- Test print successful
- Queue slip formatting

---

# Hardware Connections

```
Touchscreen

↓

USB

↓

Kiosk Computer

↓

Arduino Uno

↓

RFID Reader

↓

USB Webcam

↓

USB Printer
```

All USB devices should be recognized by Windows.

---

# Arduino Configuration

Verify

- Correct firmware uploaded
- Serial baud rate configured
- Stable communication
- Auto reconnect

Recommended Baud Rate

```
115200
```

---

# Browser Configuration

Recommended Browser

```
Google Chrome
```

Configure

- Full-screen mode
- Auto start on Windows login
- Disable address bar
- Disable unnecessary extensions
- Disable screen timeout

---

# Kiosk Startup Workflow

```
Windows Startup

↓

Chrome Launch

↓

Angular Kiosk

↓

Connect Backend

↓

Connect Arduino

↓

Initialize RFID

↓

Initialize Camera

↓

Ready Screen
```

---

# Resident Workflow Verification

Resident

↓

Tap RFID Card

↓

Resident Information Displayed

↓

Select Service

↓

Capture Photo

↓

Review Request

↓

Submit Request

↓

Queue Slip Printed

↓

Return to Idle Screen

Every step should complete without errors.

---

# Hardware Validation Checklist

Touchscreen

- [ ] Touch input
- [ ] Display resolution

Arduino

- [ ] Connected
- [ ] Serial communication

RFID Reader

- [ ] Reads registered cards
- [ ] Rejects invalid cards

Webcam

- [ ] Live preview
- [ ] Image capture
- [ ] Upload successful

Printer

- [ ] Test print
- [ ] Queue slip printed

Browser

- [ ] Full screen
- [ ] Auto launch

Backend

- [ ] API reachable

Database

- [ ] Request saved successfully

---

# Deployment Workflow

```
Install Hardware

↓

Connect USB Devices

↓

Configure Arduino

↓

Configure Browser

↓

Start Kiosk

↓

Verify Hardware

↓

Verify Backend

↓

Verify Resident Workflow

↓

Ready for Production Verification
```

---

# Folder Structure

```
hardware/

arduino/

firmware/

drivers/

configuration/

printer/

camera/

rfid/

verification/
```

Documentation

```
docs/

deployment/

kiosk/

installation.md

hardware.md

verification.md
```

---

# Deliverables

- Installed Touchscreen
- Configured Arduino
- Operational RFID Reader
- Operational Webcam
- Operational Printer
- Configured Kiosk Browser
- Hardware Verification Report

---

# Acceptance Criteria

Deployment is successful when:

- All hardware devices are detected.
- RFID reader authenticates registered residents.
- Webcam captures resident photos.
- Queue slip printer prints successfully.
- Angular kiosk communicates with the backend.
- Resident workflow completes without errors.

---

# Definition of Done

- Hardware installed.
- Arduino configured.
- RFID operational.
- Webcam operational.
- Printer operational.
- Kiosk browser configured.
- Resident workflow verified.
- Ready for Production Verification & Go-Live.

---

# Estimated Effort

**4–6 hours**

---

# Next Task

**TASK-DEPLOYMENT-007 — Production Verification & Go-Live**

---

# Notes for OpenCode

Before implementing:

1. Label every USB connection (Arduino, RFID reader, webcam, and printer) to simplify maintenance and replacement.
2. Configure the kiosk application to automatically recover if the backend connection or Arduino serial connection is temporarily lost.
3. Verify the entire resident workflow multiple times using different RFID cards before declaring the kiosk ready for production.
4. Secure the kiosk hardware by routing cables internally or through protective conduits to reduce accidental disconnection or tampering.
5. Record hardware model numbers, serial numbers, and COM port assignments in the deployment documentation for future troubleshooting.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| 2026-07-31 | OpenCode | Task Completed |