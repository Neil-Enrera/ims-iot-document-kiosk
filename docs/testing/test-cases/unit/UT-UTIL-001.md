# Unit Test Cases — Utilities

> **Module:** Utilities
> **Type:** Unit Testing

---

| Test ID | Function | Preconditions | Input | Expected Output | Status |
|---------|----------|---------------|-------|-----------------|--------|
| UT-UTIL-001 | API success response | None | `success(res, data, message)` | `{ success: true, data, message }` | |
| UT-UTIL-002 | API error response | None | `error(res, message, statusCode)` | `{ success: false, message }` with correct status | |
| UT-UTIL-003 | Paginated response | None | `paginatedResponse(res, data, total, page, limit)` | Response with `pagination` object | |
| UT-UTIL-004 | Generate control number | None | `generateControlNumber()` | Format: `BRGY-YYYY-NNNN` | |
| UT-UTIL-005 | Generate resident code | None | `generateResidentCode()` | Format: `BRGY-NNNN` | |

---

*Module: Utilities | Total: 5 test cases*
