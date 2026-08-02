# TASK-FRONTEND-001 — Frontend Architecture

> **Phase:** Frontend
> **Task ID:** TASK-FRONTEND-001
> **Priority:** P0 (Critical)
> **Status:** Done

---

# Objective

Design and establish the frontend architecture for the Information Management System using Angular.

The architecture should be modular, scalable, maintainable, and aligned with the backend architecture to simplify future development and maintenance.

---

# Background

The frontend will serve as the primary interface for barangay personnel to manage residents, document requests, payments, reports, and system settings.

It communicates exclusively with the REST API developed during the Backend Phase.

The frontend should not contain business logic. Business rules remain in the backend.

---

# Technology Stack

Framework

```text
Angular 20+
```

Language

```text
TypeScript
```

Styling

```text
Tailwind CSS
Angular Material
```

Icons

```text
Material Symbols
```

Charts

```text
Chart.js
```

HTTP

```text
Angular HttpClient
```

Authentication

```text
JWT
```

---

# High-Level Architecture

```text
Angular Application

│

├── Core
│      ├── Authentication
│      ├── Guards
│      ├── Interceptors
│      ├── Layout
│      ├── Services
│      └── Utilities
│
├── Shared
│      ├── Components
│      ├── Directives
│      ├── Pipes
│      └── Models
│
├── Features
│      ├── Dashboard
│      ├── Users
│      ├── Residents
│      ├── RFID
│      ├── Services
│      ├── Requests
│      ├── Payments
│      ├── Reports
│      ├── Notifications
│      ├── Audit Logs
│      ├── Files
│      └── Settings
│
└── App Routing
```

---

# Recommended Folder Structure

```text
frontend/

src/

app/

core/

    auth/
    guards/
    interceptors/
    layouts/
    services/
    utils/

shared/

    components/
    directives/
    pipes/
    interfaces/
    models/

features/

    auth/
    dashboard/
    users/
    residents/
    rfid/
    services/
    requests/
    payments/
    reports/
    notifications/
    audit/
    files/
    settings/

assets/

environments/
```

---

# Feature Module Responsibilities

## Core

Contains singleton services.

Examples

- Authentication
- API configuration
- Layout
- JWT handling
- Route Guards

---

## Shared

Reusable resources.

Examples

- Buttons
- Tables
- Dialogs
- Loading Spinner
- Search Bar
- Pagination
- Confirmation Dialog

---

## Features

Each feature represents one backend module.

Example

```text
Residents

Components

Resident List

Resident Details

Resident Registration

Resident Edit

Resident Archive
```

---

# Routing

```text
/

login

/dashboard

/users

/residents

/rfid

/services

/requests

/payments

/reports

/notifications

/audit

/settings

/profile
```

---

# Layout Structure

```text
Header

↓

Sidebar

↓

Content

↓

Footer
```

Sidebar

```text
Dashboard

Users

Residents

RFID

Services

Requests

Payments

Reports

Notifications

Audit Logs

Settings
```

---

# Component Design

Use:

Presentational Components

```text
Display Data
```

Container Components

```text
Fetch Data
Call Services
```

Avoid placing API logic directly inside reusable UI components.

---

# State Management

Recommended approach:

```text
Angular Signals
```

Use Signals for:

- Current user
- Notifications
- Sidebar state
- Theme preferences

For larger feature-specific state, encapsulate it in feature services.

---

# API Communication

All HTTP requests should go through dedicated services.

Example

```text
ResidentService

UserService

RequestService

PaymentService
```

Never call HttpClient directly from components.

---

# Error Handling

Global HTTP Interceptor

Handles

- Unauthorized responses
- Forbidden responses
- Server errors
- Network failures

---

# Authentication Flow

```text
Login

↓

Receive JWT

↓

Store Securely

↓

Attach Token

↓

Access Protected Pages
```

---

# Responsive Design

Support

Desktop

```text
1920

1600

1366
```

Tablet

```text
1024
```

Mobile (optional for admin)

```text
768
```

---

# Theme

Primary

```text
Blue
```

Secondary

```text
White
```

Accent

```text
Green
```

Status Colors

```text
Success

Warning

Danger

Info
```

---

# Coding Standards

Components

```text
resident-list.component.ts
```

Services

```text
resident.service.ts
```

Interfaces

```text
resident.interface.ts
```

Models

```text
resident.model.ts
```

---

# Performance Guidelines

- Lazy load feature routes.
- Use standalone components where appropriate.
- Optimize change detection.
- Reuse shared components.
- Minimize unnecessary API calls.

---

# Implementation Checklist

- [ ] Create project structure
- [ ] Configure Angular routing
- [ ] Configure Tailwind CSS
- [ ] Configure Angular Material
- [ ] Configure global layouts
- [ ] Configure feature modules
- [ ] Create shared component structure
- [ ] Configure lazy loading
- [ ] Configure environments
- [ ] Verify application builds successfully

---

# Verification

Application should:

- Build successfully.
- Display the main layout.
- Navigate between placeholder feature routes.
- Support lazy-loaded modules.
- Have no console errors.

---

# Acceptance Criteria

- Modular folder structure established.
- Routing configured.
- Layout implemented.
- Shared architecture ready.
- Ready for feature implementation.

---

# Definition of Done

- Frontend architecture completed.
- Angular project organized.
- Navigation functional.
- Ready for UI component development.

---

# Estimated Effort

5–7 hours

---

# Next Task

**TASK-FRONTEND-002 — Design System & Shared UI Components**

---

# Notes for OpenCode

Before implementing:

1. Use standalone Angular components where practical.
2. Organize features to mirror backend modules for consistency.
3. Centralize API communication through services.
4. Configure lazy loading for all major feature routes.
5. Build reusable UI components in the Shared module before implementing feature-specific screens.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |