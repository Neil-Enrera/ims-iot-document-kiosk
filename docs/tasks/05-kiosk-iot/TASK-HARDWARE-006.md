# TASK-HARDWARE-006 — Document Request Kiosk Workflow

> **Phase:** Hardware & Kiosk
> **Task ID:** TASK-HARDWARE-006
> **Priority:** P0 (Critical)
> **Status:** Done

---

# Objective

Implement the complete self-service document request workflow that allows authenticated residents to request barangay documents through the kiosk.

The workflow combines RFID authentication, resident verification, document selection, photo capture, request confirmation, and request submission into one guided process.

---

# Background

This module begins immediately after a resident successfully authenticates using their RFID card.

The kiosk operates as a guided wizard to prevent residents from skipping required steps.

---

# Scope

Included

- Service Selection
- Service Information
- Requirements Display
- Resident Information Review
- Photo Capture
- Request Confirmation
- Request Submission
- Success Screen
- Session Completion

Not Included

- Staff Approval
- Payment Collection
- Document Printing
- Online Payments

These continue in the IMS after submission.

---

# Complete Workflow

```
Idle Screen

↓

RFID Authentication

↓

Resident Verification

↓

Available Services

↓

Select Service

↓

View Requirements

↓

Capture Photo

↓

Review Information

↓

Submit Request

↓

Request Created

↓

Success Screen

↓

Auto Logout

↓

Return to Idle
```

---

# Kiosk Wizard

## Step 1

Resident Information

Display

- Resident Photo
- Full Name
- Address
- RFID Status

Buttons

```
Continue

Cancel
```

---

## Step 2

Available Services

Display

- Barangay Clearance
- Certificate of Residency
- Certificate of Indigency
- Business Clearance
- Barangay ID

Each card displays

- Fee
- Processing Time
- Short Description

---

## Step 3

Requirements

Display

Example

```
Barangay Clearance

Requirements

✔ Valid RFID

✔ Resident Record

✔ No Pending Restrictions
```

If additional requirements exist

Display

```
Please prepare the following documents before visiting the barangay office.
```

---

## Step 4

Photo Capture

Use

```
Webcam Integration
```

Workflow

```
Live Preview

↓

Capture

↓

Review

↓

Retake

OR

Continue
```

---

## Step 5

Review Request

Display

Resident

Service

Captured Photo

Estimated Fee

Estimated Processing Time

Buttons

```
Submit Request

Back
```

---

## Step 6

Request Submitted

Display

```
Thank You!

Your request has been received.
```

Show

- Request Number
- Control Number
- Date Submitted
- Estimated Processing Time

Optional

```
Print Queue Slip
```

---

# Backend API

Create Request

```
POST

/api/v1/requests
```

Example

```json
{
    "residentId":25,
    "serviceId":2,
    "photoId":83,
    "source":"KIOSK"
}
```

Response

```json
{
    "requestId":112,
    "controlNumber":"BRGY-2026-000112",
    "status":"Pending Review"
}
```

---

# Kiosk Session Updates

Current Step

```
Resident

↓

Service

↓

Photo

↓

Review

↓

Completed
```

Each step is stored until completion.

---

# Validation

Before submission

Verify

- Resident authenticated
- Service selected
- Photo uploaded
- Session active

---

# UI Components

Angular

```
resident-summary.component

service-selection.component

requirements-panel.component

request-review.component

submission-success.component

stepper.component
```

---

# Folder Structure

```
frontend/

features/

kiosk/

workflow/

pages/

resident/

services/

requirements/

photo/

review/

success/

components/

stepper/
```

---

# Error Handling

Session Expired

```
Session expired.

Please scan your RFID card again.
```

Service Unavailable

```
This service is temporarily unavailable.
```

Submission Failed

```
Unable to submit request.

Please try again.
```

Network Error

```
Connection lost.

Please contact the barangay staff.
```

---

# Success Screen

Display

```
Request Successfully Submitted
```

Show

- Control Number
- Resident Name
- Requested Service
- Date Submitted
- Next Steps

Automatically return to the idle screen after

```
10 seconds
```

(configurable)

---

# Logging

Record

- Resident ID
- Service Selected
- Request Number
- Kiosk ID
- Submission Time
- Completion Status

---

# Security

Residents

Cannot

- Access staff modules
- Edit resident information
- View other requests
- Skip required steps

All request validation occurs on the backend.

---

# Testing Checklist

- [ ] Select service
- [ ] View requirements
- [ ] Capture photo
- [ ] Review request
- [ ] Submit request
- [ ] Generate control number
- [ ] Display success screen
- [ ] Return to idle
- [ ] Handle submission errors

---

# Acceptance Criteria

- Residents can complete the workflow without staff assistance.
- Requests are successfully created in the backend.
- Photos are linked to requests.
- Control numbers are generated correctly.
- Wizard navigation prevents skipping steps.
- Session ends automatically after completion.

---

# Definition of Done

- Complete self-service request workflow operational.
- End-to-end kiosk request process implemented.
- Ready for document printing integration.

---

# Estimated Effort

10–12 hours

---

# Next Task

**TASK-HARDWARE-007 — Document Printing Integration**

---

# Notes for OpenCode

Before implementing:

1. Implement the workflow as a centralized wizard controller rather than allowing independent page navigation.
2. Save the current workflow step in the kiosk session so recovery is possible after a browser refresh (if the session remains valid).
3. Retrieve available services dynamically from the backend so administrators can enable or disable services without redeploying the frontend.
4. Prevent duplicate submissions by disabling the **Submit Request** button after the first successful click until a response is received.
5. After a successful submission, clear all resident-specific data from memory before returning to the idle screen.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |