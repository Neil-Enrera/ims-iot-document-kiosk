# Backend API Test Cases — Service Management

> **Module:** Service Management API
> **Type:** API Testing

---

| Test ID | Endpoint | Method | Auth Required | Request Body | Expected Response | Status |
|---------|----------|--------|---------------|--------------|-------------------|--------|
| API-SVC-001 | `/api/v1/services` | GET | Yes | - | 200, array of services | |
| API-SVC-002 | `/api/v1/services` | POST | Yes | `{ service_name, description }` | 201, service created | |
| API-SVC-003 | `/api/v1/services/1` | PUT | Yes | `{ service_name: "Updated" }` | 200, updated | |
| API-SVC-004 | `/api/v1/services/1` | DELETE | Yes | - | 200, deleted | |
| API-SVC-005 | `/api/v1/services/1/status` | PUT | Yes | - | 200, status toggled | |

---

*Module: Service Management API | Total: 5 test cases*
