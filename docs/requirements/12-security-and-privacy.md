# 12. Security and Privacy

## 1. Purpose

Security and privacy are fundamental components of the Information Management System with IoT-Assisted Document Request Services Kiosk. The system manages confidential resident information, official barangay records, and user accounts; therefore, appropriate security measures are implemented to protect data from unauthorized access, modification, and disclosure.

The system also considers the principles of the Philippine Data Privacy Act of 2012 (Republic Act No. 10173) to ensure the responsible handling of personal information.

---

# 2. Security Objectives

The system is designed to achieve the following security objectives:

- Protect resident and employee information from unauthorized access.
- Ensure data accuracy and integrity throughout the document request process.
- Prevent unauthorized modification or deletion of records.
- Maintain accountability by recording significant user activities.
- Reduce security risks through authentication and authorization mechanisms.

---

# 3. User Authentication

Only authorized barangay personnel are permitted to access the administrative functions of the system.

Authentication is performed using a username and password before granting access to the dashboard.

### Features

- Username and password login
- Secure password storage using hashing
- Session management after successful login
- Automatic logout after inactivity (future enhancement)

---

# 4. Role-Based Access Control (RBAC)

The system uses Role-Based Access Control to restrict system functions based on user responsibilities.

| Role | Responsibilities |
|------|------------------|
| Administrator | Full system management, user management, reports, and system configuration. |
| Barangay Secretary | Manage resident records, review and process document requests. |
| Treasurer | Record cash payments and verify payment information. |
| Barangay Captain / Authorized Kagawad | Approve or reject document requests. |

This approach ensures that users can only access the features necessary for their assigned responsibilities.

---

# 5. Password Security

Passwords are never stored in plain text.

The system applies secure password hashing before storing user credentials in the database.

Recommended implementation:

- bcrypt password hashing
- Strong password requirements
- Password verification during login

---

# 6. Resident Data Protection

The system stores only information necessary for providing barangay services.

Resident information includes:

- Full Name
- Address
- Contact Number
- Date of Birth
- Civil Status
- RFID Information
- Resident Photograph

Access to this information is limited to authorized personnel based on their assigned role.

---

# 7. RFID Security

Each RFID card contains only a unique identifier (UID).

Personal information is **not** stored directly on the RFID card. Instead, the UID is used to retrieve the resident's information securely from the database.

This minimizes the risk of exposing sensitive information if an RFID card is lost or stolen.

---

# 8. Audit Logging

The system records significant user activities to improve accountability and support administrative monitoring.

Examples of recorded activities include:

- User login
- Resident registration
- Resident profile updates
- Document request submission
- Request approval or rejection
- Payment recording
- Document release
- User account management

Each audit log includes:

- User
- Action performed
- Date and time
- Module affected

---

# 9. Secure Communication

Communication between the frontend application and the backend server should be protected using secure communication protocols.

Recommended security measures include:

- HTTPS for data transmission
- Secure REST API endpoints
- Server-side input validation
- Prepared SQL statements to prevent SQL Injection

---

# 10. Input Validation

The system validates all user input before processing and storing information.

Validation includes:

- Required field validation
- Data type validation
- Input length restrictions
- Email and contact number format validation
- Prevention of malicious input

These measures reduce the risk of invalid data and common web application attacks.

---

# 11. Data Backup and Recovery

Regular database backups should be performed to prevent data loss caused by hardware failure, accidental deletion, or system malfunction.

Recommended backup practices include:

- Scheduled database backups
- Secure backup storage
- Periodic restoration testing
- Restricted backup access

---

# 12. Privacy Compliance

The proposed system follows the principles of the Philippine Data Privacy Act of 2012 (Republic Act No. 10173) by:

- Collecting only necessary personal information.
- Using resident information solely for barangay service transactions.
- Restricting access to authorized personnel.
- Protecting stored personal data from unauthorized disclosure.
- Maintaining accurate and updated resident records.

---

# 13. Future Security Enhancements

Future versions of the system may include additional security features such as:

- Two-Factor Authentication (2FA)
- Biometric authentication
- QR code verification
- Encrypted database backups
- Automated security monitoring
- SMS or email notifications for account activities

---

# 14. Summary

The Information Management System incorporates multiple security and privacy measures to protect resident information, secure system access, and maintain the integrity of barangay records. Through authentication, role-based access control, password hashing, audit logging, and compliance with the Data Privacy Act of 2012, the system provides a secure environment for managing document request services while supporting future security enhancements.