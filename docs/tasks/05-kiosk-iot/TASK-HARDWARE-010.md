# TASK-HARDWARE-010 — End-to-End Hardware Testing

> **Phase:** Hardware & Kiosk
> **Task ID:** TASK-HARDWARE-010
> **Priority:** P0 (Critical)
> **Status:** Done

---

# Objective

Validate the complete IoT-Assisted Document Request Services Kiosk by testing all hardware, software, and workflow integrations from resident authentication through request submission.

This testing confirms that the kiosk is ready for pilot deployment in the barangay.

---

# Background

This task verifies the integration of:

- Angular Frontend
- Express Backend
- MySQL Database
- Arduino Uno
- MFRC522 RFID Reader
- Webcam
- Printer
- Hardware Monitoring
- Kiosk Security

---

# Scope

Included

- Functional Testing
- Hardware Testing
- Integration Testing
- Workflow Testing
- Security Testing
- Recovery Testing
- Performance Testing
- User Acceptance Testing (UAT)

---

# End-to-End Workflow

```
Resident

↓

Tap RFID Card

↓

Resident Verification

↓

Service Selection

↓

Photo Capture

↓

Review Request

↓

Submit Request

↓

Queue Slip Printed (Optional)

↓

Session Ends

↓

Idle Screen
```

Every step should be verified successfully.

---

# Functional Testing

Verify

- RFID authentication
- Resident lookup
- Camera capture
- Request submission
- Queue slip printing
- Session cleanup
- Return to idle

---

# Hardware Testing

Arduino

- Connection
- Reconnection

RFID

- Valid card
- Invalid card
- Duplicate scan

Camera

- Preview
- Capture
- Upload

Printer

- Queue slip
- Offline handling

---

# Backend Testing

Verify

- API responses
- Database writes
- File uploads
- WebSocket events
- Audit logs

---

# Security Testing

Verify

- Session timeout
- Session cleanup
- Unauthorized route access
- Resident isolation
- Administrative protection

---

# Recovery Testing

Simulate

- Network loss
- Browser refresh
- Arduino disconnect
- Camera failure
- Printer offline
- Power restart

Confirm the kiosk returns to a safe operational state.

---

# Performance Targets

RFID Verification

```
< 2 seconds
```

Camera Capture

```
< 3 seconds
```

Request Submission

```
< 5 seconds
```

Return to Idle

```
< 10 seconds
```

---

# User Acceptance Testing

Test with representative users

Residents

- Complete request independently
- Understand kiosk instructions
- Navigate without assistance

Barangay Staff

- Verify requests appear in the IMS
- Review captured photos
- Continue normal approval workflow

---

# Test Deliverables

- Test Plan
- Test Cases
- Test Results
- Bug List
- Defect Resolution Log
- UAT Sign-off

---

# Acceptance Criteria

- All hardware integrates successfully.
- End-to-end workflow completes without critical errors.
- Performance targets are achieved.
- Recovery scenarios pass.
- UAT completed successfully.
- System approved for deployment.

---

# Definition of Done

- Hardware & Kiosk phase completed.
- Entire IoT-assisted workflow verified.
- Project ready for deployment and documentation.

---

# Estimated Effort

12–16 hours