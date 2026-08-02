# Backend API Test Cases — Request Management

> **Module:** Request Management API
> **Type:** API Testing

---

| Test ID | Endpoint | Method | Auth Required | Request Body | Expected Response | Status |
|---------|----------|--------|---------------|--------------|-------------------|--------|
| API-REQ-001 | `/api/v1/requests` | GET | Yes | - | 200, array of requests | |
| API-REQ-002 | `/api/v1/requests/1` | GET | Yes | - | 200, request with relations | |
| API-REQ-003 | `/api/v1/requests` | POST | Yes | `{ resident_id, service_id }` | 201, request created | |
| API-REQ-004 | `/api/v1/requests/1/status` | PUT | Yes | `{ status_id: 3 }` | 200, status updated | |
| API-REQ-005 | `/api/v1/requests?status=pending` | GET | Yes | - | 200, filtered results | |
| API-REQ-006 | `/api/v1/requests?from=2026-01-01&to=2026-12-31` | GET | Yes | - | 200, filtered results | |
| API-REQ-007 | `/api/v1/requests/999` | GET | Yes | - | 404, not found | |
| API-REQ-008 | `/api/v1/requests` | POST | Yes | `{}` | 400, validation error | |

---

*Module: Request Management API | Total: 8 test cases*
