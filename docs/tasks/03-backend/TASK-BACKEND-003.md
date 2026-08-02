# TASK-BACKEND-003 — API Standards & Response Format

> **Phase:** Backend
> **Task ID:** TASK-BACKEND-003
> **Priority:** P0 (Critical)
> **Status:** Done

---

# Objective

Define and implement a standardized REST API response format that will be used consistently across all backend endpoints.

This ensures predictable API responses for the Angular web application, kiosk interface, and any future integrations.

---

# Background

Without a standard response format, different endpoints may return inconsistent structures, making frontend development and error handling more difficult.

This task establishes a single API contract that every controller must follow.

---

# Scope

## Included

- Success response format
- Error response format
- Pagination response format
- Validation error format
- HTTP status code guidelines
- API utility helpers

## Not Included

- Authentication
- CRUD operations
- Business logic

---

# Dependencies

- TASK-BACKEND-001 — Backend Architecture
- TASK-BACKEND-002 — Database Integration

---

# API Base URL

```text
/api/v1
```

---

# Success Response Format

Every successful API request must return:

```json
{
    "success": true,
    "message": "Resident retrieved successfully.",
    "data": {}
}
```

---

# Success List Response

```json
{
    "success": true,
    "message": "Residents retrieved successfully.",
    "data": []
}
```

---

# Error Response

```json
{
    "success": false,
    "message": "Resident not found.",
    "errors": []
}
```

---

# Validation Error Response

```json
{
    "success": false,
    "message": "Validation failed.",
    "errors": [
        {
            "field": "email",
            "message": "Email is required."
        }
    ]
}
```

---

# Pagination Response

```json
{
    "success": true,
    "message": "Residents retrieved successfully.",
    "data": [],
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 125,
        "totalPages": 13
    }
}
```

---

# HTTP Status Codes

Use the following standard status codes:

| Status | Usage |
|---------|-------|
| 200 | Successful request |
| 201 | Resource created |
| 204 | No content |
| 400 | Bad request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Resource not found |
| 409 | Conflict |
| 422 | Validation error |
| 500 | Internal server error |

---

# Utility Functions

Create reusable response helpers.

Example responsibilities:

- Success response
- Created response
- Error response
- Validation response
- Pagination response

---

# Folder Structure

```text
backend/src/

utils/
    apiResponse.js
```

---

# Example Usage

Instead of manually writing responses inside every controller:

```javascript
return successResponse(res, "Resident created successfully.", resident);
```

Or:

```javascript
return errorResponse(res, 404, "Resident not found.");
```

Controllers should remain clean and focused on business logic.

---

# Files to Create

```text
backend/src/utils/apiResponse.js
```

---

# Files to Modify

Controllers will use these helper functions as new modules are developed.

---

# Implementation Checklist

- [ ] Define success response format
- [ ] Define error response format
- [ ] Define validation response format
- [ ] Define pagination response format
- [ ] Create reusable helper functions
- [ ] Document API response standards

---

# Verification

Create a temporary test endpoint.

```http
GET /api/v1/test
```

Expected response:

```json
{
    "success": true,
    "message": "API response standard verified.",
    "data": {}
}
```

---

# Acceptance Criteria

- Every endpoint returns a consistent response structure.
- Success and error responses follow the same format.
- Pagination responses include metadata.
- Controllers use reusable response helpers.

---

# Definition of Done

- API response standard implemented.
- Response helper utility created.
- Documentation completed.
- Ready for feature module development.

---

# Estimated Effort

1 hour

---

# Next Task

**TASK-BACKEND-004 — Global Error Handling & Logging**

---

# Notes for OpenCode

Before implementing:

1. Do not return raw database responses directly.
2. Use the response helper for all controllers.
3. Keep the API contract consistent across all modules.
4. Ensure Angular and the kiosk frontend can rely on the same response structure.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |