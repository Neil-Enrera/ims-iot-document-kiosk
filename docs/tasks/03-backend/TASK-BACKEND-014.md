# TASK-BACKEND-014 — Notification API

> **Phase:** Backend
> **Task ID:** TASK-BACKEND-014
> **Priority:** P2 (Medium)
> **Status:** Done

---

# Objective

Develop the Notification API to generate, manage, and deliver system notifications to authorized users based on significant events occurring within the Information Management System.

The notification system improves awareness of pending tasks without requiring users to manually monitor every module.

---

# Background

As requests move through the workflow, the system should notify the appropriate personnel.

Examples include:

- New document request submitted
- Request approved
- Request rejected
- Payment verified
- Document ready for release
- RFID replacement completed
- New resident registered

Initially, notifications will be **in-app notifications**. Future versions may support email or SMS.

---

# Scope

## Included

- Create notification
- Retrieve notifications
- Mark notification as read
- Mark all notifications as read
- Delete notification
- Notification counter

## Not Included

- Email notifications
- SMS notifications
- Push notifications

---

# Dependencies

- TASK-BACKEND-011 — Document Request Management API


---

# Database Tables

Use:

```text
notifications
users
```

Suggested notification fields:

- Notification ID
- User ID
- Title
- Message
- Type
- Is Read
- Created At

Use your existing schema if these fields already exist.

---

# Notification Triggers

Generate notifications when:

- New request submitted
- Request approved
- Request rejected
- Payment verified
- Request released
- RFID replaced
- New resident registered

---

# API Endpoints

## Get Notifications

```http
GET /api/v1/notifications
```

Supports:

- Pagination
- Unread filter

---

## Get Notification

```http
GET /api/v1/notifications/:id
```

---

## Mark as Read

```http
PATCH /api/v1/notifications/:id/read
```

---

## Mark All as Read

```http
PATCH /api/v1/notifications/read-all
```

---

## Delete Notification

```http
DELETE /api/v1/notifications/:id
```

---

## Unread Counter

```http
GET /api/v1/notifications/unread-count
```

Example Response

```json
{
    "success": true,
    "data": {
        "count": 5
    }
}
```

---

# Business Rules

- Notifications belong to a specific user.
- Users can only view their own notifications.
- Notifications remain available until deleted.
- Read status must be preserved.

---

# Authorization

| Action | Allowed Roles |
|---------|---------------|
| View Notifications | Authenticated Users |
| Mark as Read | Notification Owner |
| Delete Notification | Notification Owner |

---

# Folder Structure

```text
backend/src/

controllers/
    notification.controller.js

services/
    notification.service.js

repositories/
    notification.repository.js

routes/
    notification.routes.js
```

---

# Files to Create

```text
controllers/notification.controller.js
services/notification.service.js
repositories/notification.repository.js
routes/notification.routes.js
```

---

# Files to Modify

```text
routes/api.js
```

Register the Notification routes.

---

# Integration

Notifications should be generated automatically by other modules.

Example:

```text
Document Request Approved
          │
          ▼
Notification Service
          │
          ▼
Create Notification
          │
          ▼
Display in Dashboard
```

Avoid calling the notification repository directly from controllers. Let the service layer trigger notifications after successful business operations.

---

# Implementation Checklist

- [ ] Retrieve notifications
- [ ] Mark notification as read
- [ ] Mark all notifications as read
- [ ] Delete notification
- [ ] Retrieve unread count
- [ ] Trigger notifications from business modules
- [ ] Protect endpoints using JWT

---

# Verification

### Get Notifications

```http
GET /api/v1/notifications
```

Returns notifications for the authenticated user.

---

### Mark as Read

```http
PATCH /api/v1/notifications/10/read
```

Notification status becomes read.

---

### Unread Count

```http
GET /api/v1/notifications/unread-count
```

Returns the correct unread total.

---

# Acceptance Criteria

- Notifications are created automatically from business events.
- Users only see their own notifications.
- Read/unread status is maintained.
- API follows the project response standard.

---

# Definition of Done

- Notification API completed.
- Automatic notification generation implemented.
- Notification retrieval tested.

---

# Estimated Effort

3–4 hours

---

# Next Task

**TASK-BACKEND-015 — Audit Log API**

---

# Notes for OpenCode

Before implementing:

1. Keep notification generation inside the service layer.
2. Do not duplicate notification logic across modules.
3. Ensure notification queries return only the authenticated user's records.
4. Design the module so email or SMS channels can be added later without changing existing APIs.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |