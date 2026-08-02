# TASK-FRONTEND-005 — Dashboard Module

> **Phase:** Frontend
> **Task ID:** TASK-FRONTEND-005
> **Priority:** P0 (Critical)
> **Status:** Done

---

# Objective

Develop the Dashboard Module that serves as the central landing page for authenticated users, providing real-time statistics, recent activities, notifications, and quick access to frequently used functions.

The dashboard should adapt to the authenticated user's role.

---

# Background

The backend already exposes Dashboard APIs:

```
GET /api/v1/dashboard/summary
GET /api/v1/dashboard/requests
GET /api/v1/dashboard/residents
GET /api/v1/dashboard/payments
GET /api/v1/dashboard/services
GET /api/v1/dashboard/activities
```

The frontend should consume these APIs and present the data through reusable dashboard widgets.

---

# Scope

Included

- Dashboard Summary
- Statistics Cards
- Charts
- Recent Activities
- Quick Actions
- Notification Preview
- Responsive Layout

Not Included

- Advanced Analytics
- Report Generation
- Kiosk Dashboard

---

# User Roles

Administrator

Displays:

- Total Users
- Total Residents
- Active RFID Cards
- Pending Requests
- Today's Requests
- Monthly Requests
- Revenue Summary
- Recent Activities

---

Secretary

Displays:

- Pending Requests
- Residents Registered Today
- Requests Ready for Review
- Upcoming Releases
- Recent Activities

---

Treasurer

Displays:

- Today's Payments
- Pending Payments
- Monthly Revenue
- Payment History
- Payment Statistics

---

# Dashboard Layout

```
+------------------------------------------------------+
| Header                                               |
+------------------------------------------------------+

+---------+---------+---------+---------+
| Card 1  | Card 2  | Card 3  | Card 4  |
+---------+---------+---------+---------+

+-------------------------+---------------------------+
| Request Statistics      | Payment Statistics        |
| (Chart)                 | (Chart)                  |
+-------------------------+---------------------------+

+-------------------------+---------------------------+
| Recent Activities       | Notification Preview      |
+-------------------------+---------------------------+

+------------------------------------------------------+
| Quick Actions                                        |
+------------------------------------------------------+
```

---

# Statistics Cards

Administrator

- Total Residents
- Active Services
- Pending Requests
- Documents Released

Secretary

- Pending Requests
- Approved Requests
- Ready for Release
- Today's Requests

Treasurer

- Total Payments
- Revenue Today
- Revenue This Month
- Pending Payments

---

# Charts

Request Status Chart

Displays

```
Pending

Approved

Processing

Ready

Released
```

---

Service Usage Chart

Displays

```
Most Requested Services
```

---

Payment Chart

Displays

```
Revenue by Month
```

---

# Recent Activities

Show latest actions

Examples

```
Resident Registered

Request Approved

Payment Verified

RFID Assigned

Document Released
```

Each activity should display:

- Icon
- Description
- User
- Timestamp

---

# Notification Preview

Display

- Latest five notifications
- Unread badge
- Link to Notification Center

---

# Quick Actions

Administrator

```
Register Resident

Create User

Assign RFID

Generate Report
```

Secretary

```
Create Request

Approve Request

Register Resident
```

Treasurer

```
Record Payment

Verify Payment

View Reports
```

---

# Components

```
dashboard/

dashboard.component

summary-card.component

chart-card.component

recent-activity.component

quick-actions.component

notification-preview.component
```

---

# Folder Structure

```
features/

dashboard/

components/

summary-card/

chart-card/

recent-activity/

quick-actions/

notification-preview/

pages/

dashboard/

services/

dashboard.facade.ts
```

---

# Dashboard Service

Methods

```
getSummary()

getRequestStatistics()

getResidentStatistics()

getPaymentStatistics()

getServiceStatistics()

getRecentActivities()
```

---

# State Management

Use Angular Signals for:

- Dashboard summary
- Loading state
- Notification count
- Recent activities

---

# Loading State

While loading

Display

- Skeleton Cards
- Skeleton Charts
- Skeleton Activity List

Avoid blank screens.

---

# Error Handling

Display

```
Unable to load dashboard data.

Retry
```

if the API fails.

---

# Refresh Strategy

Refresh dashboard

- On login
- Manual refresh button
- Every 5 minutes (optional)

---

# UI Components Used

From Shared Module

- Card
- Chart Card
- Loading Spinner
- Skeleton Loader
- Status Badge
- Button

---

# Responsive Design

Desktop

```
4 cards per row
```

Tablet

```
2 cards per row
```

Mobile

```
1 card per row
```

---

# Implementation Checklist

- [ ] Create dashboard layout
- [ ] Build summary cards
- [ ] Integrate charts
- [ ] Build recent activities panel
- [ ] Build notification preview
- [ ] Build quick actions
- [ ] Connect Dashboard APIs
- [ ] Handle loading and error states
- [ ] Implement role-aware dashboard
- [ ] Test responsiveness

---

# Verification

After login

Administrator

Displays:

- System overview
- User statistics
- Request statistics

Secretary

Displays:

- Operational tasks
- Pending requests

Treasurer

Displays:

- Payment information
- Revenue statistics

Dashboard should load without console errors.

---

# Acceptance Criteria

- Dashboard loads successfully.
- Statistics match backend data.
- Charts render correctly.
- Recent activities update.
- Quick actions navigate correctly.
- Layout is responsive.
- Dashboard adapts to user roles.

---

# Definition of Done

- Dashboard module completed.
- API integration verified.
- Responsive design validated.
- Ready for User Management module.

---

# Estimated Effort

8–10 hours

---

# Next Task

**TASK-FRONTEND-006 — User Management Module**

---

# Notes for OpenCode

Before implementing:

1. Fetch dashboard data using the Dashboard Service created in the API layer.
2. Build reusable widgets (summary cards, charts, activity lists) so they can be reused in future analytics pages.
3. Use lazy loading for chart libraries to reduce the initial bundle size.
4. Display only the widgets relevant to the authenticated user's role.
5. Use loading skeletons instead of spinners for dashboard widgets to improve perceived performance.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |