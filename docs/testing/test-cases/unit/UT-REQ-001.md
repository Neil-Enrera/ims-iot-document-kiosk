# Unit Test Cases — Request Management

> **Module:** Request Management
> **Type:** Unit Testing

---

| Test ID | Function | Preconditions | Input | Expected Output | Status |
|---------|----------|---------------|-------|-----------------|--------|
| UT-REQ-001 | Create request with valid data | Resident and service exist | Valid request object | Request created, control number generated, status 201 | |
| UT-REQ-002 | Create request with missing resident | Resident doesn't exist | Invalid resident_id | Error, status 400 | |
| UT-REQ-003 | Get all requests | Requests exist | `GET /requests` | Array of requests, status 200 | |
| UT-REQ-004 | Get request by ID | Request ID 1 exists | `GET /requests/1` | Request object with relations, status 200 | |
| UT-REQ-005 | Update request status | Request ID 1 exists | Status update to `approved` | Status updated, status 200 | |
| UT-REQ-006 | Reject request | Request ID 1 exists | Status update to `rejected` | Status updated, status 200 | |
| UT-REQ-007 | Release request | Request approved | Status update to `released` | Status updated, status 200 | |
| UT-REQ-008 | Generate control number | Creating request | Auto-generated | Unique control number like `BRGY-2026-0001` | |
| UT-REQ-009 | Filter requests by status | Requests with different statuses | `GET /requests?status=pending` | Filtered results | |
| UT-REQ-010 | Filter requests by date range | Requests exist | `GET /requests?from=2026-01-01&to=2026-12-31` | Filtered results | |

---

*Module: Request Management | Total: 10 test cases*
