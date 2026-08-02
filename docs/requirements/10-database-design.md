# 10 - Database Design

**Project:** Information Management System with IoT-Assisted Document Request Services Kiosk for Barangay San Manuel

**Version:** 1.0

**Document Status:** Draft

**Last Updated:** July 2026

---

# 1. Purpose

This document defines the logical database design for the Information Management System (IMS). It identifies the database entities, relationships, constraints, and data dictionary that support the business processes of the Barangay Document Request Services Kiosk.

The database is designed using a relational model implemented in MySQL and follows normalization principles to reduce redundancy and maintain data integrity.

---

# 2. Database Management System

| Item | Value |
|------|-------|
| Database | MySQL |
| Version | MySQL 8.x |
| Storage Engine | InnoDB |
| Character Set | UTF-8 |
| Collation | utf8mb4_unicode_ci |

---

# 3. Database Design Principles

The database is designed to:

- Minimize data redundancy
- Maintain referential integrity
- Support future scalability
- Ensure efficient querying
- Maintain auditability
- Support role-based access

---

# 4. Entity Overview

The system consists of the following major entities:

- Residents
- RFID Cards
- Users
- Roles
- Services
- Requests
- Request Status
- Payments
- Releases
- Audit Logs

---

# 5. Entity Relationship Diagram (ERD)

> **Note:** The complete ERD diagram is maintained separately and should be inserted here after final review.

```text
Residents
    │
    ├──────────────┐
    │              │
RFID Cards     Requests
                    │
                    ├──────────────┐
                    │              │
                Services      Request Status
                    │
                    │
               Payments
                    │
                    │
               Releases

Users
   │
Roles

Users
   │
Audit Logs
```

---

# 6. Entity Descriptions

## 6.1 Residents

Stores resident information.

Primary Key

- resident_id

Relationships

- One resident owns one RFID card.
- One resident may have many document requests.

---

## 6.2 RFID Cards

Stores RFID card information assigned to residents.

Primary Key

- rfid_id

Relationship

- Belongs to one resident.

---

## 6.3 Users

Stores employee accounts.

Examples

- Administrator
- Secretary
- Treasurer
- Barangay Captain
- Kagawad

---

## 6.4 Roles

Stores user role definitions.

Examples

- Administrator
- Secretary
- Treasurer
- Captain
- Kagawad

---

## 6.5 Services

Stores available barangay services.

Examples

- Barangay Clearance
- Certificate of Residency
- Certificate of Indigency
- Business Clearance
- Barangay ID

---

## 6.6 Requests

Stores document requests submitted by residents.

A request belongs to:

- one resident
- one service

---

## 6.7 Request Status

Defines the workflow status.

Possible values

- Submitted
- Under Review
- Approved
- For Payment
- Ready for Release
- Released
- Completed
- Rejected

---

## 6.8 Payments

Stores payment records.

Payment is recorded after approval.

---

## 6.9 Releases

Stores document release information.

---

## 6.10 Audit Logs

Stores system activity logs.

Examples

- Login
- Resident Registration
- Request Approval
- Payment Recording
- Document Release

---

# 7. Relationships

| Parent | Child | Relationship |
|----------|--------|--------------|
| Residents | RFID Cards | One-to-One |
| Residents | Requests | One-to-Many |
| Services | Requests | One-to-Many |
| Requests | Payments | One-to-One |
| Requests | Releases | One-to-One |
| Roles | Users | One-to-Many |
| Users | Audit Logs | One-to-Many |

---

# 8. Normalization

The database follows Third Normal Form (3NF).

The design ensures:

- Elimination of duplicate data
- Functional dependency
- Referential integrity

---

# 9. Indexing Strategy

Indexes will be created on frequently queried columns.

Examples:

- resident_id
- rfid_uid
- request_id
- status_id
- service_id
- user_id

---

# 10. Constraints

Primary Keys

- Auto Increment Integer

Foreign Keys

- Enforced using InnoDB

Unique Constraints

- RFID UID
- Username

Not Null

Applied to all required fields.

---

# 11. Data Integrity Rules

The system enforces:

- Valid foreign key references
- Unique RFID assignments
- One active RFID per resident
- One payment record per request
- One release record per completed request

---

# 12. Backup Strategy

Recommended:

- Daily database backup
- Weekly full backup
- Monthly archive backup

