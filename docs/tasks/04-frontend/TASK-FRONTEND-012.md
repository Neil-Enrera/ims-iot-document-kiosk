# TASK-FRONTEND-012 — Reports & Analytics Module

> **Phase:** Frontend
> **Task ID:** TASK-FRONTEND-012
> **Priority:** P1 (High)
> **Status:** Done

---

# Objective

Develop the Reports & Analytics Module to provide statistical insights, operational reports, and printable summaries for barangay personnel.

The module consolidates data from:

- Residents
- Document Requests
- Payments
- RFID
- Services

into interactive dashboards and exportable reports.

---

# Background

The backend provides:

```
GET /api/v1/reports/dashboard
GET /api/v1/reports/residents
GET /api/v1/reports/requests
GET /api/v1/reports/payments
GET /api/v1/reports/services
GET /api/v1/reports/rfid
GET /api/v1/reports/export
```

The frontend should visualize and filter these reports.

---

# Scope

Included

- Dashboard Analytics
- Resident Reports
- Document Request Reports
- Payment Reports
- RFID Reports
- Service Reports
- Charts
- Filters
- Export

Not Included

- Predictive Analytics
- AI Insights
- External BI Integration

---

# Navigation

```
Sidebar

↓

Reports & Analytics
```

Route

```
/reports
```

---

# Dashboard Overview

Display

Summary Cards

```
Total Residents

Total Requests

Total Payments

Active RFID Cards

Available Services
```

Charts

```
Monthly Requests

Monthly Revenue

Top Requested Services

Request Status Distribution
```

---

# Report Categories

## Resident Report

Display

- Total Residents
- Active Residents
- Archived Residents
- Gender Distribution
- Age Distribution
- Registration Trends

---

## Document Request Report

Display

- Requests per Day
- Requests per Month
- Requests by Service
- Pending Requests
- Released Documents
- Rejected Requests

---

## Payment Report

Display

- Daily Collection
- Monthly Collection
- Revenue by Service
- Revenue by Cashier
- Unpaid Requests

---

## RFID Report

Display

- Active Cards
- Inactive Cards
- Lost Cards
- Replacement History

---

## Service Report

Display

- Most Requested Services
- Least Requested Services
- Services with Fees
- Free Services

---

# Filters

Global Filters

Date Range

```
Today

This Week

This Month

Custom Range
```

Additional Filters

- Service
- Resident Status
- Payment Status
- Request Status
- RFID Status

---

# Charts

Use

```
Chart.js
```

Recommended charts

Bar Chart

```
Monthly Requests
```

Line Chart

```
Monthly Revenue
```

Pie Chart

```
Request Status Distribution
```

Doughnut Chart

```
Service Usage
```

---

# Export Options

Supported Formats

```
PDF

Excel (XLSX)

CSV
```

Users should be able to export the currently filtered report.

---

# Components

```
summary-card.component

report-filter.component

chart-card.component

report-table.component

export-dialog.component
```

---

# Folder Structure

```
features/

reports/

pages/

dashboard/

resident-report/

request-report/

payment-report/

rfid-report/

service-report/

components/

summary-card/

chart-card/

report-filter/

report-table/

export-dialog/

services/

report.facade.ts
```

---

# API Integration

Methods

```
getDashboardReport()

getResidentReport()

getRequestReport()

getPaymentReport()

getRFIDReport()

getServiceReport()

exportReport()
```

---

# Responsive Design

Desktop

- Multiple charts
- Full-width tables

Tablet

- Two-column layout

Mobile

- Stacked cards and charts

---

# Shared Components Used

- Summary Card
- Chart Card
- Data Table
- Date Range Picker
- Filter Panel
- Loading Skeleton
- Snackbar

---

# Loading State

Display

- Skeleton Cards
- Skeleton Charts
- Skeleton Tables

---

# Error Handling

No Data

```
No report data available.
```

Export Failed

```
Unable to generate report.
```

API Error

```
Unable to load report.
```

---

# Role-Based Access

Administrator

- Full access
- Export reports

Secretary

- View operational reports

Treasurer

- View payment reports
- Export payment reports

---

# Implementation Checklist

- [ ] Build Dashboard Analytics
- [ ] Build Resident Report
- [ ] Build Request Report
- [ ] Build Payment Report
- [ ] Build RFID Report
- [ ] Build Service Report
- [ ] Implement Filters
- [ ] Implement Charts
- [ ] Implement Export
- [ ] Connect Report APIs

---

# Verification

Administrator

Can access all reports.

Treasurer

Can access payment reports only.

Charts display backend data correctly.

Filters update reports dynamically.

Exports generate successfully.

---

# Acceptance Criteria

- Reports load successfully.
- Charts render correctly.
- Filters work correctly.
- Export functions operate as expected.
- Role permissions are enforced.
- UI follows the shared design system.

---

# Definition of Done

- Reports & Analytics module completed.
- API integration verified.
- Export functionality implemented.
- Ready for Notification Center.

---

# Estimated Effort

10–12 hours

---

# Next Task

**TASK-FRONTEND-013 — Notification Center**

---

# Notes for OpenCode

Before implementing:

1. Create reusable chart components that can be shared between the dashboard and reports.
2. Keep filtering logic centralized so all report types behave consistently.
3. Load report data on demand to avoid unnecessary API calls.
4. Ensure exported reports reflect the active filters and sorting.
5. Design reports with printing in mind, using layouts that remain readable when exported to PDF.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |