# TASK-BACKEND-005 — Authentication (JWT)

> **Phase:** Backend
> **Task ID:** TASK-BACKEND-005
> **Priority:** P0 (Critical)
> **Status:** Done

---

# Objective

Develop a secure authentication module using JSON Web Tokens (JWT) that allows authorized barangay personnel to securely access the Information Management System.

The authentication module will verify user credentials, issue JWT access tokens, and protect secured API endpoints.

---

# Background

The Information Management System is intended for barangay personnel such as:

- Administrator
- Barangay Captain
- Secretary
- Treasurer
- Staff

Only authorized users should be able to access the administrative system.

Residents using the kiosk **do not log in**. They authenticate through their RFID card, which will be handled in a later module.

---

# Scope

## Included

- User login
- Password verification
- JWT generation
- Protected routes
- Token validation
- User logout (client-side token removal)

## Not Included

- RFID authentication
- Password reset
- Two-factor authentication
- User registration

---

# Dependencies

- TASK-BACKEND-001 — Backend Architecture
- TASK-BACKEND-002 — Database Integration
- TASK-BACKEND-003 — API Standards
- TASK-BACKEND-004 — Global Error Handling

---

# Authentication Flow

```text
User
    │
    ▼
Login Page
    │
    ▼
POST /api/v1/auth/login
    │
    ▼
Validate Credentials
    │
    ▼
Generate JWT
    │
    ▼
Return Access Token
    │
    ▼
Protected API Access
```

---

# API Endpoints

## Login

```http
POST /api/v1/auth/login
```

Request

```json
{
    "username": "admin",
    "password": "password"
}
```

Success Response

```json
{
    "success": true,
    "message": "Login successful.",
    "data": {
        "accessToken": "...",
        "user": {}
    }
}
```

---

## Current User

```http
GET /api/v1/auth/me
```

Returns the authenticated user's profile.

---

## Logout

```http
POST /api/v1/auth/logout
```

For JWT, logout is typically handled on the client by deleting the stored token. This endpoint can be included for consistency or future token blacklisting.

---

# Security Requirements

- Store passwords as hashed values (e.g., bcrypt)
- Never store plain-text passwords
- Never return passwords in API responses
- Use JWT for authenticated requests
- Configure token expiration through environment variables
- Protect private routes with authentication middleware

---

# Environment Variables

Update `.env`

```env
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d
```

---

# Folder Structure

```text
backend/src/

controllers/
    auth.controller.js

services/
    auth.service.js

repositories/
    auth.repository.js

routes/
    auth.routes.js

middleware/
    auth.middleware.js
```

---

# Files to Create

```text
controllers/auth.controller.js
services/auth.service.js
repositories/auth.repository.js
routes/auth.routes.js
middleware/auth.middleware.js
```

---

# Files to Modify

```text
app.js
routes/api.js
```

Register the authentication routes.

---

# Implementation Checklist

- [ ] Install `jsonwebtoken`
- [ ] Install `bcrypt`
- [ ] Create login endpoint
- [ ] Verify hashed passwords
- [ ] Generate JWT
- [ ] Protect authenticated routes
- [ ] Create `GET /auth/me`
- [ ] Configure token expiration
- [ ] Test invalid credentials
- [ ] Test valid login

---

# Verification

### Valid Login

```http
POST /api/v1/auth/login
```

Returns:

- HTTP 200
- JWT access token
- Authenticated user information

### Invalid Login

Returns:

```json
{
    "success": false,
    "message": "Invalid username or password.",
    "errors": []
}
```

HTTP Status

```http
401 Unauthorized
```

---

# Acceptance Criteria

- Users can log in using valid credentials.
- Passwords are verified using hashed values.
- JWT tokens are issued upon successful authentication.
- Protected endpoints reject unauthorized requests.
- No sensitive information is exposed.

---

# Definition of Done

- Authentication API implemented.
- JWT middleware operational.
- Protected routes functioning.
- Login successfully tested.

---

# Estimated Effort

3–5 hours

---

# Next Task

**TASK-BACKEND-006 — Role-Based Access Control (RBAC)**

---

# Notes for OpenCode

Before implementing:

1. Use bcrypt for password hashing.
2. Use jsonwebtoken for access tokens.
3. Keep authentication logic inside the service layer.
4. Do not expose password hashes in any API response.
5. Protect future feature modules using the authentication middleware.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |