# Capstone Project Tracker

## Done
- TASK-FOUNDATION-001 through TASK-FOUNDATION-010: Foundation phase complete
- TASK-DATABASE-001, TASK-DATABASE-002: Database schema + seeds
- TASK-BACKEND-001 through TASK-BACKEND-018: ALL 17 backend tasks complete
- TASK-FRONTEND-001 through TASK-FRONTEND-017: ALL 16 frontend tasks complete (011 removed per DEC-008)
- TASK-FRONTEND-019: Status Display Board module complete (DEC-010 workflow + /status-display board)
- TASK-BACKEND-019: Automatic Document Generation module complete (DEC-011, migration 010, docx template rendering)
- Claim window / expiry for done documents complete (DEC-012, migration 011, `expires_at` + `document_claim_days` setting)
- Independent "Show in Kiosk" service visibility complete (DEC-013, migration 012, `show_in_kiosk` flag)

## In Progress
- (none — all frontend and backend tasks complete)

## Next Steps
- Integration testing (backend + frontend)
- RFID hardware integration
- Final deployment

## Phase Completion
| Phase | Status |
|-------|--------|
| Foundation | ✅ COMPLETE |
| Database | ✅ COMPLETE |
| Backend | ✅ COMPLETE (18/18) |
| Frontend | ✅ COMPLETE (17/17) |
| Kiosk/IoT | Not started |
| Testing | Not started |
| Deployment | Not started |

## Frontend Modules
| Module | Route | Status |
|--------|-------|--------|
| Dashboard | /dashboard | ✅ |
| Residents | /residents | ✅ |
| Requests | /requests | ✅ |
| Services | /services | ✅ |
| RFID | /rfid | ✅ |
| Users | /users | ✅ |
| Reports | /reports | ✅ |
| Notifications | /notifications | ✅ |
| Files | /files | ✅ |
| Settings | /settings | ✅ |
| Audit Logs | /audit | ✅ |
| Error Pages | /403, /404, /500 | ✅ |

## Kiosk App Routes
| Page | Route | Status |
|------|-------|--------|
| Self-Service Kiosk | / | ✅ |
| Status Display Board | /status-display | ✅ |

## Session History
| Date | Summary | Key Files |
|------|---------|-----------|
| 2026-07-28 | Project setup, graph built | AGENTS.md, docs/* |
| 2026-07-30 | Foundation phase, DB schema | backend/*, database/* |
| 2026-07-31 | Backend complete (17 tasks), Frontend complete (16 tasks) | All modules |
| 2026-08-04 | Status Display Board module (DEC-010, TASK-FRONTEND-019): new request workflow, admin status dropdown, /status-display board | database/migrations/009, backend/*, frontend/admin-panel/requests, frontend/kiosk-app/status-display |
| 2026-08-05 | Automatic Document Generation (DEC-011, TASK-BACKEND-019): docx template placeholders, admin placeholder mappings, auto-generate on Document Processing, document preview/download/print | database/migrations/010, backend/src/services/document.service.js, backend/src/routes/document.routes.js, frontend/admin-panel/services + requests |
| 2026-08-05 | Claim window for done documents (DEC-012): `requests.expires_at` + `document_claim_days` setting, Expired/Xd badge in admin Requests list, expired done-docs hidden from status board | database/migrations/011, backend/src/services/request.service.js, backend/src/repositories/request.repository.js, backend/src/controllers/kiosk.controller.js, frontend/admin-panel/requests |
| 2026-08-05 | Independent "Show in Kiosk" service visibility (DEC-013): `services.show_in_kiosk` flag, kiosk lists only active+shown services, admin toggle + "In Kiosk" column | database/migrations/012, backend/src/repositories/service.repository.js, backend/src/controllers/kiosk.controller.js, frontend/admin-panel/services |
