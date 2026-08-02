# TASK-BACKEND-001 — Backend Architecture & Project Structure

> **Phase:** Backend
> **Task ID:** TASK-BACKEND-001
> **Priority:** P0 (Critical)
> **Status:** Done

---

# Objective

Establish the backend architecture for the **Information Management System with IoT-Assisted Document Request Services Kiosk for Barangay San Manuel** using **Node.js**, **Express.js**, and **MySQL**.

The objective is to create a modular, scalable, and maintainable backend that will support all current and future system modules.

---

# Background

The backend is responsible for:

- Business Logic
- REST API
- Authentication
- Database Communication
- RFID Integration
- Webcam Integration
- Document Processing
- Audit Logging
- Reporting

This task establishes the project's architecture only. No business features should be implemented.

---

# Scope

## Included

- Backend folder organization
- Express configuration
- API versioning
- Middleware configuration
- Route registration
- Controller architecture
- Service architecture
- Repository architecture
- Configuration management
- Logging preparation
- Error handling preparation

## Not Included

- Authentication
- CRUD APIs
- Resident Management
- Document Requests
- RFID
- Reports

---

# Dependencies

- Phase 01 – Foundation

---

# Architecture Pattern

The backend will follow a layered architecture.

```text
Request
    │
    ▼
Routes
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
Database
```

Each layer has a single responsibility.

---

# Official Folder Structure

```text
backend/

src/

├── config/
│   ├── database.js
│   ├── environment.js
│   └── logger.js
│
├── controllers/
│
├── middleware/
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   ├── validation.middleware.js
│   └── not-found.middleware.js
│
├── models/
│
├── repositories/
│
├── routes/
│   ├── index.js
│   ├── api.js
│   └── health.routes.js
│
├── services/
│
├── validations/
│
├── utils/
│
├── app.js
└── server.js

logs/

uploads/

package.json

.env

.env.example
```

---

# API Structure

All endpoints must use versioning.

```text
/api/v1
```

Example

```http
GET /api/v1/health

POST /api/v1/auth/login

GET /api/v1/residents
```

---

# Middleware Stack

Configure middleware in this order:

1. Helmet
2. CORS
3. JSON Parser
4. URL Encoded Parser
5. Request Logger
6. API Routes
7. Not Found Handler
8. Global Error Handler

---

# Logging

Prepare centralized logging.

Logs should record:

- Server Startup
- Database Connection
- API Requests
- Errors

Log directory

```text
backend/logs/
```

---

# Configuration Files

Environment

```text
config/environment.js
```

Database

```text
config/database.js
```

Logger

```text
config/logger.js
```

---

# Health Endpoint

Create

```http
GET /api/v1/health
```

Example

```json
{
    "success": true,
    "message": "IMS Backend API is running.",
    "version": "1.0.0"
}
```

---

# Files to Create

```text
backend/src/

config/

controllers/

middleware/

models/

repositories/

routes/

services/

utils/

validations/

logs/

uploads/

app.js

server.js
```

---

# Files to Modify

```text
package.json
```

Configure scripts

```json
{
    "scripts": {
        "start": "node src/server.js",
        "dev": "nodemon src/server.js"
    }
}
```

---

# Implementation Checklist

- [ ] Verify folder structure
- [ ] Configure Express application
- [ ] Register middleware
- [ ] Configure API versioning
- [ ] Configure routes
- [ ] Configure centralized logging
- [ ] Configure error handling
- [ ] Create health endpoint
- [ ] Verify backend starts successfully

---

# Verification

Run

```bash
npm run dev
```

Open

```http
GET /api/v1/health
```

Expected Response

```json
{
    "success": true,
    "message": "IMS Backend API is running.",
    "version": "1.0.0"
}
```

---

# Acceptance Criteria

- Backend architecture established.
- Folder structure completed.
- Middleware configured.
- API versioning operational.
- Health endpoint functional.
- Project ready for feature modules.

---

# Definition of Done

- Backend structure completed.
- Express application operational.
- Logging configured.
- Error handling prepared.
- Ready for authentication module.

---

# Estimated Effort

2–3 hours

---

# Next Task

**TASK-BACKEND-002 — Database Integration**

---

# Notes for OpenCode

Before implementing:

1. Follow the official backend architecture.
2. Do not implement business logic.
3. Do not create CRUD endpoints.
4. Configure only the backend infrastructure.
5. Ensure every future module can be added without restructuring the project.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |