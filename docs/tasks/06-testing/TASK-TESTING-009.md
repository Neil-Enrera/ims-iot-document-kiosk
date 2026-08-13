# TASK-TESTING-009 — Performance & Reliability Testing

> **Phase:** Testing
> **Task ID:** TASK-TESTING-009
> **Priority:** P1 (High)
> **Status:** DONE

---

# Objective

Evaluate the performance, responsiveness, stability, and reliability of the Information Management System with IoT-Assisted Document Request Services Kiosk under normal operating conditions.

This testing ensures the system remains responsive, reliable, and capable of supporting daily barangay operations.

---

# Background

The system will be used by:

- Barangay Staff
- Residents using the Kiosk

Although the expected number of concurrent users is relatively small, the system must maintain acceptable performance and recover gracefully from common failures.

This task focuses on realistic operational scenarios rather than enterprise-scale stress testing.

---

# Scope

## Included

Application Performance

API Response Time

Database Query Performance

Kiosk Responsiveness

System Reliability

Recovery Testing

Long-duration Operation

Resource Usage Monitoring

---

## Not Included

- Penetration Testing
- Large-scale Load Testing
- Distributed System Testing
- Cloud Infrastructure Benchmarking

---

# Performance Areas

## Application Startup

Verify

- Angular application loads successfully
- Dashboard loads correctly
- Kiosk starts in idle mode

Target

```
Application Startup

≤ 5 seconds
```

---

## Login Performance

Verify

Staff Login

Resident RFID Authentication

Target

```
Authentication

≤ 3 seconds
```

---

## Dashboard Performance

Verify

- Statistics loading
- Charts
- Recent requests
- Navigation

Target

```
Dashboard Load

≤ 3 seconds
```

---

## Resident Search

Verify

- Search by Name
- Search by RFID
- Filtering

Target

```
Search Results

≤ 2 seconds
```

---

## Request Submission

Verify

Resident submits request

↓

Database updated

↓

Audit log created

↓

Success screen displayed

Target

```
Complete Submission

≤ 5 seconds
```

---

## Report Generation

Verify

- Daily Reports
- Request Reports
- Payment Reports

Target

```
Generate Report

≤ 10 seconds
```

---

## File Upload

Verify

Resident Photo Upload

Target

```
Upload Complete

≤ 5 seconds
```

---

# Reliability Testing

## Continuous Operation

Run the system continuously.

Verify

- Memory stability
- CPU stability
- No unexpected crashes
- No application freeze

Suggested observation period

```
4–8 hours
```

---

## Database Reliability

Verify

- Stable database connection
- No data corruption
- Successful transactions
- Proper rollback on failures

---

## Hardware Reliability

Verify

ESP8266

- Stable serial communication

RFID Reader

- Consecutive scans

Webcam

- Repeated image capture

Printer

- Multiple queue slip prints

---

## Recovery Testing

Verify system recovery after

- Backend restart
- Database restart
- ESP8266 reconnection
- Camera reconnection
- Printer reconnection
- Browser refresh

The system should recover without requiring manual database intervention.

---

# Performance Testing Workflow

```
Start System

↓

Execute Operation

↓

Measure Response Time

↓

Record Result

↓

Acceptable?

↓

YES

↓

Continue Testing

↓

NO

↓

Identify Bottleneck

↓

Optimize

↓

Retest
```

---

# Metrics

Measure

Application

- Startup Time
- Response Time

Backend

- API Response Time

Database

- Query Execution Time

Kiosk

- RFID Recognition Time
- Camera Capture Time
- Queue Slip Print Time

System

- CPU Usage
- Memory Usage

---

# Testing Environment

Hardware

```
ESP8266 (RFID controller)

MFRC522 RFID Reader

USB Webcam

USB Printer

Touchscreen Monitor
```

Software

```
Angular

Node.js

Express.js

MySQL
```

Operating System

```
Windows 11
```

---

# Folder Structure

```
testing/

performance/

response-time/

reliability/

recovery/

hardware/

reports/

logs/
```

Documentation

```
docs/

testing/

performance/

test-cases/

reports/
```

---

# Test Case Format

Each performance test should include

```
Test ID

Feature

Scenario

Expected Time

Actual Time

Result

Remarks
```

---

# Naming Convention

```
PERF-APP-001

PERF-API-001

PERF-DB-001

PERF-RFID-001

PERF-PRINT-001
```

---

# Logging

Record

- Test ID
- Component
- Response Time
- CPU Usage
- Memory Usage
- Result
- Tester
- Date

---

# Testing Checklist

Application

- [ ] Startup
- [ ] Login
- [ ] Dashboard

Residents

- [ ] Search
- [ ] Request Submission

Reports

- [ ] Generate Reports

Database

- [ ] Transactions
- [ ] Queries

Hardware

- [ ] RFID
- [ ] Webcam
- [ ] Printer

Recovery

- [ ] Backend Restart
- [ ] Database Restart
- [ ] Hardware Reconnection

Reliability

- [ ] Continuous Operation
- [ ] No Memory Leaks
- [ ] Stable Performance

---

# Acceptance Criteria

- System responds within defined targets.
- No unexpected crashes occur during testing.
- Hardware communication remains stable.
- Database transactions remain consistent.
- Recovery procedures restore normal operation.
- No critical performance issues remain.

---

# Definition of Done

- Performance testing completed.
- Reliability testing completed.
- Response time metrics documented.
- System ready for User Acceptance Testing.

---

# Estimated Effort

6–8 hours

---

# Next Task

**TASK-TESTING-010 — User Acceptance Testing (UAT)**

---

# Notes for OpenCode

Before implementing:

1. Measure response times under realistic usage rather than artificial stress conditions to reflect actual barangay operations.
2. Use browser developer tools and Node.js monitoring tools to identify slow operations or excessive resource usage.
3. Test recovery scenarios by intentionally restarting services and reconnecting hardware to verify graceful recovery.
4. Record baseline performance metrics so future improvements can be compared objectively.
5. If any response time exceeds the target, identify whether the bottleneck is in the frontend, backend, database, or hardware before optimizing.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| 2026-07-31 | OpenCode | Task Completed |