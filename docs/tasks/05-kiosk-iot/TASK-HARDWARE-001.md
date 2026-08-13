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
- Interfaces with ESP8266

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

## ESP8266 (RFID Controller)

Purpose

Hardware Controller

Responsibilities

- RFID Reader
- Hardware Status
- Serial Communication

ESP8266 should **not** perform business logic.

---

## RFID Reader

Purpose

Resident Identification

Functions

- Read RFID UID
- Send UID to ESP8266
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

MySQL Database     ESP8266 Service

                               │

                        Serial Communication

                               │

                            ESP8266

                       │                 │

                RFID Reader        Status LEDs
```

---

# Communication Flow

Resident

↓

Tap RFID Card

↓

ESP8266 Reads UID from MFRC522

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

ESP8266

- RFID Reading
- Device Status

MySQL

- Resident
- Requests
- RFID Mapping

---

# Hardware Services

ESP8266 Service

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

arduino/  (ESP8266 firmware)

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

ESP8266

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

ESP8266

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

ESP8266 Offline

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

ESP8266

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
- [ ] Configure ESP8266 responsibilities
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
- Ready for ESP8266 communication.

---

# Definition of Done

- Hardware architecture approved.
- Foundation for all IoT integrations completed.

---

# Estimated Effort

4–6 hours

---

# Next Task

**TASK-HARDWARE-002 — ESP8266 ↔ Backend Communication**

---

# Notes for OpenCode

Before implementing:

1. Keep ESP8266 firmware lightweight and event-driven; it should only read hardware inputs and send structured messages.
2. Implement a dedicated Node.js hardware service responsible for serial communication so the rest of the backend remains hardware-agnostic.
3. Define a simple, versioned serial protocol (for example, `RFID:<UID>` and `PING`) that can be extended later without breaking compatibility.
4. Design Angular to consume hardware events through backend APIs or WebSockets rather than communicating with the ESP8266 directly.
5. Make all hardware components optional at startup so the IMS can still run in development mode without connected devices.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |