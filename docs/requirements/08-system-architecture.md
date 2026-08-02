# 08 — System Architecture

# Information Management System with IoT-Assisted Document Request Services Kiosk for Barangay San Manuel

**Project Type:** Capstone Project  
**Client:** Barangay San Manuel  
**Frontend Framework:** Angular  
**Backend:** Node.js (Express.js) *(Recommended)*  
**Database:** MySQL *(Recommended)*  
**Hardware:** RFID Reader, RFID Cards, Webcam, Touchscreen Monitor  
**Document Version:** 1.0  
**Status:** Draft

---

# 1. Purpose

This document defines the overall software and hardware architecture of the Information Management System with IoT-Assisted Document Request Services Kiosk.

It explains how the different system components interact to support the business workflows defined in previous documents.

This architecture serves as the technical blueprint for:

- Software Development
- Database Design
- API Development
- Hardware Integration
- Deployment
- Testing
- Maintenance

---

# 2. Architecture Goals

The system architecture should:

- Separate responsibilities into independent modules.
- Support future expansion.
- Minimize coupling between hardware and software.
- Provide maintainable code.
- Support secure authentication.
- Ensure reliable communication with kiosk hardware.
- Support future integrations without major redesign.

---

# 3. High-Level Architecture

```text
                     +--------------------------------+
                     |           Resident             |
                     +--------------------------------+
                                  |
                                  |
                    Touchscreen + RFID + Webcam
                                  |
                                  ▼
                     +---------------------------+
                     |     Angular Frontend      |
                     |      (Kiosk UI)           |
                     +---------------------------+
                                  |
                                  |
                            HTTP / REST API
                                  |
                                  ▼
                     +---------------------------+
                     |      Node.js Backend      |
                     |      (Express Server)     |
                     +---------------------------+
                    /            |               \
                   /             |                \
                  ▼              ▼                 ▼
        Authentication     Business Logic     Hardware Services
                  |              |                 |
                  ▼              ▼                 ▼
            Resident DB     Request Module     RFID Interface
                  |
                  ▼
              MySQL Database
```

---

# 4. System Layers

The system follows a layered architecture.

## Presentation Layer

Responsible for:

- Kiosk Interface
- Staff Dashboard
- Administrator Dashboard

Technology

- Angular

Responsibilities

- Display information
- Validate user input
- Send API requests
- Display responses

---

## Application Layer

Responsible for implementing business rules.

Technology

- Node.js
- Express.js

Responsibilities

- Authentication
- Request Processing
- Approval Workflow
- Payment Processing
- Resident Lookup
- Service Management

---

## Data Layer

Responsible for storing system data.

Technology

- MySQL

Responsibilities

- Residents
- Requests
- Services
- Users
- Payments
- Audit Logs

---

## Hardware Layer

Responsible for communication with physical devices.

Hardware

- RFID Reader
- RFID Cards
- Webcam
- Touchscreen Monitor

Responsibilities

- Read RFID cards
- Capture resident photos (if applicable)
- Accept touch input

---

# 5. System Modules

The system is divided into independent modules.

## Authentication Module

Responsibilities

- RFID authentication
- Staff login
- Session management

---

## Resident Module

Responsibilities

- Retrieve resident information
- Display resident profile
- Validate resident records

---

## Service Module

Responsibilities

- Display available services
- Display requirements
- Manage service information

---

## Request Module

Responsibilities

- Create requests
- Update requests
- Track request status
- Generate request references

---

## Payment Module

Responsibilities

- Record payments
- Verify payment status

---

## Approval Module

Responsibilities

- Captain approval
- Kagawad approval
- Reject requests
- Record approval actions

---

## Release Module

Responsibilities

- Release documents
- Record release history

---

## Administration Module

Responsibilities

- Manage users
- Manage services
- Configure settings

---

## Audit Module

Responsibilities

- Record system actions
- Track request history
- Maintain audit logs

---

# 6. Hardware Integration

## RFID Reader

Purpose

Identify residents using RFID Barangay IDs.

Input

RFID Card UID

Output

Resident Information

---

## Webcam

Purpose

Capture resident photos if required by Barangay policy.

Current Status

Optional

---

## Touchscreen

Purpose

Primary kiosk interaction.

Functions

- Navigation
- Form Input
- Service Selection

---

# 7. Data Flow

```text
Resident
      │
      ▼
RFID Reader
      │
      ▼
Angular Frontend
      │
 REST API Request
      ▼
Node.js Backend
      │
      ▼
MySQL Database
      │
      ▼
Resident Information
      │
      ▼
Angular UI
```

---

# 8. Security Architecture

The system should provide:

- Role-based access control (RBAC)
- Session management
- Authentication for staff users
- Input validation
- Audit logging
- Secure API communication

---

# 9. Error Handling Strategy

The system should gracefully handle:

- RFID read failures
- Resident not found
- Database connection failures
- API failures
- Validation errors
- Hardware communication failures

The user should receive clear, non-technical error messages.

---

# 10. Scalability Considerations

The architecture should allow future integration of:

- SMS notifications
- Email notifications
- Online resident portal
- Mobile application
- Online payment gateway
- Additional Barangay services

These features are outside the current MVP but should be supported by the modular design.

---

# 11. Technology Stack

| Layer | Technology |
|--------|------------|
| Frontend | Angular |
| Backend | Node.js + Express.js |
| Database | MySQL |
| API | REST |
| Authentication | RFID + Staff Login |
| Hardware | RFID Reader, Webcam, Touchscreen |
| Version Control | Git |
| Testing | Unit, Integration, E2E |

---

# 12. Architecture Principles

The system should adhere to the following principles:

- Separation of Concerns
- Modular Design
- Single Responsibility Principle
- Reusability
- Scalability
- Maintainability
- Security by Design

---

# 13. Architecture Traceability

| Module | Related Epics |
|----------|--------------|
| Authentication | EPIC-01 |
| Resident | EPIC-02 |
| Services | EPIC-03 |
| Requests | EPIC-04 |
| Staff Processing | EPIC-05 |
| Payment | EPIC-06 |
| Approval | EPIC-07 |
| Release | EPIC-08 |
| Administration | EPIC-09 |
| System Management | EPIC-10 |

---

# 14. Document Status

| Version | Date | Description |
|----------|------|-------------|
| 1.0 | Initial Draft | Initial system architecture based on approved business requirements and user flows. |

**Status:** Draft

## High-Level System Architecture

```text
                    +-------------------------+
                    |        Resident         |
                    +-----------+-------------+
                                |
                         RFID / Touchscreen
                                |
                                ▼
                +-------------------------------+
                |      Angular Kiosk System     |
                +---------------+---------------+
                                |
                           REST API
                                |
                                ▼
                +-------------------------------+
                |     Node.js / Express API     |
                +---------------+---------------+
                                |
        +-----------+-----------+-----------+-----------+
        |           |           |           |           |
        ▼           ▼           ▼           ▼           ▼
 Authentication  Resident   Requests   Administration  Audit
                 Services
                                |
                                ▼
                        +---------------+
                        | MySQL Database|
                        +---------------+
```

## Layered Architecture

```text
+------------------------------------------------+
|               Presentation Layer               |
|----------------------------------------------- |
| Angular Kiosk UI                               |
| Staff Dashboard                                |
| Admin Dashboard                                |
+------------------------------------------------+
                     |
                     v
+------------------------------------------------+
|               Application Layer                |
|----------------------------------------------- |
| Authentication                                 |
| Resident Module                                |
| Request Module                                 |
| Payment Module                                 |
| Approval Module                                |
| Release Module                                 |
+------------------------------------------------+
                     |
                     v
+------------------------------------------------+
|                 Data Layer                     |
|----------------------------------------------- |
| MySQL                                          |
| Residents                                      |
| Requests                                       |
| Services                                       |
| Payments                                       |
| Audit Logs                                     |
+------------------------------------------------+
                     |
                     v
+------------------------------------------------+
|               Hardware Layer                   |
|----------------------------------------------- |
| RFID Reader                                    |
| Webcam                                         |
| Touchscreen                                    |
+------------------------------------------------+
```

## Component Diagram

```text
                Angular Frontend
                       │
                 REST API Calls
                       │
                       ▼
            +----------------------+
            | Express.js Backend   |
            +----------------------+
                     │
     ┌───────────────┼────────────────┐
     │               │                │
     ▼               ▼                ▼
 Authentication   Resident      Service Module
                     │
                     ▼
               Request Module
                     │
                     ▼
              Approval Module
                     │
                     ▼
               Release Module
                     │
                     ▼
               Audit Module
                     │
                     ▼
                MySQL Database
```

## Request Lifecycle

```text
Resident
    │
    ▼
RFID Identification
    │
    ▼
Resident Verified
    │
    ▼
Select Service
    │
    ▼
Submit Request
    │
    ▼
Submitted
    │
    ▼
Under Review
(Secretary / Staff)
    │
    ▼
Approved?
(Captain / Kagawad)
 ┌──────────┴──────────┐
 │                     │
 ▼                     ▼
Rejected        Pending Payment
                       │
                       ▼
            Treasurer Records Payment
                       │
                       ▼
               Ready for Release
                       │
                       ▼
               Document Released
                       │
                       ▼
                  Completed
```

## Deployment Diagram

```text
+--------------------------------------------------+
|                  Kiosk Device                    |
|--------------------------------------------------|
|                                                  |
| Angular Application                              |
| RFID Reader                                      |
| Webcam                                           |
| Touchscreen Monitor                              |
+----------------------+---------------------------+
                       |
                  REST API
                       |
                       ▼
+--------------------------------------------------+
|            Barangay Application Server           |
|--------------------------------------------------|
| Node.js                                          |
| Express.js                                       |
| Business Logic                                   |
+----------------------+---------------------------+
                       |
                       ▼
+--------------------------------------------------+
|                MySQL Database Server             |
+--------------------------------------------------+
```