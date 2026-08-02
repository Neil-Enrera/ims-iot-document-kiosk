# TASK-FRONTEND-004 — Authentication Module

> **Phase:** Frontend
> **Task ID:** TASK-FRONTEND-004
> **Priority:** P0 (Critical)
> **Status:** Done

---

# Objective

Develop the Authentication Module for the Information Management System to securely authenticate authorized barangay personnel and manage user sessions using JWT.

This module provides:

- Login
- Logout
- Session Management
- Route Protection
- User Profile Retrieval

The kiosk authentication (RFID + Webcam) is **not included** in this task and will be implemented during the Hardware & Kiosk phase.

---

# Background

The backend already provides:

```
POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/logout
```

The Angular frontend should consume these endpoints and maintain the authenticated state of the application.

---

# Scope

Included

- Login Page
- Logout
- Remember Session
- Current User
- Route Protection
- Role-based Navigation
- Session Expiration Handling

Not Included

- Forgot Password
- Password Reset
- Multi-Factor Authentication
- Resident RFID Login (Kiosk)

---

# User Flow

```
User

↓

Login Page

↓

Enter Credentials

↓

Backend Authentication

↓

JWT Token

↓

Store Session

↓

Dashboard
```

---

# Pages

## Login

Route

```
/login
```

Fields

- Username
- Password

Buttons

- Login

Links

- None

---

# Dashboard Redirect

After successful login

```
Dashboard
```

according to the authenticated user's role.

---

# Logout Flow

```
Logout

↓

Clear Session

↓

Clear Token

↓

Redirect Login
```

---

# Folder Structure

```
features/

auth/

components/

login/

login.component.ts

login.component.html

login.component.scss

services/

auth.facade.ts

models/

login-request.ts

login-response.ts
```

---

# Interfaces

## Login Request

```typescript
interface LoginRequest {

    username: string;

    password: string;

}
```

---

## Login Response

```typescript
interface LoginResponse {

    token: string;

    user: User;

}
```

---

# Components

## Login Component

Responsibilities

- Build login form
- Validate input
- Submit credentials
- Display errors

---

# Form Validation

Username

- Required

Password

- Required

---

# Authentication Service

Methods

```
login()

logout()

currentUser()

isAuthenticated()

getToken()
```

---

# Session Management

Store

```
JWT

Current User
```

Recommended

```
sessionStorage
```

---

# Route Guard

Prevent unauthenticated access.

Example

```
Dashboard

Residents

Payments

Requests

Settings
```

---

# Role Navigation

Administrator

```
Dashboard

Users

Residents

Reports

Settings
```

Secretary

```
Residents

Requests

Services
```

Treasurer

```
Payments

Reports
```

---

# Error Handling

Invalid credentials

Display

```
Invalid username or password.
```

Server unavailable

Display

```
Unable to connect to the server.
```

Expired session

Automatically

```
Redirect Login
```

---

# UI Components

Use

- Shared Button
- Shared Input
- Loading Spinner
- Snackbar
- Card

---

# Layout

Centered login card.

Contains

- Barangay Logo
- System Name
- Username
- Password
- Login Button
- Version

---

# Authentication Lifecycle

```
Application Starts

↓

Check Token

↓

Valid?

↓

Yes

↓

Dashboard

No

↓

Login
```

---

# Security

Never

- Store password
- Log JWT
- Expose sensitive user information

Always

- Clear session on logout
- Remove invalid token
- Redirect after expiration

---

# Implementation Checklist

- [ ] Create Login Page
- [ ] Create Authentication Service
- [ ] Connect Login API
- [ ] Store JWT
- [ ] Retrieve Current User
- [ ] Configure Route Guard
- [ ] Configure Role Navigation
- [ ] Handle Session Expiration
- [ ] Implement Logout
- [ ] Display Authentication Errors

---

# Verification

Successful Login

```
Dashboard loads.
```

Unauthorized

```
Login page shown.
```

Expired Token

```
Redirect Login.
```

Logout

```
Session cleared.
```

---

# Acceptance Criteria

- Users can log in.
- JWT stored securely.
- Protected routes require authentication.
- Logout clears session.
- Authentication state persists during the session.
- Role-based navigation works correctly.

---

# Definition of Done

- Authentication module completed.
- Login functional.
- Logout functional.
- Route guards implemented.
- Ready for Dashboard Module.

---

# Estimated Effort

6–8 hours

---

# Next Task

**TASK-FRONTEND-005 — Dashboard Module**

---

# Notes for OpenCode

Before implementing:

1. Use Angular Reactive Forms for the login form.
2. Consume the backend `/auth/login`, `/auth/me`, and `/auth/logout` endpoints through the Auth Service.
3. Keep authentication state centralized in an `AuthStateService` using Angular Signals.
4. Redirect authenticated users away from `/login` and unauthenticated users away from protected routes.
5. Use the shared UI components from the Design System to maintain visual consistency.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |