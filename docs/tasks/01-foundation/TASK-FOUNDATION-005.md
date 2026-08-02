# TASK-FOUNDATION-005 — MySQL Database Configuration

> **Phase:** Foundation  
> **Task ID:** TASK-FOUNDATION-005  
> **Priority:** P0 (Critical)  
> **Status:** Done

---

# Objective

Configure the MySQL database environment for the **Information Management System with IoT-Assisted Document Request Services Kiosk for Barangay San Manuel**.

This task establishes the database connection, verifies communication between the backend and MySQL, and prepares the project for future database schema implementation.

---

# Background

The database is the central storage for residents, users, document requests, RFID cards, audit logs, reports, and other system data.

At this stage, only the database environment and connection should be configured. No tables or business data should be created yet.

---

# Scope

## Included

- Install and verify MySQL Server
- Create project database
- Create dedicated database user (optional but recommended)
- Configure database connection
- Create database configuration module
- Configure environment variables
- Verify backend can connect to MySQL
- Create database health check endpoint

## Not Included

- Database tables
- ERD implementation
- Seed data
- CRUD operations
- Stored procedures
- Triggers

---

# Technology Stack

| Technology | Purpose |
|------------|---------|
| MySQL 8.x | Relational Database |
| mysql2 | Node.js Database Driver |
| dotenv | Environment Configuration |

---

# Dependencies

### Production

```text
mysql2
```

Install:

```bash
npm install mysql2
```

---

# Dependencies

- TASK-FOUNDATION-001 — Project Repository Setup
- TASK-FOUNDATION-002 — Development Environment
- TASK-FOUNDATION-003 — Angular Project Initialization
- TASK-FOUNDATION-004 — Backend Project Initialization

---

# Business Rules

- Database credentials must never be hardcoded.
- Use environment variables for all connection settings.
- Use connection pooling for scalability.
- The backend must fail gracefully if the database is unavailable.

---

# Database Information

Example Database Name

```text
ims_document_request
```

Recommended Character Set

```text
utf8mb4
```

Recommended Collation

```text
utf8mb4_unicode_ci
```

---

# Environment Variables

Create a `.env` file in the backend directory.

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=ims_document_request
DB_USER=root
DB_PASSWORD=your_password
```

---

# Files to Create

```text
backend/

src/

config/

database.js

.env
```

---

# Files to Modify

```text
package.json
```

(if required for additional scripts)

---

# Database Configuration

Create a reusable database connection module.

Responsibilities:

- Read environment variables
- Create MySQL connection pool
- Export connection instance
- Handle connection errors
- Log successful connection

---

# Health Check Endpoint

Create a database health endpoint.

```http
GET /api/health/database
```

Example Response

```json
{
    "success": true,
    "database": "Connected"
}
```

If disconnected:

```json
{
    "success": false,
    "database": "Disconnected"
}
```

---

# Implementation Checklist

- [ ] Install mysql2
- [ ] Create MySQL database
- [ ] Configure environment variables
- [ ] Create database connection module
- [ ] Configure connection pool
- [ ] Verify backend connection
- [ ] Create database health endpoint
- [ ] Test successful connection
- [ ] Test failed connection handling

---

# Verification

Run

```bash
npm run dev
```

Open

```text
http://localhost:3000/api/health/database
```

Expected Response

```json
{
    "success": true,
    "database": "Connected"
}
```

---

# Acceptance Criteria

- MySQL database created.
- Database connection established.
- Connection pool configured.
- Backend successfully communicates with MySQL.
- Database health endpoint responds correctly.
- No connection errors during startup.

---

# Definition of Done

- Database configured.
- Connection verified.
- Environment variables working.
- Health endpoint operational.
- Acceptance criteria satisfied.

---

# Estimated Effort

30–45 minutes

---

# Next Task

**TASK-FOUNDATION-006 — Git Workflow**

---

# Notes for OpenCode

Before implementing:

1. Do not create any tables.
2. Do not import SQL files.
3. Configure only the database connection.
4. Use environment variables for all credentials.
5. Verify the backend can connect successfully before marking the task complete.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |