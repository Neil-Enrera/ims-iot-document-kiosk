# Database Test Cases — Foreign Key Constraints

> **Module:** Foreign Key Constraints
> **Type:** Database Testing

---

| Test ID | Table | Operation | Preconditions | SQL/Action | Expected Result | Status |
|---------|-------|-----------|---------------|------------|-----------------|--------|
| DB-FK-001 | users → user_roles | FK enforced | Role ID 99 doesn't exist | `INSERT INTO users (role_id) VALUES (99)` | FK constraint violation | |
| DB-FK-002 | residents → requests | FK enforced | Resident has requests | `DELETE FROM residents WHERE resident_id=1` | FK constraint violation (or cascade) | |
| DB-FK-003 | rfid_cards → residents | FK enforced | Resident exists | `INSERT INTO rfid_cards (resident_id) VALUES (1)` | Row inserted | |
| DB-FK-004 | rfid_cards → residents | FK enforced | Resident ID 999 doesn't exist | `INSERT INTO rfid_cards (resident_id) VALUES (999)` | FK constraint violation | |
| DB-FK-005 | requests → services | FK enforced | Service exists | `INSERT INTO requests (service_id) VALUES (1)` | Row inserted | |
| DB-FK-006 | requests → request_statuses | FK enforced | Status exists | `INSERT INTO requests (status_id) VALUES (1)` | Row inserted | |
| DB-FK-007 | audit_logs → users | FK enforced | User exists | `INSERT INTO audit_logs (user_id) VALUES (1)` | Row inserted | |

---

*Module: Foreign Key Constraints | Total: 7 test cases*
