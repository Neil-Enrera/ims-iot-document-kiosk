# Unit Test Cases — Kiosk

> **Module:** Kiosk
> **Type:** Unit Testing

---

| Test ID | Function | Preconditions | Input | Expected Output | Status |
|---------|----------|---------------|-------|-----------------|--------|
| UT-KIOSK-001 | Search residents by name | Residents exist | `GET /kiosk/search?query=Juan` | Filtered resident list, status 200 | |
| UT-KIOSK-002 | Search with empty query | None | `GET /kiosk/search?query=` | Empty results or error, status 200/400 | |
| UT-KIOSK-003 | Get resident by code | Resident BRGY-0001 exists | `GET /kiosk/resident/BRGY-0001` | Resident object, status 200 | |
| UT-KIOSK-004 | Get active services | Active services exist | `GET /kiosk/services` | Only active services, status 200 | |
| UT-KIOSK-005 | Create kiosk request | Resident + service exist | Valid kiosk request | Request created, status 201 | |
| UT-KIOSK-006 | Get hardware status | None | `GET /kiosk/hardware-status` | Status object with RFID, camera, printer | |
| UT-KIOSK-007 | Kiosk request skips audit log | Kiosk mode | Create request via kiosk | No audit log entry (no user_id) | |
| UT-KIOSK-008 | Kiosk request without auth | No JWT token | POST /kiosk/request | Request created (public endpoint), status 201 | |

---

*Module: Kiosk | Total: 8 test cases*
