# PDMP-004-PROJECT-DEPENDENCY-MAP

Placeholder document.
Replace this content with the finalized PDMP content from our conversation.
# PDMP-004 — Project Dependency Map

> **Project:** Information Management System with IoT-Assisted Document Request Services Kiosk for Barangay San Manuel

**Document ID:** PDMP-004  
**Version:** 2.0.0  
**Status:** Active Development  
**Depends On:** PDMP-000, PDMP-001, PDMP-002, PDMP-003

---

# Purpose

The Project Dependency Map defines the relationships between project modules, development phases, software components, hardware components, and supporting resources.

Its purpose is to:

- Define implementation order.
- Prevent circular dependencies.
- Identify prerequisites before development.
- Help developers understand module relationships.
- Help AI coding assistants determine which modules must be reviewed before implementing a feature.

This document complements the Project Architecture by focusing on dependencies rather than design.

---

# Dependency Principles

The project follows these dependency principles:

- Lower-level modules should not depend on higher-level business modules.
- Shared modules should remain reusable.
- Features should communicate through defined interfaces.
- Circular dependencies are prohibited.
- Every dependency must have a clear purpose.

---

# Development Dependency Flow

```text
PDMP
   │
   ▼
Foundation
   │
   ▼
Database
   │
   ▼
Backend
   │
   ▼
Frontend
   │
   ▼
Kiosk
   │
   ▼
Hardware Integration
   │
   ▼
Testing
   │
   ▼
Deployment
```

Each phase depends on the successful completion of the previous phase.

---

# Phase Dependencies

| Phase | Depends On |
|--------|------------|
| Foundation | None |
| Database | Foundation |
| Backend | Database |
| Frontend | Backend |
| Kiosk | Backend |
| Hardware Integration | Backend, Kiosk |
| Testing | Database, Backend, Frontend, Kiosk, Hardware |
| Deployment | Testing |
| Documentation | All Phases |

---

# System Module Dependencies

```text
Authentication
        │
        ▼
User Management
        │
        ▼
Resident Management
        │
        ▼
Document Request
        │
        ▼
Reports
```

Authentication is the foundational module.

All protected modules depend on successful authentication and authorization.

---

# Backend Module Dependencies

```text
Configuration
      │
      ▼
Database Connection
      │
      ▼
Authentication
      │
      ▼
Middleware
      │
      ▼
Controllers
      │
      ▼
Services
      │
      ▼
Repositories
      │
      ▼
MySQL
```

Repositories should never call controllers.

Controllers should not contain business logic.

Business logic belongs in services.

---

# Frontend Module Dependencies

```text
Core
   │
   ▼
Shared
   │
   ▼
Authentication
   │
   ▼
Dashboard
   │
   ▼
Feature Modules
```

Feature modules may use shared components but should not directly depend on each other unless necessary.

---

# Database Dependencies

```text
Roles
   │
   ▼
Users
   │
   ▼
Residents
   │
   ▼
Services
   │
   ▼
Requests
   │
   ▼
Request History
```

Supporting tables (such as Audit Logs and Notifications) depend on their respective business entities.

---

# Document Request Dependencies

```text
Resident
      │
      ▼
Resident Record
      │
      ▼
Available Services
      │
      ▼
Request Validation
      │
      ▼
Request Creation
      │
      ▼
Staff Approval
      │
      ▼
Document Generation
```

A request cannot be created unless:

- Resident exists.
- Requested service exists.
- Required validations pass.

---

# Hardware Dependencies

```text
RFID Card
      │
      ▼
RFID Reader
      │
      ▼
ESP8266 (RFID controller)
      │
      ▼
Backend API
      │
      ▼
Database
      │
      ▼
Angular Dashboard
```

The hardware layer never communicates directly with the database.

All communication passes through the Backend API.

---

# API Dependencies

```text
Angular
      │
HTTP REST
      ▼
Express API
      │
Business Logic
      ▼
MySQL
```

The frontend should never access the database directly.

---

# External Dependencies

| Component | Purpose |
|-----------|---------|
| Angular | Frontend Framework |
| Node.js | Runtime Environment |
| Express.js | Backend Framework |
| MySQL | Relational Database |
| ESP8266 (RFID controller) | Hardware Controller |
| RFID Reader | Resident Identification |
| Webcam | Photo Capture |

Changes to external technologies should be evaluated for compatibility before implementation.

---

# Build Order

The recommended implementation sequence is:

1. Foundation
2. Database
3. Authentication
4. User Management
5. Resident Management
6. Barangay Services
7. Document Requests
8. Reports
9. Dashboard
10. Kiosk
11. Hardware Integration
12. Testing
13. Deployment

Following this order minimizes integration issues.

---

# AI Context

Before implementing a feature, OpenCode should:

1. Read the relevant task document.
2. Review this dependency map.
3. Identify prerequisite modules.
4. Confirm required APIs and database entities exist.
5. Avoid introducing circular dependencies.

If a required dependency has not been implemented, development should pause until the prerequisite is completed.

---

# Dependency Rules

The following practices are prohibited:

- Direct database access from the frontend.
- Hardware communication that bypasses the Backend API.
- Business logic inside controllers.
- Circular module dependencies.
- Duplicating functionality across modules.

Violations should be corrected before merging.

---

# Related Documents

| Document | Purpose |
|----------|---------|
| PDMP-000 | Development Process |
| PDMP-001 | Project Overview |
| PDMP-002 | Project Roadmap |
| PDMP-003 | Project Architecture |
| PDMP-005 | Development Guide |
| Phase READMEs | Phase-specific dependencies |

---

# Guiding Principle

> Dependencies should reduce complexity, not create it.

Every dependency should have a clear purpose, a defined direction, and a documented reason for existing.