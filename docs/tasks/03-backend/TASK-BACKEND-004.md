# TASK-BACKEND-004 — Global Error Handling & Logging

> **Phase:** Backend
> **Task ID:** TASK-BACKEND-004
> **Priority:** P0 (Critical)
> **Status:** Done

---

# Objective

Implement centralized error handling and logging to ensure that all backend errors are captured, logged, and returned to the client using a consistent response format.

---

# Background

As the backend grows, errors may occur from:

- Invalid API requests
- Database connection failures
- Validation errors
- Authentication failures
- Unexpected server exceptions

Instead of handling errors in every controller, create a centralized error-handling mechanism.

---

# Scope

## Included

- Global error middleware
- 404 Not Found middleware
- Async error handling
- Request logging
- Error logging
- Development vs Production error responses

## Not Included

- Authentication
- Authorization
- Business logic

---

# Dependencies

- TASK-BACKEND-001 — Backend Architecture
- TASK-BACKEND-002 — Database Integration
- TASK-BACKEND-003 — API Standards & Response Format

---

# Middleware Order

```text
Helmet
↓
CORS
↓
JSON Parser
↓
Request Logger
↓
API Routes
↓
404 Middleware
↓
Global Error Middleware
```

---

# 404 Response

When an unknown route is requested:

```json
{
    "success": false,
    "message": "API endpoint not found.",
    "errors": []
}
```

HTTP Status:

```http
404 Not Found
```

---

# Internal Server Error Response

```json
{
    "success": false,
    "message": "Internal server error.",
    "errors": []
}
```

HTTP Status:

```http
500 Internal Server Error
```

Do not expose stack traces in production.

---

# Logging Requirements

Log the following events:

## Server

- Server started
- Server stopped

## Database

- Connected
- Disconnected
- Connection errors

## API Requests

- Timestamp
- Method
- URL
- Status Code
- Response Time

## Errors

- Timestamp
- Error Message
- Stack Trace (development only)

---

# Log Storage

```text
backend/logs/

access.log
error.log
```

---

# Folder Structure

```text
backend/src/

middleware/
    error.middleware.js
    not-found.middleware.js

config/
    logger.js
```

---

# Files to Create

```text
backend/src/middleware/error.middleware.js

backend/src/middleware/not-found.middleware.js

backend/src/config/logger.js
```

---

# Files to Modify

```text
backend/src/app.js
```

Register middleware in the correct order.

---

# Implementation Checklist

- [ ] Create global error middleware
- [ ] Create 404 middleware
- [ ] Configure request logging
- [ ] Configure error logging
- [ ] Hide stack traces in production
- [ ] Verify middleware execution order

---

# Verification

## Test Unknown Route

```http
GET /api/v1/unknown
```

Expected Response

```json
{
    "success": false,
    "message": "API endpoint not found.",
    "errors": []
}
```

---

## Test Server Error

Trigger an exception from a temporary route.

Expected Response

```json
{
    "success": false,
    "message": "Internal server error.",
    "errors": []
}
```

---

# Acceptance Criteria

- All errors pass through the global error handler.
- Unknown routes return a standardized 404 response.
- Logs are generated for requests and server errors.
- Stack traces are hidden in production.

---

# Definition of Done

- Global error middleware implemented.
- Logging configured.
- 404 middleware operational.
- Backend prepared for feature modules.

---

# Estimated Effort

1–2 hours

---

# Next Task

**TASK-BACKEND-005 — Authentication (JWT)**

---

# Notes for OpenCode

Before implementing:

1. Use the API response helper from TASK-BACKEND-003.
2. Keep controllers free from repetitive try/catch blocks where practical.
3. Ensure all unexpected errors are routed through the global error middleware.
4. Log server events and errors for easier debugging during development.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |