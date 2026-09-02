# Progress Report — August 1, 2026

## Executive Summary

| Phase | Tasks | Completed | In Progress | Deferred |
|-------|-------|-----------|-------------|----------|
| 01 - Foundation | 10 | 10 | 0 | 0 |
| 02 - Database | 1 | 1 | 0 | 0 |
| 03 - Backend | 17 | 17 | 0 | 0 |
| 04 - Frontend | 17 | 16 | 1 | 0 |
| 05 - Kiosk/IoT | 10 | 10 | 0 | 0 |
| 06 - Testing | 10 | 1 | 9 | 0 |
| 07 - Deployment | 10 | 1 | 9 | 0 |
| **Total** | **85** | **56** | **19** | **0** |

> **Note:** TASK-BACKEND-012 (Payment API) and TASK-FRONTEND-011 (Payment UI) removed per DEC-008.
> **Recent Updates (August & September 2026):**
> - **Implemented RFID-Based "Request Again" Feature for Registered Residents** (`transaction.repository.js`, `kiosk.controller.js`, `kiosk.routes.js`, `kiosk.service.ts`, `kiosk.component.ts`, `en.ts`, `fil.ts`, `previous-requests.test.js`):
>   - **RFID Resident Verification**: Scoped exclusively to verified residents with an active RFID session (`resident() && rfidCard()`). Guests or unverified sessions are excluded.
>   - **Service-Specific Transaction History Query**: When selecting a service, queries previous requests strictly filtered by `(resident_id, service_id)` through `GET /api/v1/kiosk/residents/:id/previous-requests?service_id=X`.
>   - **"Previous Request Found" Review & Selection Modal**: Displays the latest matching request details (Request Number, Date Requested, Status badge, Purpose) with clear options to "Request Again (Reuse Data)" or "Start Fresh Application".
>   - **Editable Draft Reuse & Requirements Re-Check**: Reuses previous `form_data` as editable draft data while routing the resident to the service Requirements screen first to re-verify current service prerequisites. Pre-filled fields remain fully editable before submission.
>   - **Current Photo Enforcement & Audit Integrity**: Does not copy past photos; if the service requires a photo, the resident must capture a current photo. Generates a brand-new Transaction and Request Number upon submission while leaving the previous transaction unchanged in history for audit integrity.
>   - **Bilingual Support & Unit Testing**: Added complete English and Filipino localization keys; verified 3/3 passing unit tests and clean production build on `kiosk-app`.
> - **Aligned "Continue without Barangay ID" → "Request Document" Resident Information Form with Reference Standard** (`kiosk.component.ts`, `kiosk.service.ts`, `kiosk-state.service.ts`, `transaction.service.js`, `placeholder.engine.js`, `en.ts`, `fil.ts`):
>   - **Structured Layout & Field Grouping**: Reconstructed the guest registration form into a clean 2-column personal details grid (First Name, Middle Name, Last Name, Suffix, Birth Date, Birth Place, Gender dropdown, Civil Status dropdown, Nationality, Religion, Occupation, Blood Type, Contact Number, Email) followed by a 3-column address details grid (Subdivision, Street, Block, Lot, House Number, Purok/Zone, Sitio, Municipality, Province, ZIP Code) and Full Address line with an auto-compose "Generate Complete Address" action.
>   - **Temporary Session Identity Pipeline**: Extended the temporary guest session state to preserve all discrete demographic and address fields, automatically populate matching service form fields, snapshot guest identity on transactions, and seamlessly resolve all document template placeholders (`{{full_name}}`, `{{first_name}}`, `{{last_name}}`, `{{subdivision}}`, `{{street}}`, `{{block}}`, `{{lot}}`, `{{purok_zone}}`, `{{address}}`, etc.) during document preview and generation.
>   - **Input Sanitization & Validation**: Preserved name-only key filtering, 11-digit mobile format checks, Date of Birth limits, and bilingual error messaging in English and Filipino.
> - **Implemented Resident Information Update Request Workflow & Real-Time Notifications** (`resident-update.*`, `resident-profile.component.ts`, `residents.component.ts`, `notification-dropdown.component.ts`, `audit.repository.js`):
>   - **Resident Profile Request**: Replaced direct permanent record edits with a structured update request modal allowing residents to request individual changes across discrete address fields (Subdivision, Street, Block, Lot, Purok/Zone) and demographic details with change reasons.
>   - **Admin Review & Real-Time Notifications**: Added a dedicated "Information Request Updates" tab in Admin Panel with real-time SSE notifications for staff, side-by-side comparison modal, and seamless Approve/Reject handling with audit trail logging.
>   - **Clean Address Composition**: Standardized address formatting to remove artificial prefix tokens (e.g. `Blk 15, Lot 20 B, Samaria, Pleasant Hills`).
>   - **Verification**: Verified end-to-end unit tests, build validation on both `kiosk-app` and `admin-panel` with 0 compile errors.
> - **Comprehensive Date of Birth Validation, Dynamic Age Calculation & Service Minimum Age Enforcement** (`kiosk.component.ts`, `transaction.service.js`, `kiosk.validation.js`, `resident.validation.js`, `en.ts`, `fil.ts`):
>   - **Past Date Enforcement**: Enforced strict past-date validation across all Kiosk forms (Guest registration, Barangay ID application, dynamic service forms) and backend APIs. Today's date (e.g. August 24, 2026 when current date is August 24, 2026) and future dates are rejected with clear error messages.
>   - **Touchscreen Date Limits**: Set the maximum date attribute (`max`) on all birthdate `<input type="date">` elements to yesterday (`YYYY-MM-DD`), preventing users from selecting invalid dates on touchscreen/desktop calendars.
>   - **Dynamic Age Computation & Real-Time Sync**: Implemented real-time dynamic age calculation that displays an age badge (e.g. `Age: 25 yrs old` / `Edad: 25 taon`) right next to the Date of Birth input and automatically syncs with any `age` field in active service schemas.
>   - **Service Minimum Age Enforcement**: Enforced service-specific age restrictions across both frontend and backend (e.g. *Senior Citizen Certificate* requiring age $\ge$ 60, *Solo Parent* requiring $\ge$ 18, *First-Time Job Seeker* requiring $\ge$ 15).
>   - **Bilingual Validation Messaging**: Added comprehensive validation messages in both English (`en.ts`) and Filipino (`fil.ts`).
> - **Configurable Barangay ID Application Form & Dynamic Mapping Pipeline** (`kiosk.component.ts`, `id-card.service.js`, `kiosk.validation.js`, `kiosk.service.ts`):
>   - **Admin-Configurable Form Fields**: Unified the Barangay ID application form with the platform's flexible form builder system. Admins can configure custom fields, required flags, validation patterns, and document placeholder mappings from the Admin Panel (`services` ID: 66).
>   - **Dynamic Kiosk Rendering & Fallback**: Kiosk dynamically renders the configured form fields (`select`, `textarea`, `radio`, `checkbox`, `date`, `tel`, `text`), pre-populates matching fields from resident data on RFID scan, performs live dynamic field validation, and renders all fields dynamically in the review summary screen before submission and live ID card preview.
>   - **Graceful Fallback**: If no custom fields are defined, smoothly falls back to standard default fields with full backwards compatibility.
>   - **Verification**: Built and verified both `kiosk-app` and `admin-panel` with 0 compile errors; verified 100% test pass on `id-card.service.test.js` (9/9 suites pass).
> - **Official Barangay San Manuel Identification Card Template Integration** (`12ee12af1cc360b6b94a60acaa182ac8.docx`, `generate-barangay-id-template.js`, `id-card.service.js`, `id-card.service.test.js`):
>   - **Precision Visual Reconstruction**: Modeled the official Barangay San Manuel Barangay ID card front and back from the official sample reference photos. Built with standard CR80 proportions, official crimson (`#D92638`), gold accent dividers (`#FBBF24`), branding hierarchy, 2×2 resident photo frame, bearer signature line, digital verification QR code box, and official back-side certification statement with Punong Barangay Gilbert A. Baptista seal and title.
>   - **Unified Template System Pipeline**: Seamlessly integrated into `id-card.service.js` and `placeholder.engine.js` with full support across all system stages: Kiosk Live ID Preview Modal $\rightarrow$ Admin Review $\rightarrow$ Application Approval $\rightarrow$ Final Generated/Printable ID Card.
>   - **Verification**: Verified 100% test pass on `id-card.service.test.js` (9/9 suites pass) and clean builds on both `kiosk-app` and `admin-panel`.
> - **Kiosk UI Streamlining & Clean Presentation Updates** (`kiosk.component.ts`, `resident-profile.component.ts`):
>   - **Scan Page**: Restored the "Find My Record" primary button alongside "Continue as Guest" for manual resident lookup when requested.
>   - **Resident Profile**: Removed `Blood Type` and `Occupation` from the resident personal information grid in `resident-profile.component.ts`, leaving a clean, balanced 6-field layout (Birth Date, Sex, Civil Status, Contact Number, Email, Address).
>   - **Barangay ID Application Form & Review**: Removed `Blood Type` and `Occupation` input fields from the application form and review summary step in `kiosk.component.ts`.
>   - **ESP32-CAM 90° Clockwise Rotation**: Integrated 90° clockwise rotation on live preview streams (`rotate-90 scale-[1.35]`) and implemented offscreen canvas snapshot rotation (`rotateBlob90Deg`), producing perfectly oriented portrait ID photos with zero hardware latency.
> - **ESP32-CAM & ESP8266 RFID Simultaneous Operation & Hardware Hardening** (`ESP32CAM_Arduino.ino`, `kiosk.component.ts`, `kiosk.service.ts`, `kiosk-server/index.js`, `main.cpp`):
>   - **Direct Capture & Black Image Fix**: Resolved browser canvas MJPEG stream rendering blank/black by switching to direct snapshot fetch from `/capture?t=...` with temporary stream socket detachment, converting binary JPEG Blob into base64 Data URL, and flushing stale DMA frames on ESP32-CAM.
>   - **Simultaneous ESP32-CAM & ESP8266 Operation**: Isolated COM port connections (`COM3` dedicated to ESP32-CAM; `COM4` dedicated to ESP8266 RFID reader). Fixed NodeMCU bootloader reset conflict by clearing `dtr: false, rts: false` on serial port open to prevent ESP8266 from falling into `waiting for download` ROM bootloader mode.
>   - **RC522 Antenna Gain Optimization**: Boosted RC522 RFID reader antenna sensitivity to maximum `RxGain_max` (48dB) in `main.cpp` to ensure robust 13.56 MHz card detection range.
>   - **Universal Kiosk RFID Integration**: Enabled card scanning across all screens and flows (Home screen, Scan screen, and Barangay ID Application auto-fill).
>   - **Codebase Organization & Clean Push**: Archived ESP32-CAM Arduino firmware into `hardware/arduino/esp32_cam/`, cleaned obsolete scripts and redundant root archives, generated fresh Graphify architecture analysis (3,836 nodes, 7,218 edges, 226 communities), and pushed all changes to GitHub repository `https://github.com/Neil-Enrera/ims-iot-document-kiosk.git`.
> - Integrated Low-Latency ESP32-CAM Live Stream & ID Photo Capture Flow (`ESP32CAM_Arduino.ino`, `kiosk.component.ts`, `kiosk.service.ts`, `environment.ts`, `environment.prod.ts`):
>   - **Root Causes of Lag Identified**: Single-frame HTTP polling on `/preview` created TCP connection teardown overhead and choppy ~3 FPS; single frame buffering (`fb_count = 1`) blocked DMA capture; Wi-Fi sleep mode caused packet delivery jitter; and missing CORS headers prevented cross-origin retrieval.
>   - **Hardware Firmware Enhancements**: Implemented persistent Multi-Part Motion JPEG (MJPEG) streaming (`/stream`) over a single HTTP connection yielding smooth 15–25 FPS with sub-80ms latency. Enabled double-buffered PSRAM DMA (`fb_count = 2`, `CAMERA_FB_IN_PSRAM`), disabled Wi-Fi modem sleep (`WiFi.setSleep(false)`), and added instantaneous snapshot capture endpoint (`/capture`) with full CORS support (`Access-Control-Allow-Origin: *`).
>   - **Kiosk Application Integration**: Integrated native ESP32-CAM stream preview into the Barangay ID photo capture flow (`barangayStep === 'photo'`) and document request photo capture with live face-positioning guides, camera status indicators, and camera source switching (ESP32-CAM vs. local tablet camera). Direct snapshot capture seamlessly flows into signature capture, live Barangay ID card preview, and application submission.
> - Fixed RFID Hardware Bridge, Auto-Detection & End-to-End Resident Verification (`kiosk-server/index.js`, `rfid-scan.service.ts`, `kiosk.component.ts`, `rfid.repository.js`):
>   - **Root Causes Identified**: 
>     1) `hardware/kiosk-server` only listened on WebSocket without USB Serial fallback for the NodeMCU/CH340 device on COM4 when Wi-Fi was disconnected or negotiating.
>     2) `RfidScanService` only connected on demand when clicking `startRfid()` and disconnected on page/home transitions, causing cards tapped on the landing screen to be ignored.
>     3) `handleRfidScan` strictly guarded against scans outside `mode === 'rfid'`, blocking initial card taps on the Home screen.
>     4) `findByUid` in backend did not prioritize ACTIVE cards over superseded cancelled records.
>   - **Fixes Implemented**:
>     - Upgraded `hardware/kiosk-server` with dual communication (concurrent USB Serial on COM4 via `serialport` + WebSocket `/ws?type=arduino`), guaranteeing real-time card capture regardless of network status.
>     - Updated `RfidScanService` with dynamic host resolution (`ws://${window.location.hostname}:3001`) and continuous connection lifecycle.
>     - Updated `kiosk.component.ts` to allow instant card taps from the Home screen or Scan screen, automatically verifying with `/api/v1/kiosk/rfid/verify`, loading the resident record, and displaying the Resident Profile welcome page.
>     - Updated `rfid.repository.js` `findByUid` to prioritize active registered cards.
>   - **Verification**: Verified with automated E2E integration test `test-rfid-e2e-flow.js` (Card tap `1AEEC635` → Bridge → Backend API → Resident Neil Andrei Enrera profile displayed). Built both applications with 0 errors.
> - Enhanced Admin Panel Forms Validation & Real-Time Filtering (`input.component.ts`, `resident-form.component.ts`, `user-form.component.ts`, `request-form.component.ts`, `resident.validation.js`, `user.validation.js`):
>   - Upgraded shared `InputComponent` in Admin Panel with real-time keystroke filtering (`filterType="name"`, `filterType="phone"`, `filterType="numeric"`), `(keydown)` character interception, `(input)`/`(paste)` sanitizers, `maxlength`, `max` date constraints, and accessible error message banners.
>   - Updated Resident Form (`resident-form.component.ts`) and backend (`resident.validation.js`): Enforced letters-only filtering and validation on `firstName`, `middleName`, `lastName`, `nationality`, and `emergencyContactName` (`/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\-\.\']+$/`), 11-digit mobile format on contact numbers (`/^(09\d{9}|\+639\d{9})$/`), valid past dates on `birthDate`, and character length limits across all resident address and demographic fields.
>   - Updated User Form (`user-form.component.ts`) and backend (`user.validation.js`): Enforced letters-only filtering on names, 11-digit phone format, minimum 6-character password constraint, and valid email format.
>   - Updated Request Form (`request-form.component.ts`): Added 255-character maximum length restriction on purpose.
> - Enforced Real-Time Input Character Filtering & Strict Length Restrictions on Kiosk (`kiosk.component.ts`, `transaction.service.js`, `kiosk.validation.js`):
>   - **Contact / Mobile Numbers**: Implemented real-time keystroke interception (`filterNumberKeyDown`), instant sanitization (`sanitizePhone`), and paste event filtering across all guest, dynamic service (`field.type === 'tel'`, contact/phone/mobile keys), and Barangay ID forms. Enforced strict numeric-only digits (`0-9`) up to 11 digits (`09XXXXXXXXX`), completely blocking and stripping letters, symbols, or invalid input on both physical and virtual touchscreen keyboards.
>   - **Name Fields**: Implemented letters-only filtering (`filterNameKeyDown`, `sanitizeName`) on Guest full name, Barangay ID name fields (`firstName`, `middleName`, `lastName`, `emergencyContactName`), and dynamic service beneficiary/relative names (`/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\-\.\']+$/`), strictly blocking numbers and invalid special characters in real-time.
>   - **Field Lengths & Form Types**: Bound maximum length constraints across text (255 chars), textareas (500 chars), names (50–100 chars), and phone numbers (11 digits).
>   - **Backend & Automated Verification**: Synchronized backend schema validation in `transaction.service.js` and `kiosk.validation.js` and verified with automated test suite `test-form-validations-all.js` (9/9 passed). Both Kiosk and Admin frontends compiled cleanly with 0 errors.
> - Implemented Comprehensive Kiosk Application Form Validation (`kiosk.component.ts`, `transaction.service.js`, `kiosk.validation.js`, `en.ts`, `fil.ts`): Added robust, consistent field validation across all Kiosk application forms on both Frontend (immediate user feedback, touchscreen-friendly error messages, inputmode attributes, length constraints, date limits) and Backend (dynamic form field schema validation against `services.form_fields`, guest applicant input validation, and Barangay ID application validation). Enforced numbers-only, phone format (`09XXXXXXXXX`), email format, reasonable age range (0–125), non-future birth dates, minimum/maximum lengths, and required field rules in English and Filipino.
> - Implemented LAN-Only Restriction for Status Display (`status-display-guard.middleware.js`, `kiosk.routes.js`, `status-display.component.ts`, `app.js`): Restricted the Document Request Status Display so that live queue data is only accessible through the designated Barangay Kiosk LAN address (`http://192.168.100.102:4201/status-display`). Added backend middleware blocking `localhost:4201` origins with HTTP 403 Forbidden, while the frontend displays a secure restricted-access screen with a direct link when loaded from loopback hosts. All Admin Panel and standard Kiosk functionalities remain fully operational.
> - Implemented Edit Document in Request Details Modal (`requests.component.ts`, `request.service.js`, `request.validation.js`, `document.service.js`): Replaced the "Regenerate" action with a dedicated "Edit Document" feature. Administrator / staff can correct resident details, application form fields, purpose, and remarks directly from the Admin Panel. Saving immediately persists the updated form data to the request without changing the workflow status or creating duplicate requests, automatically regenerates the document artifact, and reflects the corrections in the live document preview.
> - Verified and Fixed Admin Panel 2FA Login Flow (`auth.service.js`, `auth.repository.js`, `login.component.ts`): Made identifier lookup fully case-insensitive across both registered email addresses and usernames. Verified that valid credentials (`andreienrera@gmail.com` / `admin@sanmanuel.gov.ph` with password `admin123`) generate secure 6-digit OTPs via SMTP and seamlessly complete 2FA authentication, while incorrect passwords and emails are strictly and safely rejected.
> - Implemented Admin Panel Two-Factor Email Login with OTP (`login.component.ts`, `auth.service.ts`, `auth.controller.js`, `email.service.js`, `auth.repository.js`): Updated the Admin Panel login flow from username to registered email address + password, followed by a mandatory 6-digit one-time verification code (OTP) sent to the administrator's email. Added dedicated `login_verification_codes` database table, branded email template, OTP verification endpoint, and clean two-step UI with resend countdown timer and masked email display.
> - Fixed RFID API Validation Bug (`rfid.validation.js` & `rfid.component.ts`): Resolved HTTP 400 Bad Request error caused by strict `getAllValidation` rejecting `sortBy=resident_name`, `sortBy=resident_code`, and `sortBy=registration_status`. Updated the validation schema to permit resident sorting and status filter query parameters.
> - Resolved RFID Cards Page Resident-Card Mapping Issue (`rfid.repository.js` & `rfid.component.ts`): Traced and resolved the issue where active registered cards were overshadowed or miscategorized. Updated the repository query to prioritize active registered cards (`COALESCE(MAX(CASE WHEN UPPER(status) = 'ACTIVE' ...))`), correctly distinguishing registered residents (with active cards like `TEST001`, `TEST002`, `1AEEC635`, `7555F246`, `C9463D05`) from unregistered residents or cancelled cards. Sorted registered cards to the top by default and provided robust status filtering.
> - Enhanced the Admin Panel Resident Profile modal RFID Cards tab (`residents.component.ts` & backend `rfid.repository.js` / `resident.repository.js`): Updated `findById` and `rfid.findAll` to join and support direct `residentId` filtering. The modal's RFID tab displays the registered Card UID, issuance/expiry dates, active status badge, and activation/deactivation actions without redundant history logs. If no RFID card is linked, displays a clean, dedicated "No RFID card registered" empty state card.
> - Refined the Resident Profile screen (`resident-profile.component.ts`): Updated the left column layout to match the reference design with the top Profile Card (photo, resident name, resident ID, Active Resident badge) and the bottom peach "RFID Scanned" box ("Tap your RFID card to view your personal details."). Configured the view to automatically mask/hide all sensitive details on every RFID or Barangay ID scan, with the "Show Details" button allowing residents to toggle privacy.
> - Redesigned the Resident Profile screen (`resident-profile.component.ts`): Closely matched the provided UI reference with circular avatar photo, resident full name and Resident ID / Barangay display below avatar, active status pill badge, and structured 2-column Personal Information grid (Birth Date, Occupation, Sex, Contact Number, Civil Status, Email, Blood Type, Address) omitting redundant Full Name field. Included synchronized 4-column footer (Language, Assistance, Office Hours, Live Date/Time).
> - Fixed and enhanced the Status Display API and UI (`kiosk.controller.js` & `status-display.component.ts`): Updated `fetchStatusDisplayData` to join with `services` and return structured request records (`request_number`, `document_name`/`service_name`, `status_name`, `request_date`). Updated the frontend cards to prominently display the Request Number (e.g. `REQ-00001`), document title (`Certificate of Indigency`), and status badge with robust property fallbacks.
> - Redesigned the Document Request Status Board (`status-display.component.ts`): Aligned with the official Barangay San Manuel theme with a clean white/light-gray background, navy headings, and orange brand accents. Displays the official Barangay seal, live clock with date, two responsive status panels with gradient headers (Under Review in orange, Ready for Release in emerald) and counter badges, clean empty states, a resident reminder card, privacy notice, and live SSE stream connection indicator.
> - Updated the Workflow Quick Actions in Request Details modal (`requests.component.ts`): Replaced multiple buttons with a gated "Next Action / Status" dropdown enforcing strict step-by-step workflow progression (Submitted → Waiting for Requirements → Requirements Received → Under Review → Document Processing → Ready for Release → Released). Displays Current Status separately with a pill badge. Added a single "Update Status" button with an explicit confirmation dialog before applying changes. Destructive actions (Reject and Cancel) remain separate with dedicated confirmation modals, including mandatory rejection reasons.
> - Redesigned and improved the Document Requests page (`requests.component.ts`): Read-only status badges on the table, clickable rows opening the Request Control Center modal, complete 7-step horizontal workflow progress indicator, status-gated workflow actions, grouped form data (Personal, Application, Additional Info), and full document generation/preview support.
> - Standardized Pagination behavior across all Admin tables (Residents, Document Requests, Barangay ID Applications, Services, RFID Cards, Users, Audit Logs): Default page size set to 10/page. Completely hide pagination controls and page-size selector when `totalRecords <= recordsPerPage` (showing only the range text `Showing 1 to N of N`), while displaying full pagination controls with page buttons and selector when `totalRecords > recordsPerPage`.
> - Implemented complete Admin Forgot Password & Email Verification workflow: 4-step interactive modal (Email entry → 6-digit verification code with 10m expiration and resend cooldown → Set new password with min-6 character validation → Success confirmation), backed by `password_resets` table, secure nodemailer email delivery service, and generic response anti-enumeration protection.
> - Added Logout Confirmation modal across all Admin Panel logout entrypoints (sidebar, profile dropdown, mobile drawer).
> - Removed "Login with Barangay ID Card" option from Admin Panel login page, maintaining strict admin-only username/password credentials.
> - Centered Admin Panel login form with balanced margins and full-bleed Barangay San Manuel Hall background photograph (`Barangay Hall.png`).
> - Redesigned official Government PDF Report template for Document Requests with official seal, metadata box, 7-column print table, peach total row, and dual Prepared By / Approved By signature sections.
> - Redesigned "Barangay ID Applications" page: 4 clean columns (Application #, Applicant, Date Submitted, Status), "All Dates" and "All Statuses" filters, and clean typography.
> - Added "All Services", "All Dates" (Today, Yesterday, 7 Days, Month, Custom Range), "All Statuses", and "Reset" filters in Document Requests.
> - Standardized Pagination component across all Admin pages (`< [1] 2 3 > [10/page]`).
> - Added official Barangay San Manuel Logo to Admin Sidebar.
> - Converted primary action buttons and active indicators from blue to official orange.
> **Note:** Phase 06/07 tasks had test plans and deployment docs written, but actual test code and deployment automation are not yet implemented.

---

## Phase 01 — Foundation (10/10 DONE)

All foundation tasks complete. Project structure, architecture, and tooling configured.

---

## Phase 02 — Database (DONE)

- Schema created with 14+ tables (users, residents, rfid_cards, requests, services, request_statuses, etc.)
- Seed data loaded (roles, statuses, barangay, services, 6 test residents)
- 7 design decisions documented in decision-log.md
- CHECK constraints and ENUMs enforced at database level
- **Added:** Processing (ID 6) and Cancelled (ID 9) statuses via migration 002

---

## Phase 03 — Backend (17/17 DONE)

All 11 backend modules fully implemented with real MySQL queries:

| Module | Status | Notes |
|--------|--------|-------|
| Auth (JWT) | DONE | Login, token, bcrypt, /me endpoint |
| Residents | DONE | Full CRUD + archive/restore + auto-code generation |
| Requests | DONE | Full workflow with state machine transitions |
| RFID Cards | DONE | Register, assign, verify, replace, status |
| Services | DONE | CRUD + activate/deactivate toggle |
| Dashboard | DONE | Summary stats, charts, recent activities |
| Reports | DONE | Request + resident reports with filters |
| Audit Logging | DONE | Log creation + retrieval; **now wired into resident/request/kiosk controllers** |
| Settings | DONE | Read-only support, category grouping, update |
| Kiosk API | DONE | Public endpoints for resident search, services, request creation |
| File Management | DONE | Upload (multer), list, delete |

### Backend Session Updates
- **Audit logging wired**: Controllers now call `auditRepository.log()` on resident CRUD, request status changes, and kiosk request creation
- **Request status IDs fixed**: VALID_TRANSITIONS and STATUS_IDS corrected to match DB (cancelled = 9)
- **Kiosk limit param**: `kiosk.service.js` now forwards limit to repository
- **Dead code removed**: noContentResponse, validationResponse, unused morgan/stream/fs/path, logActivity, verifyRfid

---

## Phase 04 — Frontend (16/17 DONE, 1 IN PROGRESS)

| Task | Status | Notes |
|------|--------|-------|
| TASK-FRONTEND-001 through 017 | DONE | All modules implemented with real templates, API calls, signal-based state |
| TASK-FRONTEND-018 (Frontend QA) | **IN PROGRESS** | Manual testing not yet performed |

### Modules Implemented
- Auth (login, guards, JWT storage)
- Dashboard (6 stat cards, real API)
- Residents (CRUD list + form)
- Requests (CRUD list + form + approve/reject/release)
- RFID (list + register form, sidebar link deferred)
- Services (CRUD list + form)
- Users (CRUD list + form, admin-only)
- Files (list + upload + delete)
- Notifications (list + mark read + unread badge)
- Settings (category sidebar + dynamic form)
- Reports (date range + report table)
- Audit (read-only searchable list)
- Error pages (403, 404, 500)

### Frontend Session Updates
- **Environment config created**: `src/environments/environment.ts` and `environment.prod.ts` with `apiUrl`
- **angular.json updated**: fileReplacements for production builds
- **auth.service.ts / api.service.ts**: Now use `environment.apiUrl` instead of hardcoded URL
- **Dead code removed**: Unused DatePipe, InputComponent, Router imports, loading signals
- **Duplicate kiosk app**: `projects/kiosk-app/` kept as primary; `src/app/features/kiosk/` still exists (consolidation pending)

---

## Phase 05 — Kiosk/IoT (10/10 DONE, 0 DEFERRED)

| Task | Status | Notes |
|------|--------|-------|
| TASK-HARDWARE-001 | DONE | Architecture planning |
| TASK-HARDWARE-002 | DONE | ESP8266 firmware |
| TASK-HARDWARE-003 | DONE | RFID reader integrated via ESP8266 + MFRC522 WebSocket |
| TASK-HARDWARE-004 | DONE | Webcam integration |
| TASK-HARDWARE-005 | DONE | RFID auth flow integrated into kiosk app |
| TASK-HARDWARE-006 | DONE | Kiosk UI wizard (7-step workflow) |
| TASK-HARDWARE-007 | DONE | Kiosk-backend communication |
| TASK-HARDWARE-008 | DONE | End-to-end kiosk workflow |
| TASK-HARDWARE-009 | DONE | Error handling & recovery |
| TASK-HARDWARE-010 | DONE | Kiosk UX & auto-reset |

### Kiosk Session Updates
- **Standalone kiosk app**: `projects/kiosk-app/` with proper error handling for connectivity issues
- **Environment config**: Added `environment.prod.ts` for kiosk-app
- **Kiosk request creation**: Now logged to audit_logs
- **Hardware server**: `hardware/kiosk-server/` — functional Express+WebSocket server

---

## Phase 06 — Testing (1/10 DONE, 9 IN PROGRESS)

| Task | Status | Notes |
|------|--------|-------|
| TASK-TESTING-001 | DONE | Test plan + 37 test case documents written |
| TASK-TESTING-002 through 010 | **IN PROGRESS** | Test cases documented but **no test code written** |

### Testing Gap
- **Zero** `*.spec.ts` or `*.test.js` files exist in the project
- Test case documents exist in `docs/testing/test-cases/` (37 files)
- Test plan exists in `docs/testing/test-plan.md`
- `package.json` has `"test": "ng test admin-panel"` but no test runner is configured
- **Action needed**: Write actual unit/integration tests

---

## Phase 07 — Deployment (1/10 DONE, 9 IN PROGRESS)

| Task | Status | Notes |
|------|--------|-------|
| TASK-DEPLOYMENT-001 | DONE | Deployment plan + 9 documentation files written |
| TASK-DEPLOYMENT-002 through 010 | **IN PROGRESS** | Documentation exists but **no deployment automation** |

### Deployment Gap
- No Dockerfile, docker-compose.yml, or CI/CD config
- No automated deployment scripts
- Deployment docs describe manual `C:\BarangayIMS\` setup procedure
- **Action needed**: Create deployment automation (at minimum a deploy script)

---

## Recent Changes (August 1, 2026 Session)

### Bug Fixes
- Fixed "Resident not found" error — added 6 test residents via migration 002
- Fixed request status ID mismatch (cancelled = 9, not 7)
- Fixed kiosk missing environment files
- Fixed CORS to use KIOSK_URL env var
- Fixed `package.json` scripts (start:backend, start:all, --open flags)
- Deleted `start.bat` that caused port conflicts

### Code Cleanup
- Deleted 17 unused files (routes, permissions, temp uploads, unused services/components)
- Removed dead code from 13+ files (noContentResponse, validationResponse, unused imports, dead signals)
- Fixed `.env.example` (correct DB_NAME, added KIOSK_URL)
- Fixed `AGENTS.md` broken doc references
- Added `graphify-out/` to `.gitignore`

### New Features
- Environment-based API URL configuration (admin + kiosk apps)
- Audit logging wired into resident, request, and kiosk controllers
- Kiosk-app production environment file

---

## Recent Changes (August 11, 2026 Session)

### Kiosk UI Redesign (Service Categories → Requirements Flow)
- Redesigned the **Service Categories** step to match the new design system: light `#F8FAFC` canvas, background image + radial vignette + orange corner shape, centered logo header with page title/subtitle, service cards as white 20px-radius tiles with rounded orange icon, service name, real DB description (no placeholders), a "How to Use" callout with disabled "In Progress" chip that still asks for visitor details, and a sticky bottom single-action Continue bar (secondary link left, visual icon center).
- Redesigned the **Requirements** step to the same design system: headed by a back button (top-left), centered logo, a title + new subtitle ("Please review the requirements before proceeding."), and a single centered white card showing the service icon/name/description, a divider, a "What to Bring" heading, and each requirement as a row with a soft circular document icon + green circular confirmation check; bottom actions are Back (outlined) + Continue (solid orange) calling `goBack()`/`proceedToForm()`.
- Added i18n keys `doc.requirements.subtitle` (en/fil); both redesigned steps use a shared 4-section footer (Language EN/FIL selector, Assistance, Office Hours, Date & Time) identical to the landing page.
- **Known OneDrive quirk**: the first build after edits compiled a stale file placeholder; rebuild after sync resolves. Always verify the freshly built dist chunk contains new strings before declaring success.
- Verified: `npm run build:kiosk` passes; fresh dist chunk contains the new subtitle keys (en/fil) and the new row/card utility classes.

### Pre-Submission Document Preview (Review → Preview → Submit)
- **Workflow:** Form → Review Your Request → **Document Preview** → Edit Information / Submit Request. The resident can review the actual generated document before submitting, and the application form remains the single source of truth (edits always re-validate and regenerate the preview).
- **Backend — `document.service.js`:** added `renderRequestPreview()` — buffer-only render that mirrors `generateDocument`'s template checks, placeholder resolution, and render loop but **never writes a file or touches the DB** (no request row, no status change, no document row). Guest identity is merged under `_guest` exactly like `insertKioskRequest` does, so previews and final stored requests resolve placeholders identically.
- **Backend — route/controller:** new public `POST /kiosk/requests/preview` (reuses `createRequestValidation`) returning the DOCX buffer inline; `getServices` now exposes `has_template` so the kiosk can hide the preview when a service has no uploaded template.
- **Frontend:** `kiosk.service.ts` gained `previewRequest()` (blob response). The Review step now offers **Preview Document / Refresh Preview** (renders the DOCX inline via `docx-preview`'s `renderAsync`, same library as the Barangay ID + admin preview modals), plus **Edit Information** (returns to the form step, clears the preview so it regenerates from updated values) and the existing **Submit Request**.
- **Business rule honored:** previewing is draft-only — it does not approve, generate an official document, or change status. Only the admin's review/approve flow produces the official document (existing `request.service`/`document.service` behavior unchanged).
- Added i18n keys `doc.review.edit`, `doc.review.previewTitle`, `doc.review.previewDocument`, `doc.review.previewLoading`, `doc.review.previewRefresh`, `doc.review.previewHint`, `doc.review.previewFailed` (en/fil).
- Verified: backend ESLint clean, backend tests 55/55, `npm run build:kiosk` passes, fresh dist chunk contains the new preview/edit strings in both languages.

---

## Recent Changes (August 14, 2026 Session)

### RFID Hardware & Kiosk Integration
- **ESP8266 Firmware**: Rewrote the ESP8266 code to connect to the kiosk-server via WebSockets (`WebSocketsClient` library) and send JSON-formatted scanned UIDs (`ArduinoJson` library) instead of printing to Serial. Added automatic reconnection and a 15-second heartbeat loop.
- **Kiosk Server**: Added heartbeat monitoring, connection tracking, hardware status endpoints, and WebSocket broadcasts to automatically notify all kiosk clients when the reader connects or disconnects.
- **Frontend Kiosk App**: Integrated the RFID scanner status dynamically. Added exponential backoff auto-reconnect logic to the frontend `rfid-scan.service.ts` so connection failures are handled gracefully without requiring manual app refresh.
- **Backend**: Updated `getHardwareStatus` in `kiosk.service.js` to dynamically fetch live hardware connectivity status from the kiosk-server instead of hardcoding 'Disabled'.
- **Start Script**: Combined all 4 services (backend, admin-panel, kiosk-app, kiosk-server/hardware) into `package.json`'s `start:all` concurrently runner script.

---

## Known Issues

| Issue | Severity | Status |
|-------|----------|--------|
| No automated tests | HIGH | In progress |
| No deployment automation | MEDIUM | In progress |
| Duplicate kiosk implementations | LOW | Consolidation pending |
| JWT secret is placeholder | MEDIUM | Needs rotation for production |

---

## Recommended Next Steps

### Immediate (High Priority)
1. **Write critical-path unit tests** — Auth, resident CRUD, request processing
2. **Consolidate kiosk apps** — Remove `src/app/features/kiosk/`, keep `projects/kiosk-app/`
3. **Manual QA pass** — Test all modules end-to-end with backend running

### Before Defense (Medium Priority)
4. **Create deployment script** — At minimum a `deploy.sh` or `start-production.ps1`
5. **Generate production JWT secret** — Replace placeholder value
6. **Update documentation** — Ensure all task files reflect actual implementation status

### Nice to Have (Low Priority)
7. **Bundle size optimization** — Kiosk-app exceeds 250kB budget

---

## Files Modified This Session

| File | Change |
|------|--------|
| `src/environments/environment.ts` | Created — Dev API URL config |
| `src/environments/environment.prod.ts` | Created — Prod API URL config |
| `projects/kiosk-app/src/environments/environment.prod.ts` | Created — Kiosk prod config |
| `angular.json` | Updated — fileReplacements for both apps |
| `src/app/core/services/auth.service.ts` | Updated — Uses environment.apiUrl |
| `src/app/core/services/api.service.ts` | Updated — Uses environment.apiUrl |
| `backend/src/controllers/resident.controller.js` | Updated — Audit logging added |
| `backend/src/controllers/request.controller.js` | Updated — Audit logging added |
| `backend/src/controllers/kiosk.controller.js` | Updated — Audit logging added |
| `backend/.env.example` | Updated — Fixed DB_NAME, added KIOSK_URL |
| `.gitignore` | Updated — Added graphify-out/ |
| `AGENTS.md` | Updated — Fixed broken doc references |
| Multiple frontend files | Updated — Removed dead code and unused imports |
| `docs/PROGRESS-REPORT.md` | Updated — Accurate task counts and status |
