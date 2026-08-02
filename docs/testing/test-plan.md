# Master Test Plan

> **Project:** IMS-IoT Document Request Kiosk
> **Client:** Barangay San Manuel
> **Version:** 1.0
> **Date:** July 31, 2026

---

## 1. Executive Summary

This Master Test Plan defines the testing strategy, scope, environment, and procedures for the Information Management System with IoT-Assisted Document Request Services Kiosk. The goal is to verify that all system components function correctly and meet the requirements of Barangay San Manuel before deployment.

---

## 2. Testing Objectives

- Verify all software modules operate correctly in isolation and together
- Ensure hardware devices communicate properly with the backend
- Validate data integrity across all database operations
- Confirm the kiosk workflow functions end-to-end
- Verify security mechanisms prevent unauthorized access
- Ensure acceptable performance under normal operating conditions
- Obtain user acceptance from barangay staff and residents

---

## 3. Testing Scope

### 3.1 In Scope

| Module | Components |
|--------|------------|
| Authentication | Login, JWT, session management, logout |
| Dashboard | Statistics, charts, quick actions |
| Resident Management | CRUD, search, archive/restore |
| User Management | CRUD, role assignment, deactivation |
| Service Management | CRUD, status toggle |
| Request Management | Submit, approve, reject, release workflow |
| Reports | Date range, request reports |
| Notifications | Real-time notifications, mark read |
| Audit Logs | Log creation and retrieval |
| File Management | Upload, download, delete |
| System Settings | Configuration management |
| Kiosk Interface | Search, select, photo, submit, receipt |
| RFID Integration | Card verification (when hardware present) |
| Hardware | Arduino, RFID reader, webcam, printer |

### 3.2 Out of Scope

- Network penetration testing
- OS hardening
- Third-party security audits
- Enterprise load testing
- Payment processing (removed per DEC-001)

---

## 4. Testing Types

| Type | Description | Task |
|------|-------------|------|
| Unit Testing | Individual component verification | TASK-TESTING-002 |
| Database Testing | Schema, CRUD, constraints, seed data | TASK-TESTING-003 |
| Backend API Testing | All REST endpoints | TASK-TESTING-004 |
| Frontend UI Testing | Angular modules and components | TASK-TESTING-005 |
| Kiosk & IoT Testing | Hardware integration | TASK-TESTING-006 |
| E2E Integration Testing | Complete business workflows | TASK-TESTING-007 |
| Security Testing | Auth, RBAC, input validation | TASK-TESTING-008 |
| Performance Testing | Response times, reliability | TASK-TESTING-009 |
| UAT | User acceptance by barangay | TASK-TESTING-010 |

---

## 5. Test Environment

### 5.1 Hardware

| Device | Purpose |
|--------|---------|
| Development PC | Backend + database server |
| Arduino Uno | Hardware controller |
| MFRC522 RFID Reader | Resident authentication |
| USB Webcam | Photo capture |
| USB Printer | Queue slip printing |
| Touchscreen Display | Kiosk interface |

### 5.2 Software

| Software | Version |
|----------|---------|
| Node.js | LTS |
| Express.js | 4.x |
| Angular | 22 |
| MySQL | 8.x |
| Google Chrome | Latest |
| Microsoft Edge | Latest |

### 5.3 Database

- **Database:** `ims_iot_document_kiosk`
- **MySQL Path:** `C:\Users\andre\OneDrive\Documents\XAMPP\mysql\bin\mysql.exe`
- **Credentials:** root / (no password) via XAMPP

---

## 6. Entry Criteria

Testing begins when:

- [x] Development phase is completed
- [x] Database is operational with seed data
- [x] Backend APIs are available on port 3000
- [x] Frontend builds and runs on port 4200
- [x] Kiosk WebSocket server runs on port 3001

---

## 7. Exit Criteria

Testing is considered complete when:

- [ ] >=95% of planned test cases pass
- [ ] No critical defects remain unresolved
- [ ] All core workflows function correctly
- [ ] Security controls are verified
- [ ] Performance targets are met
- [ ] UAT is approved by barangay representatives

---

## 8. Defect Management

### Severity Levels

| Level | Description | Example |
|-------|-------------|---------|
| Critical | System cannot operate | Backend crashes on login |
| High | Major feature unavailable | Cannot submit requests |
| Medium | Feature works with minor issues | Search is slow |
| Low | Cosmetic or usability issue | Button alignment |

### Workflow

```
Defect Found → Record → Assign Priority → Fix → Retest → Close
```

---

## 9. Test Deliverables

| Deliverable | Location |
|-------------|----------|
| Master Test Plan | `docs/testing/test-plan.md` |
| Unit Test Cases | `docs/testing/test-cases/unit/` |
| Database Test Cases | `docs/testing/test-cases/database/` |
| Backend API Test Cases | `docs/testing/test-cases/backend/` |
| Frontend UI Test Cases | `docs/testing/test-cases/frontend/` |
| Hardware Test Cases | `docs/testing/test-cases/hardware/` |
| Integration Test Cases | `docs/testing/test-cases/integration/` |
| Security Test Cases | `docs/testing/test-cases/security/` |
| Performance Test Cases | `docs/testing/test-cases/performance/` |
| UAT Plan | `docs/testing/test-cases/uat/` |
| Test Execution Reports | `docs/testing/reports/` |

---

## 10. Success Metrics

| Metric | Target |
|--------|--------|
| Test case pass rate | >=95% |
| Critical defects | 0 remaining |
| Core workflows | 100% functional |
| Security controls | All verified |
| UAT approval | Obtained |

---

## 11. Test Schedule

| Phase | Duration | Status |
|-------|----------|--------|
| Unit Testing | 1 day | Not Started |
| Database Testing | 1 day | Not Started |
| Backend API Testing | 1 day | Not Started |
| Frontend UI Testing | 1 day | Not Started |
| Kiosk/IoT Testing | 1 day | Not Started |
| E2E Integration | 1 day | Not Started |
| Security Testing | 1 day | Not Started |
| Performance Testing | 1 day | Not Started |
| UAT | 1 day | Not Started |

---

## 12. Risks

| Risk | Mitigation |
|------|------------|
| Hardware communication failures | Use simulation panel for software testing |
| Incomplete test data | Seed database with representative data |
| Limited availability of barangay participants | Schedule UAT in advance |
| Device compatibility issues | Test on Chrome and Edge |

---

*Document created: July 31, 2026*
