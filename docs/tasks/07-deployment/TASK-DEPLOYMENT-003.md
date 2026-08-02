# TASK-DEPLOYMENT-003 — Database Deployment & Initialization

> **Phase:** Deployment
> **Task ID:** TASK-DEPLOYMENT-003
> **Priority:** P0 (Critical)
> **Status:** DONE

---

# Objective

Deploy and initialize the production MySQL database for the Information Management System with IoT-Assisted Document Request Services Kiosk.

This task ensures that the production database is correctly installed, configured, initialized, and validated before the backend application is deployed.

---

# Background

The database serves as the central repository for all system information, including resident records, RFID cards, document requests, payments, services, users, and audit logs.

Proper deployment ensures:

- Data integrity
- Consistent application behavior
- Secure access
- Reliable backups
- Future maintainability

---

# Scope

## Included

- Database Creation
- User Account Creation
- Schema Deployment
- Seed Data Import
- Connection Configuration
- Index Verification
- Constraint Verification
- Initial Data Validation

---

## Not Included

- Backend Deployment
- Frontend Deployment
- Database Backup Configuration
- Performance Optimization

These are handled in later deployment tasks.

---

# Database Architecture

```
Angular IMS

        │

        ▼

Express API

        │

        ▼

MySQL Server

        │

        ├── users

        ├── user_roles

        ├── residents

        ├── rfid_cards

        ├── services

        ├── request_statuses

        ├── requests

        ├── payments

        └── audit_logs
```

---

# Database Installation

Install

```
MySQL Server 8.x
```

Recommended Configuration

Authentication

```
Native Password Authentication
```

Character Set

```
utf8mb4
```

Collation

```
utf8mb4_unicode_ci
```

---

# Database Creation

Create production database

Example

```sql
CREATE DATABASE barangay_ims
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Verify

```
Database exists.

Character set correct.

Collation correct.
```

---

# Database User

Create dedicated application account.

Example

```sql
CREATE USER 'ims_user'@'localhost'
IDENTIFIED BY 'StrongPassword';
```

Grant permissions

```sql
GRANT SELECT,
INSERT,
UPDATE,
DELETE,
CREATE,
ALTER,
INDEX
ON barangay_ims.*
TO 'ims_user'@'localhost';
```

Avoid using the MySQL root account for application access.

---

# Schema Deployment

Import

```
schema.sql
```

Verify

- Tables created
- Constraints applied
- Foreign keys created
- Indexes created

Expected Tables

```
user_roles

users

residents

rfid_cards

services

request_statuses

requests

payments

audit_logs
```

---

# Seed Data Deployment

Import

```
seed.sql
```

Initial Data

- User Roles
- Request Statuses
- Default Services
- Administrator Account

Verify

```
Seed records successfully inserted.
```

---

# Data Validation

Verify

## User Roles

Expected

```
Administrator

Secretary

Treasurer
```

---

## Services

Verify

- Barangay Clearance
- Certificate of Residency
- Certificate of Indigency
- Barangay ID

---

## Request Statuses

Expected

```
Pending

Under Review

Approved

Rejected

Released
```

---

# Connection Configuration

Backend Environment

```env
DB_HOST=localhost

DB_PORT=3306

DB_NAME=barangay_ims

DB_USER=ims_user

DB_PASSWORD=********
```

Verify

```
Backend successfully connects to database.
```

---

# Constraint Verification

Verify

Primary Keys

Foreign Keys

Unique Constraints

NOT NULL Constraints

Default Values

---

# Index Verification

Confirm indexes exist for frequently searched fields.

Examples

- RFID UID
- Resident ID
- Request Number
- User Username

---

# Initialization Workflow

```
Install MySQL

↓

Create Database

↓

Create Application User

↓

Import Schema

↓

Import Seed Data

↓

Verify Tables

↓

Verify Constraints

↓

Configure Connection

↓

Validate Database

↓

Ready for Backend Deployment
```

---

# Production Validation Checklist

Database

- [ ] Created

User

- [ ] Application user created

Schema

- [ ] Imported successfully

Tables

- [ ] All tables exist

Constraints

- [ ] Verified

Indexes

- [ ] Verified

Seed Data

- [ ] Imported

Connection

- [ ] Successful

---

# Folder Structure

```
database/

schema/

schema.sql

seed/

seed.sql

migrations/

validation/

verification.sql

scripts/
```

Documentation

```
docs/

deployment/

database/

installation.md

validation.md
```

---

# Deliverables

- Production Database
- Application Database User
- Imported Schema
- Imported Seed Data
- Database Validation Report
- Connection Configuration

---

# Acceptance Criteria

Deployment is successful when:

- Database created successfully.
- Schema imported without errors.
- Seed data imported correctly.
- Application user configured.
- Backend connection verified.
- Constraints and indexes validated.

---

# Definition of Done

- Production database initialized.
- All tables verified.
- Seed data available.
- Backend can connect successfully.
- Database ready for backend deployment.

---

# Estimated Effort

**2–3 hours**

---

# Next Task

**TASK-DEPLOYMENT-004 — Backend Deployment**

---

# Notes for OpenCode

Before implementing:

1. Store the production schema (`schema.sql`) and initial data (`seed.sql`) separately so schema updates and data initialization can be managed independently.
2. Use a dedicated MySQL user for the application instead of the `root` account, granting only the permissions required by the system.
3. Validate foreign keys, indexes, and seed data immediately after import to detect deployment issues before the backend is started.
4. Keep a copy of the initial production database backup immediately after successful initialization to provide a clean recovery point.
5. Record the MySQL version, schema version, and deployment date in the deployment documentation for future maintenance and upgrades.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| 2026-07-31 | OpenCode | Task Completed |