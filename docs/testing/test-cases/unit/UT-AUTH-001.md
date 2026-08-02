# Unit Test Cases — Authentication

> **Module:** Authentication
> **Type:** Unit Testing

---

| Test ID | Function | Preconditions | Input | Expected Output | Status |
|---------|----------|---------------|-------|-----------------|--------|
| UT-AUTH-001 | Login with valid credentials | User `admin` exists | `username: admin, password: admin123` | JWT token returned, status 200 | |
| UT-AUTH-002 | Login with invalid password | User `admin` exists | `username: admin, password: wrong` | Error message, status 401 | |
| UT-AUTH-003 | Login with nonexistent user | No user `unknown` | `username: unknown, password: pass` | Error message, status 401 | |
| UT-AUTH-004 | Login with empty fields | None | `username: "", password: ""` | Validation error, status 400 | |
| UT-AUTH-005 | JWT token contains valid payload | Successful login | Decode JWT token | Contains `user_id`, `role`, `exp` | |
| UT-AUTH-006 | Password hashing with bcrypt | User creation | Compare hashed vs plain | Hash matches, not equal to plain | |
| UT-AUTH-007 | Logout invalidates session | User is logged in | Call logout endpoint | Session cleared, status 200 | |
| UT-AUTH-008 | Token expiration check | Expired JWT token | Send request with expired token | Status 401, token expired error | |

---

*Module: Authentication | Total: 8 test cases*
