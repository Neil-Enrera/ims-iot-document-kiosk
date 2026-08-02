# TASK-HARDWARE-004 — Webcam Integration

> **Phase:** Hardware & Kiosk
> **Task ID:** TASK-HARDWARE-004
> **Priority:** P1 (High)
> **Status:** Done

---

# Objective

Integrate the kiosk webcam with the Angular application to capture and store a resident's photo during the document request process.

The captured image becomes part of the document request and assists barangay personnel in verifying the identity of the requesting resident.

---

# Background

Unlike the RFID reader, the webcam communicates directly with the Angular application using the browser's MediaDevices API.

Captured images are uploaded to the backend and linked to the document request.

---

# Scope

Included

- Camera Detection
- Live Camera Preview
- Capture Photo
- Preview Before Submission
- Upload Photo
- Save Photo Metadata
- Camera Status

Not Included

- Facial Recognition
- Face Matching
- AI Verification
- Video Recording

---

# Hardware

Camera

```
USB Webcam
```

Browser API

```
MediaDevices.getUserMedia()
```

Image Format

```
JPEG
```

---

# Overall Workflow

```
Resident taps RFID

↓

Resident Verified

↓

Select Service

↓

Camera Preview

↓

Capture Photo

↓

Resident Confirms

↓

Upload Image

↓

Create Request
```

---

# Camera Responsibilities

Angular

- Detect Camera
- Display Preview
- Capture Image
- Upload Image

Backend

- Store Image
- Link to Request
- Save Metadata

Camera

- Video Input Only

---

# Camera Initialization

Angular

↓

Check Camera Permission

↓

Detect Camera

↓

Start Video Stream

↓

Display Live Preview

---

# Camera States

```
Initializing

Ready

Capturing

Uploading

Completed

Error
```

---

# User Interface

Idle

```
Camera Ready
```

Preview

```
Live Camera Feed
```

Capture

```
Take Photo
```

Review

```
Retake

Continue
```

Uploading

```
Uploading Photo...
```

Success

```
Photo Saved
```

---

# Photo Workflow

```
Live Preview

↓

Capture

↓

Image Preview

↓

Retake?

↓

YES

↓

Return Preview

↓

NO

↓

Upload

↓

Backend

↓

File Storage

↓

Request Record
```

---

# Backend API

Upload

```
POST

/api/v1/files/upload
```

Category

```
Resident Request Photo
```

Response

```json
{
  "fileId": 83,
  "url": "/uploads/request-photo-83.jpg"
}
```

---

# Request Integration

When creating a request

```json
{
    "residentId":25,
    "serviceId":3,
    "photoId":83
}
```

The request references the uploaded image.

---

# Image Rules

Format

```
JPEG
```

Maximum Size

```
2 MB
```

Resolution

Recommended

```
1280 × 720
```

Compression

Client-side before upload if necessary.

---

# File Storage

Stored by backend

Category

```
Request Photo
```

Metadata

- Resident
- Request
- Timestamp
- Uploaded By (Kiosk)

---

# Error Handling

Permission Denied

```
Camera permission denied.
```

Camera Missing

```
No camera detected.
```

Capture Failed

```
Unable to capture photo.
```

Upload Failed

```
Unable to upload image.
```

---

# Components

Angular

```
camera.service.ts

camera-preview.component

capture-button.component

photo-review.component
```

Backend

```
file.service.ts

upload.controller.ts
```

---

# Folder Structure

```
frontend/

features/

kiosk/

camera/

components/

camera-preview/

photo-review/

services/

camera.service.ts
```

---

# Testing Checklist

- [ ] Detect webcam
- [ ] Display preview
- [ ] Capture image
- [ ] Retake image
- [ ] Upload image
- [ ] Link image to request
- [ ] Handle permission denial
- [ ] Handle missing camera
- [ ] Save metadata

---

# Acceptance Criteria

- Webcam initializes successfully.
- Live preview is displayed.
- Residents can capture and review their photo.
- Image uploads successfully.
- Uploaded image is linked to the request.
- Errors are handled gracefully.

---

# Definition of Done

- Webcam integration completed.
- Request photos stored successfully.
- Ready for kiosk authentication workflow.

---

# Estimated Effort

6–8 hours

---

# Next Task

**TASK-HARDWARE-005 — Kiosk Authentication Flow**

---

# Notes for OpenCode

Before implementing:

1. Use the browser's `MediaDevices.getUserMedia()` API rather than platform-specific camera libraries to maintain compatibility.
2. Stop the video stream immediately after the photo is captured or the session ends to release the camera.
3. Compress images on the client when necessary to reduce upload time while maintaining sufficient quality for verification.
4. Upload photos only after the resident confirms the captured image to avoid unnecessary storage.
5. Store camera configuration (resolution, quality, timeout) in the System Settings module so administrators can adjust it without modifying code.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |