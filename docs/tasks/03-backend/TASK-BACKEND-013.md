# TASK-BACKEND-013 — Dashboard & Reports API

> **Phase:** Backend
> **Task ID:** TASK-BACKEND-013
> **Priority:** P1 (High)
> **Status:** Done

---

# Objective

Develop the Dashboard & Reports API to provide real-time statistics, analytics, and reports for the Information Management System.

This module will aggregate data from existing modules and present meaningful information for decision-making and monitoring.

---

# Background

Barangay personnel need a quick overview of system activities without manually checking each module.

The dashboard should display:

- Total residents
- Total requests
- Pending requests
- Released documents
- Payment statistics
- Service statistics
- Recent activities

Reports should support filtering and exporting in future phases.

---

# Scope

## Included

- Dashboard summary
- Request statistics
- Resident statistics
- Service statistics
- Payment statistics
- Recent activity
- Filtered reports

## Not Included

- PDF export
- Excel export
- Graph rendering (handled by frontend)

---

# Dependencies

- TASK-BACKEND-008 Resident Management API
- TASK-BACKEND-010 Service Management API
- TASK-BACKEND-011 Document Request Management API
- TASK-BACKEND-012 Payment Management API

---

# Database Tables

Read data from:

```text
residents
requests
services
payments
users
```

No new tables are required.

---

# API Endpoints

## Dashboard Summary

```http
GET /api/v1/dashboard/summary
```

Example Response

```json
{
    "success": true,
    "data": {
        "totalResidents": 1250,
        "totalRequests": 356,
        "pendingRequests": 18,
        "releasedRequests": 300,
        "activeServices": 7,
        "todayRequests": 12
    }
}
```

---

## Request Statistics

```http
GET /api/v1/dashboard/requests
```

Provides:

- Requests by status
- Requests by service
- Daily requests
- Monthly requests

---

## Resident Statistics

```http
GET /api/v1/dashboard/residents
```

Provides:

- Total residents
- Newly registered residents
- Archived residents

---

## Payment Statistics

```http
GET /api/v1/dashboard/payments
```

Provides:

- Total payments
- Total revenue
- Payments by method
- Payments by date

---

## Service Statistics

```http
GET /api/v1/dashboard/services
```

Provides:

- Most requested service
- Least requested service
- Active services
- Inactive services

---

## Recent Activities

```http
GET /api/v1/dashboard/activities
```

Displays recent system events such as:

- New resident registered
- Request approved
- Request released
- Payment verified

---

# Report Endpoints

## Requests Report

```http
GET /api/v1/reports/requests
```

Supports filters:

- Date range
- Service
- Status
- Resident

---

## Payments Report

```http
GET /api/v1/reports/payments
```

Supports filters:

- Date range
- Payment method
- Payment status

---

## Residents Report

```http
GET /api/v1/reports/residents
```

Supports filters:

- Registration date
- Status

---

# Authorization

| Endpoint | Allowed Roles |
|-----------|---------------|
| Dashboard | Administrator, Secretary |
| Reports | Administrator, Secretary |
| Payment Reports | Administrator, Treasurer |

---

# Folder Structure

```text
backend/src/

controllers/
    dashboard.controller.js
    report.controller.js

services/
    dashboard.service.js
    report.service.js

repositories/
    dashboard.repository.js
    report.repository.js

routes/
    dashboard.routes.js
    report.routes.js
```

---

# Files to Create

```text
controllers/dashboard.controller.js
controllers/report.controller.js

services/dashboard.service.js
services/report.service.js

repositories/dashboard.repository.js
repositories/report.repository.js

routes/dashboard.routes.js
routes/report.routes.js
```

---

# Files to Modify

```text
routes/api.js
```

Register dashboard and report routes.

---

# Business Rules

- Dashboard data should always reflect the latest database records.
- Reports must support filtering without modifying data.
- Dashboard endpoints are read-only.
- Sensitive financial data should only be accessible to authorized roles.

---

# Implementation Checklist

- [ ] Create dashboard summary endpoint
- [ ] Implement request statistics
- [ ] Implement resident statistics
- [ ] Implement payment statistics
- [ ] Implement service statistics
- [ ] Create report endpoints
- [ ] Protect endpoints using JWT and RBAC
- [ ] Test all statistics

---

# Verification

### Dashboard Summary

```http
GET /api/v1/dashboard/summary
```

Returns current system totals.

---

### Requests Report

```http
GET /api/v1/reports/requests?status=Pending
```

Returns only pending requests.

---

### Revenue Report

```http
GET /api/v1/reports/payments?startDate=2026-01-01&endDate=2026-12-31
```

Returns payments within the selected period.

---

# Acceptance Criteria

- Dashboard displays accurate real-time statistics.
- Reports support filtering.
- Endpoints are read-only.
- Authorization is enforced.
- API responses follow the project standard.

---

# Definition of Done

- Dashboard API completed.
- Reports API completed.
- Statistics verified.
- Ready for notifications and auditing.

---

# Estimated Effort

5–7 hours

---

# Next Task

**TASK-BACKEND-014 — Notification API**

---

# Notes for OpenCode

Before implementing:

1. Build aggregate queries in the repository layer.
2. Keep dashboard endpoints read-only.
3. Optimize queries for performance.
4. Apply JWT and RBAC to all dashboard and report endpoints.
5. Design responses for easy consumption by Angular charts and dashboard widgets.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |