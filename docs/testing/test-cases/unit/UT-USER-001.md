# Unit Test Cases — User Management

> **Module:** User Management
> **Type:** Unit Testing

---

| Test ID | Function | Preconditions | Input | Expected Output | Status |
|---------|----------|---------------|-------|-----------------|--------|
| UT-USER-001 | Create user with valid data | Role exists | Valid user object | User created, status 201 | |
| UT-USER-002 | Create user with duplicate username | Username `admin` exists | `username: admin` | Conflict error, status 409 | |
| UT-USER-003 | Create user with missing required fields | None | `{}` | Validation error, status 400 | |
| UT-USER-004 | Get all users | Users exist | `GET /users` | Array of users, status 200 | |
| UT-USER-005 | Get user by ID | User ID 1 exists | `GET /users/1` | User object, status 200 | |
| UT-USER-006 | Get user by nonexistent ID | No user ID 999 | `GET /users/999` | Not found, status 404 | |
| UT-USER-007 | Update user | User ID 2 exists | Valid update data | User updated, status 200 | |
| UT-USER-008 | Delete user | User ID 3 exists, not last admin | `DELETE /users/3` | User deleted, status 200 | |
| UT-USER-009 | Change password | User ID 1 exists | Old + new password | Password changed, status 200 | |
| UT-USER-010 | Assign role | User and role exist | Role assignment | Role updated, status 200 | |

---

*Module: User Management | Total: 10 test cases*
