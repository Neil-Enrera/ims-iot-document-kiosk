# TASK-TESTING-010 — User Acceptance Testing (UAT)

> **Phase:** Testing
> **Task ID:** TASK-TESTING-010
> **Priority:** P0 (Critical)
> **Status:** DONE

---

# Objective

Verify that the Information Management System with IoT-Assisted Document Request Services Kiosk satisfies the functional and operational requirements of Barangay San Manuel.

User Acceptance Testing (UAT) confirms that the system is usable, reliable, and ready for deployment from the perspective of its intended users.

---

# Background

After completing technical testing—including unit, integration, security, and performance testing—the final validation is performed by the actual users.

UAT focuses on whether the system effectively supports the barangay's daily document request process and improves the current manual workflow.

---

# Scope

## Included

### Information Management System

- Staff Login
- Dashboard
- Resident Management
- Service Management
- Request Processing
- Payment Recording
- Reports
- Audit Logs

### Kiosk

- RFID Authentication
- Resident Verification
- Service Selection
- Photo Capture
- Request Submission

### Overall System

- Workflow Validation
- Ease of Use
- Accuracy
- User Satisfaction

---

## Participants

### Barangay Staff

- Barangay Secretary
- Barangay Treasurer
- System Administrator (if applicable)

### Residents

Selected residents who will use the kiosk to submit document requests.

---

## Not Included

- Source Code Review
- Performance Benchmarking
- Penetration Testing
- Hardware Maintenance

---

# User Acceptance Workflow

```
Resident

↓

Use Kiosk

↓

Submit Request

↓

Barangay Staff Login

↓

Review Request

↓

Approve Request

↓

Record Payment

↓

Release Document

↓

Provide Feedback

↓

UAT Completed
```

---

# UAT Scenarios

## Scenario 1

Resident requests a Barangay Clearance.

Verify

- RFID authentication succeeds.
- Resident information is displayed correctly.
- Service can be selected.
- Photo is captured.
- Request is submitted successfully.

Expected Result

```
Request appears in the IMS dashboard.
```

---

## Scenario 2

Barangay Secretary processes the request.

Verify

- Request details are accurate.
- Status updates correctly.
- Audit log is created.

Expected Result

```
Request status changes successfully.
```

---

## Scenario 3

Treasurer records payment.

Verify

- Payment amount is recorded.
- Payment history is updated.

Expected Result

```
Payment is linked to the request.
```

---

## Scenario 4

Document is released.

Verify

- Status changes to Released.
- Reports are updated.
- Audit log records the release.

Expected Result

```
Request lifecycle is completed successfully.
```

---

# Acceptance Criteria

Users should verify the following:

## Functionality

- All required features work correctly.

## Usability

- Screens are easy to understand.
- Navigation is intuitive.
- Instructions are clear.

## Accuracy

- Resident information is correct.
- Request information is accurate.
- Reports are generated correctly.

## Reliability

- No application crashes occur.
- Requests are processed successfully.
- Data is saved correctly.

---

# UAT Execution Workflow

```
Prepare Test Environment

↓

Orient Participants

↓

Execute Test Scenarios

↓

Observe User Actions

↓

Collect Feedback

↓

Record Issues

↓

Fix Issues (if any)

↓

Retest

↓

User Approval
```

---

# Test Environment

Hardware

```
Touchscreen Kiosk

Arduino Uno

MFRC522 RFID Reader

USB Webcam

USB Printer
```

Software

```
Angular

Node.js

Express.js

MySQL
```

Location

```
Barangay Hall
```

(or simulated deployment environment)

---

# UAT Deliverables

- Completed Test Cases
- Observation Notes
- Issue Log
- User Feedback Forms
- UAT Summary Report
- Final User Approval

---

# Test Case Format

Each UAT scenario should include

```
Test ID

Scenario

Participant

Preconditions

Steps

Expected Result

Actual Result

Status

Comments
```

---

# Naming Convention

```
UAT-001

UAT-002

UAT-003

UAT-004

UAT-005
```

---

# Observation Checklist

Residents

- [ ] Easy RFID authentication
- [ ] Easy navigation
- [ ] Clear instructions
- [ ] Successful request submission

Barangay Staff

- [ ] Easy login
- [ ] Simple request processing
- [ ] Accurate records
- [ ] Reports are understandable

Overall

- [ ] Workflow is efficient
- [ ] No major usability issues
- [ ] No critical functional defects

---

# User Feedback Form

Participants may rate the following using a 5-point Likert Scale.

| Evaluation Criteria | Rating (1–5) |
|---------------------|:------------:|
| Ease of Use | |
| User Interface | |
| Navigation | |
| Accuracy | |
| Response Time | |
| Overall Satisfaction | |

Additional Comments

```
__________________________________________

__________________________________________
```

---

# Logging

Record

- Test ID
- Participant
- Scenario
- Result
- Feedback
- Date

---

# Acceptance Criteria

The system is considered accepted when:

- All critical workflows are completed successfully.
- No critical defects remain.
- Users can perform their assigned tasks without assistance.
- Feedback indicates satisfactory usability and functionality.
- Barangay representatives approve the system for deployment.

---

# Definition of Done

- User Acceptance Testing completed.
- Feedback collected and analyzed.
- Necessary improvements implemented.
- Final acceptance documented.
- System approved for deployment.

---

# Estimated Effort

1–2 days

(depending on participant availability)

---

# Next Phase

**Phase 08 — Deployment**

---

# Notes for OpenCode

Before implementing:

1. Conduct UAT using realistic barangay transactions rather than artificial demonstrations.
2. Allow participants to operate the system independently while observers record issues and feedback.
3. Categorize reported issues by severity (Critical, Major, Minor) before deciding on corrective actions.
4. Retest any corrected issues with the same participants whenever feasible to confirm the fixes.
5. Include signed acceptance forms or documented approval from barangay representatives as evidence for the capstone documentation.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| 2026-07-31 | OpenCode | Task Completed |