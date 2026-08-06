# Document Template Placeholder Library

Every `{{placeholder}}` below is auto-filled during document generation. Resolution priority: explicit
service mapping -> master library -> application form field. Source legend: `resident` (resident record),
`application` (kiosk form / request), `system` (request + clock), `barangay` (barangay record).

Total: 62 placeholders.

## Resident Information

| Placeholder | Source | Description |
|---|---|---|
| `{{full_name}}` | resident | Resident's complete name (first, middle, last, suffix). |
| `{{first_name}}` | resident | Resident's first name. |
| `{{middle_name}}` | resident | Resident's middle name. |
| `{{last_name}}` | resident | Resident's last name. |
| `{{suffix}}` | resident | Name suffix (Jr., Sr., III). |
| `{{gender}}` | resident | Resident's gender. |
| `{{civil_status}}` | resident | Resident's civil status (Single, Married, etc.). |
| `{{birth_date}}` | resident | Resident's birth date. |
| `{{age}}` | resident | Resident's age computed from birth date. |
| `{{birth_place}}` | resident | Resident's place of birth. |
| `{{nationality}}` | resident | Resident's nationality. |
| `{{religion}}` | resident | Resident's religion. |
| `{{occupation}}` | resident | Resident's occupation. |
| `{{contact_number}}` | resident | Resident's contact number. |
| `{{email}}` | resident | Resident's email address. |
| `{{resident_code}}` | resident | Resident's system ID / resident code. |
| `{{blood_type}}` | resident | Resident's blood type. |

## Address Information

| Placeholder | Source | Description |
|---|---|---|
| `{{house_number}}` | resident | House or building number. |
| `{{street}}` | resident | Street name. |
| `{{purok_zone}}` | resident | Purok or zone number. |
| `{{sitio}}` | resident | Sitio name. |
| `{{barangay}}` | barangay | Barangay name. |
| `{{municipality}}` | barangay | Municipality or city. |
| `{{city}}` | barangay | City name. |
| `{{province}}` | barangay | Province name. |
| `{{zip_code}}` | barangay | ZIP / postal code. |
| `{{address}}` | resident | Resident's complete address (or barangay address as fallback). |

## Document Information

| Placeholder | Source | Description |
|---|---|---|
| `{{request_number}}` | system | Request tracking number. |
| `{{control_number}}` | system | Document control number (same as request number). |
| `{{document_type}}` | system | Service / document type name. |
| `{{purpose}}` | application | Purpose stated on the application. |
| `{{date_requested}}` | system | Date the request was filed. |
| `{{date_approved}}` | system | Date the request was approved / reviewed. |
| `{{date_issued}}` | system | Date the document was generated. |
| `{{expiration_date}}` | system | Document expiration / claim-window expiry. |
| `{{processing_officer}}` | system | Staff who processed the document. |
| `{{approving_official}}` | barangay | Official who signs/approves (e.g. Barangay Captain). |
| `{{official_position}}` | system | Position of the approving official. |
| `{{remarks}}` | application | Remarks on the request. |
| `{{qr_code}}` | system *(planned)* | QR code payload (planned). |
| `{{verification_code}}` | system *(planned)* | Document verification code (planned). |

## Barangay Information

| Placeholder | Source | Description |
|---|---|---|
| `{{barangay_name}}` | barangay | Name of the barangay. |
| `{{barangay_address}}` | barangay | Address of the barangay hall. |
| `{{barangay_contact_number}}` | barangay | Barangay contact number. |
| `{{barangay_email}}` | barangay | Barangay email address. |
| `{{barangay_captain}}` | barangay | Barangay captain name. |
| `{{barangay_secretary}}` | barangay | Barangay secretary name. |
| `{{barangay_treasurer}}` | barangay | Barangay treasurer name. |

## System Information

| Placeholder | Source | Description |
|---|---|---|
| `{{current_date}}` | system | Today's date (e.g. August 6, 2026). |
| `{{current_time}}` | system | Today's time (HH:MM). |
| `{{current_year}}` | system | Current year (e.g. 2026). |
| `{{current_month}}` | system | Current month name (e.g. August). |
| `{{day}}` | system | Day of the month (e.g. 6). |
| `{{month}}` | system | Month name (e.g. August). |
| `{{year}}` | system | Year (e.g. 2026). |
| `{{day_of_week}}` | system | Today's weekday (e.g. Thursday). |

## Barangay ID Information

| Placeholder | Source | Description |
|---|---|---|
| `{{id_number}}` | application | Barangay ID number (from the application form). |
| `{{id_issued}}` | system | ID issue date (same as date issued). |
| `{{id_expiration}}` | application | ID expiration date (from application). |
| `{{id_type}}` | system | Type of ID document. |
| `{{rfid_uid}}` | application *(planned)* | RFID tag UID (planned). |
| `{{resident_photo}}` | resident *(planned)* | Resident photo (image embedding planned). |

