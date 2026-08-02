# TASK-FRONTEND-013 — Notification Center

> **Phase:** Frontend
> **Task ID:** TASK-FRONTEND-013
> **Priority:** P1 (High)
> **Status:** Done

---

# Objective

Develop the Notification Center to provide real-time and in-app notifications for significant system events such as document requests, approvals, payments, RFID activities, and system announcements.

The Notification Center improves staff awareness and reduces delays in processing requests.

---

# Background

The backend provides:

```
GET    /api/v1/notifications
GET    /api/v1/notifications/:id
PATCH  /api/v1/notifications/:id/read
PATCH  /api/v1/notifications/read-all
DELETE /api/v1/notifications/:id
```

Notifications are generated automatically by other modules.

---

# Scope

Included

- Notification List
- Notification Details
- Mark as Read
- Mark All as Read
- Delete Notification
- Notification Badge
- Search
- Filters

Not Included

- SMS
- Email
- Push Notifications
- Chat System

---

# Navigation

```
Top Navigation

↓

Notification Bell

↓

Notification Center
```

Route

```
/notifications
```

---

# Notification Sources

Document Requests

```
New Request Submitted

Request Approved

Request Rejected

Document Ready for Release
```

Payments

```
Payment Recorded

Payment Verified
```

RFID

```
RFID Assigned

RFID Replaced
```

Residents

```
New Resident Registered
```

System

```
Maintenance Notice

System Update
```

---

# Notification Types

```
Information

Success

Warning

Error
```

---

# Notification Status

```
Unread

Read

Archived (Optional)
```

---

# Pages

## Notification Center

Display

- Icon
- Title
- Message
- Module
- Timestamp
- Status

Actions

- View
- Mark as Read
- Delete

---

## Notification Details

Display

- Full Message
- Source Module
- Related Record
- Timestamp
- Sender (System/User)

Buttons

```
Open Related Record

Mark as Read
```

---

# Notification Layout

```
+-------------------------------------------------------------+

Notifications

---------------------------------------------------------------

Unread (5)

---------------------------------------------------------------

● Request Approved

2 minutes ago

---------------------------------------------------------------

● RFID Assigned

15 minutes ago

---------------------------------------------------------------

✓ Payment Recorded

Yesterday

---------------------------------------------------------------

[ Mark All Read ]
```

---

# Notification Badge

Display

```
Unread Count
```

Example

```
🔔 7
```

Badge updates automatically after reading notifications.

---

# Search

Supports

- Notification Title
- Message
- Module

---

# Filters

- Unread
- Read
- Notification Type
- Module
- Date Range

---

# Sorting

- Newest First
- Oldest First

---

# Components

```
notification-list.component

notification-item.component

notification-detail.component

notification-badge.component

notification-filter.component
```

---

# Folder Structure

```
features/

notifications/

pages/

list/

detail/

components/

notification-item/

notification-badge/

notification-filter/

services/

notification.facade.ts
```

---

# API Integration

Methods

```
getNotifications()

getNotification()

markAsRead()

markAllAsRead()

deleteNotification()
```

---

# Shared Components Used

- Badge
- Card
- Search Bar
- Filter Panel
- Snackbar
- Loading Skeleton

---

# Loading State

Display

- Skeleton Notification List

---

# Error Handling

API Error

```
Unable to load notifications.
```

Delete Failed

```
Unable to delete notification.
```

---

# Role-Based Notifications

Administrator

- All system notifications

Secretary

- Request and resident notifications

Treasurer

- Payment-related notifications

---

# Integration

Dashboard

```
Notification Preview
```

Document Requests

```
Approval Notifications
```

Payments

```
Payment Notifications
```

RFID

```
Assignment Notifications
```

System Settings

```
System Announcements
```

---

# Implementation Checklist

- [ ] Build Notification List
- [ ] Build Notification Detail
- [ ] Build Notification Badge
- [ ] Implement Mark as Read
- [ ] Implement Mark All as Read
- [ ] Implement Delete Notification
- [ ] Implement Search
- [ ] Implement Filters
- [ ] Connect Notification APIs

---

# Verification

Unread notifications display correctly.

Reading a notification updates the badge.

Role-specific notifications are displayed.

Notification links open the related record.

---

# Acceptance Criteria

- Notifications load successfully.
- Badge count updates correctly.
- Read/unread status works.
- Search and filters work.
- Role restrictions are respected.
- UI follows the shared design system.

---

# Definition of Done

- Notification Center completed.
- Backend integration verified.
- Ready for Audit Log Viewer.

---

# Estimated Effort

6–8 hours

---

# Next Task

**TASK-FRONTEND-014 — Audit Log Viewer**

---

# Notes for OpenCode

Before implementing:

1. Design notifications as lightweight references to events rather than storing duplicated business data.
2. Allow notifications to deep-link directly to the related module (for example, a document request or payment record).
3. Keep unread count synchronized across the application using a shared notification state service.
4. Differentiate notification severity with consistent icons and colors from the Design System.
5. Consider adding support for future real-time updates (such as WebSockets or Server-Sent Events) without changing the UI architecture.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |