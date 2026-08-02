# TASK-TESTING-002 — Unit Testing

> **Phase:** Testing
> **Task ID:** TASK-TESTING-002
> **Priority:** P0 (Critical)
> **Status:** DONE

---

# Objective

Verify that each individual software component of the Information Management System with IoT-Assisted Document Request Services Kiosk functions correctly in isolation before integration with other modules.

Unit testing ensures that each service, controller, repository, component, and utility performs according to its intended functionality and produces the expected output.

---

# Background

Before testing the entire system, every software module should be validated independently.

By testing each unit separately, defects can be identified early, reducing the complexity of debugging during later integration testing.

This task focuses on software units only.

Hardware communication and end-to-end workflows are covered in later testing tasks.

---

# Scope

## Included

Backend

- Services
- Controllers
- Repositories
- Middleware
- Utilities
- Validation

Frontend

- Components
- Services
- Route Guards
- Pipes
- Form Validation

---

## Not Included

- Database Integration
- API Communication
- RFID Communication
- Webcam Integration
- Printer Integration
- System Integration

These are tested in subsequent tasks.

---

# Unit Testing Coverage

## Backend

Authentication

```
Login

JWT Generation

Password Validation
```

---

Resident Module

```
Create Resident

Update Resident

Delete Resident

Resident Search
```

---

User Management

```
Create User

Update User

Assign Role

Deactivate User
```

---

Service Management

```
Create Service

Update Service

Delete Service

Retrieve Services
```

---

Document Requests

```
Create Request

Update Status

Retrieve Request

Cancel Request
```

---

Payments

```
Record Payment

Update Payment

Generate Receipt Data
```

---

Reports

```
Generate Reports

Export Data
```

---

RFID Service

```
Read UID

Validate UID

Resident Lookup
```

(Mock data only)

---

Camera Service

```
Initialize Camera

Capture Image

Validate Image

Compress Image
```

(Mock implementation)

---

## Frontend

Authentication

```
Login Form

Validation

Session Storage
```

---

Dashboard

```
Statistics Display

Charts

Navigation
```

---

Resident Management

```
Resident Form

Validation

Resident Profile Display
```

---

Document Requests

```
Create Request Form

Status Display

Filtering

Searching
```

---

Payments

```
Payment Form

Validation

Receipt Preview
```

---

Kiosk

```
RFID Screen

Service Selection

Photo Preview

Request Confirmation
```

---

Shared Components

```
Buttons

Dialogs

Tables

Pagination

Loading Spinner
```

---

# Unit Testing Workflow

```
Select Module

↓

Prepare Test Data

↓

Execute Unit Test

↓

Compare Expected Result

↓

Pass?

↓

YES

↓

Record Result

↓

NO

↓

Fix Issue

↓

Retest
```

---

# Testing Environment

Development Environment

```
Angular

Node.js

Express

MySQL
```

Testing Tools

```
Jest

Angular TestBed

Karma

Postman (API validation only)

GitHub Actions (optional)
```

---

# Mock Objects

Use mock data for:

- Database Responses
- JWT Tokens
- Resident Records
- RFID UID
- Camera Output
- File Upload

Hardware should not be required during unit testing.

---

# Test Case Format

Each unit test should include

```
Test ID

Module

Function

Precondition

Input

Expected Output

Actual Output

Status

Remarks
```

---

# Naming Convention

Backend

```
UT-AUTH-001

UT-USER-001

UT-REQ-001
```

Frontend

```
UT-UI-001

UT-RES-001

UT-KIOSK-001
```

---

# Folder Structure

```
backend/

tests/

unit/

authentication/

users/

residents/

services/

requests/

payments/

reports/

rfid/

camera/
```

```
frontend/

src/

tests/

unit/

components/

services/

guards/

forms/
```

---

# Code Coverage Goal

Target

```
Minimum

80%

Preferred

90%
```

Coverage should include

- Statements
- Branches
- Functions
- Lines

---

# Error Handling

Verify

- Invalid Input
- Null Values
- Empty Data
- Validation Errors
- Unexpected Exceptions

Each unit should fail gracefully.

---

# Logging

Record

- Module Tested
- Test Case ID
- Execution Time
- Result
- Tester
- Date

---

# Testing Checklist

Backend

- [ ] Authentication
- [ ] Users
- [ ] Residents
- [ ] Services
- [ ] Requests
- [ ] Payments
- [ ] Reports
- [ ] RFID Service
- [ ] Camera Service

Frontend

- [ ] Login
- [ ] Dashboard
- [ ] Resident Module
- [ ] Request Module
- [ ] Payment Module
- [ ] Shared Components
- [ ] Route Guards
- [ ] Form Validation

---

# Acceptance Criteria

- All critical modules pass unit testing.
- Mock data produces expected results.
- Error handling behaves correctly.
- Code coverage target achieved.
- No critical defects remain.

---

# Definition of Done

- Unit testing completed for all major software modules.
- Test results documented.
- Ready for Database Testing.

---

# Estimated Effort

8–10 hours

---

# Next Task

**TASK-TESTING-003 — Database Testing**

---

# Notes for OpenCode

Before implementing:

1. Keep unit tests independent from external systems by mocking database queries, hardware devices, and API calls.
2. Organize tests to mirror the project structure so each module has a corresponding test folder.
3. Write descriptive test names that explain the expected behavior rather than the implementation.
4. Execute unit tests automatically before committing major changes whenever possible.
5. Generate code coverage reports to identify modules that require additional testing.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| 2026-07-31 | OpenCode | Task Completed |