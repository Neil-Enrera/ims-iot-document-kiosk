# TASK-BACKEND-006 — Role-Based Access Control (RBAC)

> **Phase:** Backend
> **Task ID:** TASK-BACKEND-006
> **Priority:** P0 (Critical)
> **Status:** Done

---

# Objective

Implement Role-Based Access Control (RBAC) to restrict access to backend resources based on the authenticated user's assigned role.

This ensures that users can only perform actions permitted by their responsibilities within the barangay.

---

# Background

Not every user should have access to every feature.

Examples:

- Administrator → Full access
- Barangay Captain → Approve requests and view reports
- Secretary → Manage residents and document requests
- Treasurer → Manage payments
- Staff → Limited operational tasks

RBAC ensures security and prevents unauthorized actions.

---

# Scope

## Included

- Role verification middleware
- Route authorization
- Permission validation
- Unauthorized access handling

## Not Included

- User management
- Resident management
- Document requests
- RFID authentication

---

# Dependencies

- TASK-BACKEND-005 — Authentication (JWT)

---

# Existing Database

Use the existing tables:

```text
user_roles
users
```

Each authenticated user must have one assigned role.

---

# Authorization Flow

```text
Client Request
      │
      ▼
JWT Authentication
      │
      ▼
Retrieve User Role
      │
      ▼
Role Middleware
      │
      ▼
Authorized?
      │
 ┌────┴────┐
 │         │
Yes        No
 │         │
 ▼         ▼
Controller 403 Forbidden
```

---

# Folder Structure

```text
backend/src/

middleware/
    role.middleware.js

utils/
    permissions.js
```

---

# Role Middleware

Create reusable middleware.

Example:

```javascript
authorize("Administrator")

authorize("Secretary")

authorize("Treasurer")
```

Multiple roles should also be supported.

Example:

```javascript
authorize("Administrator", "Secretary")
```

---

# Example Route Protection

Administrator only

```http
DELETE /api/v1/users/:id
```

Administrator + Secretary

```http
POST /api/v1/residents
```

Treasurer only

```http
POST /api/v1/payments
```

---

# Forbidden Response

HTTP

```http
403 Forbidden
```

Response

```json
{
    "success": false,
    "message": "You do not have permission to perform this action.",
    "errors": []
}
```

---

# Files to Create

```text
middleware/role.middleware.js

utils/permissions.js
```

---

# Files to Modify

```text
routes/*.js
```

Protect routes using RBAC middleware.

---

# Implementation Checklist

- [ ] Create role authorization middleware
- [ ] Retrieve role from authenticated user
- [ ] Support multiple allowed roles
- [ ] Return 403 for unauthorized access
- [ ] Protect administrative endpoints
- [ ] Test role restrictions

---

# Verification

Login as different users.

Verify:

Administrator

- Full access

Secretary

- Resident Management
- Document Requests

Treasurer

- Payments only

Staff

- Limited operational access

Unauthorized access must return:

```http
403 Forbidden
```

---

# Acceptance Criteria

- Protected routes require authentication.
- User roles are validated before controller execution.
- Unauthorized users receive HTTP 403.
- Multiple roles can access shared resources.

---

# Definition of Done

- RBAC middleware implemented.
- Protected routes enforce role restrictions.
- Authorization successfully tested.

---

# Estimated Effort

2–3 hours

---

# Next Task

**TASK-BACKEND-007 — User Management API**

---

# Notes for OpenCode

Before implementing:

1. Use the authenticated user from the JWT middleware.
2. Read the user's role from the existing `user_roles` relationship.
3. Keep authorization logic inside middleware.
4. Controllers should not perform role checks directly.
5. Design the middleware so additional roles can be added without changing controller code.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |