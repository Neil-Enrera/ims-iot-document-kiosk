# TASK-TESTING-008 — Security Testing

> **Phase:** Testing
> **Task ID:** TASK-TESTING-008
> **Priority:** P0 (Critical)
> **Status:** DONE

---

# Objective

Verify that the Information Management System with IoT-Assisted Document Request Services Kiosk protects sensitive information, enforces proper access control, and prevents unauthorized system access.

This task ensures that only authorized users can perform restricted operations while maintaining the confidentiality, integrity, and availability of system data.

---

# Background

The system stores sensitive information including:

- Resident Information
- User Accounts
- Document Requests
- Payment Records
- RFID Information
- Audit Logs

Since the system will be used by both barangay staff and residents through a public kiosk, security controls must be thoroughly tested before deployment.

---

# Scope

## Included

Authentication Security

Authorization

Session Management

Role-Based Access Control (RBAC)

Input Validation

File Upload Security

RFID Authentication Security

Kiosk Session Security

Audit Logging

Error Handling

---

## Not Included

- Network Penetration Testing
- Operating System Hardening
- Firewall Configuration
- Third-party Security Audits

---

# Security Components

## Authentication

Verify

- Valid Login
- Invalid Login
- Incorrect Password
- Locked Account (if implemented)
- Expired Session
- Logout

---

## Authorization

Verify access permissions

Administrator

```
Full System Access
```

Secretary

```
Resident Management

Requests

Services
```

Treasurer

```
Payments

Reports
```

Resident (Kiosk)

```
Request Documents Only
```

Residents must never access administrative modules.

---

## Role-Based Access Control

Verify

- Hidden menus
- Protected routes
- Protected APIs
- Restricted operations

---

## Session Management

Verify

- Automatic Timeout
- Logout
- Session Expiration
- Session Cleanup
- Browser Refresh Recovery

---

## RFID Authentication

Verify

- Valid RFID
- Invalid RFID
- Inactive RFID
- Duplicate Scan Prevention

---

## Input Validation

Verify

- Empty Fields
- Invalid Data Types
- Oversized Input
- Special Characters
- Unexpected Input

---

## File Upload Security

Verify

Allowed

```
Images

PDF Documents
```

Reject

```
Executable Files

Scripts

Unsupported Formats
```

Verify file size limits.

---

## Audit Logging

Verify that security-related events are recorded.

Examples

```
Login

Logout

Authentication Failure

Permission Denied

RFID Authentication

Request Submission
```

---

# Security Testing Workflow

```
Prepare Test Account

↓

Attempt Operation

↓

Validate Permission

↓

Access Allowed?

↓

YES

↓

Verify Expected Access

↓

NO

↓

Verify Access Denied

↓

Record Result
```

---

# Authentication Testing

Verify

Successful Login

↓

JWT Generated

↓

Access Granted

Invalid Login

↓

Access Denied

↓

Error Message Displayed

Expired Session

↓

Redirect to Login

---

# Authorization Testing

Example

Secretary attempts to access

```
Payment Module
```

Expected

```
Access Denied
```

---

Administrator accesses

```
System Settings
```

Expected

```
Access Granted
```

---

# Kiosk Security

Verify

Residents cannot

- Open staff pages
- Access reports
- View other resident information
- Modify resident records

Session should automatically terminate after

```
5 Minutes
```

(configurable)

---

# Error Message Validation

Verify

Authentication Failed

```
Invalid username or password.
```

Permission Denied

```
You do not have permission to perform this action.
```

Session Expired

```
Please log in again.
```

Messages should not expose internal system details.

---

# Testing Environment

Software

```
Angular

Node.js

Express.js

MySQL
```

Hardware

```
Arduino Uno

RFID Reader

Touchscreen
```

Browsers

```
Chrome

Edge
```

---

# Folder Structure

```
testing/

security/

authentication/

authorization/

sessions/

rfid/

file-upload/

audit/

reports/
```

Documentation

```
docs/

testing/

security/

test-cases/

reports/
```

---

# Test Case Format

Each security test should include

```
Test ID

Security Area

Scenario

Preconditions

Steps

Expected Result

Actual Result

Status

Remarks
```

---

# Naming Convention

```
SEC-AUTH-001

SEC-RBAC-001

SEC-RFID-001

SEC-SESSION-001

SEC-UPLOAD-001
```

---

# Logging

Record

- Test ID
- Security Module
- Scenario
- Result
- Tester
- Date

---

# Testing Checklist

Authentication

- [ ] Valid Login
- [ ] Invalid Login
- [ ] Logout

Authorization

- [ ] Administrator
- [ ] Secretary
- [ ] Treasurer

Session

- [ ] Timeout
- [ ] Expiration
- [ ] Cleanup

RFID

- [ ] Registered Card
- [ ] Invalid Card
- [ ] Inactive Card

Validation

- [ ] Invalid Input
- [ ] Required Fields

File Upload

- [ ] Allowed Files
- [ ] Invalid Files

Audit Logs

- [ ] Login Events
- [ ] Permission Denied
- [ ] Request Activities

---

# Acceptance Criteria

- Authentication works correctly.
- Unauthorized access is prevented.
- Sessions expire correctly.
- Input validation blocks invalid data.
- File upload restrictions are enforced.
- Audit logs record security events.
- No critical security issues remain.

---

# Definition of Done

- Security testing completed.
- Security reports documented.
- Access control verified.
- Ready for Performance & Reliability Testing.

---

# Estimated Effort

8–10 hours

---

# Next Task

**TASK-TESTING-009 — Performance & Reliability Testing**

---

# Notes for OpenCode

Before implementing:

1. Test every user role to ensure role-based permissions are consistently enforced across the frontend and backend.
2. Verify that protected API endpoints cannot be accessed directly without proper authentication.
3. Ensure all user input is validated on both the client and server sides.
4. Confirm that audit logs capture security-related events without storing sensitive information such as passwords or tokens.
5. Test kiosk session cleanup thoroughly to ensure no resident data remains visible after timeout or request completion.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| 2026-07-31 | OpenCode | Task Completed |