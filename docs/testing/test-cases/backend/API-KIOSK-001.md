# Backend API Test Cases — Kiosk

> **Module:** Kiosk API
> **Type:** API Testing

---

| Test ID | Endpoint | Method | Auth Required | Request Body | Expected Response | Status |
|---------|----------|--------|---------------|--------------|-------------------|--------|
| API-KIOSK-001 | `/api/v1/kiosk/search?query=Juan` | GET | No | - | 200, filtered residents | |
| API-KIOSK-002 | `/api/v1/kiosk/search?query=` | GET | No | - | 200, empty or all | |
| API-KIOSK-003 | `/api/v1/kiosk/resident/BRGY-0001` | GET | No | - | 200, resident object | |
| API-KIOSK-004 | `/api/v1/kiosk/resident/UNKNOWN` | GET | No | - | 404, not found | |
| API-KIOSK-005 | `/api/v1/kiosk/services` | GET | No | - | 200, active services only | |
| API-KIOSK-006 | `/api/v1/kiosk/request` | POST | No | `{ resident_id, service_id }` | 201, request created | |
| API-KIOSK-007 | `/api/v1/kiosk/request` | POST | No | `{}` | 400, validation error | |
| API-KIOSK-008 | `/api/v1/kiosk/hardware-status` | GET | No | - | 200, hardware status object | |

---

*Module: Kiosk API | Total: 8 test cases*