---

# 13. Future Database Expansion

The schema supports future modules such as:

- SMS Notifications
- Email Notifications
- QR Verification
- Online Payments
- Mobile Application
- Multi-Barangay Deployment

---

# 14. Database Naming Convention

Tables

- snake_case

Example

resident_requests

Primary Keys

- entity_id

Example

resident_id

Foreign Keys

- referenced_entity_id

Example

resident_id

---

# 15. Database Security

The database will implement:

- Password hashing
- Principle of least privilege
- Prepared statements
- Input validation
- Backup encryption
- Audit logging

---

# 16. Document Status

| Item | Status |
|------|--------|
| Document | Database Design |
| Version | 1.0 |
| Status | Draft |
| Next Document | 11-hardware-integration.md |

# Entity Relationship Diagram (ERD)

```text
                                        +------------------+
                                        |      Roles       |
                                        +------------------+
                                        | PK role_id       |
                                        | role_name        |
                                        | description      |
                                        +------------------+
                                                 |
                                              1  |
                                                 |
                                                 |  N
                                        +------------------+
                                        |      Users       |
                                        +------------------+
                                        | PK user_id       |
                                        | FK role_id       |
                                        | first_name       |
                                        | last_name        |
                                        | username         |
                                        | password_hash    |
                                        | email            |
                                        | contact_number   |
                                        | status           |
                                        | created_at       |
                                        | updated_at       |
                                        +------------------+
                                                 |
                                                 | 1
                                                 |
                                                 | N
                                        +------------------+
                                        |    Audit Logs    |
                                        +------------------+
                                        | PK audit_id      |
                                        | FK user_id       |
                                        | action           |
                                        | module           |
                                        | description      |
                                        | ip_address       |
                                        | created_at       |
                                        +------------------+


+------------------+             +----------------------+
|    Residents     |1----------1 |     RFID Cards       |
+------------------+             +----------------------+
| PK resident_id   |             | PK rfid_id           |
| resident_code    |             | FK resident_id       |
| first_name       |             | rfid_uid (Unique)    |
| middle_name      |             | issue_date           |
| last_name        |             | expiry_date          |
| suffix           |             | status               |
| birth_date       |             +----------------------+
| gender           |
| civil_status     |
| address          |
| contact_number   |
| email            |
| photo            |
| status           |
| created_at       |
| updated_at       |
+------------------+
          |
          |1
          |
          |N
+-----------------------+
|       Requests        |
+-----------------------+
| PK request_id         |
| FK resident_id        |
| FK service_id         |
| FK status_id          |
| purpose               |
| remarks               |
| request_date          |
| approved_date         |
| completed_date        |
| created_at            |
| updated_at            |
+-----------------------+
      |          |
      |          |
      |          |
      |          |
      |          |
      |          |
      |          |
      |          |
      |          |
      |          |
      |          |
      |          |
      |          |
      |          |
      |          |
      |          |
      |          |
      |          |
      |          |
      |          |
      |          |
      |          |
      |          |
      ▼          ▼

+------------------+       +-----------------------+
|     Services     |       |   Request Status      |
+------------------+       +-----------------------+
| PK service_id    |       | PK status_id          |
| service_name     |       | status_name           |
| description      |       | description           |
| fee              |       +-----------------------+
| processing_time  |
| is_active        |
+------------------+

          |
          |1
          |
          |1
+-----------------------+
|      Payments         |
+-----------------------+
| PK payment_id         |
| FK request_id         |
| amount                |
| payment_method        |
| official_receipt_no   |
| payment_date          |
| recorded_by           |
| created_at            |
+-----------------------+
          |
          |1
          |
          |1
+-----------------------+
|      Releases         |
+-----------------------+
| PK release_id         |
| FK request_id         |
| released_by           |
| release_date          |
| receiver_name         |
| remarks               |
| created_at            |
+-----------------------+
```

---

# Cardinality Summary

| Parent | Child | Relationship |
|----------|--------|--------------|
| Roles | Users | 1 : N |
| Users | Audit Logs | 1 : N |
| Residents | RFID Cards | 1 : 1 |
| Residents | Requests | 1 : N |
| Services | Requests | 1 : N |
| Request Status | Requests | 1 : N |
| Requests | Payments | 1 : 1 |
| Requests | Releases | 1 : 1 |