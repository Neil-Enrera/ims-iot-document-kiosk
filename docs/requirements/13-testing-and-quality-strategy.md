# 13. Testing and Quality Strategy

## 1. Purpose

The Testing and Quality Strategy defines the procedures used to verify that the Information Management System with IoT-Assisted Document Request Services Kiosk functions correctly, meets the project requirements, and provides reliable services to both residents and barangay personnel.

Testing is performed throughout the development process to identify defects, validate system functionality, and ensure that all software and hardware components work together as intended.

---

# 2. Testing Objectives

The primary objectives of system testing are to:

- Verify that all functional requirements are implemented correctly.
- Ensure accurate communication between the kiosk hardware and software.
- Detect and resolve software defects before deployment.
- Validate the accuracy of resident and document records.
- Confirm that the system meets user expectations.
- Improve the overall reliability and usability of the system.

---

# 3. Testing Scope

The following components will be tested throughout the project:

| Component | Description |
|----------|-------------|
| Resident Management | Resident registration, update, and retrieval |
| RFID Identification | RFID card reading and resident identification |
| Document Requests | Submission and processing of document requests |
| Approval Workflow | Review, approval, and rejection of requests |
| Payment Recording | Recording of cash payments |
| Document Release | Release of completed documents |
| User Management | Login, roles, and permissions |
| Reports | Generation of request and payment reports |
| Audit Logs | Recording of user activities |

---

# 4. Functional Testing

Functional testing verifies that every feature behaves according to the system requirements.

### Test Areas

- User Login
- Resident Registration
- RFID Identification
- Service Selection
- Document Request Submission
- Request Approval
- Payment Recording
- Document Release
- Report Generation
- User Management

Expected Result:

Each function should produce the expected output without errors.

---

# 5. Integration Testing

Integration testing verifies that different software modules communicate correctly.

The following integrations will be tested:

- Angular Frontend ↔ Node.js API
- Node.js API ↔ MySQL Database
- RFID Reader ↔ Angular Application
- Webcam ↔ Angular Application
- Dashboard ↔ Backend Services

Expected Result:

All modules exchange data accurately without communication failures.

---

# 6. Hardware Testing

The project integrates IoT hardware components that require validation.

### RFID Reader

Test Cases:

- Read registered RFID card
- Reject unknown RFID card
- Read multiple cards consecutively

Expected Result:

The correct resident profile should be retrieved within a few seconds.

---

### Webcam

Test Cases:

- Capture resident image
- Save image to request record
- Verify image quality

Expected Result:

Resident photo should be stored successfully.

---

### Touchscreen

Test Cases:

- Navigation
- Button responsiveness
- Form input
- Request confirmation

Expected Result:

The interface should respond accurately to touch input.

---

# 7. User Acceptance Testing (UAT)

User Acceptance Testing evaluates whether the completed system satisfies the needs of the barangay personnel.

Participants may include:

- Barangay Secretary
- Barangay Treasurer
- Barangay Captain or Authorized Kagawad

Evaluation criteria include:

- Ease of use
- Processing speed
- Workflow suitability
- Accuracy of records
- Overall satisfaction

Feedback gathered during UAT will be used to improve the final version of the system.

---

# 8. Performance Testing

Performance testing evaluates the responsiveness and stability of the system.

The following factors will be observed:

- Login response time
- RFID identification speed
- Request submission time
- Database query performance
- Dashboard loading speed

Expected Result:

The system should respond within an acceptable time under normal operating conditions.

---

# 9. Security Testing

Security testing verifies that unauthorized users cannot access restricted functions.

Test Areas:

- Invalid login attempts
- Role-Based Access Control (RBAC)
- Password validation
- SQL Injection prevention
- Input validation

Expected Result:

Only authorized users should gain access to protected resources.

---

# 10. Defect Management

During development, identified issues will be documented and corrected before deployment.

Each defect record should include:

- Defect ID
- Description
- Severity
- Module affected
- Status
- Date reported
- Date resolved

This process helps ensure that issues are tracked until they are successfully resolved.

---

# 11. Acceptance Criteria

The system will be considered ready for deployment when:

- All critical features function correctly.
- Major defects have been resolved.
- Hardware devices operate reliably.
- User Acceptance Testing is successfully completed.
- The system satisfies the approved project requirements.

---

# 12. Summary

The Testing and Quality Strategy ensures that both the software and hardware components of the Information Management System operate correctly and reliably. Through functional, integration, hardware, performance, security, and user acceptance testing, the project aims to deliver a dependable solution that improves the efficiency of barangay document request services.