# TASK-BACKEND-021 — Independent Kiosk Visibility for Services

> **Phase:** Backend (with database + admin panel support)
> **Task ID:** TASK-BACKEND-021
> **Priority:** P2 (Medium)
> **Status:** Complete

---

# Objective

Let administrators control whether a service appears on the self-service Kiosk selection screen independently of whether the service is Active. A service can remain usable in the admin panel (new requests, document generation) while being hidden from the Kiosk, and vice versa.

---

# Design

- **Two independent status flags:**
  - `is_active` — service is usable in the system (admin requests, documents).
  - `show_in_kiosk` — service appears on the Kiosk selection screen.
- The Kiosk lists a service only when `is_active = 1 AND show_in_kiosk = 1`.
- Unchecking "Show in Kiosk" is a reversible *hide*, not a destructive remove — the service record, requests, and generated documents are untouched.

---

# Database (migration 012)

- `services.show_in_kiosk` (BOOLEAN, DEFAULT TRUE) added after `is_active`.

---

# Backend

- `repositories/service.repository.js`:
  - `create` and `update` now persist `show_in_kiosk`.
  - New `updateKioskVisibility()`; `show_in_kiosk` added to the sortable columns.
- `services/service.service.js` — new `changeKioskVisibility()` (validates existence, updates, returns refreshed service).
- `controllers/service.controller.js` — new `changeKioskVisibility()` handler.
- `validations/service.validation.js` — `showInKiosk` optional boolean on create/update; new `kioskVisibilityValidation`; `show_in_kiosk` added to sort columns.
- `routes/service.routes.js` — `PATCH /services/:id/kiosk-visibility`.
- `controllers/kiosk.controller.js` — public services query now filters `is_active = 1 AND show_in_kiosk = 1`.

---

# Admin Panel

- Service form: added **Show in Kiosk** toggle (separate from the Active toggle).
- Services list: added **In Kiosk** column with Shown / Hidden badges.

---

# Acceptance Criteria

- [x] `services.show_in_kiosk` exists (default true).
- [x] Kiosk lists only services that are active AND shown.
- [x] Admin can toggle "Show in Kiosk" independently of Active.
- [x] Services list shows the current kiosk visibility.
- [x] Hiding a service from the Kiosk does not delete it or affect admin usability.
- [x] Backend lint clean and existing tests pass.

---

# Deliverables

- `database/migrations/012-add-service-kiosk-visibility.sql`
- Backend: service repository/service/controller/validation/routes + kiosk query filter
- `database/schema/schema.sql` (`services.show_in_kiosk`) + live DB migration applied
- Admin Panel: Service form "Show in Kiosk" toggle + "In Kiosk" column

---

# Estimated Effort

2–4 hours