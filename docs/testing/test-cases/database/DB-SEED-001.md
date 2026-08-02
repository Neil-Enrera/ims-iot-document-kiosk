# Database Test Cases — Seed Data

> **Module:** Seed Data Validation
> **Type:** Database Testing

---

| Test ID | Table | Operation | Preconditions | SQL/Action | Expected Result | Status |
|---------|-------|-----------|---------------|------------|-----------------|--------|
| DB-SEED-001 | user_roles | Verify seed | DB initialized | `SELECT * FROM user_roles` | 3 roles: Admin, Secretary, Treasurer | |
| DB-SEED-002 | request_statuses | Verify seed | DB initialized | `SELECT * FROM request_statuses` | 5 statuses: Pending, Under Review, Approved, Rejected, Released | |
| DB-SEED-003 | services | Verify seed | DB initialized | `SELECT * FROM services` | Services: Barangay Clearance, Certificate of Residency, etc. | |
| DB-SEED-004 | users | Verify admin | DB initialized | `SELECT * FROM users WHERE username='admin'` | Admin user exists | |
| DB-SEED-005 | residents | Verify test data | Seeds loaded | `SELECT * FROM residents` | Test residents: Juan Dela Cruz, Maria Santos | |
| DB-SEED-006 | rfid_cards | Verify test cards | Seeds loaded | `SELECT * FROM rfid_cards` | TEST001 → Juan, TEST002 → Maria | |
| DB-SEED-007 | barangay_info | Verify seed | DB initialized | `SELECT * FROM barangay_info` | Barangay San Manuel info present | |

---

*Module: Seed Data | Total: 7 test cases*
