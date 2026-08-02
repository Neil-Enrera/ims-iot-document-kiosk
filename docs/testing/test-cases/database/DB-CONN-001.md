# Database Test Cases — Connection

> **Module:** Database Connection
> **Type:** Database Testing

---

| Test ID | Table | Operation | Preconditions | SQL/Action | Expected Result | Status |
|---------|-------|-----------|---------------|------------|-----------------|--------|
| DB-CONN-001 | Database | Connection | MySQL running | `SELECT 1` | Returns 1 | |
| DB-CONN-002 | Database | Authentication | Valid credentials | Connect as `root` | Connected successfully | |
| DB-CONN-003 | Database | Character set | Database exists | `SHOW VARIABLES LIKE 'character_set_database'` | `utf8mb4` | |
| DB-CONN-004 | Database | Collation | Database exists | `SHOW VARIABLES LIKE 'collation_database'` | `utf8mb4_unicode_ci` | |
| DB-CONN-005 | Database | Connection pool | Backend configured | Start backend | Pool connects successfully | |

---

*Module: Database Connection | Total: 5 test cases*
