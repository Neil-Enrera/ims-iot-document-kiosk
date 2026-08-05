# TASK-BACKEND-020 — Claim Window (Expiry) for Done Documents

> **Phase:** Backend (with database + admin panel support)
> **Task ID:** TASK-BACKEND-020
> **Priority:** P2 (Medium)
> **Status:** Complete

---

# Objective

Give "done" (finished official) documents a configurable claim window. When a request reaches **Ready for Release** (the document is finished and awaiting pickup), the system records an expiry deadline. If the resident does not claim within the configured number of days, the done document is considered **expired**. Expiry is a soft flag that never deletes or modifies the generated document file, allowing staff to re-release it later if the resident returns.

---

# Design Principles

- **Soft expiry, never destructive** — an expired document keeps its generated file; it is only flagged in the UI (and removed from the public Status Display Board).
- **Configurable, not hardcoded** — the claim window length is a System Setting (`document_claim_days`), editable by administrators without code changes.
- **Derived flag, not extra state** — a request is "expired" when `status_id = 6` (Ready for Release) AND `expires_at < NOW()`, computed on the fly; no new workflow status is introduced.

---

# Database (migration 011)

- `requests.expires_at` (DATETIME, NULL) — deadline for claiming a Ready for Release document. Cleared when the document is released.
- New System Setting `document_claim_days` (category `document`, type number, default `15`).

---

# Backend

## `repositories/request.repository.js`

- `updateStatus()` now accepts an `expiresAt` parameter:
  - When transitioning to **Ready for Release** (status 6), sets `expires_at` to the given deadline.
  - When transitioning to **Released** (status 7), clears `expires_at`.
- `findAll()` and `findById()` return a computed `is_expired` flag: `(status_id = 6 AND expires_at IS NOT NULL AND expires_at < NOW())`.

## `services/request.service.js`

- `changeStatus()` reads the `document_claim_days` setting (via `getClaimWindowDays()`), and when moving a request to Ready for Release, computes and passes the `expires_at` deadline. When a request is released, no new deadline is set (expiry is cleared).

## `controllers/kiosk.controller.js`

- The public Status Display Board query now excludes Ready for Release requests that have already expired.

---

# Admin Panel

- Document Requests list gained a **Claim Expiry** column:
  - Shows a red **Expired** badge for expired requests.
  - Shows an **Xd left** countdown badge (amber, or red when ≤ 2 days remaining) for documents still within their claim window.
  - Shows `-` for requests with no deadline.
- Request details modal shows the **Claim Expiry** date and remaining days (or an Expired badge) for done documents.

---

# Acceptance Criteria

- [x] Setting `document_claim_days` exists (default 15) and is editable in System Settings → Document.
- [x] Moving a request to Ready for Release sets an `expires_at` deadline based on the setting.
- [x] Releasing a request clears `expires_at`.
- [x] A Ready-for-Release request past its deadline is reported as `is_expired` by the API.
- [x] Expired done documents no longer appear on the public Status Display Board.
- [x] Admin list shows an Expired / countdown badge for done documents.
- [x] Expired documents are never auto-deleted; the generated file is preserved.
- [x] Backend lint clean and existing tests pass.

---

# Deliverables

- `database/migrations/011-add-document-claim-expiry.sql`
- Backend: `request.repository.js` (`expires_at` handling + `is_expired`), `request.service.js` (claim-window computation), `kiosk.controller.js` (exclude expired from board)
- `database/schema/schema.sql` (`requests.expires_at`) + live DB migration applied
- Admin Panel: Claim Expiry column + details modal indicator

---

# Estimated Effort

2–4 hours