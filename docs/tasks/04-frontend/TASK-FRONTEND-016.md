# TASK-FRONTEND-016 — System Settings Module

> **Phase:** Frontend
> **Task ID:** TASK-FRONTEND-016
> **Priority:** P1 (High)
> **Status:** Done

---

# Objective

Develop the System Settings Module to manage configurable system options including barangay information, security policies, document templates, kiosk settings, RFID configuration, notifications, and maintenance preferences.

This module provides a centralized interface for administrators to customize the system without changing source code.

---

# Background

The backend exposes:

```
GET    /api/v1/settings
PUT    /api/v1/settings
GET    /api/v1/settings/:category
PUT    /api/v1/settings/:category
```

Settings are grouped by category.

---

# Scope

Included

- General Settings
- Barangay Profile
- User & Security
- Document Templates
- Kiosk Configuration
- RFID Configuration
- Notification Settings
- Backup & Maintenance
- System Information

Not Included

- Server Installation
- Database Migration
- Software Updates

---

# Navigation

```
Sidebar

↓

Administration

↓

System Settings
```

Route

```
/settings
```

---

# Settings Categories

## General Settings

Configure

- System Name
- Organization Name
- Time Zone
- Date Format
- Language (Future)

---

## Barangay Profile

Fields

- Barangay Name
- Municipality / City
- Province
- Contact Number
- Email
- Office Hours
- Barangay Logo

---

## User & Security

Configure

- Session Timeout
- Password Policy
- Maximum Login Attempts
- Default User Role
- Account Lock Duration

---

## Document Templates

Manage

- Barangay Clearance Template
- Certificate of Residency Template
- Certificate of Indigency Template
- Business Clearance Template
- Other printable documents

---

## Kiosk Configuration

Configure

- Kiosk Mode
- Idle Timeout
- Auto Logout
- Touchscreen Calibration (reference settings)
- Camera Enabled
- RFID Reader Enabled
- Printer Enabled

---

## RFID Configuration

Configure

- Reader Name
- Reader Status
- Auto Verify
- Scan Timeout
- Duplicate Card Detection

---

## Notification Settings

Configure

- Enable Notifications
- Notification Retention
- Dashboard Alerts
- System Announcements

---

## Backup & Maintenance

Display

- Last Backup
- Backup Schedule
- Storage Usage
- System Maintenance Mode

---

## System Information

Display

- Application Version
- Database Version
- Backend Version
- Frontend Version
- Build Date
- Environment

Read-only information.

---

# Layout

```
+-----------------------------------------------------------+

System Settings

------------------------------------------------------------

General

Barangay Profile

Security

Templates

Kiosk

RFID

Notifications

Backup

System Info

------------------------------------------------------------

Settings Form

------------------------------------------------------------

Save

Reset
```

---

# Components

```
settings-sidebar.component

settings-form.component

barangay-profile.component

security-settings.component

template-settings.component

kiosk-settings.component

rfid-settings.component

notification-settings.component

backup-settings.component

system-information.component
```

---

# Folder Structure

```
features/

settings/

pages/

general/

barangay/

security/

templates/

kiosk/

rfid/

notifications/

backup/

system-info/

components/

settings-sidebar/

settings-form/

services/

settings.facade.ts
```

---

# API Integration

Methods

```
getSettings()

getCategory()

updateSettings()

updateCategory()
```

---

# Validation

Required

- Barangay Name
- Municipality / City
- Province

Validate

- Session timeout must be positive.
- Login attempts must be greater than zero.
- Contact email format.
- Logo file type.

---

# Shared Components Used

- Tabs
- Form Controls
- File Upload
- Toggle Switch
- Confirmation Dialog
- Snackbar
- Loading Skeleton

---

# Loading State

Display

- Skeleton Forms
- Skeleton Sidebar

---

# Error Handling

Validation Error

```
Please correct the highlighted fields.
```

API Error

```
Unable to save settings.
```

Permission Error

```
You do not have permission to modify system settings.
```

---

# Role-Based Access

Administrator

- Full access

Secretary

- View only (optional)

Treasurer

- View only (optional)

---

# Integration

Dashboard

```
Barangay Name

Logo
```

Document Requests

```
Document Templates
```

Kiosk

```
Hardware Configuration
```

RFID

```
Reader Configuration
```

Notifications

```
Notification Preferences
```

---

# Implementation Checklist

- [ ] Build Settings Navigation
- [ ] Build General Settings
- [ ] Build Barangay Profile
- [ ] Build Security Settings
- [ ] Build Document Templates
- [ ] Build Kiosk Settings
- [ ] Build RFID Settings
- [ ] Build Notification Settings
- [ ] Build Backup Settings
- [ ] Build System Information
- [ ] Connect Settings APIs
- [ ] Enforce Administrator permissions

---

# Verification

Administrator

Can modify all settings.

Secretary

Cannot modify settings.

Barangay logo updates correctly.

Document template configuration is saved.

Kiosk configuration updates successfully.

---

# Acceptance Criteria

- Settings load correctly.
- Category updates work.
- Validation works.
- Role restrictions are enforced.
- UI follows the shared design system.
- Backend integration verified.

---

# Definition of Done

- System Settings module completed.
- Configuration changes persist.
- Ready for Responsive Layout & Accessibility.

---

# Estimated Effort

10–12 hours

---

# Next Task

**TASK-FRONTEND-017 — Responsive Layout & Accessibility**

---

# Notes for OpenCode

Before implementing:

1. Organize settings into independent categories so each can be loaded and saved separately.
2. Keep hardware-related settings (RFID reader, kiosk, printer, webcam) isolated from general application settings.
3. Store only configuration values in this module—avoid embedding business logic.
4. Reuse the shared form components and validation patterns established earlier in the project.
5. Design the settings architecture so additional configuration categories can be added without changing the navigation structure.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |