# TASK-TESTING-006 — Kiosk & IoT Integration Testing

> **Phase:** Testing
> **Task ID:** TASK-TESTING-006
> **Priority:** P0 (Critical)
> **Status:** DONE

---

# Objective

Verify that the IoT hardware components and kiosk application work together seamlessly with the Information Management System.

This testing ensures that hardware devices communicate correctly with the backend, frontend, and database to support the complete document request workflow.

---

# Background

Unlike unit and API testing, integration testing validates the interaction between multiple components.

For this project, the following hardware devices must communicate correctly with the kiosk application:

- Arduino Uno
- MFRC522 RFID Reader
- Webcam
- Printer
- Touchscreen Monitor

The objective is to ensure that every hardware event produces the expected software response.

---

# Scope

## Included

- Arduino Communication
- RFID Reader Integration
- Resident Verification
- Webcam Integration
- Queue Slip Printing
- Hardware Status Monitoring
- Session Management
- Database Synchronization
- Error Recovery

---

## Not Included

- User Acceptance Testing
- Performance Stress Testing
- Security Penetration Testing

---

# Hardware Components

## Arduino Uno

Verify

- USB Connection
- Serial Communication
- Automatic Reconnection

---

## RFID Reader

Verify

- Card Detection
- UID Transmission
- Invalid Card Handling
- Duplicate Scan Prevention

---

## Webcam

Verify

- Camera Detection
- Live Preview
- Image Capture
- Image Upload

---

## Printer

Verify

- Queue Slip Printing
- Printer Status
- Offline Detection
- Print Failure Recovery

---

## Touchscreen

Verify

- Touch Input
- Navigation
- Full Screen Mode

---

# Integration Workflow

```
Resident

↓

Tap RFID Card

↓

Arduino Reads UID

↓

Backend Receives UID

↓

Resident Lookup

↓

Angular Displays Resident

↓

Resident Selects Service

↓

Camera Captures Photo

↓

Submit Request

↓

Database Saves Request

↓

Queue Slip Printed

↓

Session Ends

↓

Idle Screen
```

Every step should complete successfully without manual intervention.

---

# Integration Test Categories

## RFID Integration

Verify

- Registered RFID
- Unregistered RFID
- Inactive RFID
- Duplicate Scan

---

## Camera Integration

Verify

- Camera Available
- Capture Successful
- Upload Successful
- Camera Error

---

## Printer Integration

Verify

- Queue Slip Printed
- Printer Offline
- Paper Empty
- Print Retry

---

## Session Integration

Verify

- Session Creation
- Session Timeout
- Session Cleanup
- Return to Idle

---

## Database Integration

Verify

After request submission

Database should contain

- Resident ID
- Service ID
- Photo ID
- Request Record
- Audit Log

---

# Integration Testing Workflow

```
Prepare Hardware

↓

Initialize System

↓

Execute Workflow

↓

Verify Hardware Response

↓

Verify Software Response

↓

Verify Database

↓

Pass?

↓

YES

↓

Record Result

↓

NO

↓

Fix

↓

Retest
```

---

# Testing Environment

Hardware

```
Arduino Uno

MFRC522 RFID Reader

USB Webcam

USB Printer

Touchscreen Display
```

Software

```
Angular

Node.js

Express

MySQL
```

---

# Test Data

Residents

```
Juan Dela Cruz

Maria Santos
```

RFID

```
UID-0001

UID-0002
```

Services

```
Barangay Clearance

Certificate of Residency
```

---

# Folder Structure

```
hardware/

tests/

integration/

arduino/

rfid/

camera/

printer/

session/

database/
```

Documentation

```
docs/

testing/

kiosk-iot/

test-cases/

reports/
```

---

# Test Case Format

Each integration test should include

```
Test ID

Hardware

Scenario

Preconditions

Steps

Expected Result

Actual Result

Status

Remarks
```

---

# Naming Convention

```
INT-RFID-001

INT-CAM-001

INT-PRINT-001

INT-SESSION-001

INT-HARDWARE-001
```

---

# Error Handling

Verify

- Arduino Disconnected
- RFID Not Detected
- Camera Failure
- Printer Offline
- Network Loss
- Database Unavailable

The kiosk should display clear messages and recover gracefully where possible.

---

# Logging

Record

- Test ID
- Hardware Device
- Workflow Step
- Result
- Execution Time
- Tester
- Date

---

# Testing Checklist

Arduino

- [ ] Serial Connection
- [ ] Auto Reconnect

RFID

- [ ] Valid Card
- [ ] Invalid Card
- [ ] Duplicate Scan

Camera

- [ ] Preview
- [ ] Capture
- [ ] Upload

Printer

- [ ] Print Queue Slip
- [ ] Offline Handling

Session

- [ ] Login
- [ ] Timeout
- [ ] Cleanup

Database

- [ ] Request Saved
- [ ] Photo Linked
- [ ] Audit Log Created

---

# Acceptance Criteria

- Arduino communicates with the backend successfully.
- RFID reader correctly identifies registered residents.
- Webcam captures and uploads images.
- Queue slips print correctly.
- Database records are created accurately.
- Kiosk returns to the idle screen after session completion.
- Hardware failures are handled gracefully.

---

# Definition of Done

- All hardware devices successfully integrated.
- End-to-end kiosk workflow verified.
- Test reports documented.
- Ready for End-to-End System Integration Testing.

---

# Estimated Effort

8–10 hours

---

# Next Task

**TASK-TESTING-007 — End-to-End System Integration Testing**

---

# Notes for OpenCode

Before implementing:

1. Test using the actual hardware whenever possible instead of simulated devices.
2. Execute each integration scenario multiple times to verify consistency and stability.
3. Record serial communication logs from the Arduino during testing to assist with troubleshooting.
4. Validate both hardware behavior and resulting database records after each workflow.
5. Keep hardware connected throughout the test session to identify intermittent communication issues.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| 2026-07-31 | OpenCode | Task Completed |