# Backend API Test Cases — Audit Logs & Settings

> **Module:** Audit Logs & System Settings API
> **Type:** API Testing

---

| Test ID | Endpoint | Method | Auth Required | Request Body | Expected Response | Status |
|---------|----------|--------|---------------|--------------|-------------------|--------|
| API-AUDIT-001 | `/api/v1/audit-logs` | GET | Yes | - | 200, array of logs | |
| API-AUDIT-002 | `/api/v1/audit-logs?action=login` | GET | Yes | - | 200, filtered logs | |
| API-AUDIT-003 | `/api/v1/settings` | GET | Yes | - | 200, settings array | |
| API-AUDIT-004 | `/api/v1/settings/system_name` | GET | Yes | - | 200, setting object | |
| API-AUDIT-005 | `/api/v1/settings` | PUT | Yes | `{ key, value }` | 200, setting updated | |

---

*Module: Audit Logs & Settings | Total: 5 test cases*
