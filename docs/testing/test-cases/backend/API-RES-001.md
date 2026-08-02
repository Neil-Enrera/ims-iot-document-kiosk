# Backend API Test Cases — Resident Management

> **Module:** Resident Management API
> **Type:** API Testing

---

| Test ID | Endpoint | Method | Auth Required | Request Body | Expected Response | Status |
|---------|----------|--------|---------------|--------------|-------------------|--------|
| API-RES-001 | `/api/v1/residents` | GET | Yes | - | 200, array of residents | |
| API-RES-002 | `/api/v1/residents?search=Juan` | GET | Yes | - | 200, filtered results | |
| API-RES-003 | `/api/v1/residents` | POST | Yes | `{ first_name, last_name, ... }` | 201, resident created | |
| API-RES-004 | `/api/v1/residents/1` | GET | Yes | - | 200, resident object | |
| API-RES-005 | `/api/v1/residents/1` | PUT | Yes | `{ first_name: "Juan Updated" }` | 200, updated | |
| API-RES-006 | `/api/v1/residents/1/archive` | PUT | Yes | - | 200, archived | |
| API-RES-007 | `/api/v1/residents/1/restore` | PUT | Yes | - | 200, restored | |
| API-RES-008 | `/api/v1/residents/999` | GET | Yes | - | 404, not found | |
| API-RES-009 | `/api/v1/residents` | POST | Yes | `{}` | 400, validation error | |

---

*Module: Resident Management API | Total: 9 test cases*
