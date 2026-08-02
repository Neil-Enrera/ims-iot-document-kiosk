# TASK-HARDWARE-001 — Hardware Architecture & System Integration

> **Phase:** Hardware & Kiosk
> **Task ID:** TASK-HARDWARE-001
> **Priority:** P0 (Critical)
> **Status:** Done

---

# Objective

Design and implement the complete hardware architecture for the IoT-Assisted Document Request Services Kiosk.

This task defines how all physical devices communicate with the Angular frontend, Express backend, and MySQL database.

It serves as the blueprint for every remaining hardware task.

---

# Hardware Components

## Kiosk Computer

Responsibilities

- Runs Angular application
- Controls kiosk session
- Communicates with backend
- Interfaces with Arduino

Recommended

```
Mini PC

OR

Standard PC
```

---

## Touchscreen Monitor

Purpose

Resident interaction

Functions

- Service Selection
- Resident Information
- Confirmation Screens
- Camera Preview

---

## Arduino Uno

Purpose

Hardware Controller

Responsibilities

- RFID Reader
- Hardware Status
- Serial Communication

Arduino should **not** perform business logic.

---

## RFID Reader

Purpose

Resident Identification

Functions

- Read RFID UID
- Send UID to Arduino
- Forward UID to Backend

Supported

```
MFRC522
```

---

## RFID Cards

Purpose

Resident Authentication

Each card contains

```
Unique UID
```

UID maps to

```
Resident

↓

Database
```

---

## Webcam

Purpose

Resident Photo Capture

Functions

- Live Preview
- Capture Image
- Save Request Photo

Browser API

```
MediaDevices.getUserMedia()
```

---

## Printer

Purpose

Print

- Request Receipts (Optional)
- Generated Barangay Documents (Future)

---

# Overall Architecture

```
                    Resident

                       │

                 Touchscreen

                       │

              Angular Kiosk UI

                       │

                Express Backend

                 │            │

           MySQL Database     Arduino Service

                               │

                        Serial Communication

                               │

                           Arduino Uno

                      │                 │

                RFID Reader        Status LEDs
```

---

# Communication Flow

Resident

↓

Tap RFID Card

↓

Arduino Reads UID

↓

Serial Port

↓

Node.js Hardware Service

↓

Resident Lookup

↓

Angular Receives Resident

↓

Resident Selects Service

↓

Webcam Captures Photo

↓

Request Submitted

---

# Hardware Responsibilities

Angular

- User Interface
- Camera
- Session Management

Node.js

- Hardware APIs
- Business Logic
- Database

Arduino

- RFID Reading
- Device Status

MySQL

- Resident
- Requests
- RFID Mapping

---

# Hardware Services

Arduino Service

Responsibilities

- Listen to Serial Port
- Parse RFID
- Validate Data

RFID Service

Responsibilities

- Match UID
- Return Resident

Kiosk Session

Responsibilities

- Auto Logout
- Timeout
- Session Lock

---

# Folder Structure

```
hardware/

arduino/

firmware/

node/

serial/

controllers/

services/

frontend/

kiosk/

services/

hardware/
```

---

# Communication Protocol

Arduino

↓

Serial

Example

```
RFID:4A8D72E1
```

Backend

↓

JSON

```
{
  "uid":"4A8D72E1",
  "residentId":25,
  "verified":true
}
```

---

# Device Status

Display

RFID Reader

```
Connected

Disconnected
```

Camera

```
Ready

Unavailable
```

Printer

```
Ready

Offline
```

Arduino

```
Connected

Disconnected
```

---

# Error Handling

Unknown RFID

```
Resident not found.
```

Arduino Offline

```
RFID reader unavailable.
```

Camera Error

```
Unable to access camera.
```

Printer Offline

```
Printing unavailable.
```

---

# Security

Arduino

Never stores

- Resident Data
- Personal Information
- Request Data

Only

```
RFID UID
```

Business logic remains on the backend.

---

# Future Expansion

Architecture supports

- Fingerprint Scanner
- QR Scanner
- NFC Reader
- Thermal Printer
- Receipt Printer

without redesigning the system.

---

# Implementation Checklist

- [ ] Finalize hardware architecture
- [ ] Define communication protocol
- [ ] Configure Arduino responsibilities
- [ ] Configure Node hardware services
- [ ] Define Angular hardware services
- [ ] Validate data flow
- [ ] Review security boundaries

---

# Verification

Hardware architecture supports

- RFID authentication
- Camera integration
- Future printer support
- Future hardware expansion

Communication responsibilities are clearly separated.

---

# Acceptance Criteria

- Hardware architecture documented.
- Device responsibilities defined.
- Communication flow validated.
- Security boundaries established.
- Ready for Arduino communication.

---

# Definition of Done

- Hardware architecture approved.
- Foundation for all IoT integrations completed.

---

# Estimated Effort

4–6 hours

---

# Next Task

**TASK-HARDWARE-002 — Arduino ↔ Backend Communication**

---

# Notes for OpenCode

Before implementing:

1. Keep Arduino firmware lightweight and event-driven; it should only read hardware inputs and send structured messages.
2. Implement a dedicated Node.js hardware service responsible for serial communication so the rest of the backend remains hardware-agnostic.
3. Define a simple, versioned serial protocol (for example, `RFID:<UID>` and `PING`) that can be extended later without breaking compatibility.
4. Design Angular to consume hardware events through backend APIs or WebSockets rather than communicating with Arduino directly.
5. Make all hardware components optional at startup so the IMS can still run in development mode without connected devices.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |