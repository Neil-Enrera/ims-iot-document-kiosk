# Backend API Test Cases — Authentication

> **Module:** Authentication API
> **Type:** API Testing

---

| Test ID | Endpoint | Method | Auth Required | Request Body | Expected Response | Status |
|---------|----------|--------|---------------|--------------|-------------------|--------|
| API-AUTH-001 | `/api/v1/auth/login` | POST | No | `{ "username": "admin", "password": "admin123" }` | 200, `{ token, user }` | |
| API-AUTH-002 | `/api/v1/auth/login` | POST | No | `{ "username": "admin", "password": "wrong" }` | 401, invalid credentials | |
| API-AUTH-003 | `/api/v1/auth/login` | POST | No | `{ "username": "", "password": "" }` | 400, validation error | |
| API-AUTH-004 | `/api/v1/auth/login` | POST | No | `{}` | 400, validation error | |
| API-AUTH-005 | `/api/v1/auth/login` | POST | No | Invalid JSON body | 400, parse error | |

---

*Module: Authentication API | Total: 5 test cases*
