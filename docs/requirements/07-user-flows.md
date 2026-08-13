# 07 — User Flows

# Information Management System with IoT-Assisted Document Request Services Kiosk for Barangay San Manuel

**Project Type:** Capstone Project  
**Client:** Barangay San Manuel  
**Frontend Framework:** Angular  
**System Type:** Self-Service Document Request Kiosk + Barangay Staff Management System  
**Document Version:** 1.0  
**Status:** Draft

---

# 1. Purpose

This document defines the end-to-end user workflows for the Information Management System with IoT-Assisted Document Request Services Kiosk.

Unlike the User Stories document, which focuses on user goals, this document describes **how users interact with the system step-by-step** and how the system responds to each action.

The user flows will serve as the foundation for:

- UI/UX Design
- Wireframes
- Backend Workflow
- API Design
- Database Transactions
- System Integration
- End-to-End (E2E) Testing

---

# 2. Scope

This document covers the workflows for the following users:

- Resident
- Barangay Clerk / Staff
- Treasurer
- Barangay Captain
- Kagawad on Duty
- System Administrator

---

# 3. Flow Naming Convention

Every workflow is identified using the following format:

| Prefix | Meaning |
|---------|---------|
| FLOW-001 | Main User Flow |
| EX-001 | Exception Flow |
| ALT-001 | Alternative Flow |

---

# 4. Overall Business Workflow

The following workflow reflects the current document request process confirmed during the Barangay interview.

```text
Resident
    │
    ▼
RFID Identification
    │
    ▼
Resident Information Retrieved
    │
    ▼
Select Service
    │
    ▼
View Requirements
    │
    ▼
Complete Request Form
    │
    ▼
Submit Request
    │
    ▼
Barangay Staff Review
    │
    ▼
Payment (if applicable)
    │
    ▼
Approval
(Captain or Kagawad)
    │
    ▼
Document Release
```

---

# 5. Resident User Flows

## FLOW-001 — Resident Identification

### Objective

Allow a resident to identify themselves using their RFID Barangay ID.

### Preconditions

- Resident possesses a registered RFID Barangay ID.
- RFID Reader is operational.
- Kiosk is available.

### Main Flow

```text
Welcome Screen
      │
      ▼
Tap RFID Card
      │
      ▼
RFID Detected?
      │
 ┌────┴────┐
 │         │
No        Yes
 │         │
 ▼         ▼
Prompt   Search Resident
Again        │
             ▼
Resident Found?
        ┌────┴────┐
        │         │
      No         Yes
        │         │
        ▼         ▼
Display     Display Resident
Error         Information
```

### Postconditions

- Resident information is displayed.
- User session begins.

### Related User Stories

- US-001
- US-002
- US-003
- US-004

---

## FLOW-002 — Service Selection

### Objective

Allow the resident to choose a Barangay service.

### Main Flow

```text
Resident Information
        │
        ▼
Display Available Services
        │
        ▼
Resident Selects Service
        │
        ▼
Display Service Information
        │
        ▼
Display Requirements
        │
        ▼
Continue to Request Form
```

### Related User Stories

- US-006
- US-007
- US-008

---

## FLOW-003 — Submit Request

### Objective

Allow residents to submit a document request.

### Main Flow

```text
Request Form
      │
      ▼
Resident Enters Information
      │
      ▼
Validate Required Fields
      │
 ┌────┴────┐
 │         │
Invalid   Valid
 │         │
 ▼         ▼
Display    Review Request
Errors          │
                ▼
         Submit Request
                │
                ▼
Generate Reference Number
                │
                ▼
Confirmation Screen
```

### Postconditions

- Request is successfully recorded.
- Reference number is generated.

### Related User Stories

- US-009
- US-010
- US-011
- US-012

---

# 6. Barangay Staff User Flows

## FLOW-004 — Review Submitted Request

### Objective

Allow staff to verify newly submitted requests.

### Main Flow

```text
Staff Login
      │
      ▼
Dashboard
      │
      ▼
Pending Requests
      │
      ▼
Open Request
      │
      ▼
Review Resident Information
      │
      ▼
Verify Requirements
      │
 ┌────┴────┐
 │         │
Incomplete Complete
 │         │
 ▼         ▼
Return     Proceed
Request    to Payment
```

### Related User Stories

- US-013
- US-014
- US-015
- US-016

---

# 7. Treasurer User Flows

## FLOW-005 — Payment Processing

