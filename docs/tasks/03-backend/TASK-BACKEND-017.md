# TASK-BACKEND-017 — System Settings API

> **Phase:** Backend
> **Task ID:** TASK-BACKEND-017
> **Priority:** P2 (Medium)
> **Status:** Done

---

# Objective

Develop the System Settings API to manage configurable system parameters used throughout the Information Management System.

This module allows administrators to configure operational settings, document request options, kiosk behavior, and other application preferences through the web interface.

---

# Background

Many values within the system may change over time without requiring code changes.

Examples include:

- Barangay information
- Office hours
- Request limits
- Kiosk timeout duration
- System maintenance mode
- Default document validity period
- Supported payment methods
- Logo and branding

Instead of hardcoding these values, they should be managed through configurable settings.

---

# Scope

## Included

- View settings
- Update settings
- Group settings by category
- Validate configuration values
- Cache frequently used settings

## Not Included

- Application deployment configuration (.env)
- Database server configuration
- Operating system settings

---

# Dependencies

- TASK-BACKEND-005 — Authentication (JWT)
- TASK-BACKEND-015 — Audit Log API

---

# Database Tables

Recommended table:

```text
system_settings
```

Suggested fields:

```text
setting_id
setting_key
setting_value
setting_type
category
description
updated_by
updated_at
```

If your existing schema already contains a settings table, use that instead.

---

# Setting Categories

## Barangay Information

- Barangay Name
- Address
- Contact Number
- Email Address
- Office Hours

---

## Kiosk Settings

- Idle Timeout
- Session Timeout
- Camera Enabled
- RFID Enabled
- Touchscreen Calibration Flag

---

## Document Settings

- Default Processing Days
- Document Validity Period
- Auto Generate Request Number
- Enable QR Code (future)

---

## Payment Settings

- Cash Enabled
- GCash Enabled (future)
- Default Service Fee Behavior

---

## Notification Settings

- Enable In-App Notifications
- Enable Email Notifications (future)
- Enable SMS Notifications (future)

---

## System Settings

- Maintenance Mode
- Backup Reminder
- System Version (read-only)
- Time Zone

---

# API Endpoints

## Get All Settings

```http
GET /api/v1/settings
```

---

## Get Settings by Category

```http
GET /api/v1/settings/category/:category
```

Example:

```http
GET /api/v1/settings/category/kiosk
```

---

## Get Single Setting

```http
GET /api/v1/settings/:key
```

---

## Update Setting

```http
PUT /api/v1/settings/:key
```

Example Request

```json
{
    "value": "15"
}
```

---

## Reset Category to Default

```http
POST /api/v1/settings/category/:category/reset
```

Optional, based on project requirements.

---

# Business Rules

- Only administrators may modify settings.
- Read-only settings cannot be updated.
- Changes should take effect immediately unless a restart is required.
- Every update must generate an audit log entry.
- Invalid values must be rejected.

---

# Validation Rules

Examples:

- Timeout values must be positive integers.
- Email must follow a valid email format.
- Phone number format must be valid.
- Boolean settings must accept only `true` or `false`.
- Numeric settings must remain within predefined limits.

---

# Authorization

| Action | Allowed Roles |
|---------|---------------|
| View Settings | Administrator |
| Update Settings | Administrator |
| Reset Settings | Administrator |

---

# Folder Structure

```text
backend/src/

controllers/
    setting.controller.js

services/
    setting.service.js

repositories/
    setting.repository.js

routes/
    setting.routes.js
```

---

# Files to Create

```text
controllers/setting.controller.js
services/setting.service.js
repositories/setting.repository.js
routes/setting.routes.js
```

---

# Files to Modify

```text
routes/api.js
```

Register the System Settings routes.

---

# Integration

Examples:

```text
Kiosk Startup
      │
      ▼
Load Kiosk Settings
      │
      ▼
Apply Idle Timeout
```

```text
Generate Document
      │
      ▼
Read Document Settings
      │
      ▼
Apply Validity Period
```

```text
Application Start
      │
      ▼
Load Barangay Information
      │
      ▼
Display in Header/Footer
```

---

# Implementation Checklist

- [ ] Retrieve settings
- [ ] Update settings
- [ ] Group settings by category
- [ ] Validate setting values
- [ ] Protect endpoints using JWT and RBAC
- [ ] Record audit logs
- [ ] Test setting updates

---

# Verification

### Get All Settings

```http
GET /api/v1/settings
```

Returns all configurable settings.

---

### Update Setting

```http
PUT /api/v1/settings/kioskIdleTimeout
```

Request

```json
{
    "value": "30"
}
```

Expected:

```http
200 OK
```

---

### Unauthorized Update

A non-administrator attempts to modify a setting.

Expected:

```http
403 Forbidden
```

---

# Acceptance Criteria

- Administrators can manage system settings.
- Setting values are validated before saving.
- Updates are immediately available to dependent modules.
- Audit logs are generated for every modification.
- API responses follow the project standard.

---

# Definition of Done

- System Settings API completed.
- Validation implemented.
- Settings integrated with dependent modules.
- Ready for final system testing.

---

# Estimated Effort

4–6 hours

---

# Next Task

**TASK-BACKEND-018 — API Testing & Validation**

---

# Notes for OpenCode

Before implementing:

1. Treat settings as application configuration rather than business data.
2. Cache frequently accessed settings to reduce database queries.
3. Invalidate the cache immediately after updates.
4. Keep validation logic in the service layer.
5. Record every configuration change in the Audit Log.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |