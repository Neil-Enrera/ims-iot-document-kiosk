# Unit Test Cases — Resident Management

> **Module:** Resident Management
> **Type:** Unit Testing

---

| Test ID | Function | Preconditions | Input | Expected Output | Status |
|---------|----------|---------------|-------|-----------------|--------|
| UT-RES-001 | Create resident with valid data | None | Valid resident object | Resident created, auto-generated code, status 201 | |
| UT-RES-002 | Create resident with missing fields | None | `{ first_name: "Juan" }` | Validation error, status 400 | |
| UT-RES-003 | Get all residents | Residents exist | `GET /residents` | Array of residents, status 200 | |
| UT-RES-004 | Get resident by ID | Resident ID 1 exists | `GET /residents/1` | Resident object, status 200 | |
| UT-RES-005 | Search residents by name | Residents exist | `GET /residents?search=Juan` | Filtered results, status 200 | |
| UT-RES-006 | Update resident | Resident ID 1 exists | Valid update data | Resident updated, status 200 | |
| UT-RES-007 | Archive resident | Resident ID 1 exists | `PUT /residents/1/archive` | Resident archived, status 200 | |
| UT-RES-008 | Restore archived resident | Resident archived | `PUT /residents/1/restore` | Resident restored, status 200 | |
| UT-RES-009 | Auto-generate resident code | Creating resident | No code provided | Code like `BRGY-0001` generated | |
| UT-RES-010 | Get resident by RFID UID | RFID card assigned | `GET /kiosk/resident/uid/TEST001` | Resident found, status 200 | |

---

*Module: Resident Management | Total: 10 test cases*
