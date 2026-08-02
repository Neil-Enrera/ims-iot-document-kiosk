# TASK-FRONTEND-003 — API Service Layer

> **Phase:** Frontend
> **Task ID:** TASK-FRONTEND-003
> **Priority:** P0 (Critical)
> **Status:** Done

---

# Objective

Develop a centralized API Service Layer that manages all communication between the Angular frontend and the Express REST API.

The API layer should provide:

- HTTP communication
- JWT authentication
- Automatic token attachment
- Global error handling
- Loading indicators
- Standardized API responses
- Feature-specific services

This layer ensures that components never communicate directly with HttpClient.

---

# Background

The backend already exposes REST APIs for:

- Authentication
- Users
- Residents
- RFID
- Services
- Requests
- Payments
- Dashboard
- Notifications
- Audit Logs
- Files
- Settings

The frontend should access these APIs through reusable services.

---

# Architecture

```text
Angular Component

        │

        ▼

Feature Service

        │

        ▼

API Base Service

        │

        ▼

HTTP Interceptor

        │

        ▼

Express REST API
```

---

# Folder Structure

```text
src/

app/

core/

api/

    api.service.ts
    auth.service.ts
    user.service.ts
    resident.service.ts
    rfid.service.ts
    service.service.ts
    request.service.ts
    payment.service.ts
    dashboard.service.ts
    notification.service.ts
    audit.service.ts
    file.service.ts
    setting.service.ts

interceptors/

    auth.interceptor.ts
    error.interceptor.ts
    loading.interceptor.ts

guards/

    auth.guard.ts
    role.guard.ts

models/

interfaces/
```

---

# Base API Service

Create a reusable base service responsible for:

- GET
- POST
- PUT
- PATCH
- DELETE

Responsibilities

- Base URL
- Headers
- Error handling
- Generic typing

---

# Environment Configuration

Development

```text
environment.ts

apiUrl

http://localhost:3000/api/v1
```

Production

```text
environment.prod.ts
```

---

# Feature Services

Create one service per backend module.

Authentication

```text
login()

logout()

currentUser()
```

Users

```text
getUsers()

createUser()

updateUser()

deleteUser()
```

Residents

```text
getResidents()

createResident()

updateResident()

archiveResident()
```

RFID

```text
assignCard()

verifyCard()

replaceCard()
```

Services

```text
getServices()

createService()

updateService()
```

Requests

```text
createRequest()

approve()

reject()

release()
```

Payments

```text
recordPayment()

verifyPayment()
```

Dashboard

```text
getSummary()

getStatistics()
```

Notifications

```text
getNotifications()

markAsRead()
```

Audit

```text
getLogs()
```

Files

```text
upload()

download()
```

Settings

```text
getSettings()

updateSetting()
```

---

# HTTP Interceptors

## Authentication Interceptor

Responsibilities

- Attach JWT
- Skip login endpoint
- Refresh headers

---

## Error Interceptor

Handle

401

```text
Unauthorized
```

403

```text
Forbidden
```

404

```text
Not Found
```

500

```text
Server Error
```

Display user-friendly messages.

---

## Loading Interceptor

Automatically

Start spinner

↓

Request

↓

Stop spinner

---

# Route Guards

Authentication Guard

```text
Authenticated Users Only
```

Role Guard

Example

```text
Administrator

Secretary

Treasurer
```

---

# Response Models

Backend success

```json
{
    "success": true,
    "message": "...",
    "data": {}
}
```

Frontend interface

```typescript
interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}
```

---

# Error Model

```typescript
interface ApiError {
    success: false;
    message: string;
    errors: string[];
}
```

---

# Token Storage

Recommended

```text
sessionStorage
```

Store

```text
JWT

User Information
```

---

# Authentication Flow

```text
Login

↓

Receive JWT

↓

Store Token

↓

Interceptor

↓

Protected APIs
```

---

# File Upload Support

Use

```text
multipart/form-data
```

The File Service should support:

- Resident photos
- Supporting documents
- Generated documents

---

# Implementation Checklist

- [ ] Configure environments
- [ ] Create Base API Service
- [ ] Create feature services
- [ ] Create Auth Interceptor
- [ ] Create Error Interceptor
- [ ] Create Loading Interceptor
- [ ] Create Auth Guard
- [ ] Create Role Guard
- [ ] Create API interfaces
- [ ] Test all services

---

# Verification

Authentication

```text
JWT automatically attached.
```

Unauthorized

```text
Redirect to Login.
```

Loading

```text
Spinner shown during API requests.
```

Feature Services

```text
All backend endpoints reachable.
```

---

# Acceptance Criteria

- Components never call HttpClient directly.
- JWT attached automatically.
- Errors handled globally.
- Loading handled globally.
- Feature services functional.
- API responses typed.

---

# Definition of Done

- API layer completed.
- Interceptors working.
- Guards working.
- Feature services ready.
- Ready for Login Module.

---

# Estimated Effort

6–8 hours

---

# Next Task

**TASK-FRONTEND-004 — Authentication Module**

---

# Notes for OpenCode

Before implementing:

1. Create a reusable `ApiService` that encapsulates common HTTP operations.
2. Implement Angular `HttpInterceptor`s for authentication, error handling, and loading states.
3. Use strongly typed interfaces for every API request and response.
4. Keep all API endpoints configurable through environment files.
5. Ensure feature services remain focused on business entities and delegate generic HTTP behavior to the base API service.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |