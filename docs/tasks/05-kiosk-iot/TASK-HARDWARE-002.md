# TASK-HARDWARE-002 — ESP8266 ↔ Backend Communication

> **Phase:** Hardware & Kiosk
> **Task ID:** TASK-HARDWARE-002
> **Priority:** P0 (Critical)
> **Status:** Done

---

# Objective

Implement reliable communication between the ESP8266 and the Express backend using USB serial communication.

The backend will act as the gateway between the hardware devices and the Information Management System, ensuring that hardware events are translated into business operations.

---

# Background

The ESP8266 is responsible only for hardware interaction.

Business logic remains entirely within the backend.

Communication flow:

```
ESP8266

↓

Serial Port

↓

Node.js Hardware Service

↓

Backend Services

↓

Database

↓

Angular Kiosk
```

---

# Scope

Included

- Serial Communication
- ESP8266 Event Listener
- Device Connection Detection
- RFID UID Transmission
- Heartbeat Monitoring
- Error Handling
- Hardware Event Broadcasting

Not Included

- RFID Validation
- Camera
- Printer
- Resident Authentication

---

# Hardware

Controller

```
ESP8266
```

Communication

```
USB Serial
```

Library

```
serialport (Node.js)
```

---

# Node.js Components

Hardware Module

```
hardware/

serial/

serial.service.ts

serial.controller.ts

serial.events.ts
```

Responsibilities

- Detect ESP8266
- Open Serial Port
- Read Messages
- Parse Events
- Broadcast Events
- Auto Reconnect

---

# ESP8266 Responsibilities

Only

- Read UID from MFRC522 reader
- Send UID to kiosk over USB serial
- Send Status
- Respond to Ping

ESP8266 does NOT

- Query Database
- Validate Resident
- Store Resident Data
- Generate Requests

---

# Serial Protocol

Protocol Version

```
v1
```

---

## RFID Event

ESP8266 Sends

```
RFID:4A8D72E1
```

Backend Converts

```json
{
  "event": "RFID_SCAN",
  "uid": "4A8D72E1"
}
```

---

## Heartbeat

ESP8266

```
PING
```

Backend

```
PONG
```

Used for

- Connection Monitoring
- Health Checking

---

## Device Ready

ESP8266

```
READY
```

Backend

Marks device

```
Connected
```

---

## Error

ESP8266

```
ERROR:RFID_TIMEOUT
```

Backend

Logs hardware event.

---

# Communication Flow

```
Resident taps RFID

↓

ESP8266 reads UID from MFRC522

↓

Serial

↓

Node.js Serial Service

↓

Event Parser

↓

Hardware Event

↓

RFID Module
```

---

# Serial Service

Responsibilities

- Detect COM Port
- Connect
- Disconnect
- Reconnect
- Parse Messages
- Emit Events

---

# Event Types

```
DEVICE_READY

DEVICE_DISCONNECTED

RFID_SCAN

HEARTBEAT

DEVICE_ERROR
```

---

# Connection Management

States

```
Disconnected

Connecting

Connected

Reconnecting

Error
```

Auto reconnect

```
Every 5 seconds
```

until the ESP8266 becomes available.

---

# Hardware Status API

Backend exposes

```
GET

/api/v1/hardware/status
```

Example

```json
{
  "esp8266": "Connected",
  "rfid": "Ready",
  "camera": "Unavailable",
  "printer": "Offline"
}
```

---

# WebSocket Events

Frontend receives

```
hardware-connected

hardware-disconnected

rfid-scan

hardware-error
```

This removes the need for constant polling.

---

# Logging

Log

```
ESP8266 Connected

ESP8266 Disconnected

RFID UID Received

Heartbeat Lost

Reconnect Attempt
```

---

# Error Handling

Serial Port Missing

```
ESP8266 not detected.
```

Invalid Message

```
Malformed hardware message.
```

Connection Lost

```
Attempting to reconnect...
```

---

# Folder Structure

```
hardware/

serial/

services/

serial.service.ts

serial-parser.ts

serial-manager.ts

events/

hardware.events.ts

controllers/

hardware.controller.ts
```

---

# Testing Checklist

- [ ] Detect ESP8266
- [ ] Open Serial Port
- [ ] Receive RFID UID
- [ ] Receive READY event
- [ ] Receive PING
- [ ] Auto reconnect
- [ ] Broadcast WebSocket events
- [ ] Log hardware events

---

# Acceptance Criteria

- Backend detects ESP8266 automatically.
- Serial communication is stable.
- RFID events reach backend.
- Connection recovery works.
- Hardware status API functions.
- WebSocket events are emitted correctly.

---

# Definition of Done

- Stable ESP8266 ↔ Backend communication established.
- Backend ready for RFID processing.

---

# Estimated Effort

6–8 hours

---

# Next Task

**TASK-HARDWARE-003 — RFID Reader Integration**

---

# Notes for OpenCode

Before implementing:

1. Encapsulate all serial communication inside a dedicated `SerialService` so other backend modules never access the serial port directly.
2. Parse incoming serial messages into strongly typed events before passing them to business services.
3. Implement automatic reconnection when the serial port is disconnected or the ESP8266 is restarted.
4. Use WebSockets (or Socket.IO) to push hardware events to the Angular kiosk in real time instead of polling.
5. Keep the serial protocol human-readable (e.g., `RFID:<UID>`, `READY`, `PING`, `ERROR:<CODE>`) to simplify debugging during development.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |