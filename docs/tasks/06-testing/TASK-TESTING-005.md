# TASK-TESTING-005 — Frontend UI Testing

> **Phase:** Testing
> **Task ID:** TASK-TESTING-005
> **Priority:** P0 (Critical)
> **Status:** DONE

---

# Objective

Verify that the Angular frontend provides a functional, responsive, and user-friendly interface for both the Information Management System (IMS) and the IoT-Assisted Document Request Services Kiosk.

This task ensures that all user interface components, navigation, forms, and interactions work correctly and provide a consistent user experience across supported devices.

---

# Background

The frontend serves as the primary interface for:

- Barangay Staff
- Administrators
- Kiosk Residents

Although the backend APIs have already been tested, this task focuses on ensuring the frontend correctly consumes those APIs and presents information accurately to users.

---

# Scope

## Included

Staff Portal

- Login
- Dashboard
- Resident Management
- User Management
- Service Management
- Request Management
- Payment Management
- Reports
- Audit Logs
- File Management
- Settings

Kiosk

- Idle Screen
- RFID Authentication
- Resident Verification
- Service Selection
- Photo Capture
- Request Review
- Success Screen

Shared Components

- Navigation
- Forms
- Tables
- Dialogs
- Notifications
- Pagination
- Search
- Filtering

---

## Not Included

- Backend API Validation
- Database Testing
- Hardware Communication
- Performance Stress Testing

---

# UI Modules Under Test

## Authentication

Verify

- Login Page
- Form Validation
- Error Messages
- Logout
- Session Expiration

---

## Dashboard

Verify

- Statistics Cards
- Charts
- Quick Actions
- Recent Activities
- Navigation

---

## Resident Management

Verify

- Resident List
- Search
- Filtering
- Add Resident
- Edit Resident
- View Resident Profile
- Delete Resident

---

## User Management

Verify

- User List
- Role Assignment
- User Creation
- User Update
- User Deactivation

---

## Service Management

Verify

- Add Service
- Update Service
- Delete Service
- Service Availability

---

## Request Management

Verify

- Request List
- Status Updates
- Request Details
- Approval Workflow
- Filtering

---

## Payment Management

Verify

- Payment Recording
- Payment History
- Receipt Preview

---

## Reports

Verify

- Report Generation
- Export Options
- Filters
- Charts

---

## File Management

Verify

- Upload File
- Download File
- Delete File
- Preview File

---

## System Settings

Verify

- Barangay Information
- System Configuration
- Kiosk Settings
- Notification Settings

---

## Kiosk Interface

Verify

- Idle Screen
- RFID Prompt
- Welcome Screen
- Service Selection
- Requirements Display
- Camera Preview
- Request Review
- Submission Success
- Automatic Logout

---

# User Interface Workflow

```
Open Application

↓

Login

↓

Dashboard

↓

Select Module

↓

Perform Operation

↓

Display Result

↓

Logout
```

Kiosk Workflow

```
Idle Screen

↓

RFID Scan

↓

Resident Verified

↓

Select Service

↓

Capture Photo

↓

Review Request

↓

Submit Request

↓

Success Screen

↓

Return to Idle
```

---

# UI Testing Categories

## Functional Testing

Verify

- Buttons
- Forms
- Links
- Navigation
- CRUD Operations

---

## Validation Testing

Verify

- Required Fields
- Invalid Input
- Error Messages
- Input Limits

---

## Responsive Testing

Verify

Desktop

```
1920 × 1080
```

Laptop

```
1366 × 768
```

Tablet

```
1280 × 800
```

Kiosk

```
Touchscreen Full Screen
```

---

## Accessibility

Verify

- Keyboard Navigation
- Focus Indicators
- Readable Text
- Button Sizes
- Touch Targets

---

# Browser Compatibility

Supported Browsers

- Google Chrome
- Microsoft Edge

Optional

- Mozilla Firefox

Verify

- Layout Consistency
- Functionality
- Form Behavior

---

# Testing Environment

Frontend

```
Angular
```

Browsers

```
Chrome

Edge
```

Devices

```
Desktop

Laptop

Touchscreen Kiosk
```

---

# Folder Structure

```
frontend/

tests/

ui/

authentication/

dashboard/

residents/

users/

services/

requests/

payments/

reports/

files/

settings/

kiosk/

shared/
```

Documentation

```
docs/

testing/

frontend-ui/

test-cases/

reports/
```

---

# Test Case Format

Each UI test should include

```
Test ID

Module

Feature

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
UI-AUTH-001

UI-DASH-001

UI-RES-001

UI-REQ-001

UI-KIOSK-001
```

---

# Error Handling

Verify

- Invalid Form Input
- Missing Required Fields
- API Error Messages
- Session Expiration
- Network Connection Loss
- Page Not Found

The interface should display clear and user-friendly messages without exposing technical details.

---

# Logging

Record

- Test ID
- Module
- Browser
- Device
- Tester
- Execution Time
- Result
- Date

---

# Testing Checklist

Authentication

- [ ] Login
- [ ] Logout

Dashboard

- [ ] Statistics
- [ ] Charts

Residents

- [ ] CRUD
- [ ] Search
- [ ] Filters

Users

- [ ] CRUD

Services

- [ ] CRUD

Requests

- [ ] Workflow
- [ ] Status Updates

Payments

- [ ] Record Payment

Reports

- [ ] Generate Reports

Files

- [ ] Upload
- [ ] Download

Settings

- [ ] Configuration

Kiosk

- [ ] Authentication
- [ ] Service Selection
- [ ] Camera
- [ ] Request Submission
- [ ] Success Screen

---

# Acceptance Criteria

- All user interfaces function correctly.
- Forms validate user input properly.
- Navigation works across all modules.
- Responsive layouts display correctly.
- Error messages are clear and informative.
- No critical UI defects remain.

---

# Definition of Done

- Frontend UI testing completed.
- Test reports documented.
- User interface validated across supported devices.
- Ready for Kiosk & IoT Integration Testing.

---

# Estimated Effort

8–10 hours

---

# Next Task

**TASK-TESTING-006 — Kiosk & IoT Integration Testing**

---

# Notes for OpenCode

Before implementing:

1. Test the frontend against the actual backend APIs whenever possible instead of using mocked responses.
2. Verify both mouse and touchscreen interactions, especially for kiosk screens.
3. Ensure all validation messages are consistent in wording and appearance across the application.
4. Test role-based navigation to confirm users only see modules they are authorized to access.
5. Record screenshots of passed and failed UI tests to support capstone documentation and presentations.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| 2026-07-31 | OpenCode | Task Completed |