# TASK-TESTING-004 — Backend API Testing

> **Phase:** Testing
> **Task ID:** TASK-TESTING-004
> **Priority:** P0 (Critical)
> **Status:** DONE

---

# Objective

Verify that all backend REST APIs function correctly, securely, and reliably for the Information Management System with IoT-Assisted Document Request Services Kiosk.

This task validates that every API endpoint processes requests correctly, returns the expected responses, enforces business rules, and protects system resources from unauthorized access.

---

# Background

The backend serves as the central communication layer between the Angular frontend, the kiosk application, the IoT hardware, and the MySQL database.

Before the frontend and hardware integrations can be fully validated, every API endpoint must be tested independently.

---

# Scope

## Included

- Authentication API
- User Management API
- Resident Management API
- RFID API
- Service Management API
- Request Management API
- Payment API
- Reports API
- File Upload API
- Dashboard API
- Settings API
- Audit Log API

---

## Not Included

- Frontend UI
- Database Schema Validation
- Hardware Communication
- Performance Stress Testing

These are covered in other testing tasks.

---

# APIs Under Test

Authentication

```
POST /auth/login

POST /auth/logout

POST /auth/refresh
```

---

Users

```
GET /users

POST /users

PUT /users/{id}

DELETE /users/{id}
```

---

Residents

```
GET /residents

POST /residents

PUT /residents/{id}

DELETE /residents/{id}
```

---

RFID

```
POST /rfid/scan

POST /rfid/register

PUT /rfid/update
```

---

Services

```
GET /services

POST /services

PUT /services/{id}

DELETE /services/{id}
```

---

Requests

```
GET /requests

POST /requests

PUT /requests/{id}

PATCH /requests/{id}/status
```

---

Payments

```
GET /payments

POST /payments

PUT /payments/{id}
```

---

Reports

```
GET /reports/residents

GET /reports/requests

GET /reports/payments
```

---

Files

```
POST /files/upload

GET /files/{id}
```

---

Dashboard

```
GET /dashboard/statistics
```

---

Settings

```
GET /settings

PUT /settings
```

---

Audit Logs

```
GET /audit-logs
```

---

# API Testing Workflow

```
Prepare Test Data

↓

Send API Request

↓

Validate Response

↓

Verify Database Changes

↓

Pass?

↓

YES

↓

Record Result

↓

NO

↓

Log Defect

↓

Retest
```

---

# Test Categories

## Functional Testing

Verify

- Correct endpoint behavior
- Business logic execution
- CRUD operations

---

## Validation Testing

Verify

- Required fields
- Invalid input
- Missing data
- Incorrect data types

---

## Authentication Testing

Verify

- Login required
- JWT validation
- Token expiration
- Invalid token rejection

---

## Authorization Testing

Verify

Administrator

```
Full Access
```

Secretary

```
Assigned Modules
```

Treasurer

```
Payment Module
```

Residents

```
No access to staff APIs
```

---

## Response Validation

Verify

- HTTP Status Codes
- JSON Structure
- Response Messages
- Error Responses

---

# Expected HTTP Status Codes

```
200 OK

201 Created

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

500 Internal Server Error
```

---

# Testing Environment

Backend

```
Node.js

Express.js
```

Database

```
MySQL
```

Testing Tools

```
Postman

Bruno (Optional)

Swagger UI

VS Code REST Client
```

---

# Test Data

Use sample data

Resident

```
Juan Dela Cruz
```

RFID

```
UID-0001
```

Request

```
Barangay Clearance
```

No real resident information should be used.

---

# Folder Structure

```
backend/

tests/

api/

authentication/

users/

residents/

services/

requests/

payments/

reports/

rfid/

files/

settings/

audit/
```

Documentation

```
docs/

testing/

backend-api/

test-cases/

reports/
```

---

# Test Case Format

Each API test should include

```
Test ID

Endpoint

HTTP Method

Authentication Required

Request Body

Expected Response

Actual Response

Status

Remarks
```

---

# Naming Convention

```
API-AUTH-001

API-USER-001

API-RES-001

API-RFID-001

API-REQ-001

API-PAY-001
```

---

# Error Handling

Verify

- Invalid Request Body
- Missing Authentication
- Invalid JWT
- Unauthorized Access
- Duplicate Records
- Invalid Resource ID
- Server Exceptions

The API should return meaningful error messages without exposing sensitive information.

---

# Logging

Record

- Test ID
- Endpoint
- Method
- Response Time
- Status Code
- Result
- Tester
- Date

---

# Testing Checklist

Authentication

- [ ] Login
- [ ] Logout
- [ ] Token Refresh

Users

- [ ] CRUD

Residents

- [ ] CRUD

RFID

- [ ] Scan
- [ ] Register

Services

- [ ] CRUD

Requests

- [ ] CRUD
- [ ] Status Update

Payments

- [ ] CRUD

Reports

- [ ] Generate Reports

Files

- [ ] Upload
- [ ] Retrieve

Settings

- [ ] Read
- [ ] Update

Audit Logs

- [ ] Retrieve Logs

---

# Acceptance Criteria

- All API endpoints respond correctly.
- Authentication and authorization are enforced.
- Validation rules reject invalid requests.
- Database changes match API operations.
- No critical API defects remain.

---

# Definition of Done

- Backend API testing completed.
- Test reports documented.
- APIs validated for frontend integration.
- Ready for Frontend UI Testing.

---

# Estimated Effort

8–10 hours

---

# Next Task

**TASK-TESTING-005 — Frontend UI Testing**

---

# Notes for OpenCode

Before implementing:

1. Maintain a dedicated API testing collection (e.g., Postman or Bruno) grouped by module to simplify regression testing.
2. Test both successful and failure scenarios for every endpoint, including invalid inputs and unauthorized access.
3. Use environment variables for the API base URL and authentication tokens to make the test collection reusable.
4. Verify not only the API response but also the resulting database state for create, update, and delete operations.
5. Include API documentation examples that match the tested request and response formats to keep documentation synchronized with implementation.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| 2026-07-31 | OpenCode | Task Completed |