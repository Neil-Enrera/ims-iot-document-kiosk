# Barangay San Manuel Remote Online Document Request Portal

## 1. Overview

The existing Information Management System with IoT-Assisted Document Request Services Using Kiosk will be extended with a **Remote Online Document Request Portal**.

The online portal will allow verified Barangay San Manuel residents to request documents remotely without personally using the kiosk for every transaction.

The kiosk and online portal will use the same resident records and request-processing system. Requests from both channels will be processed through the same Admin Portal.

## 2. Access Channels

### Kiosk Access

`RFID / Barangay ID → Identify Resident → Select Service → Requirements → Application Form → Review → Submit → Request Number`

### Online Portal Access

`Login → Resident Dashboard → Services → Select Service → Upload Requirements → Application Form → Review → Submit → Request Number`

## 3. Online Account Eligibility

Online portal access will not use unrestricted public registration.

A resident must first visit Barangay San Manuel and undergo the Barangay ID application and verification process.

**Account eligibility:**
1. Resident applies for a Barangay ID.
2. Barangay staff verifies the resident.
3. Barangay ID application is approved.
4. Barangay ID is issued.
5. The system creates the resident's online portal account.
6. The system sends the account credentials to the email address provided during the Barangay ID application.

Therefore:

- No verified Barangay ID → No online portal account
- Verified Barangay ID → Eligible for online portal account

The online account should be generated only after the Barangay ID application has been approved and the Barangay ID has been issued.

## 4. Automatic Online Account Generation

After successful Barangay ID approval and issuance, the system automatically generates an online portal account.

The account includes:
- Account ID
- Temporary password
- Resident record association
- Registered email address
- Account status

Example:

```text
Account ID: BSM-000001
Temporary Password: K7mP9xQ2
Email: resident@example.com
```

The Account ID must be unique.

Suggested format:

```text
BSM-000001
BSM-000002
BSM-000003
```

The exact format can be configured by the system.

## 5. Temporary Password and First Login

The system generates a random temporary password when the account is created.

The temporary password is sent to the resident's registered email address.

The resident must change the temporary password after the first successful login.

```text
Resident receives email
        ↓
Login using Account ID + temporary password
        ↓
System detects temporary password
        ↓
System requires password change
        ↓
Resident creates new password
        ↓
Online portal becomes accessible
```

Passwords must not be stored as plain text. They should be securely hashed.

## 6. Email Notification

After account creation, the system sends an email to the email address provided during the Barangay ID application.

The email should contain:
- Account ID
- Temporary password
- Instruction to change the temporary password
- Online portal access information

Sample:

> **Subject: Barangay San Manuel Online Portal Account**
>
> Your Barangay San Manuel Online Portal account has been created.
>
> **Account ID:** BSM-000001  
> **Temporary Password:** K7mP9xQ2
>
> For security purposes, you are required to change your temporary password when you first log in.

## 7. Account and Resident Record Relationship

The online account must be connected to the existing resident record.

```text
Resident Record
├── Resident ID
├── Barangay ID Number
├── Account ID
├── RFID UID
├── Full Name
├── Date of Birth
├── Address
├── Contact Information
└── Email Address
```

Keep these identifiers separate:

| Identifier | Purpose |
|---|---|
| Resident ID | Internal database identifier |
| Barangay ID Number | Physical Barangay ID identification |
| Account ID | Online portal account identification |
| RFID UID | RFID/kiosk authentication |

The RFID UID should not be used as the online Account ID.

## 8. Account ID on Barangay ID

The generated Account ID may also be included on the physical Barangay ID.

Example:

```text
BARANGAY SAN MANUEL

[PHOTO]

JUAN DELA CRUZ
Resident

Account ID: BSM-000001
```

The Account ID is the online portal identifier while remaining separate from the RFID UID and internal Resident ID.

## 9. Online Portal Login

The portal will provide a dedicated login page.

Fields:
- Account ID
- Password

Options:
- Login
- Forgot Password

There should be no unrestricted self-registration if account eligibility is based on verified Barangay ID issuance.

Suggested message:

> Don't have an online account? Visit Barangay San Manuel to apply for a Barangay ID and activate your online portal account.

## 10. Resident Dashboard

After login, the resident is redirected to the Resident Dashboard.

The dashboard may provide:
- Resident information
- Current requests
- Recent transactions
- Request status
- Quick access to services

## 11. Online Portal Navigation

Navbar:
- Home
- Services
- My Requests / Transactions
- Contact Us
- Profile
- Logout

## 12. Services

The **Services** section is the primary area for online document requests.

Example services:
- Barangay Clearance
- Certificate of Indigency
- Barangay ID
- Business Permit
- Other services configured by the barangay

Available services should be configurable.

## 13. Online Document Request Flow

```text
Services
    ↓
Select Service
    ↓
View Requirements
    ↓
Upload Requirements
    ↓
Fill / Confirm Application Form
    ↓
Review Application
    ↓
Submit Request
    ↓
Generate Request Number
```

## 14. Digital Requirement Upload

For online requests, residents submit required documents by uploading digital files.

Example:

```text
Requirements

Valid Barangay ID
[ Upload File ]

Proof of Residency
[ Upload File ]

Other Requirement
[ Upload File ]
```

The barangay should be able to configure requirements and accepted file types per service.

Possible file types:
- PDF
- JPG
- JPEG
- PNG

File-size limits should also be configurable.

## 15. Requirement Verification

Uploading a requirement does not automatically approve it. Authorized barangay staff must review submitted files.

```text
Resident uploads requirement
            ↓
Request submitted
            ↓
Admin reviews uploaded files
            ↓
      Requirement valid?
        /          \
      Yes           No
       ↓             ↓
Continue         Return for Correction
       ↓             ↓
Process Request   Resident uploads replacement
```

## 16. Online and Kiosk Request Integration

Online and kiosk requests should use the same request-management system.

Example:

| Request Number | Resident | Service | Source | Status |
|---|---|---|---|---|
| BR-2026-001 | Juan Dela Cruz | Clearance | Kiosk | Under Review |
| BR-2026-002 | Maria Santos | Indigency | Online | Submitted |

Possible sources:
- Kiosk
- Online

The source identifies how the request was submitted; both use the same administrative workflow.

## 17. Admin Processing

Online requests appear in the existing Admin Portal under **Requests**.

Authorized staff can view:
- Resident information
- Application details
- Request number
- Uploaded requirements
- Upload dates
- Requirement status

The administrator can then process the request using the existing workflow.

## 18. Request Status

Possible statuses:
- Submitted
- Under Review
- Approved
- Document Generated
- Ready for Release
- Released
- Rejected
- Cancelled
- Returned for Correction

Residents can view the current status through **My Requests / Transactions**.

## 19. Returned for Correction

If a requirement or application is incomplete or invalid, the administrator can return the request for correction.

The resident can:
1. Log in.
2. Open the affected request.
3. View the correction instruction.
4. Replace or update the required information/file.
5. Resubmit the existing request.

The corrected request retains its original request number.

## 20. Request Again

The existing RFID-based **Request Again** concept remains applicable to verified residents.

```text
RFID / Resident Login
        ↓
Identify Resident
        ↓
Select Service
        ↓
Previous Transactions
        ↓
Request Again
        ↓
Reuse Previous Data
        ↓
Review / Update
        ↓
Submit New Request
        ↓
Generate New Request Number
```

Previous application data can be reused as an editable draft.

The old transaction remains unchanged and the new request receives a new request number.

## 21. Unified Resident Record

```text
                    RESIDENT RECORD
                          |
          +---------------+---------------+
          |               |               |
      BARANGAY ID       RFID          ONLINE ACCOUNT
          |               |               |
       Physical        Kiosk          Web Portal
       Identity        Access           Login
          |               |               |
          +---------------+---------------+
                          |
                  DOCUMENT REQUESTS
                          |
                 +--------+--------+
                 |                 |
               KIOSK             ONLINE
                 |                 |
                 +--------+--------+
                          |
                    ADMIN PORTAL
                          |
                 Request Processing
                          |
                 Document Generation
                          |
                  Ready for Release
```

Both access channels operate on the same resident and transaction data.

## 22. Complete Account Lifecycle

```text
Resident applies for Barangay ID
            ↓
Barangay verifies resident
            ↓
Barangay ID application approved
            ↓
Barangay ID issued
            ↓
System generates Account ID
            ↓
System generates temporary password
            ↓
System associates account with resident record
            ↓
System sends email credentials
            ↓
Resident logs in
            ↓
Resident changes temporary password
            ↓
Online portal access enabled
```

## 23. Core Concept

> **A Remote Online Document Request Portal that allows verified Barangay San Manuel residents with an issued Barangay ID to access their resident account, submit document requests remotely, upload digital requirements, monitor request status, and receive administrative processing through the same centralized system used by the barangay kiosk.**

The kiosk and online portal are two access channels connected to one centralized resident, transaction, and document-processing system.
