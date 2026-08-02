# Backend API Test Cases — Notifications

> **Module:** Notification API
> **Type:** API Testing

---

| Test ID | Endpoint | Method | Auth Required | Request Body | Expected Response | Status |
|---------|----------|--------|---------------|--------------|-------------------|--------|
| API-NOTIF-001 | `/api/v1/notifications` | GET | Yes | - | 200, array of notifications | |
| API-NOTIF-002 | `/api/v1/notifications/unread-count` | GET | Yes | - | 200, count object | |
| API-NOTIF-003 | `/api/v1/notifications/1/read` | PUT | Yes | - | 200, marked as read | |
| API-NOTIF-004 | `/api/v1/notifications/read-all` | PUT | Yes | - | 200, all marked read | |

---

*Module: Notifications | Total: 4 test cases*
