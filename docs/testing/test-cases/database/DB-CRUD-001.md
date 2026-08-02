# Database Test Cases — CRUD Operations

> **Module:** CRUD Operations
> **Type:** Database Testing

---

| Test ID | Table | Operation | Preconditions | SQL/Action | Expected Result | Status |
|---------|-------|-----------|---------------|------------|-----------------|--------|
| DB-CRUD-001 | residents | Create | None | `INSERT INTO residents (first_name, last_name, ...) VALUES (...)` | Row inserted | |
| DB-CRUD-002 | residents | Read | Row exists | `SELECT * FROM residents WHERE resident_id=1` | Row returned | |
| DB-CRUD-003 | residents | Update | Row exists | `UPDATE residents SET first_name='Juan' WHERE resident_id=1` | Row updated | |
| DB-CRUD-004 | residents | Delete | Row exists | `DELETE FROM residents WHERE resident_id=1` | Row deleted | |
| DB-CRUD-005 | users | Create | Role exists | `INSERT INTO users (...)` | Row inserted | |
| DB-CRUD-006 | services | Create | None | `INSERT INTO services (...)` | Row inserted | |
| DB-CRUD-007 | requests | Create | Resident + service exist | `INSERT INTO requests (...)` | Row inserted | |
| DB-CRUD-008 | rfid_cards | Create | Resident exists | `INSERT INTO rfid_cards (...)` | Row inserted | |
| DB-CRUD-009 | audit_logs | Create | None | `INSERT INTO audit_logs (...)` | Row inserted | |
| DB-CRUD-010 | notifications | Create | User exists | `INSERT INTO notifications (...)` | Row inserted | |

---

*Module: CRUD Operations | Total: 10 test cases*
