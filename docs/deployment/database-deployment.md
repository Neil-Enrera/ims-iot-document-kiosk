# Database Deployment Guide

> **Task:** TASK-DEPLOYMENT-003
> **Date:** July 31, 2026

---

## 1. Database Creation

```sql
CREATE DATABASE ims_iot_document_kiosk
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

---

## 2. Schema Import

```bash
mysql -u root ims_iot_document_kiosk < schema.sql
```

### Expected Tables

| Table | Purpose |
|-------|---------|
| user_roles | Role definitions |
| users | Staff accounts |
| residents | Resident records |
| rfid_cards | RFID card assignments |
| services | Available services |
| request_statuses | Status definitions |
| requests | Document requests |
| audit_logs | System audit trail |
| notifications | User notifications |
| system_settings | Configuration |
| barangay_info | Barangay details |
| request_status_history | Status change history |
| kiosk_sessions | Kiosk session tracking |

---

## 3. Seed Data Import

```bash
mysql -u root ims_iot_document_kiosk < seed.sql
```

### Expected Seed Data

- **user_roles:** Administrator, Secretary, Treasurer
- **request_statuses:** Pending, Under Review, Approved, Rejected, Released
- **services:** Barangay Clearance, Certificate of Residency, Certificate of Indigency, Barangay ID
- **users:** admin (admin123)
- **residents:** Juan Dela Cruz, Maria Santos (test data)
- **rfid_cards:** TEST001 → Juan, TEST002 → Maria

---

## 4. Verification

```sql
-- Check tables
SHOW TABLES;

-- Check roles
SELECT * FROM user_roles;

-- Check statuses
SELECT * FROM request_statuses;

-- Check services
SELECT * FROM services;

-- Check admin user
SELECT * FROM users WHERE username = 'admin';

-- Check test residents
SELECT * FROM residents;

-- Check test RFID cards
SELECT * FROM rfid_cards;
```

---

## 5. Connection Verification

Start backend and verify:
```
GET /api/health
```

Expected response:
```json
{
  "status": "OK",
  "database": "Connected"
}
```

---

## 6. Validation Checklist

- [ ] Database created
- [ ] Schema imported successfully
- [ ] Seed data imported
- [ ] All tables exist
- [ ] Foreign keys working
- [ ] Admin user available
- [ ] Test data present
- [ ] Backend connects successfully

---

*Document created: July 31, 2026*
