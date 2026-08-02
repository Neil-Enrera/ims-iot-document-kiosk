# TASK-FRONTEND-015 — File Management Module

> **Phase:** Frontend
> **Task ID:** TASK-FRONTEND-015
> **Priority:** P1 (High)
> **Status:** Done

---

# Objective

Develop the File Management Module to upload, organize, preview, download, and manage files associated with residents, document requests, payments, and system assets.

The module acts as a centralized file repository for the Information Management System.

---

# Background

The backend provides:

```
POST   /api/v1/files/upload
GET    /api/v1/files
GET    /api/v1/files/:id
GET    /api/v1/files/:id/download
DELETE /api/v1/files/:id
```

Files are referenced by other modules rather than stored independently.

---

# Scope

Included

- File List
- Upload Files
- File Preview
- Download Files
- Delete Files
- Search
- Filters
- Pagination

Not Included

- Cloud Storage
- Version Control
- File Sharing Links

---

# Navigation

```
Sidebar

↓

File Management
```

Route

```
/files
```

---

# File Categories

Resident Files

```
Resident Profile Photo

Resident Attachments
```

Document Requests

```
Supporting Documents

Generated Certificates

Signed Documents
```

Payments

```
Receipt Images
```

System

```
Barangay Logo

Templates

Other Assets
```

---

# Pages

## File List

Display

- File Name
- Category
- Related Module
- File Type
- File Size
- Uploaded By
- Upload Date

Actions

- Preview
- Download
- Delete

---

## Upload File

Fields

Category

Related Record

Description (Optional)

File

Buttons

```
Upload

Cancel
```

---

## File Details

Display

- File Name
- File Type
- Size
- Category
- Uploaded By
- Upload Date
- Related Record
- Description

Actions

- Preview
- Download

---

# Supported File Types

Images

```
JPG

JPEG

PNG
```

Documents

```
PDF

DOCX
```

Spreadsheets

```
XLSX

CSV
```

---

# File Preview

Images

Display

```
Image Viewer
```

PDF

Display

```
Embedded PDF Viewer
```

Other Files

```
Download Only
```

---

# Search

Supports

- File Name
- Category
- Related Record
- Uploaded By

---

# Filters

- Category
- File Type
- Module
- Upload Date

---

# Sorting

- Upload Date
- File Name
- File Size

---

# Components

```
file-table.component

file-upload.component

file-preview.component

file-detail.component

file-type-icon.component
```

---

# Folder Structure

```
features/

files/

pages/

list/

detail/

components/

file-table/

file-upload/

file-preview/

services/

file.facade.ts
```

---

# API Integration

Methods

```
getFiles()

getFile()

uploadFile()

downloadFile()

deleteFile()
```

---

# Upload Rules

Validate

- Allowed file type
- Maximum file size
- Required category

Display upload progress.

---

# File Associations

Each file should be linked to:

```
Resident

OR

Document Request

OR

Payment

OR

System Asset
```

The association should be displayed in the detail view.

---

# Shared Components Used

- Data Table
- File Upload
- Progress Bar
- Search Bar
- Pagination
- Confirmation Dialog
- Snackbar
- Loading Skeleton

---

# Loading State

Display

- Skeleton Table
- Skeleton Preview

---

# Error Handling

Invalid File Type

```
Unsupported file type.
```

File Too Large

```
File exceeds the maximum allowed size.
```

Upload Failed

```
Unable to upload file.
```

Download Failed

```
Unable to download file.
```

---

# Role-Based Access

Administrator

- Upload
- Download
- Delete

Secretary

- Upload
- Download

Treasurer

- Download

---

# Integration

Resident Management

```
Resident Photos
```

Document Requests

```
Supporting Documents

Generated Certificates
```

Payments

```
Receipt Attachments
```

System Settings

```
Barangay Logo

Document Templates
```

---

# Implementation Checklist

- [ ] Build File List
- [ ] Build Upload Form
- [ ] Build File Detail View
- [ ] Build Preview Component
- [ ] Implement Download
- [ ] Implement Delete
- [ ] Implement Search
- [ ] Implement Filters
- [ ] Implement Pagination
- [ ] Connect File APIs

---

# Verification

Administrator

Can upload, preview, download, and delete files.

Secretary

Can upload and download files.

Treasurer

Can download files only.

Image previews and PDF previews display correctly.

---

# Acceptance Criteria

- File upload works.
- File preview works.
- Download works.
- Delete works.
- Search and filters work.
- File associations display correctly.
- UI follows the shared design system.

---

# Definition of Done

- File Management module completed.
- Backend integration verified.
- Centralized file repository operational.
- Ready for System Settings.

---

# Estimated Effort

8–10 hours

---

# Next Task

**TASK-FRONTEND-016 — System Settings Module**

---

# Notes for OpenCode

Before implementing:

1. Use a reusable upload component with drag-and-drop support and upload progress indicators.
2. Store only file metadata in the frontend state; retrieve file content on demand for previews and downloads.
3. Associate every uploaded file with its owning entity (resident, request, payment, or system asset) using metadata rather than folder structure.
4. Restrict deletion to users with appropriate permissions and require confirmation before removing files.
5. Design the module so the storage backend can later be changed (for example, from local storage to cloud object storage) without affecting the UI.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |