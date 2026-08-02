# TASK-BACKEND-007 — User Management API

> **Phase:** Backend
> **Task ID:** TASK-BACKEND-007
> **Priority:** P1 (High)
> **Status:** Done

---

# Objective

Develop the User Management API to allow administrators to manage system users, assign roles, and maintain user account information.

This module manages **barangay personnel** (e.g., Administrator, Secretary, Treasurer, Staff), not residents.

---

# Background

The Information Management System requires authenticated personnel to perform administrative tasks.

Each user account must:

- Have an assigned role
- Be active or inactive
- Have secure login credentials
- Be auditable

This module will perform CRUD operations for system users.

---

# Scope

## Included

- Create user
- View users
- View user details
- Update user
- Activate/deactivate user
- Delete user (soft delete recommended)
- Change password
- Reset password (administrator only)

## Not Included

- Resident management
- Authentication
- RFID management

---

# Dependencies

- TASK-BACKEND-005 — Authentication (JWT)
- TASK-BACKEND-006 — Role-Based Access Control (RBAC)

---

# Database Tables

Use the existing tables:

```text
users
user_roles
```

---

# API Endpoints

## Create User

```http
POST /api/v1/users
```

---

## Get All Users

```http
GET /api/v1/users
```

Supports:

- Search
- Pagination
- Sorting

---

## Get User Details

```http
GET /api/v1/users/:id
```

---

## Update User

```http
PUT /api/v1/users/:id
```

---

## Change User Status

```http
PATCH /api/v1/users/:id/status
```

Example

```json
{
    "status": "inactive"
}
```

---

## Change Password

```http
PATCH /api/v1/users/:id/password
```

---

## Delete User

```http
DELETE /api/v1/users/:id
```

Prefer soft deletion if supported by the schema.

---

# Validation Rules

- Username must be unique.
- Email must be unique (if applicable).
- Password must be hashed before storage.
- Role must exist in `user_roles`.
- Required fields cannot be empty.

---

# Folder Structure

```text
backend/src/

controllers/
    user.controller.js

services/
    user.service.js

repositories/
    user.repository.js

routes/
    user.routes.js

validations/
    user.validation.js
```

---

# Authorization

| Action | Allowed Roles |
|---------|---------------|
| View Users | Administrator |
| Create User | Administrator |
| Update User | Administrator |
| Delete User | Administrator |
| Reset Password | Administrator |

Future expansion can grant additional permissions if needed.

---

# Files to Create

```text
controllers/user.controller.js

services/user.service.js

repositories/user.repository.js

routes/user.routes.js

validations/user.validation.js
```

---

# Files to Modify

```text
routes/api.js
```

Register the User Management routes.

---

# Implementation Checklist

- [ ] Create User CRUD endpoints
- [ ] Validate user input
- [ ] Hash passwords using bcrypt
- [ ] Enforce username uniqueness
- [ ] Implement pagination and search
- [ ] Protect routes with JWT
- [ ] Restrict actions using RBAC
- [ ] Test all endpoints

---

# Verification

### Create User

```http
POST /api/v1/users
```

Expected:

```http
201 Created
```

---

### Get Users

```http
GET /api/v1/users
```

Returns:

```json
{
    "success": true,
    "message": "Users retrieved successfully.",
    "data": []
}
```

---

### Unauthorized Access

Non-administrator attempts to create or delete users must receive:

```http
403 Forbidden
```

---

# Acceptance Criteria

- Administrators can manage user accounts.
- Passwords are securely hashed.
- User roles are validated.
- Routes are protected by JWT and RBAC.
- API responses follow the project standard.

---

# Definition of Done

- User CRUD API completed.
- Validation implemented.
- Authorization enforced.
- Endpoint testing completed.

---

# Estimated Effort

4–6 hours

---

# Next Task

**TASK-BACKEND-008 — Resident Management API**

---

# Notes for OpenCode

Before implementing:

1. Use the existing `users` and `user_roles` tables.
2. Do not expose password hashes in responses.
3. Apply authentication and RBAC middleware to all routes.
4. Use the standardized API response helpers.
5. Prefer soft deletion to preserve audit history.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |