# TASK-TESTING-003 — Database Testing

> **Phase:** Testing
> **Task ID:** TASK-TESTING-003
> **Priority:** P0 (Critical)
> **Status:** DONE

---

# Objective

Verify that the MySQL database functions correctly, maintains data integrity, and supports all operations required by the Information Management System with IoT-Assisted Document Request Services Kiosk.

Database testing ensures that data is stored, retrieved, updated, and deleted accurately while preserving relationships and enforcing business rules.

---

# Background

The database serves as the central repository for all system information, including resident records, document requests, RFID cards, payments, users, and audit logs.

Since every module relies on the database, it must be tested before API and system integration testing.

---

# Scope

## Included

- Database Connection
- Table Structure
- CRUD Operations
- Foreign Key Constraints
- Data Validation
- Transactions
- Index Verification
- Stored Procedures (if implemented)
- Seed Data Validation
- Backup & Restore Verification

---

## Not Included

- API Testing
- Frontend Testing
- Hardware Testing
- Performance Stress Testing

These are covered in later tasks.

---

# Database Components

The following tables will be tested:

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

Additional tables should also be included if added during development.

---

# Test Coverage

## Database Connection

Verify

- Database connection established
- Authentication successful
- Database accessible
- Connection recovery after interruption

---

## Table Structure

Verify

- Correct table names
- Primary Keys
- Foreign Keys
- Data Types
- Default Values
- Constraints

---

## CRUD Operations

Each table should support

```
Create

Read

Update

Delete
```

Verify successful execution and correct data persistence.

---

## Foreign Key Constraints

Verify relationships such as

```
Resident

↓

Requests

↓

Payments
```

```
Resident

↓

RFID Card
```

```
User

↓

Audit Logs
```

Ensure orphan records cannot be created.

---

## Data Validation

Verify

- Required fields
- Unique constraints
- Data length
- Invalid values
- Null restrictions
- Duplicate records

---

## Transactions

Verify that grouped database operations

```
Commit

Rollback
```

execute correctly when failures occur.

Example

```
Create Request

↓

Create Audit Log

↓

Commit

OR

Rollback
```

---

## Seed Data

Verify default records

Examples

```
Administrator Role

Secretary Role

Treasurer Role

Default Request Statuses

Available Services
```

Ensure required reference data exists.

---

## Backup & Restore

Verify

- Database backup generation
- Restore process
- Data integrity after restoration

---

# Database Testing Workflow

```
Connect Database

↓

Prepare Test Data

↓

Execute SQL Operation

↓

Verify Result

↓

Pass?

↓

YES

↓

Record Result

↓

NO

↓

Fix

↓

Retest
```

---

# Testing Environment

Database

```
MySQL
```

Development Tools

```
MySQL Workbench

phpMyAdmin

Visual Studio Code

Node.js
```

---

# Test Data

Use representative but fictional data

Residents

```
Juan Dela Cruz

Maria Santos
```

RFID

```
UID-0001

UID-0002
```

Requests

```
Barangay Clearance

Certificate of Residency
```

No real resident information should be used.

---

# Folder Structure

```
database/

tests/

connection/

tables/

crud/

constraints/

transactions/

seed-data/

backup/
```

Documentation

```
docs/

testing/

database/

test-cases/

reports/
```

---

# Test Case Format

Each database test should include

```
Test ID

Table

Operation

Preconditions

SQL Statement

Expected Result

Actual Result

Status

Remarks
```

---

# Naming Convention

```
DB-CONN-001

DB-CRUD-001

DB-FK-001

DB-VAL-001

DB-TRANS-001
```

---

# Error Handling

Verify

- Invalid SQL statements
- Constraint violations
- Duplicate keys
- Missing foreign keys
- Connection failures
- Transaction rollback

The database should reject invalid operations without corrupting existing data.

---

# Logging

Record

- Test ID
- Table
- Operation
- Execution Time
- Result
- Tester
- Date

---

# Testing Checklist

Connection

- [ ] Database connection

Tables

- [ ] Table structure

CRUD

- [ ] Create
- [ ] Read
- [ ] Update
- [ ] Delete

Constraints

- [ ] Foreign Keys
- [ ] Primary Keys
- [ ] Unique Constraints

Transactions

- [ ] Commit
- [ ] Rollback

Seed Data

- [ ] Default Roles
- [ ] Default Services
- [ ] Default Statuses

Backup

- [ ] Backup
- [ ] Restore

---

# Acceptance Criteria

- Database connection is stable.
- CRUD operations function correctly.
- Foreign key relationships are enforced.
- Transactions execute successfully.
- Seed data is complete.
- Backup and restore operations preserve data integrity.

---

# Definition of Done

- Database testing completed.
- Test reports documented.
- Database integrity verified.
- Ready for Backend API Testing.

---

# Estimated Effort

6–8 hours

---

# Next Task

**TASK-TESTING-004 — Backend API Testing**

---

# Notes for OpenCode

Before implementing:

1. Execute database tests using a dedicated test database to avoid modifying development data.
2. Reset the database to a known state before each test suite for consistent and repeatable results.
3. Verify both successful and failed operations, especially constraint violations and transaction rollbacks.
4. Keep SQL scripts for test setup and cleanup under version control for reproducibility.
5. Document any schema changes discovered during testing before proceeding to API testing.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| 2026-07-31 | OpenCode | Task Completed |