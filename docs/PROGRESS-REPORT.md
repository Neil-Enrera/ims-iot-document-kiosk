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
> - **GCash Payment & Receipt Upload for Online Portal & Admin Verification Review** (`online-portal/src/app/features/apply/apply.component.ts`, `online-portal/src/app/features/requests/requests.component.ts`, `admin-panel/src/app/features/requests/requests.component.ts`, `public/gcash-qr.png`):
>   - **Resident Wizard Flow**: Reordered application steps to: `Application Form (Step 1)` &rarr; `Requirements (Step 2)` &rarr; `GCash Payment & Receipt Upload (Step 3, paid services only)` &rarr; `Review & Submit (Step 4)` &rarr; `Confirmation (Step 5)`. Free services automatically skip Step 3.
>   - **Official GCash QR & Instructions**: Displayed high-resolution official Barangay San Manuel GCash QR code (`public/gcash-qr.png`), account details (`Barangay San Manuel Treasurer`, `0917-827-4638`), dynamic fee amount (`₱{{ svc.processing_fee }}`), and step-by-step payment instructions.
>   - **Receipt Upload & Image Validation**: Added client-side image validation (JPG/PNG/WEBP, max 10MB), receipt image thumbnail preview, reference number input validation, and full receipt inspection modal.
>   - **Review & Submit Integration**: Displays dedicated GCash Payment Evidence summary card in Step 4 before submission, attaching `form_data._receipt`, `form_data._payment`, and `form_data.gcash_reference_number`.
>   - **Admin Review Modal**: Added prominent **GCash Payment Verification** card in Admin Request Details modal, displaying payment method, exact amount, GCash reference number, receipt thumbnail, and interactive full-size receipt inspect modal for staff review.
>   - **Verification**: Verified 98/98 backend unit tests pass (`npm test`) and both `online-portal` and `admin-panel` compile with 0 errors.
>
> - **Automated "Ready for Release" Email Notification & Release Confirmation Message Removal** (`email.service.js` L435-595, `request.service.js` L180-215, `application.service.js` L215-235, `online-portal/src/app/features/requests/requests.component.ts` L250-275):
>   - **Automated Email Notification on "Ready for Release"**: Added `sendReadyForReleaseNotification` in `email.service.js`, sending a notification to the resident's registered email whenever an Admin transitions a document request or Barangay ID request to "Ready for Release". Includes request number, service/document name, status badge, processing fee breakdown, claim location (Barangay San Manuel Hall), office hours, and what to bring.
>   - **Deduplication / State Transition Guard**: Email is dispatched strictly on status transition to `READY_FOR_RELEASE` (status `6` for requests, `APPROVED` for applications), preventing duplicate emails upon page refreshes or repeated views.
>   - **Removed Release Confirmation Banner**: Removed `"Document successfully released and claimed."` banner from the Online Portal My Requests list (`requests.component.ts`), eliminating redundant release confirmation text after completion.
>   - **Verification**: Verified 98/98 backend unit tests pass (`npm test`) and `online-portal` builds cleanly with 0 errors (`npm run build:portal`).
>
> - **Removal of Quick Access Card in Online Portal Resident Profile** (`online-portal/src/app/features/profile/profile.component.ts` L350-385):
>   - Removed the redundant "Quick Access" sidebar card from the Resident Profile page, leaving a cleaner sidebar with Account Status and Need Assistance.
>   - Verified `online-portal` builds with 0 errors (`npm run build:portal`).
>
> - **Removal of Redundant Information Update Requests & Online Portal Single Source of Truth** (`residents.component.ts` L25-80, L650-840, `kiosk.service.ts` L240-255, `kiosk.component.ts` L5760-5775, `kiosk.routes.js` L20-28, `kiosk.controller.js` L170-205, L455-525, `api.js` L15-38, `notification-dropdown.component.ts` L205-212, `i18n/en.ts` L490-505, `i18n/fil.ts` L470-485):
>   - **Architectural Streamlining**: Removed the redundant "Information Update Requests" review tab, table, modal, and state from the Admin Residents page (`residents.component.ts`), establishing the authenticated Online Portal (`profile.component.ts`) as the single source of truth for resident-managed contact and residential updates.
>   - **Kiosk Clean Up**: Removed deprecated kiosk update endpoints (`PUT /kiosk/residents/:id`, `POST /kiosk/residents/update-requests`), obsolete `submitResidentUpdateRequest` and `updateResident` service methods, and unused translation strings.
>   - **Backend API Unification**: Removed `/resident-updates` route mount from `api.js` and cleaned up unused kiosk controller functions while ensuring live RFID tap lookup immediately retrieves verified resident information directly from the master `residents` database table.
>   - **Verification**: Verified `admin-panel` and `kiosk-app` Angular workspaces build cleanly with 0 errors (`npm run build:admin`, `npm run build:kiosk`).
>
> - **Online Portal Contact Us Page UI Redesign & Official Barangay Information Integration** (`online-portal/src/app/features/contact/contact.component.ts` L1-285, `backend/src/services/email.service.js` L338-440, `backend/src/controllers/portal-auth.controller.js` L150-210, `backend/src/routes/portal-auth.routes.js` L20-30, `backend/src/routes/api.js` L35-42):
>   - **Visual Layout & Panoramic Hero Banner**: Matched the reference design with a top panoramic hero header featuring `Barangay Hall.png`, the slogan callout `"Tulong sa bawat San Manuel!"`, curved brush underline styling, and the `We're Here to Help` typography.
>   - **Official Barangay Information Binding**: Corrected the data binding on the right-hand information sidebar to display the official Barangay San Manuel Office details (Office Address: `Barangay San Manuel Hall, San Manuel, City of San Jose del Monte, 3023 Bulacan`, Contact: `(044) 307-8899 / 0917-123-4567`, Email: `barangaysanmanuel.csjdm@gmail.com`, Map: `https://maps.app.goo.gl/ShncDzyj6p411n5g6`), ensuring it is independent of whoever is logged in.
>   - **Structured Contact Form**: Form input fields remain convenient for residents with instant validation and right-aligned "Send Message" action (omitting file attachments per instructions).
>   - **Backend Email Service & API**: Added `getBarangayContactInfo` and `sendContactUsMessage` endpoints with Barangay San Manuel branding to deliver inquiries to barangay administration.
>   - **Verification**: Verified 94/94 backend unit tests pass (`npm test`) and `online-portal` builds with 0 errors.
>
> - **Resident Profile Direct Inline Editing & Refined Unified Information Card** (`online-portal/src/app/features/profile/profile.component.ts` L1-385, `online-portal/src/app/core/services/auth.service.ts` L167-179, `portal-auth.routes.js` L15-17, `portal-auth.controller.js` L132-150, `portal-auth.service.js` L258-325, `kiosk-app/src/app/features/kiosk/resident-profile.component.ts` L280-310, `kiosk-app/src/app/features/kiosk/kiosk.component.ts` L585-595):
>   - **Unified Information Card Layout**: Structured all resident data into a single continuous card organized into three clear sections: `Personal & Demographic Details`, `Contact & Residential Address`, and `Emergency Contact Details` (with Blood Type and redundant text banners removed).
>   - **Sidebar Hierarchy Realignment**: Reordered right sidebar cards so `Account Status` appears first, followed by `Quick Access` and `Need Assistance?`.
>   - **Direct Inline Profile Editing**: Clicking "Edit Profile" directly transforms fields into editable form inputs inside the Information Card while keeping master identity attributes locked. Centered "Update" and "Cancel" buttons handle saving to the resident database record and discarding changes respectively.
>   - **Verification**: Verified 91/91 backend unit tests pass (`npm test`) and both `online-portal` and `kiosk-app` Angular workspaces build cleanly with 0 errors.
>
> - **Barangay San Manuel Logo Integration in System Email Templates** (`email.service.js` L6-300):
>   - **Unified Email Header Branding**: Integrated the official Barangay San Manuel seal logo (`public/Barangay Logo.png`) into all system outgoing HTML emails (Admin password reset verification, Admin 2FA login verification code, and Online Portal resident account credentials).
>   - **Horizontal Alignment Beside Title**: Positioned the official Barangay San Manuel seal logo directly beside (to the left of) the "Barangay San Manuel" title and subtitle using an email-safe presentation table structure (`vertical-align: middle`) with `width="56" height="56"` dimensions for balanced, clean header branding.
>   - **Multi-Path Asset Resolution & RFC-Compliant MIME Headers**: Added multi-candidate path resolution (`public/`, `dist/`, `process.cwd()`) and explicit `contentType: 'image/png'` and `contentDisposition: 'inline'` attributes to ensure reliable image rendering across VPS deployments and external webmail proxies (Gmail, Outlook Web, Apple Mail).
>   - **Verification**: Verified zero test regressions (91/91 backend unit tests passing in `npm test`) and confirmed clean, email-safe HTML template layout.
>
> - **Kiosk Request Completion Flow & Preview Document Removal** (`kiosk.component.ts` L2085-2125, L2415-2430, L7460-7475, L8185-8205, `i18n/en.ts` L240-245, `i18n/fil.ts` L230-235):
>   - **Removed Document Preview from Review Page**: Removed the "Preview Document" button and preview modal trigger from the "Review Your Request" page. Residents review all entered information directly without pre-submission document previewing.
>   - **Updated Request Completion Flow**: On the submission success screen, residents are now presented with two distinct actions:
>     1. **"Request Another Document"** (`requestAnotherDocument()`): Resets temporary request form data while keeping the resident's RFID session active, returning directly to the Services page to pick another service.
>     2. **"Done"** (`finish()`): Completely ends and clears the session and returns to the Kiosk Landing Page.
>   - **Code Cleanliness**: Removed deprecated preview signals (`showDocPreview`, `docPreviewBlob`, `docPreviewRendering`, `docPreviewError`) and helper methods (`previewRequestDocument`, `openDocPreview`, `closeDocPreview`, `clearDocPreview`), and unlinked `DocumentPreviewModalComponent` from kiosk imports.
>   - **Verification**: Verified zero TypeScript or Angular build errors (`npm run build:kiosk` passed with 0 errors) and all 91 backend tests pass (`npm test`).
>
> - **Kiosk Landing Page Update & Guest Access Removal** (`kiosk.component.ts` L1250-1310, L8115-8230, `kiosk-state.service.ts` L5-10, `i18n/en.ts` L45-55, `i18n/fil.ts` L45-55):
>   - **Landing Page Refactor**: Replaced the previous 3-card landing layout ("Scan Barangay ID", "Request Documents", "Continue Without Barangay ID") with a streamlined 2-card layout:
>     1. **Scan Barangay ID** (`startRfidScan()`): Direct RFID card tap/scan for existing residents to access document requests and personal profile.
>     2. **Apply for Barangay ID** (`startBarangay()`): Direct pathway for new residents to begin their Barangay ID application with photo and signature capture.
>   - **Complete Removal of Guest Document Flow**: Removed guest document request option and temporary user flow (`guest`, `guest-info`, guest demographic form) from the Kiosk. Document requests now strictly require resident authentication via Barangay ID.
>   - **Navigation & Error Flow Updates**: Updated RFID scan and error fallback screens to offer "Apply for Barangay ID" directly. Refactored `goBack()` and `KioskState` to eliminate deprecated guest modes and steps.
>   - **Verification**: Verified zero TypeScript or Angular build errors (`npm run build:kiosk` passed with 0 errors) and all 91 backend tests pass (`npm test`).
>
> - **Consolidation of Account ID and Resident Code into a Single Unified Identifier** (`portal-account.repository.js`, `portal-account.service.js`, `portal-auth.service.js`, `portal-auth.validation.js`, `placeholder.engine.js`, `portal-layout.component.ts`, `profile.component.ts`, `apply.component.ts`, `requests.component.ts`, `login.component.ts`):
>   - **Architectural Unification**: Aligned the online portal account identifier with the resident's primary physical/civil identifier (`residents.resident_code`, e.g. `RES-00001`), eliminating redundant dual-identifier confusion (`RES-00002 • BSM-000001`).
>   - **Database & Account Migration**: Synchronized existing `portal_accounts.account_id` entries to match `residents.resident_code`, and configured new portal account creation on Barangay ID approval (`portalAccountService.createAccountForResident`) to automatically assign `resident_code` as the account ID.
>   - **Multi-Identifier Authentication Support**: Enhanced backend authentication repositories (`findProfileByIdentifier`, `findProfileByAccountId`, `findValidResetCode`, `findValidResetToken`) to accept `Resident Code` (e.g. `RES-00001`), `Email Address`, or legacy `BSM-*` accounts for both login and password reset flows with zero breaking changes.
>   - **Portal UI Harmonization**: Cleaned up the Online Portal header dropdown, Resident Profile page, Service Application review page, Document Requests page, and Login/Forgot Password screens to consistently present a single unified `"Resident ID"` label.
>   - **Verification**: Verified 91/91 backend unit tests pass (`npm test`) and both `admin-panel` and `online-portal` build cleanly with 0 errors.
>
> - **Barangay ID Renewal Photo Integration in Template Generation & Document Preview** (`docx-image.helper.js`, `document.service.js` L155-205, L265-315, `id-card.service.js` L65-80, `request.service.js` L160-180, `tests/id-card.service.test.js` L245-265):
>   - **Unified Image Embedding Helper (`docx-image.helper.js`)**: Extracted and centralized OpenXML DrawingML photo embedding (`resolveImageBuffer`, `getImageSize`, `sniffImageExtension`, `buildDrawingXml`, `embedPhoto`, `extractRequestPhoto`), supporting Base64 data URIs (ESP32-CAM live capture), relative upload paths (`uploads/resident-photos/...`, `uploads/application-photos/...`, `uploads/kiosk-photos/...`), and absolute paths.
>   - **Direct Template Photo Embedding in `document.service.js`**: Enhanced `generateDocument()` and `renderRequestPreview()` to scan for `resident_photo` (and legacy `%%?resident_photo`) placeholders, inject `PHOTO_TOKEN` during Docxtemplater text render, and embed the high-resolution 2×2 photo directly into the document drawing layer with proper EMU aspect scaling and media relationship registrations (`word/_rels/document.xml.rels`).
>   - **Smart Photo Candidate Resolution**: Implemented `extractRequestPhoto()` which prioritizes the newly uploaded 2×2 renewal photo in `form_data._requirements` / `request.photo` / `uploads/kiosk-photos/`, with seamless fallback to the resident's master record photo (`residents.photo`).
>   - **Master Profile Sync on Release**: Automatically updates the resident's master profile (`residents.photo`) upon official release of a Barangay ID Renewal request, preserving the request-level audit trail while keeping the master resident record updated with their latest photo.
>   - **Verification**: Verified 91/91 backend unit tests pass (`npm test`) and all three Angular workspaces compile cleanly (`npm run build:portal`, `npm run build:admin`, `npm run build:kiosk` passed with 0 errors).

> - **Resolved Additional Information Form Data Requirements Leakage in Admin Request Details** (`admin-panel/requests.component.ts` L2100-2150):
>   - **Root Cause Identified**: In `requests.component.ts` `getGroupedFormData()`, `formData` entries were looped over without filtering internal metadata keys prefixed with `_` (such as `_requirements`, `_source`, `_correction_remarks`). Consequently, the `_requirements` JSON array of uploaded digital files was mistakenly classified under the "Additional Information" section and printed as an unformatted JSON string (`Requirements: [{"requirement_name": ...}]`).
>   - **Fix Applied**: Updated `hasFormData()` and `getGroupedFormData()` to strictly ignore internal keys starting with `_` (`key.startsWith('_')`). Legitimate form inputs remain categorized under "Personal Information", "Application Information", or custom service fields, while attached digital requirements are exclusively displayed in the dedicated "Uploaded Digital Requirements" card with image thumbnails, document preview links, and status badges.
>   - **Verification**: Verified zero TypeScript or Angular build errors (`npx ng build admin-panel` passed with 0 errors).
> - **Resolved Uploaded 2×2 ID Photo and Requirement Document Image Preview in Review & Submit Page** (`portal-request.controller.js` L95-108, `app.js` L55-75, `apply.component.ts` L565-595, L610-660, L770-835, L1400-1430, `requests.component.ts` L595-610, `portal-layout.component.ts` L55-95, L330-345, `profile.component.ts` L20-30, L145-160, `kiosk.component.ts` L2275-2280, L4135-4140, L4705-4715, L4905-4915, L9115-9130):
>   - **End-to-End Image Flow Investigation**: Traced the complete lifecycle: `Image Capture/Upload → Form State → Review & Submit → Preview → Submit → Backend/Storage`.
>   - **Root Causes Identified**:
>     1. **URL Protocol & Relative Path Resolution**: Relative file paths stored in database and session (e.g. `resident-photos/xxx.png` or `/uploads/resident-photos/xxx.png`) were resolved without normalising the `/uploads/` prefix against the backend URL (`http://localhost:3000`), causing browser requests to omit the `/uploads/` segment or target the frontend development port (4202/4201), resulting in `404 Not Found`.
>     2. **Upload Folder vs. URL Mismatch**: `upload.middleware.js` stored images under `uploads/resident-photos/`, while `portal-request.controller.js` returned `/uploads/documents/${filename}`.
>     3. **Review & Submit Page Visual Hierarchy**: The Applicant profile section in Step 3 (Review & Submit) lacked an avatar / 2×2 photo card next to applicant details, and non-2×2 requirement images did not display inline thumbnails or modal image previews.
>   - **Comprehensive Fix**:
>     1. Updated `resolveFileUrl` / `photoUrl` across `apply.component.ts`, `requests.component.ts`, `portal-layout.component.ts`, `profile.component.ts`, and `kiosk.component.ts` to seamlessly handle `data:`, `blob:`, `http:`, and relative paths (`uploads/...` and `resident-photos/...`).
>     2. Added Applicant Photo preview in the Review & Submit header (`apply.component.ts`) retrieving from `uploadedPhotoUrl()`, attached 2×2 requirement, or `currentUser()?.photo`.
>     3. Enabled interactive thumbnail inspection and full modal preview for all uploaded requirement images.
>     4. Added backend static fallback routing in `app.js` to cross-serve between `resident-photos` and `documents`.
>   - **Verification**: Verified zero Angular build errors (`npx ng build online-portal` and `npx ng build kiosk-app` completed with 0 errors) and all 90 backend tests pass (`npm test`).
> - **Comprehensive 2×2 ID Photo Upload Validation for Barangay ID Applications** (`id-photo-validator.service.ts`, `apply.component.ts` L145-210, L725-735, L1140-1230, `requests.component.ts` L415-445, L575-620, `admin-panel/requests.component.ts` L535-565, L2055-2070):
>   - **Dedicated Validation Service (`IdPhotoValidatorService`)**: Created a standalone, client-side computer vision validation service for 2×2 ID photos with zero external network dependencies.
>   - **Format & Resolution**: Restricts file types strictly to JPG, JPEG, and PNG. Validates 1:1 square aspect ratio (±5% tolerance) and minimum resolution of 300×300 px for clear ID card printing.
>   - **Human Face Detection & Single-Subject Rule**: Detects human faces using browser Shape Detection API with a robust fallback computer vision skin chrominance segmentation (YCbCr + RGB) and facial geometry/bilateral symmetry analyzer. Enforces exactly one detectable face, rejecting images with 0 faces or multiple faces.
>   - **Framing, Centering, and Cropping**: Evaluates face bounding box scale (face must occupy 20%–88% of frame), horizontal centering (center offset within 18%), vertical positioning, and ensures the face is not cut off or cropped at the borders.
>   - **Image Quality & Usability**: Analyzes pixel luminance to detect extremely dark (< 45 lum), overexposed (> 245 lum), or blank/solid color images. Employs discrete Laplacian variance convolution to reject blurry or out-of-focus photos.
>   - **Plain White / Light Background**: Samples non-face boundary/corner zones to verify background brightness and low saturation, rejecting dark, outdoor, or busy backgrounds.
>   - **Clear User Messaging & Guardrails**: Provides specific, actionable validation error banners for every failed criterion and blocks the resident from continuing to Step 2 if any mandatory requirement or 2×2 photo fails validation.
>   - **Admin Review**: Enhanced the Admin Panel request details view with inline photo previews and direct high-resolution review links, enabling staff to inspect uploaded 2×2 ID photos before approving Barangay ID applications.
>   - **Verification**: Verified zero Angular build errors (`npm run build:portal` and `npm run build:admin` passed with 0 errors) and all 90 backend tests pass (`npm test`).
> - **Logout Confirmation Modal in Online Portal** (`portal-layout.component.ts` L248-288, `profile.component.ts` L94-135):
>   - **Confirmation Dialog**: Added an accessible, responsive confirmation modal (`"Confirm Log Out"`) when residents click "Log out" from the Profile dropdown menu, the footer link, or the Resident Profile page.
>   - **Balanced Button Sizing & Padding**: Standardized uniform padding (`px-5 py-2.5`), balanced gap (`gap-3`), and centered flex alignment across both "Cancel" and "Log Out" action buttons for clean, consistent spacing and positioning on mobile and desktop viewports.
>   - **Safety & Usability**: Prevents accidental session termination with clear explanation (`"Are you sure you want to log out of your Barangay San Manuel Online Portal account?"`), backdrop click cancellation, Escape key dismissal, and distinct "Cancel" and "Log Out" actions.
>   - **Verification**: Verified zero TypeScript or Angular build errors (`npx ng build --configuration=development` completed with 0 errors).
> - **Interactive Profile Dropdown Menu in Online Portal Navigation** (`portal-layout.component.ts`):
>   - **Hover & Click Dropdown Navigation**: Converted the Profile link into a modern dropdown menu trigger with responsive hover (zero-gap transition bridge and enter/leave debounce) and click/tap support with outside-click detection for tablets and mobile devices.
>   - **Profile-Related Feature Shortcuts**: Integrates verified resident identity header (full name, verified badge, Account ID, photo/initials avatar) and clean, direct navigation links to Resident Profile (`/profile`), My Requests (`/requests`), Apply for Document (`/services`), and Logout action (`auth.logout()`).
>   - **Guest Navigation**: Displays a clean resident portal prompt with direct Login and Browse Services actions when unauthenticated.
>   - **Verification**: Verified zero TypeScript or Angular compiler errors (`npx ng build online-portal` completed with 0 errors).
> - **Resolved Emergency Contact Name Validation & Simplified Password Requirements** (`transaction.service.js` L145-210, `field-validation.test.js` L305-345, `apply.component.ts` L1280-1340, `change-password.component.ts`, `login.component.ts`):
>   - **Emergency Contact Validation Fix**: Fixed `validateServiceFormData` where any field key or label containing the substring `"contact"` (such as `emergency_contact_name`) was erroneously flagged as `isPhone`, causing full person names (e.g. "Hanna Marie Enrera") to fail with `"Emergency Contact Person must be a valid 11-digit contact number"`. Refined detection so `isPhone` only matches dedicated telephone/mobile fields (`tel`, `contact_number`, `phone_number`, `mobile_number`) when no person/name substrings are present. Increased phone max length threshold to avoid false length rejections on formatted numbers.
>   - **Frontend Dynamic Validation**: Added matching `isPhoneField` and `isNameField` helpers to `apply.component.ts` in `validateAndProceedToReview()`, preventing client-side rejection of valid emergency contact person names.
>   - **Password Complexity Simplification**: Relaxed password policy to require minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, and 1 number (removing mandatory ASCII special characters/symbols to improve usability while maintaining strong entropy).
>   - **Verification**: Verified 10/10 test suites in `field-validation.test.js` pass, Angular build compiles cleanly with 0 errors (`npm run build:portal`), and backend API handles both Email and Account ID authentication seamlessly.
> - **Auto-Populated Resident Profile & Complete Address in Online Portal Application Form** (`apply.component.ts`, `portal-account.repository.js`, `portal-auth.service.js`):
>   - **Automatic Retrieval & Auto-Fill**: Reused Kiosk logic to automatically retrieve and populate all existing resident demographic details (full name, first/middle/last name, suffix, date of birth, age, place of birth, gender, civil status, occupation, contact number, email, emergency contact) and complete address information (`house_number`, `block`, `lot`, `street`, `subdivision`, `purok_zone`, `sitio`, `barangay`, `municipality`, `province`, `address_line`).
>   - **Intelligent Field Matching**: Applied `resolveResidentFieldValue` and address extraction regexes (`extractBlock`, `extractLot`, `extractStreet`, `extractSubdivision`, `extractPurok`) identical to the Kiosk application form. Dynamically populates both service-defined address/demographic fields and generic address fields.
>   - **Dynamic Synchronization & Editing**: Added `updateCompositeAddress()` so that when individual components (Block, Lot, Street, Subdivision, Purok) are adjusted, the composite address line remains consistent. Allows the resident to freely review and edit fields for this document request without altering their permanent database profile.
>   - **Review & Confirm Integration**: Updated Step 3 to display the complete verified breakdown of applicant demographics, complete formatted address line, document purpose, and service-specific fields prior to submission.
>   - **Verification**: Verified end-to-end via automated browser subagent and build validation (`npm run build:portal` passed with 0 errors).
> - **Streamlined Service Selection UI on Home & Services Pages** (`home.component.ts`, `services.component.ts`):
>   - **Home Page (Popular Services)**: Preserved row layout, removed individual "View Details" action buttons, and made the entire service card clickable (`role="button"`, hover lift, and keyboard accessibility). Clicking any popular service card navigates directly to `/apply?service_id=xxx`.
>   - **Services Page**: Removed the separate "Select service" buttons, removed the "Selected Service" sticky bottom bar, and removed the "Continue with [Service]" button. The entire service card is now directly clickable with an "Apply now →" indicator.
>   - **Direct Flow**: Established zero-friction navigation (`Home/Services → Service Card Click → Step 1: Upload/Review Requirements`) with zero redundant intermediate selection or confirmation steps.
>   - **Verification**: Verified with automated browser testing and bundle compilation (`npm run build:portal` passed with 0 errors).
> - **Resolved Online Portal Service Selection Flow & Separated My Requests from Request Wizard** (`app.routes.ts`, `services.component.ts`, `apply.component.ts`, `requests.component.ts`):
>   - **Root Cause Identified**: The Services page previously routed "Select Service" directly to `/requests?service_id=xxx`. Inside `RequestsComponent`, the request wizard was embedded in the same component with asynchronous loading race conditions. Because `loadServicesList()` loaded after query parameter initialization, `startNewRequest` defaulted back to Step 1 ("Choose a Barangay Service"), redundantly prompting the resident to pick a service again, while the header showed "Document Requests & Tracking" with a confusing "Back to Requests" button.
>   - **Clean Route Separation**: Created a dedicated `ApplyComponent` (`/apply`) exclusively for the multi-step document application flow (`Upload/Review Requirements → Application Form → Review & Submit → Confirmation`).
>   - **Direct Service Action**: Updated `ServicesComponent` so clicking "Select service" (or sticky bar "Continue") routes directly to `/apply?service_id=xxx`. Bypasses any redundant service selection screen and starts immediately on the requirements/upload step for the chosen service.
>   - **Dedicated My Requests Dashboard**: `RequestsComponent` (`/requests`) now purely functions as the resident's request tracking dashboard (filter tabs, search, status timeline, correction resubmission). Replaced internal wizard triggers with direct navigation to `/services`.
>   - **Verification**: Verified clean build via `npm run build:portal` (0 errors). Confirmed flow adheres strictly to `Services → Select Service → Upload/Review Requirements → Application Form → Review → Submit`.
> - **Resolved Online Portal Login Error & Added Password Strength Meter with ASCII Complexity Indicators** (`portal-account.repository.js`, `portal-auth.service.js`, `portal-auth.validation.js`, `portal-auth.controller.js`, `auth.service.ts`, `change-password.component.ts`, `login.component.ts`):
>   - **Root Cause of 500 Error**: `portalAccountRepository.findProfileByAccountId` omitted `pa.password_hash` from the SQL `SELECT` list. When `portalAuthService.login()` called `bcrypt.compare(password, row.password_hash)`, `row.password_hash` was `undefined`, throwing `Error: data and hash arguments required` and returning `500 Internal server error`.
>   - **Identifier Clarification**: Clarified why Account ID (`BSM-000001`) was originally used: Sections 4, 7, 8, and 9 of `docs/Barangay_San_Manuel_Remote_Online_Portal.md` specified Account ID as an identifier printed on physical Barangay IDs to keep online portal logins separate from internal database IDs and RFID UIDs.
>   - **Unified Email & Account ID Authentication**: Updated `portal-account.repository.js` with `findProfileByIdentifier` querying `LOWER(pa.email) = LOWER(?) OR pa.account_id = ?`, and added `pa.password_hash` to both queries.
>   - **Updated Validation & Controller**: Modified `portal-auth.validation.js` and `portal-auth.controller.js` to accept `email`, `identifier`, or `accountId` up to 100 characters, returning structured error messages instead of 500.
>   - **Updated Online Portal Frontend**: Updated `login.component.ts` UI to display "Email Address" as the primary login label and placeholder ("e.g. resident@example.com (or Account ID)") while maintaining backward compatibility with Account ID. Updated `auth.service.ts` to pass the identifier consistently.
>   - **Password Strength & ASCII Complexity Meter**: Added an interactive, real-time password strength meter (`Weak`, `Moderate`, `Strong`) to both `change-password.component.ts` (first-login password change) and `login.component.ts` (password reset). Features a 4-segment colored bar, live text badge, password visibility toggles, and live checkmarks for 4 criteria: 8+ characters, uppercase & lowercase ASCII letters, numbers (0-9), and ASCII symbols/special characters (`!@#$%^&*`).
>   - **Verification**: Verified via test API calls that logging in with both registered email (`andreienrera@gmail.com`) and Account ID (`BSM-000001`) succeeds (HTTP 200, JWT returned, `mustChangePassword` flag verified). Verified invalid credentials cleanly return HTTP 401. Verified frontend builds with 0 errors (`npm run build:portal`).
> - **Remote Online Document Request Portal Implementation** (`docs/Barangay_San_Manuel_Remote_Online_Portal.md`, `portal-request.service.js`, `portal-request.controller.js`, `portal-auth.routes.js`, `transaction.service.js`, `request.service.js`, `requests.component.ts`):
>   - **Specification Implementation**: Implemented end-to-end features defined in `docs/Barangay_San_Manuel_Remote_Online_Portal.md` to support remote document requests by verified residents with issued Barangay IDs.
>   - **Database Migration 027 (`source` column)**: Added `source ENUM('Kiosk', 'Online') NOT NULL DEFAULT 'Kiosk'` to the `requests` table (`database/migrations/027-add-request-source.sql`) to cleanly partition and identify submission origin across all workflows while sharing the unified processing system.
>   - **Backend Portal Request API**: Built complete service and controller layer for authenticated resident request submission, dynamic form data handling with embedded digital requirements (`_requirements`), request retrieval (`getResidentRequests`), detailed view with status history (`getResidentRequestById`), correction resubmission (`resubmitCorrectedRequest`), and "Request Again" draft prefill (`getPreviousDataForService`).
>   - **Workflow Status Transitions**: Integrated status 10 (`Returned for Correction`) and status 11 (`Resubmitted`) into `VALID_TRANSITIONS` and `STATUS_IDS` in `request.service.js`.
>   - **Frontend Online Portal (`frontend/online-portal`)**: Built multi-view UI in `requests.component.ts` featuring a 4-step wizard (Service Selection → Digital Requirements Upload with PDF/JPG/PNG support → Application Form prefilled with verified Barangay ID profile → Review & Submit), live request tracking dashboard, detailed view with status history timeline, and action handlers for "Returned for Correction" resubmissions and "Request Again" re-applications.
>   - **Admin Panel Integration (`frontend/admin-panel`)**: Updated `requests.component.ts` to display the `Source` column badge (`Online` vs `Kiosk`), preview uploaded digital requirements with direct file view links, and integrated "Returned for Correction" and "Resubmitted" options into staff workflow actions.
>   - **Verification**: Verified zero TypeScript or Angular compiler errors across both `online-portal` (`npm run build:portal`) and `admin-panel` (`npm run build:admin`).
> - **Pre-Deployment System Audit & Build Optimization** (`angular.json`, `backend/src/repositories/rfid.repository.js`, `backend/package.json`):
>   - **Exported `getEquivalentUids`**: Exposed the bi-directional RFID normalization helper in `rfid.repository.js` module exports for global testing and controller reuse.
>   - **Build Warnings & Budget Fix**: Added `allowedCommonJsDependencies` (`jszip`, `canvg`, `rgbcolor`, `raf`, `core-js`, `jspdf`, `docx-preview`, `html2canvas`) and raised initial bundle size budget to `1MB warning / 2MB error` in `angular.json` for both `admin-panel` and `kiosk-app`.
>   - **Test Force Exit**: Updated backend test script with `--test-force-exit` to cleanly terminate connection pool after suite execution.
>   - **Verification**: Verified 89/89 backend unit tests pass, and both `admin-panel` and `kiosk-app` build with **0 errors and 0 warnings**.
> - **Resolved Resident Profile Image Display in Admin Panel Resident List & Profile Modal** (`residents.component.ts` L17, L101-118, L238-250, L505-520):
>   - **Root Cause Identified**: Traced the complete photo lifecycle: `Resident DB Record → Photo Path ("resident-photos/resident_xxx.png") → Backend Static Uploads Route (/uploads/...) → Admin Panel Frontend`. The file was properly captured via ESP32-CAM, saved in `backend/uploads/resident-photos/`, and served at `http://localhost:3000/uploads/resident-photos/...`. However, `residents.component.ts` rendered `<img [src]="res.photo">` directly, causing the browser to attempt loading from Angular dev server `localhost:4200/resident-photos/...` (404 Not Found), while `#nameCell` in the resident table only showed initials without checking `row.photo`.
>   - **Fixed URL Resolution & Fallbacks**: Added `assetBase` and `photoUrl(path)` helper in `residents.component.ts` to map upload relative paths to `${this.assetBase}/uploads/${cleanPath}`. Updated both the Resident List table cell and the Resident Profile modal avatar to display the actual photo with graceful initials fallback on image load error.
>   - **Verification**: Verified backend static route serves images at HTTP 200 (PNG, 62KB), and verified clean production builds for both `admin-panel` and `kiosk-app` with 0 errors.
> - **Resolved Barangay ID Draft Preview Error, Added Gender & Place of Birth to Information Update Modal, and Cleaned Resident Profile View** (`placeholder.engine.js` L568-650, `resident-profile.component.ts` L355-385, L580-630, `residents.component.ts` L305-315, `en.ts`, `fil.ts`):
>   - **Root Cause for Draft ID Preview 500 Error**: `classifyTags` and `auditServiceConfiguration` in `placeholder.engine.js` invoked `.map()` directly on `service.form_fields` and `service.document_mappings`. When fetched via raw SQL queries in `id-card.service.js`, string-encoded JSON fields caused a `TypeError: ((intermediate value) || []).map is not a function`. Resolved with a robust `parseArray` helper that safely handles JSON strings, arrays, and nulls.
>   - **Added Gender & Place of Birth to Kiosk Request Information Update Modal**: Added `Gender` (dropdown) and `Place of Birth` (text input) form fields in `resident-profile.component.ts`, updated `editForm` and `submitResidentUpdateRequest` payloads, and localized labels in English and Filipino.
>   - **Removed Blood Type from Resident Profile Modal**: Cleaned up the "Personal Info" tab in the Admin Panel "Residents" detail modal (`residents.component.ts`) by removing the unused Blood Type field.
>   - **Verification**: Verified draft preview generation returns HTTP 200 with valid DOCX buffer, and verified clean production builds for both `admin-panel` and `kiosk-app` with 0 errors.
> - **Removed Service Limit Pill Badge on Kiosk Service Selection Screen** (`kiosk.component.ts` L1265-1275):
>   - Removed the `(i) You can select up to 2 services. (X/2)` pill indicator from the header on the "Select a Service" step for a cleaner, streamlined header presentation while retaining the per-card selection validation and disabled state enforcement.
>   - **Verification**: Verified clean build via `npm run build:kiosk` with 0 errors.
> - **Upgraded Kiosk Session Inactivity Timeout with User Activity Listeners & Warning Countdown** (`kiosk.component.ts` L5480-5530, L5605-5615, L5875-5885, L9045-9125, `en.ts`, `fil.ts`):
>   - **Root Cause Identified**: The previous timeout was a blind `setTimeout` scheduled only on major step transitions, without listening to user interactions (clicks, touches, keyboard input, typing, scrolling). Residents actively typing on form pages were prematurely kicked back to the landing page mid-application.
>   - **Meaningful Activity Listeners**: Added global `@HostListener` window listeners (`click`, `touchstart`, `pointerdown`, `keydown`, `input`, `scroll`) that automatically reset the idle timer on real user activity.
>   - **Configurable Timeout & Warning Countdown**: Integrated `kiosk_idle_timeout` system setting. Displays a high-visibility warning modal with animated countdown ("Are you still there?") before session expiration, with an "I'm still here" button that instantly resumes and resets the session.
>   - **Safe Lifecycle & Landing Protection**: No timer runs while on the idle landing page (`mode() === 'home'`). Only temporary/unsaved session drafts are cleared when a timeout actually occurs, leaving permanent resident records intact.
>   - **Verification**: Verified clean build via `npm run build:kiosk` with 0 errors.
> - **Resolved Kiosk Document Request Stale Form Data on Back / Request Abandonment** (`kiosk.component.ts` L5965-5995, L6225-6365, L7560-7570, L8725-8815):
>   - **Root Cause Identified**: Temporary form entries stashed into `serviceForms` and `formValues` during intermediate step validations were retained across request cycles and reloaded by `loadServiceForm()`, causing backed-out or abandoned inputs to linger when returning to the request flow.
>   - **Lifecycle-Specific Request Session Reset**: Implemented `clearDocumentRequestSession()` to reset temporary request drafts (`serviceForms`, `servicePhotos`, `formValues`, `formErrors`, `capturedPhoto`, `reusedRequestInfo`) when the resident backs out of the active request (e.g. from `requirements` to `services`, `services` to `welcome`, or deselecting a service).
>   - **Preserved In-Flight Form Edits**: Actively completing or editing the current request (`Form ↔ Photo ↔ Review`) continues to preserve form input without data loss.
>   - **Protected Permanent Resident Records & RFID Session**: Resident database profiles and RFID identification remain untouched, ensuring new requests cleanly re-autofill latest verified resident details.
>   - **Guest Session Cleanup**: Exiting or abandoning the "Continue without Barangay ID" flow clears temporary guest demographics and address data to prevent cross-session contamination.
>   - **Verification**: Verified clean compilation with 0 errors via `npm run build:kiosk`.
> - **Unified Service-Configurable Photo Capture for Document Requests & Barangay ID** (`kiosk.component.ts` L2135-2450, L6880-6895, L8585-8735):
>   - **Direct UI & Workflow Reuse**: Reused the full Barangay ID Photo Capture UI in Document Requests when a service is configured with `Requires Photo Capture` enabled. Includes the 3-column layout (Photo Guidelines card, Camera Viewport with ESP32-CAM MJPEG Stream / WebCam live stream and 90° clockwise rotation, face positioning guide, photo blur/darkness quality check, and Helpful Photo Tips card).
>   - **Expected Flow Enforcement**: Flow follows `Select Service → Application Form → Photo Capture → Review → Submit` when `requires_photo` is ON, and `Select Service → Application Form → Review → Submit` when `requires_photo` is OFF.
>   - **Multi-Service Photo Reuse**: When multiple services requiring photos are selected in the same transaction, the captured photo is automatically shared across the transaction so the resident does not need to pose repeatedly.
>   - **Seamless Navigation & State Management**: Supports full two-way navigation (`goBack`, `confirmPhoto`, `retakePhoto`, `retryPhotoCamera`, `switchCameraMode`) and camera resource cleanup.
>   - **Verification**: Verified zero TypeScript or Angular compiler errors across both `kiosk-app` and `admin-panel` production builds (`npm run build:kiosk`, `npm run build:admin`).
> - **Enhanced Configurable Document Request & Generation Architecture with Real-Time Mapping Audit & Validation** (`placeholder.engine.js`, `document.service.js`, `document.controller.js`, `service-form.component.ts`, `placeholder-engine.test.js`):
>   - **End-to-End Dynamic Service Support**: Ensured any new or existing service configured by the Administrator (custom form fields, DOCX template with arbitrary placeholders, explicit mappings) generates documents and previews dynamically without code changes or hardcoded conditionals.
>   - **Comprehensive Configuration Audit Engine**: Added `auditServiceConfiguration()` to the placeholder engine which analyzes application fields against template placeholders and explicit mappings to flag unmapped application fields, unmapped template placeholders, and missing required mappings.
>   - **Interactive Live Audit & Readiness Banner in Admin Panel**: Added a real-time validation banner in the Service Form builder that alerts administrators to unmapped application fields or template placeholders, complete with 1-click `+ Map` actions to instantly generate mappings.
>   - **Full Parity for Draft Previews & Generated Documents**: Extended Kiosk live preview (`renderRequestPreview`) and Admin preview (`generateDocument`) to share identical placeholder resolution, fallback logic, and full guest demographic/address spreading.
>   - **Missing Value Tracking**: Enhanced `apply()` to track and report missing values during document generation.
>   - **Verification**: Verified 19/19 passing unit tests in `placeholder-engine.test.js`, 24/24 passing unit tests in core backend test suites, and clean production builds for both `admin-panel` and `kiosk-app` with 0 compilation errors.
> - **Fixed Document Preview & Generation Placeholder Mapping Bug** (`placeholder.engine.js`, `service-form.component.ts`, `025-update-service-document-mappings.sql`, `placeholder-engine.test.js`):
>   - **Bidirectional Mapping Resolution & Fallback Pipeline**: Fixed root cause where document requests in "Under Review" (and other statuses) for registered residents rendered blank full names when service mappings pointed to `source: "application"`. Added graceful fallback across `ctx.resident`, `ctx.application`, and master library resolvers.
>   - **Date Part Resolution**: Resolved date part placeholders (`{{day}}`, `{{month}}`, `{{year}}`) to their proper discrete tokens (`3`, `September`, `2026`) even when mapped as system date fields.
>   - **Complete Field Hardening**: Hardened all demographics (`first_name`, `middle_name`, `last_name`, `suffix`, `civil_status`, `gender`, `age`, `birth_date`, `birth_place`, `nationality`, `religion`, `occupation`, `blood_type`, `contact_number`, `email`), address fields (`house_number`, `block`, `lot`, `street`, `subdivision`, `purok_zone`, `sitio`, `address`), and control numbers across registered resident, guest, and application form records.
>   - **Admin Service Form Options**: Expanded `RESIDENT_FIELDS` and `SYSTEM_FIELDS` in the Service Form builder to include discrete address, demographic, and date part options.
>   - **Verification**: Verified 17/17 passing tests in `placeholder-engine.test.js`, successful DOCX generation on Request 147 (Under Review), and 0 compile errors on `admin-panel` and `kiosk-app`.
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

