# 04 — Product Requirements Document (PRD)

# Information Management System with IoT-Assisted Document Request Services Kiosk for Barangay San Manuel

**Project Type:** Capstone Project  
**Client:** Barangay San Manuel  
**Frontend Framework:** Angular  
**System Type:** Self-Service Document Request Kiosk + Barangay Staff Management System  
**PRD Version:** 2.0  
**Status:** Draft — Requirements Refinement

---

# 1. Document Purpose

This Product Requirements Document (PRD) defines the expected behavior, workflows, business rules, functional requirements, quality requirements, and acceptance criteria of the system.

This document translates the project's:

- Project Overview
- Project Requirements
- MVP
- Barangay Captain Interview
- Confirmed Barangay Workflow

into a development-ready product specification.

The PRD is intended to be used as a reference during:

- System architecture
- Database design
- API design
- Angular development
- Hardware integration
- Task breakdown
- Unit testing
- Integration testing
- End-to-end testing
- Build verification
- Client acceptance testing

---

# 2. Project Identity

## 2.1 Original Project Title

> **Information Management System with IoT-Assisted Document Request Services Kiosk for Barangay San Manuel**

---

## 2.2 System Name

For development purposes, the system may be referred to as:

> **SERVE+**

The official academic/project title remains:

> **Information Management System with IoT-Assisted Document Request Services Kiosk for Barangay San Manuel**

---

# 3. Product Vision

The system will provide Barangay San Manuel with a self-service kiosk that allows residents to initiate document requests digitally.

The kiosk will use an RFID-enabled Barangay ID to identify registered residents and retrieve their existing information.

Instead of repeatedly writing information on a manual information sheet, the resident can use the kiosk to:

```text
RFID Identification
        ↓
Resident Information
        ↓
Select Service
        ↓
Provide Required Information
        ↓
Review Request
        ↓
Submit Request