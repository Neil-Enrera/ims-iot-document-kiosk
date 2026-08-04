# TASK-FRONTEND-019 — Status Display Board Module

> **Phase:** Frontend (with backend API support)
> **Task ID:** TASK-FRONTEND-019
> **Priority:** P1 (High)
> **Status:** Complete

---

# Objective

Provide residents with real-time updates about their document requests through a dedicated, read-only Status Display Board shown on a monitor/TV inside the Barangay Hall. The board mirrors queue management systems used in government offices, hospitals, banks, and restaurants.

---

# Responsibilities (Separation of Concerns)

| Component | Responsibility |
|-----------|----------------|
| Self-Service Kiosk | Creates the request and generates the request number only |
| Admin Panel | Receives/verifies requirements, reviews, processes, and updates request statuses |
| Status Display Board | Displays real-time request numbers for residents (read-only, no login) |

---

# Request Status Workflow

```
Submitted
    ↓
Waiting for Requirements
    ↓
Requirements Received
    ↓
Under Review
    ↓
Document Processing
    ↓
Ready for Release
    ↓
Released
```

Terminal states: `Rejected`, `Cancelled`.

---

# Implementation

## Database (migration 009)

- Renamed `Pending` → `Submitted`, `Approved` → `Under Review`, `Processing` → `Document Processing`.
- Added `Waiting for Requirements` and `Requirements Received`.
- Renumbered `request_statuses` into a clean linear sequence (1–9); `ON UPDATE CASCADE` propagated IDs to `requests` and `request_status_history`.

| ID | Status |
|----|--------|
| 1 | Submitted |
| 2 | Waiting for Requirements |
| 3 | Requirements Received |
| 4 | Under Review |
| 5 | Document Processing |
| 6 | Ready for Release |
| 7 | Released |
| 8 | Rejected |
| 9 | Cancelled |

## Backend

- `request.service.js` — new `STATUS_IDS` + `VALID_TRANSITIONS` for the linear workflow (forward moves + Rejected/Cancelled from active states; Under Review may skip directly to Ready for Release).
- `request.controller.js` / `request.routes.js` — new generic `PUT /requests/:id/status` endpoint used by the admin status dropdown. Broadcasts `request-status-changed` SSE event.
- `request.repository.js` — updated `reviewed_date`/`release_date` triggers and stats for the new IDs; added `assigned_staff` (last status changer) to request queries.
- `kiosk.controller.js` / `kiosk.routes.js` — public `GET /kiosk/status-display` endpoint returning only request numbers grouped by column:
  - `underReview` → statuses Under Review + Document Processing
  - `readyForRelease` → status Ready for Release
- `kiosk.controller.js` — new kiosk requests start in `Submitted`.

## Frontend — Admin Panel

- Requests table now has a per-row **status dropdown** (the only place statuses can change) plus a **View** action.
- Request details modal shows: Request #, Resident, Service, Date Submitted, Current Status, Assigned Staff, Purpose, Notes, and Status History.
- Status filter + existing search/pagination/sort preserved.
- `TableComponent` gained per-column `cellTemplates` support.
- SSE auto-refresh listens to `request-status-changed`.

## Frontend — Kiosk App (Status Display Board)

- New route `/status-display` (public, no login, read-only).
- Polls `GET /kiosk/status-display` every 7 seconds.
- Two-column layout:
  - **UNDER REVIEW** (yellow) — request numbers being reviewed or processed
  - **READY FOR RELEASE** (green) — request numbers ready to be claimed
- Large typography, live clock, fullscreen-optimized, request numbers only (privacy).
- Released/Rejected/Cancelled requests automatically disappear from the board.
- Kiosk success screen now instructs residents to submit documents and monitor their request number on the board.

---

# Acceptance Criteria

- [x] Board displays only active requests (Under Review + Ready for Release).
- [x] Only request numbers shown — no resident names or personal information.
- [x] Board auto-refreshes every 5–10 seconds.
- [x] Board requires no login and is read-only.
- [x] Admin status changes propagate to the board immediately (within one refresh).
- [x] Released requests disappear from the board.
- [x] Invalid status transitions are rejected by the backend.
- [x] Full workflow (Submitted → … → Released) verifiable end-to-end.

---

# Deliverables

- `database/migrations/009-add-status-display-workflow.sql`
- Backend: request service/controller/routes/repository updates + public status-display endpoint
- Admin Panel: requests module status dropdown + detail view
- Kiosk App: `/status-display` board page + updated kiosk success screen

---

# Estimated Effort

6–10 hours