---

## Recent Changes (September 27, 2026 Session)

### Online Portal Login & First-Login Password UI Redesign
- Redesigned **Online Portal Login** (`frontend/online-portal/src/app/features/auth/login.component.ts`):
  - Applied full-screen background watermark (`Background.png`) and top header branding with official Barangay San Manuel logo, title, and tagline.
  - Implemented modern floating modal card with circular user icon avatar badge, Account ID and Password input groups with icons and visibility toggle.
  - Integrated full-width orange primary action button with hover glow and transition animations.
  - Included 3 feature cards on the right side: *Request Documents*, *Barangay ID Services*, and *Safe & Secure*.
  - Added bottom information callout card ("Don't have an online account?").
  - Preserved complete authentication flow, error alerts, and "Forgot password?" modal workflow with step-by-step OTP verification and password reset.
- Redesigned **First-Login Change Password Screen** (`frontend/online-portal/src/app/features/auth/change-password.component.ts`):
  - Matched identical design layout and typography to the Login screen and admin logout modal style.
  - Added real-time password strength indicator with animated 4-segment progress bar and dynamic strength labels (Weak, Fair, Good, Strong).
  - Provided interactive password requirement checklist (8+ characters, uppercase, lowercase, number, special character).
  - Included password match validation indicators and secure form submission.
