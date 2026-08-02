# Backend API Test Cases — User Management

> **Module:** User Management API
> **Type:** API Testing

---

| Test ID | Endpoint | Method | Auth Required | Request Body | Expected Response | Status |
|---------|----------|--------|---------------|--------------|-------------------|--------|
| API-USER-001 | `/api/v1/users` | GET | Yes (Admin) | - | 200, array of users | |
| API-USER-002 | `/api/v1/users` | GET | No | - | 401, unauthorized | |
| API-USER-003 | `/api/v1/users` | POST | Yes (Admin) | `{ username, password, role_id }` | 201, user created | |
| API-USER-004 | `/api/v1/users/1` | PUT | Yes (Admin) | `{ first_name }` | 200, user updated | |
| API-USER-005 | `/api/v1/users/1` | DELETE | Yes (Admin) | - | 200, user deleted | |
| API-USER-006 | `/api/v1/users/1` | GET | Yes (Admin) | - | 200, user object | |
| API-USER-007 | `/api/v1/users/999` | GET | Yes (Admin) | - | 404, not found | |
| API-USER-008 | `/api/v1/users` | POST | Yes (Admin) | `{ username: "admin" }` | 409, duplicate username | |

---

*Module: User Management API | Total: 8 test cases*
