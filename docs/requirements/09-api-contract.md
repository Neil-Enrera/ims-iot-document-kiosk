# 09 - API Contract

**Project:** Information Management System with IoT-Assisted Document Request Services Kiosk for Barangay San Manuel

**Version:** 1.0

**Document Status:** Draft

**Last Updated:** July 2026

---

# 1. Purpose

This document defines the REST API contract for the Information Management System (IMS). It specifies how the Angular frontend communicates with the Node.js backend and outlines the available endpoints, request formats, response structures, authentication requirements, and standard HTTP status codes.

The API contract serves as the implementation guide for frontend and backend developers to ensure consistency throughout the development process.

---

# 2. API Design Principles

The system follows RESTful API principles.

## REST Architecture

- Stateless communication
- Resource-based endpoints
- JSON request and response bodies
- Standard HTTP methods
- Standard HTTP status codes

## Data Format

All requests and responses use:

```http
Content-Type: application/json
```

---

# 3. Base URL

Development

```text
http://localhost:3000/api
```

Production

```text
https://ims.barangaysanmanuel.gov.ph/api
```

---

# 4. Authentication

All authenticated endpoints require a valid access token.

Example:

```http
Authorization: Bearer <access_token>
```

---

# 5. Standard Response Format

## Success Response

```json
{
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
}
```

---

## Error Response

```json
{
    "success": false,
    "message": "Validation failed.",
    "errors": []
}
```

---

# 6. HTTP Status Codes

| Code | Meaning |
|-------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 500 | Internal Server Error |

---

# 7. Authentication Endpoints

---

## Login

### Endpoint

```http
POST /auth/login
```

### Description

Authenticates a staff member.

### Request Body

```json
{
    "username": "admin",
    "password": "password"
}
```

### Success Response

```json
{
    "success": true,
    "message": "Login successful.",
    "data": {
        "token": "jwt-token",
        "role": "Administrator"
    }
}
```

---

## Logout

```http
POST /auth/logout
```

---

## Current User

```http
GET /auth/profile
```

---

# 8. Resident Endpoints

---

## Get All Residents

```http
GET /residents
```

---

## Get Resident by RFID

```http
GET /residents/rfid/{uid}
```

Description

Retrieves resident information after RFID scanning.

---

## Get Resident

```http
GET /residents/{id}
```

---

## Create Resident

```http
POST /residents
```

---

## Update Resident

```http
PUT /residents/{id}
```

---

## Delete Resident

```http
DELETE /residents/{id}
```

---

# 9. Service Endpoints

---

## Get Available Services

```http
GET /services
```

---

## Get Service

```http
GET /services/{id}
```

---

## Create Service

```http
POST /services
```

---

## Update Service

```http
PUT /services/{id}
```

---

## Delete Service

```http
DELETE /services/{id}
```

---

# 10. Document Request Endpoints

---

## Create Request

```http
POST /requests
```

### Request Body

```json
{
    "residentId": 12,
    "serviceId": 4,
    "purpose": "Employment"
}
```

### Success Response

```json
{
    "success": true,
    "message": "Request submitted successfully.",
    "data": {
        "requestId": 1001,
        "status": "Submitted"
    }
}
```

---

## Get All Requests

```http
GET /requests
```

---

## Get Request

```http
GET /requests/{id}
```

---

## Update Request

```http
PUT /requests/{id}
```

---

## Cancel Request

```http
DELETE /requests/{id}
```

---

# 11. Approval Endpoints

The approval process is performed by the Barangay Captain or authorized Kagawad.

---

## Get Pending Approvals

```http
GET /approvals
```

---

## Approve Request

```http
PUT /approvals/{id}/approve
```

---

## Reject Request

```http
PUT /approvals/{id}/reject
```

---

# 12. Payment Endpoints

Payment is performed after document approval and before document release.

---

## Get Payments

```http
GET /payments
```

---

## Record Payment

```http
POST /payments
```

### Request Body

```json
{
    "requestId": 1001,
    "amount": 75.00,
    "paymentMethod": "Cash"
}
```

---

## Get Payment Details

```http
GET /payments/{id}
```

---

# 13. Release Endpoints

Document release occurs after payment has been successfully recorded.

---

## Get Release Queue

```http
GET /releases
```

---

## Release Document

```http
PUT /releases/{id}/release
```

### Success Response

```json
{
    "success": true,
    "message": "Document released successfully.",
    "data": {
        "status": "Released"
    }
}
```

---

# 14. Administration Endpoints

---

## Dashboard Statistics

```http
GET /dashboard/statistics
```

---

## Recent Requests

```http
GET /dashboard/recent-requests
```

---

## System Logs

```http
GET /audit/logs
```

---

## Manage Users

```http
GET /users
POST /users
PUT /users/{id}
DELETE /users/{id}
```

---

# 15. Request Status Flow

The request status progresses through the following lifecycle:

```text
Submitted
    │
    ▼
Under Review
    │
    ▼
Approved
    │
    ▼
For Payment
    │
    ▼
Ready for Release
    │
    ▼
Released
    │
    ▼
Completed
```

If the request is denied during the approval stage, the status becomes:

```text
Rejected
```

---

# 16. API Versioning

The API uses URL versioning.

Example

```text
/api/v1/residents
/api/v1/services
/api/v1/requests
```

Future versions:

```text
/api/v2/
```

---

# 17. Security Considerations

The API implements the following security measures:

- JWT Authentication
- Role-Based Access Control (RBAC)
- Password Hashing
- Input Validation
- SQL Injection Prevention
- Cross-Origin Resource Sharing (CORS)
- Audit Logging

---

# 18. Endpoint Summary

| Module | Endpoint |
|----------|----------|
| Authentication | `/auth` |
| Residents | `/residents` |
| Services | `/services` |
| Requests | `/requests` |
| Approvals | `/approvals` |
| Payments | `/payments` |
| Releases | `/releases` |
| Dashboard | `/dashboard` |
| Users | `/users` |
| Audit Logs | `/audit` |

---

# 19. Future Enhancements

The API is designed to support future integrations without major architectural changes, including:

- SMS Notifications
- Email Notifications
- QR Code Verification
- Online Payment Gateway
- Mobile Application
- Public Request Tracking Portal
- Biometric Authentication
- Multi-Barangay Deployment

---

# Document Status

| Item | Status |
|------|--------|
| Document Name | API Contract |
| Version | 1.0 |
| Status | Draft |
| Next Document | 10-database-design.md |