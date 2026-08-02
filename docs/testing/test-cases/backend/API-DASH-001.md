# Backend API Test Cases — Dashboard & Reports

> **Module:** Dashboard & Reports API
> **Type:** API Testing

---

| Test ID | Endpoint | Method | Auth Required | Request Body | Expected Response | Status |
|---------|----------|--------|---------------|--------------|-------------------|--------|
| API-DASH-001 | `/api/v1/dashboard/statistics` | GET | Yes | - | 200, statistics object | |
| API-DASH-002 | `/api/v1/dashboard/statistics` | GET | No | - | 401, unauthorized | |
| API-DASH-003 | `/api/v1/reports/requests` | GET | Yes | - | 200, report data | |
| API-DASH-004 | `/api/v1/reports/requests?from=2026-01-01` | GET | Yes | - | 200, filtered report | |
| API-DASH-005 | `/api/v1/dashboard/statistics` | GET | Yes | - | Contains `total_residents`, `total_requests`, `pending`, `approved` | |

---

*Module: Dashboard & Reports API | Total: 5 test cases*