### Objective

Allow the Treasurer to record payments when required.

### Main Flow

```text
Open Request
      │
      ▼
Record Payment
      │
      ▼
Confirm Payment
      │
      ▼
Update Request Status
      │
      ▼
Forward to Approval
```

### Related User Stories

- US-017
- US-018

### Notes

The Barangay has not yet confirmed which services require payment. The system should support both paid and unpaid request workflows.

---

# 8. Approval User Flows

## FLOW-006 — Request Approval

### Objective

Allow the Barangay Captain or authorized Kagawad to approve or reject requests.

### Main Flow

```text
Pending Approval
      │
      ▼
Open Request
      │
      ▼
Review Request
      │
      ▼
Approve?
      │
 ┌────┴────┐
 │         │
Reject    Approve
 │         │
 ▼         ▼
Record     Update Status
Reason          │
                ▼
         Ready for Release
```

### Related User Stories

- US-019
- US-020
- US-021

---

# 9. Document Release Flow

## FLOW-007 — Release Document

### Objective

Complete the document request process.

### Main Flow

```text
Ready for Release
      │
      ▼
Open Request
      │
      ▼
Prepare Document
      │
      ▼
Release to Resident
      │
      ▼
Record Release
      │
      ▼
Request Completed
```

### Related User Stories

- US-022
- US-023

---

# 10. Administrator User Flows

## FLOW-008 — Manage Services

```text
Administrator Login
        │
        ▼
Services Module
        │
        ▼
Create / Update / Disable Service
        │
        ▼
Save Changes
```

Related User Stories

- US-024

---

## FLOW-009 — Manage Users

```text
Administrator Login
        │
        ▼
User Management
        │
        ▼
Create / Update / Disable Staff Account
        │
        ▼
Save Changes
```

Related User Stories

- US-025

---

## FLOW-010 — Configure System

```text
Administrator Login
        │
        ▼
System Settings
        │
        ▼
Update Configuration
        │
        ▼
Save Configuration
```

Related User Stories

- US-026
- US-027

---

# 11. Exception Flows

## EX-001 — RFID Not Detected

**Trigger**

Resident taps an RFID card but the system does not detect it.

**System Response**

- Prompt the resident to tap again.
- Do not create a session.
- Log the event if appropriate.

---

## EX-002 — RFID Not Registered

**Trigger**

The RFID card is not associated with a registered resident.

**System Response**

- Inform the resident that the RFID is not registered.
- Advise the resident to seek assistance from Barangay staff.

---

## EX-003 — Validation Failure

**Trigger**

Required fields are missing or contain invalid values.

**System Response**

- Highlight invalid fields.
- Prevent request submission until corrected.

---

## EX-004 — Payment Pending

**Trigger**

A payment-required request has not yet been recorded.

**System Response**

- Keep the request in the payment stage.
- Prevent approval until payment is confirmed.

---

## EX-005 — Request Rejected

**Trigger**

The approving officer rejects the request.

**System Response**

- Record the rejection reason.
- Update the request status.
- Display the updated status to staff.

---

## EX-006 — Hardware Failure

**Trigger**

RFID subsystem (ESP8266 + RFID reader), touchscreen, or webcam is unavailable.

**System Response**

- Display a user-friendly message.
- Prevent the affected operation.
- Record the hardware issue for troubleshooting.

---

# 12. Flow Traceability

| Flow | Related User Stories |
|------|----------------------|
| FLOW-001 | US-001 – US-004 |
| FLOW-002 | US-006 – US-008 |
| FLOW-003 | US-009 – US-012 |
| FLOW-004 | US-013 – US-016 |
| FLOW-005 | US-017 – US-018 |
| FLOW-006 | US-019 – US-021 |
| FLOW-007 | US-022 – US-023 |
| FLOW-008 | US-024 |
| FLOW-009 | US-025 |
| FLOW-010 | US-026 – US-027 |

---

# 13. Future Workflow Enhancements

The following workflows are outside the current MVP and may be considered for future releases:

- SMS or Email Notifications
- Online Document Requests
- Online Payment Integration
- Mobile Application Workflow
- Resident Self-Service Request Tracking
- Automated Report Generation
- Appointment Scheduling
- Queue Management

---

# 14. Document Status

| Version | Date | Description |
|----------|------|-------------|
| 1.0 | Initial Draft | Initial user flow documentation based on confirmed Barangay workflow and current project requirements. |

**Status:** Draft