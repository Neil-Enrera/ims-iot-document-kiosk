# TASK-DEPLOYMENT-004 — Backend Deployment

> **Phase:** Deployment
> **Task ID:** TASK-DEPLOYMENT-004
> **Priority:** P0 (Critical)
> **Status:** DONE

---

# Objective

Deploy and configure the production Express.js backend for the Information Management System with IoT-Assisted Document Request Services Kiosk.

This task ensures the backend application is securely configured, connected to the production database, and ready to provide REST APIs for both the Information Management System and the self-service kiosk.

---

# Background

The backend serves as the central application server responsible for:

- Business Logic
- Authentication
- Authorization
- Database Access
- RFID Processing
- Request Processing
- Payment Processing
- Audit Logging
- File Management

Without a properly deployed backend, the frontend and kiosk cannot communicate with the database.

---

# Scope

## Included

- Backend Installation
- Dependency Installation
- Environment Configuration
- Database Connection
- File Storage Configuration
- Logging Configuration
- API Verification
- Production Startup
- Health Check Validation

---

## Not Included

- Frontend Deployment
- Hardware Configuration
- Production Verification
- Backup Configuration

---

# Backend Architecture

```
Angular Staff Portal
          │
          ▼
Express.js REST API
          │
 ┌────────┼─────────┐
 ▼        ▼         ▼
Business Database File Storage
 Logic    Access
          │
          ▼
      MySQL Server
```

---

# Deployment Prerequisites

Verify

- Node.js installed
- MySQL running
- Database initialized
- Environment prepared
- Network verified

---

# Backend Directory

Recommended

```
C:\BarangayIMS\backend

│

├── src

├── uploads

├── logs

├── package.json

├── package-lock.json

└── .env
```

---

# Install Dependencies

Execute

```bash
npm install
```

Verify

```
node_modules created

Dependencies installed successfully
```

---

# Production Environment Variables

Example

```env
NODE_ENV=production

PORT=3000

DB_HOST=localhost

DB_PORT=3306

DB_NAME=barangay_ims

DB_USER=ims_user

DB_PASSWORD=********

JWT_SECRET=********

UPLOAD_PATH=C:\BarangayIMS\uploads

LOG_PATH=C:\BarangayIMS\logs
```

Never expose sensitive configuration values.

---

# File Storage

Required Directories

```
uploads/

residents/

requests/

temporary/
```

Verify

- Directories exist
- Read permission
- Write permission

---

# Logging Configuration

Create

```
application.log

error.log
```

Verify

- Application events recorded
- Errors recorded
- Log rotation configured (optional)

---

# Database Connection

Verify

Backend

↓

MySQL Connection

↓

Authentication

↓

Successful Connection

Expected

```
Database connected successfully.
```

---

# Backend Startup

Development

```bash
npm run dev
```

Production

```bash
npm start
```

Expected

```
Server listening on port 3000
```

---

# API Health Check

Create a health endpoint.

Example

```
GET /api/health
```

Expected Response

```json
{
    "status": "OK",
    "database": "Connected",
    "server": "Running",
    "timestamp": "YYYY-MM-DD HH:MM:SS"
}
```

---

# API Validation

Verify

Authentication

```
POST /auth/login
```

Residents

```
GET /residents
```

Services

```
GET /services
```

Requests

```
GET /requests
```

Dashboard

```
GET /dashboard
```

Health

```
GET /api/health
```

All endpoints should return valid responses.

---

# Production Startup Workflow

```
Copy Backend Files

↓

Install Dependencies

↓

Configure .env

↓

Verify Upload Directories

↓

Connect Database

↓

Start Backend

↓

Execute Health Check

↓

Validate APIs

↓

Ready for Frontend Deployment
```

---

# Backend Validation Checklist

Installation

- [ ] Source files copied
- [ ] Dependencies installed

Environment

- [ ] .env configured
- [ ] Secrets verified

Database

- [ ] Connected successfully

Storage

- [ ] Upload folders created

Logging

- [ ] Log files created

Application

- [ ] Server starts
- [ ] APIs respond correctly
- [ ] Health endpoint operational

---

# Folder Structure

```
backend/

src/

config/

controllers/

middleware/

models/

repositories/

routes/

services/

utils/

uploads/

logs/

.env

package.json
```

Documentation

```
docs/

deployment/

backend/

installation.md

configuration.md

verification.md
```

---

# Deliverables

- Production Backend
- Configured Environment File
- Connected Database
- Configured Upload Directories
- Logging Configuration
- API Health Check
- Backend Verification Report

---

# Acceptance Criteria

Deployment is successful when:

- Backend starts without errors.
- Database connection is successful.
- APIs respond correctly.
- Upload directories function properly.
- Logs are generated.
- Health endpoint reports a healthy status.

---

# Definition of Done

- Backend deployed.
- Dependencies installed.
- Environment configured.
- Database connected.
- APIs verified.
- Backend ready for frontend deployment.

---

# Estimated Effort

**2–3 hours**

---

# Next Task

**TASK-DEPLOYMENT-005 — Frontend Deployment**

---

# Notes for OpenCode

Before implementing:

1. Build the backend using production configuration (`NODE_ENV=production`) to disable development-only behavior.
2. Validate every environment variable during application startup and fail fast if a required value is missing.
3. Implement a health check endpoint that verifies both the application status and database connectivity.
4. Store uploaded resident photos and request files outside the application source folders so updates to the backend do not overwrite uploaded data.
5. Configure application logging to separate normal operational logs from error logs, making production troubleshooting easier.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| 2026-07-31 | OpenCode | Task Completed |