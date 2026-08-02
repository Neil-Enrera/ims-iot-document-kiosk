# Database Test Cases — Table Structure

> **Module:** Table Structure
> **Type:** Database Testing

---

| Test ID | Table | Operation | Preconditions | SQL/Action | Expected Result | Status |
|---------|-------|-----------|---------------|------------|-----------------|--------|
| DB-TABLE-001 | All | Table exists | Database created | `SHOW TABLES` | All 13 tables present | |
| DB-TABLE-002 | user_roles | Structure | DB initialized | `DESCRIBE user_roles` | `role_id`, `role_name` columns | |
| DB-TABLE-003 | users | Structure | DB initialized | `DESCRIBE users` | `user_id`, `username`, `password_hash`, `role_id` columns | |
| DB-TABLE-004 | residents | Structure | DB initialized | `DESCRIBE residents` | `resident_id`, `resident_code`, `first_name`, `last_name` columns | |
| DB-TABLE-005 | rfid_cards | Structure | DB initialized | `DESCRIBE rfid_cards` | `card_id`, `resident_id`, `uid`, `status` columns | |
| DB-TABLE-006 | services | Structure | DB initialized | `DESCRIBE services` | `service_id`, `service_name`, `description`, `is_active` columns | |
| DB-TABLE-007 | request_statuses | Structure | DB initialized | `DESCRIBE request_statuses` | `status_id`, `status_name` columns | |
| DB-TABLE-008 | requests | Structure | DB initialized | `DESCRIBE requests` | `request_id`, `resident_id`, `service_id`, `status_id` columns | |
| DB-TABLE-009 | audit_logs | Structure | DB initialized | `DESCRIBE audit_logs` | `log_id`, `user_id`, `action`, `created_at` columns | |
| DB-TABLE-010 | notifications | Structure | DB initialized | `DESCRIBE notifications` | `notification_id`, `user_id`, `message` columns | |

---

*Module: Table Structure | Total: 10 test cases*
