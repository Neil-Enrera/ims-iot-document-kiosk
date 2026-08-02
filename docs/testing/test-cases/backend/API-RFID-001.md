# Backend API Test Cases — RFID

> **Module:** RFID API
> **Type:** API Testing

---

| Test ID | Endpoint | Method | Auth Required | Request Body | Expected Response | Status |
|---------|----------|--------|---------------|--------------|-------------------|--------|
| API-RFID-001 | `/api/v1/rfid/scan` | POST | No | `{ "uid": "TEST001" }` | 200, resident found | |
| API-RFID-002 | `/api/v1/rfid/scan` | POST | No | `{ "uid": "UNKNOWN" }` | 404, no resident | |
| API-RFID-003 | `/api/v1/rfid/scan` | POST | No | `{}` | 400, validation error | |
| API-RFID-004 | `/api/v1/rfid/register` | POST | Yes | `{ resident_id, uid }` | 201, card registered | |
| API-RFID-005 | `/api/v1/rfid/register` | POST | Yes | `{ resident_id: 1, uid: "TEST001" }` | 409, duplicate UID | |
| API-RFID-006 | `/api/v1/rfid/cards` | GET | Yes | - | 200, array of cards | |

---

*Module: RFID API | Total: 6 test cases*
