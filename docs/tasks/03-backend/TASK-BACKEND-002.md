# TASK-BACKEND-002 — Database Integration

> **Phase:** Backend
> **Task ID:** TASK-BACKEND-002
> **Priority:** P0 (Critical)
> **Status:** Done

---

# Objective

Integrate the Express backend with the existing MySQL database to establish a reliable, reusable, and secure database connection that will be used by all backend modules.

---

# Background

The project already has an existing database schema. This task does **not** create or modify database tables. Instead, it configures the backend to communicate with the database using a centralized connection pool.

All future modules (Authentication, Residents, RFID, Requests, Payments, etc.) will use this shared database connection.

---

# Scope

## Included

- Install MySQL driver
- Configure database connection
- Create connection pool
- Environment variable configuration
- Database connection testing
- Database health endpoint

## Not Included

- Creating tables
- Running migrations
- CRUD operations
- Business logic

---

# Dependencies

- TASK-BACKEND-001 — Backend Architecture & Project Structure

---

# Required Package

Install:

```bash
npm install mysql2
```

---

# Environment Variables

Update `.env`

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ims_iot_document_kiosk
DB_USER=root
DB_PASSWORD=
```

> Adjust the values to match your local MySQL configuration.

---

# Folder Structure

```text
backend/

src/

config/
    database.js
```

---

# Database Connection

Create a reusable connection pool.

Responsibilities:

- Create MySQL connection pool
- Export pool instance
- Handle connection errors
- Support concurrent requests
- Automatically manage connections

---

# Connection Rules

- Use a connection pool instead of a single connection.
- Never hardcode credentials.
- Read all database settings from `.env`.
- Close connections properly after queries.

---

# Health Endpoint

Create:

```http
GET /api/v1/health/database
```

Successful response:

```json
{
    "success": true,
    "message": "Database connected successfully."
}
```

Failure response:

```json
{
    "success": false,
    "message": "Database connection failed."
}
```

---

# Files to Create

```text
backend/src/config/database.js
```

---

# Files to Modify

```text
backend/.env
backend/.env.example
backend/src/routes/health.routes.js
```

---

# Implementation Checklist

- [ ] Install mysql2 package
- [ ] Configure environment variables
- [ ] Create MySQL connection pool
- [ ] Export reusable database instance
- [ ] Create database health endpoint
- [ ] Test successful connection
- [ ] Test failed connection handling

---

# Verification

Run:

```bash
npm run dev
```

Open:

```http
GET /api/v1/health/database
```

Expected Result:

```json
{
    "success": true,
    "message": "Database connected successfully."
}
```

---

# Acceptance Criteria

- Backend connects successfully to MySQL.
- Database credentials are loaded from `.env`.
- Connection pool is reusable across the application.
- Health endpoint confirms connectivity.
- No credentials are hardcoded.

---

# Definition of Done

- Database connection established.
- Connection pool implemented.
- Health endpoint working.
- Ready for backend modules to access the database.

---

# Estimated Effort

1–2 hours

---

# Next Task

**TASK-BACKEND-003 — API Standards & Response Format**

---

# Notes for OpenCode

Before implementing:

1. Do not modify the existing database schema.
2. Use the existing database as the single source of truth.
3. Implement a reusable connection pool.
4. Keep database logic centralized in `config/database.js`.
5. Ensure future repositories can import the same connection without duplication.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |