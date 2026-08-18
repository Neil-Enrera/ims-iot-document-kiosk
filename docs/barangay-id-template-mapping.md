# Barangay ID Template — Placeholder Mappings

Reference for how the Barangay ID card template is filled from application data.
Documented against the **active** template file:

- `backend/uploads/templates/da4927dcbc4b31935f47f59b7e9cbd73.docx`
  (upload name: `Dummy_Barangay_ID_Reference_Style_Editable.docx`)
- Linked from `services.template_path` for the `Barangay ID` service (id 66).
- No explicit `document_mappings` are configured for this service, so resolution
  is 100% via the master placeholder library (`backend/src/services/placeholder.engine.js`)
  plus the generic application-form fallback.

## Data model at a glance

The Barangay ID application (`barangay_id_applications`) stores the applicant's
identity directly as columns and mirrors the same values into `form_data` (JSON).

| Application column (snake_case) | Kiosk form field (camelCase) | Notes |
|---|---|---|
| `first_name` | `firstName` | |
| `middle_name` | `middleName` | nullable |
| `last_name` | `lastName` | |
| `suffix` | `suffix` | nullable |
| `birth_date` | `birthDate` | |
| `gender` | `gender` | |
| `civil_status` | `civilStatus` | |
| `occupation` | `occupation` | nullable |
| `blood_type` | `bloodType` | |
| `address_line` | `addressLine` | free-text "Complete address" |
| `contact_number` | `contactNumber` | nullable |
| `email` | `email` | nullable |
| `emergency_contact_name` | `emergencyContactName` | |
| `emergency_contact_number` | `emergencyContactNumber` | |
| `photo` | `photo` | captured image file |
| `signature` | `signature` | captured image file |
| `id_number` | — | assigned at approval: `BRGY-YYYY-NNNNNN` |
| `id_issued_at` | — | assigned at approval |
| `id_expiration_date` | — | assigned at approval (issue + `id_validity_years`) |

## Template tag → mapping

| # | Tag in template | Library entry / alias | Resolved from | Status |
|---|---|---|---|---|
| 1 | `{{resident_photo}}` | `resident_photo` (barangay_id, future) | `application.photo` image file, embedded post-render by `id-card.service.js:embedPhoto` (sentinel token swap) | ✅ Embeds captured photo |
| 2 | `{{first_name}}` | `first_name` (resident) | `application.first_name` | ✅ |
| 3 | `{{middle_name}}` | `middle_name` (resident) | `application.middle_name` | ✅ (blank if none) |
| 4 | `{{surname}}` | alias of `last_name` | `application.last_name` | ✅ |
| 5 | `{{suffix}}` | `suffix` (resident) | `application.suffix` | ✅ (blank if none) |
| 6 | `{{address}}` | `address` (address) | `application.address_line` (falls back to barangay name/city/province) | ✅ |
| 7 | `{{place_of_birth}}` | alias of `birth_place` | `resident.birth_place` / `application.birth_place` — **no field captured** | ⚠️ renders blank |
| 8 | `{{date_of_birth}}` | alias of `birth_date` | `application.birth_date` | ✅ |
| 9 | `{{sex}}` | alias of `gender` | `application.gender` | ✅ |
| 10 | `{{civil_status}}` | `civil_status` (resident) | `application.civil_status` | ✅ |
| 11 | `{{id_number}}` | `id_number` (barangay_id) | `application.id_number` — set only at approval (`BRGY-YYYY-NNNNNN`); **blank on preview** | ✅ (approved cards) |
| 12 | `{{date_issued}}` | `date_issued` (document) | system date = generation/issue date | ✅ |
| 13 | `{{valid_until}}` | alias of `expiration_date` | `application.id_expiration_date` — set only at approval; **blank on preview** | ✅ (approved cards) |
| 14 | `{{full_name}}` | `full_name` (resident) | composed `first + middle + last + suffix` from application row | ✅ |
| 15 | `{{emergency_contact}}` | — (no entry) | no match — form field is `emergency_contact_name` | ⚠️ renders blank |
| 16 | `{{emergency_relationship}}` | — (no entry) | no data source exists in the application | ⚠️ renders blank |
| 17 | `{{emergency_number}}` | — (no entry) | no match — form field is `emergency_contact_number` | ⚠️ renders blank |
| 18 | `{{resident_since}}` | — (no entry) | no data source exists | ⚠️ renders blank |

## Gaps & recommendations

1. **`{{place_of_birth}}`** — the kiosk form and application row have no birth-place
   field. Either remove the tag from the template, or add a birth place field to
   the form (`residents.birth_place` already exists for backing).
2. **`{{emergency_contact}}`** — add `emergency_contact` as an alias of
   `emergency_contact_name` in the placeholder library, or change the template tag
   to `{{emergency_contact_name}}`.
3. **`{{emergency_number}}`** — same as above: alias `emergency_number` →
   `emergency_contact_number`, or rename the tag.
4. **`{{emergency_relationship}}`** — no relationship field is collected anywhere.
   Add a form field (e.g. Spouse/Parent/Sibling) or drop the tag.
5. **`{{resident_since}}`** — not collected. Could resolve from
   `application.created_at` (or `resident.created_at`) — add a `resident_since`
   placeholder to the library, or drop the tag.

## Preview vs approved card

- **Live preview** (`POST /kiosk/barangay-id/preview`,
  `id-card.service.js:applicationFromKioskPayload`) uses the same template and
  renderer, but `id_number` / `valid_until` / `date_issued` are blank because the
  ID number and expiry are only assigned at approval
  (`application.service.js:approveApplication` → `recordIdIssuance`).
- **Approved card** (`application.service.js:approveApplication` →
  `id-card.service.js:generateIdCard`) renders with the official ID number,
  issue date, and expiry, then persists the DOCX to `uploads/id-cards/` and links
  it via `id_card_path`.