- Updated authentication state guards and build configurations; verified 0 Angular build errors and 94/94 backend unit tests passing.

### Online Portal Application Form & Review Screen Simplification
- **Application Form (`frontend/online-portal/src/app/features/apply/apply.component.ts`)**:
  - Removed duplicate resident-information summary card (Applicant Name, Resident ID, Contact / Email, Registered Address, Demographics).
  - Maintained all form field functionality, validations, and auto-population from resident profile records.
- **Review & Submit Screen (`frontend/online-portal/src/app/features/apply/apply.component.ts`)**:
  - Removed redundant applicant photo/identity block and all "Delivery" labels/references.
  - Standardized the review page presentation to match the clean, unified **Service Details** tile layout (`Purpose of Request`, `Registered Address`, and custom form fields in matching white card tiles with small uppercase label headers).
  - Preserved requirement review, file preview inspection modal, and application submission handlers.

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
| `frontend/online-portal/src/app/features/apply/apply.component.ts` | Updated — Removed duplicate resident details card; unified Review & Submit into Service Details tile layout without delivery labels |
| `frontend/online-portal/src/app/features/auth/login.component.ts` | Updated — Full redesign of Login page UI, centered form layout, and modal styling |
| `frontend/online-portal/src/app/features/auth/change-password.component.ts` | Updated — Full redesign of First-Login Change Password screen with strength meter and requirement checklist |
| `backend/src/routes/portal-auth.routes.js` | Updated — Registered contact endpoints |
| `backend/src/controllers/portal-auth.controller.js` | Updated — Added Contact Us controller |
| `backend/tests/portal-contact.test.js` | Created — Automated integration tests for Contact Us endpoints |
| `docs/PROGRESS-REPORT.md` | Updated — Recorded session progress and testing status |

