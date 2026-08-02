# TASK-BACKEND-016 — File & Document Management API

> **Phase:** Backend
> **Task ID:** TASK-BACKEND-016
> **Priority:** P1 (High)
> **Status:** Done

---

# Objective

Develop the File & Document Management API to securely manage uploaded files and generated documents used throughout the Information Management System.

This module provides centralized storage and retrieval for resident photos, supporting documents, generated certificates, and future digital attachments.

---

# Background

Several modules require file management.

Examples include:

- Resident profile photos
- Supporting document uploads
- Generated barangay certificates
- Generated reports
- Future document templates

Instead of handling uploads separately in each module, the system should provide one centralized File Management service.

---

# Scope

## Included

- Upload files
- Download files
- View file metadata
- Delete files
- Validate uploaded files
- Organize storage
- File access authorization

## Not Included

- PDF certificate generation
- Image editing
- Cloud storage

---

# Dependencies

- TASK-BACKEND-008 Resident Management API
- TASK-BACKEND-011 Document Request Management API
- TASK-BACKEND-015 Audit Log API

---

# Storage Structure

```text
backend/

uploads/

resident-photos/

documents/

generated/

temporary/
```

---

# Supported Files

Resident Photos

```text
JPG
JPEG
PNG
```

Documents

```text
PDF
DOCX
```

Supporting Documents

```text
PDF
PNG
JPG
JPEG
```

---

# File Size Limits

| File Type | Maximum Size |
|------------|--------------|
| Image | 5 MB |
| Document | 10 MB |

---

# API Endpoints

## Upload File

```http
POST /api/v1/files/upload
```

Multipart form-data

Response

```json
{
    "success": true,
    "message": "File uploaded successfully.",
    "data": {
        "fileId": 101,
        "fileName": "resident-photo.jpg",
        "filePath": "/uploads/resident-photos/..."
    }
}
```

---

## Download File

```http
GET /api/v1/files/:id/download
```

---

## File Details

```http
GET /api/v1/files/:id
```

---

## Delete File

```http
DELETE /api/v1/files/:id
```

---

## List Files

```http
GET /api/v1/files
```

Supports:

- Pagination
- File Type
- Owner
- Upload Date

---

# Business Rules

- Only authenticated users may upload files.
- Files must be validated before storage.
- Unsupported file types must be rejected.
- Deleted files should follow the project's retention policy.
- Resident photos should be linked to resident records, not duplicated.

---

# Authorization

| Action | Allowed Roles |
|---------|---------------|
| Upload Files | Administrator, Secretary, Staff |
| Download Files | Authorized Users |
| Delete Files | Administrator |

---

# Folder Structure

```text
backend/src/

controllers/
    file.controller.js

services/
    file.service.js

repositories/
    file.repository.js

routes/
    file.routes.js

middleware/
    upload.middleware.js
```

---

# Files to Create

```text
controllers/file.controller.js
services/file.service.js
repositories/file.repository.js
routes/file.routes.js
middleware/upload.middleware.js
```

---

# Files to Modify

```text
routes/api.js
```

Register the File Management routes.

---

# Integration

This module will be used by:

Resident Module

```text
Resident
    │
    ▼
Upload Photo
    │
    ▼
File Service
```

Document Requests

```text
Request
    │
    ▼
Supporting Documents
    │
    ▼
File Service
```

Reports

```text
Generate Report
    │
    ▼
PDF File
    │
    ▼
Download
```

---

# Implementation Checklist

- [ ] Upload files
- [ ] Validate file type
- [ ] Validate file size
- [ ] Store file securely
- [ ] Download files
- [ ] Delete files
- [ ] Protect endpoints using JWT
- [ ] Test uploads

---

# Verification

### Upload

```http
POST /api/v1/files/upload
```

Upload a JPG image.

Expected

```http
201 Created
```

---

### Invalid File

Upload

```text
virus.exe
```

Expected

```http
400 Bad Request
```

---

### Download

```http
GET /api/v1/files/25/download
```

Returns the requested file.

---

# Acceptance Criteria

- File uploads work correctly.
- Invalid files are rejected.
- Downloads function properly.
- File access is protected.
- API follows the project standard.

---

# Definition of Done

- File Management API completed.
- Upload/download tested.
- Security validation implemented.
- Ready for system configuration.

---

# Estimated Effort

5–7 hours

---

# Next Task

**TASK-BACKEND-017 — System Settings API**

---

# Notes for OpenCode

Before implementing:

1. Use middleware (such as Multer) for handling multipart file uploads.
2. Store only file metadata in the database; keep the actual files in the filesystem.
3. Generate unique filenames to prevent collisions.
4. Validate MIME types and file sizes before saving.
5. Ensure access to uploaded files is controlled through authenticated endpoints where appropriate.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |