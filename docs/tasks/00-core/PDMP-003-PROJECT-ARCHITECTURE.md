# PDMP-003-PROJECT-ARCHITECTURE

Placeholder document.
Replace this content with the finalized PDMP content from our conversation.
# PDMP-003 — Project Architecture

> **Project:** Information Management System with IoT-Assisted Document Request Services Kiosk for Barangay San Manuel

**Document ID:** PDMP-003  
**Version:** 2.0.0  
**Status:** Active Development  
**Depends On:** PDMP-000, PDMP-001, PDMP-002

---

# Purpose

This document defines the overall software and hardware architecture of the Information Management System with IoT-Assisted Document Request Services Kiosk for Barangay San Manuel.

It serves as the primary architectural reference for developers and AI coding assistants.

Its purpose is to:

- Define system boundaries.
- Describe major software components.
- Explain hardware integration.
- Illustrate data flow.
- Document module responsibilities.
- Prevent architectural inconsistencies.
- Support future maintenance and scalability.

This document should be reviewed before implementing any major feature.

---

# Architectural Principles

The system follows these principles:

- Separation of Concerns
- Modular Design
- Single Responsibility
- RESTful Communication
- Layered Architecture
- Reusable Components
- Scalable Design
- Secure by Default

---

# High-Level System Architecture

```text
                    +----------------------+
                    |      Residents       |
                    +----------+-----------+
                               |
                               |
                     RFID / Touchscreen
                               |
                               ▼
                  +-------------------------+
                  |  IoT-Assisted Kiosk     |
                  |                         |
                  | RFID Reader             |
                  | Webcam                  |
                  | Touchscreen             |
                  +------------+------------+
                               |
                               |
                          HTTP / REST API
                               |
                               ▼
               +-------------------------------+
               |      Node.js + Express API    |
               +---------------+---------------+
                               |
          +--------------------+--------------------+
          |                    |                    |
          ▼                    ▼                    ▼
 Resident Module      Request Module       Authentication
          |                    |                    |
          +--------------------+--------------------+
                               |
                               ▼
                       MySQL Database
                               |
                               ▼
                     Barangay Staff Portal
                        (Angular Web App)
```

---

# System Components

The project consists of five primary components.

## 1. Angular Web Application

Purpose:

Administrative Information Management System used by barangay personnel.

Responsibilities:

- Resident Management
- User Management
- Dashboard
- Reports
- Request Approval
- Document Generation
- Audit Logs

---

## 2. Backend API

Purpose:

Provides centralized business logic.

Responsibilities:

- Authentication
- Authorization
- Validation
- Database Operations
- Business Rules
- Hardware Communication
- REST API

---

## 3. MySQL Database

Purpose:

Persistent storage.

Stores:

- Residents
- Users
- Requests
- Services
- Roles
- Permissions
- Audit Logs

---

## 4. IoT Kiosk

Purpose:

Resident self-service interface.

Functions:

- RFID Identification
- Photo Capture
- Service Selection
- Document Request
- Status Display

---

## 5. Hardware Layer

Devices:

- RFID Reader (MFRC522)
- ESP8266 (RFID controller)
- Webcam (attached to the kiosk tablet)
- Touchscreen Kiosk Tablet

Purpose:

Provide physical interaction with the kiosk. The ESP8266 handles RFID hardware communication only and connects to the kiosk over USB serial; it is not the kiosk device itself.

---

# Software Architecture

```text
Presentation Layer
│
├── Angular Web Application
└── Kiosk Interface

↓

Application Layer

├── Controllers
├── Services
├── Middleware
├── Authentication
├── Validation

↓

Business Layer

├── Resident Logic
├── Request Logic
├── User Logic
├── Reports
├── Notifications

↓

Data Layer

├── Repository
├── MySQL
├── File Storage
```

---

# Backend Architecture

```text
backend/

src/

├── config/
├── controllers/
├── middleware/
├── routes/
├── services/
├── repositories/
├── models/
├── validators/
├── utils/
├── uploads/
└── app.js
```

Responsibilities

Controllers

Receive HTTP requests.

Services

Contain business logic.

Repositories

Communicate with database.

Validators

Validate user input.

Middleware

Authentication, authorization, logging.

---

# Frontend Architecture

```text
frontend/

src/

app/

├── core/
├── shared/
├── layouts/
├── features/
├── services/
├── guards/
├── interceptors/
├── models/
└── pages/
```

Core

Application-wide services.

Shared

Reusable components.

Features

Business modules.

Pages

User interfaces.

---

# Database Architecture

Major Entities

Residents

↓

Requests

↓

Services

↓

Users

↓

Roles

↓

Audit Logs

The detailed ER Diagram is maintained separately within the Database Phase documentation.

---

# Hardware Architecture

```text
Resident

↓

RFID Card (Barangay ID)

↓

RFID Reader (MFRC522)

↓

ESP8266 (RFID controller)

↓  USB serial → hardware bridge → WebSocket

Kiosk Tablet (Angular kiosk app)

↓

Backend API

↓

Database

↓

Response

↓

Kiosk Tablet (touchscreen display)
```

---

# Authentication Flow

```text
Staff

↓

Login

↓

JWT Authentication

↓

Access Token

↓

Protected API

↓

Authorized Resources
```

Residents using the kiosk are identified through RFID rather than user accounts.

---

# Document Request Workflow

```text
Resident

↓

Tap RFID Card

↓

Retrieve Resident Record

↓

Capture Webcam Photo

↓

Select Service

↓

Review Information

↓

Submit Request

↓

Backend Validation

↓

Save Request

↓

Notify Staff

↓

Staff Reviews Request

↓

Generate Document

↓

Complete
```

---

# Module Dependency

```text
Authentication
        │
        ▼
Resident Module
        │
        ▼
Document Request
        │
        ▼
Reports
```

Lower-level modules should not directly depend on higher-level business modules.

---

# Security Considerations

The system implements:

- JWT Authentication
- Password Hashing
- Role-Based Access Control
- Input Validation
- SQL Injection Prevention
- Request Validation
- Audit Logging

Future enhancements may include:

- HTTPS
- Rate Limiting
- Activity Monitoring

---

# Scalability

The architecture supports future expansion.

Possible future integrations:

- SMS Notifications
- Email Notifications
- QR Code Verification
- Online Payments
- Multiple Barangays
- Mobile Application

The core architecture should not require major redesign to support these additions.

---

# Architecture Decision Records

Major architectural decisions should be documented when they significantly impact the project.

Examples include:

- Technology stack changes
- Database redesign
- Hardware modifications
- Authentication changes
- API version updates

---

# Related Documents

| Document | Purpose |
|----------|---------|
| PDMP-000 | Development process |
| PDMP-001 | Project overview |
| PDMP-002 | Project roadmap |
| PDMP-004 | Project dependency map |
| Database Phase | ERD and schema |
| Backend Phase | API implementation |
| Frontend Phase | UI implementation |
| Hardware Phase | Device integration |

---

# Guiding Principle

> A well-designed architecture minimizes complexity, defines clear boundaries, and enables the system to evolve without requiring major redesign.

Architecture should guide implementation—not follow it.