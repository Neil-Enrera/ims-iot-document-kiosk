# Phase 02 — Database

## Overview

This phase establishes the database foundation for the Information Management System with IoT-Assisted Document Request Services Kiosk.

Unlike the previous planning and design activities, the database schema has already been finalized and approved prior to implementation.

The purpose of this phase is to serve as the reference for the data layer used by the backend, frontend, and kiosk modules.

---

## Objectives

- Implement the approved database schema.
- Maintain referential integrity.
- Support all business workflows.
- Prepare the database for backend development.

---

## Database Artifacts

- schema.sql
- seed.sql
- ERD
- Data Dictionary

---

## Core Business Domains

- Resident Management
- Request Management
- Service Management
- User Management
- Audit Logging

---

## Supporting Domains

- RFID
- Attachments
- Status History
- Barangay Information

---

## Implementation Notes

The database schema has already been reviewed and validated.

Future changes should be made through versioned migrations instead of modifying the original schema directly.

---

## Next Phase

Proceed to:

03-backend