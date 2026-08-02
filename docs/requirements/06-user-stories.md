# 06 — User Stories

# Information Management System with IoT-Assisted Document Request Services Kiosk for Barangay San Manuel

**Project Type:** Capstone Project  
**Client:** Barangay San Manuel  
**Frontend Framework:** Angular  
**System Type:** Self-Service Document Request Kiosk + Barangay Staff Management System  
**Document Version:** 1.0  
**Status:** Draft

---

# 1. Purpose

This document defines the user stories for the system.

User stories describe the goals that each user wants to accomplish while interacting with the system. They focus on **user needs**, rather than technical implementation.

These stories will serve as the foundation for:

- Functional requirements
- User interface design
- API design
- Database design
- Task breakdown
- Sprint planning
- Acceptance testing
- End-to-End testing

Every implementation task should be traceable back to one or more user stories.

---

# 2. User Story Format

All user stories follow the format:

> **As a _[role]_, I want _[goal]_ so that _[benefit]_.**

Each story also includes:

- Story ID
- Epic
- Priority
- Business Value
- Dependencies
- Acceptance Criteria

---

# 3. User Roles

The system contains the following primary users.

## Resident

Uses the kiosk to request Barangay documents.

---

## Barangay Clerk / Staff

Reviews and processes resident requests.

---

## Treasurer

Handles payment recording and payment confirmation.

---

## Barangay Captain

Approves or rejects document requests where authorized.

---

## Kagawad on Duty

Approves requests according to Barangay policy.

---

## System Administrator

Maintains system configuration, users, and services.

---

# 4. Story Priorities

The project uses the **MoSCoW prioritization method**.

| Priority | Meaning |
|----------|---------|
| Must Have | Required for MVP |
| Should Have | Important but not critical |
| Could Have | Nice enhancement |
| Won't Have | Deferred after MVP |

---

# 5. Epic Overview

| Epic ID | Epic |
|----------|------|
| EPIC-01 | Resident Identification |
| EPIC-02 | Resident Information |
| EPIC-03 | Document Services |
| EPIC-04 | Document Requests |
| EPIC-05 | Staff Processing |
| EPIC-06 | Payment Processing |
| EPIC-07 | Approval Workflow |
| EPIC-08 | Document Release |
| EPIC-09 | Administration |
| EPIC-10 | System Management |

---

# EPIC-01 — Resident Identification

## US-001 — RFID Identification

**Actor:** Resident

**Story**

As a resident,

I want to identify myself using my RFID Barangay ID,

so that the system can automatically retrieve my registered information.

**Priority**

Must Have

**Business Value**

High

**Dependencies**

- Registered RFID
- Resident database
- RFID reader

**Acceptance Criteria**

- Given a registered RFID card
- When the resident taps the RFID card
- Then the correct resident information is retrieved.

---

## US-002 — Unknown RFID

**Actor:** Resident

As a resident,

I want the kiosk to notify me if my RFID is not registered,

so that I know I need assistance from Barangay staff.

**Priority**

Must Have

**Acceptance Criteria**

- Unknown RFID displays an understandable message.
- No resident information is shown.
- The session remains secure.

---

## US-003 — RFID Reader Failure

**Actor:** Resident

As a resident,

I want to know when the RFID reader is unavailable,

so that I can request assistance instead of assuming the system is frozen.

**Priority**

Should Have

**Acceptance Criteria**

- Hardware failure is detected.
- Friendly error message is displayed.
- Technical errors are not exposed.

---

# EPIC-02 — Resident Information

## US-004 — View Resident Information

**Actor:** Resident

As a resident,

I want to review my information,

so that I can confirm it is correct before requesting a document.

---

## US-005 — Incorrect Resident Information

**Actor:** Resident

As a resident,

I want to be informed when my information is incorrect,

so that I know to contact Barangay staff.

---

# EPIC-03 — Document Services

## US-006 — View Available Services

**Actor:** Resident

As a resident,

I want to view available Barangay services,

so that I can choose the correct document.

---

## US-007 — View Service Requirements

**Actor:** Resident

As a resident,

I want to see the requirements for the selected service,

so that I know what information or documents are needed.

---

## US-008 — View Service Information

