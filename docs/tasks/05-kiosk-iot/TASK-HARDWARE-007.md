# TASK-HARDWARE-007 — Document Printing Integration

> **Phase:** Hardware & Kiosk
> **Task ID:** TASK-HARDWARE-007
> **Priority:** P1 (High)
> **Status:** Done

---

# Objective

Integrate printing capabilities into the kiosk to generate request acknowledgment slips after successful document request submission.

Official barangay documents remain under the control of authorized barangay staff and are **not** printed directly from the kiosk.

---

# Background

After a resident submits a document request through the kiosk, the system may print an acknowledgment slip containing the request details.

This slip serves as proof that the request has been received.

---

# Scope

Included

- Printer Detection
- Printer Status
- Queue Slip Printing
- Reprint Support (Staff)
- Print Error Handling

Not Included

- Automatic Barangay Clearance Printing
- Automatic Certificate Printing
- Payment Receipt Printing
- Batch Printing

---

# Hardware

Supported

```
USB Printer

Laser Printer

Inkjet Printer

Thermal Printer (Optional)
```

Printing handled by

```
Node.js Print Service
```

---

# Printing Workflow

```
Resident

↓

Submit Request

↓

Backend Creates Request

↓

Control Number Generated

↓

Queue Slip Generated

↓

Print Service

↓

Printer

↓

Resident Receives Slip
```

---

# Queue Slip Content

Display

```
Barangay Name

Control Number

Resident Name

Requested Service

Date & Time

Estimated Processing Time

Reminder Message
```

Optional

```
QR Code

Barcode
```

Future-ready only.

---

# Slip Layout

```
--------------------------------

Barangay San Manuel

Information Management System

--------------------------------

Control No.

BRGY-2026-000112

--------------------------------

Resident

Juan Dela Cruz

--------------------------------

Service

Barangay Clearance

--------------------------------

Submitted

July 29, 2026

--------------------------------

Status

Pending Review

--------------------------------

Please wait for barangay confirmation.

--------------------------------
```

---

# Printer Status

States

```
Ready

Printing

Offline

Paper Empty

Error
```

Displayed in

- Hardware Diagnostics
- System Settings

---

# Backend Print Service

Responsibilities

- Generate Printable HTML/PDF
- Send Print Job
- Monitor Print Queue
- Report Print Status

---

# API

Print Queue Slip

```
POST

/api/v1/printing/queue-slip
```

Request

```json
{
    "requestId":112
}
```

Response

```json
{
    "printed":true,
    "jobId":58
}
```

---

# Print Template

Contains

- Barangay Logo
- Barangay Name
- Request Details
- Footer Message

The template should be configurable from the **System Settings** module.

---

# Print Settings

Administrator may configure

- Default Printer
- Paper Size
- Orientation
- Copies
- Auto Print
- Print Margin

---

# Error Handling

Printer Offline

```
Printer unavailable.
```

Paper Empty

```
Printer is out of paper.
```

Print Failed

```
Unable to print queue slip.
```

Queue Full

```
Print queue is busy.
```

---

# Components

Backend

```
print.service.ts

printer.controller.ts

printer.repository.ts
```

Frontend

```
printer-status.component

print-preview.component

print-button.component
```

---

# Folder Structure

```
hardware/

printing/

services/

print.service.ts

templates/

queue-slip.html

controllers/

printer.controller.ts
```

---

# Logging

Record

- Print Job ID
- Request ID
- Printer
- Print Time
- Print Status
- Kiosk ID

---

# Security

Residents

Can

- Receive queue slips

Residents

Cannot

- Print official documents
- Print arbitrary records
- Access print history

Staff

Can

- Reprint queue slips (if authorized)
- Print official approved documents from the IMS

---

# Testing Checklist

- [ ] Detect printer
- [ ] Print queue slip
- [ ] Verify slip contents
- [ ] Handle printer offline
- [ ] Handle paper empty
- [ ] Log print jobs
- [ ] Configure printer settings
- [ ] Verify reprint permissions

---

# Acceptance Criteria

- Queue slips print successfully after request submission.
- Printer status is displayed correctly.
- Print errors are handled gracefully.
- Queue slip template is configurable.
- Official document printing remains restricted to staff.

---

# Definition of Done

- Queue slip printing operational.
- Printer integration verified.
- Ready for Hardware Diagnostics & Monitoring.

---

# Estimated Effort

6–8 hours

---

# Next Task

**TASK-HARDWARE-008 — Hardware Diagnostics & Monitoring**

---

# Notes for OpenCode

Before implementing:

1. Generate queue slips from HTML templates rendered on the backend so the layout can be customized without changing application code.
2. Abstract printer operations behind a `PrintService` so different printer models can be supported later.
3. Make queue slip printing optional through the System Settings module, allowing barangays without kiosk printers to use the system normally.
4. Record every print job in the audit log with its status (success, failed, cancelled) for troubleshooting.
5. Reserve official document printing for authenticated staff workflows after request approval and payment verification.