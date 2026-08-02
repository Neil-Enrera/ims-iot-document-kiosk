# Unit Test Cases — Dashboard & Reports

> **Module:** Dashboard & Reports
> **Type:** Unit Testing

---

| Test ID | Function | Preconditions | Input | Expected Output | Status |
|---------|----------|---------------|-------|-----------------|--------|
| UT-DASH-001 | Get dashboard statistics | Data exists | `GET /dashboard/statistics` | Stats object with counts, status 200 | |
| UT-DASH-002 | Get request statistics | Requests exist | `GET /dashboard/statistics` | `total_requests`, `pending`, `approved`, etc. | |
| UT-DASH-003 | Get resident statistics | Residents exist | `GET /dashboard/statistics` | `total_residents` count | |
| UT-DASH-004 | Get request report | Requests exist | `GET /reports/requests` | Report data, status 200 | |
| UT-DASH-005 | Get request report with date filter | Requests exist | `GET /reports/requests?from=...&to=...` | Filtered report | |
| UT-DASH-006 | Get recent requests | Requests exist | `GET /dashboard/statistics` | Recent requests array | |
| UT-DASH-007 | Get status breakdown | Requests exist | `GET /dashboard/statistics` | Breakdown by status | |

---

*Module: Dashboard & Reports | Total: 7 test cases*