**Actor:** Resident

As a resident,

I want to view information about a service,

so that I understand what I am requesting.

---

# EPIC-04 — Document Requests

## US-009 — Complete Request Form

**Actor:** Resident

As a resident,

I want to fill out only the information required for the selected service,

so that the request process is simple.

---

## US-010 — Review Request

**Actor:** Resident

As a resident,

I want to review my request before submission,

so that I can correct mistakes.

---

## US-011 — Submit Request

**Actor:** Resident

As a resident,

I want to submit my request,

so that Barangay staff can process it.

---

## US-012 — Receive Request Reference

**Actor:** Resident

As a resident,

I want to receive a request reference,

so that I can identify my request.

---

# EPIC-05 — Staff Processing

## US-013 — View Submitted Requests

**Actor:** Barangay Staff

As a staff member,

I want to see submitted requests,

so that I can begin processing them.

---

## US-014 — Review Request Details

**Actor:** Barangay Staff

As a staff member,

I want to review request details,

so that I can verify the request.

---

## US-015 — Verify Requirements

**Actor:** Barangay Staff

As a staff member,

I want to verify submitted requirements,

so that only complete requests continue.

---

## US-016 — Update Request Status

**Actor:** Barangay Staff

As a staff member,

I want to update the request status,

so that residents and staff know its progress.

---

# EPIC-06 — Payment Processing

## US-017 — Record Payment

**Actor:** Treasurer

As the Treasurer,

I want to record payments,

so that payment-required requests can continue.

---

## US-018 — Confirm Payment

**Actor:** Treasurer

As the Treasurer,

I want to confirm payment,

so that the request proceeds to approval.

---

# EPIC-07 — Approval Workflow

## US-019 — Approve Request

**Actor:** Barangay Captain

As the Barangay Captain,

I want to approve requests,

so that qualified requests continue.

---

## US-020 — Reject Request

**Actor:** Barangay Captain

As the Barangay Captain,

I want to reject requests when necessary,

so that invalid requests do not continue.

---

## US-021 — Kagawad Approval

**Actor:** Kagawad

As a Kagawad on Duty,

I want to approve requests when authorized,

so that processing is not delayed.

---

# EPIC-08 — Document Release

## US-022 — Record Release

**Actor:** Barangay Staff

As a staff member,

I want to record document release,

so that the request lifecycle is complete.

---

## US-023 — View Request History

**Actor:** Barangay Staff

As a staff member,

I want to view request history,

so that I can track previous processing actions.

---

# EPIC-09 — Administration

## US-024 — Manage Services

**Actor:** Administrator

As an administrator,

I want to manage available services,

so that the kiosk reflects the current Barangay offerings.

---

## US-025 — Manage Users

**Actor:** Administrator

As an administrator,

I want to manage staff accounts,

so that only authorized users access the system.

---

# EPIC-10 — System Management

## US-026 — View Audit Logs

**Actor:** Administrator

As an administrator,

I want to view audit logs,

so that important system actions can be traced.

---

## US-027 — Configure System Settings

**Actor:** Administrator

As an administrator,

I want to configure system settings,

so that the system can adapt to Barangay policies.

---

# 6. MVP Story Map

Resident
Welcome
↓
RFID Identification
↓
Resident Information
↓
Select Service
↓
View Requirements
↓
Fill Request Form
↓
Review Request
↓
Submit Request
↓
Barangay Staff
↓
View Requests
↓
Review Request
↓
Verify Requirements
↓
Payment (if required)
↓
Approval
↓
Release


---

# 7. Story Traceability

Every implementation task should reference the user stories it fulfills.

Example:

| Task | User Stories |
|------|--------------|
| TASK-004 RFID Module | US-001, US-002, US-003 |
| TASK-005 Resident Module | US-004, US-005 |
| TASK-006 Service Module | US-006, US-007, US-008 |
| TASK-007 Request Module | US-009, US-010, US-011, US-012 |

---

# 8. Story Status

| Status | Meaning |
|---------|---------|
| Draft | Story is being analyzed |
| Approved | Story is approved for implementation |
| Deferred | Planned for a future release |
| Rejected | Will not be implemented |

Current Status:

> **Draft**