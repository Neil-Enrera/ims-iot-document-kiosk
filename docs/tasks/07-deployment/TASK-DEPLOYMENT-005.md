# TASK-DEPLOYMENT-005 — Frontend Deployment

> **Phase:** Deployment
> **Task ID:** TASK-DEPLOYMENT-005
> **Priority:** P0 (Critical)
> **Status:** DONE

---

# Objective

Deploy the production Angular frontend for the Information Management System with IoT-Assisted Document Request Services Kiosk.

This task ensures that both the staff portal and kiosk interface are properly built, configured, and connected to the production backend.

---

# Background

The Angular frontend provides two primary user interfaces:

- Information Management System (Staff Portal)
- Self-Service Kiosk Interface

Both applications communicate with the same Express.js backend through REST APIs and share a common MySQL database.

---

# Scope

## Included

- Angular Production Build
- Environment Configuration
- API Configuration
- Staff Portal Deployment
- Kiosk Interface Deployment
- Browser Configuration
- Frontend Validation
- Production Verification

---

## Not Included

- Hardware Installation
- Go-Live Verification
- Backup Configuration

These are completed in later deployment tasks.

---

# Frontend Architecture

```
                     Angular Frontend

               ┌─────────────────────────┐
               │                         │
               ▼                         ▼
       Staff Portal               Kiosk Interface
               │                         │
               └────────────┬────────────┘
                            │
                            ▼
                     Express.js Backend
                            │
                            ▼
                      MySQL Database
```

---

# Deployment Prerequisites

Verify

- Backend running
- Database connected
- APIs responding
- Production environment ready

---

# Frontend Directory

Recommended

```
C:\BarangayIMS\frontend

│

├── dist

├── assets

├── browser

└── configuration
```

---

# Production Build

Execute

```bash
ng build --configuration production
```

Expected Output

```
dist/

index.html

browser/

assets/
```

Verify

- Build completed successfully
- No compilation errors
- Production files generated

---

# Environment Configuration

Production Environment

Example

```typescript
export const environment = {

    production: true,

    apiUrl: "http://192.168.1.10:3000/api"

};
```

Replace localhost with the production backend address.

---

# API Verification

Verify frontend can access

```
Authentication

Residents

Services

Requests

Payments

Dashboard

Reports
```

Expected

```
Successful HTTP Responses
```

---

# Staff Portal Deployment

Verify

- Login Screen
- Dashboard
- Resident Module
- Request Module
- Payment Module
- Reports
- Settings

Each module should load successfully.

---

# Kiosk Deployment

Verify

- Idle Screen
- RFID Authentication
- Resident Verification
- Service Selection
- Camera Capture
- Review Screen
- Submission Screen
- Automatic Return to Idle

---

# Browser Configuration

Recommended

```
Google Chrome
```

Configure

- JavaScript Enabled
- Cookies Enabled
- Local Storage Enabled

Disable

- Developer Tools (optional)
- Unnecessary Extensions

---

# Kiosk Browser Configuration

Configure

```
Full Screen Mode

Auto Launch

Disable Sleep

Hide Browser Toolbar

Disable Address Bar (optional)
```

The kiosk should automatically display the resident interface after startup.

---

# Frontend Startup Workflow

```
Build Angular

↓

Copy dist Files

↓

Configure API URL

↓

Deploy Staff Portal

↓

Deploy Kiosk Interface

↓

Launch Browser

↓

Verify Communication

↓

Validate Modules

↓

Ready for Hardware Configuration
```

---

# Frontend Validation Checklist

Build

- [ ] Successful

Environment

- [ ] Production Configuration

Backend

- [ ] API Reachable

Staff Portal

- [ ] Login
- [ ] Dashboard
- [ ] Modules

Kiosk

- [ ] Idle Screen
- [ ] Navigation
- [ ] Submission Workflow

Browser

- [ ] Configured

---

# Folder Structure

```
frontend/

dist/

browser/

assets/

configuration/

environment/

production/
```

Documentation

```
docs/

deployment/

frontend/

installation.md

configuration.md

verification.md
```

---

# Deliverables

- Production Angular Build
- Configured Environment
- Staff Portal
- Kiosk Interface
- Browser Configuration
- Frontend Verification Report

---

# Acceptance Criteria

Deployment is successful when:

- Angular production build completes successfully.
- Frontend communicates with the backend.
- Staff portal functions correctly.
- Kiosk interface functions correctly.
- Browser configuration is complete.
- No critical frontend issues remain.

---

# Definition of Done

- Production build completed.
- Environment configured.
- API communication verified.
- Staff portal deployed.
- Kiosk deployed.
- Ready for kiosk hardware configuration.

---

# Estimated Effort

**2–3 hours**

---

# Next Task

**TASK-DEPLOYMENT-006 — Kiosk Deployment & Hardware Configuration**

---

# Notes for OpenCode

Before implementing:

1. Generate the Angular application using the production configuration to enable optimizations such as Ahead-of-Time (AOT) compilation and asset minification.
2. Store the backend API URL in the production environment configuration so it can be changed without modifying application code.
3. If the staff portal and kiosk share the same Angular project, use route-based navigation or build-time configuration to present the appropriate interface.
4. Configure the kiosk browser to launch automatically in full-screen mode when Windows starts to provide a seamless self-service experience.
5. Verify every frontend module after deployment using the production backend instead of mocked or development APIs.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| 2026-07-31 | OpenCode | Task Completed |